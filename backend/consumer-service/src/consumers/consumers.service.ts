// consumer-service/src/consumers/consumers.service.ts
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ConsumerLog, ConsumerLogStatus } from "./entities/consumer-log.entity";
import {
  ConsumerInstance,
  ConsumerInstanceStatus,
} from "./entities/consumer-instance.entity";
import { ConfigService } from "@nestjs/config";
import * as os from "os";
import { exec } from "child_process";
import { promisify } from "util";
import { ConsumersGateway } from "./consumers.gateway";
import { Kafka, Consumer as KafkaJsConsumer } from "kafkajs";

// Định nghĩa interface cho metadata để code "sạch" hơn
interface MessageMetadata {
  dataType: "CSV_BATCH" | "SINGLE_MESSAGE";
  rowCount?: number;
}

// Interface cho consumer instance tracking
interface ConsumerInstanceInfo {
  id: string;
  lastHeartbeat: Date;
  status: "active" | "inactive";
}

@Injectable()
export class ConsumersService {
  private readonly consumerInstanceId: string;
  // Static Map để track tất cả consumer instances
  private static consumerInstances = new Map<string, ConsumerInstanceInfo>();
  // ✅ Timeout cho heartbeat (30 giây - cho phép 6 lần heartbeat miss)
  // Heartbeat mỗi 5s → 30s = 6 cycles → đủ buffer cho resume và network issues
  private static readonly HEARTBEAT_TIMEOUT = 15000;
  // ❌ Không dùng static Set nữa, sử dụng database thay thế
  // private static deletedConsumerIds = new Set<string>();
  // Flag để track nếu consumer này đã bị stop thủ công
  private isManuallyStoppedFlag = false;

  private kafkaConsumer: KafkaJsConsumer | null = null;

  constructor(
    @InjectRepository(ConsumerLog)
    private readonly consumerLogRepository: Repository<ConsumerLog>,
    @InjectRepository(ConsumerInstance)
    private readonly consumerInstanceRepository: Repository<ConsumerInstance>,
    private readonly configService: ConfigService,
    private readonly consumersGateway: ConsumersGateway
  ) {
    this.consumerInstanceId =
      this.configService.get<string>("CONSUMER_ID") || os.hostname();

    console.log(`[Consumer] Khởi tạo với ID: ${this.consumerInstanceId}`);

    // ✅ Đọc topic name từ environment variable
    const topicName = this.configService.get<string>("KAFKA_TOPIC_NAME");
    if (topicName && topicName.trim()) {
      console.log(`[Consumer] 📋 Will subscribe to topic: ${topicName}`);
      this.subscribeToTopic(topicName.trim());
    } else {
      console.log(
        `[Consumer] 📋 No specific topic configured - will listen to default topics`
      );
    }

    // ✅ Chỉ start consumer khi không có trong deleted list
    this.startConsumerIfAllowed();

    // Setup heartbeat interval (mỗi 5 giây)
    setInterval(() => {
      this.heartbeat();
    }, 5000);

    // Setup cleanup interval (mỗi 10 giây)
    setInterval(() => {
      this.cleanupStaleConsumers();
    }, 10000);
  }

  // ✅ Subscribe to specific Kafka topic (KafkaJS thực sự)
  private async subscribeToTopic(topicName: string) {
    try {
      console.log(
        `[Consumer] 🚀 Starting Kafka consumer for topic: ${topicName}`
      );

      const brokers = (
        this.configService.get<string>("KAFKA_BROKERS") || "localhost:9092"
      ).split(",");
      const groupId =
        this.configService.get<string>("KAFKA_GROUP_ID") || "consumer-group-1";
      const clientId =
        this.configService.get<string>("KAFKA_CLIENT_ID") || "consumer-service";

      const kafka = new Kafka({
        clientId,
        brokers,
      });

      this.kafkaConsumer = kafka.consumer({ groupId });
      await this.kafkaConsumer.connect();
      await this.kafkaConsumer.subscribe({
        topic: topicName,
        fromBeginning: true,
      });

      await this.kafkaConsumer.run({
        eachMessage: async ({ topic, partition, message }) => {
          const value = message.value?.toString();
          const key = message.key?.toString() || "";
          // Gọi processTransaction để lưu vào DB
          await this.processTransaction(key, value, {
            topic,
            partition,
            offset: message.offset,
            timestamp: message.timestamp,
            key,
          });
        },
      });

      console.log(`[Consumer] ✅ Subscribed and consuming topic: ${topicName}`);
    } catch (error) {
      console.error(
        `[Consumer] ❌ Error subscribing to topic ${topicName}:`,
        error
      );
    }
  }

