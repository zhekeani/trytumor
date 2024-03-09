import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UserDocument } from './users/models/user.schema';
import { Response } from 'express';
import { TokenPayload } from './interfaces/token-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  // Method to create jwt token and send it back as cookie
  async login(user: UserDocument, response: Response) {
    // Set the token payload to user._id
    const tokenPayload: TokenPayload = {
      userId: user._id.toHexString(),
    };

    // Set the cookie expiration based on the JWT_EXPIRATION
    const expires = new Date();
    expires.setSeconds(
      expires.getSeconds() + this.configService.get('JWT_EXPIRATION'),
    );

    const token = this.jwtService.sign(tokenPayload);

    // Set "Authentication" cookie
    response.cookie('Authentication', token, {
      httpOnly: true,
      expires,
    });
  }
}
