import { AsyncLocalStorage } from 'node:async_hooks';

export interface RequestContextStore {
  requestId: string;
}

// One storage cell per async context, threaded through a request's lifetime.
// Read by the JSON log formatter and the error response envelope.
export const requestContext = new AsyncLocalStorage<RequestContextStore>();

export function getRequestId(): string | null {
  return requestContext.getStore()?.requestId ?? null;
}
