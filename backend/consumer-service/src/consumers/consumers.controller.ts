// consumer-service/src/consumers/consumers.controller.ts
import {
  Controller,
  Get,
  Param,
  Query,
  Delete,
  Put,
  Post,
} from "@nestjs/common";
import {
  MessagePattern,
  Payload,
  Ctx,
  KafkaContext,
} from "@nestjs/microservices";
import { ConsumersService } from "./consumers.service";

@Controller("consumers")
export class ConsumersController {
  constructor(private readonly consumersService: ConsumersService) {}

  /**
   * ❌ ĐÃ TẮT: Không lắng nghe tất cả topics nữa
   * - Bây giờ mỗi consumer instance sẽ đăng ký topic riêng khi tạo
   * - Điều này cho phép xóa topic bất cứ lúc nào mà không bị block
   * - Consumer sẽ subscribe topic động qua KAFKA_TOPIC_NAME environment variable
   *
   * NOTE: Nếu cần test, hãy tạo consumer instance mới với topic cụ thể
   * thay vì dùng MessagePattern hardcode như trước
   */

  // @MessagePattern([...]) - ĐÃ BỎ để cho phép xóa topic
  // async handleTransaction(...) - Code cũ đã comment

  /**
   * ✅ CÁCH MỚI: Mỗi consumer instance sẽ:
   * 1. Được tạo với topic riêng (qua UI "Create Consumer")
   * 2. Lưu topicName vào database (consumer_instances.topicName)
   * 3. Khi start, đọc KAFKA_TOPIC_NAME từ .env
   * 4. Chỉ subscribe topic đó, không subscribe tất cả
   *
   * => Bạn có thể xóa bất kỳ topic nào không có consumer đang subscribe
   */

  // ✅ API để xem tất cả logs với pagination và filter
  @Get("logs")
  async getAllLogs(
    @Query("consumerId") consumerId?: string,
    @Query("topic") topic?: string,
    @Query("status") status?: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string
  ) {
    return this.consumersService.getAllLogsWithPagination(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 50,
      consumerId,
      topic,
      status
    );
  }

  // ✅ API để xem log chi tiết theo ID (consumer log ID)
  @Get("logs/:id")
  async getConsumerLogById(@Param("id") id: string) {
    return this.consumersService.getConsumerLogById(id);
  }

  // ✅ API để tìm log theo originalLogId (producer log ID)
  @Get("logs/search/:originalLogId")
  async getLogByOriginalId(@Param("originalLogId") originalLogId: string) {
    return this.consumersService.getLogByOriginalId(originalLogId);
  }

  // ✅ API để xem thống kê tổng hợp (cho Dashboard)
  @Get("stats")
  async getConsumerStats() {
    return this.consumersService.getConsumerStats();
  }

  // ✅ API để xem thống kê chi tiết theo consumer instance
  @Get("stats/detailed")
  async getDetailedConsumerStats() {
    return this.consumersService.getDetailedConsumerStats();
  }

  // ✅ API để lấy danh sách tất cả consumer instances
  @Get("instances")
  async getConsumerInstances(@Query("status") status?: string) {
    return this.consumersService.getConsumerInstances(status);
  }

  // ✅ API để resume consumer instance (chuyển từ INACTIVE sang ACTIVE)
  @Put("instances/:consumerId/resume")
  async resumeConsumerInstance(@Param("consumerId") consumerId: string) {
    return this.consumersService.resumeConsumerInstance(consumerId);
  }

  // ✅ API để stop consumer instance (chuyển từ ACTIVE sang INACTIVE)
  @Put("instances/:consumerId/stop")
  async stopConsumerInstance(@Param("consumerId") consumerId: string) {
    return this.consumersService.stopConsumerInstance(consumerId);
  }

  // ✅ API để xóa consumer instance khỏi database
  @Delete("instances/:consumerId")
  async deleteConsumerInstance(@Param("consumerId") consumerId: string) {
    return this.consumersService.deleteConsumerInstance(consumerId);
  }
}
