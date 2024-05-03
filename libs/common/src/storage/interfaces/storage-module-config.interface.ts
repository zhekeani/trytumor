import { ServiceAccountKey } from '../../common';

export interface StorageModuleConfig {
  serviceAccountKey: ServiceAccountKey;
  bucketName: string;
}
