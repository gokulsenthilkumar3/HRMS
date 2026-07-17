import { Test, TestingModule } from '@nestjs/testing';
import { MaintenanceEngine } from './maintenance.engine';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';
import { MaintenanceStatus } from './dto/update-maintenance.dto';

const mockPrisma = {
  maintenanceRecord: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
};

describe('MaintenanceEngine', () => {
  let engine: MaintenanceEngine;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MaintenanceEngine,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    engine = module.get<MaintenanceEngine>(MaintenanceEngine);
    jest.clearAllMocks();
  });

  describe('predictAssetHealth', () => {
    it('should return CRITICAL for high temperature', async () => {
      const result = await engine.predictAssetHealth(
        { assetId: 'a1', temperature: 90, cpuUsage: 50, diskIOPs: 100, runtimeHours: 1000 },
        5,
      );
      expect(result).toBe('CRITICAL');
    });

    it('should return WARNING for elevated temperature', async () => {
      const result = await engine.predictAssetHealth(
        { assetId: 'a1', temperature: 75, cpuUsage: 50, diskIOPs: 100, runtimeHours: 1000 },
        5,
      );
      expect(result).toBe('WARNING');
    });

    it('should return HEALTHY for normal telemetry', async () => {
      const result = await engine.predictAssetHealth(
        { assetId: 'a1', temperature: 55, cpuUsage: 40, diskIOPs: 100, runtimeHours: 100 },
        5,
      );
      expect(result).toBe('HEALTHY');
    });

    it('should return CRITICAL for near end-of-life wear', async () => {
      const lifespanHours = 5 * 365 * 24;
      const result = await engine.predictAssetHealth(
        { assetId: 'a1', temperature: 60, cpuUsage: 50, diskIOPs: 100, runtimeHours: lifespanHours * 0.95 },
        5,
      );
      expect(result).toBe('CRITICAL');
    });
  });

  describe('updateRecord', () => {
    it('should throw NotFoundException for missing record', async () => {
      mockPrisma.maintenanceRecord.findUnique.mockResolvedValue(null);
      await expect(engine.updateRecord('bad-id', MaintenanceStatus.COMPLETED)).rejects.toThrow(NotFoundException);
    });

    it('should set completedAt when status is COMPLETED', async () => {
      mockPrisma.maintenanceRecord.findUnique.mockResolvedValue({ id: '1' });
      mockPrisma.maintenanceRecord.update.mockResolvedValue({ id: '1', status: MaintenanceStatus.COMPLETED });
      await engine.updateRecord('1', MaintenanceStatus.COMPLETED, 'Fixed thermal paste');
      expect(mockPrisma.maintenanceRecord.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ completedAt: expect.any(Date) }),
        }),
      );
    });
  });
});
