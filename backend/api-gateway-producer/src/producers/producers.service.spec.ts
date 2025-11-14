import { Test, TestingModule } from '@nestjs/testing';
import { ProducersService } from './producers.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ProducerLog } from './entities/producer-log.entity';

describe('ProducersService', () => {
  let service: ProducersService;

  const mockLogRepository = {
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
  };

  const mockKafkaClient = {
    connect: jest.fn(),
    emit: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProducersService,
        {
          provide: getRepositoryToken(ProducerLog),
          useValue: mockLogRepository,
        },
        {
          provide: 'KAFKA_SERVICE',
          useValue: mockKafkaClient,
        },
      ],
    }).compile();

    service = module.get<ProducersService>(ProducersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
