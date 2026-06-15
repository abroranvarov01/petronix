import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

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
  constructor(private prisma: PrismaService) {}

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
        include: { items: true, payment: true },
      });
    }
    // Dealer — only orders that contain their products, and only their items
    return this.prisma.order.findMany({
      where: { items: { some: { sellerId: user.sub } } },
      orderBy: { createdAt: 'desc' },
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
    const order = await this.prisma.order.findUnique({ where: { id }, include: { payment: true } });
    if (!order) throw new NotFoundException('Buyurtma topilmadi');

    const updated = await this.prisma.order.update({
      where: { id },
      data: {
        status,
        // Keep payment in sync when an order is marked paid
        ...(status === 'PAID' && order.payment
          ? { payment: { update: { status: 'PAID' } } }
          : {}),
      },
      include: { items: true, payment: true },
    });

    // NOTE: Фаза 2 — on CONFIRMED/PAID enqueue stock SALE movements; on CANCELLED reverse.
    return updated;
  }

  private async notify(order: { id: string; customerName: string; customerPhone: string; total: number }) {
    const botToken = process.env.BOT_TOKEN ?? process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.ADMIN_CHAT_ID ?? process.env.TELEGRAM_CHAT_ID;
    if (!botToken || !chatId) return;
    const text =
      `🛒 *Yangi buyurtma!*\n\n` +
      `👤 *Mijoz:* ${order.customerName}\n` +
      `📞 *Telefon:* ${order.customerPhone}\n` +
      `💰 *Summa:* $${order.total}\n` +
      `🆔 *Buyurtma:* ${order.id}`;
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown' }),
    });
  }
}
