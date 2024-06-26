import {
  AuthGuardModule,
  ConfigModule,
  databaseConfig,
  DatabaseModule,
  HealthModule,
  PatientDocument,
  PatientSchema,
  secretConfig,
  SecretsToLoad,
  ServiceAccountKey,
  servicesConfig,
  storageConfig,
  StorageConfig,
  StorageModule,
} from '@app/common';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PatientsController } from './patients.controller';
import { PatientsService } from './patients.service';
import { PatientsRepository } from './patients.repository';
import { EventsModule } from './events/events.module';

const envPath = 'apps/patients/.env';

@Module({
  imports: [
    HealthModule,
    ConfigModule.forRootAsync({
      envPaths: ['.env'],
      secretConfig: () => secretConfig(envPath),
      loads: [servicesConfig, storageConfig, () => databaseConfig(envPath)],
    }),
    AuthGuardModule.forRootAsync({
      inject: [ConfigService],
      configModuleConfig: {
        secretConfig: () => secretConfig(envPath),
        loads: [() => secretConfig(envPath)],
      },
      useFactory: (configService: ConfigService) => ({
        jwtSecret: configService.get<SecretsToLoad>('secrets').jwtSecret,
      }),
    }),
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
    StorageModule.forRootAsync({
      configModuleConfig: {
        secretConfig: () => secretConfig(envPath),
        loads: [storageConfig],
      },
      useFactory: (configService: ConfigService) => {
        const { objectAdminSaKey: encodedObjectAdminKey } =
          configService.get<SecretsToLoad>('secrets');
        const objectAdminKey: ServiceAccountKey = JSON.parse(
          Buffer.from(encodedObjectAdminKey, 'base64').toString(),
        );
        const { bucket_name: bucketName } =
          configService.get<StorageConfig>('storage');

        return {
          serviceAccountKey: objectAdminKey,
          bucketName,
        };
      },
    }),
    EventsModule,
  ],
  controllers: [PatientsController],
  providers: [PatientsService, PatientsRepository],
})
export class PatientsModule {}
