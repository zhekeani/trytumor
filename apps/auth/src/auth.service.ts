import { ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as Bluebird from 'bluebird';
import * as Bcrypt from 'bcryptjs';

import { DoctorDocument, SecretsToLoad, TokenPayload } from '@app/common';
import { CookieOptions, Response } from 'express';
import { DoctorsService } from './doctors/doctors.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly doctorsService: DoctorsService,
  ) {}

  getHello(): string {
    return 'Hello World!';
  }

  private async setTokens(doctor: DoctorDocument) {
    const tokenPayload: TokenPayload = {
      doctorId: doctor._id.toHexString(),
      doctorName: doctor.doctorName,
      fullName: doctor.fullName,
    };
    const secrets = this.configService.get<SecretsToLoad>('secrets');
    const tokens = await Bluebird.Promise.all([
      this.jwtService.signAsync(
        {
          ...tokenPayload,
        },
        {
          secret: secrets.jwtSecret,
          expiresIn: `${secrets.jwtExpiration}s`,
          algorithm: 'HS256',
        },
      ),
      this.jwtService.signAsync(
        { ...tokenPayload },
        {
          secret: secrets.jwtRefreshSecret,
          expiresIn: `${secrets.jwtRefreshExpiration}s`,
          algorithm: 'HS256',
        },
      ),
    ]);
    return {
      accessToken: tokens[0],
      refreshToken: tokens[1],
    };
  }

  private async setCookie(
    response: Response,
    name: string,
    value: string,
    expiresInSecond: number,
    cookieOptions?: CookieOptions,
  ) {
    const expires = new Date();
    expires.setSeconds(expires.getSeconds() + expiresInSecond);

    response.cookie(name, value, {
      ...cookieOptions,
      expires,
    });
  }

  async login(doctor: DoctorDocument, response: Response) {
    const { accessToken, refreshToken } = await this.setTokens(doctor);
    const secrets = this.configService.get<SecretsToLoad>('secrets');

    await this.doctorsService.updateUserRefreshToken(doctor._id, refreshToken);

    this.setCookie(
      response,
      'Authentication',
      accessToken,
      parseInt(secrets.jwtExpiration),
      { httpOnly: true },
    );
    this.setCookie(
      response,
      'refresh_token',
      refreshToken,
      parseInt(secrets.jwtRefreshExpiration),
      { httpOnly: true, sameSite: 'lax' },
    );
  }

  async refreshAccessToken(
    doctorId: string,
    refreshToken: string,
    response: Response,
  ) {
    const doctor = await this.doctorsService.fetchDoctorById(doctorId);

    if (!doctor.refreshToken) {
      throw new ForbiddenException('Access denied');
    }

    const isRefreshTokenMatches = await Bcrypt.compare(
      refreshToken,
      doctor.refreshToken,
    );

    if (!isRefreshTokenMatches) {
      throw new ForbiddenException('Access denied');
    }

    const { accessToken } = await this.setTokens(doctor);
    const secrets = this.configService.get<SecretsToLoad>('secrets');
    this.setCookie(
      response,
      'Authentication',
      accessToken,
      parseInt(secrets.jwtExpiration),
      { httpOnly: true },
    );
  }

  async revokeRefreshToken(doctorId: string) {
    return this.doctorsService.deleteRefreshToken(doctorId);
  }
}
