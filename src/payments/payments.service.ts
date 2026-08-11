// payments.service.ts
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from './entities/payment.entity';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { error } from 'console';
import { Student } from 'src/students/entities/student.entity';
import { RefundPaymentDto } from './dto/refund-payment.dto';
import { DeletedPayment } from './entities/deleted-payment.entity';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    @InjectRepository(Student)
    private studentRepository: Repository<Student>, // 👈
    @InjectRepository(DeletedPayment)
    private deletedPaymentRepository: Repository<DeletedPayment>,
  ) {}

  async create(dto: CreatePaymentDto) {
    const payment = this.paymentRepository.create({
      amount: dto.amount,
      method: dto.method,
      comment: dto.comment,
      student: { id: dto.studentId },
      group: dto.groupId ? { id: dto.groupId } : null,
    });
    return this.paymentRepository.save(payment);
  }

  async findByStudent(studentId: string) {
    return this.paymentRepository.find({
      where: { student: { id: studentId } },
      relations: ['student', 'group'], // 👈 Group relation-ni ham qo'shdik
      order: { createdAt: 'DESC' },
    });
  }

  async findAll(ownerId: string) {
    const payments = await this.paymentRepository
      .createQueryBuilder('payment')
      .select('payment.id', 'id')
      .addSelect('payment.amount', 'amount')
      .addSelect('payment.method', 'method')
      .addSelect('payment.comment', 'comment')
      .addSelect('payment.createdAt', 'createdAt')
      .leftJoinAndSelect('payment.student', 'student')
      .leftJoin('student.group', 'group')
      .leftJoin('group.teacher', 'teacher')
      .where('(teacher.ownerId = :ownerId OR teacher.id = :ownerId)', {
        ownerId,
      })
      .orderBy('payment.createdAt', 'DESC')
      .getRawMany();

    // Deduplikatsiya
    const seen = new Set<string>();
    return payments.filter((p) => {
      if (seen.has(p.id)) return false;
      seen.add(p.id);
      return true;
    });
  }
async refund(paymentId: string, reason: string, deletedBy: string) {
  const original = await this.paymentRepository.findOne({
    where: { id: paymentId },
    relations: ['student'],
  });

  if (!original) throw new NotFoundException("To'lov topilmadi");
  if (Number(original.amount) < 0) throw new BadRequestException("Qaytarish to'lovini qaytarib bo'lmaydi");

  // Arxivga yoz
  const archived = this.deletedPaymentRepository.create({
    originalPaymentId: original.id,
    studentId: original.student.id,
    studentName: `${original.student.stfirstName} ${original.student.stlastName}`,
    amount: original.amount,
    method: original.method,
    originalComment: original.comment,
    refundReason: reason,
    deletedBy,
  });
  await this.deletedPaymentRepository.save(archived);

  // To'lovni o'chir
  await this.paymentRepository.remove(original);

  return { message: "To'lov qaytarildi va arxivga saqlandi" };
}

  async remove(id: string) {
    const payment = await this.paymentRepository.findOne({ where: { id } });
    if (!payment) throw new NotFoundException('Платёж не найден');
    await this.paymentRepository.remove(payment);
    return { message: 'Платёж удалён' };
  }
}
