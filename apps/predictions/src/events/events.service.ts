import { Inject, Injectable } from '@nestjs/common';
import { PredictionsRepository } from '../repositories/predictions.repository';
import { PatientNewToPredictionsDto, Services } from '@app/common';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class EventsService {
  constructor(
    private readonly predictionsRepository: PredictionsRepository,
    @Inject(Services.Patients) private readonly patientsClient: ClientProxy,
    @Inject(Services.Doctors) private readonly doctorsClient: ClientProxy,
  ) {}
  async handlePatientNew(patientData: PatientNewToPredictionsDto) {
    const spotForNewPatient = {
      patientData,
    };

    return this.predictionsRepository.create(spotForNewPatient);
  }

  async handlePatientEdit(patientData: Partial<PatientNewToPredictionsDto>) {
    // Construct the $set to only contain the updated properties
    const $set = {};
    Object.keys(patientData).forEach((key) => {
      $set[`patientData.${key}`] = patientData[key];
    });

    return this.predictionsRepository.findOneAndUpdate(
      { 'patientData.id': patientData.id },
      { $set },
    );
  }
}
