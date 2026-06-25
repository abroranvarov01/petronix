import { CanActivate, ExecutionContext, Injectable, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private jwt: JwtService, private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const header = request.headers.authorization;

    if (!header || !header.startsWith('Bearer ')) {
      throw new UnauthorizedException('Token topilmadi');
    }

    let payload: { sub: string; email: string; role: string };
    try {
      const token = header.split(' ')[1];
      payload = await this.jwt.verifyAsync(token);
    } catch {
      throw new UnauthorizedException('Token yaroqsiz');
    }

    // Enforce account status on every request so blocking/deletion takes
    // effect immediately, not only at the next login.
    const account = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { status: true, role: true },
    });
    if (!account) {
      throw new UnauthorizedException('Foydalanuvchi topilmadi');
    }
    if (account.status !== 'APPROVED') {
      throw new ForbiddenException('Akkountingiz faol emas');
    }

    // Use the current role from the DB (in case an admin just changed it).
    request.user = { ...payload, role: account.role };
    return true;
  }
}
