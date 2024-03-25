import { DynamicModule, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TestingAuthModuleConfig } from './interfaces';
import { TestingAuthController } from './testing-auth.controller';
import { TestingAuthService } from './testing-auth.service';
import { ConfigService } from '@nestjs/config';

@Module({})
export class TestingAuthModule {
  static forRootAsync(options: {
    useFactory: (
      ...args: any[]
    ) => Promise<TestingAuthModuleConfig> | TestingAuthModuleConfig;
    inject?: any[];
  }): DynamicModule {
    return {
      module: TestingAuthModule,
      imports: [JwtModule.register({})],
      providers: [
        TestingAuthService,
        {
          provide: 'CONFIG',
          useFactory: async (...args: any[]) => {
            const config = await options.useFactory(...args);
            return config;
          },
          inject: options.inject || [ConfigService],
        },
      ],
      controllers: [TestingAuthController],
    };
  }
}
