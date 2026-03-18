import { Controller, Post, Body, UseGuards, Request, Get, Param, Patch, Delete } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../_auth/guards/jwt-auth.guard';
import { RolesGuard } from '../_auth/guards/roles.guard';
import { Roles } from '../_auth/decorators/roles.decorator';
import { UserRole } from './entities/user.entity';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // Публичный — регистрация Owner'а (без токена)
  @Post('register')
  @ApiOperation({ summary: 'Регистрация владельца учебного центра' })
  async registerOwner(@Body() dto: CreateUserDto) {
    return this.usersService.create({ ...dto, role: UserRole.OWNER });
  }

  // Только Owner создаёт staff — нужен токен
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER)
  @Post('staff')
  @ApiOperation({ summary: 'Владелец добавляет учителя или админа' })
  async createStaff(@Body() dto: CreateUserDto, @Request() req) {
    const ownerId = req.user.id;
    const companyName = req.user.companyName
    return this.usersService.create(dto, ownerId);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  @ApiOperation({ summary: 'Получить список всех сотрудников' })
  findAll(@Request() req) {
    return this.usersService.findAll(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  @ApiOperation({ summary: 'Получить одного пользователя по ID' })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @Patch(':id')
  @ApiOperation({ summary: 'Обновить данные пользователя' })
  update(@Param('id') id: string, @Body() updateDto: Partial<CreateUserDto>) {
    return this.usersService.update(id, updateDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER)
  @Delete(':id')
  @ApiOperation({ summary: 'Удалить пользователя' })
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}