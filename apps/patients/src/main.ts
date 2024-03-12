import { NestFactory } from '@nestjs/core';
import { PatientsModule } from './patients.module';

async function bootstrap() {
  const app = await NestFactory.create(PatientsModule);
  await app.listen(3000);
}
bootstrap();
