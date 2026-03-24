// src/modules/groups/groups.controller.ts
import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { GroupsService } from './groups.service';
import { CreateGroupDto, AddStudentDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { CreateScheduleDto } from '../schedule/dto/create-schedule.dto';
import { JwtAuthGuard } from '../_auth/guards/jwt-auth.guard';
import { RolesGuard } from '../_auth/guards/roles.guard';
import { Roles } from '../_auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('groups')
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @Post()
  async create(@Body() body: { group: CreateGroupDto; schedule: CreateScheduleDto }) {
    // Принимаем объект, где лежат сразу два DTO
    return this.groupsService.create(body.group, body.schedule);
  }

  @Get()
  findAll() {
    return this.groupsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.groupsService.findOne(id);
  }

  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateGroupDto) {
    return this.groupsService.update(id, dto);
  }


  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @Post(':id/students')
  addStudent(@Param('id') id: string, @Body() dto: AddStudentDto) {
    return this.groupsService.addStudent(id, dto.studentId);
  }

  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @Delete(':id/students/:studentId')
  removeStudent(@Param('id') id: string, @Param('studentId') studentId: string) {
    return this.groupsService.removeStudent(id, studentId);
  }

  @Roles(UserRole.OWNER)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.groupsService.remove(id);
  }
}