  // ✅ Kiểm tra xem consumer có bị đánh dấu là deleted không
  private async isConsumerDeleted(consumerId: string): Promise<boolean> {
    const instance = await this.consumerInstanceRepository.findOne({
      where: { id: consumerId },
    });
    return instance?.isDeleted === true;
  }

  // ✅ Đánh dấu consumer là deleted (soft delete)
  private async markConsumerAsDeleted(consumerId: string): Promise<void> {
    await this.consumerInstanceRepository.update(
      { id: consumerId },
      { isDeleted: true }
    );
  }

  // ✅ Bỏ đánh dấu deleted (cho phép tạo lại)
  private async unmarkConsumerAsDeleted(consumerId: string): Promise<void> {
    await this.consumerInstanceRepository.update(
      { id: consumerId },
      { isDeleted: false }
    );
  }

  // ✅ Start consumer chỉ khi được phép (không có trong deleted list)
  private async startConsumerIfAllowed() {
    // Kiểm tra xem consumer này có bị xóa trước đó không
    if (await this.isConsumerDeleted(this.consumerInstanceId)) {
      console.log(
        `[Consumer] 🚫 Consumer ${this.consumerInstanceId} was previously deleted - not starting`
      );
      this.isManuallyStoppedFlag = true;
      return;
    }

    console.log(`[Consumer] ✅ Starting consumer ${this.consumerInstanceId}`);
    await this.registerConsumerInstance();
  }

  // Register consumer instance trong database
  private async registerConsumerInstance() {
    try {
      // ✅ KIỂM TRA: Nếu consumer này đã bị xóa, KHÔNG được tạo lại
      if (await this.isConsumerDeleted(this.consumerInstanceId)) {
        console.log(
          `[Consumer] 🚫 Consumer ${this.consumerInstanceId} đã bị xóa - không cho phép tái tạo`
        );
        this.isManuallyStoppedFlag = true; // Stop permanently
        return;
      }

      // ✅ Kiểm tra xem consumer này đã tồn tại chưa
      let instance = await this.consumerInstanceRepository.findOne({
        where: { id: this.consumerInstanceId },
      });

      if (instance) {
        // ✅ Nếu đã tồn tại, cập nhật thông tin restart
        instance.status = ConsumerInstanceStatus.ACTIVE;
        instance.hostname = os.hostname();
        instance.port = parseInt(
          this.configService.get<string>("PORT") || "3001"
        );
        instance.pid = process.pid;
        instance.lastHeartbeat = new Date();
        instance.shouldStop = false;
        console.log(
          `[Consumer] 🔄 Restarted existing instance: ${this.consumerInstanceId}`
        );
      } else {
        // ✅ Nếu chưa tồn tại, tạo mới
        const topicName = this.configService.get<string>("KAFKA_TOPIC_NAME");
        instance = this.consumerInstanceRepository.create({
          id: this.consumerInstanceId,
          status: ConsumerInstanceStatus.ACTIVE,
          hostname: os.hostname(),
          port: parseInt(this.configService.get<string>("PORT") || "3001"),
          pid: process.pid,
          topicName: topicName || undefined, // ✅ Save subscribed topic
          lastHeartbeat: new Date(),
          shouldStop: false,
        });
        console.log(
          `[Consumer] ✅ Created new instance: ${this.consumerInstanceId}${
            topicName
              ? ` (subscribed to topic: ${topicName})`
              : " (no topic assigned)"
          }`
        );
      }

      await this.consumerInstanceRepository.save(instance);
    } catch (error) {
      console.error(`[Consumer] Error registering instance:`, error.message);
    }
  }

