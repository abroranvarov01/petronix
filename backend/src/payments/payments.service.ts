import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrdersService } from '../orders/orders.service';

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService, private orders: OrdersService) {}

  async get(orderId: string) {
    const payment = await this.prisma.payment.findUnique({ where: { orderId } });
    if (!payment) throw new NotFoundException('To\'lov topilmadi');
    return payment;
  }

  // Stub: mark a payment as paid. Real Payme/Click webhooks will replace this in a later phase.
  async confirm(orderId: string, method = 'manual', userId?: string) {
    const payment = await this.prisma.payment.findUnique({ where: { orderId } });
    if (!payment) throw new NotFoundException('To\'lov topilmadi');

    await this.prisma.payment.update({
      where: { orderId },
      data: { status: 'PAID', method, provider: 'manual' },
    });
    // Move order to PAID via the shared transition so stock SALE movements post.
    await this.orders.transition(orderId, 'PAID', userId);
    return this.prisma.payment.findUnique({ where: { orderId } });
  }
}
