import { Module } from '@nestjs/common';

import {
  ConfigModule,
  HealthModule,
  SecretsToLoad,
  ServiceAccountKey,
  StorageConfig,
  StorageModule,
} from '@app/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { secretConfig } from './config/config_files/secret.config';
import { servicesConfig } from './config/config_files/services.config';
import { storageConfig } from './config/config_files/storage.config';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    HealthModule,
    ConfigModule.forRootAsync({
      loads: [secretConfig, servicesConfig, storageConfig],
      secretConfig: secretConfig,
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
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
