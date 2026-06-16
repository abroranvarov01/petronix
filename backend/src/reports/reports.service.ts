import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

// Order statuses that count as a realised sale
const SOLD = ['CONFIRMED', 'PAID', 'SHIPPED', 'COMPLETED'];

interface AuthUser {
  sub: string;
  role: string;
}
interface Range {
  from?: string;
  to?: string;
}

function parseRange(r: Range) {
  const to = r.to ? new Date(r.to) : new Date();
  const from = r.from ? new Date(r.from) : new Date(Date.now() - 30 * 24 * 3600 * 1000);
  // include the whole "to" day
  to.setHours(23, 59, 59, 999);
  return { from, to };
}

function bucketKey(d: Date, groupBy: string): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  if (groupBy === 'month') return `${y}-${m}`;
  if (groupBy === 'week') {
    // ISO-ish week start (Monday)
    const t = new Date(d);
    const wd = (t.getDay() + 6) % 7;
    t.setDate(t.getDate() - wd);
    return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
  }
  return `${y}-${m}-${day}`;
}

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService, private redis: RedisService) {}

  private cacheKey(name: string, user: AuthUser, params: Record<string, any>) {
    const scope = user.role === 'ADMIN' ? 'all' : `dealer:${user.sub}`;
    return `report:${name}:${scope}:${JSON.stringify(params)}`;
  }

  /** Load sold order items in range, filtered to the dealer's own items if not admin. */
  private async soldItems(range: Range, user: AuthUser) {
    const { from, to } = parseRange(range);
    return this.prisma.orderItem.findMany({
      where: {
        ...(user.role === 'ADMIN' ? {} : { sellerId: user.sub }),
        order: { status: { in: SOLD as any }, createdAt: { gte: from, lte: to } },
      },
      include: {
        order: { select: { id: true, createdAt: true } },
        product: { select: { costPrice: true, type: true, nameUz: true, nameRu: true, nameEn: true } },
      },
    });
  }

  async sales(range: Range, groupBy = 'day', user: AuthUser) {
    return this.redis.wrap(this.cacheKey('sales', user, { ...range, groupBy }), 60, async () => {
      const items = await this.soldItems(range, user);
      const buckets = new Map<string, { period: string; revenue: number; orders: Set<string>; qty: number }>();
      let revenue = 0;
      const allOrders = new Set<string>();
      for (const it of items) {
        const key = bucketKey(it.order.createdAt, groupBy);
        const b = buckets.get(key) ?? { period: key, revenue: 0, orders: new Set(), qty: 0 };
        b.revenue += it.subtotal;
        b.qty += it.qty;
        b.orders.add(it.orderId);
        buckets.set(key, b);
        revenue += it.subtotal;
        allOrders.add(it.orderId);
      }
      const rows = [...buckets.values()]
        .map((b) => ({ period: b.period, revenue: b.revenue, orders: b.orders.size, qty: b.qty }))
        .sort((a, b) => a.period.localeCompare(b.period));
      const orders = allOrders.size;
      return { rows, totals: { revenue, orders, avgCheck: orders ? revenue / orders : 0 } };
    });
  }

  async profit(range: Range, user: AuthUser) {
    return this.redis.wrap(this.cacheKey('profit', user, range), 60, async () => {
      const items = await this.soldItems(range, user);
      const byProduct = new Map<string, { name: string; revenue: number; cost: number; profit: number; qty: number }>();
      let revenue = 0;
      let cost = 0;
      for (const it of items) {
        const c = (it.product?.costPrice ?? 0) * it.qty;
        const r = it.subtotal;
        revenue += r;
        cost += c;
        const name = it.nameSnapshot || it.product?.nameUz || it.product?.nameRu || it.product?.nameEn || '';
        const p = byProduct.get(it.productId) ?? { name, revenue: 0, cost: 0, profit: 0, qty: 0 };
        p.revenue += r;
        p.cost += c;
        p.profit += r - c;
        p.qty += it.qty;
        byProduct.set(it.productId, p);
      }
      const profit = revenue - cost;
      const rows = [...byProduct.values()].sort((a, b) => b.profit - a.profit);
      return { rows, totals: { revenue, cost, profit, margin: revenue ? (profit / revenue) * 100 : 0 } };
    });
  }

  async turnover(range: Range, by = 'category', user: AuthUser) {
    return this.redis.wrap(this.cacheKey('turnover', user, { ...range, by }), 60, async () => {
      const items = await this.soldItems(range, user);
      const map = new Map<string, { key: string; revenue: number; qty: number }>();
      for (const it of items) {
        const key = by === 'dealer' ? (it.sellerId ?? '—') : (it.product?.type ?? '—');
        const g = map.get(key) ?? { key, revenue: 0, qty: 0 };
        g.revenue += it.subtotal;
        g.qty += it.qty;
        map.set(key, g);
      }
      let labels: Record<string, string> = {};
      if (by === 'dealer') {
        const ids = [...map.keys()].filter((k) => k !== '—');
        const users = await this.prisma.user.findMany({ where: { id: { in: ids } }, select: { id: true, name: true, email: true } });
        labels = Object.fromEntries(users.map((u) => [u.id, u.name || u.email]));
      } else {
        const slugs = [...map.keys()].filter((k) => k !== '—');
        const cats = await this.prisma.category.findMany({ where: { slug: { in: slugs } }, select: { slug: true, nameUz: true, nameRu: true, nameEn: true } });
        labels = Object.fromEntries(cats.map((c) => [c.slug, c.nameUz || c.nameRu || c.nameEn || c.slug]));
      }
      const rows = [...map.values()]
        .map((g) => ({ key: g.key, label: labels[g.key] ?? g.key, revenue: g.revenue, qty: g.qty }))
        .sort((a, b) => b.revenue - a.revenue);
      return { by, rows };
    });
  }

  async stock(user: AuthUser) {
    return this.redis.wrap(this.cacheKey('stock', user, {}), 30, async () => {
      const where = user.role === 'ADMIN' ? {} : { product: { ownerId: user.sub } };
      const rows = await this.prisma.stock.findMany({
        where,
        include: { product: { select: { nameUz: true, nameRu: true, nameEn: true, costPrice: true, unit: true, type: true } } },
      });
      let totalQty = 0;
      let totalValue = 0;
      const low: any[] = [];
      const byCategory = new Map<string, { qty: number; value: number }>();
      for (const s of rows) {
        const value = s.quantity * (s.product?.costPrice ?? 0);
        totalQty += s.quantity;
        totalValue += value;
        if (s.minQuantity > 0 && s.quantity <= s.minQuantity) {
          low.push({ name: s.product?.nameUz || s.product?.nameRu || s.product?.nameEn, quantity: s.quantity, minQuantity: s.minQuantity });
        }
        const cat = s.product?.type ?? '—';
        const c = byCategory.get(cat) ?? { qty: 0, value: 0 };
        c.qty += s.quantity;
        c.value += value;
        byCategory.set(cat, c);
      }
      const items = rows.map((s) => ({
        name: s.product?.nameUz || s.product?.nameRu || s.product?.nameEn,
        quantity: s.quantity,
        unit: s.product?.unit,
        costPrice: s.product?.costPrice ?? 0,
        value: s.quantity * (s.product?.costPrice ?? 0),
      })).sort((a, b) => b.value - a.value);
      return {
        items,
        byCategory: [...byCategory.entries()].map(([k, v]) => ({ category: k, ...v })),
        low,
        totals: { positions: rows.length, totalQty, totalValue },
      };
    });
  }
}
