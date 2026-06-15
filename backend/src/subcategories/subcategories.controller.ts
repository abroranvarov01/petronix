import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { SubcategoriesService } from './subcategories.service';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('subcategories')
export class SubcategoriesController {
  constructor(private readonly subcategoriesService: SubcategoriesService) {}

  @Get()
  findAll(@Query('categoryId') categoryId?: string) {
    return this.subcategoriesService.findAll(categoryId);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post()
  create(@Body() body: any) {
    return this.subcategoriesService.create(body);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.subcategoriesService.update(id, body);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.subcategoriesService.remove(id);
  }
}
