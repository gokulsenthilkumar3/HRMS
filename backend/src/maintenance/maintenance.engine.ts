import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMaintenanceDto, MaintenancePriority } from './dto/create-maintenance.dto';
import { UpdateMaintenanceDto, MaintenanceStatus } from './dto/update-maintenance.dto';

interface TelemetryData {
  assetId: string;
  temperature: number;
  cpuUsage: number;
  diskIOPs: number;
  runtimeHours: number;
}

export type HealthStatus = 'HEALTHY' | 'WARNING' | 'CRITICAL';

@Injectable()
export class MaintenanceEngine {
  constructor(private prisma: PrismaService) {}

  async getTriageQueue() {
    return this.prisma.maintenanceRecord.findMany({
      where: { status: { in: [MaintenanceStatus.OPEN, MaintenanceStatus.IN_PROGRESS] } },
      include: { asset: { include: { type: true, location: true } } },
      orderBy: [
        // Sort CRITICAL first, then by scheduled date
        { priority: 'asc' },
        { scheduledDate: 'asc' },
      ],
    });
  }

  async findAll() {
    return this.prisma.maintenanceRecord.findMany({
      include: { asset: { include: { type: true, location: true } } },
      orderBy: { scheduledDate: 'desc' },
    });
  }

  async createRecord(dto: CreateMaintenanceDto) {
    return this.prisma.maintenanceRecord.create({
      data: {
        assetId: dto.assetId,
        issueType: dto.issueType,
        description: dto.description,
        // priority is now a proper DB column, not a string hack in technicianNotes
        priority: dto.priority ?? MaintenancePriority.MEDIUM,
        scheduledDate: dto.scheduledDate ? new Date(dto.scheduledDate) : new Date(),
        status: MaintenanceStatus.OPEN,
      },
      include: { asset: { include: { type: true, location: true } } },
    });
  }

  async updateRecord(id: string, status: MaintenanceStatus, technicianNotes?: string) {
    const record = await this.prisma.maintenanceRecord.findUnique({ where: { id } });
    if (!record) throw new NotFoundException('Maintenance record not found');
    return this.prisma.maintenanceRecord.update({
      where: { id },
      data: {
        status,
        ...(technicianNotes !== undefined && { technicianNotes }),
        ...(status === MaintenanceStatus.COMPLETED && { completedAt: new Date() }),
      },
      include: { asset: { include: { type: true } } },
    });
  }

  /**
   * Multi-factor heuristic health scoring.
   * Score weights:
   *   Temperature > 85°C  = +50 (instant CRITICAL thermal threshold)
   *   Temperature > 70°C  = +20
   *   CPU > 90% sustained  = +15
   *   Wear > 90% lifespan  = +30
   *   Wear > 75% lifespan  = +10
   *   diskIOPs < 50 (degraded drive) = +20
   */
  predictAssetHealth(telemetry: TelemetryData, lifespanYears: number): HealthStatus {
    const lifespanHours = lifespanYears * 365 * 24;
    const wearLevel = telemetry.runtimeHours / lifespanHours;
    let riskScore = 0;

    if (telemetry.temperature > 85) riskScore += 50;
    else if (telemetry.temperature > 70) riskScore += 20;

    if (telemetry.cpuUsage > 90) riskScore += 15;

    if (wearLevel > 0.9) riskScore += 30;
    else if (wearLevel > 0.75) riskScore += 10;

    if (telemetry.diskIOPs > 0 && telemetry.diskIOPs < 50) riskScore += 20;

    if (riskScore >= 50) return 'CRITICAL';
    if (riskScore >= 20) return 'WARNING';
    return 'HEALTHY';
  }

  async getForecast(assetId: string) {
    const [asset, records] = await Promise.all([
      this.prisma.asset.findUnique({
        where: { id: assetId },
        include: { type: true },
      }),
      this.prisma.maintenanceRecord.findMany({
        where: { assetId },
        orderBy: { scheduledDate: 'desc' },
        take: 10,
      }),
    ]);

    if (!asset) throw new NotFoundException('Asset not found');

    const completedRecords = records.filter((r) => r.status === MaintenanceStatus.COMPLETED);
    const openRecords = records.filter((r) =>
      [MaintenanceStatus.OPEN, MaintenanceStatus.IN_PROGRESS].includes(r.status as MaintenanceStatus),
    );

    // Calculate health score: base 100, deduct for each maintenance event.
    // Recent events (last 90 days) weigh heavier.
    const now = Date.now();
    const ninetyDaysMs = 90 * 24 * 60 * 60 * 1000;
    let healthScore = 100;
    for (const r of completedRecords) {
      const ageMs = now - new Date(r.scheduledDate).getTime();
      healthScore -= ageMs < ninetyDaysMs ? 12 : 5;
    }
    healthScore = Math.max(0, Math.min(100, healthScore));

    // Predict next scheduled date based on average interval between past maintenance.
    let nextScheduledDate: string;
    if (completedRecords.length >= 2) {
      const intervals: number[] = [];
      for (let i = 0; i < completedRecords.length - 1; i++) {
        const diff =
          new Date(completedRecords[i].scheduledDate).getTime() -
          new Date(completedRecords[i + 1].scheduledDate).getTime();
        intervals.push(Math.abs(diff));
      }
      const avgIntervalMs = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      nextScheduledDate = new Date(now + avgIntervalMs).toISOString();
    } else {
      // Default: schedule 30 days out if no history
      const next = new Date();
      next.setDate(next.getDate() + 30);
      nextScheduledDate = next.toISOString();
    }

    // Derive predicted issues from issue types in recent history.
    const recentIssueTypes = completedRecords
      .filter((r) => now - new Date(r.scheduledDate).getTime() < ninetyDaysMs)
      .map((r) => r.issueType);
    const issueFrequency: Record<string, number> = {};
    for (const t of recentIssueTypes) {
      issueFrequency[t] = (issueFrequency[t] ?? 0) + 1;
    }
    const predictedIssues = Object.entries(issueFrequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([type, count]) => `${type.replace(/_/g, ' ')} (occurred ${count}x recently)`);

    return {
      assetId,
      assetName: asset.modelName,
      historicalCount: records.length,
      openCount: openRecords.length,
      nextScheduledDate,
      predictedIssues,
      healthScore,
    };
  }
}
