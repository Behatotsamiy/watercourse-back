// src/modules/groups/groups.service.ts
import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Group } from './entities/group.entity';
import { Student } from '../students/entities/student.entity';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { ScheduleService } from '../schedule/schedule.service';
import { CreateScheduleDto } from '../schedule/dto/create-schedule.dto';

@Injectable()
export class GroupsService {
  constructor(
    @InjectRepository(Group) private groupRepository: Repository<Group>,
    @InjectRepository(Student) private studentRepository: Repository<Student>,
    private readonly scheduleService: ScheduleService,
  ) {}

  async create(dto: CreateGroupDto, scheduleDto: CreateScheduleDto) {
    // 1. Сначала сохраняем саму группу
    const group = await this.groupRepository.save(
      this.groupRepository.create({
        groupName: dto.groupName,
        course: { id: dto.courseId } as any,
        teacher: { id: dto.teacherId } as any,
      }),
    );

    // 2. Если прислали данные расписания, создаем его
    if (scheduleDto) {
      scheduleDto.groupId = group.id;
      await this.scheduleService.createSchedule(scheduleDto);
    }

    return this.findOne(group.id); // Возвращаем уже со связями
  }

  async addScheduleToGroup(dto: CreateScheduleDto) {
    const group = await this.groupRepository.findOne({ where: { id: dto.groupId } });
    if (!group) throw new NotFoundException('Группа не найдена');
    return this.scheduleService.createSchedule(dto);
  }

  async findAll() {
    return this.groupRepository.find({
      relations: ['course', 'teacher', 'students', 'schedules'],
    });
  }

  async findOne(id: string) {
    const group = await this.groupRepository.findOne({
      where: { id },
      relations: ['course', 'teacher', 'students', 'schedules'],
    });
    if (!group) throw new NotFoundException('Группа не найдена');
    return group;
  }

  async update(id: string, dto: UpdateGroupDto) {
    const group = await this.findOne(id);
    if (dto.groupName) group.groupName = dto.groupName;
    if (dto.courseId) group.course = { id: dto.courseId } as any;
    if (dto.teacherId) group.teacher = { id: dto.teacherId } as any;
    
    if (dto.studentId) {
      const exists = group.students.some((s) => s.id === dto.studentId);
      if (!exists) group.students.push({ id: dto.studentId } as any);
    }

    return this.groupRepository.save(group);
  }

  async addStudent(groupId: string, studentId: string) {
    const group = await this.groupRepository.findOne({ where: { id: groupId }, relations: ['students'] });
    const student = await this.studentRepository.findOne({ where: { id: studentId } });
    
    if (!group || !student) throw new NotFoundException('Группа или Студент не найдены');
    if (group.students.some(s => s.id === studentId)) throw new BadRequestException('Студент уже в группе');

    group.students.push(student);
    return this.groupRepository.save(group);
  }

  async removeStudent(groupId: string, studentId: string) {
    const group = await this.findOne(groupId);
    group.students = group.students.filter((s) => s.id !== studentId);
    return this.groupRepository.save(group);
  }

  async remove(id: string) {
    const group = await this.findOne(id);
    await this.groupRepository.remove(group);
    return { message: 'Группа удалена' };
  }
}