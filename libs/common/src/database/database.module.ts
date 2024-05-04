import { DynamicModule, Module } from '@nestjs/common';
import {
  ModelDefinition,
  MongooseModule,
  MongooseModuleOptions,
} from '@nestjs/mongoose';
import {
  ConfigService,
  ConfigModule as NestConfigModule,
} from '@nestjs/config';
import { ConfigModule, ConfigModuleConfig } from '../config';
import { DatabaseModuleConfig } from './interfaces';

@Module({})
export class DatabaseModule {
  static forRootAsync(options: {
    useFactory: (
      ...args: any[]
    ) => Promise<DatabaseModuleConfig> | DatabaseModuleConfig;
    inject?: any[];
    configModuleConfig: ConfigModuleConfig;
  }): DynamicModule {
    return {
      module: DatabaseModule,
      imports: [
        MongooseModule.forRootAsync({
          inject: options.inject || [ConfigService],
          imports: [
            ConfigModule.forRootAsync({
              secretConfig: options.configModuleConfig.secretConfig,
              loads: options.configModuleConfig.loads,
            }),
          ],
          useFactory: async (...args: any[]) => {
            const mongooseConfig: MongooseModuleOptions = {};
            const { deploymentStage, environmentRuntime, databaseConfig } =
              await options.useFactory(...args);

            mongooseConfig.uri = `${databaseConfig.mongodb_uri}-${environmentRuntime}-${deploymentStage}`;

            return mongooseConfig;
          },
        }),
      ],
    };
  }

  static forFeature(models: ModelDefinition[]) {
    return MongooseModule.forFeature(models);
  }
}
