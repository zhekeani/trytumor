import { Inject, Injectable } from '@nestjs/common';
import { PatientsRepository } from './patients.repository';
import { CreatePatientDto } from './dto/create-patient.dto';
import {
  PatientsEvents,
  Services,
  StorageService,
  PatientNewToPredictionsDto,
} from '@app/common';
import { Types } from 'mongoose';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class PatientsService {
  constructor(
    private readonly patientsRepository: PatientsRepository,
    private readonly storageService: StorageService,
    @Inject(Services.Doctors) private readonly doctorsClient: ClientProxy,
    @Inject(Services.Predictions)
    private readonly predictionsClient: ClientProxy,
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

    const newPatient = await this.patientsRepository.create(
      createPatientDto,
      patientId,
    );

    // emit patient creation event to Predictions Service
    this.predictionsClient.emit(PatientsEvents.PatientNew, {
      id: newPatient._id,
      fullName: newPatient.fullName,
      gender: newPatient.gender,
      birthDate: newPatient.birthDate,
    } as unknown as PatientNewToPredictionsDto);

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
    if (updatedPatient) {
      // Check if the profile picture get updated
      if (profilePictureFile) {
        // Doesn't need the return value, the profile picture
        // url stay the same
        await this.saveProfilePicture(patientId, profilePictureFile);
      }
    }

    // emit patient update event to Predictions Service
    this.predictionsClient.emit(PatientsEvents.PatientEdit, {
      id: patientId,
      fullName: updatedPatient.fullName,
      gender: updatedPatient.gender,
      birthDate: updatedPatient.birthDate,
    } as unknown as Partial<PatientNewToPredictionsDto>);

    return updatedPatient;
  }

  async delete(patientId: string) {
    await this.storageService.delete(this.constructPath(patientId));
    return this.patientsRepository.findOneAndDelete({ _id: patientId });
  }
}
