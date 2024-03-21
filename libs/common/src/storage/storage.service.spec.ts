import { InternalServerErrorException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as streamBuffers from 'stream-buffers';
import { MockStorage } from '../utils';
import { StorageService } from './storage.service';

describe('StorageService', () => {
  let service: StorageService;
  let mockStorage: MockStorage;
  let saveConfig: {
    path: string;
    contentType: string;
    media: Buffer;
    metadata: { [key: string]: string }[];
  };

  beforeEach(async () => {
    mockStorage = new MockStorage();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StorageService,
        {
          provide: 'BUCKET',
          useValue: mockStorage.bucket('test-bucket'),
        },
      ],
    }).compile();

    service = module.get<StorageService>(StorageService);
    // Prepare test data
    saveConfig = {
      path: 'test/path/file.txt',
      contentType: 'text/plain',
      media: Buffer.from('Test file content'),
      metadata: [{ key: 'metadata-key', value: 'metadata-value' }],
    };
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('save', () => {
    it('should save file to storage', async () => {
      const { path, contentType, media, metadata } = saveConfig;

      // Call the save method
      const result = await service.save(path, contentType, media, metadata);

      // Verify the result
      expect(result).toHaveProperty('publicUrl');
      expect(result.publicUrl).toContain(saveConfig.path);
    });

    it('should handle errors during save', async () => {
      // Prepare test data
      const { path, media, contentType, metadata } = saveConfig;

      // Override createWriteStream method to throw an error
      service['cloudBucket'].file(path).createWriteStream = jest
        .fn()
        .mockImplementation(() => {
          const writable = new streamBuffers.WritableStreamBuffer();

          process.nextTick(() => {
            writable.emit('error', new Error('Write Error'));
          });

          return writable;
        });

      // Call the save method and expect it to throw an error
      await expect(
        service.save(path, contentType, media, metadata),
      ).rejects.toThrow(InternalServerErrorException);
    });

    it('should handle errors during file.setMetadata', async () => {
      const { path, contentType, media, metadata } = saveConfig;

      // Override createWriteStream method to throw an error
      service['cloudBucket'].file(path).setMetadata = jest
        .fn()
        .mockRejectedValue(new Error('Error setting metadata'));

      // Call the save method and expect it to throw an error
      await expect(
        service.save(path, contentType, media, metadata),
      ).rejects.toThrow(InternalServerErrorException);
    });

    it('should handle errors during file.makePublic', async () => {
      // Prepare test data
      const { path, media, contentType, metadata } = saveConfig;

      // Override createWriteStream method to throw an error
      service['cloudBucket'].file(path).makePublic = jest
        .fn()
        .mockRejectedValue(new Error('Error setting metadata'));

      // Call the save method and expect it to throw an error
      await expect(
        service.save(path, contentType, media, metadata),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('delete', () => {
    it('should delete file in the storage', async () => {
      const { path } = saveConfig;

      // Mock the delete method
      // We can either mock it to immediately resolved void or to point it
      // our mock class
      service['cloudBucket'].file(path).delete = jest
        .fn()
        .mockReturnValue(() => service['cloudBucket'].file(path).delete());

      await service.delete(path);

      expect(service['cloudBucket'].file(path).delete).toHaveBeenCalled();
    });
  });

  describe('deleteFilesByDirectoryName', () => {
    it('should delete files in specified prefix in the cloud', async () => {
      const { path } = saveConfig;
      service['cloudBucket'].deleteFiles = jest
        .fn()
        .mockReturnValue((args: any) =>
          service['cloudBucket'].deleteFiles(args),
        );

      await service.deleteFilesByDirectoryName(path);

      expect(service['cloudBucket'].deleteFiles).toHaveBeenCalledWith({
        prefix: path,
      });
    });
  });
});
