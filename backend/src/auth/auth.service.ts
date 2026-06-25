import { Injectable, UnauthorizedException, ConflictException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  // Public self-registration — ALWAYS a DEALER, and ALWAYS pending approval.
  // No token is returned: the dealer cannot log in until an admin approves.
  async register(data: { email: string; password: string; name: string }) {
    const existing = await this.prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      throw new ConflictException('Bu email allaqachon ro\'yxatdan o\'tgan');
    }

    const hash = await bcrypt.hash(data.password, 10);
    await this.prisma.user.create({
      data: {
        email: data.email,
        password: hash,
        name: data.name,
        role: 'DEALER',
        status: 'PENDING',
      },
    });

    return {
      pending: true,
      message: 'So\'rovingiz qabul qilindi. Administrator tasdiqlagach tizimga kira olasiz.',
    };
  }

  // Admin-only account creation (role allowed here, guarded at the controller).
  // Admin-created accounts are approved immediately.
  async createUser(data: { email: string; password: string; name: string; role: 'ADMIN' | 'DEALER' }) {
    const existing = await this.prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      throw new ConflictException('Bu email allaqachon ro\'yxatdan o\'tgan');
    }

    const hash = await bcrypt.hash(data.password, 10);
    const user = await this.prisma.user.create({
      data: {
        email: data.email,
        password: hash,
        name: data.name,
        role: data.role,
        status: 'APPROVED',
      },
    });

    return this.generateToken(user);
  }

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('Email yoki parol noto\'g\'ri');
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      throw new UnauthorizedException('Email yoki parol noto\'g\'ri');
    }

    if (user.status === 'PENDING') {
      throw new ForbiddenException('Akkountingiz hali administrator tomonidan tasdiqlanmagan');
    }
    if (user.status === 'BLOCKED') {
      throw new ForbiddenException('Akkountingiz bloklangan. Administrator bilan bog\'laning');
    }

    return this.generateToken(user);
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, role: true, createdAt: true },
    });
    return user;
  }

  private generateToken(user: { id: string; email: string; role: string }) {
    const payload = { sub: user.id, email: user.email, role: user.role };
    return {
      token: this.jwt.sign(payload),
      user: { id: user.id, email: user.email, role: user.role },
    };
  }
}
