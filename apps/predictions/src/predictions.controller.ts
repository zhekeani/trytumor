import {
  Controller,
  Post,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { AuthToken } from './decorators/auth-token.decorator';
import { PredictionsService } from './predictions.service';

@Controller('predictions')
export class PredictionsController {
  constructor(private readonly predictionsService: PredictionsService) {}

  @Post()
  @UseInterceptors(FilesInterceptor('files'))
  async createPrediction(
    @AuthToken() authToken: string,
    @UploadedFiles() imageFiles: Express.Multer.File[],
  ) {
    // console.log(imageFiles);
    // return { message: 'dummy one' };
    return this.predictionsService.create(authToken, imageFiles);
  }
}
