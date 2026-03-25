// src/modules/schedule/schedule.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Schedule } from './entities/schedule.entity';
import { CreateScheduleDto } from './dto/create-schedule.dto';

@Injectable()
export class ScheduleService {
  constructor(
    @InjectRepository(Schedule) private scheduleRepository: Repository<Schedule>,
  ) {}


  async createSchedule(dto: CreateScheduleDto) {
  const scheduleEntries = dto.dayOfWeek.map((day) => 
      this.scheduleRepository.create({
        dayOfWeek: String(day),
        startTime: dto.startTime,
        endTime: dto.endTime,
        group: { id: dto.groupId } as any,
      })
    );
    return this.scheduleRepository.save(scheduleEntries);
  }

  async findAll(){
    return this.scheduleRepository.find(
    
    )
  }

  async findByGroup(groupId: string) {
    return this.scheduleRepository.find({
      where: { group: { id: groupId } },
      order: { dayOfWeek: 'ASC' },
    });
  }

  async remove(id: string) {
    const result = await this.scheduleRepository.delete(id);
    if (result.affected === 0) throw new NotFoundException('Запись не найдена');
    return { message: 'Расписание удалено' };
  }
}