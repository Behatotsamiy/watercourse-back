import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Payment } from './entities/payment.entity';
import { Student } from 'src/students/entities/student.entity';
import { DeletedPayment } from './entities/deleted-payment.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Payment, Student, DeletedPayment])],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
