// attendance.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Attendance } from './entities/attendance.entity';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';

@Injectable()
export class AttendanceService {
  constructor(
    @InjectRepository(Attendance)
    private attendanceRepository: Repository<Attendance>,
  ) {}

  async create(dto: CreateAttendanceDto) {
    const attendance = this.attendanceRepository.create({
      date: dto.date,
      isPresent: dto.isPresent,
      reason: dto.reason,
      student: { id: dto.studentId },
      group: { id: dto.groupId },
    });
    return this.attendanceRepository.save(attendance);
  }

  async findByGroup(groupId: string) {
    return this.attendanceRepository.find({
      where: { group: { id: groupId } },
      relations: ['student'],
      order: { date: 'DESC' },
    });
  }

  async findByStudent(studentId: string) {
    return this.attendanceRepository.find({
      where: { student: { id: studentId } },
      relations: ['group'],
      order: { date: 'DESC' },
    });
  }

  async update(id: string, dto: UpdateAttendanceDto) {
    const attendance = await this.attendanceRepository.findOne({ where: { id } });
    if (!attendance) throw new NotFoundException('Запись не найдена');
    Object.assign(attendance, dto);
    return this.attendanceRepository.save(attendance);
  }

  async remove(id: string) {
    const attendance = await this.attendanceRepository.findOne({ where: { id } });
    if (!attendance) throw new NotFoundException('Запись не найдена');
    await this.attendanceRepository.remove(attendance);
    return { message: 'Удалено успешно' };
  }
}