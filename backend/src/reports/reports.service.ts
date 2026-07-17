import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async getAuditExport() {
    return this.prisma.auditLog.findMany({
      orderBy: { timestamp: 'desc' },
      include: {
        user: { select: { fullName: true, email: true } },
      },
    });
  }

  async getDepreciationExport() {
    const assets = await this.prisma.asset.findMany({
      include: { type: true },
      orderBy: { purchaseDate: 'asc' }
    });
    // This provides the raw data; depreciation can be computed by the client or extended here.
    return assets;
  }
}
