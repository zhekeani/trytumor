import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DummyProvider } from './utils/dummy/dummy-provider';

@Injectable()
export class AuthService {
  constructor(
    private readonly configService: ConfigService,
    private readonly dummyProvider: DummyProvider,
  ) {}

  getHello(): string {
    return;
  }

  tryDummy() {
    return this.dummyProvider.tryConfigService();
  }
}
