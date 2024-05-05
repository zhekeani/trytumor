import { Controller, Get } from '@nestjs/common';
import { PatientsService } from './patients.service';

@Controller()
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Get()
  getHello(): string {
    return this.patientsService.getHello();
  }
}
