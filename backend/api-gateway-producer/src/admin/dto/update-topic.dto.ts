import { IsNumber, IsOptional, Min, IsObject } from 'class-validator';

export class UpdateTopicDto {
  @IsNumber()
  @IsOptional()
  @Min(1)
  numPartitions?: number; // Chỉ có thể tăng, không giảm

  @IsObject()
  @IsOptional()
  configs?: {
    'retention.ms'?: string; // Thời gian lưu trữ (milliseconds)
    'retention.bytes'?: string; // Dung lượng tối đa
    'segment.ms'?: string; // Thời gian segment
    'segment.bytes'?: string; // Kích thước segment
    'compression.type'?: string; // gzip, snappy, lz4, zstd, uncompressed
    'max.message.bytes'?: string; // Kích thước message tối đa
    'min.insync.replicas'?: string; // Số replicas tối thiểu
  };
}
