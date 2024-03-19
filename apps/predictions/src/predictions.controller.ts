import { JwtAuthGuard, TokenPayloadProperties } from '@app/common';
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
import { FilesInterceptor } from '@nestjs/platform-express';
import { Request } from 'express';
import { AuthToken } from './decorators/auth-token.decorator';
import { CreatePredictionDto } from './dto/create-prediction.dto';
import { PredictionsService } from './predictions.service';
import { EditPredictionDto } from './dto/edit-prediction.dto';

@Controller('predictions')
export class PredictionsController {
  constructor(private readonly predictionsService: PredictionsService) {}

  @Get()
  async getPredictions() {
    return this.predictionsService.fetchAll();
  }

  @Get('patient/:id')
  async getPredictionsByPatientId(@Param('id') id: string) {
    return this.predictionsService.fetchByPatientId(id);
  }

  @Get('prediction/:id')
  async getPredictionById(@Param('id') id: string) {
    return this.predictionsService.fetchByPredictionId(id);
  }

  @Post('patient/create/:id')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FilesInterceptor('files'))
  async createPrediction(
    @AuthToken() authToken: string,
    @UploadedFiles() imageFiles: Express.Multer.File[],
    @Body() createPredictionDto: CreatePredictionDto,
    @Req() request: Request,
    @Param('id') id: string,
  ) {
    // console.log(imageFiles);
    const tokenPayload = request.user as TokenPayloadProperties;

    return this.predictionsService.create(
      tokenPayload,
      authToken,
      imageFiles,
      createPredictionDto,
      id,
    );
  }

  @Patch('update/:id')
  async updatePrediction(
    @Param('id') id: string,
    @Body() editPredictionDto: EditPredictionDto,
  ) {
    return this.predictionsService.update(id, editPredictionDto);
  }

  @Delete('delete/document/:id')
  async deletePredictionDocument(@Param('id') id: string) {
    return this.predictionsService.deletePredictionDocument(id);
  }

  @Delete('delete/:id')
  async deletePrediction(@Param('id') id: string) {
    return this.predictionsService.delete(id);
  }
}
