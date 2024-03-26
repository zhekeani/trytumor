import { StorageService, TokenPayloadProperties } from '@app/common';
import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { CreatePredictionDto } from './dto/create-prediction.dto';
import { EditPredictionDto } from './dto/edit-prediction.dto';
import { PredictionResultDto } from './dto/prediction-result.dto';
import { EventsService } from './events/events.service';
import { PredictionResult } from './models/prediction-result.schema.ts';
import {
  PatientData,
  PredictionData,
  PredictionDocument,
} from './models/prediction.schema';
import { PredictionsService } from './predictions.service';
import { PredictionsRepository } from './repositories/predictions.repository';
import { UtilsService } from './utils/utils.service';

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

    const mockPredictionResult: PredictionResultDto = {
      imageUrl: 'test_image_url',
      imageIndex: 1,
      percentages: {
        glioma: 80,
        meningioma: 10,
        noTumor: 5,
        pituitary: 5,
      },
    };

    const mockPredictionId = new Types.ObjectId();
    const mockPredictionData: PredictionData = {
      id: mockPredictionId.toHexString(),
      number: 1,
      userId: mockUserId.toHexString(),
      doctorName: mockFullName,
      dateAndTime: new Date(),
      results: [mockPredictionResult, mockPredictionResult],
      resultsMean: {
        glioma: 80,
        meningioma: 10,
        noTumor: 5,
        pituitary: 5,
      },
      fileName: createPredictionDto.fileName,
      additionalNotes: createPredictionDto.additionalNotes,
    };

    const mockSavedPrediction: PredictionDocument = {
      _id: new Types.ObjectId(),
      patientData: {
        id: mockPatientId.toHexString(),
        fullName: mockFullName,
        gender: 'male',
        birthDate: new Date(),
      },
      predictionsData: [mockPredictionData],
    };

    it('should return Not Found Exception (404) if patient is not found', async () => {
      predictionsRepository.findOne = jest.fn().mockImplementationOnce(() => {
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

    it('should create and save predictions result and emit prediction-new event', async () => {
      predictionsRepository.findOne = jest
        .fn()
        .mockResolvedValueOnce(undefined);

      // Mock the sendPrediction method
      utilsService.sendPrediction = jest
        .fn()
        .mockResolvedValueOnce(mockPredictionResult);

      // Mock the save method
      service['save'] = jest.fn().mockResolvedValueOnce(mockSavedPrediction);

      // Mock the constructPredictionData
      utilsService.constructPredictionData = jest
        .fn()
        .mockResolvedValueOnce(mockPredictionData);

      const result = await service.create(
        mockTokenPayload,
        mockAuthToken,
        [mockFile, mockFile],
        createPredictionDto,
        mockPatientId.toHexString(),
      );

      expect(utilsService.sendPrediction).toHaveBeenCalledTimes(2);
      expect(utilsService.constructPredictionData).toHaveBeenCalled();
      expect(service['save']).toHaveBeenCalledWith(
        [mockFile, mockFile],
        mockPredictionData,
        mockPatientId.toHexString(),
      );
      expect(eventsService.emitPredictionNewEvent).toHaveBeenCalled();
      expect(result).toEqual(mockSavedPrediction);
    });
  });

  describe('save', () => {
    const mockPatientId = new Types.ObjectId();
    const mockUserId = new Types.ObjectId();
    const mockFullName = 'test_full_name';
    const mockPredictionId = new Types.ObjectId();

    const createPredictionDto: CreatePredictionDto = {
      fileName: 'test_file_name',
      additionalNotes: ['test_additional_notes'],
    };

    const mockPredictionsResult: PredictionResultDto[] = [
      {
        imageUrl: 'test_image_url',
        imageIndex: 1,
        percentages: {
          glioma: 80,
          meningioma: 10,
          noTumor: 5,
          pituitary: 5,
        },
      },
      {
        imageUrl: 'test_image_url_2',
        imageIndex: 2,
        percentages: {
          glioma: 80,
          meningioma: 10,
          noTumor: 5,
          pituitary: 5,
        },
      },
    ];

    const mockPredictionData: PredictionData = {
      id: mockPredictionId.toHexString(),
      number: 1,
      userId: mockUserId.toHexString(),
      doctorName: mockFullName,
      dateAndTime: new Date(),
      results: mockPredictionsResult,
      resultsMean: {
        glioma: 80,
        meningioma: 10,
        noTumor: 5,
        pituitary: 5,
      },
      fileName: createPredictionDto.fileName,
      additionalNotes: createPredictionDto.additionalNotes,
    };
    it('should save every prediction images to cloud storage and save predictionData to database', async () => {
      // Mock constructPath
      utilsService.constructPath = jest.fn().mockReturnValueOnce('file_path');

      // Mock storageService save method
      storageService.save = jest
        .fn()
        .mockResolvedValue({ publicUrl: 'public_url' });

      await service['save'](
        [mockFile, mockFile],
        mockPredictionData,
        mockPatientId.toHexString(),
      );

      expect(storageService.save).toHaveBeenCalledTimes(2);
      expect(predictionsRepository.findOneAndUpdate).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    const mockPredictionId = new Types.ObjectId();
    const mockEditPredictionDto: EditPredictionDto = {
      fileName: 'test_file_name',
      additionalNotes: ['test_additional_notes'],
    };

    const mockQueryCriteria = {
      'predictionsData.id': mockPredictionId.toHexString(),
    };
    const mockUpdate = {
      $set: {
        'predictionsData.$.fileName': mockEditPredictionDto.fileName,
        'predictionsData.$.additionalNotes':
          mockEditPredictionDto.additionalNotes,
      },
    };

    const mockPatientId = new Types.ObjectId();
    const mockUserId = new Types.ObjectId();
    const mockUpdatedPrediction: PredictionDocument = {
      _id: new Types.ObjectId(),
      patientData: {
        id: mockPatientId.toHexString(),
      } as PatientData,
      predictionsData: [
        {
          userId: mockUserId.toHexString(),
          id: mockPredictionId.toHexString(),
          fileName: 'test_file_name',
        } as PredictionData,
      ],
    };
    it('should return Not Found Exception (404) if no user found', async () => {
      predictionsRepository.findOneAndUpdate = jest
        .fn()
        .mockImplementationOnce(() => {
          throw new NotFoundException();
        });

      await expect(
        service.update(mockPredictionId.toHexString(), mockEditPredictionDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should update specific prediction with specified prediction ID, and emit prediction-emit event', async () => {
      service.fetchByPredictionId = jest
        .fn()
        .mockResolvedValueOnce(mockUpdatedPrediction);

      predictionsRepository.findOneAndUpdate = jest
        .fn()
        .mockResolvedValueOnce(undefined);

      const result = await service.update(
        mockPredictionId.toHexString(),
        mockEditPredictionDto,
      );

      expect(predictionsRepository.findOneAndUpdate).toHaveBeenCalledWith(
        mockQueryCriteria,
        mockUpdate,
      );
      expect(service.fetchByPredictionId).toHaveBeenCalledWith(
        mockPredictionId.toHexString(),
      );
      expect(eventsService.emitPredictionEditEvent).toHaveBeenCalled();
      expect(result).toEqual(mockUpdatedPrediction);
    });
  });

  describe('delete', () => {
    const mockPredictionId = new Types.ObjectId();
    const mockPatientId = new Types.ObjectId();
    const mockUserId = new Types.ObjectId();

    const mockPredictionToDelete: Partial<PredictionDocument> = {
      patientData: {
        id: mockPatientId.toHexString(),
      } as PatientData,
      predictionsData: [
        {
          results: [
            {
              imageIndex: 1,
            } as PredictionResult,
            {
              imageIndex: 2,
            } as PredictionResult,
          ],
        } as PredictionData,
      ],
    };

    const mockUpdatedPrediction: PredictionDocument = {
      _id: new Types.ObjectId(),
      patientData: {
        id: mockPatientId.toHexString(),
      } as PatientData,
      predictionsData: [
        {
          userId: mockUserId.toHexString(),
          id: mockPredictionId.toHexString(),
        } as PredictionData,
      ],
    };

    const mockQueryCriteria = {
      'predictionsData.id': mockPredictionId.toHexString(),
    };
    const mockUpdate = {
      $pull: {
        predictionsData: {
          id: new Types.ObjectId(mockPredictionId.toHexString()),
        },
      },
    };
    it('should return Not Found Exception (404) if prediction was not found', async () => {
      predictionsRepository.findOne = jest.fn().mockImplementationOnce(() => {
        throw new NotFoundException();
      });

      await expect(
        service.delete(mockPredictionId.toHexString()),
      ).rejects.toThrow(NotFoundException);
    });

    it('should delete all prediction images in cloud storage, and update prediction in database', async () => {
      // Mock all methods call
      predictionsRepository.findOne = jest
        .fn()
        .mockResolvedValueOnce(mockPredictionToDelete);
      utilsService.constructPath = jest.fn().mockReturnValue('file_path');
      storageService.delete = jest.fn().mockResolvedValue(undefined);
      predictionsRepository.findOneAndUpdate = jest
        .fn()
        .mockResolvedValueOnce(mockUpdatedPrediction);
      eventsService.emitPredictionDeleteEvent = jest
        .fn()
        .mockResolvedValueOnce(undefined);

      const result = await service.delete(mockPredictionId.toHexString());

      expect(predictionsRepository.findOne).toHaveBeenCalled();
      expect(utilsService.constructPath).toHaveBeenCalledTimes(
        mockPredictionToDelete.predictionsData[0].results.length,
      );
      expect(storageService.delete).toHaveBeenCalledTimes(
        mockPredictionToDelete.predictionsData[0].results.length,
      );
      expect(predictionsRepository.findOneAndUpdate).toHaveBeenCalledWith(
        mockQueryCriteria,
        mockUpdate,
      );
      expect(eventsService.emitPredictionDeleteEvent).toHaveBeenCalled();
      expect(result).toEqual(mockUpdatedPrediction);
    });
  });
});
