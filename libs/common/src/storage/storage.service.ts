import { Bucket } from '@google-cloud/storage';
import {
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { StreamOutput } from './interfaces/stream-output.interface';

@Injectable()
export class StorageService {
  private logger: Logger;

  constructor(@Inject('BUCKET') private readonly cloudBucket: Bucket) {}

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
      const file = this.cloudBucket.file(path);
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
          try {
            await file.setMetadata({
              metadata: object,
            });
            // Make the file publicly accessible
            await file.makePublic();

            // Construct the public url
            const streamOutput = {
              publicUrl: `https://storage.googleapis.com/${this.cloudBucket.name}/${path}`,
            };

            // Resolve the promise
            resolve(streamOutput);
          } catch (error) {
            this.logger.warn(
              'Error setting metadata or making file public:',
              error.message,
            );

            reject(new InternalServerErrorException(error.message));
          }
        });
      stream.end(media);
    });
  }

  async delete(path: string) {
    return this.cloudBucket.file(path).delete({ ignoreNotFound: true });
  }

  async deleteFilesByDirectoryName(path: string) {
    return this.cloudBucket.deleteFiles({ prefix: path });
  }
}
