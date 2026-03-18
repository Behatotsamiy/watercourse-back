// groups.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Group } from './entities/group.entity';
import { Student } from '../students/entities/student.entity';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';

@Injectable()
export class GroupsService {
  constructor(
    @InjectRepository(Group)
    private groupRepository: Repository<Group>,
    @InjectRepository(Student)
    private studentRepository: Repository<Student>,
  ) {}

  async create(dto: CreateGroupDto) {
    const group = this.groupRepository.create({
      groupName: dto.groupName,
      course: { id: dto.courseId },
      teacher: { id: dto.teacherId },
    });
    return this.groupRepository.save(group);
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
    return this.groupRepository.save(group);
  }

  async addStudent(groupId: string, studentId: string) {
    const group = await this.findOne(groupId);
    const student = await this.studentRepository.findOne({ where: { id: studentId } });
    if (!student) throw new NotFoundException('Студент не найден');
    group.students = [...(group.students || []), student];
    return this.groupRepository.save(group);
  }

  async removeStudent(groupId: string, studentId: string) {
    const group = await this.findOne(groupId);
    group.students = group.students.filter(s => s.id !== studentId);
    return this.groupRepository.save(group);
  }

  async remove(id: string) {
    const group = await this.findOne(id);
    await this.groupRepository.remove(group);
    return { message: 'Группа удалена' };
  }
}