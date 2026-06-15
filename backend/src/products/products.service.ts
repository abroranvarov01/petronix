import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  // Публичный список — без costPrice и wholesalePrice
  async findAllPublic(type?: string, subtype?: string) {
    const where = {
      ...(type ? { type } : {}),
      ...(subtype ? { subtype } : {}),
    };
    const products = await this.prisma.product.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        nameUz: true,
        nameRu: true,
        nameEn: true,
        descriptionUz: true,
        descriptionRu: true,
        descriptionEn: true,
        brand: true,
        type: true,
        subtype: true,
        image: true,
        sellPrice: true,
        owner: { select: { id: true, name: true } },
        createdAt: true,
        updatedAt: true,
      },
    });
    return products;
  }

  // Публичный один товар
  async findOnePublic(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      select: {
        id: true,
        nameUz: true,
        nameRu: true,
        nameEn: true,
        descriptionUz: true,
        descriptionRu: true,
        descriptionEn: true,
        brand: true,
        type: true,
        subtype: true,
        image: true,
        sellPrice: true,
        owner: { select: { id: true, name: true } },
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!product) throw new NotFoundException('Mahsulot topilmadi');
    return product;
  }

  // Полный список с ценами (для авторизованных)
  async findAll() {
    return this.prisma.product.findMany({
      orderBy: { createdAt: 'desc' },
      include: { owner: { select: { id: true, name: true, role: true } } },
    });
  }

  async create(data: any) {
    return this.prisma.product.create({ data });
  }

  async update(id: string, data: any, user: { sub: string; role: string }) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('Mahsulot topilmadi');

    // Только автор или админ может обновить
    if (user.role !== 'ADMIN' && product.ownerId !== user.sub) {
      throw new ForbiddenException('Faqat o\'z mahsulotingizni tahrirlashingiz mumkin');
    }

    // Не даём менять ownerId
    const { ownerId, ...rest } = data;
    return this.prisma.product.update({ where: { id }, data: rest });
  }

  async remove(id: string, user: { sub: string; role: string }) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('Mahsulot topilmadi');

    if (user.role !== 'ADMIN' && product.ownerId !== user.sub) {
      throw new ForbiddenException('Faqat o\'z mahsulotingizni o\'chirishingiz mumkin');
    }

    return this.prisma.product.delete({ where: { id } });
  }
}
