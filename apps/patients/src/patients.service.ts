import { Injectable } from '@nestjs/common';

@Injectable()
export class PatientsService {
  getHello(): string {
    return 'Hello World!';
  }
}
