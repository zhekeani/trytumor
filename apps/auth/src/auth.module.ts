import { Module } from '@nestjs/common';

import {
  ConfigModule,
  DatabaseModule,
  HealthModule,
  SecretsToLoad,
  ServiceAccountKey,
  StorageConfig,
  StorageModule,
} from '@app/common';
import { ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { secretConfig } from './config/config_files/secret.config';
import { servicesConfig } from './config/config_files/services.config';
import { storageConfig } from './config/config_files/storage.config';
import { DoctorsModule } from './doctors/doctors.module';
import { databaseConfig } from './config/config_files/database.config';
import { DummyProvider } from './utils/dummy/dummy-provider';

@Module({
  imports: [
    HealthModule,
    ConfigModule.forRootAsync({
      envPaths: ['.env'],
      loads: [secretConfig, servicesConfig, storageConfig, databaseConfig],
      secretConfig: secretConfig,
    }),
    DatabaseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        environmentRuntime: configService.get('ENV_RUNTIME'),
        deploymentStage: configService.get('NODE_ENV'),
        databaseConfig: configService.get('database'),
      }),
      configModuleConfig: {
        secretConfig,
        loads: [storageConfig],
      },
    }),
    StorageModule.forRootAsync({
      configModuleConfig: {
        secretConfig,
        loads: [storageConfig],
      },
      useFactory: (configService: ConfigService) => {
        const { object_admin_sa_key: encodedObjectAdminKey } =
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

    DoctorsModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, DummyProvider],
})
export class AuthModule {}
