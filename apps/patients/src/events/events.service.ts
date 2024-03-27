import { Inject, Injectable } from '@nestjs/common';
import {
  PatientDeleteDto,
  PatientNewToPredictionsDto,
  PatientsEvents,
  PredictionDeleteEventDto,
  PredictionEditEventDto,
  PredictionNewEventDto,
  PredictionsThumbnail,
  Services,
} from '@app/common';
import { ClientProxy } from '@nestjs/microservices';
import { PatientsRepository } from '../repositories/patients.repository';
import { Types } from 'mongoose';

@Injectable()
export class EventsService {
  constructor(
    private readonly patientsRepository: PatientsRepository,
    @Inject(Services.Doctors) private readonly doctorsClient: ClientProxy,
    @Inject(Services.Predictions)
    private readonly predictionsClient: ClientProxy,
  ) {}

  async emitPatientNewEvent(patientNewDto: PatientNewToPredictionsDto) {
    this.predictionsClient.emit(PatientsEvents.PatientNew, {
      ...patientNewDto,
    });
  }

  async emitPatientEditEvent(
    patientEditDto: Partial<PatientNewToPredictionsDto>,
  ) {
    this.predictionsClient.emit(PatientsEvents.PatientEdit, {
      ...patientEditDto,
    });
  }

  async emitPatientDeleteEvent(patientDeleteDto: PatientDeleteDto) {
    this.predictionsClient.emit(PatientsEvents.PatientDelete, patientDeleteDto);
    this.doctorsClient.emit(PatientsEvents.PatientDelete, patientDeleteDto);
  }

  async handlePredictionNewEvent(predictionEventDto: PredictionNewEventDto) {
    const { patientId, userId, predictionThumbnail } = predictionEventDto;

    const predictionToSave: PredictionsThumbnail = {
      patientId,
      userId,
      thumbnail: predictionThumbnail,
    };

    return this.patientsRepository.findOneAndUpdate(
      { _id: patientId },
      {
        $push: { predictions: { ...predictionToSave } },
      },
    );
  }

  async handlePredictionEditEvent(predictionEventDto: PredictionEditEventDto) {
    const { patientId, userId, predictionThumbnail } = predictionEventDto;

    return this.patientsRepository.findOneAndUpdate(
      { 'predictions.thumbnail.id': predictionThumbnail.id },
      {
        $set: {
          'predictions.$.thumbnail.fileName': predictionThumbnail.fileName,
        },
      },
    );
  }

  async handlePredictionDeleteEvent(
    predictionEventDto: PredictionDeleteEventDto,
  ) {
    const { patientId, userId, predictionId } = predictionEventDto;

    return this.patientsRepository.findOneAndUpdate(
      { 'predictions.thumbnail.id': predictionId },
      {
        $pull: {
          predictions: { 'thumbnail.id': new Types.ObjectId(predictionId) },
        },
      },
    );
  }
}
