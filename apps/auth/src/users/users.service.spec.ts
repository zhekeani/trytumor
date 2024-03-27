import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { UsersRepository } from './users.repository';
import { StorageService } from '@app/common';
import { EventsService } from '../events/events.service';
import {
  NotFoundException,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcryptjs';
import exp from 'constants';
import { Types } from 'mongoose';
import { EditUserDto } from './dto/edit-user.dto';

describe('UsersService', () => {
  let service: UsersService;
  let usersRepository: Partial<UsersRepository>;
  let storageService: StorageService;
  let eventsService: Partial<EventsService>;

  const mockUsersRepository: Partial<UsersRepository> = {
    findOne: jest.fn(),
    create: jest.fn(),
    findOneAndUpdate: jest.fn(),
    find: jest.fn(),
    findOneAndDelete: jest.fn(),
    deleteMany: jest.fn(),
  };

  const mockStorageService: Partial<StorageService> = {
    delete: jest.fn(),
    save: jest.fn(),
  };

  const mockEventsService: Partial<EventsService> = {
    emitDoctorEditEvent: jest.fn(),
  };

  const mockFile: Express.Multer.File = {
    fieldname: 'file',
    originalname: 'example.jpg',
    encoding: 'utf-8',
    mimetype: 'image/jpeg',
    size: 1024, // Size in bytes
    destination: '/uploads',
    filename: 'example.jpg',
    path: '/uploads/example.jpg',
    buffer: Buffer.from('Mock file content'),
    stream: undefined,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: UsersRepository, useValue: mockUsersRepository },
        {
          provide: StorageService,
          useValue: mockStorageService,
        },
        {
          provide: EventsService,
          useValue: mockEventsService,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    usersRepository = module.get<UsersRepository>(UsersRepository);
    storageService = module.get<StorageService>(StorageService);
    eventsService = module.get<EventsService>(EventsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
  describe('validateCreateUserDto', () => {
    const createUserDto: CreateUserDto = {
      email: 'test@test.com',
      password: 'password',
      username: 'test_username',
      fullName: 'test_fullName',
      department: 'test_department',
      specialization: 'test_specialization',
      phoneNumber: 'test_phoneNumber',
    };
    it('should call usersRepository.findOne twice with provided email and username, and throw UnprocessableEntityException when any documents is found', async () => {
      usersRepository.findOne = jest.fn().mockImplementation(() => {
        return new NotFoundException();
      });

      // Check if usersRepository.findOne throw exception,
      // validateCreateUserDto will throw Unpro
      await expect(
        service['validateCreateUserDto'](createUserDto),
      ).rejects.toThrow(UnprocessableEntityException);

      // Check usersRepository.findOne is called twice
      expect(usersRepository.findOne).toHaveBeenCalledTimes(2);

      // Check usersRepository.findOne is called with provided email
      // and provided username
      expect(usersRepository.findOne).toHaveBeenCalledWith({
        email: createUserDto.email,
      });
      expect(usersRepository.findOne).toHaveBeenCalledWith({
        username: createUserDto.username,
      });
    });
  });

  describe('create', () => {
    const userId = 'user_id';
    // const profilePictureFile = Buffer.from('profile_picture');
    const filePath = 'cloud_storage_path';
    const mockPublicUrl = 'test_public_url';

    const createUserDto: CreateUserDto = {
      email: 'test@test.com',
      password: 'password',
      username: 'test_username',
      fullName: 'test_fullName',
      department: 'test_department',
      specialization: 'test_specialization',
      phoneNumber: 'test_phoneNumber',
    };

    it('should throw UnprocessableEntityException if the email or username already exist', async () => {
      // Mock the usersRepository.findOne to throw NotFoundException
      usersRepository.findOne = jest.fn().mockImplementation(() => {
        throw new NotFoundException();
      });

      // Mock the validateCreateUserDto to call the usersRepository.findOne
      service['validateCreateUserDto'] = jest.fn().mockImplementation(() => {
        try {
          usersRepository.findOne({ email: createUserDto.email });
        } catch (error) {
          throw new UnprocessableEntityException();
        }
      });

      service['saveProfilePicture'] = jest.fn().mockResolvedValue(filePath);

      await expect(service.create(createUserDto, mockFile)).rejects.toThrow(
        UnprocessableEntityException,
      );
    });

    it('should return usersRepository.create if the email and username not yet exists', async () => {
      // Mock the validation success
      service['validateCreateUserDto'] = jest.fn().mockImplementation(() => {});

      service['saveProfilePicture'] = jest
        .fn()
        .mockResolvedValue({ publicUrl: mockPublicUrl });

      const result = await service.create(createUserDto, mockFile);

      // Check if saveProfilePicture is called
      expect(service['saveProfilePicture']).toHaveBeenCalled();

      expect(result).toEqual(
        usersRepository.create(
          {
            ...createUserDto,
            profilePictureUrl: mockPublicUrl,
            password: await bcrypt.hash(createUserDto.password, 10),
          },
          new Types.ObjectId(),
        ),
      );
    });
  });

  describe('verifyUser', () => {
    const testUsernameAndEmail = JSON.stringify({
      email: 'test_email',
      username: 'test_username',
    });
    const testPassword = 'test_password';

    it('should throw NotFoundException if user is not found', async () => {
      // Mock the NotFoundException by usersRepository.findOne
      usersRepository.findOne = jest.fn().mockImplementation(() => {
        throw new NotFoundException();
      });

      await expect(
        service.verifyUser(testUsernameAndEmail, testPassword),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw UnauthorizedException if the password is wrong', async () => {
      const storedUser = { password: testPassword };
      // Mock if the user is found
      usersRepository.findOne = jest.fn().mockResolvedValue(storedUser);

      // Provide the wrong password
      await expect(
        service.verifyUser(testUsernameAndEmail, 'wrong_password'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should return the user if validation success', async () => {
      const hashedPassword = await bcrypt.hash(testPassword, 10);
      const storedUser = { password: hashedPassword };

      // Mock if the user is found
      usersRepository.findOne = jest.fn().mockResolvedValue(storedUser);

      const result = await service.verifyUser(
        testUsernameAndEmail,
        testPassword,
      );

      expect(result).toEqual(storedUser);
    });
  });

  describe('updateUserRefreshToken', () => {
    const testUserId = new Types.ObjectId();
    const testRefreshToken = 'test_refresh_token';

    const queryCriteria = { _id: testUserId };

    it('should find specified user and set new refresh token', async () => {
      const update = {
        $set: { refreshToken: await bcrypt.hash(testRefreshToken, 10) },
      };

      const result = await service.updateUserRefreshToken(
        testUserId,
        testRefreshToken,
      );

      expect(result).toEqual(
        usersRepository.findOneAndUpdate(queryCriteria, update),
      );
    });
  });

  describe('update', () => {
    const testUserId = 'test_user_id';
    const testUpdateUserDto: EditUserDto = {};
    const updatedUser = 'updated_user_doc';

    it('should throw NotFoundException if user to update is not found', async () => {
      // Mock the user not found scenario
      usersRepository.findOneAndUpdate = jest.fn().mockImplementation(() => {
        throw new NotFoundException();
      });

      await expect(
        service.update(testUserId, testUpdateUserDto, mockFile),
      ).rejects.toThrow(NotFoundException);
    });

    it('should not call saveProfilePicture if profile picture file is not provided', async () => {
      usersRepository.findOneAndUpdate = jest
        .fn()
        .mockResolvedValue(updatedUser);

      service['saveProfilePicture'] = jest.fn().mockResolvedValue(undefined);

      await service.update(testUserId, testUpdateUserDto);

      expect(service['saveProfilePicture']).not.toHaveBeenCalled();
    });

    it('should call saveProfilePicture if profile picture file is provided', async () => {
      usersRepository.findOneAndUpdate = jest
        .fn()
        .mockResolvedValue(updatedUser);

      service['saveProfilePicture'] = jest.fn().mockResolvedValue(undefined);

      await service.update(testUserId, testUpdateUserDto, mockFile);

      expect(service['saveProfilePicture']).toHaveBeenCalled();
    });

    it('should not emit event if the fullName property is not provided', async () => {
      usersRepository.findOneAndUpdate = jest
        .fn()
        .mockResolvedValue(updatedUser);

      eventsService.emitDoctorEditEvent = jest
        .fn()
        .mockResolvedValue(undefined);

      await service.update(testUserId, testUpdateUserDto);

      expect(eventsService.emitDoctorEditEvent).not.toHaveBeenCalled();
    });

    it('should emit event if the fullName property is provided', async () => {
      usersRepository.findOneAndUpdate = jest
        .fn()
        .mockResolvedValue(updatedUser);

      eventsService.emitDoctorEditEvent = jest
        .fn()
        .mockResolvedValue(undefined);

      testUpdateUserDto.fullName = 'updated_full_name';

      await service.update(testUserId, testUpdateUserDto);

      expect(eventsService.emitDoctorEditEvent).toHaveBeenCalled();
    });

    it('should return the updated user document if the update success', async () => {
      const queryCriteria = { _id: testUserId };
      const update = { $set: { ...testUpdateUserDto } };

      usersRepository.findOneAndUpdate = jest
        .fn()
        .mockResolvedValue(updatedUser);

      const result = await service.update(testUserId, testUpdateUserDto);

      expect(usersRepository.findOneAndUpdate).toHaveBeenCalledWith(
        queryCriteria,
        update,
      );

      expect(result).toEqual(updatedUser);
    });
  });

  describe('delete', () => {
    const testUserId = 'test_user_id';
    const deletedUser = 'deleted_user_doc';
    it('should delete user file in cloud storage and user document in database', async () => {
      storageService.delete = jest.fn().mockResolvedValue(undefined);
      usersRepository.findOneAndDelete = jest
        .fn()
        .mockResolvedValue(deletedUser);

      const result = await service.delete(testUserId);

      expect(storageService.delete).toHaveBeenCalled();
      expect(usersRepository.findOneAndDelete).toHaveBeenCalledWith({
        _id: testUserId,
      });
      expect(result).toEqual(deletedUser);
    });
  });
});
