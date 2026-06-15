import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class SubcategoriesService {
  constructor(private prisma: PrismaService, private redis: RedisService) {}

  async findAll(categoryId?: string) {
    return this.prisma.subcategory.findMany({
      where: categoryId ? { categoryId } : {},
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    });
  }

  async create(data: {
    nameUz?: string;
    nameRu?: string;
    nameEn?: string;
    name?: string;
    slug: string;
    image?: string;
    order?: number;
    categoryId: string;
  }) {
    const created = await this.prisma.subcategory.create({ data });
    await this.redis.delPattern('categories:*');
    return created;
  }

  async update(id: string, data: any) {
    const updated = await this.prisma.subcategory.update({ where: { id }, data });
    await this.redis.delPattern('categories:*');
    return updated;
  }

  async remove(id: string) {
    const removed = await this.prisma.subcategory.delete({ where: { id } });
    await this.redis.delPattern('categories:*');
    return removed;
  }
}
