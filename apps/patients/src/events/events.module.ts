import { Module } from '@nestjs/common';
import { EventsService } from './events.service';
import { EventsController } from './events.controller';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { DatabaseModule, Services } from '@app/common';
import { ConfigService } from '@nestjs/config';
import { PatientsRepository } from '../repositories/patients.repository';
import { PatientDocument, PatientSchema } from '../models/patient.schema';

@Module({
  imports: [
    DatabaseModule,
    DatabaseModule.forFeature([
      { name: PatientDocument.name, schema: PatientSchema },
    ]),

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
  controllers: [EventsController],
  providers: [EventsService, PatientsRepository],
  exports: [EventsService],
})
export class EventsModule {}
