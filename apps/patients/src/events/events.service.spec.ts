import { Test, TestingModule } from '@nestjs/testing';
import { EventsService } from './events.service';
import { PatientsRepository } from '../repositories/patients.repository';
import { ClientProxy } from '@nestjs/microservices';
import {
  PatientDeleteDto,
  PatientNewToPredictionsDto,
  PatientsEvents,
  PredictionDeleteEventDto,
  PredictionNewEventDto,
  PredictionsThumbnail,
  PredictionThumbnail,
  PredictionThumbnailDto,
  Services,
} from '@app/common';
import { Types } from 'mongoose';

describe('EventsService', () => {
  let service: EventsService;
  let patientsRepository: PatientsRepository;
  let doctorsClient: ClientProxy;
  let predictionsClient: ClientProxy;

  const mockPatientsRepository: Partial<PatientsRepository> = {
    findOneAndUpdate: jest.fn(),
  };

  const mockDoctorsClient: Partial<ClientProxy> = {
    emit: jest.fn(),
  };

  const mockPredictionsClient: Partial<ClientProxy> = {
    emit: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventsService,
        {
          provide: PatientsRepository,
          useValue: mockPatientsRepository,
        },
        {
          provide: Services.Doctors,
          useValue: mockDoctorsClient,
        },
        {
          provide: Services.Predictions,
          useValue: mockPredictionsClient,
        },
      ],
    }).compile();

    service = module.get<EventsService>(EventsService);
    patientsRepository = module.get<PatientsRepository>(PatientsRepository);
    doctorsClient = module.get<ClientProxy>(Services.Doctors);
    predictionsClient = module.get<ClientProxy>(Services.Predictions);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('emitPatientEvent', () => {
    describe('PatientNew', () => {
      const mockPatientId = new Types.ObjectId();
      const mockPatientNewDto: PatientNewToPredictionsDto = {
        id: mockPatientId.toHexString(),
        fullName: 'test_file_name',
        gender: 'female',
        birthDate: new Date(),
      };
      it('should emit patient-new event to Predictions micro-service', async () => {
        await service.emitPatientNewEvent(mockPatientNewDto);

        expect(predictionsClient.emit).toHaveBeenCalledWith(
          PatientsEvents.PatientNew,
          mockPatientNewDto,
        );
      });
    });

    describe('PatientEdit', () => {
      const mockPatientId = new Types.ObjectId();
      const mockPatientEdit: Partial<PatientNewToPredictionsDto> = {
        fullName: 'test_file_name_updated',
      };
      it('should emit patient-edit event to Predictions micro-service', async () => {
        await service.emitPatientEditEvent(mockPatientEdit);

        expect(predictionsClient.emit).toHaveBeenCalledWith(
          PatientsEvents.PatientEdit,
          mockPatientEdit,
        );
      });
    });

    describe('PatientDelete', () => {
      const mockPatientId = new Types.ObjectId();
      const mockPatientDeleteDto: PatientDeleteDto = {
        id: mockPatientId.toHexString(),
      };
      it('should emit patient-delete event to Predictions & Doctors micro-service', async () => {
        await service.emitPatientDeleteEvent(mockPatientDeleteDto);

        expect(predictionsClient.emit).toHaveBeenCalledWith(
          PatientsEvents.PatientDelete,
          mockPatientDeleteDto,
        );
        expect(doctorsClient.emit).toHaveBeenCalledWith(
          PatientsEvents.PatientDelete,
          mockPatientDeleteDto,
        );
      });
    });
  });

  describe('handlePredictionEvent', () => {
    const mockPatientId = new Types.ObjectId();
    const mockUserId = new Types.ObjectId();
    const mockPredictionId = new Types.ObjectId();
    describe('PredictionNew', () => {
      const mockPredictionNewEventDto: PredictionNewEventDto = {
        patientId: mockPatientId.toHexString(),
        userId: mockUserId.toHexString(),
        predictionThumbnail:
          'prediction_thumbnail' as unknown as PredictionThumbnailDto,
      };

      const mockPredictionToSave: PredictionsThumbnail = {
        patientId: mockPredictionNewEventDto.patientId,
        userId: mockPredictionNewEventDto.userId,
        thumbnail: mockPredictionNewEventDto.predictionThumbnail,
      };

      const mockQueryCriteria = { _id: mockPatientId.toHexString() };
      const mockUpdate = {
        $push: { predictions: { ...mockPredictionToSave } },
      };

      it('should add new prediction to patient database prediction list', async () => {
        await service.handlePredictionNewEvent(mockPredictionNewEventDto);

        expect(patientsRepository.findOneAndUpdate).toHaveBeenCalledWith(
          mockQueryCriteria,
          mockUpdate,
        );
      });
    });

    describe('PredictionEdit', () => {
      const mockPredictionEditDto: PredictionNewEventDto = {
        patientId: mockPatientId.toHexString(),
        userId: mockUserId.toHexString(),
        predictionThumbnail: {
          id: mockPredictionId.toHexString(),
          fileName: 'updated_file_name',
        } as unknown as PredictionThumbnailDto,
      };

      const mockQueryCriteria = {
        'predictions.thumbnail.id':
          mockPredictionEditDto.predictionThumbnail.id,
      };
      const mockUpdate = {
        $set: {
          'predictions.$.thumbnail.fileName':
            mockPredictionEditDto.predictionThumbnail.fileName,
        },
      };

      it('should update existing prediction in patient database prediction list with specified prediction ID', async () => {
        await service.handlePredictionEditEvent(mockPredictionEditDto);

        expect(patientsRepository.findOneAndUpdate).toHaveBeenCalledWith(
          mockQueryCriteria,
          mockUpdate,
        );
      });
    });

    describe('PredictionDelete', () => {
      const mockPredictionDeleteDto: PredictionDeleteEventDto = {
        patientId: mockPatientId.toHexString(),
        userId: mockUserId.toHexString(),
        predictionId: mockPredictionId.toHexString(),
      };

      const mockQueryCriteria = {
        'predictions.thumbnail.id': mockPredictionDeleteDto.predictionId,
      };
      const mockUpdate = {
        $pull: {
          predictions: { 'thumbnail.id': mockPredictionId },
        },
      };

      it('should delete existing prediction in patient database prediction list with specified prediction ID', async () => {
        await service.handlePredictionDeleteEvent(mockPredictionDeleteDto);

        expect(patientsRepository.findOneAndUpdate).toHaveBeenCalledWith(
          mockQueryCriteria,
          mockUpdate,
        );
      });
    });
  });
});
