import { readFileSync } from 'fs';
import * as yaml from 'js-yaml';
import { join } from 'path';
import { StorageConfig } from '../../storage';
import { DeploymentStage } from '../../common';

export const storageConfig = (
  yamlFileName: string = 'storage.config.yaml',
  nodeEnvFn: () => string = () => process.env.NODE_ENV as DeploymentStage,
) => {
  const YAML_CONFIG_FILENAME = yamlFileName;
  const NODE_ENV = nodeEnvFn();

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

  return {
    storage: storageConfigProperties,
  };
};
