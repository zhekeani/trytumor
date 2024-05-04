import { DatabaseConfig } from '@app/common';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({
  path: path.resolve('apps/auth/.env'),
});

const MONGODB_CONNECTION_URI = process.env.MONGODB_CONNECTION_URI;

const databaseConfigProperties: DatabaseConfig = {
  mongodb_uri: MONGODB_CONNECTION_URI,
};

export const databaseConfig = () => ({
  database: databaseConfigProperties,
});
