// src/modules/schedule/schedule.controller.ts
import { Controller, Delete, Get, Param, UseGuards } from '@nestjs/common';
import { ScheduleService } from './schedule.service';
import { JwtAuthGuard } from '../_auth/guards/jwt-auth.guard';
import { RolesGuard } from '../_auth/guards/roles.guard';
import { Roles } from '../_auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('schedule')
export class ScheduleController {
  constructor(private readonly scheduleService: ScheduleService) {}

  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @Get()
  findAll(){
    return this.scheduleService.findAll()
  }
  
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.scheduleService.remove(id);
  }
}