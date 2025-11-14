// src/producers/entities/producer-log.entity.ts
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

// Enum để phân loại log
export enum LogType {
  SINGLE = 'SINGLE', // Gửi message đơn lẻ
  FILE = 'FILE', // Gửi file CSV
}

// Enum cho trạng thái xử lý
export enum LogStatus {
  PENDING = 'PENDING', // Đang chờ xử lý
  PROCESSING = 'PROCESSING', // Đang xử lý (chủ yếu cho file)
  COMPLETED = 'COMPLETED', // Hoàn thành
  FAILED = 'FAILED', // Thất bại
}

@Entity('producer_logs') // Tên của bảng sẽ được tạo trong database
export class ProducerLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: LogType,
  })
  type: LogType; // Sẽ là SINGLE hoặc FILE

  @Column({
    type: 'enum',
    enum: LogStatus,
    default: LogStatus.PENDING,
  })
  status: LogStatus;

  // Dùng để lưu payload (nội dung) của message
  // Lưu dưới dạng text để dễ hiển thị
  @Column({ type: 'text', nullable: true })
  data: string;

  // Topic name
  @Column({ nullable: true })
  topic: string;

  // Các trường này chủ yếu dùng cho 'FILE'
  // 'nullable: true' -> cho phép giá trị bị rỗng (vì message SINGLE không có file)
  @Column({ nullable: true })
  originalFileName: string;

  @Column({ nullable: true })
  filePath: string;

  @Column({ nullable: true })
  bullJobId: string; // ID của job trong BullMQ

  // Dùng khi status là 'FAILED'
  @Column({ type: 'text', nullable: true })
  errorMessage: string;

  @CreateDateColumn()
  createdAt: Date; // Tự động điền ngày giờ tạo

  @UpdateDateColumn()
  updatedAt: Date; // Tự động cập nhật ngày giờ khi sửa
}
