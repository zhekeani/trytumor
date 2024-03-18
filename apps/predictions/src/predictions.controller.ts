import { JwtAuthGuard, TokenPayloadProperties } from '@app/common';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
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

@Controller('predictions')
export class PredictionsController {
  constructor(private readonly predictionsService: PredictionsService) {}

  @Get()
  async getPredictions() {
    return this.predictionsService.fetchPredictions();
  }

  @Post('create')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FilesInterceptor('files'))
  async createPrediction(
    @AuthToken() authToken: string,
    @UploadedFiles() imageFiles: Express.Multer.File[],
    @Body() createPredictionDto: CreatePredictionDto,
    @Req() request: Request,
  ) {
    // console.log(imageFiles);
    const tokenPayload = request.user as TokenPayloadProperties;

    return this.predictionsService.create(
      tokenPayload,
      authToken,
      imageFiles,
      createPredictionDto,
    );
  }

  @Delete(':id')
  async deletePrediction(@Param('id') id: string) {
    return this.predictionsService.delete(id);
  }
}
