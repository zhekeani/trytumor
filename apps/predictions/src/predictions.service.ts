import {
  PredictionResult,
  PubsubService,
  StorageService,
  TokenPayload,
} from '@app/common';
import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Bluebird from 'bluebird';
import { Types } from 'mongoose';
import { EventsService } from './events/events.service';
import { HelpersService } from './helpers/helpers.service';
import { PredictionsRepository } from './predictions.repository';
import { CreatePredictionDto } from './utils/dto/create-prediction.dto';
import { UpdatePredictionDto } from './utils/dto/update-prediction.dto';

@Injectable()
export class PredictionsService {
  private logger = new Logger(PredictionsService.name);

  constructor(
    private readonly predictionsRepository: PredictionsRepository,
    private readonly storageService: StorageService,
    private readonly pubsubService: PubsubService,
    private readonly configService: ConfigService,
    private readonly helpersService: HelpersService,
    private readonly eventsService: EventsService,
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
    const topicToListen = await this.pubsubService.createTopicIfNotExists(
      `nestjs-predict-${tokenPayload.doctorId}-${patientId}`,
    );
    const subscription = await this.pubsubService.createSubscriptionIfNotExists(
      topicToListen,
      `nestjs-predict-multiple-${tokenPayload.doctorId}-${patientId}`,
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

      this.eventsService.emitPredictionNewEvent({
        patientId: savedPrediction.patientData.id,
        doctorId: savedPrediction.predictionsData[0].doctorId,
        predictionThumbnail: {
          id: savedPrediction.predictionsData[0].id,
          fileName: savedPrediction.predictionsData[0].fileName,
          dataAndTime: savedPrediction.predictionsData[0].dateAndTime,
          number: savedPrediction.predictionsData[0].number,
          imageUrl: savedPrediction.predictionsData[0].results[0].imageUrl,
        },
      });

      return savedPrediction;
    } catch (error) {
      console.error(`Received error while publishing: ${error.message}`);
      throw new InternalServerErrorException(error.message);
    }
  }

  // Fetch all predictions
  async fetchAll() {
    return this.predictionsRepository.find({});
  }

  // Fetch specific prediction by ID
  async fetchPredictionById(predictionId: string) {
    return this.predictionsRepository.findOne(
      { 'predictionsData.id': predictionId },
      {
        predictionsData: { $elemMatch: { id: predictionId } },
        patientData: 1,
      },
    );
  }

  // Update prediction
  async update(predictionId: string, updatePredictionDto: UpdatePredictionDto) {
    await this.predictionsRepository.findOneAndUpdate(
      { 'predictionsData.id': predictionId },
      {
        $set: {
          'predictionsData.$.fileName': updatePredictionDto.fileName,
          'predictionsData.$.additionalNotes':
            updatePredictionDto.additionalNotes,
        },
      },
    );

    const updatedPrediction = await this.fetchPredictionById(predictionId);

    this.eventsService.emitPredictionUpdateEvent({
      patientId: updatedPrediction.patientData.id,
      doctorId: updatedPrediction.predictionsData[0].doctorId,
      predictionThumbnail: {
        id: updatedPrediction.predictionsData[0].id,
        fileName: updatedPrediction.predictionsData[0].fileName,
      },
    });

    return updatedPrediction;
  }

  // Delete prediction
  async delete(predictionId: string) {
    const predictionToDelete = await this.fetchPredictionById(predictionId);

    const storageBucketPath = `media/patients/${predictionToDelete.patientData.id}/predictions/${predictionToDelete.predictionsData[0].id}`;

    const results = await Bluebird.Promise.all([
      this.storageService.deleteFilesByDirName(storageBucketPath),
      this.predictionsRepository.findOneAndUpdate(
        { 'predictionsData.id': predictionId },
        {
          $pull: {
            predictionsData: { id: new Types.ObjectId(predictionId) },
          },
        },
      ),
    ]);

    this.eventsService.emitPredictionDeleteEvent({
      patientId: predictionToDelete.patientData.id,
      doctorId: predictionToDelete.predictionsData[0].doctorId,
      predictionId: predictionToDelete.predictionsData[0].id,
    });

    return results[1];
  }
}
