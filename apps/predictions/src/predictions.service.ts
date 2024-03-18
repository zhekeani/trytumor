import { StorageService, TokenPayloadProperties } from '@app/common';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Types } from 'mongoose';
import { CreatePredictionDto } from './dto/create-prediction.dto';
import { PredictionData, PredictionDocument } from './models/prediction.schema';
import { PredictionsRepository } from './repositories/predictions.repository';
import { UtilsService } from './utils/utils.service';

@Injectable()
export class PredictionsService {
  constructor(
    private readonly predictionsRepository: PredictionsRepository,
    private readonly configService: ConfigService,
    private readonly storageService: StorageService,
    private readonly utilsService: UtilsService,
  ) {}

  async fetchPredictions() {
    return this.predictionsRepository.find({});
  }

  async create(
    tokenPayload: TokenPayloadProperties,
    authToken: string,
    imageFiles: Express.Multer.File[],
    createPredictionDto: CreatePredictionDto,
  ) {
    // Check if the patient exist
    await this.predictionsRepository.findOne({
      'patientData.id': createPredictionDto.patientId,
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
    );

    return this.save(
      imageFiles,
      predictionData,
      createPredictionDto.patientId,
      predictionDataId.toHexString(),
    );
  }

  private async save(
    imageFiles: Express.Multer.File[],
    predictionData: PredictionData,
    patientId: string,
    predictionDataId: string,
  ) {
    // Create the predictionId manually (used for cloud storage path)

    const imagesUrlAndIndex = await Promise.all(
      imageFiles.map(async (imageFile, imageIndex) => {
        // Construct the cloud storage path
        const path = this.utilsService.constructPath(
          patientId,
          predictionDataId,
          imageIndex,
        );

        // Upload the file
        const { publicUrl } = await this.storageService.save(
          path,
          imageFile.mimetype,
          imageFile.buffer,
          [
            { patientId: patientId },
            { predictionId: predictionDataId },
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
          predictionsData: { ...predictionData, _id: predictionDataId },
        },
      },
    );
  }

  async delete(_id: string) {
    return this.predictionsRepository.findOneAndDelete({ _id });
  }
}
