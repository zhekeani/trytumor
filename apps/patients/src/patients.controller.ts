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
import { JwtAuthGuard, ValidateObjectId } from '@app/common';
import { Request } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { CreatePatientDto } from './dto/create-patient.dto';

@Controller('patients')
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Get('health')
  async healthCheck() {
    return 'Service is healthy';
  }

  @UseGuards(JwtAuthGuard)
  @Get('authenticate')
  async authenticate(@Req() request: Request) {
    console.log('This is from patients controller', request);

    return "You're authenticated";
  }

  @Get()
  async getPatients() {
    return this.patientsService.fetchPatients();
  }

  @Get(':id')
  async getPatientById(@Param('id', ValidateObjectId) patientId: string) {
    return this.patientsService.fetchPatientById(patientId);
  }

  @Post('create')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async createPatient(
    @Body() createPatientDto: CreatePatientDto,
    @UploadedFile() profilePictureFile: Express.Multer.File,
  ) {
    return this.patientsService.create(createPatientDto, profilePictureFile);
  }

  @Patch('update/:id')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async updatePatient(
    @Body() updatePatientDto: Partial<CreatePatientDto>,
    @Param('id', ValidateObjectId) patientId: string,
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
  @UseGuards(JwtAuthGuard)
  async deletePatient(@Param('id', ValidateObjectId) patientId: string) {
    return this.patientsService.delete(patientId);
  }
}
