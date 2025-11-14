import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class CreateConsumerDto {
  @IsOptional()
  @IsString()
  consumerId?: string; // Nếu không truyền sẽ auto-generate

  @IsOptional()
  @IsString()
  groupId?: string; // Kafka consumer group ID, default sẽ dùng platform-consumer-group-server

  @IsOptional()
  @IsString()
  topicName?: string; // Topic name to subscribe to
}