  // Heartbeat để update last seen time trong DB
  private async heartbeat() {
    try {
      // ✅ HEARTBEAT CHO TẤT CẢ ACTIVE CONSUMERS trong DB
      // Không chỉ riêng this.consumerInstanceId
      const allActiveConsumers = await this.consumerInstanceRepository.find({
        where: { status: ConsumerInstanceStatus.ACTIVE },
      });

      for (const consumer of allActiveConsumers) {
        // Check nếu consumer có shouldStop signal
        if (consumer.shouldStop) {
          console.log(
            `[Consumer] ⏸️ Received STOP signal for ${consumer.id} - marking as INACTIVE`
          );

          await this.consumerInstanceRepository.update(
            { id: consumer.id },
            {
              status: ConsumerInstanceStatus.INACTIVE,
              shouldStop: false,
            }
          );

          this.consumersGateway.broadcastConsumerStopped(consumer.id);

          // Nếu là consumer hiện tại, set flag
          if (consumer.id === this.consumerInstanceId) {
            this.isManuallyStoppedFlag = true;
          }

          continue; // Skip heartbeat cho consumer này
        }

        // Check nếu consumer bị deleted
        if (consumer.isDeleted) {
          console.log(
            `[Consumer] 🚫 ${consumer.id} is deleted - skipping heartbeat`
          );
          continue;
        }

        // ✅ Update heartbeat cho consumer này
        await this.consumerInstanceRepository.update(
          { id: consumer.id },
          {
            lastHeartbeat: new Date(),
          }
        );
      }

      // ✅ Log mỗi 1 phút để tracking (1/12 chance vì heartbeat mỗi 5s)
      if (Math.random() < 0.083) {
        console.log(
          `[Consumer] ❤️ Heartbeat OK for ${allActiveConsumers.length} consumer(s)`
        );
      }
    } catch (error) {
      console.error(`[Consumer] ❌ Heartbeat error:`, error.message);
    }
  }

  // Cleanup các consumer đã không hoạt động trong DB
  private async cleanupStaleConsumers() {
    try {
      const timeout = new Date(Date.now() - ConsumersService.HEARTBEAT_TIMEOUT);

      // ✅ Tìm consumers cần mark inactive trước để log chi tiết
      const staleConsumers = await this.consumerInstanceRepository
        .createQueryBuilder("instance")
        .where("instance.lastHeartbeat < :timeout", { timeout })
        .andWhere("instance.status = :status", {
          status: ConsumerInstanceStatus.ACTIVE,
        })
        .getMany();

      if (staleConsumers.length > 0) {
        console.log(
          `[Consumer] ⚠️ Found ${staleConsumers.length} stale consumer(s) to mark inactive:`
        );

        for (const consumer of staleConsumers) {
          const secondsSinceLastHeartbeat = Math.floor(
            (Date.now() - new Date(consumer.lastHeartbeat).getTime()) / 1000
          );

          console.log(
            `[Consumer] 📛 Marking ${consumer.id} as INACTIVE (no heartbeat for ${secondsSinceLastHeartbeat}s)`
          );

          // Mark inactive
          await this.consumerInstanceRepository.update(
            { id: consumer.id },
            { status: ConsumerInstanceStatus.INACTIVE }
          );
        }
      }
    } catch (error) {
      console.error(
        `[Consumer] ❌ Error cleaning up stale consumers:`,
        error.message
      );
    }
  }

  // Get consumer stats từ database
  async getConsumerInstanceStats() {
    try {
      const allInstances = await this.consumerInstanceRepository.find();

      const activeInstances = allInstances.filter(
        (i) => i.status === ConsumerInstanceStatus.ACTIVE
      );

      return {
        active: activeInstances.length,
        total: allInstances.length,
        instances: allInstances.map((i) => ({
          id: i.id,
          status: i.status,
          hostname: i.hostname,
          port: i.port,
          pid: i.pid,
          lastHeartbeat: i.lastHeartbeat,
          topicName: i.topicName, // ✅ Thêm topicName từ database
        })),
      };
    } catch (error) {
      console.error(`[Consumer] Error getting instance stats:`, error.message);
      return {
        active: 0,
        total: 0,
        instances: [],
      };
    }
  }

  // ✅ Lấy danh sách consumer instances (có filter theo status)
  async getConsumerInstances(status?: string) {
    try {
      let query =
        this.consumerInstanceRepository.createQueryBuilder("instance");

      // Filter theo status nếu có
      if (status && status !== "all") {
        query = query.where("instance.status = :status", {
          status: status.toUpperCase(),
        });
      }

      // Order by lastHeartbeat desc
      query = query.orderBy("instance.lastHeartbeat", "DESC");

      const instances = await query.getMany();

      return {
        success: true,
        data: instances,
        total: instances.length,
      };
    } catch (error) {
      console.error(
        `[Consumer] Error getting consumer instances:`,
        error.message
      );
      return {
        success: false,
        message: error.message,
        data: [],
        total: 0,
      };
    }
  }

