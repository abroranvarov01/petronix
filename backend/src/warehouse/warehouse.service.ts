import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

type MovementType = 'RECEIPT' | 'SALE' | 'WRITE_OFF' | 'TRANSFER_IN' | 'TRANSFER_OUT' | 'ADJUSTMENT';

interface MovementInput {
  productId: string;
  warehouseId?: string;
  type: MovementType;
  qty: number; // signed: + adds to stock, − removes
  unitCost?: number;
  reason?: string;
  refType?: string;
  refId?: string;
  userId?: string;
}

interface AuthUser {
  sub: string;
  role: string;
}

@Injectable()
export class WarehouseService {
  constructor(private prisma: PrismaService) {}

  /** Find the default warehouse, creating one on first use. */
  async getDefaultWarehouse() {
    let wh = await this.prisma.warehouse.findFirst({ where: { isDefault: true } });
    if (!wh) {
      wh = await this.prisma.warehouse.create({ data: { name: 'Asosiy ombor', isDefault: true } });
    }
    return wh;
  }

  async listWarehouses() {
    return this.prisma.warehouse.findMany({ orderBy: { createdAt: 'asc' } });
  }

  /**
   * The single entry point for any stock change. Writes an append-only
   * StockMovement and updates the Stock projection in one transaction.
   */
  async applyMovement(input: MovementInput) {
    const warehouseId = input.warehouseId ?? (await this.getDefaultWarehouse()).id;
    const stock = await this.prisma.$transaction(async (tx) => {
      await tx.stockMovement.create({
        data: {
          productId: input.productId,
          warehouseId,
          type: input.type,
          qty: input.qty,
          unitCost: input.unitCost ?? 0,
          reason: input.reason ?? '',
          refType: input.refType ?? '',
          refId: input.refId ?? '',
          userId: input.userId ?? null,
        },
      });
      return tx.stock.upsert({
        where: { productId_warehouseId: { productId: input.productId, warehouseId } },
        create: { productId: input.productId, warehouseId, quantity: input.qty },
        update: { quantity: { increment: input.qty } },
      });
    });

    // Low-stock alert (best-effort, never blocks)
    if (input.qty < 0 && stock.minQuantity > 0 && stock.quantity <= stock.minQuantity) {
      this.notifyLowStock(input.productId, stock.quantity).catch(() => {});
    }
    return stock;
  }

  /** Receipt of goods (приход) — increases stock. */
  async receipt(productId: string, qty: number, unitCost: number, warehouseId: string, refId = '', userId?: string) {
    return this.applyMovement({
      productId, warehouseId, type: 'RECEIPT', qty: Math.abs(qty), unitCost,
      reason: 'Приход', refType: 'supply', refId, userId,
    });
  }

  /** Manual write-off — decreases stock. */
  async writeOff(productId: string, qty: number, reason: string, user: AuthUser, warehouseId?: string) {
    return this.applyMovement({
      productId, warehouseId, type: 'WRITE_OFF', qty: -Math.abs(qty), reason, userId: user.sub,
    });
  }

  /** Set stock to an exact value via an ADJUSTMENT movement. */
  async adjust(productId: string, targetQty: number, reason: string, user: AuthUser, warehouseId?: string) {
    const wid = warehouseId ?? (await this.getDefaultWarehouse()).id;
    const current = await this.prisma.stock.findUnique({
      where: { productId_warehouseId: { productId, warehouseId: wid } },
    });
    const delta = targetQty - (current?.quantity ?? 0);
    return this.applyMovement({
      productId, warehouseId: wid, type: 'ADJUSTMENT', qty: delta,
      reason: reason || 'Корректировка', userId: user.sub,
    });
  }

  async setMinQuantity(productId: string, minQuantity: number, warehouseId?: string) {
    const wid = warehouseId ?? (await this.getDefaultWarehouse()).id;
    return this.prisma.stock.upsert({
      where: { productId_warehouseId: { productId, warehouseId: wid } },
      create: { productId, warehouseId: wid, quantity: 0, minQuantity },
      update: { minQuantity },
    });
  }

  /** Current stock list. Dealers see only their own products. */
  async listStock(user: AuthUser) {
    const where = user.role === 'ADMIN' ? {} : { product: { ownerId: user.sub } };
    return this.prisma.stock.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      include: {
        product: { select: { id: true, nameUz: true, nameRu: true, nameEn: true, unit: true, costPrice: true, ownerId: true } },
        warehouse: { select: { id: true, name: true } },
      },
    });
  }

  async listMovements(user: AuthUser, productId?: string) {
    const where: any = {};
    if (productId) where.productId = productId;
    if (user.role !== 'ADMIN') where.product = { ownerId: user.sub };
    return this.prisma.stockMovement.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 200,
      include: { product: { select: { nameUz: true, nameRu: true, nameEn: true } } },
    });
  }

  // ── Order integration ────────────────────────────────────────────────
  /** Decrease stock for each order item (called when an order is confirmed/paid). */
  async postOrderSale(order: { id: string; items: { productId: string; qty: number; unitPrice: number }[] }, userId?: string) {
    const wh = await this.getDefaultWarehouse();
    for (const it of order.items) {
      await this.applyMovement({
        productId: it.productId, warehouseId: wh.id, type: 'SALE', qty: -Math.abs(it.qty),
        unitCost: it.unitPrice, reason: 'Продажа', refType: 'order', refId: order.id, userId,
      });
    }
  }

  /** Reverse a previously posted sale (called when an order is cancelled). */
  async reverseOrderSale(order: { id: string; items: { productId: string; qty: number }[] }, userId?: string) {
    const wh = await this.getDefaultWarehouse();
    for (const it of order.items) {
      await this.applyMovement({
        productId: it.productId, warehouseId: wh.id, type: 'ADJUSTMENT', qty: Math.abs(it.qty),
        reason: 'Возврат (отмена заказа)', refType: 'order', refId: order.id, userId,
      });
    }
  }

  private async notifyLowStock(productId: string, quantity: number) {
    const botToken = process.env.BOT_TOKEN ?? process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.ADMIN_CHAT_ID ?? process.env.TELEGRAM_CHAT_ID;
    if (!botToken || !chatId) return;
    const p = await this.prisma.product.findUnique({ where: { id: productId } });
    const name = p ? p.nameUz || p.nameRu || p.nameEn : productId;
    const text = `⚠️ *Kam qoldiq!*\n\n📦 ${name}\n📉 Qoldiq: ${quantity}`;
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown' }),
    });
  }
}
