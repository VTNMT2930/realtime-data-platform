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
      host: "localhost",
      port: 5433,
      username: "admin",
      password: "admin",
      database: "consumer_logs",
      entities: [ConsumerLog, ConsumerInstance],
      synchronize: true, // Tự động tạo/cập nhật schema (chỉ dùng trong dev)
    }),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
