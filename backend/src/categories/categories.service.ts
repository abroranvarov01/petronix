import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

const CACHE_KEY = 'categories:all';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService, private redis: RedisService) {}

  async findAll() {
    // Read-through cache; falls back to DB automatically when Redis is down.
    return this.redis.wrap(CACHE_KEY, 300, () =>
      this.prisma.category.findMany({
        orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
        include: {
          subcategories: {
            orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
          },
        },
      }),
    );
  }

  async create(data: { nameUz?: string; nameRu?: string; nameEn?: string; name?: string; slug: string; image?: string; order?: number }) {
    const created = await this.prisma.category.create({ data });
    await this.redis.delPattern('categories:*');
    return created;
  }

  async update(id: string, data: any) {
    const updated = await this.prisma.category.update({ where: { id }, data });
    await this.redis.delPattern('categories:*');
    return updated;
  }

  async remove(id: string) {
    const removed = await this.prisma.category.delete({ where: { id } });
    await this.redis.delPattern('categories:*');
    return removed;
  }
}
