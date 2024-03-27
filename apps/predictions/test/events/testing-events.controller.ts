import { PatientNewToPredictionsDto } from '@app/common';
import { Body, Controller, Post } from '@nestjs/common';
import { EventsService } from '../../src/events/events.service';

@Controller('testing/events')
export class TestingEventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post('/new')
  async testingListenToPatientNewEvent(
    @Body() patientNewDto: PatientNewToPredictionsDto,
  ) {
    return this.eventsService.handlePatientNewEvent(patientNewDto);
  }
}
