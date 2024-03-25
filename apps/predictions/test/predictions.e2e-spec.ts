import {
  GenerateAccessTokenDto,
  JwtStrategy,
  TestingAuthModule,
  TestingJwtStrategy,
} from '@app/common';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import * as request from 'supertest';
import { PredictionsModule } from '../src/predictions.module';

describe('PredictionsController (e2e)', () => {
  let app: INestApplication;
  const jwtTestingSecret = 'testing_secret';

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        PredictionsModule,
        TestingAuthModule.forRootAsync({
          useFactory: () => ({
            jwtTestingSecret,
            jwtTestingExpiration: 900,
          }),
        }),
      ],
    })
      .overrideProvider(JwtStrategy)
      .useClass(TestingJwtStrategy)
      .overrideProvider('JWT_TESTING_SECRET')
      .useValue(jwtTestingSecret)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  describe('/predictions (GET)', () => {
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

    it('should return access token', async () => {
      const generateAccessTokenDto: GenerateAccessTokenDto = {
        userId: new Types.ObjectId().toHexString(),
        fullName: 'test_full_name',
      };

      const res = await request(app.getHttpServer())
        .post('/testing/auth')
        .send(generateAccessTokenDto)
        .expect(201);

      console.log(res.body);
    });

    describe('/ (GET)', () => {
      it('should return all predictions from all patients', async () => {
        return request(app.getHttpServer())
          .get('/predictions')
          .set('Cookie', `Authentication=${testAuthToken}`)
          .expect(200);
      });
    });

    // describe('/patient/:id', () => {
    //   it('should return all predictions from specific patient with specified patient ID', async () => {

    //   })
    // })
  });

  describe('/predictions/create/:id (POST)', () => {
    it('should return Unauthorized (401) if the access token is not provided or not valid', async () => {});
  });
});
