import { Body, Controller, Post } from '@nestjs/common';
import { TestingAuthService } from './testing-auth.service';
import { GenerateAccessTokenDto } from './dto';

@Controller('testing/auth')
export class TestingAuthController {
  constructor(private readonly testingAuthService: TestingAuthService) {}

  @Post()
  async generateAccessToken(
    @Body() generateAccessTokenDto: GenerateAccessTokenDto,
  ) {
    const token = await this.testingAuthService.generateAccessToken(
      generateAccessTokenDto,
    );

    return { token };
  }
}
