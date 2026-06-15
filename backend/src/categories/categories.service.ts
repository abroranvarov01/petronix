import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.category.findMany({
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
      include: {
        subcategories: {
          orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
        },
      },
    });
  }

  async create(data: { nameUz?: string; nameRu?: string; nameEn?: string; name?: string; slug: string; image?: string; order?: number }) {
    return this.prisma.category.create({ data });
  }

  async update(id: string, data: any) {
    return this.prisma.category.update({ where: { id }, data });
  }

  async remove(id: string) {
    return this.prisma.category.delete({ where: { id } });
  }
}
