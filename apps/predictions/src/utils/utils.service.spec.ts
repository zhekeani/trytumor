import { Test, TestingModule } from '@nestjs/testing';
import { UtilsService } from './utils.service';
import { PredictionsRepository } from '../repositories/predictions.repository';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import {
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  PercentageDto,
  PredictionResultDto,
} from '../dto/prediction-result.dto';
import { Types } from 'mongoose';
import { TokenPayloadProperties } from '@app/common';
import { CreatePredictionDto } from '../dto/create-prediction.dto';
import { Type } from 'class-transformer';
import exp from 'constants';
import { Percentage } from '../models/prediction-result.schema.ts';

describe('UtilsService', () => {
  let service: UtilsService;
  let predictionsRepository: PredictionsRepository;
  let configService: ConfigService;

  const mockPredictionsRepository: Partial<PredictionsRepository> = {
    findOne: jest.fn(),
    aggregate: jest.fn(),
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
        UtilsService,
        {
          provide: PredictionsRepository,
          useValue: mockPredictionsRepository,
        },
        ConfigService,
      ],
    }).compile();

    service = module.get<UtilsService>(UtilsService);
    predictionsRepository = module.get<PredictionsRepository>(
      PredictionsRepository,
    );
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendPrediction', () => {
    const mockImageIndex = 4;
    const mockAuthToken = 'test_auth_token';
    const mockFormData = new FormData();

    const mockBlob = new Blob([mockFile.buffer], { type: mockFile.mimetype });
    mockFormData.append('image_file', mockBlob, mockFile.originalname);

    const mockPercentageResult: PercentageDto = {
      glioma: 80,
      meningioma: 10,
      noTumor: 5,
      pituitary: 5,
    };

    const mockPredictionResult: PredictionResultDto = {
      imageUrl: '',
      imageIndex: mockImageIndex,
      percentages: mockPercentageResult,
    };
    it('should return Internal Server Error (500) if fail to get result from create prediction API', async () => {
      // Mock Unauthorized from create prediction API
      const axiosPostSpy = jest
        .spyOn(axios, 'post')
        .mockImplementationOnce(() => {
          throw new UnauthorizedException();
        });

      // Assertion to throw Internal Server Error
      await expect(
        service.sendPrediction(mockFile, mockImageIndex, mockAuthToken),
      ).rejects.toThrow(InternalServerErrorException);

      // Assertion whether axios.post was called
      expect(axiosPostSpy).toHaveBeenCalledWith(
        configService.get('PREDICTION_URL'),
        mockFormData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${mockAuthToken}`,
          },
        },
      );
    });

    it('should return the prediction result percentage if the success creating prediction', async () => {
      // Mock the prediction result
      const axiosPostSpy = jest.spyOn(axios, 'post').mockResolvedValueOnce({
        data: mockPercentageResult,
      });

      const result = await service.sendPrediction(
        mockFile,
        mockImageIndex,
        mockAuthToken,
      );

      // Assertion whether axios.post was called
      expect(axiosPostSpy).toHaveBeenCalledWith(
        configService.get('PREDICTION_URL'),
        mockFormData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${mockAuthToken}`,
          },
        },
      );

      // Assertion for the return value
      expect(result).toEqual(mockPredictionResult);
    });
  });

  describe('fetchPatientData', () => {
    const mockPatientId = new Types.ObjectId();

    const mockPredictionDocument = {
      patientData: 'test_patient_data',
    };
    it('should return Not Found Exception (404) if document with specified patient ID is not found', async () => {
      // Mock findOne to throw Not Found Exception
      predictionsRepository.findOne = jest.fn().mockImplementationOnce(() => {
        throw new NotFoundException();
      });

      await expect(
        service.fetchPatientData(mockPatientId.toHexString()),
      ).rejects.toThrow(NotFoundException);

      expect(predictionsRepository.findOne).toHaveBeenCalledWith({
        'patientData.id': mockPatientId.toHexString(),
      });
    });

    it('should return patientData if the specified patient was found', async () => {
      // Mock findOne to return prediction document with specified patient ID
      predictionsRepository.findOne = jest
        .fn()
        .mockResolvedValueOnce(mockPredictionDocument);

      const result = await service.fetchPatientData(
        mockPatientId.toHexString(),
      );

      expect(result).toEqual(mockPredictionDocument.patientData);
    });
  });

  describe('constructPredictionData', () => {
    const mockUserId = new Types.ObjectId();
    const mockTokenPayload: TokenPayloadProperties = {
      userId: mockUserId.toHexString(),
      fullName: 'test_full_name',
    };
    const mockCreatePredictionDto: CreatePredictionDto = {
      fileName: 'test_file_name',
      additionalNotes: ['test_additional_notes'],
    };

    let mockPredictionResultDtos: PredictionResultDto[] = [
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
    ];

    const mockPredictionDataId = new Types.ObjectId();
    const mockPatientId = new Types.ObjectId();

    const mockAggregatePipeline = [
      { $match: { 'patientData.id': mockPatientId.toHexString() } },
      { $project: { arrayLength: { $size: '$predictionsData' } } },
    ];

    it('should calculate the prediction number base on stored predictionsData length, prediction number should be 1, if predictionsData length is 0', async () => {
      // Mock the predictionsRepo aggregate method to return arrayLength equal to 0
      predictionsRepository.aggregate = jest
        .fn()
        .mockResolvedValueOnce([{ arrayLength: 0 }]);

      const result = await service.constructPredictionData(
        mockTokenPayload,
        mockCreatePredictionDto,
        mockPredictionResultDtos,
        mockPredictionDataId.toHexString(),
        mockPatientId.toHexString(),
      );

      // Assert the initiation of aggregate method
      expect(predictionsRepository.aggregate).toHaveBeenCalledWith(
        mockAggregatePipeline,
      );

      expect(result.number).toEqual(1);
    });

    it('should calculate the prediction number base on stored predictionsData length, prediction number should be predictionsData length + 1, if predictionsData length is greater than 0', async () => {
      // Mock the predictionsRepo aggregate method to return arrayLength equal to 0
      predictionsRepository.aggregate = jest
        .fn()
        .mockResolvedValueOnce([{ arrayLength: 3 }]);

      const result = await service.constructPredictionData(
        mockTokenPayload,
        mockCreatePredictionDto,
        mockPredictionResultDtos,
        mockPredictionDataId.toHexString(),
        mockPatientId.toHexString(),
      );

      // Assert the initiation of aggregate method
      expect(predictionsRepository.aggregate).toHaveBeenCalledWith(
        mockAggregatePipeline,
      );

      expect(result.number).toEqual(4);
    });

    it('should return the mean of each predictions result as resultsMean property', async () => {
      mockPredictionResultDtos = [
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
            glioma: 10,
            meningioma: 80,
            noTumor: 5,
            pituitary: 5,
          },
        },
      ];
      const mockResultsMean: Percentage = {
        glioma:
          (mockPredictionResultDtos[0].percentages.glioma +
            mockPredictionResultDtos[1].percentages.glioma) /
          2,
        meningioma:
          (mockPredictionResultDtos[0].percentages.meningioma +
            mockPredictionResultDtos[1].percentages.meningioma) /
          2,
        noTumor:
          (mockPredictionResultDtos[0].percentages.noTumor +
            mockPredictionResultDtos[1].percentages.noTumor) /
          2,
        pituitary:
          (mockPredictionResultDtos[0].percentages.pituitary +
            mockPredictionResultDtos[1].percentages.pituitary) /
          2,
      };

      predictionsRepository.aggregate = jest
        .fn()
        .mockResolvedValueOnce([{ arrayLength: 0 }]);

      const result = await service.constructPredictionData(
        mockTokenPayload,
        mockCreatePredictionDto,
        mockPredictionResultDtos,
        mockPredictionDataId.toHexString(),
        mockPatientId.toHexString(),
      );

      expect(result.results).toEqual(mockPredictionResultDtos);
      expect(result.resultsMean).toEqual(mockResultsMean);
    });
  });
});
