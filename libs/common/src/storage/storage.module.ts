import { DynamicModule, Module } from '@nestjs/common';
import { StorageService } from './storage.service';
import { StorageModuleConfig } from './interfaces/storage-module-config.interface';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Storage } from '@google-cloud/storage';

@Module({})
export class StorageModule {
  // method to return module with the configuration provided
  // by the caller
  static forRootAsync(options: {
    // Create flexibility to directly return the value or the promise
    useFactory: (
      ...args: any[]
    ) => Promise<StorageModuleConfig> | StorageModuleConfig;
    inject?: any[];
  }): DynamicModule {
    return {
      module: StorageModule,
      providers: [
        StorageService,
        {
          provide: 'BUCKET',

          // Take all providers from inject and pass it to the options factory function
          // Use async await to accommodate if the return value is a promise
          useFactory: async (...args: any[]) => {
            const config = await options.useFactory(...args);
            const bucket = new Storage({
              projectId: config.projectId,
              credentials: {
                client_email: config.clientEmail,
                private_key: config.privateKey,
              },
            }).bucket(config.bucketName);

            return bucket;
          },

          // All providers in the inject will be resolved and passed as arguments
          // to factory function
          inject: options.inject || [ConfigService],
        },
      ],
      exports: [StorageService],
    };
  }
}
