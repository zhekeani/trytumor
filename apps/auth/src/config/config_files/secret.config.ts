import { SecretConfig, ServiceAccountKey } from '@app/common';
import * as dotenv from 'dotenv';
import { readFileSync } from 'fs';
import * as yaml from 'js-yaml';
import * as path from 'path';
import { join } from 'path';

dotenv.config({
  path: path.resolve('apps/auth/.env'),
});
const YAML_CONFIG_FILENAME = 'secret.config.yaml';
const encodedSecretAccessorKey = process.env.SA_SECRET_ACCESSOR_KEY;

const secretsToLoad = yaml.load(
  readFileSync(join(__dirname, 'config_files', YAML_CONFIG_FILENAME), 'utf8'),
) as Record<string, any>;

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
