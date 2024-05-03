import { Bucket } from '@google-cloud/storage';
import {
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';

import { StreamOutput } from './interfaces/stream-output.interface';

@Injectable()
export class StorageService {
  constructor(@Inject('BUCKET') private readonly storageBucket: Bucket) {}

  async save(
    path: string,
    contentType: string,
    media: Buffer,
    metadata: { [key: string]: string }[],
  ) {
    return new Promise<StreamOutput>((resolve, reject) => {
      const object = metadata.reduce(
        (obj, item) => Object.assign(obj, item),
        {},
      );

      const file = this.storageBucket.file(path);
      const stream = file.createWriteStream({
        metadata: {
          contentType,
        },
      });

      stream
        .on('error', (error) => {
          reject(new InternalServerErrorException(error.message));
        })
        .on('finish', async () => {
          try {
            await file.setMetadata({
              metadata: object,
            });
            await file.makePublic();

            const streamOutput: StreamOutput = {
              publicUrl: `https://storage.googleapis.com/${this.storageBucket.name}/${path}`,
            };
            resolve(streamOutput);
          } catch (error) {
            reject(new InternalServerErrorException(error.message));
          }
        });

      stream.end(media);
    });
  }

  async delete(path: string) {
    return this.storageBucket.file(path).delete({ ignoreNotFound: true });
  }

  async deleteFilesByDirName(path: string) {
    return this.storageBucket.deleteFiles({ prefix: path });
  }
}
