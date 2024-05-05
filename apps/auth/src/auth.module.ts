import { MiddlewareConsumer, Module } from '@nestjs/common';

import {
  AuthGuardModule,
  ConfigModule,
  HealthModule,
  SecretsToLoad,
} from '@app/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { databaseConfig } from './config/config_files/database.config';
import { secretConfig } from './config/config_files/secret.config';
import { servicesConfig } from './config/config_files/services.config';
import { storageConfig } from './config/config_files/storage.config';
import { DoctorsModule } from './doctors/doctors.module';
import { DoctorNameAndEmailStringify } from './utils/middlewares/doctorName-email-stringify.middleware';
import { LocalStrategy } from './utils/strategies/local.strategy';

@Module({
  imports: [
    HealthModule,
    JwtModule.register({}),
    ConfigModule.forRootAsync({
      envPaths: ['.env'],
      loads: [secretConfig, servicesConfig, storageConfig, databaseConfig],
      secretConfig: secretConfig,
    }),
    AuthGuardModule.forRootAsync({
      inject: [ConfigService],
      configModuleConfig: {
        secretConfig,
        loads: [secretConfig],
      },
      useFactory: (configService: ConfigService) => ({
        jwtSecret: configService.get<SecretsToLoad>('secrets').jwtSecret,
        jwtRefreshSecret:
          configService.get<SecretsToLoad>('secrets').jwtRefreshSecret,
      }),
    }),
    DoctorsModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, LocalStrategy],
})
export class AuthModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(DoctorNameAndEmailStringify).forRoutes('auth/login');
  }
}
