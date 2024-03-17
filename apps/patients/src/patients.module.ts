import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as Joi from 'joi';

import {
  DatabaseModule,
  JwtStrategy,
  Services,
  StorageModule,
} from '@app/common';
import { PatientDocument, PatientSchema } from './models/patient.schema';
import { PatientsController } from './patients.controller';
import { PatientsRepository } from './patients.repository';
import { PatientsService } from './patients.service';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,

      validationSchema: Joi.object({
        HTTP_PORT: Joi.number().required(),
        RMQ_PORT: Joi.number().required(),

        DOCTORS_HOST: Joi.string().required(),
        DOCTORS_PORT: Joi.number().required(),
        PREDICTIONS_HOST: Joi.string().required(),
        PREDICTIONS_PORT: Joi.number().required(),

        MONGODB_URI: Joi.string().required(),
        JWT_SECRET: Joi.string().required(),
        GOOGLE_STORAGE_PROJECT_ID: Joi.string().required(),
        GOOGLE_STORAGE_CLIENT_EMAIL: Joi.string().required(),
        GOOGLE_STORAGE_BUCKET_NAME: Joi.string().required(),
        GOOGLE_STORAGE_PRIVATE_KEY: Joi.string().required(),
      }),
    }),
    DatabaseModule,
    DatabaseModule.forFeature([
      { name: PatientDocument.name, schema: PatientSchema },
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
      {
        name: Services.Predictions,
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: configService.get('PREDICTIONS_HOST'),
            port: configService.get('PREDICTIONS_PORT'),
          },
        }),
      },
    ]),
  ],
  controllers: [PatientsController],
  providers: [PatientsService, PatientsRepository, JwtStrategy],
})
export class PatientsModule {}
