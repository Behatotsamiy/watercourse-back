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

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    @InjectRepository(Student)
    private studentRepository: Repository<Student>, // 👈
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
    .where('(teacher.ownerId = :ownerId OR teacher.id = :ownerId)', { ownerId })
    .orderBy('payment.createdAt', 'DESC')
    .getRawMany();

  // Deduplikatsiya
  const seen = new Set<string>();
  return payments.filter(p => {
    if (seen.has(p.id)) return false;
    seen.add(p.id);
    return true;
  });
}
async refund(paymentId: string, reason: string) {
  const original = await this.paymentRepository.findOne({
    where: { id: paymentId },
    relations: ['student'],
  });

  if (!original) throw new NotFoundException("To'lov topilmadi");
  if (Number(original.amount) < 0) throw new BadRequestException("Bu to'lov allaqachon qaytarilgan");

  const refund = this.paymentRepository.create({
    student: { id: original.student.id },
    amount: -Math.abs(Number(original.amount)),
    method: original.method,
    comment: `Qaytarish: ${reason} (asl to'lov: ${paymentId})`,
  });

  return this.paymentRepository.save(refund);
}

  async remove(id: string) {
    const payment = await this.paymentRepository.findOne({ where: { id } });
    if (!payment) throw new NotFoundException('Платёж не найден');
    await this.paymentRepository.remove(payment);
    return { message: 'Платёж удалён' };
  }
}
