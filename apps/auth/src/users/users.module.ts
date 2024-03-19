import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { DatabaseModule, StorageModule } from '@app/common';
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
      useFactory: (configService: ConfigService) => ({
        projectId: configService.get('GOOGLE_STORAGE_PROJECT_ID'),
        clientEmail: configService.get('GOOGLE_STORAGE_CLIENT_EMAIL'),
        privateKey: configService.get('GOOGLE_STORAGE_PRIVATE_KEY'),
        bucketName: configService.get('GOOGLE_STORAGE_BUCKET_NAME'),
      }),
    }),
    EventsModule,
  ],
  controllers: [UsersController],
  providers: [UsersService, UsersRepository],
  // Used in local & jwt strategy
  exports: [UsersService],
})
export class UsersModule {}
