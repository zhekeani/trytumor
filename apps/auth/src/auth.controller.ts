import { Controller, Post, Res, UseGuards } from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { UserDto } from './users/dto/user.dto';
import { UserDocument } from './users/models/user.schema';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // Login functionality mainly handled by the AuthGuard & LocalStrategy
  @UseGuards(LocalAuthGuard)
  // @Serialize(UserDto)
  @Post('login')
  async login(
    @CurrentUser() user: UserDocument,
    // Get the Response object and use "passthrough" to manually send
    // back the Response
    @Res({ passthrough: true }) response: Response,
  ) {
    await this.authService.setJwtToken(user, response);

    response.send(
      // Only expose specified user's properties
      plainToClass(UserDto, user, { excludeExtraneousValues: true }),
    );
  }
}
