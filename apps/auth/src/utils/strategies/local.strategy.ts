import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { DoctorsService } from '../../doctors/doctors.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly doctorsService: DoctorsService) {
    super({ usernameField: 'doctorNameAndEmail' });
  }

  async validate(doctorNameAndEmail: string, password: string) {
    try {
      return this.doctorsService.verifyDoctor(doctorNameAndEmail, password);
    } catch (error) {
      throw new UnauthorizedException(error);
    }
  }
}
