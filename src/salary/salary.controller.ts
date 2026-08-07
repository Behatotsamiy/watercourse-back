import { Controller, Get, Patch, Query, Param, Body, UseGuards, Req } from '@nestjs/common';
import { SalaryService } from './salary.service';
import { JwtAuthGuard } from '../_auth/guards/jwt-auth.guard';
import { RolesGuard } from '../_auth/guards/roles.guard';
import { Roles } from '../_auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.OWNER, UserRole.ADMIN)
@Controller('salary')
export class SalaryController {
  constructor(private readonly salaryService: SalaryService) {}

  @Get()
  getMonthlySalaries(
    @Query('year') year: string,
    @Query('month') month: string,
    @Req() req: any,
  ) {
    const ownerId = req.user.role === 'owner' ? req.user.id : req.user.ownerId;
    const y = year ? parseInt(year) : new Date().getFullYear();
    const m = month ? parseInt(month) : new Date().getMonth() + 1;
    return this.salaryService.getMonthlySalaries(ownerId, y, m);
  }

  @Patch('settings/:teacherId')
  updateSettings(
    @Param('teacherId') teacherId: string,
    @Body() dto: { salaryType: string; fixedSalary?: number; salaryPercent?: number },
  ) {
    return this.salaryService.updateTeacherSalarySettings(teacherId, dto);
  }
}