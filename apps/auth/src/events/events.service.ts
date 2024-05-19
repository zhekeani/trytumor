import {
  DoctorsEvents,
  DoctorUpdateEventDto,
  PatientDeleteEventDto,
  PredictionDeleteEventDto,
  PredictionNewEventDto,
  PredictionsThumbnail,
  PredictionUpdateEventDto,
  Services,
} from '@app/common';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Types } from 'mongoose';
import { DoctorsRepository } from '../doctors/doctors.repository';

@Injectable()
export class EventsService {
  private logger = new Logger(EventsService.name);

  constructor(
    @Inject(Services.Predictions)
    private readonly predictionsClient: ClientProxy,
    private readonly doctorsRepository: DoctorsRepository,
  ) {}

  // Emit doctor-update event
  async emitDoctorUpdateEvent(doctorUpdateEventDto: DoctorUpdateEventDto) {
    this.predictionsClient.emit(
      DoctorsEvents.DoctorUpdate,
      doctorUpdateEventDto,
    );
  }

  // Handle patient-delete event
  async handlePatientDeleteEvent(patientDeleteEventDto: PatientDeleteEventDto) {
    try {
      const result = await this.doctorsRepository.updateMany(
        {
          'predictions.patientId': patientDeleteEventDto.id,
        },
        { $pull: { predictions: { patientId: patientDeleteEventDto.id } } },
      );

      this.logger.log(`Updated documents count: ${result.modifiedCount}`);
    } catch (error) {
      this.logger.warn(`Error while handling patient-delete event, ${error}`);
    }
  }

  // Handle prediction-new event
  async handlePredictionNewEvent(predictionNewEventDto: PredictionNewEventDto) {
    const { patientId, doctorId, predictionThumbnail } = predictionNewEventDto;

    const predictionToSave: PredictionsThumbnail = {
      patientId,
      doctorId,
      thumbnail: predictionThumbnail,
    };

    return this.doctorsRepository.findOneAndUpdate(
      { _id: doctorId },
      {
        $push: { predictions: { ...predictionToSave } },
      },
    );
  }

  // Handle prediction-update event
  async handlePredictionUpdateEvent(
    predictionUpdateEventDto: PredictionUpdateEventDto,
  ) {
    const { patientId, doctorId, predictionThumbnail } =
      predictionUpdateEventDto;

    return this.doctorsRepository.findOneAndUpdate(
      { 'predictions.thumbnail.id': predictionThumbnail.id },
      {
        $set: {
          'predictions.$.thumbnail.fileName': predictionThumbnail.fileName,
        },
      },
    );
  }

  // Handle prediction-delete event
  async handlePredictionDeleteEvent(
    predictionDeleteEventDto: PredictionDeleteEventDto,
  ) {
    const { patientId, doctorId, predictionId } = predictionDeleteEventDto;

    return this.doctorsRepository.findOneAndUpdate(
      { 'predictions.thumbnail.id': predictionId },
      {
        $pull: {
          predictions: { 'thumbnail.id': new Types.ObjectId(predictionId) },
        },
      },
    );
  }
}
