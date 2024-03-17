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
import { CreatePredictionDto } from './dto/create-prediction-dto';
import { PredictionsService } from './predictions.service';

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
}
