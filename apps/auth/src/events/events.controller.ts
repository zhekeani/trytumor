import { Controller } from '@nestjs/common';
import { EventsService } from './events.service';
import { EventPattern, Payload } from '@nestjs/microservices';
import {
  PatientDeleteDto,
  PatientsEvents,
  PredictionDeleteEventDto,
  PredictionEditEventDto,
  PredictionNewEventDto,
  PredictionsEvents,
} from '@app/common';

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  // Listen to patient-delete event
  @EventPattern(PatientsEvents.PatientDelete)
  async listenToPatientDeleteEvent(
    @Payload() patientDeleteDto: PatientDeleteDto,
  ) {
    console.log(
      'Accepted data in predictions patient-delete listener',
      patientDeleteDto,
    );
    this.eventsService.handlePatientDeleteEvent(patientDeleteDto);
  }

  // Listen to "prediction-new" event
  @EventPattern(PredictionsEvents.PredictionsNew)
  async listenToPredictionNewEvent(
    @Payload() predictionEventDto: PredictionNewEventDto,
  ) {
    console.log(
      'Accepted data in Doctors prediction-new listener ',
      predictionEventDto,
    );

    await this.eventsService.handlePredictionNewEvent(predictionEventDto);

    console.log('Success handling prediction-new event Doctors');
  }

  // Listen to "prediction-edit" event
  @EventPattern(PredictionsEvents.PredictionsEdit)
  async listenToPredictionEditEvent(
    @Payload() predictionEventDto: PredictionEditEventDto,
  ) {
    console.log(
      'Accepted data in Doctors prediction-edit listener ',
      predictionEventDto,
    );

    await this.eventsService.handlePredictionEditEvent(predictionEventDto);

    console.log('Success handling prediction-edit event in Doctors');
  }

  // Listen to "prediction-delete" event
  @EventPattern(PredictionsEvents.PredictionsDelete)
  async listenToPredictionDeleteEvent(
    @Payload() predictionEventDto: PredictionDeleteEventDto,
  ) {
    console.log(
      'Accepted data in Doctors prediction-delete listener ',
      predictionEventDto,
    );

    this.eventsService.handlePredictionDeleteEvent(predictionEventDto);
    console.log('Success handling prediction-delete event in Doctors');
  }
}
