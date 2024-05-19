import {
  PatientDeleteEventDto,
  PatientNewEventDto,
  PatientsEvents,
  PredictionDeleteEventDto,
  PredictionNewEventDto,
  PredictionsThumbnail,
  PredictionUpdateEventDto,
  Services,
} from '@app/common';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Types } from 'mongoose';
import { forkJoin } from 'rxjs';
import { PatientsRepository } from '../patients.repository';

@Injectable()
export class EventsService {
  private logger = new Logger(EventsService.name);

  constructor(
    @Inject(Services.Doctors) private readonly doctorsClient: ClientProxy,
    @Inject(Services.Predictions)
    private readonly predictionsClient: ClientProxy,
    private readonly patientsRepository: PatientsRepository,
  ) {}

  private async emitEvents(
    targetClients: ClientProxy[],
    eventToEmit: PatientsEvents,
    eventDto:
      | PatientNewEventDto
      | Partial<PatientNewEventDto>
      | PatientDeleteEventDto,
  ) {
    let observables = targetClients.map((targetClient) => {
      return targetClient.emit(eventToEmit, eventDto);
    });
    forkJoin(observables).subscribe({
      next: ([observable1, observable2]) => {
        const response = `${eventToEmit} event: ${observable1}, ${observable2}`;
        console.log(response);
        this.logger.log(response);
      },
      error: (err) => {
        const errorResponse = `Error emitting ${eventToEmit} event, ${err}`;
        console.error('Error', err);
        this.logger.error(errorResponse);
      },
      complete: () => {
        const message = `Finish emitting ${eventToEmit} event`;
        console.log(message);
        this.logger.log(message);
      },
    });
  }

  // Emit prediction-new event
  async emitPatientNewEvent(patientNewEventDto: PatientNewEventDto) {
    this.emitEvents(
      [this.predictionsClient],
      PatientsEvents.PatientNew,
      patientNewEventDto,
    );
  }

  // Emit prediction-update event
  async emitPatientUpdateEvent(
    patientUpdateEventDto: Partial<PatientNewEventDto>,
  ) {
    this.emitEvents(
      [this.predictionsClient],
      PatientsEvents.PatientUpdate,
      patientUpdateEventDto,
    );
  }

  // Emit prediction-delete event
  async emitPatientDeleteEvent(patientDeleteEventDto: PatientDeleteEventDto) {
    this.emitEvents(
      [this.predictionsClient, this.doctorsClient],
      PatientsEvents.PatientDelete,
      patientDeleteEventDto,
    );
  }

  // Handle prediction-new event
  async handlePredictionNewEvent(predictionNewEventDto: PredictionNewEventDto) {
    const { patientId, doctorId, predictionThumbnail } = predictionNewEventDto;

    const predictionToSave: PredictionsThumbnail = {
      patientId,
      doctorId,
      thumbnail: predictionThumbnail,
    };

    return this.patientsRepository.findOneAndUpdate(
      { _id: patientId },
      { $push: { predictions: { ...predictionToSave } } },
    );
  }

  // Handle prediction-update event
  async handlePredictionUpdateEvent(
    predictionUpdateEventDto: PredictionUpdateEventDto,
  ) {
    const { predictionThumbnail } = predictionUpdateEventDto;

    return this.patientsRepository.findOneAndUpdate(
      { 'predictions.thumbnail.id': predictionThumbnail.id },
      {
        $set: {
          'predictions.$.thumbnail.fileName': predictionThumbnail.fileName,
        },
      },
    );
  }

  // Handle prediction-delete event
  async handlePredictionDeleteEvent(
    predictionDeleteEventDto: PredictionDeleteEventDto,
  ) {
    const { predictionId } = predictionDeleteEventDto;

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
