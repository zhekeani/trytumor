import {
  DeploymentStage,
  EnvironmentRuntime,
} from '../../common/types/deployment.type';
import { DatabaseConfig } from './database-config.interface';

export interface DatabaseModuleConfig {
  environmentRuntime: EnvironmentRuntime;
  deploymentStage: DeploymentStage;
  databaseConfig: DatabaseConfig;
}
