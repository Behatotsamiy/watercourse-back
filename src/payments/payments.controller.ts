import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { JwtAuthGuard } from '../_auth/guards/jwt-auth.guard';
import { RolesGuard } from '../_auth/guards/roles.guard';
import { Roles } from '../_auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @Post()
  create(@Body() dto: CreatePaymentDto,studentId: string ) {
    return this.paymentsService.create(dto, studentId);
  }

  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @Get()
  findAll() {
    return this.paymentsService.findAll();
  }

  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.TEACHER)
  @Get('student/:studentId')
  findByStudent(@Param('studentId') studentId: string) {
    return this.paymentsService.findByStudent(studentId);
  }

  @Roles(UserRole.OWNER)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.paymentsService.remove(id);
  }
}