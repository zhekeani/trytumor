import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DatabaseModule, StorageModule } from '@app/common';
import * as Joi from 'joi';

import { PredictionsController } from './predictions.controller';
import { PredictionsService } from './predictions.service';
import {
  PredictionDocument,
  PredictionSchema,
} from './models/prediction.schema';
import { PredictionsRepository } from './predictions.repository';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,

      validationSchema: Joi.object({
        HTTP_PORT: Joi.number().required(),
        RMQ_PORT: Joi.number().required(),
        MONGODB_URI: Joi.string().required(),
        JWT_SECRET: Joi.string().required(),
        GOOGLE_STORAGE_PROJECT_ID: Joi.string().required(),
        GOOGLE_STORAGE_CLIENT_EMAIL: Joi.string().required(),
        GOOGLE_STORAGE_BUCKET_NAME: Joi.string().required(),
        GOOGLE_STORAGE_PRIVATE_KEY: Joi.string().required(),
        PREDICTION_URL: Joi.string().required(),
      }),
    }),
    DatabaseModule,
    DatabaseModule.forFeature([
      { name: PredictionDocument.name, schema: PredictionSchema },
    ]),
    StorageModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        projectId: configService.get('GOOGLE_STORAGE_PROJECT_ID'),
        clientEmail: configService.get('GOOGLE_STORAGE_CLIENT_EMAIL'),
        privateKey: configService.get('GOOGLE_STORAGE_PRIVATE_KEY'),
        bucketName: configService.get('GOOGLE_STORAGE_BUCKET_NAME'),
      }),
    }),
  ],
  controllers: [PredictionsController],
  providers: [PredictionsService, PredictionsRepository],
})
export class PredictionsModule {}
