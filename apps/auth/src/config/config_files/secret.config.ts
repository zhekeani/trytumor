import { SecretConfig, SecretsToLoad, ServiceAccountKey } from '@app/common';
import { readFileSync } from 'fs';
import { join } from 'path';
import * as yaml from 'js-yaml';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({
  path: path.resolve('apps/auth/.env'),
});
const YAML_CONFIG_FILENAME = 'secret.config.yaml';
const encodedSecretAccessorKey = process.env.SA_SECRET_ACCESSOR_KEY;

const secretsToLoad = yaml.load(
  readFileSync(join(__dirname, 'config_files', YAML_CONFIG_FILENAME), 'utf8'),
) as Record<string, any> as SecretsToLoad;

const decodedSecretAccessorKey: ServiceAccountKey = JSON.parse(
  Buffer.from(encodedSecretAccessorKey, 'base64').toString(),
);

const decodedSecretConfig: SecretConfig = {
  secretAccessorKey: decodedSecretAccessorKey,
  secretsToLoad,
};

export const secretConfig = () => ({
  secret: decodedSecretConfig,
});
