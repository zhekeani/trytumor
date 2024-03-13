import { Storage } from '@google-cloud/storage';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class StorageService {
  private storage: Storage;

  constructor(readonly configService: ConfigService) {
    this.storage = new Storage({
      projectId: configService.get('GOOGLE_STORAGE_PROJECT_ID'),
      credentials: {
        client_email: configService.get('GOOGLE_STORAGE_CLIENT_EMAIL'),
        private_key: configService.get('GOOGLE_STORAGE_PRIVATE_KEY'),
      },
    });
  }

  async save(
    path: string,
    contentType: string,
    media: Buffer,
    metadata: { [key: string]: string }[],
  ) {
    const object = metadata.reduce((obj, item) => Object.assign(obj, item), {});

    const bucketName = this.configService.get('GOOGLE_STORAGE_MEDIA_BUCKET');

    console.log('This line in storage service is called', bucketName);
    const file = this.storage.bucket(bucketName).file(path);

    const stream = file.createWriteStream();
    stream.on('finish', async () => {
      return await file.setMetadata({
        metadata: object,
      });
    });

    stream.end(media);
  }
}
