import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { PredictionsService } from './predictions.service';
import { JwtAuthGuard, ValidateObjectId } from '@app/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { AuthToken } from './utils/decorators/auth-token.decorator';
import { Request } from 'express';
import { CreatePredictionDto } from './utils/dto/create-prediction.dto';
import { UpdatePredictionDto } from './utils/dto/update-prediction.dto';

@Controller('predictions')
export class PredictionsController {
  constructor(private readonly predictionsService: PredictionsService) {}

  @Get('hello-world')
  getHello(): string {
    return this.predictionsService.getHello();
  }

  // try creating prediction
  @Post('try-predict')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FilesInterceptor('files'))
  tryPredict(
    @AuthToken() authToken: string,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.predictionsService.createMultiplePrediction(files, authToken);
  }

  // Get all predictions
  @Get()
  getPredictions() {}

  // Get all predictions for specific patient
  @Get('patient/:id')
  getPredictionsByPatientId(@Param('id', ValidateObjectId) id: string) {}

  // Get specific prediction
  @Get('prediction/:id')
  getPredictionById(@Param('id', ValidateObjectId) id: string) {}

  // Create prediction
  @Post('patient/create/:id')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FilesInterceptor('files'))
  createPrediction(
    @Param('id', ValidateObjectId) id: string,
    @AuthToken() authToken: string,
    @UploadedFiles() imageFiles: Express.Multer.File[],
    @Req() request: Request,
    @Body() createPredictionDto: CreatePredictionDto,
  ) {}

  // Update prediction
  @Patch('update/:id')
  async updatePrediction(
    @Param('id', ValidateObjectId) id: string,
    @Body() updatePredictionDto: UpdatePredictionDto,
  ) {}

  // Delete prediction
  @Delete('delete/:id')
  async deletePrediction(@Param('id', ValidateObjectId) id: string) {}
}
