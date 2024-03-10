import {
  CallHandler,
  ExecutionContext,
  NestInterceptor,
  UseInterceptors,
} from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { Observable, map } from 'rxjs';
import { ClassConstructor } from '../interfaces/class-constructor.interface';

// Create decorator to implement the SerializeInterceptor
export const Serialize = (dto: ClassConstructor) => {
  return UseInterceptors(new SerializeInterceptor(dto));
};

// Interceptor to serialize returned response to exclude certain
// properties
class SerializeInterceptor implements NestInterceptor {
  // Type safety, the dto provided must be a class
  constructor(private readonly dto: ClassConstructor) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Observable<any> | Promise<Observable<any>> {
    // Run before a request is handled

    return next.handle().pipe(
      map((data: any) => {
        // Run before response is sent out

        return plainToClass(this.dto, data, {
          // Exclude properties specified in the dto
          excludeExtraneousValues: true,
        });
      }),
    );
  }
}
