import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import {
  PredictionDeleteEventDto,
  PredictionEditEventDto,
  PredictionNewEventDto,
  PredictionsEvents,
} from '@app/common';
import { EventsService } from './events.service';

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  // Listen to "prediction-new" event
  @EventPattern(PredictionsEvents.PredictionsNew)
  async listenToPredictionNewEvent(
    @Payload() predictionEventDto: PredictionNewEventDto,
  ) {
    console.log(
      'Accepted data in patients prediction-new listener ',
      predictionEventDto,
    );

    await this.eventsService.handlePredictionNewEvent(predictionEventDto);

    console.log('Success handling prediction-new event');
  }

  // Listen to "prediction-edit" event
  @EventPattern(PredictionsEvents.PredictionsEdit)
  async listenToPredictionEditEvent(
    @Payload() predictionEventDto: PredictionEditEventDto,
  ) {
    console.log(
      'Accepted data in patients prediction-edit listener ',
      predictionEventDto,
    );

    await this.eventsService.handlePredictionEditEvent(predictionEventDto);

    console.log('Success handling prediction-edit event');
  }

  // Listen to "prediction-delete" event
  @EventPattern(PredictionsEvents.PredictionsDelete)
  async listenToPredictionDeleteEvent(
    @Payload() predictionEventDto: PredictionDeleteEventDto,
  ) {
    console.log(
      'Accepted data in patients prediction-delete listener ',
      predictionEventDto,
    );

    this.eventsService.handlePredictionDeleteEvent(predictionEventDto);
    console.log('Success handling prediction-delete event');
  }
}
