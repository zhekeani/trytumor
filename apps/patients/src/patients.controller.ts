import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
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
import { CreatePatientDto } from './dto/create-patient.dto';

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

  @Get()
  async getPatients() {
    return this.patientsService.fetchPatients();
  }

  @Get(':id')
  async getPatientById(@Param('id') patientId: string) {
    return this.patientsService.fetchPatientById(patientId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('create')
  @UseInterceptors(FileInterceptor('file'))
  async createPatient(
    @Body() createPatientDto: CreatePatientDto,
    @UploadedFile() profilePictureFile: Express.Multer.File,
  ) {
    console.log(
      'This line from patients controller is called',
      profilePictureFile,
    );

    return this.patientsService.create(createPatientDto, profilePictureFile);
  }

  @Patch('update/:id')
  @UseInterceptors(FileInterceptor('file'))
  async updatePatient(
    @Body() updatePatientDto: Partial<CreatePatientDto>,
    @Param('id') patientId: string,
    @UploadedFile() profilePictureFile: Express.Multer.File,
  ) {
    return this.patientsService.update(
      patientId,
      updatePatientDto,
      profilePictureFile,
    );
  }

  // JUST FOR DEVELOPMENT
  // DON'T USE IT IN PRODUCTION
  @Delete('delete/all')
  async deleteAll() {
    return this.patientsService.deleteAll();
  }

  @Delete('delete/:id')
  async deletePatient(@Param('id') patientId: string) {
    return this.patientsService.delete(patientId);
  }
}
