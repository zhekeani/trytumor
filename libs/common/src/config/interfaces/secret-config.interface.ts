import { ServiceAccountKey } from '../../common';

export interface SecretsToLoad {
  objectAdminSaKey?: string;
  pubsubAdminSaKey?: string;
  jwtSecret?: string;
  jwtRefreshSecret?: string;
  jwtTestingSecret?: string;
  jwtExpiration?: string;
  jwtRefreshExpiration?: string;
}

export interface SecretConfig {
  secretAccessorKey: ServiceAccountKey;
  secretsToLoad: SecretsToLoad | Record<string, any>;
}
