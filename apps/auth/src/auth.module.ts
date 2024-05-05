import { Module } from '@nestjs/common';

import {
  AuthGuardModule,
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
import { JwtModule } from '@nestjs/jwt';
import { LocalStrategy } from './utils/strategies/local.strategy';

@Module({
  imports: [
    HealthModule,
    JwtModule.register({}),
    ConfigModule.forRootAsync({
      envPaths: ['.env'],
      loads: [secretConfig, servicesConfig, storageConfig, databaseConfig],
      secretConfig: secretConfig,
    }),
    AuthGuardModule.forRootAsync({
      inject: [ConfigService],
      configModuleConfig: {
        secretConfig,
        loads: [secretConfig],
      },
      useFactory: (configService: ConfigService) => ({
        jwtSecret: configService.get<SecretsToLoad>('secrets').jwtSecret,
        jwtRefreshSecret:
          configService.get<SecretsToLoad>('secrets').jwtRefreshSecret,
      }),
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
        const { objectAdminSaKey } =
          configService.get<SecretsToLoad>('secrets');
        const objectAdminKey: ServiceAccountKey = JSON.parse(
          Buffer.from(objectAdminSaKey, 'base64').toString(),
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
  providers: [AuthService, LocalStrategy],
})
export class AuthModule {}
