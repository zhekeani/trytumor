import { Module } from '@nestjs/common';
import { PredictionsController } from './predictions.controller';
import { PredictionsService } from './predictions.service';
import {
  AuthGuardModule,
  ConfigModule,
  databaseConfig,
  DatabaseModule,
  HealthModule,
  PredictionDocument,
  PredictionSchema,
  PubsubModule,
  secretConfig,
  SecretsToLoad,
  ServiceAccountKey,
  servicesConfig,
  StorageConfig,
  storageConfig,
  StorageModule,
} from '@app/common';
import { ConfigService } from '@nestjs/config';
import { PredictionsRepository } from './predictions.repository';
import { HelpersModule } from './helpers/helpers.module';

const envPath = 'apps/predictions/.env';

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
      { name: PredictionDocument.name, schema: PredictionSchema },
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
    HelpersModule,
    PubsubModule.forRootAsync({
      inject: [ConfigService],
      configModuleConfig: {
        secretConfig: () => secretConfig(envPath),
        loads: [],
      },
      useFactory: (configService: ConfigService) => {
        const { pubsubAdminSaKey: encodedPubsubAdminKey } =
          configService.get<SecretsToLoad>('secrets');
        const pubsubAdminKey: ServiceAccountKey = JSON.parse(
          Buffer.from(encodedPubsubAdminKey, 'base64').toString(),
        );

        return {
          serviceAccountKey: pubsubAdminKey,
        };
      },
    }),
  ],
  controllers: [PredictionsController],
  providers: [PredictionsService, PredictionsRepository],
})
export class PredictionsModule {}
