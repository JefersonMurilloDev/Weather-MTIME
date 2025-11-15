/**
 * Errores específicos de la capa de aplicación
 * Extienden los errores de dominio proporcionando contexto adicional
 */

import {
  DomainError,
  ValidationError as BaseValidationError
} from '@shared/errors';

/**
 * Error cuando falla la validación en la capa de aplicación
 */
export class UseCaseValidationError extends BaseValidationError {
  constructor(message: string, field?: string) {
    super(`Error de validación: ${message}`, field);
  }
}

/**
 * Error cuando falla la autorización en un caso de uso
 */
export class UseCaseAuthorizationError extends DomainError {
  constructor(useCase: string, reason?: string) {
    super(
      `No autorizado para ejecutar ${useCase}${reason ? `: ${reason}` : ''}`,
      'USE_CASE_UNAUTHORIZED',
      true,
      403
    );
  }
}

/**
 * Error cuando ocurre un problema de infraestructura durante la ejecución
 */
export class InfrastructureError extends DomainError {
  constructor(operation: string, details?: string) {
    super(
      `Error de infraestructura durante ${operation}${details ? `: ${details}` : ''}`,
      'INFRASTRUCTURE_ERROR',
      true,
      503
    );
  }
}

/**
 * Error cuando se excede el límite de reintentos
 */
export class RetryLimitExceededError extends DomainError {
  constructor(operation: string, attempts: number) {
    super(
      `Se excedió el límite de ${attempts} intentos para ${operation}`,
      'RETRY_LIMIT_EXCEEDED',
      true,
      429
    );
  }
}
