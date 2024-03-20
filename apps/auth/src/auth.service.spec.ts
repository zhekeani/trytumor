import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { UsersService } from './users/users.service';
import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import { ForbiddenException, forwardRef } from '@nestjs/common';
import { Response } from 'express';
import { UserDocument } from './users/models/user.schema';
import * as bcrypt from 'bcryptjs';

describe('AuthService', () => {
  let authService: AuthService;
  let fakeJwtService: JwtService;
  let fakeConfigService: Partial<ConfigService>;
  let fakeUsersService: Partial<UsersService>;

  let testUser: UserDocument;
  let fakeResponse: Partial<Response>;

  beforeEach(async () => {
    fakeConfigService = {
      get: jest.fn().mockImplementation((key: string) => {
        switch (key) {
          case 'JWT_SECRET':
            return 'dummy_secret';
          case 'JWT_EXPIRATION':
            return '3600';
          case 'JWT_REFRESH_SECRET':
            return 'dummy_refresh_secret';
          case 'JWT_REFRESH_EXPIRATION':
            return '86400';
          default:
            return undefined;
        }
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn().mockResolvedValue('fakeAccessToken'),
          },
        },
        AuthService,
        { provide: ConfigService, useValue: fakeConfigService },
        {
          provide: UsersService,
          useValue: {
            updateUserRefreshToken: jest.fn(),
          },
        },
      ],
    }).compile();

    authService = module.get(AuthService);
    fakeJwtService = module.get(JwtService);
    fakeUsersService = module.get(UsersService);

    testUser = {
      _id: new Types.ObjectId(),
      username: 'test user',
      fullName: 'Test User',
      email: 'test@test.com',
      password: 'password',
    };

    fakeResponse = {
      cookie: jest.fn(),
    };
  });

  it('setTokens, creates two tokens (access token & refresh token)', async () => {
    const { accessToken, refreshToken } =
      await authService['setTokens'](testUser);

    expect(fakeJwtService.signAsync).toHaveBeenCalledWith(
      {
        tokenPayload: {
          userId: testUser._id.toHexString(),
          username: testUser.username,
          fullName: testUser.fullName,
        },
      },
      { secret: 'dummy_secret', expiresIn: '3600s', algorithm: 'HS256' },
    );

    expect(fakeJwtService.signAsync).toHaveBeenCalledWith(
      {
        tokenPayload: {
          userId: testUser._id.toHexString(),
          username: testUser.username,
          fullName: testUser.fullName,
        },
      },
      {
        secret: 'dummy_refresh_secret',
        expiresIn: '86400s',
        algorithm: 'HS256',
      },
    );

    expect(accessToken).toBeDefined();
    expect(refreshToken).toBeDefined();
  });

  it('setCookie, should set cookie in Response object', async () => {
    await authService['setCookie'](
      fakeResponse as Response,
      'Authentication',
      'accessToken',
      3600,
    );

    expect(fakeResponse.cookie).toHaveBeenCalledWith(
      'Authentication',
      'accessToken',
      { expires: expect.any(Date) },
    );
  });

  it('login, generates tokens and set each tokens to response cookie', async () => {
    authService['setTokens'] = jest.fn().mockResolvedValue({
      accessToken: 'access_token',
      refreshToken: 'refresh_token',
    });

    authService['setCookie'] = jest.fn();

    await authService.login(testUser, fakeResponse as Response);

    expect(authService['setTokens']).toHaveBeenCalledWith(testUser);
    expect(fakeUsersService.updateUserRefreshToken).toHaveBeenCalledWith(
      testUser._id,
      'refresh_token',
    );
    expect(authService['setCookie']).toHaveBeenCalledTimes(2);
    expect(authService['setCookie']).toHaveBeenCalledWith(
      fakeResponse,
      'Authentication',
      'access_token',
      fakeConfigService.get('JWT_EXPIRATION'),
      { httpOnly: true },
    );
    expect(authService['setCookie']).toHaveBeenCalledWith(
      fakeResponse,
      'refresh_token',
      'refresh_token',
      fakeConfigService.get('JWT_REFRESH_EXPIRATION'),
      { httpOnly: true, sameSite: 'lax' },
    );
  });

  it('refreshAccessToken, throw forbidden exception if refresh token not provided', async () => {
    const mockCompare = jest.spyOn(bcrypt, 'compare');

    // Mock the implementation
    mockCompare.mockImplementation(
      (refreshToken: string, userRefreshToken: string) =>
        Promise.resolve(refreshToken === userRefreshToken),
    );

    // Check when the refresh token is not provided
    await expect(
      authService.refreshAccessToken(
        testUser,
        'refresh_token',
        fakeResponse as Response,
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it('refreshAccessToken, throw forbidden exception if provided refresh token and stored refresh token is not equal', async () => {
    const mockCompare = jest.spyOn(bcrypt, 'compare');

    // Mock the implementation
    mockCompare.mockImplementation(
      (refreshToken: string, userRefreshToken: string) =>
        Promise.resolve(refreshToken === userRefreshToken),
    );

    // Add the wrong refresh_token
    testUser.refreshToken = 'wrong_refresh_token';

    // Check when the refresh token is not provided
    await expect(
      authService.refreshAccessToken(
        testUser,
        'refresh_token',
        fakeResponse as Response,
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it('refreshAccessToken, check for refresh token provided and set new access token to cookie', async () => {
    const mockCompare = jest.spyOn(bcrypt, 'compare');

    // Mock the implementation
    mockCompare.mockImplementation(
      (refreshToken: string, userRefreshToken: string) =>
        Promise.resolve(refreshToken === userRefreshToken),
    );

    authService['setTokens'] = jest.fn().mockResolvedValue({
      accessToken: 'new_access_token',
      refreshToken: 'new_refresh_token',
    });
    authService['setCookie'] = jest.fn();

    testUser.refreshToken = 'refresh_token';

    // Check when the refresh token is not provided
    await authService.refreshAccessToken(
      testUser,
      'refresh_token',
      fakeResponse as Response,
    );

    expect(authService['setTokens']).toHaveBeenCalledWith(testUser);

    expect(authService['setCookie']).toHaveBeenCalledWith(
      fakeResponse,
      'Authentication',
      'new_access_token',
      fakeConfigService.get('JWT_EXPIRATION'),
      { httpOnly: true },
    );
  });
});
