import {
  DoctorEditEventDto,
  DoctorsEvents,
  PatientDeleteDto,
  PredictionDeleteEventDto,
  PredictionEditEventDto,
  PredictionNewEventDto,
  PredictionsThumbnail,
  Services,
} from '@app/common';
import { ConfigService } from '@nestjs/config';
import { ClientProxy } from '@nestjs/microservices';
import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { UsersRepository } from '../users/users.repository';
import { EventsService } from './events.service';

describe('EventsService', () => {
  let service: EventsService;
  let usersRepository: Partial<UsersRepository>;
  let predictionsClient: ClientProxy;

  const mockUsersRepository: Partial<UsersRepository> = {
    updateMany: jest.fn(),
    findOneAndUpdate: jest.fn(),
  };

  const mockPredictionsClient: Partial<ClientProxy> = {
    emit: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventsService,
        {
          provide: UsersRepository,
          useValue: mockUsersRepository,
        },
        {
          provide: Services.Predictions,
          useValue: mockPredictionsClient,
        },
        ConfigService,
      ],
    }).compile();

    service = module.get<EventsService>(EventsService);
    usersRepository = module.get<UsersRepository>(UsersRepository);
    predictionsClient = module.get<ClientProxy>(Services.Predictions);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('emitDoctorEditEvent', () => {
    const doctorEventDto: DoctorEditEventDto = {
      userId: 'user_id',
      fullName: 'Full Name',
    };
    it('should emit doctor-edit event to Predictions micro-service', async () => {
      await service.emitDoctorEditEvent(doctorEventDto);

      expect(predictionsClient.emit).toHaveBeenCalledWith(
        DoctorsEvents.DoctorEdit,
        doctorEventDto,
      );
    });
  });

  describe('handlePatientDeleteEvent', () => {
    const errorToArise = new Error('Fail to updateMany');
    const patientDeleteDto: PatientDeleteDto = {
      id: 'patient_id',
    };

    const queryCriteria = {
      'predictions.patientId': patientDeleteDto.id,
    };
    const deleteQuery = {
      $pull: { predictions: { patientId: patientDeleteDto.id } },
    };

    it('should delete patient with specified DTO and log the deletion result', async () => {
      const deletionResult = { modifiedCount: 3 };
      usersRepository.updateMany = jest.fn().mockResolvedValue(deletionResult);

      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

      await service.handlePatientDeleteEvent(patientDeleteDto);

      expect(usersRepository.updateMany).toHaveBeenCalledWith(
        queryCriteria,
        deleteQuery,
      );

      expect(consoleLogSpy).toHaveBeenCalledWith(
        'Documents updated:',
        deletionResult.modifiedCount,
      );

      consoleLogSpy.mockRestore();
    });
    it('should call console.error when fail to delete patient', async () => {
      usersRepository.updateMany = jest.fn().mockRejectedValue(errorToArise);

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      await service.handlePatientDeleteEvent(patientDeleteDto);

      expect(usersRepository.updateMany).toHaveBeenCalledWith(
        queryCriteria,
        deleteQuery,
      );

      expect(consoleErrorSpy).toHaveBeenCalledWith('Error:', errorToArise);

      consoleErrorSpy.mockRestore();
    });
  });

  describe('handlePredictionNewEvent', () => {
    const predictionEventDto: PredictionNewEventDto = {
      patientId: 'patient_id',
      userId: 'user_id',
      predictionThumbnail: {
        id: 'id',
        fileName: 'file_name',
        dataAndTime: new Date(),
        number: 3,
        imageUrl: 'image_url',
      },
    };

    const predictionToSave: PredictionsThumbnail = {
      patientId: predictionEventDto.patientId,
      userId: predictionEventDto.userId,
      thumbnail: predictionEventDto.predictionThumbnail,
    };

    const queryCriteria = { _id: 'user_id' };
    const updateQuery = { $push: { predictions: { ...predictionToSave } } };
    it('should return usersRepository findOneAndUpdate method call', async () => {
      const result = await service.handlePredictionNewEvent(predictionEventDto);

      expect(usersRepository.findOneAndUpdate).toHaveBeenCalledWith(
        queryCriteria,
        updateQuery,
      );

      expect(result).toEqual(
        usersRepository.findOneAndUpdate(queryCriteria, updateQuery),
      );
    });
  });

  describe('handlePredictionEditEvent', () => {
    const predictionEventDto: PredictionEditEventDto = {
      predictionThumbnail: { id: 'prediction_id', fileName: 'file_name' },
      patientId: 'patient_id',
      userId: 'user_id',
    };

    const queryCriteria = {
      'predictions.thumbnail.id': predictionEventDto.predictionThumbnail.id,
    };
    const updateQuery = {
      $set: {
        'predictions.$.thumbnail.fileName':
          predictionEventDto.predictionThumbnail.fileName,
      },
    };
    it('should return usersRepository findOneAndUpdate method call with specific query criteria & update query', async () => {
      const result =
        await service.handlePredictionEditEvent(predictionEventDto);

      expect(usersRepository.findOneAndUpdate).toHaveBeenCalledWith(
        queryCriteria,
        updateQuery,
      );

      expect(result).toEqual(
        usersRepository.findOneAndUpdate(queryCriteria, updateQuery),
      );
    });
  });

  describe('handlePredictionDeleteEvent', () => {
    const predictionEventDto: PredictionDeleteEventDto = {
      predictionId: new Types.ObjectId().toHexString(),
      patientId: 'patient_id',
      userId: 'user_id',
    };

    const queryCriteria = {
      'predictions.thumbnail.id': predictionEventDto.predictionId,
    };
    const updateQuery = {
      $pull: {
        predictions: {
          'thumbnail.id': new Types.ObjectId(predictionEventDto.predictionId),
        },
      },
    };
    it('should return usersRepository findOneAndUpdate method call with specific query criteria & update query', async () => {
      const result =
        await service.handlePredictionDeleteEvent(predictionEventDto);

      expect(usersRepository.findOneAndUpdate).toHaveBeenCalledWith(
        queryCriteria,
        updateQuery,
      );

      expect(result).toEqual(
        usersRepository.findOneAndUpdate(queryCriteria, updateQuery),
      );
    });
  });
});
