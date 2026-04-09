export function createServiceError(message, cause) {
  const error = new Error(message);
  error.name = 'ServiceError';

  if (cause) {
    error.cause = cause;
  }

  return error;
}

export function createSupabaseServiceError(message, cause) {
  const details = [cause?.message, cause?.details, cause?.hint].filter(Boolean).join(' ');

  return createServiceError(details ? `${message} ${details}` : message, cause);
}
