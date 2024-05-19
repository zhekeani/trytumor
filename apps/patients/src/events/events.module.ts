import { Module } from '@nestjs/common';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import {
  ConfigModule,
  databaseConfig,
  DatabaseModule,
  PatientDocument,
  PatientSchema,
  PredictionDocument,
  PredictionSchema,
  secretConfig,
  Services,
  ServicesConfig,
  servicesConfig,
} from '@app/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { PredictionsRepository } from '../../../predictions/src/predictions.repository';
import { PatientsRepository } from '../patients.repository';

const envPath = 'apps/patients/.env';

@Module({
  imports: [
    ConfigModule.forRootAsync({
      envPaths: ['.env'],
      secretConfig: () => secretConfig(envPath),
      loads: [servicesConfig],
    }),
    ClientsModule.registerAsync([
      {
        name: Services.Doctors,
        inject: [ConfigService],
        imports: [
          ConfigModule.forRootAsync({
            secretConfig: () => secretConfig(envPath),
            loads: [servicesConfig],
          }),
        ],
        useFactory: (configService: ConfigService) => {
          const servicesConfig = configService.get<ServicesConfig>('services');
          return {
            transport: Transport.TCP,
            options: {
              host: servicesConfig.auth.host,
              port: servicesConfig.auth.rmq_port,
            },
          };
        },
      },
      {
        name: Services.Predictions,
        inject: [ConfigService],
        imports: [
          ConfigModule.forRootAsync({
            secretConfig: () => secretConfig(envPath),
            loads: [servicesConfig],
          }),
        ],
        useFactory: (configService: ConfigService) => {
          const servicesConfig = configService.get<ServicesConfig>('services');
          return {
            transport: Transport.TCP,
            options: {
              host: servicesConfig.predictions.host,
              port: servicesConfig.predictions.rmq_port,
            },
          };
        },
      },
    ]),
    DatabaseModule.forRootAsync({
      inject: [ConfigService],
      configModuleConfig: {
        secretConfig: () => secretConfig(envPath),
        loads: [() => databaseConfig(envPath)],
      },
      useFactory: (configService: ConfigService) => ({
        environmentRuntime: configService.get('ENV_RUNTIME'),
        deploymentStage: configService.get('NODE_ENV'),
        databaseConfig: configService.get('database'),
      }),
    }),
    DatabaseModule.forFeature([
      { name: PatientDocument.name, schema: PatientSchema },
    ]),
  ],
  controllers: [EventsController],
  providers: [EventsService, PatientsRepository],
  exports: [EventsService],
})
export class EventsModule {}
