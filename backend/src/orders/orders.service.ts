import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WarehouseService } from '../warehouse/warehouse.service';
import { NotificationsService } from '../notifications/notifications.service';

// Statuses at which stock is considered consumed (sale posted)
const SOLD_STATUSES: OrderStatus[] = ['CONFIRMED', 'PAID', 'SHIPPED', 'COMPLETED'];

type OrderStatus = 'NEW' | 'CONFIRMED' | 'PAID' | 'SHIPPED' | 'COMPLETED' | 'CANCELLED';

interface CheckoutItem {
  productId: string;
  qty: number;
}
interface CheckoutDto {
  customerName: string;
  customerPhone: string;
  address?: string;
  comment?: string;
  userId?: string;
  items: CheckoutItem[];
}

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private warehouse: WarehouseService,
    private notifications: NotificationsService,
  ) {}

  async create(dto: CheckoutDto) {
    if (!dto.customerName || !dto.customerPhone) {
      throw new BadRequestException('Ism va telefon majburiy');
    }
    if (!Array.isArray(dto.items) || dto.items.length === 0) {
      throw new BadRequestException('Savatcha bo\'sh');
    }

    // Load products referenced in the cart
    const ids = [...new Set(dto.items.map((i) => i.productId))];
    const products = await this.prisma.product.findMany({ where: { id: { in: ids } } });
    const byId = new Map(products.map((p) => [p.id, p]));

    const itemsData = dto.items.map((i) => {
      const p = byId.get(i.productId);
      if (!p) throw new BadRequestException(`Mahsulot topilmadi: ${i.productId}`);
      const qty = Math.max(1, Math.floor(Number(i.qty) || 1));
      const unitPrice = p.sellPrice;
      return {
        productId: p.id,
        sellerId: p.ownerId ?? null,
        nameSnapshot: p.nameUz || p.nameRu || p.nameEn || '',
        qty,
        unitPrice,
        subtotal: unitPrice * qty,
      };
    });
    const total = itemsData.reduce((s, i) => s + i.subtotal, 0);

    const order = await this.prisma.order.create({
      data: {
        customerName: dto.customerName,
        customerPhone: dto.customerPhone,
        address: dto.address ?? '',
        comment: dto.comment ?? '',
        userId: dto.userId ?? null,
        total,
        items: { create: itemsData },
        payment: { create: { amount: total, status: 'PENDING' } },
      },
      include: { items: true, payment: true },
    });

    // Best-effort Telegram notification — never blocks the order
    this.notify(order).catch(() => {});

    return order;
  }

  async findAll(user: { sub: string; role: string }) {
    if (user.role === 'ADMIN') {
      return this.prisma.order.findMany({
        orderBy: { createdAt: 'desc' },
        take: 500,
        include: { items: true, payment: true },
      });
    }
    // Dealer — only orders that contain their products, and only their items
    return this.prisma.order.findMany({
      where: { items: { some: { sellerId: user.sub } } },
      orderBy: { createdAt: 'desc' },
      take: 500,
      include: { items: { where: { sellerId: user.sub } }, payment: true },
    });
  }

  async findOne(id: string, user: { sub: string; role: string }) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { items: true, payment: true },
    });
    if (!order) throw new NotFoundException('Buyurtma topilmadi');
    if (user.role !== 'ADMIN' && !order.items.some((i) => i.sellerId === user.sub)) {
      throw new ForbiddenException('Bu buyurtma sizga tegishli emas');
    }
    return order;
  }

  async updateStatus(id: string, status: OrderStatus, user: { sub: string; role: string }) {
    if (user.role !== 'ADMIN') throw new ForbiddenException('Faqat admin');
    return this.transition(id, status, user.sub);
  }

  /**
   * Core status transition (no role check — callers guard access).
   * Posts stock SALE movements the first time an order reaches a "sold"
   * status, and reverses them if the order is later cancelled. `stockPosted`
   * guards against double-posting.
   */
  async transition(id: string, status: OrderStatus, userId?: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { items: true, payment: true },
    });
    if (!order) throw new NotFoundException('Buyurtma topilmadi');

    const updated = await this.prisma.order.update({
      where: { id },
      data: {
        status,
        ...(status === 'PAID' && order.payment ? { payment: { update: { status: 'PAID' } } } : {}),
      },
      include: { items: true, payment: true },
    });

    if (SOLD_STATUSES.includes(status) && !order.stockPosted) {
      await this.warehouse.postOrderSale({ id: order.id, items: order.items }, userId);
      await this.prisma.order.update({ where: { id }, data: { stockPosted: true } });
      updated.stockPosted = true;
    } else if (status === 'CANCELLED' && order.stockPosted) {
      await this.warehouse.reverseOrderSale({ id: order.id, items: order.items }, userId);
      await this.prisma.order.update({ where: { id }, data: { stockPosted: false } });
      updated.stockPosted = false;
    }

    return updated;
  }

  private async notify(order: { id: string; customerName: string; customerPhone: string; total: number }) {
    const text =
      `🛒 *Yangi buyurtma!*\n\n` +
      `👤 *Mijoz:* ${order.customerName}\n` +
      `📞 *Telefon:* ${order.customerPhone}\n` +
      `💰 *Summa:* $${order.total}\n` +
      `🆔 *Buyurtma:* ${order.id}`;
    await this.notifications.send(text);
  }
}
