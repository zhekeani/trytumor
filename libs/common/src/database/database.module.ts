import { DynamicModule, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ModelDefinition,
  MongooseModule,
  MongooseModuleOptions,
} from '@nestjs/mongoose';
import { DatabaseModuleConfig } from './interfaces/database-config.interface';

@Module({
  imports: [
    // Create mongodb database connection from MONGODB_URI
    // so mongoose model can interact with database
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const mongooseConfig: MongooseModuleOptions = {};
        // switch base on NODE_ENV
        switch (configService.get('NODE_ENV')) {
          case 'development':
            mongooseConfig.uri = configService.get('MONGODB_URI');
            break;
          case 'test':
            mongooseConfig.uri = configService.get('MONGODB_TESTING_URI');
            break;
        }
        return mongooseConfig;
      },
    }),
  ],
})
export class DatabaseModule {
  static forRootAsync(options: {
    useFactory: (
      ...args: any[]
    ) => Promise<DatabaseModuleConfig> | DatabaseModuleConfig;
    inject?: any[];
  }): DynamicModule {
    return MongooseModule.forRootAsync({
      inject: options.inject || [ConfigService],
      useFactory: async (...args: any[]) => {
        const config = await options.useFactory(...args);

        return {
          uri: config.uri,
        };
      },
    });
  }

  // Reimplementing the forFeature method, so the caller
  // doesn't need both DatabaseModule & MongooseModule
  // forFeature method used for injecting model within
  // DI system
  static forFeature(models: ModelDefinition[]) {
    return MongooseModule.forFeature(models);
  }
}
