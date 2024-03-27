import { StorageService } from '@app/common';
import { EventsService } from './events/events.service';
import { PatientsService } from './patients.service';
import { PatientsRepository } from './repositories/patients.repository';
import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { CreatePatientDto } from './dto/create-patient.dto';
import { PatientDocument } from './models/patient.schema';
import {
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';

describe('PatientsService', () => {
  let service: PatientsService;
  let patientsRepository: PatientsRepository;
  let storageService: StorageService;
  let eventsService: EventsService;

  const mockPatientsRepository: Partial<PatientsRepository> = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    findOneAndUpdate: jest.fn(),
    findOneAndDelete: jest.fn(),
    deleteMany: jest.fn(),
  };

  const mockStorageService: Partial<StorageService> = {
    deleteFilesByDirectoryName: jest.fn(),
    save: jest.fn(),
  };

  const mockEventsService: Partial<EventsService> = {
    emitPatientDeleteEvent: jest.fn(),
    emitPatientEditEvent: jest.fn(),
    emitPatientNewEvent: jest.fn(),
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
        PatientsService,
        {
          provide: PatientsRepository,
          useValue: mockPatientsRepository,
        },
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

    service = module.get<PatientsService>(PatientsService);
    patientsRepository = module.get<PatientsRepository>(PatientsRepository);
    storageService = module.get<StorageService>(StorageService);
    eventsService = module.get<EventsService>(EventsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('saveProfilePicture', () => {
    const mockPatientId = new Types.ObjectId();
    const mockFilePath = 'test_file_path';

    it('should construct cloud storage path and save the image to cloud storage', async () => {
      service['constructProfilePicPath'] = jest
        .fn()
        .mockReturnValueOnce(mockFilePath);

      const result = await service['saveProfilePicture'](
        mockPatientId.toHexString(),
        mockFile,
      );

      expect(service['constructProfilePicPath']).toHaveBeenCalledWith(
        mockPatientId.toHexString(),
      );
      expect(result).toEqual(
        storageService.save(mockFilePath, mockFile.mimetype, mockFile.buffer, [
          { patientId: mockPatientId.toHexString() },
        ]),
      );
    });
  });

  describe('create', () => {
    const mockPatientId = new Types.ObjectId();
    const mockCreatePatientDto: CreatePatientDto = {
      profilePictureURL: 'test_profile_picture_url',
      fullName: 'test_full_name',
      birthDate: new Date(),
      gender: 'female',
      height: 170,
      weight: 65,
      email: 'test@test.com',
      address: 'test_address',
      previousMedicalConditions: ['test_previous_medical_history'],
      familyMedicalHistory: ['test_family_medical_history'],
      allergies: ['test_allergy'],
    };

    const mockNewPatient: PatientDocument = {
      _id: mockPatientId,
      fullName: mockCreatePatientDto.fullName,
      gender: mockCreatePatientDto.gender,
      birthDate: mockCreatePatientDto.birthDate,
    } as unknown as PatientDocument;

    it('should save patient"s profile picture in cloud storage and save patient data in database ', async () => {
      const mockPublicUrl = 'test_public_url';

      // Mock methods
      patientsRepository.create = jest
        .fn()
        .mockResolvedValueOnce(mockNewPatient);
      eventsService.emitPatientNewEvent = jest
        .fn()
        .mockResolvedValueOnce(undefined);
      service['saveProfilePicture'] = jest
        .fn()
        .mockResolvedValueOnce({ publicUrl: mockPublicUrl });
      const result = await service.create(mockCreatePatientDto, mockFile);

      expect(service['saveProfilePicture']).toHaveBeenCalled();
      expect(patientsRepository.create).toHaveBeenCalled();
      expect(eventsService.emitPatientNewEvent).toHaveBeenCalledWith({
        id: mockNewPatient._id.toHexString(),
        fullName: mockNewPatient.fullName,
        gender: mockNewPatient.gender,
        birthDate: mockNewPatient.birthDate,
      });
      expect(result).toEqual(mockNewPatient);
    });

    it('should return Internal Sever Error Exception if its fail to save file to cloud storage', async () => {
      // Mock methods
      patientsRepository.create = jest
        .fn()
        .mockResolvedValueOnce(mockNewPatient);
      eventsService.emitPatientNewEvent = jest
        .fn()
        .mockResolvedValueOnce(undefined);
      service['saveProfilePicture'] = jest.fn().mockImplementationOnce(() => {
        throw new InternalServerErrorException();
      });

      await expect(
        service.create(mockCreatePatientDto, mockFile),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('update', () => {
    const mockPatientId = new Types.ObjectId();
    const mockUpdatePatientDto: Partial<CreatePatientDto> = {
      fullName: 'test_full_name_updated',
      gender: 'female',
      birthDate: new Date(),
    };
    const mockQueryCriteria = { _id: mockPatientId.toHexString() };
    const mockUpdate = { $set: { ...mockUpdatePatientDto } };

    const mockUpdatedPatient: PatientDocument = {
      _id: mockPatientId.toHexString(),
    } as unknown as PatientDocument;
    it('should update patient data in database, reupload profile picture, if new profile picture is provided, and emit prediction-edit event', async () => {
      // Mock methods
      patientsRepository.findOneAndUpdate = jest
        .fn()
        .mockResolvedValueOnce(mockUpdatedPatient);
      service['saveProfilePicture'] = jest
        .fn()
        .mockResolvedValueOnce(undefined);
      eventsService.emitPatientEditEvent = jest
        .fn()
        .mockResolvedValueOnce(undefined);

      const result = await service.update(
        mockPatientId.toHexString(),
        mockUpdatePatientDto,
        mockFile,
      );

      expect(patientsRepository.findOneAndUpdate).toHaveBeenCalledWith(
        mockQueryCriteria,
        mockUpdate,
      );
      expect(service['saveProfilePicture']).toHaveBeenCalledWith(
        mockPatientId.toHexString(),
        mockFile,
      );
      expect(eventsService.emitPatientEditEvent).toHaveBeenCalledWith({
        id: mockPatientId.toHexString(),
        fullName: mockUpdatePatientDto.fullName,
        gender: mockUpdatePatientDto.gender,
        birthDate: mockUpdatePatientDto.birthDate,
      });
      expect(result).toEqual(mockUpdatedPatient);
    });

    it('should update patient data in database, but should not reupload profile picture, if new profile picture is not provided, and emit prediction-edit event', async () => {
      // Mock methods
      patientsRepository.findOneAndUpdate = jest
        .fn()
        .mockResolvedValueOnce(mockUpdatedPatient);
      service['saveProfilePicture'] = jest
        .fn()
        .mockResolvedValueOnce(undefined);
      eventsService.emitPatientEditEvent = jest
        .fn()
        .mockResolvedValueOnce(undefined);

      const result = await service.update(
        mockPatientId.toHexString(),
        mockUpdatePatientDto,
      );

      expect(patientsRepository.findOneAndUpdate).toHaveBeenCalledWith(
        mockQueryCriteria,
        mockUpdate,
      );
      expect(service['saveProfilePicture']).not.toHaveBeenCalled();
      expect(eventsService.emitPatientEditEvent).toHaveBeenCalledWith({
        id: mockPatientId.toHexString(),
        fullName: mockUpdatePatientDto.fullName,
        gender: mockUpdatePatientDto.gender,
        birthDate: mockUpdatePatientDto.birthDate,
      });
      expect(result).toEqual(mockUpdatedPatient);
    });

    it('should return Not Found Exception if patient with specified patient ID was not found', async () => {
      // Mock methods
      patientsRepository.findOneAndUpdate = jest
        .fn()
        .mockImplementationOnce(() => {
          throw new NotFoundException();
        });
      service['saveProfilePicture'] = jest
        .fn()
        .mockResolvedValueOnce(undefined);
      eventsService.emitPatientEditEvent = jest
        .fn()
        .mockResolvedValueOnce(undefined);

      await expect(
        service.update(mockPatientId.toHexString(), mockUpdatePatientDto),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('delete', () => {
    const mockPatientId = new Types.ObjectId();
    const mockFilePath = 'test_file_path';
    const mockDeletedPatient: PatientDocument = {
      _id: mockPatientId.toHexString(),
    } as unknown as PatientDocument;

    it("should delete patient's profile picture in cloud storage with all of patient predictions data, and delete patient data in database", async () => {
      // Mock methods
      storageService.deleteFilesByDirectoryName = jest
        .fn()
        .mockResolvedValueOnce(undefined);
      service['constructPatientPath'] = jest
        .fn()
        .mockReturnValueOnce(mockFilePath);
      patientsRepository.findOneAndDelete = jest
        .fn()
        .mockResolvedValueOnce(mockDeletedPatient);
      eventsService.emitPatientDeleteEvent = jest
        .fn()
        .mockResolvedValueOnce(undefined);

      const result = await service.delete(mockPatientId.toHexString());

      expect(service['constructPatientPath']).toHaveBeenCalledWith(
        mockPatientId.toHexString(),
      );
      expect(storageService.deleteFilesByDirectoryName).toHaveBeenCalledWith(
        mockFilePath,
      );
      expect(patientsRepository.findOneAndDelete).toHaveBeenCalledWith({
        _id: mockPatientId.toHexString(),
      });
      expect(eventsService.emitPatientDeleteEvent).toHaveBeenCalledWith({
        id: mockPatientId.toHexString(),
      });
      expect(result).toEqual(mockDeletedPatient);
    });
  });
});
