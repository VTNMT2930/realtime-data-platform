import {
  Controller,
  Post,
  Body,
  Get,
  Delete,
  Param,
  Patch,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { CreateTopicDto } from './dto/create-topic.dto';
import { UpdateTopicDto } from './dto/update-topic.dto';
import { CreateConsumerDto } from './dto/create-consumer.dto';

@Controller('admin') //Endpoint gốc
export class AdminController {
  //Thêm AdminService vào Controller
  constructor(private readonly adminService: AdminService) {}

  // Endpoint để tạo topic mới (POST /admin/topics)
  @Post('topics')
  createTopic(@Body() createTopicDto: CreateTopicDto) {
    // Gọi service để tạo topic với các tham số từ DTO
    return this.adminService.createTopic(
      createTopicDto.topicName,
      createTopicDto.numPartitions,
      createTopicDto.replicationFactor,
    );
  }

  // Endpoint để lấy danh sách tất cả topic (GET /admin/topics)
  @Get('topics')
  listTopics() {
    return this.adminService.listTopics();
  }

  // Endpoint để lấy chi tiết một topic (GET /admin/topics/:topicName)
  @Get('topics/:topicName')
  getTopicDetail(@Param('topicName') topicName: string) {
    return this.adminService.getTopicDetail(topicName);
  }

  // Endpoint để xóa topic (DELETE /admin/topics/:topicName)
  @Delete('topics/:topicName')
  deleteTopic(@Param('topicName') topicName: string) {
    return this.adminService.deleteTopic(topicName);
  }

  // Endpoint để cập nhật topic (PATCH /admin/topics/:topicName)
  @Patch('topics/:topicName')
  updateTopic(
    @Param('topicName') topicName: string,
    @Body() updateTopicDto: UpdateTopicDto,
  ) {
    return this.adminService.updateTopic(
      topicName,
      updateTopicDto.numPartitions,
      updateTopicDto.configs,
    );
  }

  // ==================== CONSUMER MANAGEMENT ====================

  // Endpoint để tạo consumer mới (POST /admin/consumers)
  @Post('consumers')
  spawnConsumer(@Body() createConsumerDto: CreateConsumerDto) {
    return this.adminService.spawnConsumer(
      createConsumerDto.consumerId,
      createConsumerDto.groupId,
      createConsumerDto.topicName, // ✅ Truyền topicName
    );
  }

  // Endpoint để lấy danh sách consumers đang chạy (GET /admin/consumers)
  @Get('consumers')
  getRunningConsumers() {
    return this.adminService.getRunningConsumers();
  }

  // Endpoint để stop consumer - kill process nhưng giữ record (PATCH /admin/consumers/:consumerId/stop)
  @Patch('consumers/:consumerId/stop')
  stopConsumer(@Param('consumerId') consumerId: string) {
    return this.adminService.stopConsumer(consumerId);
  }

  // Endpoint để delete consumer - xóa hoàn toàn khỏi DB (DELETE /admin/consumers/:consumerId)
  @Delete('consumers/:consumerId')
  deleteConsumer(@Param('consumerId') consumerId: string) {
    return this.adminService.deleteConsumer(consumerId);
  }
}
