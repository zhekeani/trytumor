import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';
import { isMongoId } from 'class-validator';

@Injectable()
export class ValidateObjectId implements PipeTransform {
  async transform(value: any, metadata: ArgumentMetadata) {
    const isValid = isMongoId(value);
    if (!isValid) {
      throw new BadRequestException('Invalid MongoDB ObjectID');
    }
    return value;
  }
}
