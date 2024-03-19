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
      'Accepted data in Patients prediction-new listener ',
      predictionEventDto,
    );

    await this.eventsService.handlePredictionNewEvent(predictionEventDto);

    console.log('Success handling prediction-new event in Patients');
  }

  // Listen to "prediction-edit" event
  @EventPattern(PredictionsEvents.PredictionsEdit)
  async listenToPredictionEditEvent(
    @Payload() predictionEventDto: PredictionEditEventDto,
  ) {
    console.log(
      'Accepted data in Patients prediction-edit listener ',
      predictionEventDto,
    );

    await this.eventsService.handlePredictionEditEvent(predictionEventDto);

    console.log('Success handling prediction-edit event in Patients');
  }

  // Listen to "prediction-delete" event
  @EventPattern(PredictionsEvents.PredictionsDelete)
  async listenToPredictionDeleteEvent(
    @Payload() predictionEventDto: PredictionDeleteEventDto,
  ) {
    console.log(
      'Accepted data in Patients prediction-delete listener ',
      predictionEventDto,
    );

    this.eventsService.handlePredictionDeleteEvent(predictionEventDto);
    console.log('Success handling prediction-delete event in Patients');
  }
}
