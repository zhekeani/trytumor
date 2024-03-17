import { StorageService } from '@app/common';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { CreatePredictionDto } from './dto/create-prediction-dto';
import {
  PercentageDto,
  PredictionResultDto,
} from './dto/prediction-result.dto';
import { PredictionsRepository } from './repositories/predictions.repository';

@Injectable()
export class PredictionsService {
  constructor(
    private readonly predictionsRepository: PredictionsRepository,
    private readonly configService: ConfigService,
    private readonly storageService: StorageService,
  ) {}

  private async sendPrediction(
    imageFile: Express.Multer.File,
    imageIndex: number,
    authToken: string,
  ): Promise<PredictionResultDto> {
    const apiUrl = this.configService.get('PREDICTION_URL');
    const formData = new FormData();

    const blob = new Blob([imageFile.buffer], { type: imageFile.mimetype });

    formData.append('image_file', blob, imageFile.originalname);

    try {
      const response = await axios.post(apiUrl, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${authToken}`,
        },
      });

      const percentages = response.data as unknown as PercentageDto;

      const predictionResult = {
        imageIndex,
        percentages,
      } as PredictionResultDto;

      console.log(predictionResult);

      return predictionResult;
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async create(
    authToken: string,
    imageFiles: Express.Multer.File[],
    createPredictionDto: CreatePredictionDto,
  ) {
    const promises = imageFiles.map(async (imageFile, index) => {
      return this.sendPrediction(imageFile, index, authToken);
    });

    const predictionResult = await Promise.all(promises);
    return predictionResult;
  }

  async fetchPredictions() {
    return this.predictionsRepository.find({});
  }
}
