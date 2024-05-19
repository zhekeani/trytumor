import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import * as cookieParser from 'cookie-parser';

import { ServicesConfig } from '@app/common';
import { AuthModule } from './auth.module';
import { Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.create(AuthModule);

  const configService = app.get(ConfigService);
  const servicesConfig = configService.get<ServicesConfig>('services');

  app.connectMicroservice({
    transport: Transport.TCP,
    options: {
      host: '0.0.0.0',
      port: servicesConfig.auth.rmq_port,
    },
  });

  app.use(cookieParser());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
    }),
  );

  await app.startAllMicroservices();
  await app.listen(servicesConfig.auth.http_port);
}
bootstrap();
