import { SecretManagerServiceClient } from '@google-cloud/secret-manager';
import { Logger } from '@nestjs/common';
import * as Bluebird from 'bluebird';
import { isString } from 'lodash';

const logger = new Logger('CustomConfigLoader');

const isSecretLocator = /^projects\/(?:\d{5,16}|.*)\/secrets\/.*$/;
const isSecretVersionLocator =
  /^projects\/(?:\d{5,16}|.*)\/secrets\/.*\/versions\/(?:\d{1,4}|latest)$/;

export const rewriteRecordWithSecrets = async (
  records: any,
  level: string = '',
  secretManagerServiceClient?: SecretManagerServiceClient,
): Promise<any> => {
  for (const key in records) {
    if (isString(records[key])) {
      if (secretManagerServiceClient && isSecretLocator.test(records[key])) {
        try {
          // Do we want a specific version or grab all active ones as an array?
          if (isSecretVersionLocator.test(records[key])) {
            const [accessResponse] =
              await secretManagerServiceClient.accessSecretVersion({
                name: records[key],
              });
            records[key] = accessResponse.payload.data.toString();
          } else {
            const [versions] =
              await secretManagerServiceClient.listSecretVersions({
                parent: records[key],
              });
            const secrets: string[] = [];
            await Bluebird.Promise.map(
              versions,
              async (version) => {
                if (
                  version.state === 'ENABLED' &&
                  isSecretVersionLocator.test(version.name)
                ) {
                  const [accessResponse] =
                    await secretManagerServiceClient.accessSecretVersion({
                      name: version.name,
                    });
                  secrets.push(accessResponse.payload.data.toString());
                }
              },
              { concurrency: 1 },
            );
            records[key] = secrets;
          }
          logger.log(
            `Loaded secret from Google Secret Manager [${level}.${key}]`,
          );
        } catch (e) {
          console.log(JSON.stringify(e));
          logger.warn(
            `Failed to load secret from Google Secret Manager [${level}.${key}]`,
          );
        }
      }
    } else {
      await rewriteRecordWithSecrets(
        records[key],
        `${level}.${key}`,
        secretManagerServiceClient,
      );
    }
  }
};
