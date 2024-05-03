import { Storage } from '@google-cloud/storage';
import { DynamicModule, Logger, Module } from '@nestjs/common';

import { ConfigModule, ConfigModuleConfig, SecretConfig } from '../config';
import { StorageModuleConfig } from './interfaces/storage-module-config.interface';
import { StorageService } from './storage.service';
import { ConfigService } from '@nestjs/config';

@Module({})
export class StorageModule {
  static forRootAsync(options: {
    useFactory: (
      ...args: any[]
    ) => Promise<StorageModuleConfig> | StorageModuleConfig;
    inject?: any[];
    configModuleConfig: ConfigModuleConfig;
  }): DynamicModule {
    return {
      module: StorageModule,
      imports: [
        ConfigModule.forRootAsync({
          loads: options.configModuleConfig.loads,
          secretConfig: options.configModuleConfig.secretConfig,
        }),
      ],
      providers: [
        StorageService,
        {
          provide: 'BUCKET',
          useFactory: async (...args: any[]) => {
            const logger = new Logger('StorageModuleLoader');

            const { serviceAccountKey, bucketName } = await options.useFactory(
              ...args,
            );

            try {
              const bucket = new Storage({
                projectId: serviceAccountKey.project_id,
                credentials: {
                  client_email: serviceAccountKey.client_email,
                  private_key: serviceAccountKey.private_key,
                },
              }).bucket(bucketName);

              const [exists] = await bucket.exists();

              if (exists) {
                logger.log(
                  `Successfully configuring ${bucketName} cloud storage bucket`,
                );
              }
              return bucket;
            } catch (error) {
              console.log(JSON.stringify(error));
              logger.warn(
                `Failed to configure ${bucketName} cloud storage bucket.`,
              );
              return undefined;
            }
          },
          inject: options.inject || [ConfigService],
        },
      ],
      exports: [StorageService],
    };
  }
}
