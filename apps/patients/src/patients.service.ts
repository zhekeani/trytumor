import { Injectable } from '@nestjs/common';
import { PatientsRepository } from './patients.repository';
import { CreatePatientDto } from './dto/create-patient.dto';

@Injectable()
export class PatientsService {
  constructor(private readonly patientsRepository: PatientsRepository) {}

  async create(createPatientDto: CreatePatientDto) {
    // No need to do validation, its okay for patient data
    // duplication

    return this.patientsRepository.create(createPatientDto);
  }
}
