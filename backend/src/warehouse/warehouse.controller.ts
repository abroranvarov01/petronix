import { Controller, Get, Post, Body, Query, Req, UseGuards } from '@nestjs/common';
import { WarehouseService } from './warehouse.service';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('warehouse')
@UseGuards(AuthGuard)
export class WarehouseController {
  constructor(private readonly warehouse: WarehouseService) {}

  @Get('warehouses')
  warehouses() {
    return this.warehouse.listWarehouses();
  }

  @Get('stock')
  stock(@Req() req: any) {
    return this.warehouse.listStock(req.user);
  }

  @Get('movements')
  movements(@Req() req: any, @Query('productId') productId?: string) {
    return this.warehouse.listMovements(req.user, productId);
  }

  // ── Admin-only stock operations ──
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Post('write-off')
  writeOff(@Req() req: any, @Body() body: { productId: string; qty: number; reason?: string; warehouseId?: string }) {
    return this.warehouse.writeOff(body.productId, body.qty, body.reason ?? '', req.user, body.warehouseId);
  }

  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Post('adjust')
  adjust(@Req() req: any, @Body() body: { productId: string; quantity: number; reason?: string; warehouseId?: string }) {
    return this.warehouse.adjust(body.productId, body.quantity, body.reason ?? '', req.user, body.warehouseId);
  }

  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Post('min-quantity')
  minQuantity(@Body() body: { productId: string; minQuantity: number; warehouseId?: string }) {
    return this.warehouse.setMinQuantity(body.productId, body.minQuantity, body.warehouseId);
  }
}
