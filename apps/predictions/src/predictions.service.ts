import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PredictionsRepository } from './predictions.repository';
import { ConfigService } from '@nestjs/config';
import { StorageService } from '@app/common';
import { PercentageDto } from './dto/prediction-result.dto';
import axios from 'axios';

@Injectable()
export class PredictionsService {
  constructor(
    private readonly predictionsRepository: PredictionsRepository,
    private readonly configService: ConfigService,
    private readonly storageService: StorageService,
  ) {}

  private async sendPrediction(
    imageFile: Express.Multer.File,
    authToken: string,
  ): Promise<PercentageDto> {
    // const apiUrl = this.configService.get('PREDICTION_URL');
    const apiUrl =
      'http://trytumor-create-predictions-1:8000/predictions/single';
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

      console.log(response.data);
      return response.data as unknown as PercentageDto;
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async create(authToken: string, imageFiles: Express.Multer.File[]) {
    const promises = imageFiles.map(async (imageFile) => {
      return this.sendPrediction(imageFile, authToken);
    });

    const predictionResult = await Promise.all(promises);
    return predictionResult;
  }
}
