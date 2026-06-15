import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  async get(orderId: string) {
    const payment = await this.prisma.payment.findUnique({ where: { orderId } });
    if (!payment) throw new NotFoundException('To\'lov topilmadi');
    return payment;
  }

  // Stub: mark a payment as paid. Real Payme/Click webhooks will replace this in a later phase.
  async confirm(orderId: string, method = 'manual') {
    const payment = await this.prisma.payment.findUnique({ where: { orderId } });
    if (!payment) throw new NotFoundException('To\'lov topilmadi');

    const [updatedPayment] = await this.prisma.$transaction([
      this.prisma.payment.update({
        where: { orderId },
        data: { status: 'PAID', method, provider: 'manual' },
      }),
      this.prisma.order.update({ where: { id: orderId }, data: { status: 'PAID' } }),
    ]);
    return updatedPayment;
  }
}
