import { Module } from '@nestjs/common';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import { DatabaseModule, Services } from '@app/common';
import {
  PredictionDocument,
  PredictionSchema,
} from '../models/prediction.schema';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { PredictionsRepository } from '../repositories/predictions.repository';

@Module({
  imports: [
    DatabaseModule,
    DatabaseModule.forFeature([
      { name: PredictionDocument.name, schema: PredictionSchema },
    ]),
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
  ],
  controllers: [EventsController],
  providers: [EventsService, PredictionsRepository],
  exports: [EventsService],
})
export class EventsModule {}
