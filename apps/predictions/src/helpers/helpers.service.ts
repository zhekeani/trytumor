import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { PredictionsRepository } from '../predictions.repository';
import {
  PercentageResult,
  PredictionDataSchema,
  PredictionResult,
  PredictionResultSchema,
  PubsubService,
  StorageService,
  TokenPayload,
} from '@app/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosRequestConfig } from 'axios';
import { CreatePredictionCloudFn } from '../utils/interfaces/create-prediction-cloud-fn.interface';
import { CreatePredictionDto } from '../utils/dto/create-prediction.dto';
import { Types } from 'mongoose';

@Injectable()
export class HelpersService {
  private logger = new Logger(HelpersService.name);

  constructor(
    private readonly predictionsRepository: PredictionsRepository,
    private readonly storageService: StorageService,
    private readonly pubsubService: PubsubService,
    private readonly configService: ConfigService,
  ) {}

  async createRequestToCloudFn(
    authToken: string,
    topicId: string,
    imageStorageBucketPath: string,
    imageIndex: number,
  ) {
    const cloudFnUrl = this.configService.get('CLOUD_FN_URL');

    const config: AxiosRequestConfig = {
      headers: {
        'auth-token': authToken,
      },
    };

    const createPredictionDto: CreatePredictionCloudFn = {
      topicId,
      storageBucketPath: imageStorageBucketPath,
      imageIndex,
    };

    try {
      const response = await axios.post(
        cloudFnUrl,
        createPredictionDto,
        config,
      );
      return response.data;
    } catch (error) {
      this.logger.warn(error.message);
      if (error.statusCode && error.statusCode == 401) {
        throw new UnauthorizedException(error.message);
      }
      throw UnauthorizedException;
    }
  }

  private async calculatePredictionNumber(patientId: string) {
    const predictionArray = await this.predictionsRepository.aggregate([
      { $match: { 'patientData.id': patientId } },
      { $project: { arrayLength: { $size: '$predictionsData' } } },
    ]);
    const predictionNumber =
      predictionArray[0] && predictionArray[0].arrayLength > 0
        ? predictionArray[0].arrayLength + 1
        : 1;
    return predictionNumber;
  }

  private async calculatePredictionResultMean(
    predictionsResult: PredictionResult[],
  ) {
    const initialAccumulation: PercentageResult = {
      glioma: 0,
      meningioma: 0,
      noTumor: 0,
      pituitary: 0,
    };

    // Sum all the percentage
    const predictionsResultMean = predictionsResult.reduce(
      (accumulation, result) => {
        Object.keys(initialAccumulation).forEach((key) => {
          accumulation[key] += result.percentage[key];
        });
        return accumulation;
      },
      initialAccumulation,
    );

    // dived by the prediction result number
    Object.keys(predictionsResultMean).forEach((key) => {
      predictionsResultMean[key] /= predictionsResult.length;
    });

    return predictionsResultMean;
  }

  async constructPredictionDataSchema(
    tokenPayload: TokenPayload,
    createPredictionDto: CreatePredictionDto,
    predictionsResult: PredictionResult[],
    patientId: string,
    predictionDataId: string,
  ) {
    // Calculate the prediction numb er
    const predictionNumber = await this.calculatePredictionNumber(patientId);

    // Sort the predictionsResultDto based on index
    predictionsResult.sort((a, b) => a.index - b.index);

    // Convert predictionResult to predictionResultSchema
    const predictionsResultSchema: PredictionResultSchema[] =
      predictionsResult.map((predictionResult) => {
        const predictionResultSchema: PredictionResultSchema = {
          imageIndex: predictionResult.index,
          imageUrl: predictionResult.imagePublicUrl,
          percentages: predictionResult.percentage,
        };
        return predictionResultSchema;
      });

    // Calculate prediction result mean
    const predictionsResultMean =
      await this.calculatePredictionResultMean(predictionsResult);

    const predictionDate = new Date(Date.now());

    const predictionDataSchema: PredictionDataSchema = {
      id: predictionDataId,
      number: predictionNumber,
      doctorId: tokenPayload.doctorId,
      doctorFullName: tokenPayload.fullName,
      dateAndTime: predictionDate,
      results: predictionsResultSchema,
      resultsMean: predictionsResultMean,
      fileName: createPredictionDto.fileName,
      additionalNotes: createPredictionDto.additionalNotes,
    };

    return predictionDataSchema;
  }

  constructPredictionPath(
    patientId: string,
    predictionId: string,
    imageIndex: number,
  ) {
    return `media/patients/${patientId}/predictions/${predictionId}/prediction-${predictionId}-${imageIndex}`;
  }

  constructPatientDirPath() {
    return 'media/patients';
  }

  async saveImageToStorageBucket(
    imageFile: Express.Multer.File,
    patientId: string,
    predictionId: string,
    imageIndex: number,
  ) {
    const path = this.constructPredictionPath(
      patientId,
      predictionId,
      imageIndex,
    );
    const { publicUrl } = await this.storageService.save(
      path,
      imageFile.mimetype,
      imageFile.buffer,
      [{ patientId }, { predictionId }, { imageIndex: imageIndex.toString() }],
    );

    return publicUrl;
  }

  async storePredictionData(
    patientId: string,
    predictionDataSchema: PredictionDataSchema,
  ) {
    return this.predictionsRepository.findOneAndUpdate(
      { 'patientData.id': new Types.ObjectId(patientId) },
      {
        $push: {
          predictionsData: { ...predictionDataSchema },
        },
      },
      {
        projection: {
          predictionsData: { $slice: -1 },
          patientData: 1,
        },
      },
    );
  }
}
