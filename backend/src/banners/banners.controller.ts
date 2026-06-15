import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { BannersService } from './banners.service';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('banners')
export class BannersController {
  constructor(private readonly bannersService: BannersService) {}

  @Get()
  findAll() {
    return this.bannersService.findAll();
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post()
  create(@Body() body: any) {
    return this.bannersService.create(body);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.bannersService.update(id, body);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.bannersService.remove(id);
  }
}
