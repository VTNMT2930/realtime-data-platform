// src/app.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm'; // <<< ĐÃ THÊM
import { BullModule } from '@nestjs/bull';
import { join } from 'path'; // <<< ĐÃ THÊM

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { KafkaModule } from './kafka/kafka.module';
import { AdminModule } from './admin/admin.module';
import { ProducersModule } from './producers/producers.module';

@Module({
  imports: [
    // --- 1. Cấu hình Database (PostgreSQL) ---
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5433'),
      username: process.env.DB_USERNAME || 'admin',
      password: process.env.DB_PASSWORD || 'admin',
      database: process.env.DB_PRODUCER_NAME || 'producer_logs',

      // Tự động tìm tất cả các file .entity.ts (như producer-log.entity.ts)
      entities: [join(__dirname, '**', '*.entity.{ts,js}')],

      // Tự động tạo/cập nhật bảng. Chỉ dùng cho development!
      synchronize: true,
    }),

    // --- 2. Cấu hình Bull (Redis Queue) ---
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST || 'localhost', // Sửa từ 'localhost'
        port: parseInt(process.env.REDIS_PORT || '6379'),
      },
    }),

    // --- 3. Các module nghiệp vụ ---
    ProducersModule,
    KafkaModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
