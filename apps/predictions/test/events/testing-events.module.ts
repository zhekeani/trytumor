import { Module } from '@nestjs/common';
import { EventsModule } from '../../src/events/events.module';
import { TestingEventsController } from './testing-events.controller';

@Module({
  imports: [EventsModule],
  controllers: [TestingEventsController],
})
export class TestingEventsModule {}
