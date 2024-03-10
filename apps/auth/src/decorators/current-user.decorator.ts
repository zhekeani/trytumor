import { ExecutionContext, createParamDecorator } from '@nestjs/common';
import { UserDocument } from '../users/models/user.schema';

const getCurrentUserByContext = (context: ExecutionContext): UserDocument => {
  return context.switchToHttp().getRequest().user;
};

// Decorator that returns "user" property set by AuthGuard if authentication
// success
export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext) =>
    getCurrentUserByContext(context),
);
