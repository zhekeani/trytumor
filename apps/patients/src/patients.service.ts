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

  private async saveProfilePicture(
    patientId: string,
    profilePictureFile: Express.Multer.File,
  ) {
    const filePath = `media/${patientId}/profile-picture/profile-pic-${patientId}`;

    return this.storageService.save(
      filePath,
      profilePictureFile.mimetype,
      profilePictureFile.buffer,
      [{ patientId }],
    );
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
    // Check if the profile picture get updated
    if (profilePictureFile) {
      // Doesn't need the return value, the profile picture
      // url stay the same
      await this.saveProfilePicture(patientId, profilePictureFile);
    }

    // Update the patient
    return this.patientsRepository.findOneAndUpdate(
      { _id: patientId },
      { $set: { ...updatePatientDto } },
    );
  }
}
