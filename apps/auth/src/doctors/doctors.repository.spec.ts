import { Test, TestingModule } from '@nestjs/testing';
import { FilterQuery, model, Model, QueryOptions, Types } from 'mongoose';
import { getModelToken } from '@nestjs/mongoose';

import { DoctorDocument } from '@app/common';
import { DoctorsRepository } from './doctors.repository';
import { CreateDoctorDto } from './dto/create-doctor.dto';
import { NotFoundException } from '@nestjs/common';
import { UpdateDoctorDto } from './dto/update-doctor.dto';

describe('DoctorsRepository', () => {
  let repository: DoctorsRepository;
  let doctorModel: Model<DoctorDocument>;

  const newDoctorId = new Types.ObjectId();
  const mockCreateDoctorDto: CreateDoctorDto = {
    email: 'test01@gmail.com',
    password: 'StrongPassword123!',
    doctorName: 'testUser01',
    fullName: 'Test User',
    department: 'test_department',
    specialization: 'test_specialization',
    phoneNumber: '888888',
  };
  const newDoctorDoc: DoctorDocument = {
    ...mockCreateDoctorDto,
    _id: newDoctorId,
  };

  class mockDoctorModel implements Partial<Model<DoctorDocument>> {
    create = jest.fn();
    findOne = jest.fn();
    findOneAndUpdate = jest.fn();
    updateMany = jest.fn();
    findOneAndDelete = jest.fn();
    deleteMany = jest.fn();
    aggregate = jest.fn();
    save = jest.fn().mockReturnValue({
      toJSON: jest.fn().mockResolvedValue(newDoctorDoc),
    });
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DoctorsRepository,
        {
          provide: getModelToken(DoctorDocument.name),
          useValue: mockDoctorModel,
        },
      ],
    }).compile();

    repository = module.get<DoctorsRepository>(DoctorsRepository);
    doctorModel = module.get<Model<DoctorDocument>>(
      getModelToken(DoctorDocument.name),
    );
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('create', () => {
    it('should create and return a new user', async () => {
      const result = await repository.create(mockCreateDoctorDto);

      expect(result).toEqual(newDoctorDoc);
    });
  });

  describe('findOne', () => {
    it('should throw "NotFoundException" if user is not found', async () => {
      doctorModel.findOne = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValueOnce(undefined),
        }),
      });

      const queryCriteria = { _id: new Types.ObjectId() };
      await expect(repository.findOne(queryCriteria)).rejects.toThrow(
        NotFoundException,
      );

      expect(doctorModel.findOne).toHaveBeenCalledWith(queryCriteria);
    });

    it('should find and return user with the specified query criteria', async () => {
      doctorModel.findOne = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValueOnce(newDoctorDoc),
        }),
      });

      const queryCriteria: FilterQuery<DoctorDocument> = {
        _id: newDoctorDoc._id,
      };
      const result = await repository.findOne(queryCriteria);

      expect(doctorModel.findOne).toHaveBeenCalledWith(queryCriteria);
      expect(result).toEqual(newDoctorDoc);
    });
  });

  describe('findOneAndUpdate', () => {
    const updatedUserDocument = { ...newDoctorDoc };
    const update: Partial<UpdateDoctorDto> = {
      fullName: 'Updated Full Name',
      department: 'updated_department',
    };
    const queryCriteria: FilterQuery<DoctorDocument> = {
      _id: newDoctorDoc._id,
    };
    const options: QueryOptions = { new: true };

    beforeEach(() => {
      updatedUserDocument.fullName = update.fullName;
      updatedUserDocument.department = update.department;
    });
    it('should find one document with specified query criteria and update it with new data', async () => {
      doctorModel.findOneAndUpdate = jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValueOnce(updatedUserDocument),
      });

      const result = await repository.findOneAndUpdate(queryCriteria, update);

      expect(doctorModel.findOneAndUpdate).toHaveBeenCalledWith(
        queryCriteria,
        update,
        options,
      );
      expect(result).toEqual(updatedUserDocument);
    });

    it('should throw NotFoundException if user is not found', async () => {
      doctorModel.findOneAndUpdate = jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValueOnce(undefined),
      });

      await expect(
        repository.findOneAndUpdate(queryCriteria, update),
      ).rejects.toThrow(NotFoundException);

      expect(doctorModel.findOneAndUpdate).toHaveBeenCalledWith(
        queryCriteria,
        update,
        options,
      );
    });
  });

  describe('updateMany', () => {
    const updateResult = { n: 5, nModified: 3, ok: 1 };

    const update: Partial<UpdateDoctorDto> = {
      department: 'updated_department',
    };
    const queryCriteria = { department: 'department_to_update' };

    it('should update multiple document thats satisfy the specified query criteria', async () => {
      doctorModel.updateMany = jest.fn().mockReturnValue(updateResult);

      const result = await repository.updateMany(queryCriteria, update);

      expect(doctorModel.updateMany).toHaveBeenCalledWith(
        queryCriteria,
        update,
      );
      expect(result).toEqual(updateResult);
    });
  });

  describe('find', () => {
    const queryCriteria = { department: 'department_to_update' };
    const findResult = 'documents_thats_satisfy_query_criteria';
    it('should find any document thats satisfy the specified query criteria', async () => {
      doctorModel.find = jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValueOnce(findResult),
      });

      const result = await repository.find(queryCriteria);

      expect(doctorModel.find).toHaveBeenCalledWith(queryCriteria);
      expect(result).toEqual(findResult);
    });
  });

  describe('findOneAndDelete', () => {
    const queryCriteria = { _id: 'document_id' };
    const findAndDeleteResult = 'documents_thats_satisfy_query_criteria';
    it('should find one document thats satisfy the specified query criteria and delete it', async () => {
      doctorModel.findOneAndDelete = jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValueOnce(findAndDeleteResult),
      });

      const result = await repository.findOneAndDelete(queryCriteria);

      expect(doctorModel.findOneAndDelete).toHaveBeenCalledWith(queryCriteria);
      expect(result).toEqual(findAndDeleteResult);
    });
  });

  describe('deleteMany', () => {
    const queryCriteria = { department: 'department_to_delete' };
    const deleteManyResult = 'documents_thats_satisfy_query_criteria';
    it('should find any document thats satisfy the specified query criteria and delete it', async () => {
      doctorModel.deleteMany = jest.fn().mockReturnValue(deleteManyResult);

      const result = await repository.deleteMany(queryCriteria);

      expect(doctorModel.deleteMany).toHaveBeenCalledWith(
        queryCriteria,
        undefined,
      );
      expect(result).toEqual(deleteManyResult);
    });
  });

  describe('aggregate', () => {
    const pipelines = undefined;
    const options = undefined;
    const aggregationResult = 'aggregation_result';
    it('return the aggregation with provided pipelines', async () => {
      doctorModel.aggregate = jest.fn().mockReturnValue(aggregationResult);

      const result = await repository.aggregate(pipelines);

      expect(doctorModel.aggregate).toHaveBeenCalledWith(pipelines, options);
      expect(result).toEqual(aggregationResult);
    });
  });
});
