import { Injectable, Logger } from '@nestjs/common';
import { AbstractRepository } from '@app/common';
import { PatientDocument } from '../models/patient.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class PatientsRepository extends AbstractRepository<PatientDocument> {
  protected logger: Logger = new Logger(PatientsRepository.name);

  constructor(
    @InjectModel(PatientDocument.name) patientModel: Model<PatientDocument>,
  ) {
    super(patientModel);
  }
}
