// kafka-health.service.ts (Backend)
import { Injectable } from '@nestjs/common';
import { Kafka } from 'kafkajs';

@Injectable()
export class KafkaHealthService {
  async checkRedpandaStatus(): Promise<boolean> {
    const username = process.env.KAFKA_USERNAME;
    const password = process.env.KAFKA_PASSWORD;

    if (!username || !password) {
      console.error('KAFKA_USERNAME or KAFKA_PASSWORD not configured');
      return false;
    }

    const kafka = new Kafka({
      clientId: 'health-check',
      // Đưa địa chỉ Redpanda Cloud của bạn vào đây
      brokers: [
        'd4bj2eup8hg8cgehfvmg.any.ap-southeast-1.mpx.prd.cloud.redpanda.com:9092',
      ],
      ssl: true, // Redpanda Cloud bắt buộc phải có SSL
      sasl: {
        mechanism: 'scram-sha-256', // Hoặc 'plain' tùy cấu hình của bạn
        username,
        password,
      },
      // Timeout ngắn để tránh treo request lâu
      connectionTimeout: 3000,
      authenticationTimeout: 3000,
    });

    const admin = kafka.admin();

    try {
      await admin.connect();
      // Nếu connect thành công, lấy thử danh sách topic để chắc chắn
      await admin.listTopics();
      await admin.disconnect();
      return true; // Kết nối OK
    } catch (error) {
      console.error('Lỗi kết nối Redpanda:', error.message);
      return false; // Kết nối thất bại
    }
  }
}
