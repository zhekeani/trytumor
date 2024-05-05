import { DynamicModule, Logger, Module } from '@nestjs/common';
import { AuthGuardModuleConfig } from './interfaces';
import { ConfigModule, ConfigModuleConfig } from '../config';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from './strategies';
import { JwtRefreshAuthGuard } from './guards';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';

@Module({})
export class AuthGuardModule {
  static forRootAsync(options: {
    useFactory: (
      ...args: any[]
    ) => Promise<AuthGuardModuleConfig> | AuthGuardModuleConfig;
    inject?: any[];
    configModuleConfig: ConfigModuleConfig;
  }): DynamicModule {
    return {
      module: AuthGuardModule,
      exports: [JwtAuthGuard, JwtRefreshStrategy],
      imports: [
        ConfigModule.forRootAsync({
          loads: options.configModuleConfig.loads,
          secretConfig: options.configModuleConfig.secretConfig,
        }),
      ],
      providers: [
        JwtAuthGuard,
        JwtRefreshAuthGuard,
        JwtStrategy,
        JwtRefreshStrategy,
        {
          provide: 'JWT_SECRET',
          inject: options.inject || [ConfigService],
          useFactory: async (...args: any[]) => {
            const logger = new Logger('AuthGuardModuleLoader');

            const { jwtSecret } = await options.useFactory(...args);

            if (!jwtSecret) {
              logger.warn('Failed to retrieve JWT secret.');
            }

            logger.log('Successfully retrieving JWT secret.');
            return jwtSecret;
          },
        },
        {
          provide: 'JWT_REFRESH_SECRET',
          inject: options.inject || [ConfigService],
          useFactory: async (...args: any[]) => {
            const logger = new Logger('AuthGuardModuleLoader');

            const { jwtRefreshSecret } = await options.useFactory(...args);

            if (!jwtRefreshSecret) {
              logger.warn('Failed to retrieve JWT refresh secret.');
            }

            logger.log('Successfully retrieving refresh JWT secret.');
            return jwtRefreshSecret;
          },
        },
      ],
    };
  }
}
