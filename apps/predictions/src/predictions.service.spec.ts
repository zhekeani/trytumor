import { Test, TestingModule } from '@nestjs/testing';
import { PredictionsService } from './predictions.service';
import { PredictionsRepository } from './repositories/predictions.repository';
import { StorageService, TokenPayloadProperties } from '@app/common';
import { UtilsService } from './utils/utils.service';
import { EventsService } from './events/events.service';
import { NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { CreatePredictionDto } from './dto/create-prediction.dto';

describe('PredictionsService', () => {
  let service: PredictionsService;
  let predictionsRepository: PredictionsRepository;
  let storageService: StorageService;
  let utilsService: UtilsService;
  let eventsService: EventsService;

  const mockPredictionsRepository: Partial<PredictionsRepository> = {
    findOne: jest.fn(),
    findOneAndUpdate: jest.fn(),
    find: jest.fn(),
    findOneAndDelete: jest.fn(),
    deleteMany: jest.fn(),
  };

  const mockStorageService: Partial<StorageService> = {
    save: jest.fn(),
    delete: jest.fn(),
  };

  const mockUtilsService: Partial<UtilsService> = {
    sendPrediction: jest.fn(),
    constructPredictionData: jest.fn(),
    constructPath: jest.fn(),
  };

  const mockEventsService: Partial<EventsService> = {
    emitPredictionNewEvent: jest.fn(),
    emitPredictionEditEvent: jest.fn(),
    emitPredictionDeleteEvent: jest.fn(),
  };

  const mockFile: Express.Multer.File = {
    fieldname: 'file',
    originalname: 'example.jpg',
    encoding: 'utf-8',
    mimetype: 'image/jpeg',
    size: 1024, // Size in bytes
    destination: '/uploads',
    filename: 'example.jpg',
    path: '/uploads/example.jpg',
    buffer: Buffer.from('Mock file content'),
    stream: undefined,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PredictionsService,
        {
          provide: PredictionsRepository,
          useValue: mockPredictionsRepository,
        },
        {
          provide: StorageService,
          useValue: mockStorageService,
        },
        {
          provide: UtilsService,
          useValue: mockUtilsService,
        },
        {
          provide: EventsService,
          useValue: mockEventsService,
        },
      ],
    }).compile();

    service = module.get<PredictionsService>(PredictionsService);
    predictionsRepository = module.get<PredictionsRepository>(
      PredictionsRepository,
    );
    storageService = module.get<StorageService>(StorageService);
    utilsService = module.get<UtilsService>(UtilsService);
    eventsService = module.get<EventsService>(EventsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const mockUserId = new Types.ObjectId();
    const mockUsername = 'test_username';
    const mockFullName = 'test_full_name';
    const mockPatientId = new Types.ObjectId();

    const mockTokenPayload: TokenPayloadProperties = {
      userId: mockUserId.toHexString(),
      username: mockUsername,
      fullName: mockFullName,
    };

    const mockAuthToken = 'test_auth_token';

    const createPredictionDto: CreatePredictionDto = {
      fileName: 'test_file_name',
      additionalNotes: ['test_additional_notes'],
    };

    it('should return Not Found Exception (404) if patient is not found', async () => {
      predictionsRepository.findOne = jest.fn().mockImplementation(() => {
        throw new NotFoundException();
      });

      await expect(
        service.create(
          mockTokenPayload,
          mockAuthToken,
          [mockFile],
          createPredictionDto,
          mockPatientId.toHexString(),
        ),
      ).rejects.toThrow(NotFoundException);

      expect(predictionsRepository.findOne).toHaveBeenCalledWith({
        'patientData.id': mockPatientId.toHexString(),
      });
    });

    // it('should save ne')
  });
});
