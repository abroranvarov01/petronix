import { Controller, Get, Post, Patch, Param, Body, Req, UseGuards } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  // Public — guest checkout
  @Post()
  create(@Body() body: any) {
    return this.ordersService.create(body);
  }

  @UseGuards(AuthGuard)
  @Get()
  findAll(@Req() req: any) {
    return this.ordersService.findAll(req.user);
  }

  @UseGuards(AuthGuard)
  @Get(':id')
  findOne(@Req() req: any, @Param('id') id: string) {
    return this.ordersService.findOne(id, req.user);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Patch(':id/status')
  updateStatus(@Req() req: any, @Param('id') id: string, @Body() body: { status: any }) {
    return this.ordersService.updateStatus(id, body.status, req.user);
  }
}
