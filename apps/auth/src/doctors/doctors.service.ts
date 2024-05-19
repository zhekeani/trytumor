import {
  Injectable,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import * as Bluebird from 'bluebird';
import { FilterQuery, Types } from 'mongoose';

import { DoctorDocument, StorageService } from '@app/common';
import { DoctorsRepository } from './doctors.repository';
import { CreateDoctorDto } from './dto/create-doctor.dto';

import { DoctorNameAndEmail } from './interfaces/doctor-name-and-email.interface';
import { UpdateDoctorDto } from './dto/update-doctor.dto';
import { EventsService } from '../events/events.service';

@Injectable()
export class DoctorsService {
  constructor(
    private readonly doctorsRepository: DoctorsRepository,
    private readonly storageService: StorageService,
    private readonly eventsService: EventsService,
  ) {}

  // Validate email and doctorName
  private async validateCreateDoctorDto(createDoctorDto: CreateDoctorDto) {
    let exceptionMessage: string[] = [];
    let userWithSameEmail: DoctorDocument;
    let userWithSamePassword: DoctorDocument;

    try {
      userWithSameEmail = await this.doctorsRepository.findOne({
        email: createDoctorDto.email,
      });
    } catch (error) {}

    try {
      userWithSamePassword = await this.doctorsRepository.findOne({
        username: createDoctorDto.doctorName,
      });
    } catch (error) {}

    if (userWithSameEmail) exceptionMessage.push('Email already exist.');
    if (userWithSamePassword) exceptionMessage.push('Username already exist.');

    if (exceptionMessage.length == 0) {
      return;
    }

    throw new UnprocessableEntityException(exceptionMessage);
  }

  private constructStorageBucketPath(doctorId: string) {
    return `media/doctors/${doctorId}/profile-picture/profile-pic-${doctorId}`;
  }

  private constructStorageBucketDirPath() {
    return 'media/doctors';
  }

  private async saveProfilePic(
    doctorId: string,
    profilePicFile: Express.Multer.File,
  ) {
    const storageBucketPath = this.constructStorageBucketPath(doctorId);

    return this.storageService.save(
      storageBucketPath,
      profilePicFile.mimetype,
      profilePicFile.buffer,
      [{ doctorId }],
    );
  }

  private async deleteProfilePic(doctorId: string) {
    return this.storageService.delete(
      this.constructStorageBucketPath(doctorId),
    );
  }

  // Verify doctor doctorName and email, used in AuthGuard
  async verifyDoctor(doctorNameAndEmail: string, password: string) {
    const { doctorName, email } = JSON.parse(
      doctorNameAndEmail,
    ) as DoctorNameAndEmail;
    const query: FilterQuery<DoctorDocument> = {
      $or: [{ email }, { doctorName }],
    };
    const doctor = await this.doctorsRepository.findOne(query);
    const passwordIsValid = await bcrypt.compare(password, doctor.password);

    if (!passwordIsValid) {
      throw new UnauthorizedException('Credentials are not valid.');
    }

    return doctor;
  }

  // Update stored refresh token
  async updateUserRefreshToken(_id: Types.ObjectId, refreshToken: string) {
    return this.doctorsRepository.findOneAndUpdate(
      { _id },
      { $set: { refreshToken: await bcrypt.hash(refreshToken, 10) } },
    );
  }

  // create new doctor
  async create(
    createDoctorDto: CreateDoctorDto,
    profilePicFile?: Express.Multer.File,
  ) {
    await this.validateCreateDoctorDto(createDoctorDto);
    const doctorId = new Types.ObjectId();

    try {
      let profilePicUrl: string;
      if (profilePicFile) {
        const { publicUrl } = await this.saveProfilePic(
          doctorId.toHexString(),
          profilePicFile,
        );
        profilePicUrl = publicUrl;
      }

      return this.doctorsRepository.create(
        {
          ...createDoctorDto,
          profilePicUrl,
          password: await bcrypt.hash(createDoctorDto.password, 10),
        },
        doctorId,
      );
    } catch (error) {
      await this.deleteProfilePic(doctorId.toHexString());
      throw error;
    }
  }

  // fetch all doctor
  async fetchAll() {
    return this.doctorsRepository.find({});
  }

  // fetch doctor by ID
  async fetchDoctorById(doctorId: string) {
    return this.doctorsRepository.findOne({ _id: doctorId });
  }

  // update doctor
  async update(
    doctorId: string,
    updateDoctorDto: UpdateDoctorDto,
    profilePicFile?: Express.Multer.File,
  ) {
    try {
      const results = await Bluebird.Promise.all([
        this.doctorsRepository.findOneAndUpdate(
          { _id: doctorId },
          { $set: { ...updateDoctorDto } },
        ),
        () => {
          if (profilePicFile) {
            return this.saveProfilePic(doctorId, profilePicFile);
          }
        },
      ]);
      if (updateDoctorDto && updateDoctorDto.fullName) {
        this.eventsService.emitDoctorUpdateEvent({
          doctorId: doctorId,
          fullName: updateDoctorDto.fullName,
        });
      }

      return results[0];
    } catch (error) {
      throw error;
    }
  }

  // delete doctor
  async delete(doctorId: string) {
    try {
      const results = await Bluebird.Promise.all([
        this.doctorsRepository.findOneAndDelete({ _id: doctorId }),
        this.deleteProfilePic(doctorId),
      ]);
      return results[0];
    } catch (error) {
      throw error;
    }
  }

  // delete specific doctor refresh token
  async deleteRefreshToken(doctorId: string) {
    return this.doctorsRepository.findOneAndUpdate(
      { _id: doctorId },
      { $set: { refreshToken: null } },
    );
  }
}
