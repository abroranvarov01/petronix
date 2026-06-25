import { Injectable, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

type Status = 'PENDING' | 'APPROVED' | 'BLOCKED';
type UserRole = 'ADMIN' | 'DEALER';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  // Full list for the admin panel (never exposes password hashes).
  async findAll() {
    return this.prisma.user.findMany({
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        createdAt: true,
        _count: { select: { products: true } },
      },
    });
  }

  async setStatus(id: string, status: Status, actorId: string) {
    if (id === actorId) {
      throw new ForbiddenException('O\'z akkountingiz holatini o\'zgartira olmaysiz');
    }
    await this.getOrFail(id);
    return this.prisma.user.update({
      where: { id },
      data: { status },
      select: { id: true, status: true },
    });
  }

  async setRole(id: string, role: UserRole, actorId: string) {
    if (id === actorId) {
      throw new ForbiddenException('O\'z rolingizni o\'zgartira olmaysiz');
    }
    const user = await this.getOrFail(id);
    // Don't allow removing the last admin.
    if (user.role === 'ADMIN' && role !== 'ADMIN') {
      await this.assertNotLastAdmin();
    }
    return this.prisma.user.update({
      where: { id },
      data: { role },
      select: { id: true, role: true },
    });
  }

  async remove(id: string, actorId: string) {
    if (id === actorId) {
      throw new ForbiddenException('O\'zingizni o\'chira olmaysiz');
    }
    const user = await this.getOrFail(id);
    if (user.role === 'ADMIN') {
      await this.assertNotLastAdmin();
    }
    // Product.ownerId is optional → products are kept, just unlinked from owner.
    await this.prisma.user.delete({ where: { id } });
    return { ok: true };
  }

  private async getOrFail(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Foydalanuvchi topilmadi');
    return user;
  }

  private async assertNotLastAdmin() {
    const admins = await this.prisma.user.count({ where: { role: 'ADMIN' } });
    if (admins <= 1) {
      throw new BadRequestException('Oxirgi administratorni o\'chirib yoki rolini o\'zgartirib bo\'lmaydi');
    }
  }
}
