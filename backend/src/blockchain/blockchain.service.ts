import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

interface TransactionBlock {
  id: string;
  assetId: string;
  timestamp: number;
  data: any;
  previousHash: string;
  hash: string;
}

@Injectable()
export class BlockchainService {
  /**
   * Generates a tamper-proof audit block for an asset operation.
   * This mimics a private blockchain ledger entry.
   */
  async anchorTransaction(assetId: string, operationData: any, previousHash: string = '0') {
    const timestamp = Date.now();
    
    // 1. Create unique payload
    const payload = JSON.stringify({
      assetId,
      operationData,
      timestamp,
      previousHash
    });

    // 2. Generate SHA-256 Hash
    const hash = crypto.createHash('sha256').update(payload).digest('hex');

    const block: TransactionBlock = {
      id: crypto.randomUUID(),
      assetId,
      timestamp,
      data: operationData,
      previousHash,
      hash
    };

    // 3. In production, this would be written to Hyperledger Fabric or AWS QLDB
    console.log(`[Blockchain] New Block Anchored: ${hash}`);
    
    return block;
  }

  /**
   * Verifies the integrity of an asset's history.
   * Compares the current database state against the hash chain.
   */
  async verifyChainIntegrity(blocks: TransactionBlock[]): Promise<boolean> {
    for (let i = 1; i < blocks.length; i++) {
      const currentBlock = blocks[i];
      const previousBlock = blocks[i - 1];

      // Re-calculate hash
      const payload = JSON.stringify({
        assetId: currentBlock.assetId,
        operationData: currentBlock.data,
        timestamp: currentBlock.timestamp,
        previousHash: currentBlock.previousHash
      });
      const recalculatedHash = crypto.createHash('sha256').update(payload).digest('hex');

      if (currentBlock.hash !== recalculatedHash || currentBlock.previousHash !== previousBlock.hash) {
        return false; // Chain compromised
      }
    }
    return true;
  }
}
