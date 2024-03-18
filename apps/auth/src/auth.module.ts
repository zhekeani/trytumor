import { MiddlewareConsumer, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as Joi from 'joi';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersModule } from './users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { LocalStrategy } from './strategies/local.strategy';
import { UsernameEmailStringify } from './middlewares/username-email-stringify.middleware';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { EventsModule } from './events/events.module';

@Module({
  imports: [
    UsersModule,
    ConfigModule.forRoot({
      // Make ConfigModule globally available in auth app
      // including inside UsersModule
      isGlobal: true,

      // Check the must provided env
      validationSchema: Joi.object({
        HTTP_PORT: Joi.number().required(),
        RMQ_PORT: Joi.number().required(),

        PREDICTIONS_HOST: Joi.string().required(),
        PREDICTIONS_PORT: Joi.number().required(),

        MONGODB_URI: Joi.string().required(),
        JWT_SECRET: Joi.string().required(),
        JWT_EXPIRATION: Joi.string().required(),
        JWT_REFRESH_SECRET: Joi.string().required(),
        JWT_REFRESH_EXPIRATION: Joi.string().required(),
      }),
    }),
    JwtModule.register({}),
    EventsModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, LocalStrategy, JwtStrategy, JwtRefreshStrategy],
})
export class AuthModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(UsernameEmailStringify).forRoutes('auth/login');
  }
}
