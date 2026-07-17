import { Test, TestingModule } from '@nestjs/testing';
import { BlockchainService } from './blockchain.service';

describe('BlockchainService', () => {
  let service: BlockchainService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BlockchainService],
    }).compile();
    service = module.get<BlockchainService>(BlockchainService);
  });

  describe('anchorTransaction', () => {
    it('should produce a valid block with a hash', async () => {
      const block = await service.anchorTransaction('asset-1', { action: 'CHECKOUT' });
      expect(block.hash).toBeDefined();
      expect(block.hash).toHaveLength(64); // SHA-256 hex = 64 chars
      expect(block.assetId).toBe('asset-1');
      expect(block.previousHash).toBe('0');
    });

    it('should link blocks via previousHash', async () => {
      const block1 = await service.anchorTransaction('asset-1', { action: 'CHECKOUT' });
      const block2 = await service.anchorTransaction('asset-1', { action: 'CHECKIN' }, block1.hash);
      expect(block2.previousHash).toBe(block1.hash);
    });

    it('should produce different hashes for different operations', async () => {
      const block1 = await service.anchorTransaction('asset-1', { action: 'CHECKOUT' });
      const block2 = await service.anchorTransaction('asset-1', { action: 'MAINTENANCE' });
      expect(block1.hash).not.toBe(block2.hash);
    });
  });

  describe('verifyChainIntegrity', () => {
    it('should return true for a valid chain', async () => {
      const block1 = await service.anchorTransaction('asset-1', { action: 'CHECKOUT' });
      const block2 = await service.anchorTransaction('asset-1', { action: 'CHECKIN' }, block1.hash);
      const isValid = await service.verifyChainIntegrity([block1, block2]);
      expect(isValid).toBe(true);
    });

    it('should return false if a block hash is tampered', async () => {
      const block1 = await service.anchorTransaction('asset-1', { action: 'CHECKOUT' });
      const block2 = await service.anchorTransaction('asset-1', { action: 'CHECKIN' }, block1.hash);
      // Tamper with block data
      block2.data = { action: 'TAMPERED' };
      const isValid = await service.verifyChainIntegrity([block1, block2]);
      expect(isValid).toBe(false);
    });

    it('should return true for a single-block chain', async () => {
      const block = await service.anchorTransaction('asset-1', { action: 'CHECKOUT' });
      const isValid = await service.verifyChainIntegrity([block]);
      expect(isValid).toBe(true);
    });
  });
});
