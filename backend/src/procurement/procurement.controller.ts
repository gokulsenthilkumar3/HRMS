import { Controller, Get, Post, Body, Req } from '@nestjs/common';
import { ProcurementService } from './procurement.service';

@Controller('procurement')
export class ProcurementController {
  constructor(private readonly procurementService: ProcurementService) {}

  @Get('vendors')
  getVendors() {
    return { vendors: [] };
  }

  @Get('requests')
  getPurchaseRequests() {
    return { purchaseRequests: [] };
  }

  @Post('auto-replenish')
  async triggerAutoReplenish(@Req() req: any, @Body() data: { assetTypeId: string, threshold: number }) {
    // Note: Assuming JwtAuthGuard is added, else we mock user id
    const userId = req.user ? req.user.sub : 'system-override';
    return this.procurementService.autoReplenish(data.assetTypeId, data.threshold, userId);
  }
}
