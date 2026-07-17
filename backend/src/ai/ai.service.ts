import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Phase 3: Predictive AI Mock Service
   * Analyzes an asset's telemetry history to predict failure probabilities.
   */
  async predictFailureProbability(assetId: string): Promise<{ probability: number, reasoning: string }> {
    const asset = await this.prisma.asset.findUnique({
      where: { id: assetId },
      include: { maintenance: true }
    });

    if (!asset) {
      return { probability: 0, reasoning: 'Asset not found.' };
    }

    // Mock AI Logic:
    // 1. Older assets have higher base probability.
    const ageInYears = (Date.now() - asset.purchaseDate.getTime()) / (1000 * 60 * 60 * 24 * 365);
    let probability = Math.min(ageInYears * 0.1, 0.5); // Max 50% from age alone

    // 2. High maintenance history increases probability.
    if (asset.maintenance && asset.maintenance.length > 3) {
      probability += 0.3;
    }

    // 3. Random telemetry fluctuation simulation.
    probability += Math.random() * 0.15;

    probability = Math.min(Math.max(probability, 0), 1); // Clamp 0-1

    let reasoning = 'Asset is operating within normal parameters.';
    if (probability > 0.8) {
      reasoning = 'CRITICAL: High failure probability detected based on historical telemetry and age.';
    } else if (probability > 0.5) {
      reasoning = 'WARNING: Moderate risk of failure. Recommend scheduling preventative maintenance.';
    }

    this.logger.log(`AI Prediction for ${asset.tagId}: ${(probability * 100).toFixed(1)}% failure risk.`);

    return { probability, reasoning };
  }
}
