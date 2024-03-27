import { ExecutionContext, createParamDecorator } from '@nestjs/common';

export const AuthToken = createParamDecorator(
  (data: never, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest();

    if (request?.cookies && request?.cookies?.Authentication) {
      return request.cookies.Authentication;
    }
  },
);
