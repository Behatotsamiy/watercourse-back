import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}
 async create(dto: CreateUserDto, ownerId?: string) {
  try {
     const existingUser = await this.userRepository.findOne({ where: { phone: dto.phone } });
    if (existingUser) {
      throw new BadRequestException('Этот номер уже зарегистрирован');
    }
  // 1. Хешируем пароль
  const hashedPassword = await bcrypt.hash(dto.password, 10);

  // 2. Создаем инстанс сущности из DTO
  const newUser = this.userRepository.create({
    ...dto,
    password: hashedPassword,
    ownerId: ownerId, // Записываем ID напрямую в колонку
  });


  // 4. Сохраняем
  const savedUser = await this.userRepository.save(newUser);

  const { password, ...result } = savedUser;
  return result;

  } catch (error) {
    // Если это наша ошибка (BadRequestException), просто пробрасываем её дальше
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
  }
  }
   


async findAll(ownerId: string) {
  return await this.userRepository.find({
    where: { owner: { id: ownerId } },
    relations: ['owner'],
  });
}

// Найти одного по ID
async findOne(id: string) : Promise<User>{
  const user = await this.userRepository.findOne({ 
    where: {id},
    relations: ['owner'] 
  });
  
  if (!user) throw new BadRequestException('Пользователь не найден');
  return user;
}


// Обновить данные
async update(id: string, updateDto: Partial<CreateUserDto>) {
  const user = await this.findOne(id);
  
  if (updateDto.password) {
    updateDto.password = await bcrypt.hash(updateDto.password, 10);
  }

  Object.assign(user, updateDto);
  return await this.userRepository.save(user);
}

// Удалить
async remove(id: string) {
  const user = await this.findOne(id);
  await this.userRepository.remove(user);
  return { message: 'Пользователь успешно удален' };
}
}