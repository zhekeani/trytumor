import * as dotenv from 'dotenv';
import * as path from 'path';
import { DatabaseConfig } from '../../database';

export const databaseConfig = (
  envPath: string,
  connectionUriEnvFn: () => string = () => process.env.MONGODB_CONNECTION_URI,
) => {
  dotenv.config({
    path: path.resolve(envPath),
  });

  const MONGODB_CONNECTION_URI = connectionUriEnvFn();
  const databaseConfigProperties: DatabaseConfig = {
    mongodb_uri: MONGODB_CONNECTION_URI,
  };

  return {
    database: databaseConfigProperties,
  };
};
