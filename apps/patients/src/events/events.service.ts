import { Inject, Injectable } from '@nestjs/common';
import {
  PatientNewToPredictionsDto,
  PatientsEvents,
  Services,
} from '@app/common';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class EventsService {
  constructor(
    @Inject(Services.Doctors) private readonly doctorsClient: ClientProxy,
    @Inject(Services.Predictions)
    private readonly predictionsClient: ClientProxy,
  ) {}

  async emitPatientNewEvent(patientData: PatientNewToPredictionsDto) {
    this.predictionsClient.emit(PatientsEvents.PatientNew, {
      ...patientData,
    });
  }

  async emitPatientEditEvent(patientData: Partial<PatientNewToPredictionsDto>) {
    this.predictionsClient.emit(PatientsEvents.PatientEdit, {
      ...patientData,
    });
  }
}
