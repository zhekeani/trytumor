import { Bucket, Storage } from '@google-cloud/storage';
import {
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StorageModuleConfig } from './interfaces/storage-module-config.interface';
import { error } from 'console';
import { resolve } from 'path';
import { StreamOutput } from './interfaces/stream-output.interface';

@Injectable()
export class StorageService {
  private logger: Logger;

  private storage: Storage;
  private bucket: Bucket;
  private bucketName: string;

  constructor(@Inject('CONFIG') storageConfig: StorageModuleConfig) {
    this.logger = new Logger();

    this.storage = new Storage({
      projectId: storageConfig.projectId,
      credentials: {
        client_email: storageConfig.clientEmail,
        private_key: storageConfig.privateKey,
      },
    });

    this.bucket = this.storage.bucket(storageConfig.bucketName);
    this.bucketName = storageConfig.bucketName;
  }

  async save(
    path: string,
    contentType: string,
    media: Buffer,
    metadata: { [key: string]: string }[],
  ) {
    // Returns promises explicitly because the method uses stream operations
    return new Promise<StreamOutput>((resolve, reject) => {
      // Combine all custom metadata
      const object = metadata.reduce(
        (obj, item) => Object.assign(obj, item),
        {},
      );

      // Create stream to upload
      const file = this.bucket.file(path);
      const stream = file.createWriteStream({
        // Set the default metadata
        metadata: {
          contentType,
        },
      });

      stream
        // Listening to error event
        .on('error', (error) => {
          this.logger.warn('Stream upload error:', error.message);

          reject(new InternalServerErrorException(error.message));
        })
        // Listening to finish event
        .on('finish', async () => {
          await file.setMetadata({
            metadata: object,
          });

          // Make the file publicly accessible
          await file.makePublic();

          // Construct the public url
          const streamOutput = {
            publicUrl: `https://storage.googleapis.com/${this.bucketName}/${path}`,
          };

          // Resolve the promise
          resolve(streamOutput);
        });
      stream.end(media);
    });
  }

  async delete(path: string) {
    return this.bucket.file(path).delete({ ignoreNotFound: true });
  }

  async deleteFilesByDirectoryName(path: string) {
    return this.bucket.deleteFiles({ prefix: path });
  }
}
