export interface AuthGuardModuleConfig {
  jwtSecret: string;
  jwtRefreshSecret?: string;
}
