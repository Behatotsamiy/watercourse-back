import { Module } from '@nestjs/common';
import { ReportService } from './report.service';
import { ReportController } from './report.controller';
import { Attendance } from 'src/attendance/entities/attendance.entity';
import { Payment } from 'src/payments/entities/payment.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([Payment, Attendance])], // Добавьте необходимые сущности
  controllers: [ReportController],
  providers: [ReportService],
})
export class ReportModule {}
