import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { DatabaseModule } from '@app/common';
import { UserDocument, UserSchema } from './models/user.schema';
import { UsersRepository } from './users.repository';

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
  ],
  controllers: [UsersController],
  providers: [UsersService, UsersRepository],
  // Used in local & jwt strategy
  exports: [UsersService],
})
export class UsersModule {}
