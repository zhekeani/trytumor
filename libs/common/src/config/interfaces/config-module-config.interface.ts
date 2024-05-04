import { SecretConfig } from './secret-config.interface';

export interface ConfigModuleConfig {
  envPaths?: any[];
  loads?: any[];
  secretConfig: () => { secret: SecretConfig };
}
