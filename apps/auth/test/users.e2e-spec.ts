import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AuthModule } from '../src/auth.module';
import { CreateUserDto } from '../src/users/dto/create-user.dto';
import { EditUserDto } from '../src/users/dto/edit-user.dto';

describe('UsersController (e2e)', () => {
  let app: INestApplication;

  let createUserDto: Partial<CreateUserDto>;
  let createUserRes: request.Response;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AuthModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  beforeEach(async () => {
    await request(app.getHttpServer()).delete('/users/delete/all');

    createUserDto = {
      email: 'test@test.com',
      password: 'StrongPassword123!',
      username: 'user_test',
      fullName: 'Josh Von Doe',
    };
    createUserRes = await request(app.getHttpServer())
      .post('/users/create')
      .send(createUserDto);
  });

  it('/users (GET)', () => {
    return request(app.getHttpServer()).get('/users').expect(200);
  });

  describe('/users/:id (GET)', () => {
    it('should return Bad Request Exception (400) if the provided ID is not a valid mongodb ID', async () => {
      await request(app.getHttpServer()).get(`/users/invalid_ID`).expect(400);
    });

    it('should return Document Not Found (404) if the user is not found', async () => {
      await request(app.getHttpServer())
        .delete(`/users/delete/${createUserRes.body._id}`)
        .expect(200);

      await request(app.getHttpServer())
        .get(`/users/${createUserRes.body._id}`)
        .expect(404);
    });

    it('should return the user if user is found', async () => {
      const res = await request(app.getHttpServer())
        .get(`/users/${createUserRes.body._id}`)
        .expect(200);

      expect(res.body.email).toEqual(createUserDto.email);
      expect(res.body.username).toEqual(createUserDto.username);
      expect(res.body.fullName).toEqual(createUserDto.fullName);
    });
  });

  describe('/users/update/:id (PATCH)', () => {
    it('should return Bad Request Exception (400) if the provided ID is not a valid mongodb ID', async () => {
      await request(app.getHttpServer())
        .patch(`/users/update/invalid_id`)
        .expect(400);
    });

    it('should return Document Not Found (404) if the user is not found', async () => {
      await request(app.getHttpServer())
        .delete(`/users/delete/${createUserRes.body._id}`)
        .expect(200);

      await request(app.getHttpServer())
        .patch(`/users/update/${createUserRes.body._id}`)
        .expect(404);
    });

    it('should return the updated user if the user is found', async () => {
      const updateUserDto: EditUserDto = {
        fullName: 'Josh Von Doe Updated',
        department: 'updated_department',
      };

      const res = await request(app.getHttpServer())
        .patch(`/users/update/${createUserRes.body._id}`)
        .send(updateUserDto)
        .expect(200);

      expect(res.body.fullName).toEqual(updateUserDto.fullName);
      expect(res.body.department).toEqual(updateUserDto.department);
    });
  });

  describe('/users/delete/:id (DELETE)', () => {
    it('should return Bad Request Exception (400) if the provided ID is not a valid mongodb ID', async () => {
      await request(app.getHttpServer())
        .delete(`/users/delete/invalid_id`)
        .expect(400);
    });

    it('should delete and return the deleted user if the user is found', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/users/delete/${createUserRes.body._id}`)
        .expect(200);

      expect(res.body._id).toEqual(createUserRes.body._id);
      expect(res.body.email).toEqual(createUserRes.body.email);
      expect(res.body.username).toEqual(createUserRes.body.username);
      expect(res.body.fullName).toEqual(createUserRes.body.fullName);
    });
  });
});
