import {
  PredictionResult,
  PubsubService,
  StorageService,
  TokenPayload,
} from '@app/common';
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Bluebird from 'bluebird';
import { Types } from 'mongoose';
import { HelpersService } from './helpers/helpers.service';
import { PredictionsRepository } from './predictions.repository';
import { CreatePredictionDto } from './utils/dto/create-prediction.dto';

@Injectable()
export class PredictionsService {
  private logger = new Logger(PredictionsService.name);

  constructor(
    private readonly predictionsRepository: PredictionsRepository,
    private readonly storageService: StorageService,
    private readonly pubsubService: PubsubService,
    private readonly configService: ConfigService,
    private readonly helpersService: HelpersService,
  ) {}

  getHello(): string {
    return 'Hello World!';
  }

  // Create prediction
  async create(
    patientId: string,
    authToken: string,
    tokenPayload: TokenPayload,
    createPredictionDto: CreatePredictionDto,
    imageFiles: Express.Multer.File[],
  ) {
    // Check if the patient exists
    await this.predictionsRepository.findOne({
      'patientData.id': patientId,
    });

    let imagesFilePath: string[] = Array.from(
      { length: imageFiles.length },
      () => '',
    );
    let predictionsResult: (PredictionResult | undefined)[] = Array.from(
      { length: imageFiles.length },
      () => undefined,
    );

    // create request to cloud function to predict
    const predictionDataId = new Types.ObjectId();
    await Bluebird.Promise.map(
      imageFiles,
      async (imageFile, index) => {
        const imageFilePath = this.helpersService.constructPredictionPath(
          patientId,
          predictionDataId.toHexString(),
          index,
        );
        const imagePublicUrl =
          await this.helpersService.saveImageToStorageBucket(
            imageFile,
            patientId,
            predictionDataId.toHexString(),
            index,
          );

        imagesFilePath[index] = imageFilePath;
        predictionsResult[index] = {
          imagePublicUrl,
          filename: imageFile.originalname,
          index,
        };
      },
      { concurrency: imageFiles.length },
    );

    // Create PubSub topic and subscription
    const topicToListen =
      await this.pubsubService.createTopicIfNotExists('nestjs-predict');
    const subscription = await this.pubsubService.createSubscriptionIfNotExists(
      topicToListen,
      'nestjs-predict-multiple',
    );

    const topicNameToListen = topicToListen.name.split('/').pop();

    try {
      // Send prediction to cloud function
      await Bluebird.Promise.map(
        imagesFilePath,
        async (imageFilePath, index) => {
          const cloudFnResponse =
            await this.helpersService.createRequestToCloudFn(
              authToken,
              topicNameToListen,
              imageFilePath,
              index,
            );
          console.log(JSON.stringify(cloudFnResponse));
        },
        { concurrency: imageFiles.length },
      );

      // Listen to PubSub for prediction result
      const predictionsResultDto = await this.pubsubService.listenForMessages(
        subscription,
        imageFiles.length,
      );
      predictionsResultDto.forEach((predictionResultDto) => {
        predictionsResult[predictionResultDto.index].percentage =
          predictionResultDto.percentage;
      });

      const predictionDataSchema =
        await this.helpersService.constructPredictionDataSchema(
          tokenPayload,
          createPredictionDto,
          predictionsResult,
          patientId,
          predictionDataId.toString(),
        );

      const savedPrediction = await this.helpersService.storePredictionData(
        patientId,
        predictionDataSchema,
      );

      return savedPrediction;
    } catch (error) {
      console.error(`Received error while publishing: ${error.message}`);
      throw new InternalServerErrorException(error.message);
    }
  }

  async createMultiplePrediction(
    files: Express.Multer.File[],
    authToken: string,
  ) {
    if (files.length == 0) {
      throw BadRequestException;
    }

    const topicToListen =
      await this.pubsubService.createTopicIfNotExists('nestjs-predict');
    const topicNameToListen = topicToListen.name.split('/').pop();
    let filesPath: string[] = Array.from({ length: files.length }, () => '');
    let predictionsResult: (any | undefined)[] = Array.from(
      { length: files.length },
      () => undefined,
    );

    await Bluebird.Promise.map(
      files,
      async (file, index) => {
        const path = `media/predictions/${file.originalname}`;
        const { publicUrl } = await this.storageService.save(
          path,
          file.mimetype,
          file.buffer,
          [{ filename: file.originalname }],
        );
        filesPath[index] = path;
        predictionsResult[index] = {
          imagePublicUrl: publicUrl,
          filename: file.originalname,
          index,
        };
      },
      { concurrency: files.length },
    );

    try {
      await Bluebird.Promise.map(
        filesPath,
        async (path, index) => {
          const cloudFnResponse =
            await this.helpersService.createRequestToCloudFn(
              authToken,
              topicNameToListen,
              path,
              index,
            );

          console.log(JSON.stringify(cloudFnResponse));
        },
        { concurrency: files.length },
      );

      const subscription =
        await this.pubsubService.createSubscriptionIfNotExists(
          topicToListen,
          'nestjs-predict-multiple',
        );
      const predictionsResultDto = await this.pubsubService.listenForMessages(
        subscription,
        files.length,
      );

      predictionsResultDto.forEach((predictionResultDto) => {
        predictionsResult[predictionResultDto.index].percentage =
          predictionResultDto.percentage;
      });

      return {
        predictionsResult,
      };
    } catch (error) {
      console.error(`Received error while publishing: ${error.message}`);
      throw InternalServerErrorException;
    }
  }
}
