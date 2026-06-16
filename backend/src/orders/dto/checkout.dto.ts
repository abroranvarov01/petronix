import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class CheckoutItemDto {
  @IsString()
  @MinLength(1)
  productId: string;

  @IsInt()
  @Min(1)
  @Max(10_000)
  qty: number;
}

export class CheckoutDto {
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  customerName: string;

  @IsString()
  @MinLength(3)
  @MaxLength(40)
  customerPhone: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  comment?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => CheckoutItemDto)
  items: CheckoutItemDto[];
}

export class UpdateOrderStatusDto {
  @IsString()
  @IsIn(['NEW', 'CONFIRMED', 'PAID', 'SHIPPED', 'COMPLETED', 'CANCELLED'])
  status: string;
}
