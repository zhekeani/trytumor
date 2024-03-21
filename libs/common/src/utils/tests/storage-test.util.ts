/* eslint-disable @typescript-eslint/no-unused-vars */
//
// Quick & Dirty Google Cloud Storage emulator for tests. Requires
// `stream-buffers` from npm. Use it like this:
//
// `new MockStorage().bucket('my-bucket').file('my_file').createWriteStream()`
//
import type {
  CreateWriteStreamOptions,
  DeleteFilesOptions,
  GetSignedUrlConfig,
  MakeFilePublicResponse,
} from '@google-cloud/storage';
import * as streamBuffers from 'stream-buffers';

export class MockStorage {
  public buckets: object;

  public constructor() {
    this.buckets = {};
  }

  public bucket(name: string): MockBucket {
    if (this.buckets[name] === undefined) {
      this.buckets[name] = new MockBucket(name);
    }
    return this.buckets[name];
  }
}

export class MockBucket {
  public name: string;

  public files: object;

  public constructor(name: string) {
    this.name = name;
    this.files = {};
  }

  public upload(name: string, options: any): MockFile[] {
    return [this.file(name)];
  }

  public file(name: string): MockFile {
    if (this.files[name] === undefined) {
      this.files[name] = new MockFile(name);
    }
    return this.files[name];
  }

  public async deleteFiles(query?: DeleteFilesOptions): Promise<void> {
    return Promise.resolve();
  }
}

interface Metadata {
  metadata?: object;
}

export class MockFile {
  public name: string;

  public path?: string;

  public contents: Buffer;

  public metadata: {
    metadata?: object;
  };

  public constructor(name: string, path?: string) {
    this.name = name;
    this.path = path;
    this.contents = Buffer.alloc(0);
    this.metadata = {};
  }

  public get(): [MockFile, any] {
    return [this, this.metadata];
  }

  public async delete(): Promise<void> {
    return Promise.resolve();
  }

  public exists(): [boolean, any] {
    return [true, this.metadata];
  }

  public setMetadata(metadata: Metadata): void {
    const customMetadata = { ...this.metadata.metadata, ...metadata.metadata };
    this.metadata = { ...this.metadata, ...metadata, metadata: customMetadata };
  }

  public makePublic(): Promise<MakeFilePublicResponse> {
    return Promise.resolve(undefined);
  }

  public async getSignedUrl(options?: GetSignedUrlConfig): Promise<string> {
    return Promise.resolve('https://example.com');
  }

  public createReadStream(): any {
    const readable = new streamBuffers.ReadableStreamBuffer();
    readable.put(this.contents);
    readable.stop();
    return readable;
  }

  public createWriteStream(options?: CreateWriteStreamOptions): any {
    const writable = new streamBuffers.WritableStreamBuffer();
    writable.on('finish', () => {
      this.contents = writable.getContents() && undefined;
    });
    writable.on('error', () => {});
    return writable;
  }
}
