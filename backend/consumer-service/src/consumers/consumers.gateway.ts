import {
	WebSocketGateway,
	WebSocketServer,
	OnGatewayConnection,
	OnGatewayDisconnect,
	SubscribeMessage,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { Logger } from "@nestjs/common";

@WebSocketGateway({
	cors: {
		origin: "*", // Trong production, hãy cấu hình cụ thể domain của frontend
		credentials: true,
	},
})
export class ConsumersGateway
	implements OnGatewayConnection, OnGatewayDisconnect
{
	@WebSocketServer()
	server: Server;

	private readonly logger = new Logger(ConsumersGateway.name);

	handleConnection(client: Socket) {
		this.logger.log(`Client connected: ${client.id}`);
		// Gửi message chào mừng khi client kết nối
		client.emit("connection-success", {
			message: "Connected to Consumer Service WebSocket",
			timestamp: new Date().toISOString(),
		});
	}

	handleDisconnect(client: Socket) {
		this.logger.log(`Client disconnected: ${client.id}`);
	}

	/**
	 * Handle consumer-creating event từ API Gateway (ngay khi spawn)
	 */
	@SubscribeMessage("consumer-creating")
	handleConsumerCreating(client: Socket, data: any) {
		this.logger.log(
			`Received consumer-creating event from API Gateway: ${data.consumerId}`
		);
		// Broadcast cho UI biết consumer đang được tạo
		this.server.emit("consumer-creating", {
			consumerId: data.consumerId,
			status: "CREATING",
			action: "creating",
			timestamp: new Date().toISOString(),
		});
	}

	/**
	 * Handle consumer-created event từ API Gateway (sau khi register DB)
	 */
	@SubscribeMessage("consumer-created")
	handleConsumerCreated(client: Socket, data: any) {
		this.logger.log(
			`Received consumer-created event from API Gateway: ${data.consumerId}`
		);
		// Broadcast lại cho tất cả clients (UI) để refresh data
		this.server.emit("consumer-status-changed", {
			consumerId: data.consumerId,
			status: "ACTIVE",
			action: "created",
			timestamp: new Date().toISOString(),
		});
	}

	/**
	 * Handle consumer-stopped event từ API Gateway
	 */
	@SubscribeMessage("consumer-stopped")
	handleConsumerStoppedFromGateway(client: Socket, data: any) {
		this.logger.log(
			`Received consumer-stopped event from API Gateway: ${data.consumerId}`
		);
		// Broadcast lại cho tất cả clients (UI)
		this.broadcastConsumerStopped(data.consumerId);
	}

	/**
	 * Handle consumer-deleted event từ API Gateway
	 */
	@SubscribeMessage("consumer-deleted")
	handleConsumerDeletedFromGateway(client: Socket, data: any) {
		this.logger.log(
			`Received consumer-deleted event from API Gateway: ${data.consumerId}`
		);
		// Broadcast lại cho tất cả clients (UI)
		this.broadcastConsumerDeleted(data.consumerId);
	}

	/**
	 * Broadcast message khi nhận được message từ Kafka
	 */
	broadcastMessageReceived(logId: string, data: any) {
		this.server.emit("message-received", {
			logId,
			topic: data.topic,
			partition: data.partition,
			offset: data.offset,
			dataType: data.dataType,
			rowCount: data.rowCount,
			timestamp: data.timestamp || new Date().toISOString(),
		});
		this.logger.debug(`Broadcasted message-received for log ${logId}`);
	}

	/**
	 * Broadcast khi bắt đầu xử lý
	 */
	broadcastProcessingStarted(logId: string) {
		this.server.emit("processing-started", {
			logId,
			status: "PROCESSING",
			timestamp: new Date().toISOString(),
		});
		this.logger.debug(`Broadcasted processing-started for log ${logId}`);
	}

	/**
	 * Broadcast khi xử lý thành công
	 */
	broadcastProcessingCompleted(logId: string, consumerId: string) {
		this.server.emit("processing-completed", {
			logId,
			consumerId,
			status: "PROCESSED",
			timestamp: new Date().toISOString(),
		});
		this.logger.debug(`Broadcasted processing-completed for log ${logId}`);
	}

	/**
	 * Broadcast khi xử lý thất bại
	 */
	broadcastProcessingFailed(logId: string, error: string) {
		this.server.emit("processing-failed", {
			logId,
			status: "FAILED",
			error,
			timestamp: new Date().toISOString(),
		});
		this.logger.debug(`Broadcasted processing-failed for log ${logId}`);
	}

	/**
	 * Broadcast thống kê real-time
	 */
	broadcastStats(stats: any) {
		this.server.emit("stats-updated", {
			...stats,
			timestamp: new Date().toISOString(),
		});
		this.logger.debug(`Broadcasted stats update`);
	}

	/**
	 * Broadcast khi consumer được resumed
	 */
	broadcastConsumerResumed(consumerId: string) {
		this.server.emit("consumer-resumed", {
			consumerId,
			status: "ACTIVE",
			timestamp: new Date().toISOString(),
		});
		this.logger.log(`Broadcasted consumer-resumed for ${consumerId}`);
	}

	/**
	 * Broadcast khi consumer được stopped
	 */
	broadcastConsumerStopped(consumerId: string) {
		this.server.emit("consumer-stopped", {
			consumerId,
			status: "INACTIVE",
			timestamp: new Date().toISOString(),
		});
		this.logger.log(`Broadcasted consumer-stopped for ${consumerId}`);
	}

	/**
	 * Broadcast khi consumer được deleted
	 */
	broadcastConsumerDeleted(consumerId: string) {
		this.server.emit("consumer-deleted", {
			consumerId,
			timestamp: new Date().toISOString(),
		});
		this.logger.log(`Broadcasted consumer-deleted for ${consumerId}`);
	}
}
