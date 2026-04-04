import { Controller, Get } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { Roles } from 'src/auth/decorators/role.decorator';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Roles('ADMIN')
  @Get('overview')
  async getOverview() {
    return await this.dashboardService.getDashboardOverview();
  }

  @Roles('ADMIN')
  @Get('sales-day')
  async getSalesDay() {
    return await this.dashboardService.getSalesTrend();
  }
  @Roles('ADMIN')
  @Get('top-sellers')
  async getTopSellers() {
    return await this.dashboardService.getTopSellers();
  }

  @Roles('ADMIN')
  @Get('sales-week')
  async getWeekTrend() {
    return await this.dashboardService.getWeeklySalesTrend();
  }
}
