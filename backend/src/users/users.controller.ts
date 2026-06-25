import { Controller, Get, Patch, Delete, Param, Body, UseGuards, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsIn } from 'class-validator';
import { UsersService } from './users.service';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

class SetStatusDto {
  @IsIn(['PENDING', 'APPROVED', 'BLOCKED'])
  status: 'PENDING' | 'APPROVED' | 'BLOCKED';
}

class SetRoleDto {
  @IsIn(['ADMIN', 'DEALER'])
  role: 'ADMIN' | 'DEALER';
}

// All endpoints are ADMIN-only.
@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Patch(':id/status')
  setStatus(@Req() req: any, @Param('id') id: string, @Body() body: SetStatusDto) {
    return this.usersService.setStatus(id, body.status, req.user.sub);
  }

  @Patch(':id/role')
  setRole(@Req() req: any, @Param('id') id: string, @Body() body: SetRoleDto) {
    return this.usersService.setRole(id, body.role, req.user.sub);
  }

  @Delete(':id')
  remove(@Req() req: any, @Param('id') id: string) {
    return this.usersService.remove(id, req.user.sub);
  }
}
