import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { ValidateObjectId } from '@app/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CreateDoctorDto } from './dto/create-doctor.dto';
import { UpdateDoctorDto } from './dto/update-doctor.dto';
import { DoctorsService } from './doctors.service';

@Controller('doctors')
export class DoctorsController {
  constructor(private readonly doctorsService: DoctorsService) {}

  // Fetch all doctors
  @Get()
  async getDoctors() {
    return this.doctorsService.fetchAll();
  }

  // Fetch doctor by ID
  @Get(':id')
  async getDoctorById(@Param('id', ValidateObjectId) id: string) {
    return this.doctorsService.fetchDoctorById(id);
  }

  // Create doctor
  @Post('create')
  @UseInterceptors(FileInterceptor('file'))
  async createDoctor(
    @Body() createDoctorDto: CreateDoctorDto,
    @UploadedFile() profilePicFile?: Express.Multer.File,
  ) {
    return this.doctorsService.create(createDoctorDto, profilePicFile);
  }

  // Update doctor
  @Patch('update/:id')
  @UseInterceptors(FileInterceptor('file'))
  async updateDoctor(
    @Param('id', ValidateObjectId) id: string,
    @Body() updateDoctorDto: UpdateDoctorDto,
    @UploadedFile() profilePicFile?: Express.Multer.File,
  ) {
    return this.doctorsService.update(id, updateDoctorDto, profilePicFile);
  }

  // Delete doctor
  @Delete('delete/:id')
  async deleteDoctor(@Param('id', ValidateObjectId) id: string) {
    return this.doctorsService.delete(id);
  }
}
