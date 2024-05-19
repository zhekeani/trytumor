import { Injectable } from '@nestjs/common';
import * as Bluebird from 'bluebird';
import { PatientsRepository } from './patients.repository';
import { Gender, StorageService } from '@app/common';
import { CreatePatientDto } from './utils/dto/create-patient.dto';
import { Types } from 'mongoose';
import { EventsService } from './events/events.service';

@Injectable()
export class PatientsService {
  constructor(
    private readonly patientsRepository: PatientsRepository,
    private readonly storageService: StorageService,
    private readonly eventService: EventsService,
  ) {}

  private constructStorageBucketPath(patientId: string) {
    return `media/patients/${patientId}/profile-picture/profile-pic-${patientId}`;
  }

  private constructStorageBucketPatientDirPath(patientId: string) {
    return `media/patients/${patientId}`;
  }

  private async saveProfilePic(
    patientId: string,
    profilePicFile: Express.Multer.File,
  ) {
    const storageBucketPath = this.constructStorageBucketPath(patientId);

    return this.storageService.save(
      storageBucketPath,
      profilePicFile.mimetype,
      profilePicFile.buffer,
      [{ patientId }],
    );
  }

  private async deleteProfilePic(patientId: string) {
    return this.storageService.delete(
      this.constructStorageBucketPath(patientId),
    );
  }

  // Create new patient
  async create(
    createPatientDto: CreatePatientDto,
    profilePicFile?: Express.Multer.File,
  ) {
    const patientId = new Types.ObjectId();

    try {
      if (profilePicFile) {
        const { publicUrl } = await this.saveProfilePic(
          patientId.toHexString(),
          profilePicFile,
        );
        createPatientDto.profilePicURL = publicUrl;
      }

      const newPatient = await this.patientsRepository.create(
        createPatientDto,
        patientId,
      );

      this.eventService.emitPatientNewEvent({
        id: newPatient._id.toHexString(),
        fullName: newPatient.fullName,
        gender: newPatient.gender as Gender,
        birthDate: newPatient.birthDate,
      });

      return newPatient;
    } catch (error) {
      await this.deleteProfilePic(patientId.toHexString());
      throw error;
    }
  }

  // fetch all patients
  async fetchAll() {
    return this.patientsRepository.find({});
  }

  // fetch patient by ID
  async fetchPatientById(patientId: string) {
    return this.patientsRepository.findOne({ _id: patientId });
  }

  // Update patient
  async update(
    patientId: string,
    updatePatientDto: Partial<CreatePatientDto>,
    profilePicFile?: Express.Multer.File,
  ) {
    const updatedPatient = await this.patientsRepository.findOneAndUpdate(
      { _id: patientId },
      { $set: { ...updatePatientDto } },
    );

    if (updatedPatient && profilePicFile) {
      await this.saveProfilePic(patientId, profilePicFile);
    }

    this.eventService.emitPatientUpdateEvent({
      id: patientId,
      fullName: updatedPatient.fullName,
      gender: updatedPatient.gender as Gender,
      birthDate: updatedPatient.birthDate,
    });

    return updatedPatient;
  }

  // Delete patient
  async delete(patientId: string) {
    try {
      const results = await Bluebird.Promise.all([
        this.storageService.deleteFilesByDirName(
          this.constructStorageBucketPatientDirPath(patientId),
        ),
        this.patientsRepository.findOneAndDelete({ _id: patientId }),
      ]);

      this.eventService.emitPatientDeleteEvent({
        id: patientId,
      });

      return results[1];
    } catch (error) {
      throw error;
    }
  }
}
