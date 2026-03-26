import { Module } from '@nestjs/common';
import { GroupsService } from './groups.service';
import { GroupsController } from './groups.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Group } from './entities/group.entity';
import { Student } from 'src/students/entities/student.entity';
import { ScheduleService } from 'src/schedule/schedule.service';
import { Schedule } from 'src/schedule/entities/schedule.entity';
import { ScheduleModule } from 'src/schedule/schedule.module';

@Module({
  imports: [TypeOrmModule.forFeature([Group, Student, Schedule]), ScheduleModule ], // 👈 Student нужен для addStudent
  controllers: [GroupsController],
  providers: [GroupsService, ScheduleService],
  exports: [GroupsService],
})
export class GroupsModule {}
