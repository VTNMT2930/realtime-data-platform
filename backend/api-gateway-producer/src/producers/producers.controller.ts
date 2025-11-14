// api-gateway-producer/src/producers/producers.controller.ts
import { Controller, Post, Body, Get, Query, Param } from '@nestjs/common';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ProducersService } from './producers.service';
import {
  ProducerLog,
  LogType,
  LogStatus,
} from './entities/producer-log.entity';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bullmq';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm/dist/common/typeorm.decorators';

@Controller('producers')
export class ProducersController {
  // Inject service vào controller
  constructor(
    @InjectQueue('Producers') private producersQueue: Queue,
    private readonly producersService: ProducersService,

    @InjectRepository(ProducerLog)
    private readonly logRepository: Repository<ProducerLog>,
  ) {}

  // Endpoint để nhận dữ liệu từ client với topic động
  @Post('send/single')
  createTransaction(
    @Body() createTransactionDto: CreateTransactionDto,
    @Query('topic') topic?: string,
  ) {
    return this.producersService.create(
      createTransactionDto,
      topic || 'transactions_topic',
    );
  }

  // Endpoint để upload file với topic động
  @Post('upload/csv')
  @UseInterceptors(FileInterceptor('file', { dest: './uploads' }))
  async uploadFile(@UploadedFile() file: any, @Query('topic') topic?: string) {
    // ✅ CHECK FILE TRƯỚC
    if (!file) {
      console.error('Controller: Không nhận được file!');
      return {
        success: false,
        message: 'Không tìm thấy file. Vui lòng chọn file CSV để upload.',
      };
    }

    const topicName = topic || 'transactions_topic';

    // 1. TẠO LOG TRONG DATABASE (TRẠNG THÁI 'PENDING')
    console.log(
      'Controller: Đang tạo log cho file:',
      file.originalname,
      'Topic:',
      topicName,
    );
    const newLog = this.logRepository.create({
      type: LogType.FILE,
      status: LogStatus.PENDING,
      originalFileName: file.originalname,
      filePath: file.path,
      topic: topicName, // ✅ Lưu topic
    });
    // Lưu log vào DB
    const savedLog = await this.logRepository.save(newLog);
    console.log(
      `Controller: ✅ Đã tạo LOG SUMMARY ban đầu (ID: ${savedLog.id})`,
    );

    // ✅ Broadcast WebSocket event - log created
    this.producersService['producersGateway'].broadcastLogCreated(savedLog);

    // 2. THÊM JOB VÀO HÀNG ĐỢI (QUEUE) với topic
    console.log(
      `Controller: Thêm job vào queue với logId: ${savedLog.id}, Topic: ${topicName}`,
    );
    const bullJob = await this.producersQueue.add('process-csv-job', {
      filePath: file.path,
      logId: savedLog.id,
      topic: topicName, // ✅ Truyền topic vào job
    });

    // 3. CẬP NHẬT LOG VỚI ID CỦA BULL JOB
    if (bullJob && bullJob.id) {
      savedLog.bullJobId = bullJob.id.toString();
      await this.logRepository.save(savedLog);
      console.log(
        `Controller: Đã lưu bullJobId ${bullJob.id} cho logId ${savedLog.id}`,
      );
    } else {
      console.error(
        ` Controller: Không thể lấy được bullJob.id cho logId: ${savedLog.id}`,
        {
          bullJobExists: !!bullJob,
          bullJobId: bullJob?.id,
          fileName: file.originalname,
        },
      );
    }

    return {
      message: `Đã tiếp nhận file. Quá trình xử lý sẽ gửi vào topic: ${topicName}`,
      jobId: savedLog.id,
      topic: topicName,
    };
  }
  // Endpoint để lấy log chi tiết theo ID
  @Get('logs/:id')
  async getLogById(@Param('id') id: string) {
    console.log(`Controller: Đang lấy log với ID: ${id}`);
    const log = await this.logRepository.findOne({ where: { id } });

    if (!log) {
      return {
        success: false,
        message: `Không tìm thấy log với ID: ${id}`,
      };
    }

    // Parse data để hiển thị rõ ràng hơn
    let parsedData: any = null;
    try {
      parsedData = log.data ? JSON.parse(log.data) : null;
    } catch (e) {
      parsedData = log.data;
    }

    console.log(`Controller: ✅ Tìm thấy log:`, {
      id: log.id,
      type: log.type,
      status: log.status,
      originalFileName: log.originalFileName,
      topic: log.topic,
      dataPreview:
        typeof parsedData === 'object'
          ? JSON.stringify(parsedData).substring(0, 200)
          : parsedData,
    });

    return {
      success: true,
      data: {
        ...log,
        parsedData,
      },
    };
  }

  // Endpoint để lấy logs với filter
  @Get('logs')
  async getLogs(
    @Query('topic') topic?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('type') type?: string,
  ) {
    console.log('Controller: Đang lấy logs...', {
      topic,
      page,
      limit,
      type,
    });
    return this.producersService.findAll(
      topic,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 50,
      type,
    );
  }

  // ✅ Get file uploads summary (không bao gồm batch logs)
  @Get('uploads')
  async getFileUploads(
    @Query('topic') topic?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.producersService.getFileUploads(
      topic,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
    );
  }

  // Endpoint để lấy statistics với topic filter
  @Get('statistics')
  async getStatistics(@Query('topic') topic?: string) {
    console.log(
      'Controller: Đang lấy statistics...',
      topic ? `Topic: ${topic}` : 'All topics',
    );
    return this.producersService.getStatistics();
  }

  // ✅ ENDPOINT TEST: Tạo log FAILED để test giao diện
  @Post('test/create-failed-log')
  async createFailedLog(
    @Query('type') type?: string,
    @Query('topic') topic?: string,
  ) {
    const logType = type === 'FILE' ? LogType.FILE : LogType.SINGLE;
    const topicName = topic || 'test-failed-topic';

    console.log(
      `[TEST] Tạo log FAILED với type: ${logType}, topic: ${topicName}`,
    );

    // Tạo log với status FAILED
    const failedLog = this.logRepository.create({
      type: logType,
      status: LogStatus.FAILED,
      topic: topicName,
      originalFileName:
        logType === LogType.FILE ? 'test-failed-file.csv' : undefined,
      data: JSON.stringify({
        message: 'Test failed log',
        testData: { orderNumber: 'TEST-FAILED-001', error: 'Simulated error' },
      }),
      errorMessage:
        'This is a simulated error for testing purposes. Kafka connection failed or invalid data format.',
    });

    const savedLog = await this.logRepository.save(failedLog);

    console.log(`[TEST] ✅ Đã tạo log FAILED với ID: ${savedLog.id}`);

    // Broadcast WebSocket event
    this.producersService['producersGateway'].broadcastLogCreated(savedLog);
    this.producersService['producersGateway'].broadcastLogUpdated(
      savedLog.id,
      savedLog,
    );

    return {
      success: true,
      message: 'Đã tạo log FAILED để test',
      logId: savedLog.id,
      log: savedLog,
    };
  }
}
