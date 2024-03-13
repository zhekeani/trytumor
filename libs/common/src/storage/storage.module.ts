import { DynamicModule, Module } from '@nestjs/common';
import { StorageService } from './storage.service';
import { StorageModuleConfig } from './interfaces/storage-module-config.interface';
import { ConfigModule, ConfigService } from '@nestjs/config';

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
          provide: 'CONFIG',

          // Take all providers from inject and pass it to the options factory function
          // Use async await to accommodate if the return value is a promise
          useFactory: async (...args: any[]) =>
            await options.useFactory(...args),

          // All providers in the inject will be resolved and passed as arguments
          // to factory function
          inject: options.inject || [ConfigService],
        },
      ],
      exports: [StorageService],
    };
  }
}
