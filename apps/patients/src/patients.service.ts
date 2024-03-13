import { Injectable } from '@nestjs/common';
import { PatientsRepository } from './patients.repository';
import { CreatePatientDto } from './dto/create-patient.dto';
import { StorageService } from '@app/common';

@Injectable()
export class PatientsService {
  constructor(
    private readonly patientsRepository: PatientsRepository,
    private readonly storageService: StorageService,
  ) {}

  async create(createPatientDto: CreatePatientDto) {
    // No need to do validation, its okay for patient data
    // duplication

    return this.patientsRepository.create(createPatientDto);
  }

  async saveProfilePicture(
    path: string,
    contentType: string,
    media: Buffer,
    metadata: { [key: string]: string }[],
  ): Promise<void> {
    console.log('This line of patients service is called');
    return this.storageService.save(path, contentType, media, metadata);
  }
}
