import { DatabaseModule, JwtStrategy, StorageModule } from '@app/common';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as Joi from 'joi';

import { EventsModule } from './events/events.module';
import { PredictionsController } from './predictions.controller';
import { PredictionsService } from './predictions.service';
import {
  PredictionDocument,
  PredictionSchema,
} from './models/prediction.schema';
import { PredictionsRepository } from './repositories/predictions.repository';
import { UtilsService } from './utils/utils.service';

@Module({
  imports: [
    EventsModule,
    ConfigModule.forRoot({
      isGlobal: true,

      // Accommodate the different root directory when running on
      // development and testing environment
      envFilePath: ['.env', 'apps/predictions/.env'],

      validationSchema: Joi.object({
        HTTP_PORT: Joi.number().required(),
        RMQ_PORT: Joi.number().required(),

        PATIENTS_HOST: Joi.string().required(),
        PATIENTS_PORT: Joi.number().required(),
        DOCTORS_HOST: Joi.string().required(),
        DOCTORS_PORT: Joi.number().required(),

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
  providers: [
    PredictionsService,
    PredictionsRepository,
    JwtStrategy,
    UtilsService,
    {
      provide: 'JWT_TESTING_SECRET',
      useValue: 'testing_secret',
    },
  ],
})
export class PredictionsModule {}
