import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { StudentsService } from './students.service';
import { CreateStudentDto} from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { JwtAuthGuard } from '../_auth/guards/jwt-auth.guard';
import { RolesGuard } from '../_auth/guards/roles.guard';
import { Roles } from '../_auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@UseGuards(JwtAuthGuard)
@Controller('students')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @UseGuards(RolesGuard)
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @Post()
  create(@Body() dto: CreateStudentDto) {
    return this.studentsService.create(dto);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.TEACHER)
  @Get()
  findAll() {
    return this.studentsService.findAll();
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.TEACHER)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.studentsService.findOne(id);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateStudentDto) {
    return this.studentsService.update(id, dto);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.OWNER)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.studentsService.remove(id);
  }
}