  async processTransaction(logId: string, data: any, kafkaMetadata?: any) {
    console.log(`[Consumer] Nhận được logId: ${logId}. Đang lưu vào DB...`);

    let consumerLog: ConsumerLog | undefined = undefined;
    let metadata: MessageMetadata;

    // Phân loại tin nhắn (lô hay đơn lẻ) và tạo metadata
    if (Array.isArray(data)) {
      metadata = {
        dataType: "CSV_BATCH",
        rowCount: data.length,
      };
      console.log(`[Consumer] Phát hiện batch với ${data.length} bản ghi`);
    } else {
      metadata = {
        dataType: "SINGLE_MESSAGE",
      };
      console.log(`[Consumer] Phát hiện message đơn lẻ`);
    }

    try {
      // 1. LƯU VÀO DB (RECEIVED) với đầy đủ metadata
      const newLog = this.consumerLogRepository.create({
        originalLogId: logId,
        topic: kafkaMetadata?.topic || null, // ✅ Lưu topic
        partition: kafkaMetadata?.partition ?? null, // ✅ Lưu partition
        offset: kafkaMetadata?.offset || null, // ✅ Lưu offset
        data: JSON.stringify({
          // ✅ Lưu metadata + data
          metadata: {
            topic: kafkaMetadata?.topic,
            partition: kafkaMetadata?.partition,
            offset: kafkaMetadata?.offset,
            timestamp: kafkaMetadata?.timestamp,
            key: kafkaMetadata?.key,
          },
          content: data, // Lưu nội dung thực
          messageType: metadata,
        }),
        status: ConsumerLogStatus.RECEIVED,
        consumerId: this.consumerInstanceId,
      });
      consumerLog = await this.consumerLogRepository.save(newLog);

      // Thêm 'if' check để sửa lỗi TypeScript "possibly 'undefined'"
      if (!consumerLog) {
        throw new Error("Không thể tạo bản ghi log cho consumer.");
      }

      console.log(`[Consumer] Đã lưu log ${consumerLog.id}. Bắt đầu xử lý...`);

      // 🔌 WebSocket: Broadcast message received với đầy đủ thông tin
      this.consumersGateway.broadcastMessageReceived(logId, {
        ...metadata,
        topic: kafkaMetadata?.topic,
        partition: kafkaMetadata?.partition,
        offset: kafkaMetadata?.offset,
        timestamp: kafkaMetadata?.timestamp,
      });

      // 2. CẬP NHẬT TRẠNG THÁI (PROCESSING)
      await this.consumerLogRepository.update(consumerLog.id, {
        status: ConsumerLogStatus.PROCESSING,
      });

      // 🔌 WebSocket: Broadcast processing started
      this.consumersGateway.broadcastProcessingStarted(logId);

      // 3. GIẢ LẬP XỬ LÝ CÔNG VIỆC
      const recordCount = metadata.rowCount || 1;
      console.log(`[Consumer] Đang xử lý ${recordCount} bản ghi...`);
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // 4. XỬ LÝ THÀNH CÔNG -> CẬP NHẬT DB
      console.log(`[Consumer] ✅ Xử lý thành công log ${consumerLog.id}.`);
      await this.consumerLogRepository.update(consumerLog.id, {
        status: ConsumerLogStatus.PROCESSED,
      });

      // 🔌 WebSocket: Broadcast processing completed
      this.consumersGateway.broadcastProcessingCompleted(
        logId,
        this.consumerInstanceId
      );

      // 🔌 WebSocket: Broadcast updated stats
      const stats = await this.getConsumerStats();
      this.consumersGateway.broadcastStats(stats);
    } catch (error) {
      // 5. XỬ LÝ THẤT BẠI
      const errorMessage = error.response?.data?.message || error.message;
      console.error(`[Consumer] ❌ Xử lý log thất bại:`, errorMessage);

      // 🔌 WebSocket: Broadcast processing failed
      this.consumersGateway.broadcastProcessingFailed(logId, errorMessage);

      // 🔌 WebSocket: Broadcast updated stats
      const stats = await this.getConsumerStats();
      this.consumersGateway.broadcastStats(stats);

      // Logic 'catch' của bạn đã rất tốt,
      // nó kiểm tra xem 'consumerLog' đã kịp tạo hay chưa
      if (consumerLog) {
        await this.consumerLogRepository.update(consumerLog.id, {
          status: ConsumerLogStatus.FAILED,
          errorMessage: errorMessage,
        });
        console.log(
          `[Consumer] Đã cập nhật trạng thái FAILED cho log ${consumerLog.id}`
        );
      } else {
        console.error(
          `[Consumer] ⚠️ Không thể cập nhật log vì chưa tạo được record trong DB!`
        );
      }
    }
  }

