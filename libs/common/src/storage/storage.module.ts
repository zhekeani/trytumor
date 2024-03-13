import { DynamicModule, Module } from '@nestjs/common';
import { StorageService } from './storage.service';
import { StorageModuleConfig } from './interfaces/storage-module-config.interface';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  providers: [StorageService],
  exports: [StorageService],
})
export class StorageModule {
  static forRootAsync(options: {
    useFactory: (
      ...args: any[]
    ) => Promise<StorageModuleConfig> | StorageModuleConfig;
    inject?: any[];
  }): DynamicModule {
    return {
      module: StorageModule,
      imports: [ConfigModule.forRoot()],
      providers: [
        StorageService,
        {
          provide: 'CONFIG',
          useFactory: async (...args: any[]) =>
            await options.useFactory(...args),
          inject: options.inject || [ConfigService],
        },
      ],
      exports: [StorageService],
    };
  }
}
