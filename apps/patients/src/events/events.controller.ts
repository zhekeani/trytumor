import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import {
  PredictionDeleteEventDto,
  PredictionEditEventDto,
  PredictionNewEventDto,
  PredictionsEvents,
} from '@app/common';

@Controller('events')
export class EventsController {
  // Listen to "prediction-new" event
  @EventPattern(PredictionsEvents.PredictionsNew)
  async listenToPredictionNewEvent(
    @Payload() predictionEventDto: PredictionNewEventDto,
  ) {
    console.log(
      'Accepted data in patients prediction-new listener ',
      predictionEventDto,
    );
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
  }
}
