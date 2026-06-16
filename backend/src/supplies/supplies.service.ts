import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WarehouseService } from '../warehouse/warehouse.service';

interface SupplyItemInput {
  productId: string;
  qty: number;
  unitCost: number;
}
interface CreateSupplyDto {
  supplierId?: string;
  warehouseId?: string;
  items: SupplyItemInput[];
}

@Injectable()
export class SuppliesService {
  constructor(private prisma: PrismaService, private warehouse: WarehouseService) {}

  findAll() {
    return this.prisma.supply.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        supplier: true,
        warehouse: { select: { id: true, name: true } },
        items: { include: { product: { select: { nameUz: true, nameRu: true, nameEn: true } } } },
      },
    });
  }

  async create(dto: CreateSupplyDto) {
    if (!Array.isArray(dto.items) || dto.items.length === 0) {
      throw new BadRequestException('Приход должен содержать позиции');
    }
    const warehouseId = dto.warehouseId ?? (await this.warehouse.getDefaultWarehouse()).id;
    const total = dto.items.reduce((s, i) => s + i.qty * i.unitCost, 0);
    return this.prisma.supply.create({
      data: {
        supplierId: dto.supplierId ?? null,
        warehouseId,
        total,
        items: { create: dto.items.map((i) => ({ productId: i.productId, qty: Math.abs(i.qty), unitCost: i.unitCost })) },
      },
      include: { items: true },
    });
  }

  /** Post a draft supply: create RECEIPT movements and lock it. */
  async post(id: string, userId?: string) {
    const supply = await this.prisma.supply.findUnique({ where: { id }, include: { items: true } });
    if (!supply) throw new NotFoundException('Приход топилмади');
    if (supply.status === 'POSTED') throw new BadRequestException('Приход уже проведён');

    for (const it of supply.items) {
      await this.warehouse.receipt(it.productId, it.qty, it.unitCost, supply.warehouseId, supply.id, userId);
    }

    return this.prisma.supply.update({
      where: { id },
      data: { status: 'POSTED', postedAt: new Date() },
      include: { items: true },
    });
  }
}
