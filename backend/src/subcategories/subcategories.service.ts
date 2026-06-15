import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SubcategoriesService {
  constructor(private prisma: PrismaService) {}

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
    return this.prisma.subcategory.create({ data });
  }

  async update(id: string, data: any) {
    return this.prisma.subcategory.update({ where: { id }, data });
  }

  async remove(id: string) {
    return this.prisma.subcategory.delete({ where: { id } });
  }
}
