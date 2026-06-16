import { Controller, Post, Body, Get, UseGuards, Req } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { AuthGuard } from './auth.guard';
import { RolesGuard } from './roles.guard';
import { Roles } from './roles.decorator';
import { LoginDto, RegisterDto, CreateUserDto } from './auth.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  @Post('register')
  register(@Body() body: RegisterDto) {
    // Public registration is always a DEALER — role cannot be supplied here.
    return this.authService.register({ email: body.email, password: body.password, name: body.name });
  }

  // Admin-only: create staff/admin accounts with an explicit role.
  @ApiBearerAuth()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post('users')
  createUser(@Body() body: CreateUserDto) {
    return this.authService.createUser(body);
  }

  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  @Post('login')
  login(@Body() body: LoginDto) {
    return this.authService.login(body.email, body.password);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Get('profile')
  getProfile(@Req() req: any) {
    return this.authService.getProfile(req.user.sub);
  }
}
