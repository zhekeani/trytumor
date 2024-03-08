import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ModelDefinition, MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    // Create mongodb database connection from MONGODB_URI
    // so mongoose model can interact with database
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get('MONGODB_URI'),
      }),
    }),
  ],
})
export class DatabaseModule {
  // Reimplementing the forFeature method, so the caller
  // doesn't need both DatabaseModule & MongooseModule
  // forFeature method used for injecting model within
  // DI system
  static forFeature(models: ModelDefinition[]) {
    return MongooseModule.forFeature(models);
  }
}
