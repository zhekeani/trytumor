import { Controller } from '@nestjs/common';
import { EventsService } from './events.service';
import { EventPattern, Payload } from '@nestjs/microservices';
import { PatientDeleteDto, PatientsEvents } from '@app/common';

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
}
