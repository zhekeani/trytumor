import { Controller, Logger } from '@nestjs/common';
import { EventsService } from './events.service';
import { EventPattern, Payload } from '@nestjs/microservices';
import {
  DoctorsEvents,
  PatientDocument,
  PredictionDeleteEventDto,
  PredictionNewEventDto,
  PredictionsEvents,
  PredictionUpdateEventDto,
} from '@app/common';

@Controller('events')
export class EventsController {
  private logger = new Logger(EventsController.name);

  constructor(private readonly eventsService: EventsService) {}

  private async listenToEvent(
    eventType: PredictionsEvents | DoctorsEvents,
    eventDto:
      | PredictionNewEventDto
      | PredictionUpdateEventDto
      | PredictionDeleteEventDto,
    eventHandlerFn: (
      eventDto:
        | PredictionNewEventDto
        | PredictionUpdateEventDto
        | PredictionDeleteEventDto,
    ) => Promise<PatientDocument>,
  ) {
    this.logger.log(
      `Received ${eventType} payload in Patient micro-service ${JSON.stringify(eventDto)}`,
    );
    try {
      await eventHandlerFn(eventDto);
      this.logger.log(
        `Successfully handled the ${eventType} event in the Patients micro-service.`,
      );
    } catch (error) {
      console.error(error);
      this.logger.error('Error', error);
    }
  }

  // Listen to prediction-new event
  @EventPattern(PredictionsEvents.PredictionsNew)
  async listenToPredictionNewEvent(
    @Payload() predictionNewEventDto: PredictionNewEventDto,
  ) {
    this.listenToEvent(
      PredictionsEvents.PredictionsNew,
      predictionNewEventDto,
      () => this.eventsService.handlePredictionNewEvent(predictionNewEventDto),
    );
  }

  // Listen to prediction-update event
  @EventPattern(PredictionsEvents.PredictionsUpdate)
  async listenToPredictionUpdateEvent(
    @Payload() predictionUpdateEventDto: PredictionUpdateEventDto,
  ) {
    this.listenToEvent(
      PredictionsEvents.PredictionsUpdate,
      predictionUpdateEventDto,
      () =>
        this.eventsService.handlePredictionUpdateEvent(
          predictionUpdateEventDto,
        ),
    );
  }

  // Listen to prediction-delete event
  @EventPattern(PredictionsEvents.PredictionsDelete)
  async listenToPredictionDeleteEvent(
    @Payload() predictionDeleteEventDto: PredictionDeleteEventDto,
  ) {
    this.listenToEvent(
      PredictionsEvents.PredictionsDelete,
      predictionDeleteEventDto,
      () =>
        this.eventsService.handlePredictionDeleteEvent(
          predictionDeleteEventDto,
        ),
    );
  }
}
