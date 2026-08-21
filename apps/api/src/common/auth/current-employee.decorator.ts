import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { CurrentEmployee as CurrentEmployeeType } from './current-employee';

// Route handler parameter that extracts the JWT-resolved CurrentEmployee from req.user.
export const CurrentEmployee = createParamDecorator((_: unknown, ctx: ExecutionContext): CurrentEmployeeType => {
  const request = ctx.switchToHttp().getRequest<Request & { user: CurrentEmployeeType }>();
  return request.user;
});
