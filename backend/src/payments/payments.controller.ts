import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @UseGuards(AuthGuard)
  @Get(':orderId')
  get(@Param('orderId') orderId: string) {
    return this.paymentsService.get(orderId);
  }

  // Manual confirmation stub (admin). Real gateway webhooks come later.
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post(':orderId/confirm')
  confirm(@Param('orderId') orderId: string, @Body() body: { method?: string }) {
    return this.paymentsService.confirm(orderId, body?.method);
  }
}
