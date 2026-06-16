import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  // Публичный список — без costPrice и wholesalePrice.
  // Серверный фильтр (type/subtype), поиск (q) и пагинация.
  async findAllPublic(params: {
    type?: string;
    subtype?: string;
    q?: string;
    page?: number | string;
    limit?: number | string;
  }) {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.min(60, Math.max(1, Number(params.limit) || 24));
    const skip = (page - 1) * limit;
    const q = (params.q ?? '').trim();

    const where: any = {
      ...(params.type ? { type: params.type } : {}),
      ...(params.subtype ? { subtype: params.subtype } : {}),
      ...(q
        ? {
            OR: [
              { nameUz: { contains: q, mode: 'insensitive' } },
              { nameRu: { contains: q, mode: 'insensitive' } },
              { nameEn: { contains: q, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
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
      }),
      this.prisma.product.count({ where }),
    ]);

    return { items, total, page, limit, pages: Math.ceil(total / limit) };
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
