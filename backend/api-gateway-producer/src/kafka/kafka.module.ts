import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
  imports: [
    // Đăng ký client để kết nối Kafka
    ClientsModule.register([
      {
        name: 'KAFKA_SERVICE', // Tên service
        transport: Transport.KAFKA,
        options: {
          client: {
            clientId: 'producer',
            brokers: ['localhost:9092'], // Địa chỉ Kafka đang chạy từ Docker
          },
          producer: {
            allowAutoTopicCreation: true,
          },
        },
      },
    ]),
  ],
  // Xuất ClientsModule
  exports: [ClientsModule],
})
export class KafkaModule {}