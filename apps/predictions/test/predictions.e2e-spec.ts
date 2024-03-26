import {
  GenerateAccessTokenDto,
  JwtStrategy,
  PatientNewToPredictionsDto,
  Services,
  TestingAuthModule,
  TestingJwtStrategy,
} from '@app/common';
import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import * as FormData from 'form-data';
import * as fs from 'fs';
import { Types } from 'mongoose';
import * as request from 'supertest';

import { CreatePredictionDto } from '../src/dto/create-prediction.dto';
import { PredictionDocument } from '../src/models/prediction.schema';
import { PredictionsModule } from '../src/predictions.module';
import { UtilsService } from '../src/utils/utils.service';
import { TestingEventsModule } from './events/testing-events.module';
import { TestingUtilsService } from './utils/testing-util.service';

describe('PredictionsController (e2e)', () => {
  let app: INestApplication;

  const mockClientProxy = {
    emit: (...args: any[]) => {},
  };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        PredictionsModule,
        TestingAuthModule.forRootAsync({
          useFactory: (configService: ConfigService) => ({
            jwtTestingSecret: configService.get('JWT_TESTING_SECRET'),
            jwtTestingExpiration: 900,
          }),
        }),
        TestingEventsModule,
      ],
    })
      .overrideProvider(Services.Doctors)
      .useValue(mockClientProxy)
      .overrideProvider(Services.Patients)
      .useValue(mockClientProxy)
      .overrideProvider(UtilsService)
      .useClass(TestingUtilsService)
      .overrideProvider(JwtStrategy)
      .useClass(TestingJwtStrategy)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  // Set up for test auth token
  let testAuthToken: string;
  beforeEach(async () => {
    const generateAccessTokenDto: GenerateAccessTokenDto = {
      userId: new Types.ObjectId().toHexString(),
      fullName: 'test_full_name',
    };

    const res = await request(app.getHttpServer())
      .post('/testing/auth')
      .send(generateAccessTokenDto)
      .expect(201);

    testAuthToken = res.body.token;
  });

  let testPredictionSpot: PredictionDocument;
  beforeEach(async () => {
    await request(app.getHttpServer())
      .delete('/predictions/delete/all')
      .expect(200);

    const mockPatientId = new Types.ObjectId();
    const mockPatientNewToPredictionDto: PatientNewToPredictionsDto = {
      id: mockPatientId.toHexString(),
      fullName: 'test_patient_full_name',
      gender: 'female',
      birthDate: new Date(),
    };

    const res = await request(app.getHttpServer())
      .post('/testing/events/new')
      .send(mockPatientNewToPredictionDto)
      .expect(201);

    testPredictionSpot = res.body;
  });

  describe('/predictions/create/:id (POST)', () => {
    const mockCreatePredictionDto: CreatePredictionDto = {
      fileName: 'test_file_name',
      additionalNotes: ['test_additional_notes'],
    };

    const mockFormData = new FormData();
    Object.keys(mockCreatePredictionDto).forEach((key) => {
      if (Array.isArray(mockCreatePredictionDto[key])) {
        mockCreatePredictionDto[key].forEach((item) => {
          mockFormData.append(key, item);
        });
      } else {
        mockFormData.append(key, mockCreatePredictionDto[key]);
      }
    });

    const mockFileData = fs.readFileSync(
      `${__dirname}/images/test-create-prediction-image.jpg`,
    );
    mockFormData.append(
      'files',
      mockFileData,
      'test-create-prediction-image.jpg',
    );

    it('should return Unauthorized (401) if the access token is not provided or not valid', async () => {
      const res = await request(app.getHttpServer())
        .post(
          `/predictions/patient/create/${testPredictionSpot.patientData.id}`,
        )
        .set('Cookie', `Authentication=${testAuthToken}`)
        .set(
          'Content-Type',
          `multipart/form-data; boundary=${mockFormData.getBoundary()}`,
        )
        .send(mockFormData.getBuffer())
        .expect(201);
    });
  });

  describe('/predictions (GET)', () => {
    describe('/ (GET)', () => {
      it('should return all predictions from all patients', async () => {
        const res = await request(app.getHttpServer())
          .get('/predictions')
          .set('Cookie', `Authentication=${testAuthToken}`)
          .expect(200);

        expect(res.body[0]).toEqual(testPredictionSpot);
      });
    });

    // describe('/patient/:id', () => {
    //   it('should return all predictions from specific patient with specified patient ID', async () => {

    //   })
    // })
  });
});
