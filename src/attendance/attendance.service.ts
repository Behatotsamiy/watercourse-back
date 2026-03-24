// attendance.service.ts
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Attendance } from './entities/attendance.entity';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';
import { Student } from 'src/students/entities/student.entity';
import { Group } from 'src/groups/entities/group.entity';

@Injectable()
export class AttendanceService {
  constructor(
    @InjectRepository(Attendance)
    private attendanceRepository: Repository<Attendance>,
    @InjectRepository(Student)
    private studentRepository: Repository<Student>, // 👈

    @InjectRepository(Group)
    private groupRepository: Repository<Group>,
  ) {}

  async create(dto: CreateAttendanceDto) {
    const student = await this.studentRepository.findOne({
      where: { id: dto.studentId },
    });
    if (!student) throw new NotFoundException('Студент не найден');

    const group = await this.groupRepository.findOne({
      where: { id: dto.groupId },
    });
    if (!group) throw new NotFoundException('Группа не найдена');

    const existing = await this.attendanceRepository.findOne({
      where: {
        student: { id: dto.studentId },
        group: { id: dto.groupId },
        date: dto.date,
      },
    });
    if (existing)
      throw new BadRequestException('Посещаемость за этот день уже отмечена');

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
    const attendance = await this.attendanceRepository.findOne({
      where: { id },
    });
    if (!attendance) throw new NotFoundException('Запись не найдена');
    Object.assign(attendance, dto);
    return this.attendanceRepository.save(attendance);
  }

  async remove(id: string) {
    const attendance = await this.attendanceRepository.findOne({
      where: { id },
    });
    if (!attendance) throw new NotFoundException('Запись не найдена');
    await this.attendanceRepository.remove(attendance);
    return { message: 'Удалено успешно' };
  }
}
