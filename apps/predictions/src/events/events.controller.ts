import { Controller } from '@nestjs/common';
import { EventsService } from './events.service';
import { EventPattern, Payload } from '@nestjs/microservices';
import { PatientNewToPredictionsDto, PatientsEvents } from '@app/common';

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  // Routes to listen to events

  // Listen to "patient-new" event
  @EventPattern(PatientsEvents.PatientNew)
  async newPatient(@Payload() data: PatientNewToPredictionsDto) {
    console.log('Accepted data in predictions events route: ', data);

    this.eventsService.handlePatientNewEvent(data);
  }

  // Listen to "patient-edit" event

  // Listen to "patient-delete" event

  // Listen to "doctor-edit" event
}
