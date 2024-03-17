import {
  Body,
  Controller,
  Get,
  Post,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { AuthToken } from './decorators/auth-token.decorator';
import { PredictionsService } from './predictions.service';
import { CreatePredictionDto } from './dto/create-prediction-dto';
import { EventPattern, Payload } from '@nestjs/microservices';
import { PatientsEvents } from '../../../libs/common/src';
import { PatientNewToPredictionsDto } from '@app/common';

@Controller('predictions')
export class PredictionsController {
  constructor(private readonly predictionsService: PredictionsService) {}

  @Get()
  async getPredictions() {
    return this.predictionsService.fetchPredictions();
  }

  @Post()
  @UseInterceptors(FilesInterceptor('files'))
  async createPrediction(
    @AuthToken() authToken: string,
    @UploadedFiles() imageFiles: Express.Multer.File[],
    @Body() createPredictionDto: CreatePredictionDto,
  ) {
    // console.log(imageFiles);

    return this.predictionsService.create(
      authToken,
      imageFiles,
      createPredictionDto,
    );
  }

  // Routes to listen to events

  // Listen to "patient-new" event
  @EventPattern(PatientsEvents.PatientNew)
  async newPatient(@Payload() data: PatientNewToPredictionsDto) {
    console.log('Accepted data in predictions: ', data);

    this.predictionsService.createPredictionSpot(data);
  }

  // Listen to "patient-edit" event

  // Listen to "patient-delete" event

  // Listen to "doctor-edit" event
}
