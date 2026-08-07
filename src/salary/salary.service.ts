import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Payment } from '../payments/entities/payment.entity';

@Injectable()
export class SalaryService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
  ) {}

  async getMonthlySalaries(ownerId: string, year: number, month: number) {
    // 1. Owner'ga tegishli barcha o'qituvchilarni ol
    const teachers = await this.userRepository.find({
      where: { ownerId: ownerId, role: 'teacher' } as any,
      relations: ['groups', 'groups.students'],
    });

    const result = await Promise.all(
      teachers.map(async (teacher) => {
        // 2. Ushbu o'qituvchining barcha guruhlaridagi o'quvchilar IDlarini yig'
        const studentIds = new Set<string>();
        teacher.groups?.forEach(group => {
          group.students?.forEach(student => {
            studentIds.add(student.id);
          });
        });

        // 3. Shu o'quvchilarning shu oyda to'lagan summalarini ol
        let totalStudentPayments = 0;

        if (studentIds.size > 0) {
          const payments = await this.paymentRepository
            .createQueryBuilder('payment')
            .select('payment.id', 'id')
            .addSelect('payment.amount', 'amount')
            .leftJoin('payment.student', 'student')
            .where('student.id IN (:...ids)', { ids: [...studentIds] })
            .andWhere('EXTRACT(YEAR FROM payment.createdAt) = :year', { year })
            .andWhere('EXTRACT(MONTH FROM payment.createdAt) = :month', { month })
            .getRawMany();

          // Deduplikatsiya
          const seen = new Set<string>();
          payments.forEach(p => {
            if (!seen.has(p.id)) {
              seen.add(p.id);
              totalStudentPayments += Number(p.amount);
            }
          });
        }

        // 4. Oylikni hisoblash
        let salary = 0;
        const salaryType = teacher.salaryType ?? 'fixed';

        if (salaryType === 'fixed') {
          salary = Number(teacher.fixedSalary ?? 0);
        } else if (salaryType === 'percent') {
          salary = totalStudentPayments * (Number(teacher.salaryPercent ?? 0) / 100);
        } else if (salaryType === 'fixed_percent') {
          salary = Number(teacher.fixedSalary ?? 0) +
            totalStudentPayments * (Number(teacher.salaryPercent ?? 0) / 100);
        }

        return {
          teacherId: teacher.id,
          firstName: teacher.firstName,
          lastName: teacher.lastName,
          phone: teacher.phone,
          salaryType,
          fixedSalary: Number(teacher.fixedSalary ?? 0),
          salaryPercent: Number(teacher.salaryPercent ?? 0),
          groupsCount: teacher.groups?.length ?? 0,
          studentsCount: studentIds.size,
          totalStudentPayments,
          calculatedSalary: Math.round(salary),
        };
      })
    );

    return {
      year,
      month,
      teachers: result,
      totalSalaries: result.reduce((s, t) => s + t.calculatedSalary, 0),
    };
  }

  async updateTeacherSalarySettings(
    teacherId: string,
    dto: { salaryType: string; fixedSalary?: number; salaryPercent?: number },
  ) {
    await this.userRepository.update(teacherId, {
      salaryType: dto.salaryType,
      fixedSalary: dto.fixedSalary ?? 0,
      salaryPercent: dto.salaryPercent ?? 0,
    } as any);
    return { message: 'Oylik sozlamalari yangilandi' };
  }
}