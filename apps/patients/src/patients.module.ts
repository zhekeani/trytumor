import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as Joi from 'joi';

import { DatabaseModule, JwtStrategy, StorageModule } from '@app/common';
import { EventsModule } from './events/events.module';
import { PatientDocument, PatientSchema } from './models/patient.schema';
import { PatientsController } from './patients.controller';
import { PatientsRepository } from './repositories/patients.repository';
import { PatientsService } from './patients.service';

@Module({
  imports: [
    EventsModule,
    ConfigModule.forRoot({
      isGlobal: true,

      // Accommodate the different root directory when running on
      // development and testing environment
      envFilePath: ['.env', 'apps/patients/.env'],

      validationSchema: Joi.object({
        HTTP_PORT: Joi.number().required(),
        RMQ_PORT: Joi.number().required(),

        DOCTORS_HOST: Joi.string().required(),
        DOCTORS_PORT: Joi.number().required(),
        PREDICTIONS_HOST: Joi.string().required(),
        PREDICTIONS_PORT: Joi.number().required(),

        MONGODB_URI: Joi.string().required(),
        JWT_SECRET: Joi.string().required(),
        JWT_TESTING_SECRET: Joi.string().required(),

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
  ],
  controllers: [PatientsController],
  providers: [
    PatientsService,
    PatientsRepository,
    JwtStrategy,
    {
      provide: 'JWT_TESTING_SECRET',
      useFactory: (configService: ConfigService) =>
        configService.get('JWT_TESTING_SECRET'),
      inject: [ConfigService],
    },
  ],
})
export class PatientsModule {}
