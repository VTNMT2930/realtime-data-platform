import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { KafkaModule } from '../kafka/kafka.module';
import { ProducersController } from './producers.controller';
import { ProducersService } from './producers.service';
import { ProducersGateway } from './producers.gateway';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProducerLog } from './entities/producer-log.entity';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'Producers',
    }),
    KafkaModule,
    TypeOrmModule.forFeature([ProducerLog]),
  ],
  controllers: [ProducersController],
  providers: [ProducersService, ProducersGateway],
  exports: [ProducersGateway],
})
export class ProducersModule {}
