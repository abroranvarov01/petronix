import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'admin@petronix.uz' })
  email: string;

  @ApiProperty({ example: 'admin123' })
  password: string;
}

export class RegisterDto {
  @ApiProperty({ example: 'user@mail.com' })
  email: string;

  @ApiProperty({ example: 'mypassword' })
  password: string;

  @ApiProperty({ example: 'John' })
  name: string;
}

// Admin-only: creating staff/admin accounts. Role is accepted ONLY here,
// behind an ADMIN guard — never on public /register.
export class CreateUserDto {
  @ApiProperty({ example: 'staff@mail.com' })
  email: string;

  @ApiProperty({ example: 'strongpassword' })
  password: string;

  @ApiProperty({ example: 'Staff' })
  name: string;

  @ApiProperty({ enum: ['ADMIN', 'DEALER'], default: 'DEALER' })
  role: 'ADMIN' | 'DEALER';
}
