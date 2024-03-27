import {
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { UserDto } from './users/dto/user.dto';
import { UserDocument } from './users/models/user.schema';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Serialize } from './interceptors/serialize.interceptor';
import { JwtRefreshGuard } from './guards/jwt-refresh-auth.guard';
import { RefreshToken } from './decorators/refresh-token-cookie.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get()
  async helloWorld() {
    return 'Hello World!';
  }

  // Login functionality mainly handled by LocalStrategy & UsersService
  @UseGuards(LocalAuthGuard)
  // @Serialize(UserDto)
  @Post('login')
  async login(
    @CurrentUser() user: UserDocument,
    // Get the Response object and use "passthrough" to manually send
    // back the Response
    @Res({ passthrough: true }) response: Response,
  ) {
    await this.authService.login(user, response);

    response.send(
      // Only expose specified user's properties
      plainToClass(UserDto, user, { excludeExtraneousValues: true }),
    );
  }

  // Authenticate functionality mainly handled by JwtStrategy & UsersService
  @UseGuards(JwtAuthGuard)
  @Serialize(UserDto)
  @Post('authenticate')
  async authenticate(@CurrentUser() user: UserDocument) {
    return user;
  }

  // Authenticate against refresh token, handled by JwtRefreshStrategy
  @UseGuards(JwtRefreshGuard)
  @Get('refresh')
  async refreshToken(
    @CurrentUser() user: UserDocument,
    @RefreshToken() refreshToken: string,
    @Res({ passthrough: true }) response: Response,
  ) {
    await this.authService.refreshAccessToken(user, refreshToken, response);

    response.send(
      plainToClass(UserDto, user, { excludeExtraneousValues: true }),
    );
  }

  @Patch('refresh/revoke/:id')
  async revokeRefreshToken(@Param('id') id: string) {
    return this.authService.revokeRefreshToken(id);
  }
}
