import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from '../payments/entities/payment.entity';
import { Attendance } from '../attendance/entities/attendance.entity';
import { Student } from '../students/entities/student.entity';

@Injectable()
export class ReportService {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @InjectRepository(Attendance)
    private readonly attendanceRepository: Repository<Attendance>,
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
  ) {}

  // 1. ДНЕВНОЙ ОТЧЁТ
  async getDailyReport(dateStr: string, ownerId: string) {
    const payments = await this.paymentRepository
      .createQueryBuilder('payment')
      .select('payment.method', 'method')
      .addSelect('SUM(payment.amount)', 'total')
      .leftJoin('payment.student', 'student')
      .leftJoin('student.group', 'group')
      .leftJoin('group.teacher', 'teacher')
      .where('DATE(payment.createdAt) = :date', { date: dateStr })
      .andWhere('(teacher.ownerId = :ownerId OR teacher.id = :ownerId)', { ownerId })
      .groupBy('payment.method')
      .getRawMany();

    const totalRevenue = payments.reduce((sum, p) => sum + Number(p.total), 0);

    const attendance = await this.attendanceRepository
      .createQueryBuilder('attendance')
      .select('attendance.isPresent', 'isPresent')
      .addSelect('COUNT(attendance.id)', 'count')
      .leftJoin('attendance.group', 'group')
      .leftJoin('group.teacher', 'teacher')
      .where('attendance.date = :date', { date: dateStr })
      .andWhere('(teacher.ownerId = :ownerId OR teacher.id = :ownerId)', { ownerId })
      .groupBy('attendance.isPresent')
      .getRawMany();

    return {
      date: dateStr,
      payments: {
        totalRevenue,
        breakdown: payments.map(p => ({ method: p.method, total: Number(p.total) })),
      },
      attendance: this.formatAttendance(attendance),
    };
  }

  // 2. МЕСЯЧНЫЙ ОТЧЁТ
  async getMonthlyReport(year: number, month: number, ownerId: string) {
    const dailyPayments = await this.paymentRepository
      .createQueryBuilder('payment')
      .select("TO_CHAR(payment.createdAt, 'YYYY-MM-DD')", 'date')
      .addSelect('SUM(payment.amount)', 'total')
      .leftJoin('payment.student', 'student')
      .leftJoin('student.group', 'group')
      .leftJoin('group.teacher', 'teacher')
      .where('EXTRACT(YEAR FROM payment.createdAt) = :year', { year })
      .andWhere('EXTRACT(MONTH FROM payment.createdAt) = :month', { month })
      .andWhere('(teacher.ownerId = :ownerId OR teacher.id = :ownerId)', { ownerId })
      .groupBy("TO_CHAR(payment.createdAt, 'YYYY-MM-DD')")
      .orderBy('date', 'ASC')
      .getRawMany();

    const totalRevenue = dailyPayments.reduce((sum, p) => sum + Number(p.total), 0);

    // Должники — студенты без платежей в этом месяце
    const debtors = await this.studentRepository
      .createQueryBuilder('student')
      .leftJoin('student.group', 'group')
      .leftJoin('group.teacher', 'teacher')
      .leftJoin('student.payments', 'payment',
        'EXTRACT(YEAR FROM payment.createdAt) = :year AND EXTRACT(MONTH FROM payment.createdAt) = :month',
        { year, month }
      )
      .where('(teacher.ownerId = :ownerId OR teacher.id = :ownerId)', { ownerId })
      .andWhere('payment.id IS NULL')
      .select(['student.id', 'student.stfirstName', 'student.stlastName', 'student.phone'])
      .getMany();

    const attendance = await this.attendanceRepository
      .createQueryBuilder('attendance')
      .select('attendance.isPresent', 'isPresent')
      .addSelect('COUNT(attendance.id)', 'count')
      .leftJoin('attendance.group', 'group')
      .leftJoin('group.teacher', 'teacher')
      .where('EXTRACT(YEAR FROM attendance.date) = :year', { year })
      .andWhere('EXTRACT(MONTH FROM attendance.date) = :month', { month })
      .andWhere('(teacher.ownerId = :ownerId OR teacher.id = :ownerId)', { ownerId })
      .groupBy('attendance.isPresent')
      .getRawMany();

    return {
      year,
      month,
      payments: {
        totalRevenue,
        graphData: dailyPayments.map(p => ({ date: p.date, total: Number(p.total) })),
      },
      attendance: this.formatAttendance(attendance),
      debtors,
    };
  }

  // 3. ГОДОВОЙ ОТЧЁТ
  async getYearlyReport(year: number, ownerId: string) {
    const monthlyPayments = await this.paymentRepository
      .createQueryBuilder('payment')
      .select('EXTRACT(MONTH FROM payment.createdAt)', 'month')
      .addSelect('SUM(payment.amount)', 'total')
      .leftJoin('payment.student', 'student')
      .leftJoin('student.group', 'group')
      .leftJoin('group.teacher', 'teacher')
      .where('EXTRACT(YEAR FROM payment.createdAt) = :year', { year })
      .andWhere('(teacher.ownerId = :ownerId OR teacher.id = :ownerId)', { ownerId })
      .groupBy('EXTRACT(MONTH FROM payment.createdAt)')
      .orderBy('month', 'ASC')
      .getRawMany();

    const totalRevenue = monthlyPayments.reduce((sum, p) => sum + Number(p.total), 0);

    // Сравнение с прошлым годом
    const lastYearPayments = await this.paymentRepository
      .createQueryBuilder('payment')
      .select('SUM(payment.amount)', 'total')
      .leftJoin('payment.student', 'student')
      .leftJoin('student.group', 'group')
      .leftJoin('group.teacher', 'teacher')
      .where('EXTRACT(YEAR FROM payment.createdAt) = :year', { year: year - 1 })
      .andWhere('(teacher.ownerId = :ownerId OR teacher.id = :ownerId)', { ownerId })
      .getRawOne();

    return {
      year,
      payments: {
        totalRevenue,
        lastYearRevenue: Number(lastYearPayments?.total ?? 0),
        graphData: monthlyPayments.map(p => ({ month: Number(p.month), total: Number(p.total) })),
      },
    };
  }

  // 4. ОБЩАЯ СТАТИСТИКА (для дашборда)
  async getSummary(ownerId: string) {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    const [thisMonth, lastMonth, totalStudents, debtors] = await Promise.all([
      this.paymentRepository
        .createQueryBuilder('payment')
        .select('SUM(payment.amount)', 'total')
        .leftJoin('payment.student', 'student')
        .leftJoin('student.group', 'group')
        .leftJoin('group.teacher', 'teacher')
        .where('EXTRACT(YEAR FROM payment.createdAt) = :year', { year })
        .andWhere('EXTRACT(MONTH FROM payment.createdAt) = :month', { month })
        .andWhere('(teacher.ownerId = :ownerId OR teacher.id = :ownerId)', { ownerId })
        .getRawOne(),

      this.paymentRepository
        .createQueryBuilder('payment')
        .select('SUM(payment.amount)', 'total')
        .leftJoin('payment.student', 'student')
        .leftJoin('student.group', 'group')
        .leftJoin('group.teacher', 'teacher')
        .where('EXTRACT(YEAR FROM payment.createdAt) = :year', { year: month === 1 ? year - 1 : year })
        .andWhere('EXTRACT(MONTH FROM payment.createdAt) = :month', { month: month === 1 ? 12 : month - 1 })
        .andWhere('(teacher.ownerId = :ownerId OR teacher.id = :ownerId)', { ownerId })
        .getRawOne(),

      this.studentRepository
        .createQueryBuilder('student')
        .leftJoin('student.group', 'group')
        .leftJoin('group.teacher', 'teacher')
        .where('(teacher.ownerId = :ownerId OR teacher.id = :ownerId)', { ownerId })
        .getCount(),

      this.studentRepository
        .createQueryBuilder('student')
        .leftJoin('student.group', 'group')
        .leftJoin('group.teacher', 'teacher')
        .leftJoin('student.payments', 'payment',
          'EXTRACT(YEAR FROM payment.createdAt) = :year AND EXTRACT(MONTH FROM payment.createdAt) = :month',
          { year, month }
        )
        .where('(teacher.ownerId = :ownerId OR teacher.id = :ownerId)', { ownerId })
        .andWhere('payment.id IS NULL')
        .getCount(),
    ]);

    const thisMonthTotal = Number(thisMonth?.total ?? 0);
    const lastMonthTotal = Number(lastMonth?.total ?? 0);
    const growth = lastMonthTotal > 0
      ? Math.round(((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100)
      : 0;

    return {
      thisMonthRevenue: thisMonthTotal,
      lastMonthRevenue: lastMonthTotal,
      growth,
      totalStudents,
      debtorsCount: debtors,
    };
  }

  private formatAttendance(rawAttendance: any[]) {
    let present = 0;
    let absent = 0;
    rawAttendance.forEach(item => {
      if (item.isPresent === true || item.isPresent === 'true') present = Number(item.count);
      else absent = Number(item.count);
    });
    const total = present + absent;
    const rate = total > 0 ? Math.round((present / total) * 100) : 0;
    return { present, absent, total, rate };
  }
}