/**
 * Clase base para todos los errores de la aplicación
 * Extiende la clase Error nativa con propiedades adicionales
 * para un mejor manejo de errores
 */
export interface DomainErrorJSON {
  name: string;
  message: string;
  code: string;
  httpCode?: number;
  isOperational: boolean;
  stack?: string;
}

export abstract class DomainError extends Error {
  /**
   * Código único que identifica el tipo de error
   */
  public readonly code: string;

  /**
   * Código HTTP asociado (útil para APIs REST)
   */
  public readonly httpCode: number | undefined;

  /**
   * Si el error es por culpa del cliente o del servidor
   */
  public readonly isOperational: boolean;

  constructor(
    message: string,
    code: string,
    isOperational = true,
    httpCode?: number
  ) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
    this.code = code;
    this.isOperational = isOperational;
    this.httpCode = httpCode;
    this.name = this.constructor.name;

    // Mantiene el stack trace en V8
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Convierte el error a un objeto plano para serialización
   */
  toJSON(): DomainErrorJSON {
    const base: DomainErrorJSON = {
      name: this.name,
      message: this.message,
      code: this.code,
      isOperational: this.isOperational,
    };

    if (this.httpCode !== undefined) {
      base.httpCode = this.httpCode;
    }

    if (this.stack) {
      base.stack = this.stack;
    }

    return base;
  }
}

/**
 * Error cuando una entidad no es encontrada
 */
export class NotFoundError extends DomainError {
  constructor(resource: string, identifier: string) {
    super(
      `${resource} con identificador '${identifier}' no fue encontrado`,
      'RESOURCE_NOT_FOUND',
      true,
      404
    );
  }
}

/**
 * Error cuando los datos proporcionados son inválidos
 */
export class ValidationError extends DomainError {
  private readonly _field: string | undefined;

  constructor(message: string, field?: string) {
    super(message, 'VALIDATION_ERROR', true, 400);
    this._field = field;
  }

  get field(): string | undefined {
    return this._field;
  }

  /**
   * Crea un error de validación para un campo específico
   */
  static forField(field: string, message: string): ValidationError {
    return new ValidationError(
      `Campo '${field}': ${message}`,
      field
    );
  }
}

/**
 * Error cuando ocurre un problema con una API externa
 */
export class ApiError extends DomainError {
  public readonly statusCode: number | undefined;

  constructor(
    message: string,
    service: string,
    statusCode?: number,
    isOperational = true
  ) {
    super(
      `Error en servicio ${service}: ${message}`,
      'EXTERNAL_API_ERROR',
      isOperational,
      statusCode
    );
    this.statusCode = statusCode;
  }

  /**
   * Crea un error de timeout específico
   */
  static timeout(service: string, timeoutMs: number): ApiError {
    return new ApiError(
      `Tiempo de espera agotado (${timeoutMs}ms)`,
      service
    );
  }

  /**
   * Crea un error de límite de rate alcanzado
   */
  static rateLimit(service: string, retryAfter?: number): ApiError {
    const message = retryAfter
      ? `Límite de peticiones excedido. Reintentar después de ${retryAfter}s`
      : 'Límite de peticiones excedido';

    return new ApiError(message, service, 429, true);
  }
}

/**
 * Error cuando el usuario no está autorizado
 */
export class UnauthorizedError extends DomainError {
  constructor(message = 'No autorizado para realizar esta acción') {
    super(message, 'UNAUTHORIZED', true, 401);
  }
}

/**
 * Error cuando faltan credenciales o configuración
 */
export class ConfigurationError extends DomainError {
  constructor(service: string, missingField?: string) {
    const message = missingField
      ? `Falta configuración '${missingField}' para ${service}`
      : `Configuración incompleta para ${service}`;

    super(message, 'CONFIGURATION_ERROR', true, 500);
  }
}

/**
 * Error genérico de aplicación
 */
export class ApplicationError extends DomainError {
  constructor(
    message: string,
    code = 'APPLICATION_ERROR',
    isOperational = true
  ) {
    super(message, code, isOperational, 500);
  }
}
