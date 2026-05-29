export class ChavrutaError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly originalError?: unknown
  ) {
    super(message);
    this.name = 'ChavrutaError';
  }

  static fromError(error: unknown, defaultMessage: string): ChavrutaError {
    if (error instanceof ChavrutaError) {
      return error;
    }

    const message = error instanceof Error ? error.message : defaultMessage;
    return new ChavrutaError(message, 'UNKNOWN_ERROR', error);
  }
}

export const ErrorCodes = {
  TRACK_NOT_FOUND: 'TRACK_NOT_FOUND',
  INVALID_STATUS: 'INVALID_STATUS',
  FETCH_ERROR: 'FETCH_ERROR',
  UPDATE_ERROR: 'UPDATE_ERROR',
} as const;
