import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UserDocument } from './users/models/user.schema';
import { CookieOptions, Response } from 'express';
import { TokenPayload } from './interfaces/token-payload.interface';
import { UsersService } from './users/users.service';
import { TokenPayloadProperties } from './interfaces/token-payload-properties.interface';

@Injectable()
export class AuthService {
  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
  ) {}

  async setTokens(user: UserDocument) {
    // Set the token payload to user._id for both access token
    // & refresh token
    const tokenPayload: TokenPayloadProperties = {
      userId: user._id.toHexString(),
      username: user.username,
    };

    console.log('this is from Auth Service', user._id.toHexString());

    const tokens = await Promise.all([
      this.jwtService.signAsync(
        {
          tokenPayload,
        },
        {
          secret: this.configService.get('JWT_SECRET'),
          expiresIn: `${this.configService.get('JWT_EXPIRATION')}s`,
        },
      ),
      this.jwtService.signAsync(
        { tokenPayload },
        {
          secret: this.configService.get('JWT_REFRESH_SECRET'),
          expiresIn: `${this.configService.get('JWT_REFRESH_EXPIRATION')}`,
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

  // Method to create jwt token and send it back as cookie
  async login(user: UserDocument, response: Response) {
    // Create the access token and refresh token
    const { accessToken, refreshToken } = await this.setTokens(user);

    // If this method is called, it means the user exists
    // Update refresh token stored in database
    await this.usersService.updateRefreshToken(user._id, refreshToken);

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
}
