import { Module } from '@nestjs/common';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import {
  ConfigModule,
  databaseConfig,
  DatabaseModule,
  PredictionDocument,
  PredictionSchema,
  secretConfig,
  Services,
  ServicesConfig,
  servicesConfig,
} from '@app/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { PredictionsRepository } from '../predictions.repository';

const envPath = 'apps/predictions/.env';

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
        name: Services.Patients,
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
              host: servicesConfig.patients.host,
              port: servicesConfig.patients.rmq_port,
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
      { name: PredictionDocument.name, schema: PredictionSchema },
    ]),
  ],
  controllers: [EventsController],
  providers: [EventsService, PredictionsRepository],
  exports: [EventsService],
})
export class EventsModule {}
