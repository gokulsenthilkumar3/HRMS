import { 
  WebSocketGateway, 
  WebSocketServer, 
  SubscribeMessage, 
  OnGatewayConnection, 
  OnGatewayDisconnect,
  MessageBody
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { AiService } from '../ai/ai.service';
import { WebhookService } from './webhook.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: 'telemetry'
})
export class TelemetryGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(TelemetryGateway.name);
  private simulationInterval!: NodeJS.Timeout;

  constructor(
    private readonly aiService: AiService,
    private readonly webhookService: WebhookService,
  ) {}

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
    
    // Start simulating telemetry data when a client connects
    if (!this.simulationInterval) {
      this.simulationInterval = setInterval(() => this.broadcastTelemetry(), 2000);
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    // Optional: Stop simulation if no clients
  }

  @SubscribeMessage('requestPrediction')
  async handlePredictionRequest(@MessageBody() assetId: string): Promise<any> {
    const prediction = await this.aiService.predictFailureProbability(assetId);
    return { event: 'predictionResult', data: { assetId, ...prediction } };
  }

  private broadcastTelemetry() {
    // Phase 3: Simulated real-time telemetry stream
    const isWarning = Math.random() > 0.95;
    const mockTelemetry = {
      timestamp: new Date().toISOString(),
      globalEnergyUsage: 4200 + Math.random() * 100, // kW
      activeConnections: 1024 + Math.floor(Math.random() * 50),
      temperatureStatus: isWarning ? 'WARNING' : 'HEALTHY'
    };

    if (isWarning) {
      this.webhookService.sendCriticalAlert('Thermal Spike Detected', {
        location: 'Server Room A',
        sensor: 'TS-092',
        status: mockTelemetry.temperatureStatus
      });
    }

    this.server.emit('telemetryUpdate', mockTelemetry);
  }
}
