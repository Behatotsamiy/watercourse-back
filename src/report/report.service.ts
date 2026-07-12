import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from '../payments/entities/payment.entity'; // Поправь пути, если сущности называются иначе
import { Attendance } from '../attendance/entities/attendance.entity';

@Injectable()
export class ReportService {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @InjectRepository(Attendance)
    private readonly attendanceRepository: Repository<Attendance>,
  ) {}

  // 1. ДНЕВНОЙ ОТЧЕТ
  async getDailyReport(dateStr: string) {
    // dateStr ожидается в формате 'YYYY-MM-DD'
    
    // Считаем общую выручку за день и группируем по типу оплаты (наличка, Uzcard, Humo)
    const payments = await this.paymentRepository
      .createQueryBuilder('payment')
      .select('payment.type', 'type')
      .addSelect('SUM(payment.amount)', 'total')
      .where('DATE(payment.createdAt) = :date', { date: dateStr })
      .groupBy('payment.type')
      .getRawMany();

    const totalRevenue = payments.reduce((sum, item) => sum + Number(item.total), 0);

    // Считаем посещаемость за этот день
    const attendance = await this.attendanceRepository
      .createQueryBuilder('attendance')
      .select('attendance.status', 'status')
      .addSelect('COUNT(attendance.id)', 'count')
      .where('attendance.date = :date', { date: dateStr })
      .groupBy('attendance.status')
      .getRawMany();

    return {
      date: dateStr,
      payments: {
        totalRevenue,
        breakdown: payments.map(p => ({ type: p.type, total: Number(p.total) }))
      },
      attendance: this.formatAttendance(attendance),
    };
  }

  // 2. МЕСЯЧНЫЙ ОТЧЕТ
  async getMonthlyReport(year: number, month: number) {
    // Выручка за месяц с разбивкой по дням (чтобы построить график на фронте)
    const dailyPayments = await this.paymentRepository
      .createQueryBuilder('payment')
      .select("TO_CHAR(payment.createdAt, 'YYYY-MM-DD')", 'date')
      .addSelect('SUM(payment.amount)', 'total')
      .where('EXTRACT(YEAR FROM payment.createdAt) = :year', { year })
      .andWhere('EXTRACT(MONTH FROM payment.createdAt) = :month', { month })
      .groupBy("TO_CHAR(payment.createdAt, 'YYYY-MM-DD')")
      .orderBy('date', 'ASC')
      .getRawMany();

    const totalRevenue = dailyPayments.reduce((sum, item) => sum + Number(item.total), 0);

    // Посещаемость за весь месяц
    const attendance = await this.attendanceRepository
      .createQueryBuilder('attendance')
      .select('attendance.status', 'status')
      .addSelect('COUNT(attendance.id)', 'count')
      .where('EXTRACT(YEAR FROM attendance.date) = :year', { year })
      .andWhere('EXTRACT(MONTH FROM attendance.date) = :month', { month })
      .groupBy('attendance.status')
      .getRawMany();

    return {
      year,
      month,
      payments: {
        totalRevenue,
        graphData: dailyPayments.map(p => ({ date: p.date, total: Number(p.total) }))
      },
      attendance: this.formatAttendance(attendance),
    };
  }

  // 3. ГОДОВОЙ ОТЧЕТ
  async getYearlyReport(year: number) {
    // Выручка за год с разбивкой по месяцам для годового графика
    const monthlyPayments = await this.paymentRepository
      .createQueryBuilder('payment')
      .select('EXTRACT(MONTH FROM payment.createdAt)', 'month')
      .addSelect('SUM(payment.amount)', 'total')
      .where('EXTRACT(YEAR FROM payment.createdAt) = :year', { year })
      .groupBy('EXTRACT(MONTH FROM payment.createdAt)')
      .orderBy('month', 'ASC')
      .getRawMany();

    const totalRevenue = monthlyPayments.reduce((sum, item) => sum + Number(item.total), 0);

    // Посещаемость за весь год
    const attendance = await this.attendanceRepository
      .createQueryBuilder('attendance')
      .select('attendance.status', 'status')
      .addSelect('COUNT(attendance.id)', 'count')
      .where('EXTRACT(YEAR FROM attendance.date) = :year', { year })
      .groupBy('attendance.status')
      .getRawMany();

    return {
      year,
      payments: {
        totalRevenue,
        graphData: monthlyPayments.map(p => ({ month: Number(p.month), total: Number(p.total) }))
      },
      attendance: this.formatAttendance(attendance),
    };
  }

  // Хелпер для красивого маппинга посещаемости
  private formatAttendance(rawAttendance: any[]) {
    const result = { present: 0, absent: 0, late: 0, total: 0 };
    rawAttendance.forEach(item => {
      if (item.status in result) {
        result[item.status] = Number(item.count);
      }
    });
    result.total = result.present + result.absent + result.late;
    return result;
  }
}