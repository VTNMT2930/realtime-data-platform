import { IsString, IsNumber, IsNotEmpty, Min } from 'class-validator';
export class CreateTopicDto {
  @IsString()
  @IsNotEmpty()
  topicName: string;

  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  numPartitions: number;

  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  replicationFactor: number;
}
