import {
  Injectable,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { FilterQuery } from 'mongoose';
import * as bcrypt from 'bcryptjs';

import { UsersRepository } from './users.repository';
import { CreateUserDto } from './dto/create-user.dto';
import { UserDocument } from './models/user.schema';
import { GetUserDto } from './dto/get-user.dto';

type VerifyUserOptions =
  | {
      email: string;
      username?: never;
      password: string;
    }
  | {
      email?: never;
      username: string;
      password: string;
    };

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

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

  async create(createUserDto: CreateUserDto) {
    await this.validateCreateUserDto(createUserDto);

    return this.usersRepository.create({
      ...createUserDto,
      password: await bcrypt.hash(createUserDto.password, 10),
    });
  }

  // Used for sign in user
  async verifyUser(options: VerifyUserOptions) {
    const { email, username, password } = options;

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

  // Used in auth guard
  async getUser(getUserDto: GetUserDto) {
    return this.usersRepository.findOne(getUserDto);
  }
}
