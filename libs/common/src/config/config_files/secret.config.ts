import { SecretConfig, ServiceAccountKey } from '@app/common';
import * as dotenv from 'dotenv';
import { readFileSync } from 'fs';
import * as yaml from 'js-yaml';
import * as path from 'path';
import { join } from 'path';

export const secretConfig = (
  envPath: string,
  yamlFileName: string = 'secret.config.yaml',
  encodedSecretAccessorKey: () => string = () =>
    process.env.SA_SECRET_ACCESSOR_KEY,
) => {
  dotenv.config({
    path: path.resolve(envPath),
  });
  const YAML_CONFIG_FILENAME = yamlFileName;

  const secretsToLoad = yaml.load(
    readFileSync(join(__dirname, 'config_files', YAML_CONFIG_FILENAME), 'utf8'),
  ) as Record<string, any>;

  const decodedSecretAccessorKey: ServiceAccountKey = JSON.parse(
    Buffer.from(encodedSecretAccessorKey(), 'base64').toString(),
  );

  const decodedSecretConfig: SecretConfig = {
    secretAccessorKey: decodedSecretAccessorKey,
    secretsToLoad,
  };

  return {
    secret: decodedSecretConfig,
  };
};
