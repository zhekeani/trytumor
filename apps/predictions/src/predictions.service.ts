import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PredictionsRepository } from './predictions.repository';
import { ConfigService } from '@nestjs/config';
import { StorageService } from '@app/common';
import {
  PercentageDto,
  PredictionResultDto,
} from './dto/prediction-result.dto';
import axios from 'axios';
import { CreatePredictionDto } from './dto/create-prediction-dto';

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

  async createPatient() {
    const dummyData = {
      patientData: {
        id: '1234567890', // Example ID
        fullName: 'John Doe',
        gender: 'male', // Assuming a male gender
        birthDate: new Date('1990-01-01'), // Example birth date
      },
    };

    return this.predictionsRepository.create(dummyData);
  }
}
