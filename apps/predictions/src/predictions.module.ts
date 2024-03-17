import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DatabaseModule, Services, StorageModule } from '@app/common';
import * as Joi from 'joi';

import { PredictionsController } from './predictions.controller';
import { PredictionsService } from './predictions.service';
import {
  PredictionDocument,
  PredictionSchema,
} from './models/prediction.schema';
import { PredictionsRepository } from './predictions.repository';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { EventsModule } from './events/events.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,

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
    ClientsModule.registerAsync([
      {
        name: Services.Patients,
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: configService.get('PATIENTS_HOST'),
            port: configService.get('PATIENTS_PORT'),
          },
        }),
      },
      {
        name: Services.Doctors,
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: configService.get('DOCTORS_HOST'),
            port: configService.get('DOCTORS_PORT'),
          },
        }),
      },
    ]),
    EventsModule,
  ],
  controllers: [PredictionsController],
  providers: [PredictionsService, PredictionsRepository],
})
export class PredictionsModule {}
