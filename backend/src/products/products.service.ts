import { Injectable, ForbiddenException, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService, private redis: RedisService) {}

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

    // `subtype` may be a comma-separated list — match products having ANY of them.
    const subtypeList = (params.subtype ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const where: any = {
      ...(params.type ? { types: { has: params.type } } : {}),
      ...(subtypeList.length ? { subtypes: { hasSome: subtypeList } } : {}),
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

    // Cache the (hot) public catalog reads; invalidated on any product write.
    const cacheKey = `products:list:${JSON.stringify({ type: params.type ?? '', subtype: params.subtype ?? '', q, page, limit })}`;
    return this.redis.wrap(cacheKey, 30, async () => {
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
            types: true,
            subtypes: true,
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
    });
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
        types: true,
        subtypes: true,
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

  // Полный список с ценами (для авторизованных). take-лимит — защита от OOM.
  async findAll() {
    return this.prisma.product.findMany({
      orderBy: { createdAt: 'desc' },
      take: 1000,
      include: { owner: { select: { id: true, name: true, role: true } } },
    });
  }

  async create(data: any) {
    const created = await this.prisma.product.create({ data });
    await this.redis.delPattern('products:*');
    return created;
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
    const updated = await this.prisma.product.update({ where: { id }, data: rest });
    await this.redis.delPattern('products:*');
    return updated;
  }

  async remove(id: string, user: { sub: string; role: string }) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('Mahsulot topilmadi');

    if (user.role !== 'ADMIN' && product.ownerId !== user.sub) {
      throw new ForbiddenException('Faqat o\'z mahsulotingizni o\'chirishingiz mumkin');
    }

    try {
      const removed = await this.prisma.product.delete({ where: { id } });
      await this.redis.delPattern('products:*');
      return removed;
    } catch (e: any) {
      // P2003 — a foreign key still points at the product (e.g. the migration
      // relaxing OrderItem/SupplyItem delete rules hasn't been applied yet).
      if (e?.code === 'P2003') {
        throw new ConflictException(
          "Mahsulot buyurtmalar yoki kirimlarda ishlatilgan — o'chirib bo'lmaydi",
        );
      }
      throw e;
    }
  }
}
