import { logger } from './logger';

export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 500,
    public readonly context?: Record<string, any>
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const handleError = (
  error: unknown,
  context: string,
  defaultMessage = 'An unexpected error occurred'
): { error: string; statusCode: number } => {
  if (error instanceof AppError) {
    logger.error(`[${context}] ${error.code}:`, error.message, error.context);
    return {
      error: error.message,
      statusCode: error.statusCode,
    };
  }

  // Handle Prisma errors
  if (error && typeof error === 'object' && 'code' in error) {
    const prismaError = error as { code: string; message: string };
    if (prismaError.code === 'P2002') {
      logger.error(`[${context}] Unique constraint violation:`, prismaError);
      return {
        error: 'This record already exists',
        statusCode: 400,
      };
    }
  }

  // Log unknown errors
  logger.error(`[${context}] Unexpected error:`, error);
  return {
    error: defaultMessage,
    statusCode: 500,
  };
};

// Common error instances
export const Errors = {
  Unauthorized: new AppError('Unauthorized', 'UNAUTHORIZED', 401),
  NotFound: new AppError('Resource not found', 'NOT_FOUND', 404),
  BadRequest: (message: string) => new AppError(message, 'BAD_REQUEST', 400),
  Forbidden: new AppError('Forbidden', 'FORBIDDEN', 403),
  ValidationError: (message: string) => new AppError(message, 'VALIDATION_ERROR', 400),
  DatabaseError: (message: string) => new AppError(message, 'DATABASE_ERROR', 500),
}; 