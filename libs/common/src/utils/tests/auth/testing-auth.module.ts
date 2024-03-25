import { DynamicModule, Module } from '@nestjs/common';
import { TestingAuthModuleConfig } from './interfaces';
import { TestingAuthController } from './testing-auth.controller';
import { TestingAuthService } from './testing-auth.service';
import { JwtModule } from '@nestjs/jwt';
import { TestingJwtStrategy } from './strategies';
import { ConfigModule } from '@nestjs/config';

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
      imports: [
        JwtModule.register({}),
        ConfigModule.forRoot({ isGlobal: true }),
      ],
      providers: [
        TestingAuthService,
        {
          provide: 'CONFIG',
          useFactory: async (...args: any[]) => {
            const config = await options.useFactory(...args);
            return config;
          },
        },
      ],
      controllers: [TestingAuthController],
    };
  }
}
