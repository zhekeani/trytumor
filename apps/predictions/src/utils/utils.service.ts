import { TokenPayloadProperties } from '@app/common';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { CreatePredictionDto } from '../dto/create-prediction.dto';
import {
  PercentageDto,
  PredictionResultDto,
} from '../dto/prediction-result.dto';
import {
  Percentage,
  PredictionResult,
} from '../models/prediction-result.schema.ts';
import { PredictionData } from '../models/prediction.schema';
import { PredictionsRepository } from '../repositories/predictions.repository';

// Helper service for predictions service
@Injectable()
export class UtilsService {
  constructor(
    private readonly configService: ConfigService,
    private readonly predictionsRepository: PredictionsRepository,
  ) {}

  async sendPrediction(
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

      const predictionResult: PredictionResultDto = {
        imageUrl: '',
        imageIndex,
        percentages,
      };

      return predictionResult;
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async fetchPatientData(patientId: string) {
    const patient = await this.predictionsRepository.findOne({
      'patientData.id': patientId,
    });
    return patient.patientData;
  }

  async constructPredictionData(
    tokenPayload: TokenPayloadProperties,
    createPredictionDto: CreatePredictionDto,
    predictionResultDtos: PredictionResultDto[],
    predictionDataId: string,
    patientId: string,
  ) {
    // Get the prediction number
    const predictionArray = await this.predictionsRepository.aggregate([
      { $match: { 'patientData.id': patientId } },
      { $project: { arrayLength: { $size: '$predictionsData' } } },
    ]);

    const predictionNumber =
      predictionArray[0] && predictionArray[0].arrayLength > 0
        ? predictionArray[0].arrayLength + 1
        : 1;

    // Create the prediction Date object
    const predictionDate = new Date(Date.now());

    // Sort the prediction by it index
    predictionResultDtos.sort((a, b) => a.imageIndex - b.imageIndex);

    // Construct result base on PredictionResult Schema
    const results: PredictionResult[] = predictionResultDtos.map(
      (predictionResultDto) => {
        const percentages: Percentage = {
          ...predictionResultDto.percentages,
        };

        const predictionResult: PredictionResult = {
          ...predictionResultDto,
          percentages,
        };
        return predictionResult;
      },
    );

    // Calculate the percentage results mean
    const initialAcc = {
      glioma: 0,
      meningioma: 0,
      noTumor: 0,
      pituitary: 0,
    };
    const resultsMean = predictionResultDtos.reduce((acc, result) => {
      Object.keys(initialAcc).forEach((key) => {
        acc[key] += result.percentages[key];
      });

      return acc;
    }, initialAcc);

    Object.keys(resultsMean).forEach((key) => {
      resultsMean[key] /= predictionResultDtos.length;
    });

    // Return the PredictionDataDto
    const predictionData: PredictionData = {
      id: predictionDataId,
      number: predictionNumber,
      userId: tokenPayload.userId,
      doctorName: tokenPayload.fullName,
      dateAndTime: predictionDate,
      results: results,
      resultsMean,
      fileName: createPredictionDto.fileName,
      additionalNotes: createPredictionDto.additionalNotes,
    };

    return predictionData;
  }

  constructPath(patientId: string, predictionId: string, imageIndex: number) {
    return `media/patients/${patientId}/predictions/${predictionId}/prediction-${predictionId}-${imageIndex}`;
  }
}
