import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { DoctorDocument } from '../../common/models/doctor.schema';

const getCurrentDoctorByContext = (
  context: ExecutionContext,
): DoctorDocument => {
  if (context.switchToHttp().getRequest().user) {
    return context.switchToHttp().getRequest().user;
  }
};

export const CurrentDoctor = createParamDecorator(
  (_data: unknown, context: ExecutionContext) =>
    getCurrentDoctorByContext(context),
);
