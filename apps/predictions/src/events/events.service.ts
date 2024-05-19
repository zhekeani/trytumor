import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  DoctorUpdateEventDto,
  PatientDeleteEventDto,
  PatientNewEventDto,
  PredictionDeleteEventDto,
  PredictionNewEventDto,
  PredictionsEvents,
  PredictionUpdateEventDto,
  Services,
} from '@app/common';
import { ClientProxy } from '@nestjs/microservices';
import { PredictionsRepository } from '../predictions.repository';
import { forkJoin } from 'rxjs';

@Injectable()
export class EventsService {
  private logger = new Logger(EventsService.name);

  constructor(
    @Inject(Services.Doctors) private readonly doctorsClient: ClientProxy,
    @Inject(Services.Patients) private readonly patientsClient: ClientProxy,
    private readonly predictionsRepository: PredictionsRepository,
  ) {}

  private async emitEvents(
    targetClients: ClientProxy[],
    eventToEmit: PredictionsEvents,
    eventDto:
      | PredictionNewEventDto
      | PredictionUpdateEventDto
      | PredictionDeleteEventDto,
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
  async emitPredictionNewEvent(predictionNewEventDto: PredictionNewEventDto) {
    this.emitEvents(
      [this.doctorsClient, this.patientsClient],
      PredictionsEvents.PredictionsNew,
      predictionNewEventDto,
    );
  }

  // Emit prediction-update event
  async emitPredictionUpdateEvent(
    predictionUpdateEventDto: PredictionUpdateEventDto,
  ) {
    this.emitEvents(
      [this.doctorsClient, this.patientsClient],
      PredictionsEvents.PredictionsUpdate,
      predictionUpdateEventDto,
    );
  }

  // Emit prediction-delete event
  async emitPredictionDeleteEvent(
    predictionDeleteEventDto: PredictionDeleteEventDto,
  ) {
    this.emitEvents(
      [this.doctorsClient, this.patientsClient],
      PredictionsEvents.PredictionsDelete,
      predictionDeleteEventDto,
    );
  }

  // Handle patient-new event
  async handlePatientNewEvent(patientNewEventDto: PatientNewEventDto) {
    return this.predictionsRepository.create({
      patientData: patientNewEventDto,
    });
  }

  // Handle patient-update event
  async handlePatientUpdateEvent(
    patientUpdateEventDto: Partial<PatientNewEventDto>,
  ) {
    const $set = {};
    Object.keys(patientUpdateEventDto).forEach((key) => {
      $set[`patientData.${key}`] = patientUpdateEventDto[key];
    });

    return this.predictionsRepository.findOneAndUpdate(
      { 'patientData.id': patientUpdateEventDto.id },
      { $set },
    );
  }

  // Handle patient-delete event
  async handlePatientDeleteEvent(patientDeleteEventDto: PatientDeleteEventDto) {
    return this.predictionsRepository.findOneAndDelete({
      'patientData.id': patientDeleteEventDto.id,
    });
  }

  // Handle doctor-update event
  async handleDoctorUpdateEvent(doctorUpdateEventDto: DoctorUpdateEventDto) {}
}
