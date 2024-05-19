import { Module } from '@nestjs/common';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import { ClientsModule, Transport } from '@nestjs/microservices';
import {
  ConfigModule,
  databaseConfig,
  DatabaseModule,
  DoctorDocument,
  DoctorSchema,
  PredictionDocument,
  PredictionSchema,
  secretConfig,
  Services,
  ServicesConfig,
  servicesConfig,
} from '@app/common';
import { ConfigService } from '@nestjs/config';
import { PredictionsRepository } from '../../../predictions/src/predictions.repository';
import { DoctorsRepository } from '../doctors/doctors.repository';

const envPath = 'apps/auth/.env';

@Module({
  imports: [
    ConfigModule.forRootAsync({
      envPaths: ['.env'],
      secretConfig: () => secretConfig(envPath),
      loads: [servicesConfig],
    }),
    ClientsModule.registerAsync([
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
      { name: DoctorDocument.name, schema: DoctorSchema },
    ]),
  ],
  controllers: [EventsController],
  providers: [EventsService, DoctorsRepository],
})
export class EventsModule {}
