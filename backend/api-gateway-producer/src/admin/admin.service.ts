import {
  Injectable,
  Inject,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { Admin } from 'kafkajs';
import { spawn } from 'child_process';
import * as path from 'path';
import axios from 'axios';

@Injectable()
export class AdminService implements OnModuleInit, OnModuleDestroy {
  private kafkaAdmin: Admin;
  private runningConsumers: Map<string, any> = new Map();

  private consumerServiceUrl =
    process.env.CONSUMER_SERVICE_URL ||
    'https://un3yfhxmgj.ap-southeast-2.awsapprunner.com';
  private producerServiceUrl =
    process.env.PRODUCER_SERVICE_URL ||
    'https://bxiuaztdmu.ap-southeast-2.awsapprunner.com';

  constructor(
    @Inject('KAFKA_SERVICE') private readonly kafkaClient: ClientKafka,
  ) {}

  async onModuleInit() {
    const kafkaJsClient = (this.kafkaClient as any).client;
    this.kafkaAdmin = kafkaJsClient.admin();
    await this.kafkaClient.connect();
    await this.kafkaAdmin.connect();
    console.log('✅ [Admin] Kafka Client & Admin connected');
  }

  onModuleDestroy() {}

  // --- TOPIC LOGIC ---

  async createTopic(topicName: string, numPartitions: number, replicationFactor: number) {
    try {
      const exists = await this.topicExists(topicName);
      if (exists) return { status: 'warn', message: 'Topic đã tồn tại.' };

      await this.kafkaAdmin.createTopics({
        topics: [{ topic: topicName, numPartitions, replicationFactor }],
      });
      return { status: 'success', message: `Topic ${topicName} tạo thành công.` };
    } catch (error) {
      return { status: 'error', message: 'Lỗi tạo topic: ' + error.message };
    }
  }

  async listTopics() {
    try {
      const topics = await this.kafkaAdmin.listTopics();
      const metadata = await this.kafkaAdmin.fetchTopicMetadata({ topics });
      
      const [producerStats, consumerStats] = await Promise.all([
        this.getProducerStatsByTopic(),
        this.getConsumerStatsByTopic(),
      ]);

      const enrichedTopics = metadata.topics.map((topic) => {
        const pStat = producerStats[topic.name] || { totalRecords: 0, batches: 0 };
        const cStat = consumerStats[topic.name] || { consumerCount: 0 };
        return {
          name: topic.name,
          partitions: topic.partitions.length,
          totalRecords: pStat.totalRecords,
          batches: pStat.batches,
          consumerCount: cStat.consumerCount,
          partitionDetails: topic.partitions,
        };
      });
      return { status: 'success', data: enrichedTopics };
    } catch (error) {
      return { status: 'error', message: 'Lỗi lấy danh sách topic.' };
    }
  }

  private async topicExists(topicName: string): Promise<boolean> {
    const topics = await this.kafkaAdmin.listTopics();
    return topics.includes(topicName);
  }

  private async getProducerStatsByTopic() {
    try {
      const res = await axios.get(`${this.producerServiceUrl}/api/producers/statistics`, { timeout: 3000 });
      if (res.data.success && res.data.byTopic) {
        const stats = {};
        res.data.byTopic.forEach((t: any) => {
          stats[t.topic] = { totalRecords: t.totalRecords, batches: t.totalBatches };
        });
        return stats;
      }
      return {};
    } catch (e) { return {}; }
  }

  private async getConsumerStatsByTopic() {
    try {
      const res = await axios.get(`${this.consumerServiceUrl}/api/consumers/instances`, { timeout: 3000 });
      if (res.data.success && res.data.data) {
        const stats = {};
        res.data.data.forEach((i: any) => {
          if (i.status === 'ACTIVE' && i.topicName) {
            stats[i.topicName] = { consumerCount: (stats[i.topicName]?.consumerCount || 0) + 1 };
          }
        });
        return stats;
      }
      return {};
    } catch (e) { return {}; }
  }

  async deleteTopic(topicName: string) {
    try {
      await this.kafkaAdmin.deleteTopics({ topics: [topicName] });
      return { status: 'success', message: `Topic ${topicName} đã xóa.` };
    } catch (e) { return { status: 'error', message: e.message }; }
  }

  async updateTopic(topicName: string, numPartitions?: number, configs?: any) {
    try {
      if (numPartitions) {
        await this.kafkaAdmin.createPartitions({ topicPartitions: [{ topic: topicName, count: numPartitions }] });
      }
      if (configs && Object.keys(configs).length > 0) {
         // ✅ FIX: Ép kiểu value as any để tránh lỗi TS18046
         const configEntries = Object.entries(configs).map(([name, value]) => ({ 
             name, 
             value: (value as any).toString() 
         }));
         await this.kafkaAdmin.alterConfigs({ validateOnly: false, resources: [{ type: 2, name: topicName, configEntries }] });
      }
      return { status: 'success', message: 'Update thành công.' };
    } catch (e) { return { status: 'error', message: e.message }; }
  }
  
  async getTopicDetail(topicName: string) {
     try {
         const meta = await this.kafkaAdmin.fetchTopicMetadata({ topics: [topicName] });
         // ✅ FIX: Thêm includeSynonyms: false để tránh lỗi TS2345
         const configs = await this.kafkaAdmin.describeConfigs({ 
             includeSynonyms: false,
             resources: [{ type: 2, name: topicName }] 
         });
         return { status: 'success', data: { metadata: meta.topics[0], configs: configs.resources[0]?.configEntries || [] } };
     } catch (e) { return { status: 'error', message: e.message }; }
  }


  // ==================== CONSUMER MANAGEMENT ====================

  async spawnConsumer(consumerId?: string, groupId?: string, topicName?: string) {
    try {
      let finalConsumerId: string;

      if (consumerId && consumerId.trim() !== "") {
          const cleanInput = consumerId.trim();
          if (!cleanInput.startsWith('consumer-')) {
              finalConsumerId = `consumer-${cleanInput}`;
          } else {
              finalConsumerId = cleanInput;
          }
      } else {
          finalConsumerId = `consumer-${Date.now()}`;
      }

      console.log(`[Admin] 🚀 Spawning Consumer: ID=${finalConsumerId}`);

      if (process.env.NODE_ENV === 'production' || process.env.AWS_EXECUTION_ENV) {
        console.warn('⚠️ [Admin] Cloud Mode detected. Calling Consumer Service API...');
        try {
            await axios.post(`${this.consumerServiceUrl}/api/consumers/instances`, {
                topicName: topicName || '', 
                groupId: groupId || 'platform-consumer-group-server'
            });
            console.log(`[Admin] ✅ API call to create record for ${finalConsumerId} successful.`);
        } catch (e) {
            console.error(`❌ [Admin] Failed to call Consumer API: ${e.message}`);
        }
        return {
          status: 'success',
          message: `[CLOUD MODE] Consumer ${finalConsumerId} khởi tạo thành công.`,
          data: { consumerId: finalConsumerId }
        };
      }

      // Logic Local Dev
      const port = 3000 + Math.floor(Math.random() * 1000);
      const consumerPath = path.resolve(__dirname, '../../../consumer-service');
      
      const child = spawn('npm', ['run', 'start:dev'], {
        cwd: consumerPath,
        env: {
            ...process.env,
            CONSUMER_ID: finalConsumerId,
            PORT: port.toString(),
            KAFKA_GROUP_ID: groupId || 'platform-consumer-group-server',
            KAFKA_TOPIC_NAME: topicName || ''
        },
        shell: true,
        detached: false,
        stdio: 'pipe'
      });
      
      this.runningConsumers.set(finalConsumerId, { pid: child.pid, port });
      child.unref();

      return {
        status: 'success',
        message: `Local Consumer ${finalConsumerId} started on port ${port}.`,
        data: { consumerId: finalConsumerId, pid: child.pid }
      };

    } catch (error) {
      return { status: 'error', message: error.message };
    }
  }

  async stopConsumer(consumerId: string) {
    if (this.runningConsumers.has(consumerId)) {
        process.kill(this.runningConsumers.get(consumerId).pid);
        this.runningConsumers.delete(consumerId);
        return { status: 'success', message: `Local consumer ${consumerId} stopped.` };
    }
    try {
        await axios.put(`${this.consumerServiceUrl}/api/consumers/instances/${consumerId}/stop`);
        return { status: 'success', message: `Remote consumer ${consumerId} stopped.` };
    } catch (e) {
        return { status: 'error', message: 'Failed to stop consumer: ' + e.message };
    }
  }

  async deleteConsumer(consumerId: string) {
    try {
        await axios.delete(`${this.consumerServiceUrl}/api/consumers/instances/${consumerId}`);
        return { status: 'success', message: `Consumer ${consumerId} deleted.` };
    } catch (e) {
        return { status: 'error', message: e.message };
    }
  }

  async getRunningConsumers() {
      try {
          const res = await axios.get(`${this.consumerServiceUrl}/api/consumers/stats`);
          return { status: 'success', data: res.data.instances || [] };
      } catch (e) {
          return { status: 'success', data: [] };
      }
  }
}