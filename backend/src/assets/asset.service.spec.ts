import { Test, TestingModule } from '@nestjs/testing';
import { AssetService } from './asset.service';
import { PrismaService } from '../prisma/prisma.service';
import { DepreciationService } from './depreciation.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

const mockPrisma = {
  asset: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  assetType: { findMany: jest.fn(), create: jest.fn() },
  location: { findMany: jest.fn(), create: jest.fn() },
  auditLog: { findMany: jest.fn(), create: jest.fn() },
  assetAssignment: { findFirst: jest.fn(), create: jest.fn(), update: jest.fn() },
  $transaction: jest.fn((cb) => cb(mockPrisma)),
};

const mockDepreciation = {
  calculateDepreciation: jest.fn().mockReturnValue({
    monthlyDepreciation: 100,
    currentValue: 800,
    depreciatedPercent: 20,
  }),
};

describe('AssetService', () => {
  let service: AssetService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssetService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: DepreciationService, useValue: mockDepreciation },
      ],
    }).compile();
    service = module.get<AssetService>(AssetService);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated assets', async () => {
      mockPrisma.asset.findMany.mockResolvedValue([{ id: '1', modelName: 'ThinkPad' }]);
      mockPrisma.asset.count.mockResolvedValue(1);
      const result = await service.findAll(1, 20);
      expect(result.total).toBe(1);
      expect(result.data).toHaveLength(1);
    });

    it('should apply search filter', async () => {
      mockPrisma.asset.findMany.mockResolvedValue([]);
      mockPrisma.asset.count.mockResolvedValue(0);
      await service.findAll(1, 20, 'ThinkPad');
      expect(mockPrisma.asset.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ OR: expect.any(Array) }) }),
      );
    });
  });

  describe('findOne', () => {
    it('should find asset by UUID', async () => {
      const mockAsset = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        modelName: 'ThinkPad',
        purchasePrice: 1000,
        purchaseDate: new Date(),
        type: { lifespanYears: 5 },
        location: {},
        assignments: [],
        maintenance: [],
      };
      mockPrisma.asset.findFirst.mockResolvedValue(mockAsset);
      const result = await service.findOne('550e8400-e29b-41d4-a716-446655440000');
      expect(result.id).toBe(mockAsset.id);
      expect(result.depreciation).toBeDefined();
    });

    it('should throw NotFoundException for missing asset', async () => {
      mockPrisma.asset.findFirst.mockResolvedValue(null);
      await expect(service.findOne('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteAsset', () => {
    it('should throw BadRequestException if asset is ASSIGNED', async () => {
      mockPrisma.asset.findUnique.mockResolvedValue({ id: '1', status: 'ASSIGNED' });
      await expect(service.deleteAsset('1')).rejects.toThrow(BadRequestException);
    });

    it('should delete asset if AVAILABLE', async () => {
      mockPrisma.asset.findUnique.mockResolvedValue({ id: '1', status: 'AVAILABLE' });
      mockPrisma.asset.delete.mockResolvedValue({ id: '1' });
      const result = await service.deleteAsset('1');
      expect(result.id).toBe('1');
    });
  });

  describe('checkoutAsset', () => {
    it('should throw if asset is not AVAILABLE', async () => {
      mockPrisma.asset.findUnique.mockResolvedValue({ id: '1', status: 'ASSIGNED', tagId: 'TAG-001' });
      await expect(service.checkoutAsset('1', 'user1', 'sig')).rejects.toThrow(BadRequestException);
    });
  });

  describe('checkinAsset', () => {
    it('should throw if asset is not ASSIGNED', async () => {
      mockPrisma.asset.findUnique.mockResolvedValue({ id: '1', status: 'AVAILABLE', tagId: 'TAG-001' });
      await expect(service.checkinAsset('1', 'user1')).rejects.toThrow(BadRequestException);
    });
  });
});
