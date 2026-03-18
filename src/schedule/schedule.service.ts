import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Schedule } from './entities/schedule.entity';
import { CreateScheduleDto } from './dto/create-schedule.dto';

@Injectable()
export class ScheduleService {
  constructor(
    @InjectRepository(Schedule)
    private scheduleRepository: Repository<Schedule>,
  ) {}

  async create(dto: CreateScheduleDto) {
    const schedule = this.scheduleRepository.create({
      dayOfWeek: dto.dayOfWeek,
      startTime: dto.startTime,
      endTime: dto.endTime,
      group: { id: dto.groupId },
    });
    return this.scheduleRepository.save(schedule);
  }

  async findByGroup(groupId: string) {
    return this.scheduleRepository.find({
      where: { group: { id: groupId } },
      order: { dayOfWeek: 'ASC' },
    });
  }

  async remove(id: string) {
    const schedule = await this.scheduleRepository.findOne({ where: { id } });
    if (!schedule) throw new NotFoundException('Расписание не найдено');
    await this.scheduleRepository.remove(schedule);
    return { message: 'Расписание удалено' };
  }
}