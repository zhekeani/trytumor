import { SecretConfig } from './secret-config.interface';

export interface ConfigModuleConfig {
  loads?: any[];
  secretConfig: () => { secret: SecretConfig };
}
