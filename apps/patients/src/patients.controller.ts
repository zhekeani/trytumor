import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { PatientsService } from './patients.service';
import { JwtAuthGuard } from '@app/common';
import { Request } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('patients')
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @UseGuards(JwtAuthGuard)
  @Get('authenticate')
  async authenticate(@Req() request: Request) {
    console.log('This is from patients controller', request);

    return {
      message: "You're authenticated",
    };
  }

  @Post('save')
  @UseInterceptors(FileInterceptor('file'))
  async uploadProfilePicture(
    @Body('mediaId') mediaId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    console.log('This line from patients controller is called');

    try {
      await this.patientsService.saveProfilePicture(
        'media/' + mediaId,
        file.mimetype,
        file.buffer,
        [{ mediaId: 'test-image' }],
      );
      return { success: true, message: 'Upload Success' };
    } catch (error) {
      console.error('Error while uploading:', error);
      return { success: false, message: 'Upload Failed' };
    }
  }
}
