import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsIn, IsString, MaxLength, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'admin@petronix.uz' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'admin123' })
  @IsString()
  @MaxLength(128)
  password: string;
}

export class RegisterDto {
  @ApiProperty({ example: 'user@mail.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'mypassword' })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password: string;

  @ApiProperty({ example: 'John' })
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name: string;
}

// Admin-only: creating staff/admin accounts. Role is accepted ONLY here,
// behind an ADMIN guard — never on public /register.
export class CreateUserDto {
  @ApiProperty({ example: 'staff@mail.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'strongpassword' })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password: string;

  @ApiProperty({ example: 'Staff' })
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name: string;

  @ApiProperty({ enum: ['ADMIN', 'DEALER'], default: 'DEALER' })
  @IsIn(['ADMIN', 'DEALER'])
  role: 'ADMIN' | 'DEALER';
}
