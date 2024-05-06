import { JwtAuthGuard, ValidateObjectId } from '@app/common';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PatientsService } from './patients.service';
import { CreatePatientDto } from './utils/dto/create-patient.dto';

@Controller('patients')
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  // Fetch all patients
  @Get()
  async getPatients() {
    return this.patientsService.fetchAll();
  }

  // Fetch patient by ID
  @Get(':id')
  async getPatientById(@Param('id', ValidateObjectId) id: string) {
    return this.patientsService.fetchPatientById(id);
  }

  // Create patient
  @Post('create')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async createPatient(
    @Body() createPatientDto: CreatePatientDto,
    @UploadedFile() profilePicFile: Express.Multer.File,
  ) {
    return this.patientsService.create(createPatientDto, profilePicFile);
  }

  // Update patient
  @Patch('update/:id')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async updatePatient(
    @Body() updatePatientDto: Partial<CreatePatientDto>,
    @Param('id', ValidateObjectId) id: string,
    @UploadedFile() profilePicFile: Express.Multer.File,
  ) {
    return this.patientsService.update(id, updatePatientDto, profilePicFile);
  }

  // Delete patient
  @Delete('delete/:id')
  @UseGuards(JwtAuthGuard)
  async deletePatient(@Param('id', ValidateObjectId) id: string) {
    return this.patientsService.delete(id);
  }
}
