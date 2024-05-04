import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import * as cookieParser from 'cookie-parser';
import { ValidationPipe } from '@nestjs/common';

import { DatabaseConfig, ServicesConfig } from '@app/common';
import { AuthModule } from './auth.module';

async function bootstrap() {
  const app = await NestFactory.create(AuthModule);

  const configService = app.get(ConfigService);
  const servicesConfig = configService.get<ServicesConfig>('services');
  const databaseConfig = configService.get<DatabaseConfig>('database');

  app.use(cookieParser());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
    }),
  );

  await app.listen(servicesConfig.auth.http_port);
  console.log('this is from database config', databaseConfig.mongodb_uri);
}
bootstrap();
