import { Inject, Injectable } from '@nestjs/common';
import {
  DoctorEditEventDto,
  DoctorsEvents,
  PatientDeleteDto,
  PredictionDeleteEventDto,
  PredictionEditEventDto,
  PredictionNewEventDto,
  PredictionsThumbnail,
  Services,
} from '@app/common';
import { ClientProxy } from '@nestjs/microservices';
import { UsersRepository } from '../users/users.repository';
import { Types } from 'mongoose';

@Injectable()
export class EventsService {
  constructor(
    @Inject(Services.Predictions)
    private readonly predictionsClient: ClientProxy,
    private readonly usersRepository: UsersRepository,
  ) {}

  async emitDoctorEditEvent(doctorEventDto: DoctorEditEventDto) {
    this.predictionsClient.emit(DoctorsEvents.DoctorEdit, {
      ...doctorEventDto,
    });
  }

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

  async handlePredictionNewEvent(predictionEventDto: PredictionNewEventDto) {
    const { patientId, userId, predictionThumbnail } = predictionEventDto;

    const predictionToSave: PredictionsThumbnail = {
      patientId,
      userId,
      thumbnail: predictionThumbnail,
    };

    return this.usersRepository.findOneAndUpdate(
      { _id: userId },
      {
        $push: { predictions: { ...predictionToSave } },
      },
    );
  }

  async handlePredictionEditEvent(predictionEventDto: PredictionEditEventDto) {
    const { patientId, userId, predictionThumbnail } = predictionEventDto;

    return this.usersRepository.findOneAndUpdate(
      { 'predictions.thumbnail.id': predictionThumbnail.id },
      {
        $set: {
          'predictions.$.thumbnail.fileName': predictionThumbnail.fileName,
        },
      },
    );
  }

  async handlePredictionDeleteEvent(
    predictionEventDto: PredictionDeleteEventDto,
  ) {
    const { patientId, userId, predictionId } = predictionEventDto;

    return this.usersRepository.findOneAndUpdate(
      { 'predictions.thumbnail.id': predictionId },
      {
        $pull: {
          predictions: { 'thumbnail.id': new Types.ObjectId(predictionId) },
        },
      },
    );
  }
}
