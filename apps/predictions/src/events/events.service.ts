import {
  PatientDeleteDto,
  PatientNewToPredictionsDto,
  PredictionDeleteEventDto,
  PredictionEditEventDto,
  PredictionNewEventDto,
  PredictionsEvents,
  Services,
} from '@app/common';
import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { PredictionsRepository } from '../repositories/predictions.repository';

@Injectable()
export class EventsService {
  constructor(
    private readonly predictionsRepository: PredictionsRepository,
    @Inject(Services.Patients) private readonly patientsClient: ClientProxy,
    @Inject(Services.Doctors) private readonly doctorsClient: ClientProxy,
  ) {}

  async emitPredictionNewEvent(predictionEventDto: PredictionNewEventDto) {
    this.patientsClient.emit(PredictionsEvents.PredictionsNew, {
      ...predictionEventDto,
    });
  }

  async emitPredictionEditEvent(predictionEventDto: PredictionEditEventDto) {
    this.patientsClient.emit(PredictionsEvents.PredictionsEdit, {
      ...predictionEventDto,
    });
  }

  async emitPredictionDeleteEvent(
    predictionEventDto: PredictionDeleteEventDto,
  ) {
    this.patientsClient.emit(PredictionsEvents.PredictionsDelete, {
      ...predictionEventDto,
    });
  }

  async handlePatientNewEvent(patientNewDto: PatientNewToPredictionsDto) {
    const spotForNewPatient = {
      patientData: patientNewDto,
    };

    return this.predictionsRepository.create(spotForNewPatient);
  }

  async handlePatientEditEvent(
    patientEditDto: Partial<PatientNewToPredictionsDto>,
  ) {
    // Construct the $set to only contain the updated properties
    const $set = {};
    Object.keys(patientEditDto).forEach((key) => {
      $set[`patientData.${key}`] = patientEditDto[key];
    });

    return this.predictionsRepository.findOneAndUpdate(
      { 'patientData.id': patientEditDto.id },
      { $set },
    );
  }

  async handlePatientDeleteEvent(patientDeleteDto: PatientDeleteDto) {
    return this.predictionsRepository.findOneAndDelete({
      'patientData.id': patientDeleteDto.id,
    });
  }
}
