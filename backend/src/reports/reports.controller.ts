import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { AuthGuard } from '../auth/auth.guard';

@Controller('reports')
@UseGuards(AuthGuard)
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  @Get('sales')
  sales(@Req() req: any, @Query('from') from?: string, @Query('to') to?: string, @Query('groupBy') groupBy?: string) {
    return this.reports.sales({ from, to }, groupBy ?? 'day', req.user);
  }

  @Get('profit')
  profit(@Req() req: any, @Query('from') from?: string, @Query('to') to?: string) {
    return this.reports.profit({ from, to }, req.user);
  }

  @Get('turnover')
  turnover(@Req() req: any, @Query('from') from?: string, @Query('to') to?: string, @Query('by') by?: string) {
    return this.reports.turnover({ from, to }, by ?? 'category', req.user);
  }

  @Get('stock')
  stock(@Req() req: any) {
    return this.reports.stock(req.user);
  }
}
