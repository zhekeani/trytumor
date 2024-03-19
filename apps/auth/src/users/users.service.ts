import {
  Injectable,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { FilterQuery, Types } from 'mongoose';

import { CreateUserDto } from './dto/create-user.dto';
import { GetUserDto } from './dto/get-user.dto';
import { UserDocument } from './models/user.schema';
import { UsersRepository } from './users.repository';
import { StorageService } from '@app/common';
import { EditUserDto } from './dto/edit-user.dto';
import { EventsService } from '../events/events.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly storageService: StorageService,
    private readonly eventsService: EventsService,
  ) {}

  // Validate whether email or username is already used
  private async validateCreateUserDto(createUserDto: CreateUserDto) {
    let exceptionMessage: string[] = [];
    let userWithSameEmail: UserDocument;
    let userWithSamePassword: UserDocument;

    try {
      userWithSameEmail = await this.usersRepository.findOne({
        email: createUserDto.email,
      });
    } catch (error) {}

    try {
      userWithSamePassword = await this.usersRepository.findOne({
        username: createUserDto.username,
      });
    } catch (error) {}

    if (userWithSameEmail) exceptionMessage.push('Email already exist.');
    if (userWithSamePassword) exceptionMessage.push('Username already exist.');

    if (exceptionMessage.length == 0) {
      return;
    }

    throw new UnprocessableEntityException(exceptionMessage);
  }

  private constructPath(userId: string) {
    return `media/doctors/${userId}/profile-picture/profile-pic-${userId}`;
  }

  private async saveProfilePicture(
    userId: string,
    profilePictureFile: Express.Multer.File,
  ) {
    const filePath = this.constructPath(userId);

    return this.storageService.save(
      filePath,
      profilePictureFile.mimetype,
      profilePictureFile.buffer,
      [{ userId }],
    );
  }

  async create(
    createUserDto: CreateUserDto,
    profilePictureFile?: Express.Multer.File,
  ) {
    await this.validateCreateUserDto(createUserDto);

    // Create the userId manually
    const userId = new Types.ObjectId();

    // Check if the profile picture is provided
    let profilePictureUrl: string;
    if (profilePictureFile) {
      const { publicUrl } = await this.saveProfilePicture(
        userId.toHexString(),
        profilePictureFile,
      );
      profilePictureUrl = publicUrl;
    }

    return this.usersRepository.create(
      {
        ...createUserDto,
        profilePictureUrl,
        password: await bcrypt.hash(createUserDto.password, 10),
      },
      userId,
    );
  }

  // Used in local strategy AuthGuard
  async verifyUser(usernameAndEmail: string, password: string) {
    const { email, username } = JSON.parse(usernameAndEmail);

    const query: FilterQuery<UserDocument> = {
      $or: [{ email }, { username }],
    };

    const user = await this.usersRepository.findOne(query);
    const passwordIsValid = await bcrypt.compare(password, user.password);

    if (!passwordIsValid) {
      throw new UnauthorizedException('Credentials are not valid.');
    }

    return user;
  }

  // Used in jwt local strategy
  async getUser(getUserDto: GetUserDto) {
    return this.usersRepository.findOne(getUserDto);
  }

  // Update the stored refresh token
  async updateUserRefreshToken(_id: Types.ObjectId, refreshToken: string) {
    return this.usersRepository.findOneAndUpdate(
      { _id },
      { $set: { refreshToken: await bcrypt.hash(refreshToken, 10) } },
    );
  }

  async fetchAll() {
    return this.usersRepository.find({});
  }

  async fetchById(userId: string) {
    return this.usersRepository.findOne({ _id: userId });
  }

  async update(
    userId: string,
    updateUserDto: EditUserDto,
    profilePictureFile?: Express.Multer.File,
  ) {
    const updatedUser = await this.usersRepository.findOneAndUpdate(
      { _id: userId },
      { $set: { ...updateUserDto } },
    );

    if (updatedUser && profilePictureFile) {
      await this.saveProfilePicture(userId, profilePictureFile);
    }

    // Only emit the doctor-edit event if the fullName property changes
    if (updateUserDto && updateUserDto.fullName) {
      this.eventsService.emitDoctorEditEvent({
        userId: userId,
        fullName: updateUserDto.fullName,
      });
    }

    return updatedUser;
  }

  async delete(userId: string) {
    await this.storageService.delete(this.constructPath(userId));

    const deletedUser = this.usersRepository.findOneAndDelete({ _id: userId });

    return deletedUser;
  }
}
