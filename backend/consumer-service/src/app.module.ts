import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigModule } from "@nestjs/config";
import { ConsumersModule } from "./consumers/consumers.module";
import { ConsumerLog } from "./consumers/entities/consumer-log.entity";
import { ConsumerInstance } from "./consumers/entities/consumer-instance.entity";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ConsumersModule,
    TypeOrmModule.forRoot({
      type: "postgres",
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5433'),
      username: process.env.DB_USERNAME || 'admin',
      password: process.env.DB_PASSWORD || 'admin',
      database: process.env.DB_PRODUCER_NAME || 'consumer_logs',
      entities: [ConsumerLog, ConsumerInstance],
      synchronize: true, // Tự động tạo/cập nhật schema (chỉ dùng trong dev)
    }),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
