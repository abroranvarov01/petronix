import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SuppliersService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.supplier.findMany({ orderBy: { createdAt: 'desc' } });
  }

  create(data: { name: string; phone?: string; note?: string }) {
    return this.prisma.supplier.create({ data });
  }

  update(id: string, data: any) {
    return this.prisma.supplier.update({ where: { id }, data });
  }

  remove(id: string) {
    return this.prisma.supplier.delete({ where: { id } });
  }
}
