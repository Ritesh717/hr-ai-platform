import { AsyncLocalStorage } from 'node:async_hooks';

export interface RequestContextStore {
  requestId: string;
}

// Mirrors shared/logging/setup.py's `request_id_ctx` ContextVar: one storage cell threaded
// through a request's lifetime, read by both the JSON log formatter and the error envelope.
export const requestContext = new AsyncLocalStorage<RequestContextStore>();

export function getRequestId(): string | null {
  return requestContext.getStore()?.requestId ?? null;
}
