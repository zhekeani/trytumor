import { Module } from '@nestjs/common';
import { HelpersService } from './helpers.service';
import {
  ConfigModule,
  databaseConfig,
  DatabaseModule,
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
import { PredictionsRepository } from '../predictions.repository';

const envPath = 'apps/predictions/.env';

@Module({
  imports: [
    ConfigModule.forRootAsync({
      envPaths: ['.env'],
      secretConfig: () => secretConfig(envPath),
      loads: [servicesConfig, storageConfig, () => databaseConfig(envPath)],
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
  providers: [HelpersService, PredictionsRepository],
  exports: [HelpersService],
})
export class HelpersModule {}
