import { Injectable } from '@nestjs/common';
import { PatientsRepository } from './patients.repository';
import { CreatePatientDto } from './dto/create-patient.dto';
import { StorageService } from '@app/common';
import { Types } from 'mongoose';

@Injectable()
export class PatientsService {
  constructor(
    private readonly patientsRepository: PatientsRepository,
    private readonly storageService: StorageService,
  ) {}

  private constructPath(patientId: string) {
    return `media/${patientId}/profile-picture/profile-pic-${patientId}`;
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

    return this.patientsRepository.create(createPatientDto, patientId);
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
    if (updatedPatient) {
      // Check if the profile picture get updated
      if (profilePictureFile) {
        // Doesn't need the return value, the profile picture
        // url stay the same
        await this.saveProfilePicture(patientId, profilePictureFile);
      }
    }

    return updatedPatient;
  }

  async delete(patientId: string) {
    await this.storageService.delete(this.constructPath(patientId));
    return this.patientsRepository.findOneAndDelete({ _id: patientId });
  }
}
