import { Inject, Injectable } from '@nestjs/common';
import {
  PatientDeleteDto,
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
}
