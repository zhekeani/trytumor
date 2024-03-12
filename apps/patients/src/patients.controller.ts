import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { PatientsService } from './patients.service';
import { JwtAuthGuard } from '@app/common';
import { Request } from 'express';

@Controller('patients')
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @UseGuards(JwtAuthGuard)
  @Get('authenticate')
  async authenticate(@Req() request: Request) {
    console.log('This is from patients controller', request);

    return {
      message: "You're authenticated",
    };
  }
}
