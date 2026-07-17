import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProcurementService {
  constructor(private prisma: PrismaService) {}

  async autoReplenish(assetTypeId: string, threshold: number, requestedById: string) {
    // 1. Check stock of a certain asset type
    const count = await this.prisma.asset.count({
      where: { typeId: assetTypeId, status: 'AVAILABLE' }
    });

    if (count <= threshold) {
      const type = await this.prisma.assetType.findUnique({ where: { id: assetTypeId } });
      if (!type) throw new Error('Asset type not found');

      // 2. Find preferred vendor (mock logic: just first vendor)
      const vendor = await this.prisma.vendor.findFirst();

      // 3. Generate a PurchaseRequest
      const req = await this.prisma.purchaseRequest.create({
        data: {
          title: `Auto-Replenish: ${type.name}`,
          description: `Stock dropped to ${count} (Threshold: ${threshold}). Requesting batch order.`,
          expectedCost: 1500, // Mock cost
          status: 'ORDERED', // Automatically push to ordered
          requestedById,
          vendorId: vendor ? vendor.id : undefined,
        }
      });
      return { replenished: true, request: req, message: `Auto-replenishment triggered for ${type.name}` };
    }
    return { replenished: false, currentStock: count, message: 'Stock levels are sufficient.' };
  }
}
