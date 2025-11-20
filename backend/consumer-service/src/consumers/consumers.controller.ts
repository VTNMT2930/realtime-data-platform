// consumer-service/src/consumers/consumers.controller.ts

import {
  Controller,
  Get,
  Param,
  Query,
  Delete,
  Put,
  Post,
  Body, 
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


  // ✅ API để tạo consumer instance entry trong database
  @Post("instances")
  async createConsumerInstanceEntry(
    @Body() body: { topicName: string; groupId?: string } // ✅ FIX: Sử dụng Body decorator
  ) {
    // ✅ FIX: Gọi hàm createConsumerInstanceEntry đã được thêm vào Service
    return this.consumersService.createConsumerInstanceEntry(
      body.topicName,
      body.groupId
    );
  }
  
  // --- Các API khác giữ nguyên logic ---

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
  
  @Get("logs/:id")
  async getConsumerLogById(@Param("id") id: string) {
    return this.consumersService.getConsumerLogById(id);
  }

  @Get("logs/search/:originalLogId")
  async getLogByOriginalId(@Param("originalLogId") originalLogId: string) {
    return this.consumersService.getLogByOriginalId(originalLogId);
  }

  @Get("stats")
  async getConsumerStats() {
    return this.consumersService.getConsumerStats();
  }

  @Get("stats/detailed")
  async getDetailedConsumerStats() {
    return this.consumersService.getDetailedConsumerStats();
  }

  @Get("instances")
  async getConsumerInstances(@Query("status") status?: string) {
    return this.consumersService.getConsumerInstances(status);
  }

  @Put("instances/:consumerId/resume")
  async resumeConsumerInstance(@Param("consumerId") consumerId: string) {
    return this.consumersService.resumeConsumerInstance(consumerId);
  }

  @Put("instances/:consumerId/stop")
  async stopConsumerInstance(@Param("consumerId") consumerId: string) {
    return this.consumersService.stopConsumerInstance(consumerId);
  }

  @Delete("instances/:consumerId")
  async deleteConsumerInstance(@Param("consumerId") consumerId: string) {
    return this.consumersService.deleteConsumerInstance(consumerId);
  }
}