  // ✅ API: Lấy tất cả logs với pagination và filter (giống Producer)
  async getAllLogsWithPagination(
    page: number = 1,
    limit: number = 50,
    consumerId?: string,
    topic?: string,
    status?: string
  ) {
    try {
      const query = this.consumerLogRepository.createQueryBuilder("log");

      // Filter theo consumerId
      if (consumerId) {
        query.andWhere("log.consumerId = :consumerId", { consumerId });
      }

      // Filter theo topic
      if (topic) {
        query.andWhere("log.topic = :topic", { topic });
      }

      // Filter theo status
      if (status) {
        query.andWhere("log.status = :status", {
          status: status.toUpperCase(),
        });
      }

      // Pagination
      const skip = (page - 1) * limit;

      // Get total count
      const total = await query.getCount();

      // Get logs with pagination
      const logs = await query
        .orderBy("log.createdAt", "DESC")
        .skip(skip)
        .take(limit)
        .getMany();

      // Parse data field cho mỗi log
      const logsWithParsedData = logs.map((log) => {
        try {
          const parsedData = JSON.parse(log.data);
          return {
            ...log,
            parsedData,
          };
        } catch (e) {
          return {
            ...log,
            parsedData: log.data,
          };
        }
      });

      return {
        success: true,
        data: logsWithParsedData,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error: any) {
      console.error("[Consumer] Error getting logs:", error.message);
      return {
        success: false,
        message: error.message,
        data: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0,
        },
      };
    }
  }

  // ✅ API: Lấy log chi tiết theo consumer log ID
  async getConsumerLogById(id: string) {
    try {
      const log = await this.consumerLogRepository.findOne({ where: { id } });

      if (!log) {
        return {
          success: false,
          message: `Không tìm thấy log với ID: ${id}`,
        };
      }

      // Parse data để hiển thị rõ ràng hơn
      let parsedData: any = null;
      try {
        parsedData = log.data ? JSON.parse(log.data) : null;
      } catch (e) {
        parsedData = log.data;
      }

      console.log(`[Consumer] ✅ Tìm thấy log:`, {
        id: log.id,
        originalLogId: log.originalLogId,
        status: log.status,
        topic: log.topic,
        consumerId: log.consumerId,
      });

      return {
        success: true,
        data: {
          ...log,
          parsedData,
        },
      };
    } catch (error: any) {
      console.error(`[Consumer] Error getting log by ID:`, error.message);
      return {
        success: false,
        message: error.message,
      };
    }
  }

  // ✅ API: Lấy tất cả logs (backward compatible - không pagination)
  async getLogs(consumerId?: string, topic?: string) {
    const query = this.consumerLogRepository.createQueryBuilder("log");

    if (consumerId) {
      query.andWhere("log.consumerId = :consumerId", { consumerId });
    }

    if (topic) {
      query.andWhere("log.topic = :topic", { topic });
    }

    const logs = await query
      .orderBy("log.createdAt", "DESC")
      .limit(100)
      .getMany();

    return {
      total: logs.length,
      consumerId: consumerId || "all",
      topic: topic || "all",
      logs,
    };
  }

  // ✅ API: Tìm log theo originalLogId (từ producer)
  async getLogByOriginalId(logId: string) {
    const log = await this.consumerLogRepository.findOne({
      where: { originalLogId: logId },
    });

    if (!log) {
      return {
        found: false,
        message: `Không tìm thấy log với originalLogId: ${logId}`,
      };
    }

    return {
      found: true,
      log,
      processedBy: log.consumerId,
      status: log.status,
    };
  }

