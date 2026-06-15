import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, Query } from '@nestjs/common';
import { ProductsService } from './products.service';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  // Публичный — все товары (sellPrice для показа, без costPrice/wholesalePrice)
  @Get()
  findAll(@Query('type') type?: string, @Query('subtype') subtype?: string) {
    return this.productsService.findAllPublic(type, subtype);
  }

  // Только авторизованные — все товары с полными ценами
  @UseGuards(AuthGuard)
  @Get('full')
  findAllFull() {
    return this.productsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productsService.findOnePublic(id);
  }

  // Создать — авторизованный (admin или dealer)
  @UseGuards(AuthGuard)
  @Post()
  create(@Req() req: any, @Body() body: any) {
    return this.productsService.create({ ...body, ownerId: req.user.sub });
  }

  // Обновить — автор или админ
  @UseGuards(AuthGuard)
  @Patch(':id')
  update(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    return this.productsService.update(id, body, req.user);
  }

  // Удалить — автор или админ
  @UseGuards(AuthGuard)
  @Delete(':id')
  remove(@Req() req: any, @Param('id') id: string) {
    return this.productsService.remove(id, req.user);
  }
}
