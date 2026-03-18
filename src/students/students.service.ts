// students.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Student } from './entities/student.entity';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';

@Injectable()
export class StudentsService {
  constructor(
    @InjectRepository(Student)
    private studentRepository: Repository<Student>,
  ) {}

  async create(dto: CreateStudentDto) {
    const student = this.studentRepository.create(dto);
    return this.studentRepository.save(student);
  }

  async findAll() {
    return this.studentRepository.find({
      relations: ['group', 'payments'],
    });
  }

  async findOne(id: string) {
    const student = await this.studentRepository.findOne({
      where: { id },
      relations: ['group', 'payments', 'attendances'],
    });
    if (!student) throw new NotFoundException('Студент не найден');
    return student;
  }

  async update(id: string, dto: UpdateStudentDto) {
    const student = await this.findOne(id);
    Object.assign(student, dto);
    return this.studentRepository.save(student);
  }

  async remove(id: string) {
    const student = await this.findOne(id);
    await this.studentRepository.remove(student);
    return { message: 'Студент удалён' };
  }
}