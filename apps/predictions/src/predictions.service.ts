import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import * as Bluebird from 'bluebird';
import axios, { AxiosRequestConfig } from 'axios';
import { PredictionsRepository } from './predictions.repository';
import { PubsubService, StorageService } from '@app/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PredictionsService {
  private logger = new Logger(PredictionsService.name);

  constructor(
    private readonly predictionsRepository: PredictionsRepository,
    private readonly storageService: StorageService,
    private readonly pubsubService: PubsubService,
    private readonly configService: ConfigService,
  ) {}

  getHello(): string {
    return 'Hello World!';
  }

  async callCloudFunction(
    authToken: string,
    topicId: string,
    storageBucketPath: string,
    imageIndex: number,
  ) {
    const cloudFnUrl = this.configService.get('CLOUD_FN_URL');

    const config: AxiosRequestConfig = {
      headers: {
        'auth-token': authToken,
      },
    };

    try {
      const response = await axios.post(
        cloudFnUrl,
        {
          topicId,
          storageBucketPath,
          imageIndex,
        },
        config,
      );
      return response.data;
    } catch (error) {
      this.logger.warn(error.message);
      throw UnauthorizedException;
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
          const cloudFnResponse = await this.callCloudFunction(
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
      const receivedMessagesString = await this.pubsubService.listenForMessages(
        subscription,
        files.length,
      );

      receivedMessagesString.forEach((receivedMessageString) => {
        const receivedMessageObj = JSON.parse(receivedMessageString) as {
          index: number;
          percentage: any;
        };
        predictionsResult[receivedMessageObj.index].percentage =
          receivedMessageObj.percentage;
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
