// src/admin/admin.service.ts

import {
  Injectable,
  Inject,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { Admin } from 'kafkajs'; // Import 'Admin' từ kafkajs
import { spawn } from 'child_process';
import * as path from 'path';
import axios from 'axios';
import { io, Socket } from 'socket.io-client';

@Injectable()
export class AdminService implements OnModuleInit, OnModuleDestroy {
  private kafkaAdmin: Admin; // Biến để giữ admin client
  private runningConsumers: Map<string, any> = new Map(); // Track running consumer processes
  private consumerServiceSocket: Socket; // WebSocket connection to Consumer Service

  constructor(
    @Inject('KAFKA_SERVICE') private readonly kafkaClient: ClientKafka,
  ) {}

  // Lấy admin client khi module khởi động
  async onModuleInit() {
    const kafkaJsClient = (this.kafkaClient as any).client;
    this.kafkaAdmin = kafkaJsClient.admin();
    await this.kafkaClient.connect();
    await this.kafkaAdmin.connect();
    console.log('Kafka Client và Admin Client đã kết nối!');

    // Khởi tạo WebSocket connection đến Consumer Service
    this.initializeConsumerServiceSocket();
  }

  // Cleanup khi module bị destroy
  onModuleDestroy() {
    if (this.consumerServiceSocket) {
      this.consumerServiceSocket.disconnect();
      console.log('[Admin] Disconnected from Consumer Service WebSocket');
    }
  }

  // Khởi tạo WebSocket connection đến Consumer Service
  private initializeConsumerServiceSocket() {
    const consumerServiceUrl =
      process.env.CONSUMER_SERVICE_URL ||
      'https://un3yfhxmgj.ap-southeast-2.awsapprunner.com';

    console.log('[Admin] Connecting to Consumer Service WebSocket...');

    this.consumerServiceSocket = io(consumerServiceUrl, {
      transports: ['polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    this.consumerServiceSocket.on('connect', () => {
      console.log('[Admin] ✅ Connected to Consumer Service WebSocket');
    });

    this.consumerServiceSocket.on('connect_error', (error) => {
      console.error(
        '[Admin] ❌ Consumer Service WebSocket connection error:',
        error.message,
      );
    });

    this.consumerServiceSocket.on('disconnect', (reason) => {
      console.warn(
        '[Admin] ❌ Consumer Service WebSocket disconnected:',
        reason,
      );
    });
  }

  // Helper method để broadcast event đến Consumer Service
  private broadcastToConsumerService(event: string, data: any) {
    if (this.consumerServiceSocket && this.consumerServiceSocket.connected) {
      this.consumerServiceSocket.emit(event, data);
      console.log(`[Admin] Broadcasted ${event} to Consumer Service:`, data);
    } else {
      console.warn(
        `[Admin] Cannot broadcast ${event} - Consumer Service WebSocket not connected`,
      );
    }
  }

  //Hàm tạo topic mới
  async createTopic(
    topicName: string,
    numPartitions: number,
    replicationFactor: number,
  ) {
    console.log(
      `AdminService: Đang tạo topic ${topicName} với ${numPartitions} partition...`,
    );

    try {
      // Gọi hàm topicExists (đã được thêm ở dưới)
      const topicExists = await this.topicExists(topicName);
      if (topicExists) {
        console.log(`AdminService: Topic ${topicName} đã tồn tại.`);
        return { status: 'warn', message: 'Topic đã tồn tại.' };
      }

      await this.kafkaAdmin.createTopics({
        topics: [
          {
            topic: topicName,
            numPartitions: numPartitions,
            replicationFactor: replicationFactor,
          },
        ],
      });
      console.log(`AdminService: Đã tạo topic ${topicName} thành công.`);
      return {
        status: 'success',
        message: `Topic ${topicName} đã được tạo thành công.`,
      };
    } catch (error) {
      console.error('Lỗi khi tạo topic:', error);
      return { status: 'error', message: 'Không thể tạo topic.' };
    }
  }

  // Hàm lấy danh sách tất cả topic
  async listTopics() {
    try {
      const topics = await this.kafkaAdmin.listTopics();
      const metadata = await this.kafkaAdmin.fetchTopicMetadata({ topics });

      console.log('AdminService: Đang lấy danh sách topics...');

      // ✅ Lấy thêm producer statistics và consumer statistics
      const [producerStats, consumerStats] = await Promise.all([
        this.getProducerStatsByTopic(),
        this.getConsumerStatsByTopic(),
      ]);

      // ✅ Enrich topic data với statistics
      const enrichedTopics = metadata.topics.map((topic) => {
        const producerStat = producerStats[topic.name] || {
          totalRecords: 0,
          batches: 0,
        };
        const consumerStat = consumerStats[topic.name] || { consumerCount: 0 };

        return {
          name: topic.name,
          partitions: topic.partitions.length,
          totalRecords: producerStat.totalRecords,
          batches: producerStat.batches,
          consumerCount: consumerStat.consumerCount,
          // Keep original metadata for backward compatibility
          partitionDetails: topic.partitions,
        };
      });

      return {
        status: 'success',
        data: enrichedTopics,
      };
    } catch (error) {
      console.error('Lỗi khi lấy danh sách topic:', error);
      return { status: 'error', message: 'Không thể lấy danh sách topic.' };
    }
  }

  // ✅ Helper: Lấy producer statistics theo topic
  private async getProducerStatsByTopic(): Promise<
    Record<string, { totalRecords: number; batches: number }>
  > {
    try {
      // Query producer-log database để lấy statistics
      const response = await axios.get(
        'https://bxiuaztdmu.ap-southeast-2.awsapprunner.com/api/producers/statistics',
        {
          timeout: 5000,
        },
      );

      if (response.data.success && response.data.byTopic) {
        const stats: Record<string, { totalRecords: number; batches: number }> =
          {};

        // response.data.byTopic is already an array with topic breakdown
        response.data.byTopic.forEach((topicStat: any) => {
          stats[topicStat.topic] = {
            totalRecords: topicStat.totalRecords || 0,
            batches: topicStat.totalBatches || 0,
          };
        });

        return stats;
      }

      return {};
    } catch (error) {
      console.warn('[Admin] Cannot fetch producer stats:', error.message);
      return {};
    }
  }

  // ✅ Helper: Lấy consumer statistics theo topic
  private async getConsumerStatsByTopic(): Promise<
    Record<string, { consumerCount: number }>
  > {
    try {
      // Query consumer instances từ Consumer Service
      const consumerServiceUrl = process.env.CONSUMER_SERVICE_URL || '';
      const response = await axios.get(
        `${consumerServiceUrl}/api/consumers/instances`,
        {
          timeout: 5000,
        },
      );

      if (response.data.success && response.data.data) {
        const stats: Record<string, { consumerCount: number }> = {};

        // Đếm số lượng ACTIVE consumers cho mỗi topic
        response.data.data.forEach((instance: any) => {
          if (instance.status === 'ACTIVE' && instance.topicName) {
            if (!stats[instance.topicName]) {
              stats[instance.topicName] = { consumerCount: 0 };
            }
            stats[instance.topicName].consumerCount++;
          }
        });

        return stats;
      }

      return {};
    } catch (error) {
      console.warn('[Admin] Cannot fetch consumer stats:', error.message);
      return {};
    }
  }

  // Hàm kiểm tra topic đã tồn tại hay chưa
  private async topicExists(topicName: string): Promise<boolean> {
    const topics = await this.kafkaAdmin.listTopics();
    return topics.includes(topicName);
  }

  // Hàm xóa topic
  async deleteTopic(topicName: string) {
    console.log(`AdminService: Đang xóa topic ${topicName}...`);

    try {
      // Kiểm tra topic có tồn tại không
      const topicExists = await this.topicExists(topicName);
      if (!topicExists) {
        console.log(`AdminService: Topic ${topicName} không tồn tại.`);
        return { status: 'warn', message: 'Topic không tồn tại.' };
      }

      // ⚠️ Ghi chú: Nếu có consumer đang hoạt động, topic sẽ bị đánh dấu xóa
      // nhưng chỉ thực sự xóa khi tất cả consumers disconnect
      await this.kafkaAdmin.deleteTopics({
        topics: [topicName],
        timeout: 10000, // Tăng timeout lên 10 giây
      });

      console.log(`AdminService: Đã gửi lệnh xóa topic ${topicName}.`);
      console.log(
        `⚠️ Lưu ý: Topic sẽ bị xóa khi tất cả consumers ngắt kết nối.`,
      );

      return {
        status: 'success',
        message: `Topic ${topicName} đã được đánh dấu xóa. Sẽ xóa hoàn toàn khi consumers ngắt kết nối.`,
      };
    } catch (error) {
      console.error('Lỗi khi xóa topic:', error);
      return {
        status: 'error',
        message: `Không thể xóa topic: ${error.message}. Topic có thể đang được sử dụng bởi consumers.`,
      };
    }
  }

  // Hàm cập nhật cấu hình topic
  async updateTopic(
    topicName: string,
    numPartitions?: number,
    configs?: Record<string, string>,
  ) {
    console.log(`AdminService: Đang cập nhật topic ${topicName}...`, {
      numPartitions,
      configs,
    });

    try {
      // Kiểm tra topic có tồn tại không
      const topicExists = await this.topicExists(topicName);
      if (!topicExists) {
        console.log(`AdminService: Topic ${topicName} không tồn tại.`);
        return { status: 'warn', message: 'Topic không tồn tại.' };
      }

      // Tăng số partitions nếu được yêu cầu
      if (numPartitions) {
        await this.kafkaAdmin.createPartitions({
          topicPartitions: [
            {
              topic: topicName,
              count: numPartitions,
            },
          ],
        });
        console.log(
          `AdminService: Đã tăng số partition của topic ${topicName} lên ${numPartitions}.`,
        );
      }

      // Cập nhật configs nếu được yêu cầu
      if (configs && Object.keys(configs).length > 0) {
        // Convert configs to array format for alterConfigs
        const configEntries = Object.entries(configs).map(([name, value]) => ({
          name,
          value: value.toString(),
        }));

        await this.kafkaAdmin.alterConfigs({
          validateOnly: false,
          resources: [
            {
              type: 2, // TOPIC = 2
              name: topicName,
              configEntries,
            },
          ],
        });
        console.log(
          `AdminService: Đã cập nhật cấu hình của topic ${topicName}.`,
        );
      }

      return {
        status: 'success',
        message: `Topic ${topicName} đã được cập nhật thành công.`,
      };
    } catch (error) {
      console.error('Lỗi khi cập nhật topic:', error);
      return {
        status: 'error',
        message: `Không thể cập nhật topic: ${error.message}`,
      };
    }
  }

  // Hàm lấy thông tin chi tiết một topic
  async getTopicDetail(topicName: string) {
    try {
      const topicExists = await this.topicExists(topicName);
      if (!topicExists) {
        return { status: 'warn', message: 'Topic không tồn tại.' };
      }

      // Lấy metadata
      const metadata = await this.kafkaAdmin.fetchTopicMetadata({
        topics: [topicName],
      });

      // Lấy configs
      const configs = await this.kafkaAdmin.describeConfigs({
        includeSynonyms: false,
        resources: [
          {
            type: 2, // TOPIC = 2
            name: topicName,
          },
        ],
      });

      return {
        status: 'success',
        data: {
          metadata: metadata.topics[0],
          configs: configs.resources[0]?.configEntries || [],
        },
      };
    } catch (error) {
      console.error('Lỗi khi lấy chi tiết topic:', error);
      return { status: 'error', message: 'Không thể lấy chi tiết topic.' };
    }
  }

  // Spawn một consumer instance mới
  async spawnConsumer(
    consumerId?: string,
    groupId?: string,
    topicName?: string,
  ) {
    try {
      // Auto-generate consumer ID với format đẹp và unique
      let finalConsumerId: string;
      let consumerPort: number = 3001; // Khởi tạo mặc định

      if (consumerId && consumerId.trim()) {
        // Nếu user cung cấp ID, đảm bảo có prefix "consumer-"
        finalConsumerId = consumerId.startsWith('consumer-')
          ? consumerId
          : `consumer-${consumerId}`;

        // Tính port dựa trên consumer ID
        const idNumber = finalConsumerId.replace('consumer-', '');
        const num = parseInt(idNumber);
        consumerPort = isNaN(num)
          ? 3001 + Math.floor(Math.random() * 100)
          : 3001 + num;
      } else {
        // Auto-generate: consumer-1, consumer-2, consumer-3...
        try {
          // Query tất cả consumers từ database để tránh trùng ID
          // Force IPv4
          const consumerServiceUrl = process.env.CONSUMER_SERVICE_URL || '';
          const response = await axios.get(
            `${consumerServiceUrl}/api/consumers/stats`,
            {
              timeout: 5000,
            },
          );

          const existingIds = response.data.instances?.map((i) => i.id) || [];
          const consumerNumbers = existingIds
            .filter((id) => id.match(/^consumer-\d+$/))
            .map((id) => parseInt(id.replace('consumer-', '')))
            .filter((num) => !isNaN(num));

          const nextNumber =
            consumerNumbers.length > 0 ? Math.max(...consumerNumbers) + 1 : 1;

          finalConsumerId = `consumer-${nextNumber}`;
          // Mỗi consumer có port riêng: 3001 + nextNumber
          consumerPort = 3001 + nextNumber;
        } catch (error) {
          // Fallback: Dùng timestamp nếu không query được DB
          console.warn(
            '[Admin] Cannot query consumers from DB, using timestamp',
          );
          const timestamp = Date.now();
          finalConsumerId = `consumer-${timestamp}`;
          consumerPort = 3001 + (timestamp % 1000); // Port ngẫu nhiên
        }
      }

      // Kiểm tra xem consumer đã chạy chưa - ALWAYS check Consumer Service DB for authoritative state
      try {
        const consumerServiceUrl = process.env.CONSUMER_SERVICE_URL || '';
        const response = await axios.get(
          `${consumerServiceUrl}/api/consumers/stats`,
          {
            timeout: 5000,
          },
        );

        if (response.data.success) {
          const existingConsumer = response.data.instances?.find(
            (instance) =>
              instance.id === finalConsumerId && instance.status === 'ACTIVE',
          );

          if (existingConsumer) {
            console.log(
              `[Admin] Consumer ${finalConsumerId} already exists and is ACTIVE in database`,
            );
            return {
              status: 'error',
              message: `Consumer ${finalConsumerId} đã đang chạy (PID: ${existingConsumer.pid})`,
            };
          } else {
            console.log(
              `[Admin] Consumer ${finalConsumerId} not found or inactive in database - safe to create`,
            );
            // Clean up local cache if it exists but DB says consumer is not active
            if (this.runningConsumers.has(finalConsumerId)) {
              console.log(
                `[Admin] Removing stale local cache entry for ${finalConsumerId}`,
              );
              this.runningConsumers.delete(finalConsumerId);
            }
          }
        }
      } catch (error) {
        console.warn(
          `[Admin] Cannot verify consumer status from DB: ${error.message}`,
        );
        // Fallback to local cache check only if we can't reach Consumer Service
        if (this.runningConsumers.has(finalConsumerId)) {
          return {
            status: 'error',
            message: `Consumer ${finalConsumerId} đã đang chạy (không thể xác minh từ database)`,
          };
        }
      }

      // Đường dẫn đến consumer service
      const consumerPath = path.resolve(__dirname, '../../../consumer-service');

      console.log(
        `[Admin] Spawning consumer: ${finalConsumerId} on port ${consumerPort}`,
      );
      console.log(`[Admin] Consumer path: ${consumerPath}`);

      // Spawn consumer process với PORT riêng
      const consumerProcess = spawn('npm', ['run', 'start:dev'], {
        cwd: consumerPath,
        env: {
          ...process.env,
          CONSUMER_ID: finalConsumerId,
          PORT: consumerPort.toString(),
          KAFKA_GROUP_ID: groupId || 'platform-consumer-group-server',
          KAFKA_TOPIC_NAME: topicName || '', // ✅ Truyền topic name
        },
        shell: true,
        detached: false, // ← CHANGED: Không detach để có thể log
        stdio: 'pipe', // ← ADDED: Pipe stdio để capture logs
      });

      // Track process
      this.runningConsumers.set(finalConsumerId, {
        pid: consumerProcess.pid,
        consumerId: finalConsumerId,
        port: consumerPort,
        groupId: groupId || 'platform-consumer-group-server',
        startedAt: new Date(),
      });

      // Log output
      consumerProcess.stdout?.on('data', (data) => {
        console.log(`[Consumer ${finalConsumerId}] ${data.toString()}`);
      });

      consumerProcess.stderr?.on('data', (data) => {
        console.error(`[Consumer ${finalConsumerId} ERROR] ${data.toString()}`);
      });

      consumerProcess.on('exit', (code) => {
        console.log(`[Consumer ${finalConsumerId}] Exited with code ${code}`);
        this.runningConsumers.delete(finalConsumerId);
      });

      // Unref để không block main process
      consumerProcess.unref();

      // Broadcast ngay lập tức để UI biết consumer đang được tạo
      this.broadcastToConsumerService('consumer-creating', {
        consumerId: finalConsumerId,
        pid: consumerProcess.pid,
        port: consumerPort,
        groupId: groupId || 'platform-consumer-group-server',
      });

      // Đợi consumer register vào database rồi mới broadcast created
      setTimeout(() => {
        this.broadcastToConsumerService('consumer-created', {
          consumerId: finalConsumerId,
          pid: consumerProcess.pid,
          port: consumerPort,
          groupId: groupId || 'platform-consumer-group-server',
        });
      }, 3000); // Tăng lên 3 giây để đảm bảo consumer đã register

      return {
        status: 'success',
        message: `Consumer ${finalConsumerId} đã được khởi động trên port ${consumerPort}`,
        data: {
          consumerId: finalConsumerId,
          pid: consumerProcess.pid,
          port: consumerPort,
          groupId: groupId || 'platform-consumer-group-server',
        },
      };
    } catch (error) {
      console.error('[Admin] Lỗi khi spawn consumer:', error);
      return {
        status: 'error',
        message: 'Không thể khởi động consumer',
        error: error.message,
      };
    }
  }

  // Lấy danh sách consumers đang chạy từ Consumer Service API
  async getRunningConsumers() {
    try {
      // Query từ Consumer Service API thay vì dùng local Map
      // Force IPv4 để tránh lỗi ECONNREFUSED với ::1
      const consumerServiceUrl = process.env.CONSUMER_SERVICE_URL || '';

      const response = await axios.get(
        `${consumerServiceUrl}/api/consumers/stats`,
        {
          timeout: 5000, // 5 second timeout
        },
      );

      if (response.data.success) {
        // Transform data từ consumer stats sang format mong đợi
        const instances = response.data.instances || [];

        return {
          status: 'success',
          data: instances.map((instance) => ({
            consumerId: instance.id,
            pid: instance.pid,
            groupId: 'platform-consumer-group-server', // Default
            startedAt: instance.lastHeartbeat,
            status: instance.status.toLowerCase(), // Convert ACTIVE → active
            hostname: instance.hostname,
            port: instance.port,
            topicName: instance.topicName || null, // ✅ Thêm topicName từ database
          })),
        };
      }

      return {
        status: 'success',
        data: [],
      };
    } catch (error) {
      console.error('[Admin] Error fetching consumers:', error.message);
      // Fallback to local Map nếu không connect được
      return {
        status: 'success',
        data: Array.from(this.runningConsumers.values()),
      };
    }
  }

  // Stop một consumer
  // Stop consumer (kill process nhưng giữ lại record trong DB với status INACTIVE)
  async stopConsumer(consumerId: string) {
    try {
      console.log(`[Admin] Attempting to stop consumer: ${consumerId}`);

      // Kiểm tra trong local Map trước
      const consumer = this.runningConsumers.get(consumerId);

      if (consumer) {
        console.log(
          `[Admin] Found consumer in local map with PID: ${consumer.pid}`,
        );

        try {
          // Kill process - Consumer Service sẽ tự động mark INACTIVE sau khi không còn heartbeat
          process.kill(consumer.pid, 'SIGTERM');
          console.log(`[Admin] Sent SIGTERM to PID: ${consumer.pid}`);

          // Xóa khỏi local Map nhưng GIỮ LẠI trong database
          this.runningConsumers.delete(consumerId);

          // ✅ KHÔNG broadcast ngay - để Consumer Service tự broadcast sau khi cập nhật DB
          // Consumer Service sẽ tự động detect process đã bị kill và broadcast 'consumer-stopped' event

          return {
            status: 'success',
            message: `Consumer ${consumerId} đã được dừng (PID: ${consumer.pid})`,
          };
        } catch (killError) {
          console.error(
            `[Admin] Error killing process ${consumer.pid}:`,
            killError.message,
          );

          // Nếu kill thất bại, có thể process đã chết rồi
          this.runningConsumers.delete(consumerId);

          return {
            status: 'warn',
            message: `Consumer ${consumerId} có thể đã dừng trước đó. Đã xóa khỏi danh sách.`,
          };
        }
      }

      // Nếu không có trong local Map, query từ Consumer Service
      console.log(
        `[Admin] Consumer not found in local map, checking Consumer Service...`,
      );

      const consumerServiceUrl = process.env.CONSUMER_SERVICE_URL || '';

      const response = await axios.get(
        `${consumerServiceUrl}/api/consumers/stats`,
        { timeout: 5000 },
      );

      const remoteConsumer = response.data.instances?.find(
        (i) => i.id === consumerId,
      );

      if (remoteConsumer && remoteConsumer.pid) {
        console.log(
          `[Admin] Found consumer in remote with PID: ${remoteConsumer.pid}`,
        );

        try {
          process.kill(remoteConsumer.pid, 'SIGTERM');
          console.log(
            `[Admin] Sent SIGTERM to remote PID: ${remoteConsumer.pid}`,
          );

          // ✅ KHÔNG broadcast ngay - để Consumer Service tự broadcast sau khi cập nhật DB
          // Consumer Service sẽ tự động detect process đã bị kill và broadcast 'consumer-stopped' event

          return {
            status: 'success',
            message: `Consumer ${consumerId} đã được dừng (PID: ${remoteConsumer.pid})`,
          };
        } catch (killError) {
          console.error(
            `[Admin] Error killing remote process:`,
            killError.message,
          );

          return {
            status: 'error',
            message: `Không thể kill process của consumer ${consumerId}. Process có thể đã dừng hoặc không có quyền.`,
          };
        }
      }

      return {
        status: 'error',
        message: `Consumer ${consumerId} không tồn tại hoặc không chạy`,
      };
    } catch (error) {
      console.error('[Admin] Lỗi khi stop consumer:', error);
      return {
        status: 'error',
        message: 'Không thể dừng consumer',
        error: error.message,
      };
    }
  }

  // Delete consumer (xóa hoàn toàn khỏi database)
  async deleteConsumer(consumerId: string) {
    try {
      const consumerServiceUrl = process.env.CONSUMER_SERVICE_URL || '';

      // Gọi API của Consumer Service để xóa khỏi database
      const response = await axios.delete(
        `${consumerServiceUrl}/api/consumers/instances/${consumerId}`,
        {
          timeout: 5000,
        },
      );

      if (response.data.success) {
        // Broadcast consumer deleted event để UI tự động cập nhật
        setTimeout(() => {
          this.broadcastToConsumerService('consumer-deleted', {
            consumerId: consumerId,
          });
        }, 500);

        return {
          status: 'success',
          message: `Consumer ${consumerId} đã được xóa hoàn toàn`,
        };
      }

      return {
        status: 'error',
        message: response.data.message || 'Không thể xóa consumer',
      };
    } catch (error) {
      console.error('[Admin] Lỗi khi delete consumer:', error);
      return {
        status: 'error',
        message: 'Không thể xóa consumer',
        error: error.message,
      };
    }
  }
}
