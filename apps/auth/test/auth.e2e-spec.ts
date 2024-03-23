import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import * as fs from 'fs';
import * as FormData from 'form-data';
import { AuthModule } from './../src/auth.module';
import { CreateUserDto } from '../src/users/dto/create-user.dto';

describe('AuthController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AuthModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/auth')
      .expect(200)
      .expect('Hello World!');
  });

  it('/users (GET)', () => {
    return request(app.getHttpServer()).get('/users').expect(200);
  });

  // Create new user
  describe('/users/create (POST)', () => {
    let createUserDto: Partial<CreateUserDto>;

    beforeAll(async () => {
      await request(app.getHttpServer()).delete('/users/delete/all');
    });

    beforeEach(() => {
      createUserDto = {
        email: 'test@test.com',
        password: 'StrongPassword123!',
        username: 'user_test',
        fullName: 'Josh Von Doe',
      };
    });

    it('should create new user and return newly created user, if the validation success', async () => {
      const form = new FormData();

      Object.keys(createUserDto).forEach((key) => {
        form.append(key, createUserDto[key]);
      });

      // Read the file as a buffer and append it to the form
      const fileData = fs.readFileSync(`${__dirname}/images/test-image.jpg`);
      form.append('file', fileData, 'test-image.jpg');

      const res = await request(app.getHttpServer())
        .post('/users/create')
        .set(
          'Content-Type',
          `multipart/form-data; boundary=${form.getBoundary()}`,
        )
        .send(form.getBuffer())
        .expect(201);

      const { body } = res;

      expect(body.email).toEqual(createUserDto.email);
      expect(body.username).toEqual(createUserDto.username);
      expect(body.fullName).toEqual(createUserDto.fullName);
      expect(body.profilePictureUrl).toBeDefined();
    });

    it('should return Unprocessable Entity (422), if username already exist', async () => {
      const form = new FormData();

      // Change the email so its different from the previous one
      createUserDto.email = 'test2@test.com';

      Object.keys(createUserDto).forEach((key) => {
        form.append(key, createUserDto[key]);
      });

      const res = await request(app.getHttpServer())
        .post('/users/create')
        .set(
          'Content-Type',
          `multipart/form-data; boundary=${form.getBoundary()}`,
        )
        .send(form.getBuffer())
        .expect(422);
    });

    it('should return Unprocessable Entity (422), if email already exist', async () => {
      const form = new FormData();

      // Change the username so its different from the previous one
      createUserDto.username = 'user_test2';

      Object.keys(createUserDto).forEach((key) => {
        form.append(key, createUserDto[key]);
      });

      const res = await request(app.getHttpServer())
        .post('/users/create')
        .set(
          'Content-Type',
          `multipart/form-data; boundary=${form.getBoundary()}`,
        )
        .send(form.getBuffer())
        .expect(422);
    });
  });

  describe('/auth/login (POST)', () => {
    let createUserDto: Partial<CreateUserDto>;

    beforeAll(async () => {
      await request(app.getHttpServer()).delete('/users/delete/all');

      createUserDto = {
        email: 'test@test.com',
        password: 'StrongPassword123!',
        username: 'user_test',
        fullName: 'Josh Von Doe',
      };

      await request(app.getHttpServer())
        .post('/users/create')
        .send(createUserDto);
    });

    // beforeEach(() => {
    //   createUserDto = {
    //     email: 'test@test.com',
    //     password: 'StrongPassword123!',
    //     username: 'user_test',
    //     fullName: 'Josh Von Doe',
    //   };
    // });

    it('should return Document Not Found (404) if the user is not exists', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          username: 'wrong_user_test',
          email: 'wrong_email',
          password: createUserDto.password,
        })
        .expect(404);
    });

    it('should return Unauthorized (401) if the credentials are not valid', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          username: createUserDto.username,
          email: createUserDto.email,
          password: 'wrong_password',
        })
        .expect(401);
    });

    it('should set access & refresh token to response cookie and update refresh token in database', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          username: createUserDto.username,
          email: createUserDto.email,
          password: createUserDto.password,
        })
        .expect(201);

      const cookies = res.get('Set-Cookie');

      const cookiesName = cookies.map((cookie) => {
        const [name, value] = cookie.trim().split('=');

        return name;
      });

      expect(cookiesName).toContain('Authentication');
      expect(cookiesName).toContain('refresh_token');
    });
  });
});
