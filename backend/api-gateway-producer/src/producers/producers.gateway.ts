import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*', // Trong production, hãy cấu hình cụ thể domain của frontend
    credentials: true,
  },
})
export class ProducersGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ProducersGateway.name);

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
    // Gửi message chào mừng khi client kết nối
    client.emit('connection-success', {
      message: 'Connected to Producer Service WebSocket',
      timestamp: new Date().toISOString(),
    });
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  /**
   * Broadcast message khi có log mới được tạo
   */
  broadcastLogCreated(log: any) {
    this.server.emit('producer-log-created', {
      log,
      timestamp: new Date().toISOString(),
    });
    this.logger.debug(`Broadcasted producer-log-created for log ${log.id}`);
  }

  /**
   * Broadcast message khi log được update
   */
  broadcastLogUpdated(logId: string, log: any) {
    this.server.emit('producer-log-updated', {
      logId,
      log,
      timestamp: new Date().toISOString(),
    });
    this.logger.debug(`Broadcasted producer-log-updated for log ${logId}`);
  }

  /**
   * Broadcast thống kê real-time
   */
  broadcastStatsUpdated(statistics: any) {
    this.server.emit('producer-stats-updated', {
      statistics,
      timestamp: new Date().toISOString(),
    });
    this.logger.debug(`Broadcasted producer-stats-updated`);
  }

  /**
   * Broadcast khi có lỗi xảy ra
   */
  broadcastError(error: string, details?: any) {
    this.server.emit('producer-error', {
      error,
      details,
      timestamp: new Date().toISOString(),
    });
    this.logger.error(`Broadcasted producer-error: ${error}`);
  }
}
