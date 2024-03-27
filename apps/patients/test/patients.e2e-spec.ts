import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as request from 'supertest';
import { Types } from 'mongoose';
import * as FormData from 'form-data';
import * as fs from 'fs';

import {
  GenerateAccessTokenDto,
  JwtStrategy,
  Services,
  TestingAuthModule,
  TestingJwtStrategy,
} from '@app/common';
import { PatientsModule } from '../src/patients.module';
import { CreatePatientDto } from '../src/dto/create-patient.dto';
import { PatientDocument } from '../src/models/patient.schema';

describe('PatientsController (e2e)', () => {
  let app: INestApplication;

  const mockClientProxy = {
    emit: (...args: any[]) => {},
  };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        PatientsModule,
        TestingAuthModule.forRootAsync({
          inject: [ConfigService],
          useFactory: (configService: ConfigService) => ({
            jwtTestingSecret: configService.get('JWT_TESTING_SECRET'),
            jwtTestingExpiration: 900,
          }),
        }),
      ],
    })
      .overrideProvider(Services.Doctors)
      .useValue(mockClientProxy)
      .overrideProvider(Services.Predictions)
      .useValue(mockClientProxy)
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

  // Set up for user creation
  const mockCreatePatientDto: CreatePatientDto = {
    profilePictureURL: 'test_profile_picture_url',
    fullName: 'test_full_name',
    birthDate: new Date(),
    gender: 'female',
    height: 180,
    weight: 67,
    email: 'test@test.com',
    address: 'test_address',
    previousMedicalConditions: ['test_previous_medical_condition'],
    familyMedicalHistory: ['test_family_medical_history'],
    allergies: ['test_allergy'],
  };

  const mockFormData = new FormData();
  Object.keys(mockCreatePatientDto).forEach((key) => {
    if (Array.isArray(mockCreatePatientDto[key])) {
      mockCreatePatientDto[key].forEach((item: string) => {
        mockFormData.append(key, item);
      });
    } else {
      if (typeof mockCreatePatientDto[key] !== 'string') {
        mockCreatePatientDto[key] = mockCreatePatientDto[key].toString();
      }
      mockFormData.append(key, mockCreatePatientDto[key]);
    }
  });

  const mockFileData = fs.readFileSync(
    `${__dirname}/images/test-create-patient-image.jpg`,
  );
  mockFormData.append('file', mockFileData, 'test-create-patient-image.jpg');

  it('/patients/health (GET), should return "Service is healthy" if the service is healthy', async () => {
    request(app.getHttpServer())
      .get('/patients/health')
      .expect(200)
      .expect('Service is healthy');
  });

  it('/patient/authenticate (GET), should return ""You are authenticated" if the request have a valid access token', async () => {
    request(app.getHttpServer())
      .get('/patients/authenticate')
      .set('Cookie', `Authentication=${testAuthToken}`)
      .expect(200)
      .expect("You're authenticated");
  });

  describe('/patients/create (POST)', () => {
    beforeAll(async () => {
      await request(app.getHttpServer())
        .delete('/patients/delete/all')
        .expect(200);
    });

    it('should return Unauthorized (401) if the access token is not provided or not valid', async () => {
      await request(app.getHttpServer())
        .post('/patients/create')
        .set('Cookie', 'Authentication=invalid_token')
        .set(
          'Content-Type',
          `multipart/form-data; boundary=${mockFormData.getBoundary()}`,
        )
        .send(mockFormData.getBuffer())
        .expect(401);
    });

    it('should create new patient (200), save the profile picture image to cloud storage and save patient data to database, if the process was successful', async () => {
      const res = await request(app.getHttpServer())
        .post(`/patients/create`)
        .set('Cookie', `Authentication=${testAuthToken}`)
        .set(
          'Content-Type',
          `multipart/form-data; boundary=${mockFormData.getBoundary()}`,
        )
        .send(mockFormData.getBuffer())
        .expect(201);

      const responsePatientDoc: PatientDocument = res.body;
      expect(responsePatientDoc.email).toEqual(mockCreatePatientDto.email);
    });
  });

  describe('/ (GET)', () => {
    let responseCreatePatientDoc: PatientDocument;

    beforeAll(async () => {
      await request(app.getHttpServer())
        .delete('/patients/delete/all')
        .expect(200);

      const createPatientRes = await request(app.getHttpServer())
        .post(`/patients/create`)
        .set('Cookie', `Authentication=${testAuthToken}`)
        .set(
          'Content-Type',
          `multipart/form-data; boundary=${mockFormData.getBoundary()}`,
        )
        .send(mockFormData.getBuffer())
        .expect(201);

      responseCreatePatientDoc = createPatientRes.body;
    });

    it('should return all patients', async () => {
      const res = await request(app.getHttpServer())
        .get('/patients/')
        .expect(200);

      const responseDoc: PatientDocument = res.body[0];
      expect(responseDoc).toEqual(responseCreatePatientDoc);
    });

    describe('/patients/:id (GET)', () => {
      it('should return Bad Request Exception (400) if the provided patient ID is not valid MongoDB Object ID', async () => {
        await request(app.getHttpServer())
          .get(`/patients/invalid_id`)
          .expect(400);
      });

      it('should return Not Found Exception (404) if the patient document with specified patient ID was not found', async () => {
        const notFoundId = new Types.ObjectId();
        await request(app.getHttpServer())
          .get(`/patients/${notFoundId.toHexString()}`)
          .expect(404);
      });

      it('should return specific patient document with specified patient ID, if the document was found', async () => {
        const res = await request(app.getHttpServer())
          .get(`/patients/${responseCreatePatientDoc._id}`)
          .expect(200);

        const responseDoc: PatientDocument = res.body;
        expect(responseDoc).toEqual(responseCreatePatientDoc);
      });
    });
  });

  describe('/patients/update/:id (PATCH)', () => {
    let responseCreatePatientDoc: PatientDocument;

    beforeAll(async () => {
      await request(app.getHttpServer())
        .delete('/patients/delete/all')
        .expect(200);

      const createPatientRes = await request(app.getHttpServer())
        .post(`/patients/create`)
        .set('Cookie', `Authentication=${testAuthToken}`)
        .set(
          'Content-Type',
          `multipart/form-data; boundary=${mockFormData.getBoundary()}`,
        )
        .send(mockFormData.getBuffer())
        .expect(201);

      responseCreatePatientDoc = createPatientRes.body;
    });

    const mockUpdatePatientDto: Partial<CreatePatientDto> = {
      fullName: 'full_name_updated',
      email: 'test_updated@test.com',
    };

    const mockUpdateFormData = new FormData();
    Object.keys(mockUpdatePatientDto).forEach((key) => {
      mockUpdateFormData.append(key, mockUpdatePatientDto[key]);
    });

    it('should return Bad Request Exception (400) if the provided patient ID is not valid MongoDB Object ID', async () => {
      await request(app.getHttpServer())
        .patch(`/patients/update/invalid_id`)
        .set('Cookie', `Authentication=${testAuthToken}`)
        .set(
          'Content-Type',
          `multipart/form-data; boundary=${mockUpdateFormData.getBoundary()}`,
        )
        .send(mockUpdateFormData.getBuffer())
        .expect(400);
    });

    it('should return Unauthorized (401) if the access token is not provided or not valid', async () => {
      await request(app.getHttpServer())
        .patch(`/patients/update/${responseCreatePatientDoc._id}`)
        .set('Cookie', `Authentication=invalid_token`)
        .set(
          'Content-Type',
          `multipart/form-data; boundary=${mockUpdateFormData.getBoundary()}`,
        )
        .send(mockUpdateFormData.getBuffer())
        .expect(401);
    });

    it('should return Not Found Exception (404) if patient document with specified patient ID was not found', async () => {
      const notFoundId = new Types.ObjectId();
      await request(app.getHttpServer())
        .patch(`/patients/update/${notFoundId.toHexString()}`)
        .set('Cookie', `Authentication=${testAuthToken}`)
        .set(
          'Content-Type',
          `multipart/form-data; boundary=${mockUpdateFormData.getBoundary()}`,
        )
        .send(mockUpdateFormData.getBuffer())
        .expect(404);
    });

    it('should update specific patient with specified patient ID', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/patients/update/${responseCreatePatientDoc._id}`)
        .set('Cookie', `Authentication=${testAuthToken}`)
        .set(
          'Content-Type',
          `multipart/form-data; boundary=${mockUpdateFormData.getBoundary()}`,
        )
        .send(mockUpdateFormData.getBuffer())
        .expect(200);

      const responseDoc: PatientDocument = res.body;
      expect(responseDoc.fullName).toEqual(mockUpdatePatientDto.fullName);
      expect(responseDoc.email).toEqual(mockUpdatePatientDto.email);
    });
  });

  describe('/patient/delete/:id (DELETE)', () => {
    let responseCreatePatientDoc: PatientDocument;

    beforeAll(async () => {
      await request(app.getHttpServer())
        .delete('/patients/delete/all')
        .expect(200);

      const createPatientRes = await request(app.getHttpServer())
        .post(`/patients/create`)
        .set('Cookie', `Authentication=${testAuthToken}`)
        .set(
          'Content-Type',
          `multipart/form-data; boundary=${mockFormData.getBoundary()}`,
        )
        .send(mockFormData.getBuffer())
        .expect(201);

      responseCreatePatientDoc = createPatientRes.body;
    });

    it('should return Bad Request Exception (400), if the provided patient ID is not a valid MongoDB Object ID', async () => {
      await request(app.getHttpServer())
        .delete(`/patients/delete/invalid_id`)
        .set('Cookie', `Authentication=${testAuthToken}`)
        .expect(400);
    });

    it('should return Unauthorized (401), if the access token is not provided or not valid', async () => {
      await request(app.getHttpServer())
        .delete(`/patients/delete/${responseCreatePatientDoc._id}`)
        .set('Cookie', `Authentication=invalid_token`)
        .expect(401);
    });

    it('should delete specific patient document with specified patient ID', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/patients/delete/${responseCreatePatientDoc._id}`)
        .set('Cookie', `Authentication=${testAuthToken}`)
        .expect(200);

      const responseDoc: PatientDocument = res.body;
      expect(responseDoc).toEqual(responseCreatePatientDoc);
    });
  });
});
