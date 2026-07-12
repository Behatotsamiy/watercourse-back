import { Controller, Get, Query, UseGuards, Req } from '@nestjs/common';
import { ReportService } from './report.service';
import { JwtAuthGuard } from '../_auth/guards/jwt-auth.guard';
import { RolesGuard } from '../_auth/guards/roles.guard';
import { Roles } from '../_auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.OWNER, UserRole.ADMIN)
@Controller('reports')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Get('summary')
  async getSummary(@Req() req: any) {
    return this.reportService.getSummary(req.user.ownerId);
  }

  @Get('daily')
  async getDaily(@Query('date') date: string, @Req() req: any) {
    const targetDate = date || new Date().toISOString().split('T')[0];
    return this.reportService.getDailyReport(targetDate, req.user.ownerId);
  }

  @Get('monthly')
  async getMonthly(
    @Query('year') year: string,
    @Query('month') month: string,
    @Req() req: any,
  ) {
    const current = new Date();
    const targetYear = year ? parseInt(year) : current.getFullYear();
    const targetMonth = month ? parseInt(month) : current.getMonth() + 1;
    return this.reportService.getMonthlyReport(targetYear, targetMonth, req.user.ownerId);
  }

  @Get('yearly')
  async getYearly(@Query('year') year: string, @Req() req: any) {
    const targetYear = year ? parseInt(year) : new Date().getFullYear();
    return this.reportService.getYearlyReport(targetYear, req.user.ownerId);
  }
}