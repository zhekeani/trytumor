import { Controller } from '@nestjs/common';
import { EventsService } from './events.service';
import { EventPattern, Payload } from '@nestjs/microservices';
import {
  PatientDeleteDto,
  PatientNewToPredictionsDto,
  PatientsEvents,
} from '@app/common';

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  // Routes to listen to events

  // Listen to "patient-new" event
  @EventPattern(PatientsEvents.PatientNew)
  async listenToPatientNewEvent(
    @Payload() patientNewDto: PatientNewToPredictionsDto,
  ) {
    console.log('Accepted data in predictions events route: ', patientNewDto);

    this.eventsService.handlePatientNewEvent(patientNewDto);
  }

  // Listen to "patient-edit" event
  @EventPattern(PatientsEvents.PatientEdit)
  async listenToPatientEditEvent(
    @Payload() patientEditDto: Partial<PatientNewToPredictionsDto>,
  ) {
    console.log(
      'Accepted data in predictions patient-edit listener',
      patientEditDto,
    );

    this.eventsService.handlePatientEditEvent(patientEditDto);
  }

  // Listen to "patient-delete" event
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

  // Listen to "doctor-edit" event
}
