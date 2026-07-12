import { Controller, Get, Query } from '@nestjs/common';
import { ReportService } from './report.service';

@Controller('reports')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Get('daily')
  async getDaily(@Query('date') date?: string) {
    // Если дата не передана, берем сегодняшний день (YYYY-MM-DD)
    const targetDate = date || new Date().toISOString().split('T')[0];
    return this.reportService.getDailyReport(targetDate);
  }

  @Get('monthly')
  async getMonthly(
    @Query('year') year?: string,
    @Query('month') month?: string,
  ) {
    const current = new Date();
    const targetYear = year ? parseInt(year) : current.getFullYear();
    const targetMonth = month ? parseInt(month) : current.getMonth() + 1; // JS months 0-11
    
    return this.reportService.getMonthlyReport(targetYear, targetMonth);
  }

  @Get('yearly')
  async getYearly(@Query('year') year?: string) {
    const targetYear = year ? parseInt(year) : new Date().getFullYear();
    return this.reportService.getYearlyReport(targetYear);
  }
}