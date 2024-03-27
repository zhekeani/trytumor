import {
  Model,
  QueryOptions,
  QueryWithHelpers,
  Types,
  UpdateWriteOpResult,
} from 'mongoose';
import { UsersRepository } from './users.repository';
import { UserDocument } from './models/user.schema';
import { create } from 'domain';
import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { CreateUserDto } from './dto/create-user.dto';
import { AbstractRepository } from '@app/common';
import { NotFoundException } from '@nestjs/common';

describe('UsersRepository', () => {
  let usersRepository: UsersRepository;
  let model: Model<UserDocument>;

  const newUserId = new Types.ObjectId();
  const newUserData = {
    email: 'test@test.com',
    password: 'password',
    fullName: 'Test Example',
    username: 'test_example',
    department: 'test_department',
    specialization: 'test_specialization',
    phoneNumber: '0000000000000',
  };
  const newUserDocument = {
    _id: newUserId,
    ...newUserData,
  };

  const mockUserModel = {
    create: jest.fn(),
    findOne: jest.fn(),
    findOneAndUpdate: jest.fn(),
    updateMany: jest.fn(),
    findOneAndDelete: jest.fn(),
    deleteMany: jest.fn(),
    aggregate: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersRepository,
        {
          provide: getModelToken(UserDocument.name),
          useValue: mockUserModel,
        },
      ],
    }).compile();

    usersRepository = module.get(UsersRepository);
    model = module.get(getModelToken(UserDocument.name));
  });

  describe('create', () => {
    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          UsersRepository,
          {
            provide: getModelToken(UserDocument.name),
            useValue: class {
              save = jest.fn().mockReturnValue({
                toJSON: jest.fn().mockResolvedValue({
                  _id: newUserId,
                  ...newUserData,
                } as UserDocument),
              });
            },
          },
        ],
      }).compile();

      usersRepository = module.get(UsersRepository);
      model = module.get(getModelToken(UserDocument.name));
    });

    it('should create and return a user', async () => {
      const newUserDto: CreateUserDto = {
        ...newUserData,
      };

      const result = await usersRepository.create(newUserDto);

      expect(result).toEqual(newUserDocument);
    });
  });

  describe('findOne', () => {
    it('should find and return a user by specified query criteria', async () => {
      model.findOne = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(newUserDocument),
        }),
      });

      const queryCriteria = { _id: newUserId };
      const result = await usersRepository.findOne(queryCriteria);

      expect(model.findOne).toHaveBeenCalledWith(queryCriteria);
      expect(result).toEqual(newUserDocument);
    });

    it('should throw NotFoundException if user is not found', async () => {
      model.findOne = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(undefined),
        }),
      });

      const queryCriteria = { _id: newUserId };
      await expect(usersRepository.findOne(queryCriteria)).rejects.toThrow(
        NotFoundException,
      );

      expect(model.findOne).toHaveBeenCalledWith(queryCriteria);
    });
  });

  describe('findOneAndUpdate', () => {
    const updatedUserDocument = { ...newUserDocument };
    const update: Partial<CreateUserDto> = {
      fullName: 'Updated Full Name',
      department: 'updated_department',
    };
    const queryCriteria = { _id: newUserId };
    const options: QueryOptions = { new: true };

    beforeEach(() => {
      updatedUserDocument.fullName = update.fullName;
      updatedUserDocument.department = update.department;
    });
    it('should find one document with specified query criteria and update it with new data', async () => {
      model.findOneAndUpdate = jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(updatedUserDocument),
      });

      const result = await usersRepository.findOneAndUpdate(
        queryCriteria,
        update,
      );

      expect(model.findOneAndUpdate).toHaveBeenCalledWith(
        queryCriteria,
        update,
        options,
      );
      expect(result).toEqual(updatedUserDocument);
    });

    it('should throw NotFoundException if user is not found', async () => {
      model.findOneAndUpdate = jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(undefined),
      });

      await expect(
        usersRepository.findOneAndUpdate(queryCriteria, update),
      ).rejects.toThrow(NotFoundException);

      expect(model.findOneAndUpdate).toHaveBeenCalledWith(
        queryCriteria,
        update,
        options,
      );
    });
  });

  describe('updateMany', () => {
    const updateResult = { n: 5, nModified: 3, ok: 1 };

    const update: Partial<CreateUserDto> = {
      department: 'updated_department',
    };
    const queryCriteria = { department: 'department_to_update' };

    it('should update multiple document thats satisfy the specified query criteria', async () => {
      model.updateMany = jest.fn().mockReturnValue(updateResult);

      const result = await usersRepository.updateMany(queryCriteria, update);

      expect(model.updateMany).toHaveBeenCalledWith(queryCriteria, update);
      expect(result).toEqual(updateResult);
    });
  });

  describe('find', () => {
    const queryCriteria = { department: 'department_to_update' };
    const findResult = 'documents_thats_satisfy_query_criteria';
    it('should find any document thats satisfy the specified query criteria', async () => {
      model.find = jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(findResult),
      });

      const result = await usersRepository.find(queryCriteria);

      expect(model.find).toHaveBeenCalledWith(queryCriteria);
      expect(result).toEqual(findResult);
    });
  });

  describe('findOneAndDelete', () => {
    const queryCriteria = { _id: 'document_id' };
    const findAndDeleteResult = 'documents_thats_satisfy_query_criteria';
    it('should find one document thats satisfy the specified query criteria and delete it', async () => {
      model.findOneAndDelete = jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(findAndDeleteResult),
      });

      const result = await usersRepository.findOneAndDelete(queryCriteria);

      expect(model.findOneAndDelete).toHaveBeenCalledWith(queryCriteria);
      expect(result).toEqual(findAndDeleteResult);
    });
  });

  describe('deleteMany', () => {
    const queryCriteria = { department: 'department_to_delete' };
    const deleteManyResult = 'documents_thats_satisfy_query_criteria';
    it('should find any document thats satisfy the specified query criteria and delete it', async () => {
      model.deleteMany = jest.fn().mockReturnValue(deleteManyResult);

      const result = await usersRepository.deleteMany(queryCriteria);

      expect(model.deleteMany).toHaveBeenCalledWith(queryCriteria, undefined);
      expect(result).toEqual(deleteManyResult);
    });
  });

  describe('aggregate', () => {
    const pipelines = undefined;
    const options = undefined;
    const aggregationResult = 'aggregation_result';
    it('return the aggregation with provided pipelines', async () => {
      model.aggregate = jest.fn().mockReturnValue(aggregationResult);

      const result = await usersRepository.aggregate(pipelines);

      expect(model.aggregate).toHaveBeenCalledWith(pipelines, options);
      expect(result).toEqual(aggregationResult);
    });
  });
});
