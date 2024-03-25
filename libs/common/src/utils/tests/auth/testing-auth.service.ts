import { Inject, Injectable } from '@nestjs/common';
import { TokenPayloadProperties } from '../../../interfaces';
import { TestingAuthModuleConfig } from './interfaces';
import { JwtService } from '@nestjs/jwt';
import { GenerateAccessTokenDto } from './dto';

@Injectable()
export class TestingAuthService {
  constructor(
    @Inject('CONFIG') private readonly moduleConfig: TestingAuthModuleConfig,
    private readonly jwtService: JwtService,
  ) {}

  async generateAccessToken(generateAccessTokenDto: GenerateAccessTokenDto) {
    const tokenPayload: TokenPayloadProperties = { ...generateAccessTokenDto };

    const token = this.jwtService.sign(tokenPayload, {
      secret: this.moduleConfig.jwtTestingSecret,
      expiresIn: `${this.moduleConfig.jwtTestingExpiration}s`,
      algorithm: 'HS256',
    });

    return token;
  }
}
