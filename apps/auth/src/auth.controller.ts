import { Controller, Get, Post, Res, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { UserDocument } from './users/models/user.schema';
import { Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // Login functionality mainly handled by the AuthGuard & LocalStrategy
  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(
    @CurrentUser() user: UserDocument,
    // Get the Response object and use "passthrough" to manually send
    // back the Response
    @Res({ passthrough: true }) response: Response,
  ) {
    await this.authService.setJwtToken(user, response);

    response.send(user);
  }
}