  // ✅ API: Thống kê tổng hợp cho Dashboard
  async getConsumerStats() {
    try {
      // Lấy tất cả logs
      const allLogs = await this.consumerLogRepository.find();

      // ✅ ĐẾM ĐÚNG: Tính tổng số RECORDS (không phải số logs)
      let totalMessages = 0;
      let processedMessages = 0;
      let failedMessages = 0;

      for (const log of allLogs) {
        if (log.data) {
          try {
            const parsedData = JSON.parse(log.data);

            // Đếm số records trong content
            if (parsedData.content && Array.isArray(parsedData.content)) {
              const recordCount = parsedData.content.length;
              totalMessages += recordCount;

              // Đếm theo status
              if (log.status === ConsumerLogStatus.PROCESSED) {
                processedMessages += recordCount;
              } else if (log.status === ConsumerLogStatus.FAILED) {
                failedMessages += recordCount;
              }
            } else {
              // Single message
              totalMessages++;
              if (log.status === ConsumerLogStatus.PROCESSED) {
                processedMessages++;
              } else if (log.status === ConsumerLogStatus.FAILED) {
                failedMessages++;
              }
            }
          } catch (e) {
            // Nếu parse lỗi, coi như 1 message
            totalMessages++;
            if (log.status === ConsumerLogStatus.PROCESSED) {
              processedMessages++;
            } else if (log.status === ConsumerLogStatus.FAILED) {
              failedMessages++;
            }
          }
        }
      }

      // ✅ Thống kê theo topic (đếm RECORDS, không phải logs)
      const topicStatsMap = new Map<string, any>();

      for (const log of allLogs) {
        const topic = log.topic || "unknown";

        if (!topicStatsMap.has(topic)) {
          topicStatsMap.set(topic, {
            topic,
            total: 0,
            processed: 0,
            failed: 0,
          });
        }

        const stats = topicStatsMap.get(topic);

        if (log.data) {
          try {
            const parsedData = JSON.parse(log.data);
            const recordCount =
              parsedData.content && Array.isArray(parsedData.content)
                ? parsedData.content.length
                : 1;

            stats.total += recordCount;

            if (log.status === ConsumerLogStatus.PROCESSED) {
              stats.processed += recordCount;
            } else if (log.status === ConsumerLogStatus.FAILED) {
              stats.failed += recordCount;
            }
          } catch (e) {
            stats.total++;
            if (log.status === ConsumerLogStatus.PROCESSED) {
              stats.processed++;
            } else if (log.status === ConsumerLogStatus.FAILED) {
              stats.failed++;
            }
          }
        }
      }

      // Đếm số consumer instances đang active từ DB
      const consumerInstanceStats = await this.getConsumerInstanceStats();

      return {
        success: true,
        totalMessages,
        processedMessages,
        failedMessages,
        activeConsumers: consumerInstanceStats.active,
        totalConsumers: consumerInstanceStats.total,
        instances: consumerInstanceStats.instances, // ✅ Thêm instances vào response
        successRate:
          totalMessages > 0
            ? Math.round((processedMessages / totalMessages) * 100)
            : 0,
        byTopic: Array.from(topicStatsMap.values()).map((stat) => ({
          topic: stat.topic,
          total: stat.total,
          processed: stat.processed,
          failed: stat.failed,
          successRate:
            stat.total > 0
              ? Math.round((stat.processed / stat.total) * 100)
              : 0,
        })),
        timestamp: new Date(),
      };
    } catch (error: any) {
      console.error("[Consumer] Error getting stats:", error.message);
      return {
        success: false,
        message: error.message,
      };
    }
  }

  // ✅ API: Thống kê chi tiết theo consumer
  async getDetailedConsumerStats() {
    const stats = await this.consumerLogRepository
      .createQueryBuilder("log")
      .select("log.consumerId", "consumerId")
      .addSelect("log.status", "status")
      .addSelect("COUNT(*)", "count")
      .groupBy("log.consumerId")
      .addGroupBy("log.status")
      .getRawMany();

    // Tổng hợp kết quả
    const summary: any = {};

    stats.forEach((stat) => {
      const consumerId = stat.consumerId || "unknown";
      if (!summary[consumerId]) {
        summary[consumerId] = {
          consumerId,
          RECEIVED: 0,
          PROCESSING: 0,
          PROCESSED: 0,
          FAILED: 0,
          total: 0,
        };
      }
      summary[consumerId][stat.status] = parseInt(stat.count);
      summary[consumerId].total += parseInt(stat.count);
    });

    return {
      consumers: Object.values(summary),
      timestamp: new Date(),
    };
  }

