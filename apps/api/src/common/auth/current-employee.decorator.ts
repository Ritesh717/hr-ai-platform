import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { CurrentEmployee as CurrentEmployeeType } from './current-employee';

// Mirrors `current: CurrentEmployee = Depends(get_current_employee)` in the FastAPI routers.
export const CurrentEmployee = createParamDecorator((_: unknown, ctx: ExecutionContext): CurrentEmployeeType => {
  const request = ctx.switchToHttp().getRequest<Request & { user: CurrentEmployeeType }>();
  return request.user;
});
