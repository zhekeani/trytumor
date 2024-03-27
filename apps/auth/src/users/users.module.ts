import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import {
  DatabaseModule,
  StorageModule,
  StorageModuleConfig,
} from '@app/common';
import { UserDocument, UserSchema } from './models/user.schema';
import { UsersRepository } from './users.repository';
import { ConfigService } from '@nestjs/config';
import { EventsModule } from '../events/events.module';

@Module({
  imports: [
    // DatabaseModule used for establish connection to database
    DatabaseModule,
    // forFeature used so Mongoose model can be injected using
    // DI system
    DatabaseModule.forFeature([
      // Name used as identifier to inject the model
      { name: UserDocument.name, schema: UserSchema },
    ]),
    StorageModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const storageConfig: Partial<StorageModuleConfig> = {
          projectId: configService.get('GOOGLE_STORAGE_PROJECT_ID'),
          clientEmail: configService.get('GOOGLE_STORAGE_CLIENT_EMAIL'),
          privateKey: configService.get('GOOGLE_STORAGE_PRIVATE_KEY'),
        };

        switch (configService.get('NODE_ENV')) {
          case 'development':
            storageConfig.bucketName = configService.get(
              'GOOGLE_STORAGE_BUCKET_NAME',
            );
            break;
          case 'test':
            storageConfig.bucketName = configService.get(
              'GOOGLE_STORAGE_TESTING_BUCKET_NAME',
            );
            break;
        }

        return storageConfig as StorageModuleConfig;
      },
    }),
    EventsModule,
  ],
  controllers: [UsersController],
  providers: [UsersService, UsersRepository],
  // Used in local & jwt strategy
  exports: [UsersService],
})
export class UsersModule {}
