import { StorageService, TokenPayloadProperties } from '@app/common';
import { Injectable } from '@nestjs/common';
import { Types } from 'mongoose';
import { CreatePredictionDto } from './dto/create-prediction.dto';
import { EditPredictionDto } from './dto/edit-prediction.dto';
import { EventsService } from './events/events.service';
import { PredictionData } from './models/prediction.schema';
import { PredictionsRepository } from './repositories/predictions.repository';
import { UtilsService } from './utils/utils.service';

@Injectable()
export class PredictionsService {
  constructor(
    private readonly predictionsRepository: PredictionsRepository,
    private readonly storageService: StorageService,
    private readonly utilsService: UtilsService,
    private readonly eventsService: EventsService,
  ) {}

  async create(
    tokenPayload: TokenPayloadProperties,
    authToken: string,
    imageFiles: Express.Multer.File[],
    createPredictionDto: CreatePredictionDto,
    patientId: string,
  ) {
    // Check if the patient exist
    await this.predictionsRepository.findOne({
      'patientData.id': patientId,
    });

    // Send all of the predictions simultaneously
    // not one by one blocking each other
    const promises = imageFiles.map(async (imageFile, index) => {
      return this.utilsService.sendPrediction(imageFile, index, authToken);
    });

    const predictionResult = await Promise.all(promises);

    // Manually create the predictionData id
    const predictionDataId = new Types.ObjectId();

    // Construct the predictionsData
    const predictionData = await this.utilsService.constructPredictionData(
      tokenPayload,
      createPredictionDto,
      predictionResult,
      predictionDataId.toHexString(),
      patientId,
    );

    const savedPrediction = await this.save(
      imageFiles,
      predictionData,
      patientId,
    );

    // Emit prediction creation event
    this.eventsService.emitPredictionNewEvent({
      patientId: savedPrediction.patientData.id,
      userId: savedPrediction.predictionsData[0].userId,
      predictionThumbnail: {
        id: savedPrediction.predictionsData[0].id,
        fileName: savedPrediction.predictionsData[0].fileName,
        dataAndTime: savedPrediction.predictionsData[0].dateAndTime,
        number: savedPrediction.predictionsData[0].number,
        imageUrl: savedPrediction.predictionsData[0].results[0].imageUrl,
      },
    });

    return savedPrediction;
  }

  private async save(
    imageFiles: Express.Multer.File[],
    predictionData: PredictionData,
    patientId: string,
  ) {
    // Create the predictionId manually (used for cloud storage path)

    const imagesUrlAndIndex = await Promise.all(
      imageFiles.map(async (imageFile, imageIndex) => {
        // Construct the cloud storage path
        const path = this.utilsService.constructPath(
          patientId,
          predictionData.id,
          imageIndex,
        );

        // Upload the file
        const { publicUrl } = await this.storageService.save(
          path,
          imageFile.mimetype,
          imageFile.buffer,
          [
            { patientId: patientId },
            { predictionId: predictionData.id },
            { imageIndex: imageIndex.toString() },
          ],
        );

        return { publicUrl, imageIndex };
      }),
    );

    // Set the public url
    imagesUrlAndIndex.forEach((urlAndIndex) => {
      const { publicUrl, imageIndex } = urlAndIndex;
      predictionData.results[imageIndex].imageUrl = publicUrl;
    });

    // save to database
    return this.predictionsRepository.findOneAndUpdate(
      { 'patientData.id': new Types.ObjectId(patientId) },
      {
        $push: {
          predictionsData: { ...predictionData },
        },
      },
      {
        projection: {
          predictionsData: { $slice: -1 },
          patientData: 1,
        },
      },
    );
  }

  // Fetch all predictions
  async fetchAll() {
    return this.predictionsRepository.find({});
  }

  // Fetch by patient ID
  async fetchByPatientId(patientId: string) {
    return this.predictionsRepository.findOne({ 'patientData.id': patientId });
  }

  // Fetch by prediction ID
  async fetchByPredictionId(predictionId: string) {
    return this.predictionsRepository.findOne(
      { 'predictionsData.id': predictionId },
      {
        predictionsData: { $slice: -1 },
        patientData: 1,
      },
    );
  }

  // Update one of the prediction
  async update(predictionId: string, editPredictionDto: EditPredictionDto) {
    await this.predictionsRepository.findOneAndUpdate(
      { 'predictionsData.id': predictionId },
      {
        $set: {
          'predictionsData.$.fileName': editPredictionDto.fileName,
          'predictionsData.$.additionalNotes':
            editPredictionDto.additionalNotes,
        },
      },
    );

    const updatedPrediction = await this.fetchByPredictionId(predictionId);

    // Emit prediction update event
    this.eventsService.emitPredictionEditEvent({
      patientId: updatedPrediction.patientData.id,
      userId: updatedPrediction.predictionsData[0].userId,
      predictionThumbnail: {
        id: updatedPrediction.predictionsData[0].id,
        fileName: updatedPrediction.predictionsData[0].fileName,
      },
    });

    return updatedPrediction;
  }

  // Delete one of the prediction
  async delete(predictionId: string) {
    // Ensure prediction to delete exist and get the patient id of it
    const predictionToDelete = await this.fetchByPredictionId(predictionId);

    const imagesPath = predictionToDelete.predictionsData[0].results.map(
      (result) => {
        return this.utilsService.constructPath(
          predictionToDelete.patientData.id,
          predictionId,
          result.imageIndex,
        );
      },
    );

    await Promise.all(
      imagesPath.map(async (imagePath) => {
        await this.storageService.delete(imagePath);
      }),
    );

    const updatedPredictions =
      await this.predictionsRepository.findOneAndUpdate(
        { 'predictionsData.id': predictionId },
        {
          $pull: {
            predictionsData: { id: new Types.ObjectId(predictionId) },
          },
        },
      );

    // Emit prediction deletion event
    this.eventsService.emitPredictionDeleteEvent({
      patientId: predictionToDelete.patientData.id,
      userId: predictionToDelete.predictionsData[0].userId,
      predictionId: predictionToDelete.predictionsData[0].id,
    });

    return updatedPredictions;
  }

  // Delete the whole prediction document
  // TEMPORARY DON'T INCLUDE IT IN PRODUCTION!!!!
  async deletePredictionDocument(documentId: string) {
    return this.predictionsRepository.findOneAndDelete({ _id: documentId });
  }

  // JUST FOR DEVELOPMENT
  // DON'T USE IT IN PRODUCTION
  async deleteAll() {
    await this.storageService.deleteFilesByDirectoryName(
      this.utilsService.constructPatientDirPath(),
    );

    return this.predictionsRepository.deleteMany({});
  }
}
