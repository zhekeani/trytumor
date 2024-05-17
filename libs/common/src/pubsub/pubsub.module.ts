import {
  DynamicModule,
  InternalServerErrorException,
  Logger,
  Module,
} from '@nestjs/common';
import { PubsubModuleConfig } from './interfaces/pubsub-module-config.interface';
import { ConfigModule, ConfigModuleConfig } from '../config';
import { PubsubService } from './pubsub.service';
import { ConfigService } from '@nestjs/config';
import { PubSub } from '@google-cloud/pubsub';

@Module({})
export class PubsubModule {
  static forRootAsync(options: {
    useFactory: (
      ...args: any[]
    ) => Promise<PubsubModuleConfig> | PubsubModuleConfig;
    inject?: any[];
    configModuleConfig: ConfigModuleConfig;
  }): DynamicModule {
    return {
      module: PubsubModule,
      imports: [
        ConfigModule.forRootAsync({
          loads: options.configModuleConfig.loads,
          secretConfig: options.configModuleConfig.secretConfig,
        }),
      ],
      providers: [
        PubsubService,
        {
          provide: 'PUBSUB',
          inject: options.inject || [ConfigService],
          useFactory: async (...args: any[]) => {
            const logger = new Logger(PubsubModule.name);

            const { serviceAccountKey } = await options.useFactory(...args);

            try {
              const pubsubClient = new PubSub({
                projectId: serviceAccountKey.project_id,
                credentials: {
                  client_email: serviceAccountKey.client_email,
                  private_key: serviceAccountKey.private_key,
                },
              });

              logger.log('Successfully configuring Pub/Sub client');
              return pubsubClient;
            } catch (error) {
              logger.warn('Failed to configure Pub/Sub client');
              throw new InternalServerErrorException();
            }
          },
        },
      ],
      exports: [PubsubService],
    };
  }
}
