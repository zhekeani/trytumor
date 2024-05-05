import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import * as cookieParser from 'cookie-parser';

import { ServicesConfig } from '@app/common';
import { ValidationPipe } from '@nestjs/common';
import { PatientsModule } from './patients.module';

async function bootstrap() {
  const app = await NestFactory.create(PatientsModule);

  const configService = app.get(ConfigService);
  const servicesConfig = configService.get<ServicesConfig>('services');

  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
    }),
  );

  await app.listen(servicesConfig.patients.http_port);
  console.log();
}
bootstrap();
