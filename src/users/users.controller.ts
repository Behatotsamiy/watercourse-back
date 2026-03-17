import { Controller, Post, Body, UseGuards, Request, Get, Param, Patch, Delete } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('register-owner')
  @ApiOperation({ summary: 'Регистрация владельца учебного центра' })
  async registerOwner(@Body() dto: CreateUserDto) {
    return this.usersService.create({ ...dto, role: 'owner' as any });
  }

 
  @Post('staff')
  @ApiOperation({ summary: 'Владелец добавляет учителя или админа' })
  async createStaff(@Body() dto: CreateUserDto, @Request() req) {
    // В будущем ownerId достанем из токена: const ownerId = req.user.id;
    // Пока для теста можно передать null или тестовый ID
    return this.usersService.create(dto, req.user?.id);
  }
@Get()
@ApiOperation({ summary: 'Получить список всех сотрудников (нужен ownerId)' })
findAll(@Request() req) {
  // Пока JWT не настроен, можно временно захардкодить ID для тестов
  return this.usersService.findAll(req.user?.id);
}

@Get(':id')
@ApiOperation({ summary: 'Получить одного пользователя по ID' })
findOne(@Param('id') id: string) {
  return this.usersService.findOne(id);
}

@Patch(':id')
@ApiOperation({ summary: 'Обновить данные пользователя' })
update(@Param('id') id: string, @Body() updateDto: Partial<CreateUserDto>) {
  return this.usersService.update(id, updateDto);
}

@Delete(':id')
@ApiOperation({ summary: 'Удалить пользователя' })
remove(@Param('id') id: string) {
  return this.usersService.remove(id);
}

}
