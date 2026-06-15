import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BannersService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.banner.findMany({
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    });
  }

  async create(data: { image: string; link?: string; order?: number }) {
    return this.prisma.banner.create({ data });
  }

  async update(id: string, data: any) {
    return this.prisma.banner.update({ where: { id }, data });
  }

  async remove(id: string) {
    return this.prisma.banner.delete({ where: { id } });
  }
}
