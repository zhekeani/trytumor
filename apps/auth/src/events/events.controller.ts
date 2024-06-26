import { Controller, Logger } from '@nestjs/common';
import { EventsService } from './events.service';
import {
  DoctorDocument,
  PatientDeleteEventDto,
  PatientsEvents,
  PredictionDeleteEventDto,
  PredictionNewEventDto,
  PredictionsEvents,
  PredictionUpdateEventDto,
} from '@app/common';
import { EventPattern, Payload } from '@nestjs/microservices';

@Controller('events')
export class EventsController {
  private logger = new Logger(EventsController.name);

  constructor(private readonly eventsService: EventsService) {}

  private async listenToEvent(
    eventType: PredictionsEvents | PatientsEvents,
    eventDto:
      | PredictionNewEventDto
      | PredictionUpdateEventDto
      | PredictionDeleteEventDto
      | PatientDeleteEventDto,
    eventHandlerFn: (
      eventDto:
        | PredictionNewEventDto
        | PredictionUpdateEventDto
        | PredictionDeleteEventDto
        | PatientDeleteEventDto,
    ) => Promise<DoctorDocument | void>,
  ) {
    this.logger.log(
      `Received ${eventType} payload in Doctors micro-service ${JSON.stringify(eventDto)}`,
    );
    try {
      await eventHandlerFn(eventDto);
      this.logger.log(
        `Successfully handled the ${eventType} event in the Doctors micro-service.`,
      );
    } catch (error) {
      console.error(error);
      this.logger.error('Error', error);
    }
  }

  // Listen to patient-delete event
  @EventPattern(PatientsEvents.PatientDelete)
  async listenToPatientDeleteEvent(
    @Payload() patientDeleteEventDto: PatientDeleteEventDto,
  ) {
    this.listenToEvent(
      PatientsEvents.PatientDelete,
      patientDeleteEventDto,
      () => this.eventsService.handlePatientDeleteEvent(patientDeleteEventDto),
    );
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