  // ✅ Resume consumer instance - chuyển từ INACTIVE sang ACTIVE
  async resumeConsumerInstance(consumerId: string) {
    try {
      // Tìm consumer instance trong database
      const instance = await this.consumerInstanceRepository.findOne({
        where: { id: consumerId },
      });

      if (!instance) {
        return {
          success: false,
          message: `Consumer ${consumerId} không tồn tại trong database`,
        };
      }

      if (instance.status === ConsumerInstanceStatus.ACTIVE) {
        return {
          success: false,
          message: `Consumer ${consumerId} đã đang hoạt động`,
        };
      }

      // Cập nhật trạng thái thành ACTIVE và reset heartbeat
      await this.consumerInstanceRepository.update(
        { id: consumerId },
        {
          status: ConsumerInstanceStatus.ACTIVE,
          lastHeartbeat: new Date(),
          shouldStop: false, // Clear any stop signal
        }
      );

      // ✅ Trigger heartbeat ngay lập tức để update tất cả ACTIVE consumers
      console.log(
        `[Consumer] 🔄 Triggering immediate heartbeat after resume...`
      );
      setImmediate(() => {
        this.heartbeat();
      });

      console.log(`[Consumer] ✅ Đã resume consumer instance: ${consumerId}`); // Broadcast consumer resumed event
      this.consumersGateway.broadcastConsumerResumed(consumerId);

      // Broadcast updated stats
      const stats = await this.getConsumerStats();
      this.consumersGateway.broadcastStats(stats);

      return {
        success: true,
        message: `Consumer ${consumerId} đã được resume thành công`,
        instance: {
          id: instance.id,
          status: ConsumerInstanceStatus.ACTIVE,
          hostname: instance.hostname,
          port: instance.port,
          pid: instance.pid,
          lastHeartbeat: new Date(),
        },
      };
    } catch (error: any) {
      console.error(
        `[Consumer] ❌ Lỗi khi resume consumer instance:`,
        error.message
      );
      return {
        success: false,
        message: error.message,
      };
    }
  }

  // ✅ Stop consumer instance - chuyển từ ACTIVE sang INACTIVE
  async stopConsumerInstance(consumerId: string) {
    try {
      // Tìm consumer instance trong database
      const instance = await this.consumerInstanceRepository.findOne({
        where: { id: consumerId },
      });

      if (!instance) {
        return {
          success: false,
          message: `Consumer ${consumerId} không tồn tại trong database`,
        };
      }

      if (instance.status === ConsumerInstanceStatus.INACTIVE) {
        return {
          success: false,
          message: `Consumer ${consumerId} đã đang dừng`,
        };
      }

      // ✅ Set shouldStop flag để signal cho consumer instance tự stop
      await this.consumerInstanceRepository.update(
        { id: consumerId },
        {
          shouldStop: true, // Signal consumer to stop itself
        }
      );

      // ✅ Nếu đang stop chính consumer này, set flag ngay để ngừng heartbeat
      if (consumerId === this.consumerInstanceId) {
        this.isManuallyStoppedFlag = true;
        // Tự stop ngay lập tức mà không cần đợi heartbeat
        await this.consumerInstanceRepository.update(
          { id: consumerId },
          {
            status: ConsumerInstanceStatus.INACTIVE,
            shouldStop: false, // Clear signal ngay
          }
        );
        console.log(
          `[Consumer] ⏸️ Stopped current instance immediately: ${consumerId}`
        );
      } else {
        console.log(
          `[Consumer] ⏸️ Sent stop signal to consumer instance: ${consumerId}`
        );
      }

      console.log(`[Consumer] ⏸️ Đã stop consumer instance: ${consumerId}`); // Broadcast consumer stopped event
      this.consumersGateway.broadcastConsumerStopped(consumerId);

      // Broadcast updated stats
      const stats = await this.getConsumerStats();
      this.consumersGateway.broadcastStats(stats);

      return {
        success: true,
        message: `Consumer ${consumerId} đã được dừng thành công`,
        instance: {
          id: instance.id,
          status: ConsumerInstanceStatus.INACTIVE,
          hostname: instance.hostname,
          port: instance.port,
          pid: instance.pid,
          lastHeartbeat: instance.lastHeartbeat,
        },
      };
    } catch (error: any) {
      console.error(
        `[Consumer] ❌ Lỗi khi stop consumer instance:`,
        error.message
      );
      return {
        success: false,
        message: error.message,
      };
    }
  }

