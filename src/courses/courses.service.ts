// courses.service.ts
import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Course } from './entities/course.entity';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';

@Injectable()
export class CoursesService {
  constructor(
    @InjectRepository(Course)
    private courseRepository: Repository<Course>,
  ) {}

  async create(dto: CreateCourseDto) {
    try {
        const course = this.courseRepository.create(dto);
    return this.courseRepository.save(course);
    } catch (error) {
 if (error instanceof BadRequestException) {
      throw error;
    }

    // Если это ошибка базы данных (например, дубликат, который мы не поймали)
    if (error.code === '23505') { // Код ошибки уникальности в PostgreSQL
      throw new BadRequestException('Пользователь с такими данными уже существует');
    }

    // Во всех остальных случаях логируем ошибку в консоль и выдаем 500
    console.error('Ошибка при создании пользователя:', error);
    throw new InternalServerErrorException('Произошла ошибка на стороне сервера');
  }    }
  
  

  async findAll() {
    return this.courseRepository.find({ relations: ['groups'] });
  }

  async findOne(id: string) {
    const course = await this.courseRepository.findOne({
      where: { id },
      relations: ['groups'],
    });
    if (!course) throw new NotFoundException('Курс не найден');
    return course;
  }

  async update(id: string, dto: UpdateCourseDto) {
    const course = await this.findOne(id);
    Object.assign(course, dto);
    return this.courseRepository.save(course);
  }

  async remove(id: string) {
    const course = await this.findOne(id);
    await this.courseRepository.remove(course);
    return { message: 'Курс удалён' };
  }
}