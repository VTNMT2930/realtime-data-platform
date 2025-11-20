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
// Import DTO cho các API khác, nhưng spawnConsumer sẽ dùng Body trực tiếp để tránh lỗi
import { UpdateTopicDto } from './dto/update-topic.dto';
import { CreateTopicDto } from './dto/create-topic.dto';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // --- TOPIC MANAGEMENT ---

  @Post('topics')
  createTopic(@Body() createTopicDto: CreateTopicDto) {
    return this.adminService.createTopic(
      createTopicDto.topicName,
      createTopicDto.numPartitions,
      createTopicDto.replicationFactor,
    );
  }

  @Get('topics')
  listTopics() {
    return this.adminService.listTopics();
  }

  @Get('topics/:topicName')
  getTopicDetail(@Param('topicName') topicName: string) {
    return this.adminService.getTopicDetail(topicName);
  }

  @Delete('topics/:topicName')
  deleteTopic(@Param('topicName') topicName: string) {
    return this.adminService.deleteTopic(topicName);
  }

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

  // ✅ ĐÃ SỬA: Dùng trực tiếp object Body để đảm bảo nhận được consumerId chính xác
  @Post('consumers')
  spawnConsumer(@Body() body: { consumerId?: string; groupId?: string; topicName?: string }) {
    console.log("🚀 [AdminController] Received spawn request:", body);
    return this.adminService.spawnConsumer(
      body.consumerId,
      body.groupId,
      body.topicName,
    );
  }

  @Get('consumers')
  getRunningConsumers() {
    return this.adminService.getRunningConsumers();
  }

  @Patch('consumers/:consumerId/stop')
  stopConsumer(@Param('consumerId') consumerId: string) {
    return this.adminService.stopConsumer(consumerId);
  }

  @Delete('consumers/:consumerId')
  deleteConsumer(@Param('consumerId') consumerId: string) {
    return this.adminService.deleteConsumer(consumerId);
  }
}