  // ✅ Delete consumer instance từ database
  async deleteConsumerInstance(consumerId: string) {
    try {
      // ✅ Kiểm tra consumer có tồn tại không trước khi xóa
      const instance = await this.consumerInstanceRepository.findOne({
        where: { id: consumerId },
      });

      if (!instance) {
        return {
          success: false,
          message: `Consumer ${consumerId} không tồn tại trong database`,
        };
      }

      // ✅ BƯỚC 1: Đầu tiên set shouldStop = true để signal consumer ngừng hoạt động
      await this.consumerInstanceRepository.update(
        { id: consumerId },
        { shouldStop: true, status: ConsumerInstanceStatus.INACTIVE }
      );

      console.log(
        `[Consumer] 🛑 Marked consumer ${consumerId} for deletion (shouldStop = true)`
      );

      // ✅ BƯỚC 2: Đánh dấu consumer là deleted NGAY LẬP TỨC
      await this.markConsumerAsDeleted(consumerId);
      console.log(`[Consumer] 📝 Marked ${consumerId} as deleted immediately`);

      // ✅ BƯỚC 3: Nếu đây là consumer hiện tại, set local flag để stop heartbeat
      if (consumerId === this.consumerInstanceId) {
        this.isManuallyStoppedFlag = true;
        console.log(
          `[Consumer] 🛑 Set local stop flag for current instance: ${consumerId}`
        );
      }

      // ✅ BƯỚC 4: Kill process có PID tương ứng (nếu khác process hiện tại)
      if (instance.pid && instance.pid !== process.pid) {
        try {
          console.log(
            `[Consumer] 💀 Attempting to kill process PID ${instance.pid} for consumer ${consumerId}`
          );

          // Sử dụng taskkill trên Windows
          const execAsync = promisify(exec);
          try {
            await execAsync(`taskkill /PID ${instance.pid} /F`);
            console.log(
              `[Consumer] ✅ Successfully killed PID ${instance.pid}`
            );
          } catch (execError) {
            console.error(
              `[Consumer] ❌ Error killing PID ${instance.pid}:`,
              execError.message
            );
          }
        } catch (killError) {
          console.error(
            `[Consumer] ❌ Failed to kill process:`,
            killError.message
          );
        }
      }

      // ✅ BƯỚC 5: Broadcast delete event để UI cập nhật ngay
      this.consumersGateway.broadcastConsumerDeleted(consumerId);

      // ✅ BƯỚC 6: Đợi một chút để đảm bảo process đã stop
      console.log(`[Consumer] ⏳ Waiting for cleanup...`);
      await new Promise((resolve) => setTimeout(resolve, 2000)); // ✅ BƯỚC 6: Xóa consumer khỏi database
      const result = await this.consumerInstanceRepository.delete({
        id: consumerId,
      });

      if (result.affected === 0) {
        return {
          success: false,
          message: `Consumer ${consumerId} không thể xóa khỏi database`,
        };
      }

      console.log(`[Consumer] ✅ Đã xóa consumer instance: ${consumerId}`);

      // Broadcast consumer deleted event
      this.consumersGateway.broadcastConsumerDeleted(consumerId);

      // Broadcast updated stats
      const stats = await this.getConsumerStats();
      this.consumersGateway.broadcastStats(stats);

      return {
        success: true,
        message: `Consumer ${consumerId} đã được xóa khỏi database`,
      };
    } catch (error: any) {
      console.error(
        `[Consumer] ❌ Lỗi khi xóa consumer instance:`,
        error.message
      );
      return {
        success: false,
        message: error.message,
      };
    }
  }

  // ✅ Method để cho phép tạo lại consumer đã bị xóa (gọi từ API tạo consumer mới)
  async allowConsumerRecreation(consumerId: string): Promise<void> {
    if (await this.isConsumerDeleted(consumerId)) {
      await this.unmarkConsumerAsDeleted(consumerId);
      console.log(
        `[Consumer] ✅ Cleared deletion flag for ${consumerId} - allowing recreation`
      );
    }
  }
}
