import { Controller, Logger } from '@nestjs/common';
import { EventsService } from './events.service';
import {
  DoctorsEvents,
  DoctorUpdateEventDto,
  PatientDeleteEventDto,
  PatientNewEventDto,
  PatientsEvents,
  PredictionDocument,
} from '@app/common';
import { EventPattern, Payload } from '@nestjs/microservices';

@Controller('events')
export class EventsController {
  private logger = new Logger(EventsController.name);

  constructor(private readonly eventsService: EventsService) {}

  private async listenToEvent(
    eventType: PatientsEvents | DoctorsEvents,
    eventDto:
      | PatientNewEventDto
      | Partial<PatientNewEventDto>
      | PatientDeleteEventDto,
    eventHandlerFn: (
      eventDto:
        | PatientNewEventDto
        | Partial<PatientNewEventDto>
        | PatientDeleteEventDto,
    ) => Promise<PredictionDocument>,
  ) {
    this.logger.log(
      `Received ${eventType} payload in Predictions micro-service ${JSON.stringify(eventDto)}`,
    );
    try {
      await eventHandlerFn(eventDto);
      this.logger.log(
        `Successfully handled the ${eventType} event in the Predictions micro-service.`,
      );
    } catch (error) {
      console.error(error);
      this.logger.error('Error', error);
    }
  }

  // Listen to patient-new event
  @EventPattern(PatientsEvents.PatientNew)
  async listenToPatientNewEvent(
    @Payload() patientNewEventDto: PatientNewEventDto,
  ) {
    this.listenToEvent(PatientsEvents.PatientNew, patientNewEventDto, () =>
      this.eventsService.handlePatientNewEvent(patientNewEventDto),
    );
  }

  // Listen to patient-update
  @EventPattern(PatientsEvents.PatientUpdate)
  async listenToPatientUpdateEvent(
    @Payload() patientUpdateEventDto: Partial<PatientNewEventDto>,
  ) {
    this.listenToEvent(
      PatientsEvents.PatientUpdate,
      patientUpdateEventDto,
      () => this.eventsService.handlePatientUpdateEvent(patientUpdateEventDto),
    );
  }

  // Listen to patient-delete
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

  // Listen to doctor-update event
  @EventPattern(DoctorsEvents.DoctorUpdate)
  async listenToDoctorUpdateEvent(
    @Payload() doctorUpdateEventDto: DoctorUpdateEventDto,
  ) {
    this.eventsService.handleDoctorUpdateEvent(doctorUpdateEventDto);
  }
}
