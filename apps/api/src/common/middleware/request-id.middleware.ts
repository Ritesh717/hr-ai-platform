import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { requestContext } from '../request-context';

const HEADER = 'x-request-id';

// Mirrors apps/api/middleware/request_id.py: reads X-Request-ID or generates one, threads it
// through the request via AsyncLocalStorage (the ContextVar analogue), echoes it back on the
// response so client and server logs can be correlated.
@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const requestId = (req.headers[HEADER] as string | undefined) || uuidv4();
    res.setHeader('X-Request-ID', requestId);
    requestContext.run({ requestId }, () => next());
  }
}
