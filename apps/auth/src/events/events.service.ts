import { Inject, Injectable } from '@nestjs/common';
import { PatientDeleteDto, Services } from '@app/common';
import { ClientProxy } from '@nestjs/microservices';
import { UsersRepository } from '../users/users.repository';

@Injectable()
export class EventsService {
  constructor(
    @Inject(Services.Predictions)
    private readonly predictionsClient: ClientProxy,
    private readonly usersRepository: UsersRepository,
  ) {}

  async handlePatientDeleteEvent(patientDeleteDto: PatientDeleteDto) {
    try {
      const result = await this.usersRepository.updateMany(
        {
          'predictions.patientId': patientDeleteDto.id,
        },
        { $pull: { predictions: { patientId: patientDeleteDto.id } } },
      );

      console.log('Documents updated:', result.modifiedCount);
    } catch (error) {
      console.error('Error:', error);
    }
  }
}
