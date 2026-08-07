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
  return this.paymentRepository
    .createQueryBuilder('payment')
    .leftJoinAndSelect('payment.student', 'student')
    .leftJoinAndSelect('payment.group', 'group') // 👈 Guruh ma'lumotlarini ham olamiz
    .leftJoin('student.group', 'group')
    .leftJoin('group.teacher', 'teacher')
    .where('teacher.ownerId = :ownerId OR teacher.id = :ownerId', { ownerId })
    .orderBy('payment.createdAt', 'DESC')
    .getMany();
}
async refund(dto: RefundPaymentDto) {
    // 1. Asl to'lovni guruh relation'i bilan birga topamiz
    const originalPayment = await this.paymentRepository.findOne({
      where: { id: dto.paymentId, student: { id: dto.studentId } },
      relations: ['group'],
    });

    if (!originalPayment) {
      throw new NotFoundException("To'lov topilmadi");
    }

    if (originalPayment.amount <= 0) {
      throw new BadRequestException("Ushbu to'lov bo'yicha qaytaruvni amalga oshirib bo'lmaydi");
    }

    // 2. Asl to'lov qaysi guruhga tegishli bo'lsa, refund to'lovi ham o'sha guruhga birktiriladi
    const refundPayment = this.paymentRepository.create({
      student: { id: dto.studentId },
      group: originalPayment.group ? { id: originalPayment.group.id } : null,
      amount: -Math.abs(originalPayment.amount),
      method: originalPayment.method,
      comment: `Возврат: ${dto.reason}`,
    });

    return await this.paymentRepository.save(refundPayment);
  }

  async remove(id: string) {
    const payment = await this.paymentRepository.findOne({ where: { id } });
    if (!payment) throw new NotFoundException('Платёж не найден');
    await this.paymentRepository.remove(payment);
    return { message: 'Платёж удалён' };
  }
}
