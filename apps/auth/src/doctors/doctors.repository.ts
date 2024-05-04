import { Injectable, Logger } from '@nestjs/common';
import { AbstractRepository } from '@app/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DoctorDocument } from './models/doctor.schema';

@Injectable()
export class DoctorsRepository extends AbstractRepository<DoctorDocument> {
  protected logger: Logger = new Logger(DoctorsRepository.name);

  constructor(
    @InjectModel(DoctorDocument.name) userModel: Model<DoctorDocument>,
  ) {
    super(userModel);
  }
}
