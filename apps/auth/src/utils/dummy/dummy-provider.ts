import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ServicesConfig } from '@app/common';

@Injectable()
export class DummyProvider {
  constructor(private readonly configService: ConfigService) {}

  async tryConfigService() {
    return this.configService.get<ServicesConfig>('secrets');
  }
}
