import { Test, TestingModule } from '@nestjs/testing';
import { StorageService } from './storage.service';

describe('StorageService', () => {
  let service: StorageService;
  let storageMock: Partial<Storage>;

  beforeEach(async () => {
    storageMock = {
      bucket: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StorageService,
        {
          provide: 'CONFIG',
          useFactory: () => ({
            projectId: 'PROJECT_ID',
            clientEmail: 'CLIENT_EMAIL',
            privateKey: 'PRIVATE_KEY',
            bucketName: 'BUCKET_NAME',
          }),
        },
        {
          provide: Storage,
          useValue: storageMock,
        },
      ],
    }).compile();

    service = module.get<StorageService>(StorageService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should save file to storage', async () => {
    const bucketMock = {
      file: jest.fn().mockReturnValue({
        createWriteStream: jest.fn().mockReturnValue({
          on: jest.fn(),
          end: jest.fn(),
        }),
        setMetadata: jest.fn().mockResolvedValue(undefined),
        makePublic: jest.fn().mockResolvedValue(undefined),
      }),
    };
    (storageMock.bucket as jest.Mock).mockReturnValue(bucketMock as any);

    // Call the method under test
    await service.save(
      'testPath',
      'testContentType',
      Buffer.from('testMedia'),
      [],
    );

    // Assert that the bucket was called with the correct path
    expect(storageMock.bucket).toHaveBeenCalledWith('test-bucket-name');

    // Additional assertions...
  });
});
