import { BadRequestException, Injectable } from '@nestjs/common';
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
  const existingUser = await this.userRepository.findOne({ where: { phone: dto.phone } });
    if (existingUser) {
      throw new BadRequestException('Этот номер уже зарегистрирован');
    }
    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const newUser = this.userRepository.create({
      ...dto,
      password: hashedPassword,
     owner: ownerId ? ({ id: ownerId }) : null,
    
    });
    const savedUser = await this.userRepository.save(newUser);
    delete savedUser.password;
    return savedUser;  }


async findAll(ownerId: string) {
  return await this.userRepository.find({
    where: { owner: { id: ownerId } },
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