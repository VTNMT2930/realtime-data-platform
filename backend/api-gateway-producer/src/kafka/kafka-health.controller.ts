// app.controller.ts (Backend)
import { Controller, Get, Res, HttpStatus } from '@nestjs/common';
import { KafkaHealthService } from './kafka-health.service'; // Import service ở trên

@Controller('health')
export class HealthController {
  constructor(private readonly kafkaHealthService: KafkaHealthService) {}

  @Get('kafka')
  async checkKafka(@Res() res) {
    const isConnected = await this.kafkaHealthService.checkRedpandaStatus();

    if (isConnected) {
      return res
        .status(HttpStatus.OK)
        .json({ status: 'success', message: 'Connected to Redpanda Cloud' });
    } else {
      return res
        .status(HttpStatus.SERVICE_UNAVAILABLE)
        .json({ status: 'error', message: 'Disconnected' });
    }
  }
}
