import { Module } from '@nestjs/common';
import { AssetController } from './asset.controller';
import { AssetService } from './asset.service';
import { DepreciationService } from './depreciation.service';
import { PrismaModule } from '../prisma/prisma.module';
import { BlockchainModule } from '../blockchain/blockchain.module';

@Module({
  imports: [PrismaModule, BlockchainModule],
  controllers: [AssetController],
  providers: [AssetService, DepreciationService],
  exports: [AssetService],
})
export class AssetsModule {}
