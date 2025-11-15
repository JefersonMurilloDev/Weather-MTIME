/**
 * Sistema de manejo de errores sin excepciones
 * Inspirado en Result Pattern de lenguajes como Rust y Go
 *
 * Permite manejar errores de forma explícita y type-safe
 * sin recurrir a excepciones que rompen el flujo del programa
 */

/**
 * Tipo genérico para representar un valor exitoso
 */
export interface Success<T> {
  success: true;
  value: T;
}

/**
 * Tipo genérico para representar un error
 */
export interface Failure<E> {
  success: false;
  error: E;
}

/**
 * Tipo Result que puede ser éxito o error
 */
export type Result<T, E = Error> = Success<T> | Failure<E>;

/**
 * Crea un resultado exitoso
 * @param value - Valor a envolver
 * @returns Result con éxito
 */
export function ok<T>(value: T): Success<T> {
  return {
    success: true,
    value
  };
}

/**
 * Crea un resultado con error
 * @param error - Error a envolver
 * @returns Result con error
 */
export function err<E>(error: E): Failure<E> {
  return {
    success: false,
    error
  };
}

/**
 * Type guard para verificar si es un resultado exitoso
 */
export function isOk<T, E>(result: Result<T, E>): result is Success<T> {
  return result.success === true;
}

/**
 * Type guard para verificar si es un resultado con error
 */
export function isErr<T, E>(result: Result<T, E>): result is Failure<E> {
  return result.success === false;
}

/**
 * Mapea el valor de un resultado si es exitoso
 * @param result - Result a mapear
 * @param fn - Función de mapeo
 * @returns Nuevo Result con el valor mapeado
 */
export function map<T, U, E>(
  result: Result<T, E>,
  fn: (value: T) => U
): Result<U, E> {
  if (isOk(result)) {
    return ok(fn(result.value));
  }
  return result;
}

/**
 * Maneja ambos casos (éxito o error) de un Result
 * @param result - Result a procesar
 * @param onSuccess - Función a ejecutar si es exitoso
 * @param onError - Función a ejecutar si hay error
 * @returns Resultado de la función correspondiente
 */
export function match<T, E, U>(
  result: Result<T, E>,
  onSuccess: (value: T) => U,
  onError: (error: E) => U
): U {
  if (isOk(result)) {
    return onSuccess(result.value);
  }
  return onError(result.error);
}
