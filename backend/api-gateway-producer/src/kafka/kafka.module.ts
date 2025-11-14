import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
  imports: [
    // Đăng ký client để kết nối Kafka
    ClientsModule.register([
      {
        name: 'KAFKA_SERVICE', // Tên bạn dùng
        transport: Transport.KAFKA,
        options: {
          client: {
            brokers: [process.env.KAFKA_BROKERS || 'localhost:9092'],
            ssl: true,
            sasl: {
              mechanism: 'scram-sha-256',
              username: process.env.KAFKA_USERNAME || '',
              password: process.env.KAFKA_PASSWORD || '',
            },
          },
        },
      },
    ]),
  ],
  // Xuất ClientsModule
  exports: [ClientsModule],
})
export class KafkaModule {}
