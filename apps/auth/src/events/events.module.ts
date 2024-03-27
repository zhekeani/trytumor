import { Module } from '@nestjs/common';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { DatabaseModule, Services } from '@app/common';
import { ConfigService } from '@nestjs/config';
import { UsersRepository } from '../users/users.repository';
import { UserDocument, UserSchema } from '../users/models/user.schema';

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: Services.Predictions,
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: configService.get('PREDICTIONS_HOST'),
            port: configService.get('PREDICTIONS_PORT'),
          },
        }),
      },
    ]),
    DatabaseModule,
    DatabaseModule.forFeature([
      { name: UserDocument.name, schema: UserSchema },
    ]),
  ],
  controllers: [EventsController],
  providers: [EventsService, UsersRepository],
  exports: [EventsService],
})
export class EventsModule {}
