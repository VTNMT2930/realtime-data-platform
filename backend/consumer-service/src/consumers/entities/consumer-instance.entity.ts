// consumer-service/src/consumers/consumer-instance.entity.ts
import {
	Entity,
	Column,
	PrimaryColumn,
	CreateDateColumn,
	UpdateDateColumn,
} from "typeorm";

export enum ConsumerInstanceStatus {
	ACTIVE = "ACTIVE",
	INACTIVE = "INACTIVE",
}

@Entity("consumer_instances")
export class ConsumerInstance {
	@PrimaryColumn({ type: "varchar", length: 255 })
	id: string; // consumer-1, consumer-2, etc.

	@Column({
		type: "enum",
		enum: ConsumerInstanceStatus,
		default: ConsumerInstanceStatus.ACTIVE,
	})
	status: ConsumerInstanceStatus;

	@Column({ type: "varchar", length: 50, nullable: true })
	hostname: string;

	@Column({ type: "int", nullable: true })
	port: number;

	@Column({ type: "int", nullable: true })
	pid: number; // Process ID

	@Column({ type: "varchar", length: 255, nullable: true })
	topicName?: string; // Kafka topic name that consumer subscribes to

	@Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
	lastHeartbeat: Date;

	@Column({ type: "boolean", default: false })
	shouldStop: boolean; // Signal để báo cho consumer instance tự stop

	@Column({ type: "boolean", default: false })
	isDeleted: boolean; // Flag để đánh dấu consumer đã bị xóa (soft delete)

	@CreateDateColumn()
	createdAt: Date;

	@UpdateDateColumn()
	updatedAt: Date;
}
