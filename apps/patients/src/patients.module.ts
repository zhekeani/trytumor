import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';

import { PatientsController } from './patients.controller';
import { PatientsService } from './patients.service';
import { DatabaseModule, JwtModule, StorageModule } from '@app/common';
import { PatientDocument, PatientSchema } from './models/patient.schema';
import { PatientsRepository } from './patients.repository';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,

      validationSchema: Joi.object({
        PORT: Joi.number().required(),
        MONGODB_URI: Joi.string().required(),
        JWT_SECRET: Joi.string().required(),
      }),
    }),
    JwtModule,
    DatabaseModule,
    DatabaseModule.forFeature([
      { name: PatientDocument.name, schema: PatientSchema },
    ]),
    StorageModule,
  ],
  controllers: [PatientsController],
  providers: [PatientsService, PatientsRepository],
})
export class PatientsModule {}
