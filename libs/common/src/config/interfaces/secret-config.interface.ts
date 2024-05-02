import { ServiceAccountKey } from '../../common';

export interface SecretsToLoad {
  object_admin_sa_key?: string;
}

export interface SecretConfig {
  secretAccessorKey: ServiceAccountKey;
  secretsToLoad: SecretsToLoad;
}
