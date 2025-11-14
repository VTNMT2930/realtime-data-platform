// consumer-service/src/consumers/consumer-log.entity.ts
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

// Các trạng thái dành riêng cho Consumer
export enum ConsumerLogStatus {
  RECEIVED = "RECEIVED", // Đã nhận từ Kafka, đang chờ xử lý
  PROCESSING = "PROCESSING", // Đang xử lý
  PROCESSED = "PROCESSED", // Xử lý thành công
  FAILED = "FAILED", // Xử lý thất bại
}

@Entity("consumer_logs") // Tên của bảng trong database
export class ConsumerLog {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  originalLogId: string; // ID của log gốc từ producer

  // ✅ THÊM: Kafka metadata
  @Column({ type: "varchar", length: 255, nullable: true })
  topic: string; // Topic name

  @Column({ type: "int", nullable: true })
  partition: number; // Partition number

  @Column({ type: "varchar", length: 50, nullable: true })
  offset: string; // Message offset

  @Column({
    type: "enum",
    enum: ConsumerLogStatus,
    default: ConsumerLogStatus.RECEIVED,
  })
  status: ConsumerLogStatus;

  // ✅ Đổi từ 'simple-json' sang 'text' để lưu JSON string
  @Column({ type: "text" })
  data: string;

  // ID của consumer instance đã xử lý message này
  @Column({ type: "varchar", length: 255, nullable: true })
  consumerId: string;

  // Dùng khi status là 'FAILED'
  @Column({ type: "text", nullable: true })
  errorMessage: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
