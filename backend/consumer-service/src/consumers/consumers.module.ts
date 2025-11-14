// consumer-service/src/consumers/consumers.module.ts
import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ConsumersController } from "./consumers.controller";
import { ConsumersService } from "./consumers.service";
import { ConsumersGateway } from "./consumers.gateway";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConsumerLog } from "./entities/consumer-log.entity";
import { ConsumerInstance } from "./entities/consumer-instance.entity";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forFeature([ConsumerLog, ConsumerInstance]),
  ],
  controllers: [ConsumersController], // Controller sẽ lắng nghe Kafka
  providers: [ConsumersService, ConsumersGateway],
})
export class ConsumersModule {}
