import { ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';

import { UserDocument } from './users/models/user.schema';
import { CookieOptions, Response } from 'express';
import { TokenPayload, TokenPayloadProperties } from '@app/common';
import { UsersService } from './users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
  ) {}

  private async setTokens(user: UserDocument) {
    // Set the token payload to user._id for both access token
    // & refresh token
    const tokenPayload: TokenPayloadProperties = {
      userId: user._id.toHexString(),
      username: user.username,
      fullName: user.fullName,
    };

    const tokens = await Promise.all([
      this.jwtService.signAsync(
        {
          tokenPayload,
        },
        {
          secret: this.configService.get('JWT_SECRET'),
          expiresIn: `${this.configService.get('JWT_EXPIRATION')}s`,
          algorithm: 'HS256',
        },
      ),
      this.jwtService.signAsync(
        { tokenPayload },
        {
          secret: this.configService.get('JWT_REFRESH_SECRET'),
          expiresIn: `${this.configService.get('JWT_REFRESH_EXPIRATION')}s`,
          algorithm: 'HS256',
        },
      ),
    ]);

    return {
      accessToken: tokens[0],
      refreshToken: tokens[1],
    };
  }

  // Set cookie to the response object
  private async setCookie(
    response: Response,
    name: string,
    value: string,
    expiresInSecond: number,
    cookieOptions?: CookieOptions,
  ) {
    // Crete the cookie expiration
    const expires = new Date();

    expires.setSeconds(expires.getSeconds() + expiresInSecond);

    response.cookie(name, value, {
      ...cookieOptions,
      expires,
    });
  }

  async login(user: UserDocument, response: Response) {
    // Create the access token and refresh token
    const { accessToken, refreshToken } = await this.setTokens(user);

    // If this method is called, it means the user exists
    // Update refresh token stored in database
    await this.usersService.updateUserRefreshToken(user._id, refreshToken);

    // Set the access token and refresh token to response cookie
    this.setCookie(
      response,
      'Authentication',
      accessToken,
      this.configService.get('JWT_EXPIRATION'),
      {
        httpOnly: true,
      },
    );
    this.setCookie(
      response,
      'refresh_token',
      refreshToken,
      this.configService.get('JWT_REFRESH_EXPIRATION'),
      {
        httpOnly: true,
        sameSite: 'lax',
      },
    );
  }

  async refreshAccessToken(
    user: UserDocument,
    refreshToken: string,
    response: Response,
  ) {
    // Check does the refresh token still exist in the database
    // incase it being revoked
    if (!user.refreshToken) {
      throw new ForbiddenException('Access Denied');
    }

    // Compare saved refresh token with refresh token from the
    // cookie
    const refreshTokenMatches = await bcrypt.compare(
      refreshToken,
      user.refreshToken,
    );

    if (!refreshTokenMatches) throw new ForbiddenException('Access Denied');

    // Set the new access token
    const { accessToken } = await this.setTokens(user);

    // Set the token to response cookie
    this.setCookie(
      response,
      'Authentication',
      accessToken,
      this.configService.get('JWT_EXPIRATION'),
      {
        httpOnly: true,
      },
    );
  }
}
