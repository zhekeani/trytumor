import { Module } from '@nestjs/common';

import { ConfigModule, HealthModule } from '@app/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { secretConfig } from './config/config_files/secret.config';
import { servicesConfig } from './config/config_files/services.config';

@Module({
  imports: [
    HealthModule,
    ConfigModule.forRootAsync({
      loads: [secretConfig, servicesConfig],
      secretConfig: secretConfig,
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
