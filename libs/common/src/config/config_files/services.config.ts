import { readFileSync } from 'fs';
import * as yaml from 'js-yaml';
import { join } from 'path';
import { ServicesConfig } from '@app/common';

export const servicesConfig = (
  yamlFileName: string = 'services.config.yaml',
) => {
  const YAML_CONFIG_FILENAME = yamlFileName;

  const servicesConfigProperties = yaml.load(
    readFileSync(join(__dirname, 'config_files', YAML_CONFIG_FILENAME), 'utf8'),
  ) as Record<string, any> as ServicesConfig;

  return {
    services: servicesConfigProperties,
  };
};
