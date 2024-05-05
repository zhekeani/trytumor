import { Response } from 'express';
import {
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';

import { AuthService } from './auth.service';
import {
  CurrentDoctor,
  DoctorDocument,
  JwtAuthGuard,
  JwtRefreshAuthGuard,
  RefreshToken,
  TokenPayload,
} from '@app/common';
import { LocalAuthGuard } from './utils/guards/local-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get()
  getHello(): string {
    return this.authService.getHello();
  }

  @Get('tryGuard')
  @UseGuards(JwtAuthGuard)
  tryAuthGuard() {
    return;
  }

  // login
  @Post('login')
  @UseGuards(LocalAuthGuard)
  async login(
    @CurrentDoctor() doctor: DoctorDocument,
    @Res({ passthrough: true }) response: Response,
  ) {
    await this.authService.login(doctor, response);

    response.send(doctor);
  }

  // check authentication
  @Post('authenticate')
  @UseGuards(JwtAuthGuard)
  async authenticate(@CurrentDoctor() doctor: DoctorDocument) {
    return doctor;
  }

  // refresh access token
  @Get('refresh')
  @UseGuards(JwtRefreshAuthGuard)
  async refreshToken(
    @CurrentDoctor() doctor: TokenPayload,
    @RefreshToken() refreshToken: string,
    @Res({ passthrough: true }) response: Response,
  ) {
    await this.authService.refreshAccessToken(
      doctor.doctorId,
      refreshToken,
      response,
    );

    response.send(doctor);
  }

  // Revoke refresh token
  @Patch('refresh/revoke/:id')
  async revokeRefreshToken(@Param('id') id: string) {
    return this.authService.revokeRefreshToken(id);
  }
}
