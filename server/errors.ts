import type { ApiErrorCode } from '../shared/types';

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: ApiErrorCode,
    message: string,
    public retryAfter?: number,
  ) {
    super(message);
  }
}
