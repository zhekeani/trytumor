import { Bucket, Storage } from '@google-cloud/storage';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StorageModuleConfig } from './interfaces/storage-module-config.interface';

@Injectable()
export class StorageService {
  private storage: Storage;
  private bucket: Bucket;

  constructor(@Inject('CONFIG') storageConfig: StorageModuleConfig) {
    this.storage = new Storage({
      projectId: storageConfig.projectId,
      credentials: {
        client_email: storageConfig.clientEmail,
        private_key: storageConfig.privateKey,
      },
    });

    this.bucket = this.storage.bucket(storageConfig.bucketName);
  }

  async save(
    path: string,
    contentType: string,
    media: Buffer,
    metadata: { [key: string]: string }[],
  ) {
    const object = metadata.reduce((obj, item) => Object.assign(obj, item), {});

    const file = this.bucket.file(path);
    const stream = file.createWriteStream();
    stream.on('finish', async () => {
      return await file.setMetadata({
        metadata: object,
      });
    });
    stream.end(media);
  }
}
