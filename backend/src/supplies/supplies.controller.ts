import { Controller, Get, Post, Param, Body, Req, UseGuards } from '@nestjs/common';
import { SuppliesService } from './supplies.service';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('supplies')
@UseGuards(AuthGuard, RolesGuard)
@Roles('ADMIN')
export class SuppliesController {
  constructor(private readonly supplies: SuppliesService) {}

  @Get()
  findAll() {
    return this.supplies.findAll();
  }

  @Post()
  create(@Body() body: any) {
    return this.supplies.create(body);
  }

  @Post(':id/post')
  post(@Req() req: any, @Param('id') id: string) {
    return this.supplies.post(id, req.user.sub);
  }
}
