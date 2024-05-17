import { AbstractRepository, PredictionDocument } from '@app/common';
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class PredictionsRepository extends AbstractRepository<PredictionDocument> {
  protected logger: Logger = new Logger(PredictionsRepository.name);

  constructor(
    @InjectModel(PredictionDocument.name)
    predictionModel: Model<PredictionDocument>,
  ) {
    super(predictionModel);
  }
}
