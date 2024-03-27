import { Test, TestingModule } from '@nestjs/testing';
import { EventsService } from './events.service';
import { PredictionsRepository } from '../repositories/predictions.repository';
import { ClientProxy } from '@nestjs/microservices';
import {
  PatientDeleteDto,
  PatientNewToPredictionsDto,
  PredictionDeleteEventDto,
  PredictionEditEventDto,
  PredictionNewEventDto,
  PredictionsEvents,
  Services,
} from '@app/common';
import { ConfigService } from '@nestjs/config';
import { Types } from 'mongoose';

describe('EventsService', () => {
  let service: EventsService;
  let predictionsRepository: Partial<PredictionsRepository>;
  let doctorsClient: ClientProxy;
  let patientsClient: ClientProxy;

  const mockPredictionsRepository: Partial<PredictionsRepository> = {
    create: jest.fn(),
    findOneAndUpdate: jest.fn(),
    findOneAndDelete: jest.fn(),
  };

  const mockDoctorsClient: Partial<ClientProxy> = {
    emit: jest.fn(),
  };

  const mockPatientsClient: Partial<ClientProxy> = {
    emit: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventsService,
        {
          provide: PredictionsRepository,
          useValue: mockPredictionsRepository,
        },
        {
          provide: Services.Doctors,
          useValue: mockDoctorsClient,
        },
        {
          provide: Services.Patients,
          useValue: mockPatientsClient,
        },
        ConfigService,
      ],
    }).compile();

    service = module.get<EventsService>(EventsService);
    predictionsRepository = module.get<PredictionsRepository>(
      PredictionsRepository,
    );
    doctorsClient = module.get<ClientProxy>(Services.Doctors);
    patientsClient = module.get<ClientProxy>(Services.Patients);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('emitPredictionEvent', () => {
    const patientId = new Types.ObjectId();
    const userId = new Types.ObjectId();
    const predictionId = new Types.ObjectId();
    describe('PredictionNew', () => {
      const predictionEventDto: PredictionNewEventDto = {
        patientId: patientId.toHexString(),
        userId: userId.toHexString(),
        predictionThumbnail: {
          id: predictionId.toHexString(),
          fileName: 'test_file_name',
          dataAndTime: new Date(),
          number: 2,
          imageUrl: 'test_image_url',
        },
      };
      it('should emit prediction-new event to Doctors & Patients micro-service', async () => {
        await service.emitPredictionNewEvent(predictionEventDto);

        expect(doctorsClient.emit).toHaveBeenCalledWith(
          PredictionsEvents.PredictionsNew,
          predictionEventDto,
        );
        expect(patientsClient.emit).toHaveBeenCalledWith(
          PredictionsEvents.PredictionsNew,
          predictionEventDto,
        );
      });
    });

    describe('PredictionEdit', () => {
      const predictionEventDto: PredictionEditEventDto = {
        patientId: patientId.toHexString(),
        userId: userId.toHexString(),
        predictionThumbnail: {
          id: predictionId.toHexString(),
          fileName: 'test_file_name_updated',
        },
      };
      it('should emit prediction-edit event to Doctors & Patients micro-service', async () => {
        await service.emitPredictionEditEvent(predictionEventDto);

        expect(doctorsClient.emit).toHaveBeenCalledWith(
          PredictionsEvents.PredictionsEdit,
          predictionEventDto,
        );
        expect(patientsClient.emit).toHaveBeenCalledWith(
          PredictionsEvents.PredictionsEdit,
          predictionEventDto,
        );
      });
    });

    describe('PredictionDelete', () => {
      const predictionEventDto: PredictionDeleteEventDto = {
        patientId: patientId.toHexString(),
        userId: userId.toHexString(),
        predictionId: predictionId.toHexString(),
      };
      it('should emit prediction-delete event to Doctors & Patients micro-service', async () => {
        await service.emitPredictionDeleteEvent(predictionEventDto);

        expect(doctorsClient.emit).toHaveBeenCalledWith(
          PredictionsEvents.PredictionsDelete,
          predictionEventDto,
        );
        expect(patientsClient.emit).toHaveBeenCalledWith(
          PredictionsEvents.PredictionsDelete,
          predictionEventDto,
        );
      });
    });
  });

  describe('handlePatientEvent', () => {
    const patientId = new Types.ObjectId();
    describe('PatientNew', () => {
      const patientNewDto: PatientNewToPredictionsDto = {
        id: patientId.toHexString(),
        fullName: 'test_full_name',
        gender: 'female',
        birthDate: new Date(),
      };
      it('should create new predictions spot for new patient', async () => {
        await service.handlePatientNewEvent(patientNewDto);

        expect(predictionsRepository.create).toHaveBeenCalledWith({
          patientData: patientNewDto,
        });
      });
    });

    describe('PatientEdit', () => {
      const patientEditDto: Partial<PatientNewToPredictionsDto> = {
        id: patientId.toHexString(),
        fullName: 'test_full_name_updated',
        gender: 'female',
      };

      const $set = {};
      Object.keys(patientEditDto).forEach((key) => {
        $set[`patientData.${key}`] = patientEditDto[key];
      });

      it('should update patient data with specified patient ID', async () => {
        await service.handlePatientEditEvent(patientEditDto);

        expect(predictionsRepository.findOneAndUpdate).toHaveBeenCalledWith(
          { 'patientData.id': patientEditDto.id },
          { $set },
        );
      });
    });

    describe('PatientDelete', () => {
      const patientDeleteDto: PatientDeleteDto = {
        id: patientId.toHexString(),
      };
      it('should delete patient with specified patient ID', async () => {
        await service.handlePatientDeleteEvent(patientDeleteDto);

        expect(predictionsRepository.findOneAndDelete).toHaveBeenCalledWith({
          'patientData.id': patientDeleteDto.id,
        });
      });
    });
  });
});
