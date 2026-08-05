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

  // ─── HELPER: owner ga tegishli to'lovlarni olish (dublikatsiz) ───
  private async getOwnerPayments(ownerId: string, filters: {
    year?: number;
    month?: number;
    dateStr?: string;
  }) {
    const qb = this.paymentRepository
      .createQueryBuilder('payment')
      .select('payment.id', 'id')
      .addSelect('payment.amount', 'amount')
      .addSelect('payment.method', 'method')
      .addSelect('payment.createdAt', 'createdAt')
      .leftJoin('payment.student', 'student')
      .leftJoin('student.group', 'group')
      .leftJoin('group.teacher', 'teacher')
      .where('(teacher.ownerId = :ownerId OR teacher.id = :ownerId)', { ownerId });

    if (filters.dateStr) {
      qb.andWhere('DATE(payment.createdAt) = :date', { date: filters.dateStr });
    }
    if (filters.year) {
      qb.andWhere('EXTRACT(YEAR FROM payment.createdAt) = :year', { year: filters.year });
    }
    if (filters.month) {
      qb.andWhere('EXTRACT(MONTH FROM payment.createdAt) = :month', { month: filters.month });
    }

    // DISTINCT по payment.id — убирает дубликаты из-за ManyToMany
    const raw = await qb.getRawMany();

    // Дедупликация по id на уровне JS (надёжнее чем SQL DISTINCT с JOIN)
    const seen = new Set<string>();
    return raw.filter(p => {
      if (seen.has(p.id)) return false;
      seen.add(p.id);
      return true;
    });
  }

  // ─── 1. ДНЕВНОЙ ОТЧЁТ ─────────────────────────────────────────────
  async getDailyReport(dateStr: string, ownerId: string) {
    const payments = await this.getOwnerPayments(ownerId, { dateStr });

    const totalRevenue = payments.reduce((s, p) => s + Number(p.amount), 0);

    const byMethod: Record<string, number> = {};
    payments.forEach(p => {
      byMethod[p.method] = (byMethod[p.method] ?? 0) + Number(p.amount);
    });

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
        breakdown: Object.entries(byMethod).map(([method, total]) => ({ method, total })),
      },
      attendance: this.formatAttendance(attendance),
    };
  }

  // ─── 2. МЕСЯЧНЫЙ ОТЧЁТ ────────────────────────────────────────────
  async getMonthlyReport(year: number, month: number, ownerId: string) {
    const payments = await this.getOwnerPayments(ownerId, { year, month });

    const totalRevenue = payments.reduce((s, p) => s + Number(p.amount), 0);

    // Группируем по дням для графика
    const byDate: Record<string, number> = {};
    payments.forEach(p => {
      const date = new Date(p.createdAt).toISOString().split('T')[0];
      byDate[date] = (byDate[date] ?? 0) + Number(p.amount);
    });

    const graphData = Object.entries(byDate)
      .map(([date, total]) => ({ date, total }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Должники
    const debtors = await this.studentRepository
      .createQueryBuilder('student')
      .leftJoin('student.group', 'group')
      .leftJoin('group.teacher', 'teacher')
      .leftJoin(
        'student.payments',
        'payment',
        'EXTRACT(YEAR FROM payment.createdAt) = :year AND EXTRACT(MONTH FROM payment.createdAt) = :month',
        { year, month },
      )
      .where('(teacher.ownerId = :ownerId OR teacher.id = :ownerId)', { ownerId })
      .andWhere('payment.id IS NULL')
      .select(['student.id', 'student.stfirstName', 'student.stlastName', 'student.phone'])
      .getMany();

    // Посещаемость
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
      payments: { totalRevenue, graphData },
      attendance: this.formatAttendance(attendance),
      debtors,
    };
  }

  // ─── 3. ГОДОВОЙ ОТЧЁТ ─────────────────────────────────────────────
  async getYearlyReport(year: number, ownerId: string) {
    const payments = await this.getOwnerPayments(ownerId, { year });

    const totalRevenue = payments.reduce((s, p) => s + Number(p.amount), 0);

    // Группируем по месяцам для графика
    const byMonth: Record<number, number> = {};
    payments.forEach(p => {
      const m = new Date(p.createdAt).getMonth() + 1;
      byMonth[m] = (byMonth[m] ?? 0) + Number(p.amount);
    });

    const graphData = Object.entries(byMonth)
      .map(([month, total]) => ({ month: Number(month), total }))
      .sort((a, b) => a.month - b.month);

    // Прошлый год
    const lastYearPayments = await this.getOwnerPayments(ownerId, { year: year - 1 });
    const lastYearRevenue = lastYearPayments.reduce((s, p) => s + Number(p.amount), 0);

    return {
      year,
      payments: { totalRevenue, lastYearRevenue, graphData },
    };
  }

  // ─── 4. ОБЩАЯ СТАТИСТИКА ──────────────────────────────────────────
  async getSummary(ownerId: string) {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const lastYear = month === 1 ? year - 1 : year;
    const lastMonth = month === 1 ? 12 : month - 1;

    const [thisMonthPayments, lastMonthPayments, totalStudents, debtorsCount] = await Promise.all([
      this.getOwnerPayments(ownerId, { year, month }),
      this.getOwnerPayments(ownerId, { year: lastYear, month: lastMonth }),

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
        .leftJoin(
          'student.payments',
          'payment',
          'EXTRACT(YEAR FROM payment.createdAt) = :year AND EXTRACT(MONTH FROM payment.createdAt) = :month',
          { year, month },
        )
        .where('(teacher.ownerId = :ownerId OR teacher.id = :ownerId)', { ownerId })
        .andWhere('payment.id IS NULL')
        .getCount(),
    ]);

    const thisMonthTotal = thisMonthPayments.reduce((s, p) => s + Number(p.amount), 0);
    const lastMonthTotal = lastMonthPayments.reduce((s, p) => s + Number(p.amount), 0);

    const growth = lastMonthTotal > 0
      ? Math.round(((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100)
      : 0;

    return {
      thisMonthRevenue: thisMonthTotal,
      lastMonthRevenue: lastMonthTotal,
      growth,
      totalStudents,
      debtorsCount,
    };
  }

  // ─── HELPER: форматирование посещаемости ──────────────────────────
  private formatAttendance(rawAttendance: any[]) {
    let present = 0;
    let absent = 0;
    rawAttendance.forEach(item => {
      if (item.isPresent === true || item.isPresent === 'true') {
        present = Number(item.count);
      } else {
        absent = Number(item.count);
      }
    });
    const total = present + absent;
    const rate = total > 0 ? Math.round((present / total) * 100) : 0;
    return { present, absent, total, rate };
  }
}