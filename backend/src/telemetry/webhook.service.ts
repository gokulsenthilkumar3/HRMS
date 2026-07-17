import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  // Mock Slack/Teams webhook integration
  async sendCriticalAlert(message: string, context: Record<string, any> = {}) {
    const payload = {
      text: `🚨 CRITICAL ALERT: ${message}`,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*🚨 CRITICAL ALERT*\n${message}`
          }
        },
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: `Context: ${JSON.stringify(context)}`
            }
          ]
        }
      ]
    };

    // In production, use axios or fetch to POST to a real webhook URL
    // e.g., await axios.post(process.env.SLACK_WEBHOOK_URL, payload);
    
    this.logger.log(`[Webhook Sent] Slack/Teams Mock payload: ${JSON.stringify(payload)}`);
  }
}
