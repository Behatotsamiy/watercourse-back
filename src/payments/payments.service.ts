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

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    @InjectRepository(Student)
    private studentRepository: Repository<Student>, // 👈
  ) {}

  async create(dto: CreatePaymentDto, studentId: string) {
    const student = await this.studentRepository.findOne({
      where: { id: dto.studentId },
    });
    if (!student) throw new NotFoundException('Студент не найден');

    const payment = this.paymentRepository.create({
      amount: dto.amount,
      method: dto.method,
      comment: dto.comment,
      student: { id: dto.studentId },
    });
    return this.paymentRepository.save(payment);
  }

  async findByStudent(studentId: string) {
    return this.paymentRepository.find({
      where: { student: { id: studentId } },
      relations: ['student'],
      order: { createdAt: 'DESC' },
    });
  }

  async findAll() {
    return this.paymentRepository.find({
      relations: ['student'],
      order: { createdAt: 'DESC' },
    });
  }

  async remove(id: string) {
    const payment = await this.paymentRepository.findOne({ where: { id } });
    if (!payment) throw new NotFoundException('Платёж не найден');
    await this.paymentRepository.remove(payment);
    return { message: 'Платёж удалён' };
  }
}
