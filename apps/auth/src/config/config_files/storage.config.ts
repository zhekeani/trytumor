import { DeploymentStage, StorageConfig } from '@app/common';
import { readFileSync } from 'fs';
import * as yaml from 'js-yaml';
import { join } from 'path';

const YAML_CONFIG_FILENAME = 'storage.config.yaml';
const NODE_ENV = process.env.NODE_ENV as DeploymentStage;

const storageConfigProperties = yaml.load(
  readFileSync(join(__dirname, 'config_files', YAML_CONFIG_FILENAME), 'utf8'),
) as Record<string, any> as StorageConfig;

const baseBucketName = storageConfigProperties.bucket_name;
let completeBucketName: string;

switch (NODE_ENV) {
  case DeploymentStage.Development:
    completeBucketName = `dev-${baseBucketName}-bucket`;
    break;

  case DeploymentStage.Production:
    completeBucketName = `prod-${baseBucketName}-bucket`;

  default:
    break;
}

storageConfigProperties.bucket_name = completeBucketName;

export const storageConfig = () => ({
  storage: storageConfigProperties,
});
