import { Module } from '@nestjs/common';
import { DoctorsController } from './doctors.controller';
import { DoctorsService } from './doctors.service';
import {
  ConfigModule,
  DatabaseModule,
  DoctorDocument,
  DoctorSchema,
  SecretsToLoad,
  ServiceAccountKey,
  StorageConfig,
  StorageModule,
} from '@app/common';
import { secretConfig } from '../config/config_files/secret.config';
import { servicesConfig } from '../config/config_files/services.config';
import { storageConfig } from '../config/config_files/storage.config';
import { ConfigService } from '@nestjs/config';

import { DoctorsRepository } from './doctors.repository';
import { databaseConfig } from '../config/config_files/database.config';
import { EventsModule } from '../events/events.module';

@Module({
  controllers: [DoctorsController],
  providers: [DoctorsService, DoctorsRepository],
  exports: [DoctorsService],
  imports: [
    ConfigModule.forRootAsync({
      envPaths: ['../.env'],
      loads: [servicesConfig],
      secretConfig: secretConfig,
    }),
    DatabaseModule.forRootAsync({
      inject: [ConfigService],
      configModuleConfig: {
        secretConfig,
        loads: [storageConfig, databaseConfig],
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
    StorageModule.forRootAsync({
      configModuleConfig: {
        secretConfig,
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
})
export class DoctorsModule {}
