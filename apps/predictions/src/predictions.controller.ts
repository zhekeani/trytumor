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
import { JwtAuthGuard, TokenPayload, ValidateObjectId } from '@app/common';
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
  // Get all predictions
  @Get()
  async getPredictions() {
    return this.predictionsService.fetchAll();
  }

  // Get all predictions for specific patient
  @Get('patient/:id')
  async getPredictionsByPatientId(@Param('id', ValidateObjectId) id: string) {}

  // Get specific prediction
  @Get('prediction/:id')
  async getPredictionById(@Param('id', ValidateObjectId) id: string) {
    return this.predictionsService.fetchPredictionById(id);
  }

  // Create prediction
  @Post('patient/create/:id')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FilesInterceptor('files'))
  async createPrediction(
    @Param('id', ValidateObjectId) id: string,
    @AuthToken() authToken: string,
    @UploadedFiles() imageFiles: Express.Multer.File[],
    @Req() request: Request,
    @Body() createPredictionDto: CreatePredictionDto,
  ) {
    const tokenPayload = request.user as TokenPayload;
    return this.predictionsService.create(
      id,
      authToken,
      tokenPayload,
      createPredictionDto,
      imageFiles,
    );
  }

  // Update prediction
  @Patch('update/:id')
  async updatePrediction(
    @Param('id', ValidateObjectId) id: string,
    @Body() updatePredictionDto: UpdatePredictionDto,
  ) {
    return this.predictionsService.update(id, updatePredictionDto);
  }

  // Delete prediction
  @Delete('delete/:id')
  async deletePrediction(@Param('id', ValidateObjectId) id: string) {
    return this.predictionsService.delete(id);
  }
}
