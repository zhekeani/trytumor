import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { PredictionsModule } from '../src/predictions.module';

describe('PredictionsController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [PredictionsModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  describe('/predictions (GET)', () => {
    describe('/ (GET)', () => {
      it('should return all predictions from all patients', async () => {
        return request(app.getHttpServer()).get('/predictions').expect(200);
      });
    });
  });
});
