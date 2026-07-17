import { Injectable, ForbiddenException, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

// Deterministic PRNG (mulberry32) seeded from a string, so the same `seed`
// yields the same product order across paginated requests.
function hashSeed(str: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function seededShuffle<T>(arr: T[], seed: string): T[] {
  let a = hashSeed(seed);
  const rand = () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService, private redis: RedisService) {}

  // Публичный список — без costPrice и wholesalePrice.
  // Серверный фильтр (type/subtype), поиск (q) и пагинация.
  async findAllPublic(params: {
    type?: string;
    subtype?: string;
    q?: string;
    page?: number | string;
    limit?: number | string;
    seed?: string;
  }) {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.min(60, Math.max(1, Number(params.limit) || 24));
    const skip = (page - 1) * limit;
    const q = (params.q ?? '').trim();
    // Products are displayed in a shuffled order. The seed keeps the order
    // stable across pages (so "load more" never repeats an item); a fresh
    // page visit sends a new seed and reshuffles.
    const seed = (params.seed ?? '').trim() || 'default';

    // `subtype` may be a comma-separated list — match products having ANY of them.
    const subtypeList = (params.subtype ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const where: any = {
      ...(params.type ? { types: { has: params.type } } : {}),
      ...(subtypeList.length ? { subtypes: { hasSome: subtypeList } } : {}),
      ...(q
        ? {
            OR: [
              { nameUz: { contains: q, mode: 'insensitive' } },
              { nameRu: { contains: q, mode: 'insensitive' } },
              { nameEn: { contains: q, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    // Cache the (hot) public catalog reads; invalidated on any product write.
    const cacheKey = `products:list:${JSON.stringify({ type: params.type ?? '', subtype: params.subtype ?? '', q, page, limit, seed })}`;
    return this.redis.wrap(cacheKey, 30, async () => {
      // Stable base order (by id) → deterministic seeded shuffle → page slice.
      // Shuffling the full id list keeps pagination consistent for one seed.
      const all = await this.prisma.product.findMany({
        where,
        orderBy: { id: 'asc' },
        select: { id: true },
      });
      const total = all.length;
      const pageIds = seededShuffle(all.map((p) => p.id), seed).slice(skip, skip + limit);

      const rows = pageIds.length
        ? await this.prisma.product.findMany({
            where: { id: { in: pageIds } },
            select: {
              id: true,
              nameUz: true,
              nameRu: true,
              nameEn: true,
              descriptionUz: true,
              descriptionRu: true,
              descriptionEn: true,
              types: true,
              subtypes: true,
              image: true,
              isOriginal: true,
              sellPrice: true,
              owner: { select: { id: true, name: true } },
              createdAt: true,
              updatedAt: true,
            },
          })
        : [];

      // `IN (...)` doesn't preserve order — reorder to the shuffled sequence.
      const byId = new Map(rows.map((r) => [r.id, r]));
      const items = pageIds.map((id) => byId.get(id)).filter(Boolean);

      return { items, total, page, limit, pages: Math.ceil(total / limit) };
    });
  }

  // Публичный один товар
  async findOnePublic(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      select: {
        id: true,
        nameUz: true,
        nameRu: true,
        nameEn: true,
        descriptionUz: true,
        descriptionRu: true,
        descriptionEn: true,
        types: true,
        subtypes: true,
        image: true,
        images: true,
        isOriginal: true,
        sellPrice: true,
        owner: { select: { id: true, name: true } },
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!product) throw new NotFoundException('Mahsulot topilmadi');
    return product;
  }

  // Полный список с ценами (для авторизованных). take-лимит — защита от OOM.
  async findAll() {
    return this.prisma.product.findMany({
      orderBy: { createdAt: 'desc' },
      take: 1000,
      include: { owner: { select: { id: true, name: true, role: true } } },
    });
  }

  async create(data: any) {
    const created = await this.prisma.product.create({ data });
    await this.redis.delPattern('products:*');
    return created;
  }

  async update(id: string, data: any, user: { sub: string; role: string }) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('Mahsulot topilmadi');

    // Только автор или админ может обновить
    if (user.role !== 'ADMIN' && product.ownerId !== user.sub) {
      throw new ForbiddenException('Faqat o\'z mahsulotingizni tahrirlashingiz mumkin');
    }

    // Не даём менять ownerId
    const { ownerId, ...rest } = data;
    const updated = await this.prisma.product.update({ where: { id }, data: rest });
    await this.redis.delPattern('products:*');
    return updated;
  }

  async remove(id: string, user: { sub: string; role: string }) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('Mahsulot topilmadi');

    if (user.role !== 'ADMIN' && product.ownerId !== user.sub) {
      throw new ForbiddenException('Faqat o\'z mahsulotingizni o\'chirishingiz mumkin');
    }

    try {
      const removed = await this.prisma.product.delete({ where: { id } });
      await this.redis.delPattern('products:*');
      return removed;
    } catch (e: any) {
      // P2003 — a foreign key still points at the product (e.g. the migration
      // relaxing OrderItem/SupplyItem delete rules hasn't been applied yet).
      if (e?.code === 'P2003') {
        throw new ConflictException(
          "Mahsulot buyurtmalar yoki kirimlarda ishlatilgan — o'chirib bo'lmaydi",
        );
      }
      throw e;
    }
  }
}
