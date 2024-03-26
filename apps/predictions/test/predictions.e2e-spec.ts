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
import { EditPredictionDto } from '../src/dto/edit-prediction.dto';

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

  const mockCreatePredictionDto: CreatePredictionDto = {
    fileName: 'test_file_name',
    additionalNotes: ['test_additional_notes'],
  };

  const mockFormData = new FormData();
  Object.keys(mockCreatePredictionDto).forEach((key) => {
    if (Array.isArray(mockCreatePredictionDto[key])) {
      mockCreatePredictionDto[key].forEach((item: string) => {
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

  it('should return "Service is healthy" if the service is healthy', async () => {
    request(app.getHttpServer())
      .get('/predictions/health')
      .expect(200)
      .expect('Service is healthy');
  });

  describe('/predictions (GET)', () => {
    let createPredictionRes: request.Response;
    let createPredictionResponseDoc: PredictionDocument;

    // Set up for patient prediction spot
    let testPredictionSpot: PredictionDocument;
    beforeAll(async () => {
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

    beforeAll(async () => {
      createPredictionRes = await request(app.getHttpServer())
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

      createPredictionResponseDoc = createPredictionRes.body;
    });

    describe('/ (GET)', () => {
      it('should return all predictions from all patients', async () => {
        const res = await request(app.getHttpServer())
          .get('/predictions')
          .expect(200);

        expect(res.body[0].patientData).toEqual(
          createPredictionRes.body.patientData,
        );
        expect(res.body[0].predictionsData).toEqual(
          createPredictionRes.body.predictionsData,
        );
      });
    });

    describe('/patient/:id', () => {
      it('should return Bad Request Exception (400) if the provided patient ID is not valid MongoDB Object ID', async () => {
        await request(app.getHttpServer())
          .get(`/predictions/patient/invalid_id`)
          .expect(400);
      });

      it('should return Not Found Exception (404) if prediction document with specified patient ID was not found', async () => {
        const wrongPatientId = new Types.ObjectId();
        await request(app.getHttpServer())
          .get(`/predictions/patient/${wrongPatientId.toHexString()}`)
          .expect(404);
      });

      it('should return all predictions from specific patient with specified patient ID', async () => {
        const res = await request(app.getHttpServer())
          .get(`/predictions/patient/${testPredictionSpot.patientData.id}`)
          .expect(200);

        expect(res.body.patientData).toEqual(
          createPredictionRes.body.patientData,
        );
        expect(res.body.predictionsData).toEqual(
          createPredictionRes.body.predictionsData,
        );
      });
    });

    describe('/prediction/:id', () => {
      it('should return Bad Request Exception (400) if the provided patient ID is not valid MongoDB Object ID', async () => {
        await request(app.getHttpServer())
          .get(`/predictions/prediction/invalid_id`)
          .expect(400);
      });

      it('should return Not Found Exception (404) if prediction document with specified patient ID was not found', async () => {
        const wrongPredictionId = new Types.ObjectId();
        await request(app.getHttpServer())
          .get(`/predictions/prediction/${wrongPredictionId.toHexString()}`)
          .expect(404);
      });

      it('should return all predictions from specific patient with specified patient ID', async () => {
        const res = await request(app.getHttpServer())
          .get(
            `/predictions/prediction/${createPredictionResponseDoc.predictionsData[0].id}`,
          )
          .expect(200);

        expect(res.body.patientData).toEqual(
          createPredictionRes.body.patientData,
        );
        expect(res.body.predictionsData[0]).toEqual(
          createPredictionRes.body.predictionsData[0],
        );
      });
    });
  });

  describe('/predictions/create/:id (POST)', () => {
    // Set up for patient prediction spot
    let testPredictionSpot: PredictionDocument;

    beforeAll(async () => {
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

    it('should return Unauthorized (401) if the access token is not provided or not valid', async () => {
      await request(app.getHttpServer())
        .post(
          `/predictions/patient/create/${testPredictionSpot.patientData.id}`,
        )
        .set('Cookie', `Authentication=invalid_token`)
        .set(
          'Content-Type',
          `multipart/form-data; boundary=${mockFormData.getBoundary()}`,
        )
        .send(mockFormData.getBuffer())
        .expect(401);
    });

    it('should return Bad Request Exception (400) if the provided patient ID is not valid Mongo Object ID', async () => {
      await request(app.getHttpServer())
        .post(`/predictions/patient/create/invalid_id`)
        .set('Cookie', `Authentication=${testAuthToken}`)
        .set(
          'Content-Type',
          `multipart/form-data; boundary=${mockFormData.getBoundary()}`,
        )
        .send(mockFormData.getBuffer())
        .expect(400);
    });

    it('should return Not Found Exception (404) if prediction document with specified patient ID was not found', async () => {
      const wrongPatientID = new Types.ObjectId();

      await request(app.getHttpServer())
        .post(`/predictions/patient/create/${wrongPatientID.toHexString()}`)
        .set('Cookie', `Authentication=${testAuthToken}`)
        .set(
          'Content-Type',
          `multipart/form-data; boundary=${mockFormData.getBoundary()}`,
        )
        .send(mockFormData.getBuffer())
        .expect(404);
    });

    it('should create prediction and save the image to cloud storage and data to database (200) if the process was successful', async () => {
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

      expect(res.body.patientData).toEqual(testPredictionSpot.patientData);
    });
  });

  describe('/predictions/update/:id (PATCH)', () => {
    let testPredictionSpot: PredictionDocument;
    let createPredictionResponseDoc: PredictionDocument;

    const mockEditPredictionDto: EditPredictionDto = {
      fileName: 'updated_file_name',
      additionalNotes: ['updated_additional_notes'],
    };

    beforeAll(async () => {
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

    beforeAll(async () => {
      const createPredictionRes = await request(app.getHttpServer())
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

      createPredictionResponseDoc = createPredictionRes.body;
    });

    it('should return Unauthorized (401) if the access token is not provided or not valid', async () => {
      await request(app.getHttpServer())
        .patch(`/predictions/update/${testPredictionSpot.patientData.id}`)
        .set('Cookie', `Authentication=invalid_token`)
        .send(mockEditPredictionDto)
        .expect(401);
    });

    it('should return Bad Request Exception (400) if the provided prediction ID is not valid Mongo Object ID', async () => {
      await request(app.getHttpServer())
        .patch(`/predictions/update/invalid_id`)
        .set('Cookie', `Authentication=${testAuthToken}`)
        .send(mockEditPredictionDto)
        .expect(400);
    });

    it('should return Not Found Exception (404) if prediction document with specified prediction ID was not found', async () => {
      const wrongPredictionId = new Types.ObjectId();

      await request(app.getHttpServer())
        .patch(`/predictions/update/${wrongPredictionId.toHexString()}`)
        .set('Cookie', `Authentication=${testAuthToken}`)
        .send(mockEditPredictionDto)
        .expect(404);
    });

    it('should update the prediction data if the process was successful', async () => {
      const res = await request(app.getHttpServer())
        .patch(
          `/predictions/update/${createPredictionResponseDoc.predictionsData[0].id}`,
        )
        .set('Cookie', `Authentication=${testAuthToken}`)
        .send(mockEditPredictionDto)
        .expect(200);

      const responsePredictionDoc = res.body as PredictionDocument;

      expect(responsePredictionDoc.patientData).toEqual(
        createPredictionResponseDoc.patientData,
      );
      expect(responsePredictionDoc.predictionsData[0].fileName).toEqual(
        mockEditPredictionDto.fileName,
      );
      expect(responsePredictionDoc.predictionsData[0].additionalNotes).toEqual(
        mockEditPredictionDto.additionalNotes,
      );
    });
  });

  describe('/predictions/delete/:id (DELETE)', () => {
    let testPredictionSpot: PredictionDocument;
    let createPredictionResponseDoc: PredictionDocument;

    beforeAll(async () => {
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

    beforeAll(async () => {
      const createPredictionRes = await request(app.getHttpServer())
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

      createPredictionResponseDoc = createPredictionRes.body;
    });

    it('should return Unauthorized (401) if the access token is not provided or not valid', async () => {
      await request(app.getHttpServer())
        .delete(`/predictions/delete/${testPredictionSpot.patientData.id}`)
        .set('Cookie', `Authentication=invalid_token`)
        .expect(401);
    });

    it('should return Bad Request Exception (400) if the provided prediction ID is not valid Mongo Object ID', async () => {
      await request(app.getHttpServer())
        .delete(`/predictions/delete/invalid_id`)
        .set('Cookie', `Authentication=${testAuthToken}`)
        .expect(400);
    });

    it('should return Not Found Exception (404) if prediction document with specified prediction ID was not found', async () => {
      const wrongPredictionId = new Types.ObjectId();

      await request(app.getHttpServer())
        .delete(`/predictions/delete/${wrongPredictionId.toHexString()}`)
        .set('Cookie', `Authentication=${testAuthToken}`)
        .expect(404);
    });

    it('should return the deleted prediction document if the process was successful', async () => {
      const res = await request(app.getHttpServer())
        .delete(
          `/predictions/delete/${createPredictionResponseDoc.predictionsData[0].id}`,
        )
        .set('Cookie', `Authentication=${testAuthToken}`)
        .expect(200);

      const responsePredictionDoc = res.body as PredictionDocument;
      expect(responsePredictionDoc.predictionsData.length).toEqual(0);
    });
  });
});
