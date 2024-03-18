import { StorageService, TokenPayloadProperties } from '@app/common';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { CreatePredictionDto } from './dto/create-prediction-dto';
import { PredictionDataDto } from './dto/prediction-data.dto';
import {
  PercentageDto,
  PredictionResultDto,
} from './dto/prediction-result.dto';
import { PredictionDto } from './dto/prediction.dto';
import { PredictionsRepository } from './repositories/predictions.repository';
import { object } from 'joi';

@Injectable()
export class PredictionsService {
  constructor(
    private readonly predictionsRepository: PredictionsRepository,
    private readonly configService: ConfigService,
    private readonly storageService: StorageService,
  ) {}

  async fetchPredictions() {
    return this.predictionsRepository.find({});
  }

  async create(
    tokenPayload: TokenPayloadProperties,
    authToken: string,
    imageFiles: Express.Multer.File[],
    createPredictionDto: CreatePredictionDto,
  ) {
    const promises = imageFiles.map(async (imageFile, index) => {
      return this.sendPrediction(imageFile, index, authToken);
    });

    const predictionResult = await Promise.all(promises);

    const patientData = await this.fetchPatientData(
      createPredictionDto.patientId,
    );

    const predictionsData = await this.constructPredictionData(
      tokenPayload,
      createPredictionDto,
      predictionResult,
    );

    const newPrediction = {
      patientData,
      predictionsData,
    } as PredictionDto;

    return newPrediction;
  }

  async save() {}

  private async sendPrediction(
    imageFile: Express.Multer.File,
    imageIndex: number,
    authToken: string,
  ): Promise<Partial<PredictionResultDto>> {
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
      } as Partial<PredictionResultDto>;

      console.log(predictionResult);

      return predictionResult;
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException(error.message);
    }
  }

  private async fetchPatientData(patientId: string) {
    const patient = await this.predictionsRepository.findOne({
      'patientData.id': patientId,
    });
    return patient.patientData;
  }

  private async constructPredictionData(
    tokenPayload: TokenPayloadProperties,
    createPredictionDto: CreatePredictionDto,
    predictionResultDto: Partial<PredictionResultDto>[],
  ) {
    // Get the prediction number
    const predictionArray = await this.predictionsRepository.aggregate([
      { $match: { 'patientData.id': createPredictionDto.patientId } },
      { $project: { arrayLength: { $size: '$predictionsData' } } },
    ]);

    const predictionNumber =
      predictionArray[0].length > 0 ? predictionArray[0].length + 1 : 1;

    // Create the prediction Date object
    const predictionDate = new Date(Date.now());

    // Sort the prediction by it index
    predictionResultDto.sort((a, b) => a.imageIndex - b.imageIndex);

    // Calculate the percentage results mean
    const initialAcc = {
      glioma: 0,
      meningioma: 0,
      noTumor: 0,
      pituitary: 0,
    };
    const resultsMean = predictionResultDto.reduce((acc, result) => {
      Object.keys(initialAcc).forEach((key) => {
        acc[key] += result.percentages[key];
      });

      return acc;
    }, initialAcc);

    Object.keys(resultsMean).forEach((key) => {
      resultsMean[key] /= predictionResultDto.length;
    });

    // Return the PredictionDataDto
    const predictionData = {
      number: predictionNumber,
      userId: tokenPayload.userId,
      doctorName: tokenPayload.fullName,
      dateAndTime: predictionDate,
      results: predictionResultDto,
      resultsMean,
      fileName: createPredictionDto.fileName,
      additionalNotes: createPredictionDto.additionalNotes,
    } as PredictionDataDto;

    return predictionData;
  }
}
