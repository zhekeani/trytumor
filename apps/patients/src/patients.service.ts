import { StorageService } from '@app/common';
import { Injectable } from '@nestjs/common';
import { Types } from 'mongoose';
import { CreatePatientDto } from './dto/create-patient.dto';
import { EventsService } from './events/events.service';
import { Gender } from './interfaces/gender.interface';
import { PatientsRepository } from './repositories/patients.repository';

@Injectable()
export class PatientsService {
  constructor(
    private readonly patientsRepository: PatientsRepository,
    private readonly storageService: StorageService,
    private readonly eventsService: EventsService,
  ) {}

  private constructPath(patientId: string) {
    return `media/patients/${patientId}/profile-picture/profile-pic-${patientId}`;
  }

  private async saveProfilePicture(
    patientId: string,
    profilePictureFile: Express.Multer.File,
  ) {
    const filePath = this.constructPath(patientId);

    return this.storageService.save(
      filePath,
      profilePictureFile.mimetype,
      profilePictureFile.buffer,
      [{ patientId }],
    );
  }

  async fetchPatients() {
    return this.patientsRepository.find({});
  }

  async fetchPatientById(patientId: string) {
    return this.patientsRepository.findOne({ _id: patientId });
  }

  async create(
    createPatientDto: CreatePatientDto,
    profilePictureFile: Express.Multer.File,
  ) {
    // Create the patientId manually because it will be used to construct
    // file path
    const patientId = new Types.ObjectId();

    // Check if the profile picture is set
    if (profilePictureFile) {
      const { publicUrl } = await this.saveProfilePicture(
        patientId.toHexString(),
        profilePictureFile,
      );

      createPatientDto.profilePictureURL = publicUrl;
    }

    const newPatient = await this.patientsRepository.create(
      createPatientDto,
      patientId,
    );

    // emit patient creation event to Predictions Service
    this.eventsService.emitPatientNewEvent({
      id: newPatient._id.toHexString(),
      fullName: newPatient.fullName,
      gender: newPatient.gender as Gender,
      birthDate: newPatient.birthDate,
    });

    return newPatient;
  }

  async update(
    patientId: string,
    updatePatientDto: Partial<CreatePatientDto>,
    profilePictureFile: Express.Multer.File,
  ) {
    // Update the database first to make sure patient to update exist
    const updatedPatient = await this.patientsRepository.findOneAndUpdate(
      { _id: patientId },
      { $set: { ...updatePatientDto } },
    );

    // Check if the patient exist
    // Check if the profile picture get updated
    if (updatedPatient && profilePictureFile) {
      // Doesn't need the return value, the profile picture
      // url stay the same
      await this.saveProfilePicture(patientId, profilePictureFile);
    }

    // emit patient update event to Predictions Service
    this.eventsService.emitPatientEditEvent({
      id: patientId,
      fullName: updatePatientDto.fullName,
      gender: updatePatientDto.gender as Gender,
      birthDate: updatePatientDto.birthDate,
    });

    return updatedPatient;
  }

  async delete(patientId: string) {
    await this.storageService.delete(this.constructPath(patientId));

    const deletedPatient = this.patientsRepository.findOneAndDelete({
      _id: patientId,
    });

    this.eventsService.emitPatientDeleteEvent({ id: patientId });

    return deletedPatient;
  }
}
