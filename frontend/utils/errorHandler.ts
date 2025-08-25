export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public status: number
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const handleError = (error: unknown) => {
  if (error instanceof AppError) {
    // Handle application-specific errors
    console.error(`[${error.code}] ${error.message}`);
    return error;
  }

  if (error instanceof Error) {
    // Handle standard errors
    console.error(error.message);
    return new AppError(error.message, 'UNKNOWN_ERROR', 500);
  }

  // Handle unknown errors
  console.error('An unknown error occurred');
  return new AppError('An unknown error occurred', 'UNKNOWN_ERROR', 500);
}; 