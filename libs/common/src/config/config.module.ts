import { SecretManagerServiceClient } from '@google-cloud/secret-manager';
import { DynamicModule, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as dotenv from 'dotenv';
import { merge } from 'lodash';
import * as path from 'path';

import { ConfigModuleConfig } from './interfaces';
import { rewriteRecordWithSecrets } from './utils/config_loader';

dotenv.config({
  path: path.resolve('apps/predictions/.env'),
});

@Module({})
export class ConfigModule {
  static forRootAsync(options: ConfigModuleConfig): DynamicModule {
    return {
      module: ConfigModule,
      providers: [
        {
          provide: ConfigService,
          useFactory: async () => {
            let mergedConfig: Record<string, any> = {};
            let configsToLoad: any[] = options.loads || [];

            const { secret } = options.secretConfig();
            let secretsToLoad = secret.secretsToLoad;

            // Check connecting to Secret Manager
            const client = new SecretManagerServiceClient({
              projectId: secret.secretAccessorKey.project_id,
              credentials: {
                client_email: secret.secretAccessorKey.client_email,
                private_key: secret.secretAccessorKey.private_key,
              },
            });

            await rewriteRecordWithSecrets(secretsToLoad, undefined, client);

            const loadedSecrets = () => ({
              secrets: secretsToLoad,
            });

            configsToLoad.push(loadedSecrets);

            configsToLoad.forEach((configFile) => {
              mergedConfig = merge(mergedConfig, configFile());
            });

            return new ConfigService(mergedConfig);
          },
        },
      ],
      exports: [ConfigService],
    };
  }
}
