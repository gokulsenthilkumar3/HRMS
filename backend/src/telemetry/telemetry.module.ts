import { Module } from '@nestjs/common';
import { TelemetryGateway } from './telemetry.gateway';
import { AiModule } from '../ai/ai.module';

import { WebhookService } from './webhook.service';

@Module({
  imports: [AiModule],
  providers: [TelemetryGateway, WebhookService],
  exports: [WebhookService],
})
export class TelemetryModule {}
