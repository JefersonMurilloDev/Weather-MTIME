/**
 * Sistema de logging con tipos estrictos
 * Elimina el uso de 'any' para cumplir con principios SOLID y TypeScript estricto
 */

/**
 * Niveles de log disponibles
 */
export const LogLevel = {
  DEBUG: 'debug',
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error'
} as const;

export type LogLevelString = typeof LogLevel[keyof typeof LogLevel];

/**
 * Metadatos estructurados para el logging
 */
export interface LogMetadata {
  readonly [key: string]:
    | string
    | number
    | boolean
    | null
    | ErrorInfo
    | LogMetadata
    | readonly (string | number | boolean | ErrorInfo | LogMetadata)[];
}

/**
 * Información de un error para logging
 */
export interface ErrorInfo {
  readonly name: string;
  readonly message: string;
  readonly stack?: string;
  readonly cause?: unknown;
}

/**
 * Interfaz principal para el sistema de logging
 */
export interface Logger {
  /**
   * Log de nivel debug - información detallada para debugging
   */
  debug(message: string, meta?: Readonly<LogMetadata>): void;

  /**
   * Log de nivel info - información general del flujo de la aplicación
   */
  info(message: string, meta?: Readonly<LogMetadata>): void;

  /**
   * Log de nivel warn - advertencias que no detienen la ejecución
   */
  warn(message: string, meta?: Readonly<LogMetadata>): void;

  /**
   * Log de nivel error - errores que requieren atención
   */
  error(message: string, error?: Error | ErrorInfo, meta?: Readonly<LogMetadata>): void;

  /**
   * Método genérico para logging con nivel específico
   */
  log(level: LogLevelString, message: string, meta?: Readonly<LogMetadata>): void;
}

/**
 * Configuración del logger
 */
export interface LoggerConfig {
  readonly level?: LogLevelString;
  readonly enableColors?: boolean;
  readonly enableTimestamp?: boolean;
  readonly includeStackTrace?: boolean;
  readonly timestampFormat?: 'iso' | 'locale' | 'short';
}

/**
 * Implementación de logger para consola con tipos estrictos
 */
export class ConsoleLogger implements Logger {
  private readonly config: Required<LoggerConfig>;
  private readonly levelPriority: Record<LogLevelString, number>;

  constructor(config: LoggerConfig = {}) {
    this.config = {
      level: LogLevel.INFO,
      enableColors: true,
      enableTimestamp: true,
      includeStackTrace: false,
      timestampFormat: 'iso',
      ...config
    };

    // Define la prioridad de cada nivel (mayor número = más crítico)
    this.levelPriority = {
      [LogLevel.DEBUG]: 0,
      [LogLevel.INFO]: 1,
      [LogLevel.WARN]: 2,
      [LogLevel.ERROR]: 3
    };
  }

  debug(message: string, meta?: Readonly<LogMetadata>): void {
    this.log(LogLevel.DEBUG, message, meta);
  }

  info(message: string, meta?: Readonly<LogMetadata>): void {
    this.log(LogLevel.INFO, message, meta);
  }

  warn(message: string, meta?: Readonly<LogMetadata>): void {
    this.log(LogLevel.WARN, message, meta);
  }

  error(message: string, error?: Error | ErrorInfo, meta?: Readonly<LogMetadata>): void {
    const errorInfo = this.normalizeError(error);

    const metaWithError: LogMetadata | undefined = errorInfo
      ? { ...(meta ?? {}), error: errorInfo }
      : meta;

    this.log(LogLevel.ERROR, message, metaWithError);
  }

  log(level: LogLevelString, message: string, meta?: Readonly<LogMetadata>): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const timestamp = this.config.enableTimestamp
      ? this.formatTimestamp(new Date())
      : '';

    const levelStr = level.toUpperCase().padEnd(5);
    const coloredLevel = this.config.enableColors
      ? this.applyColor(level, levelStr)
      : levelStr;

    const metaStr = meta && Object.keys(meta).length > 0
      ? this.formatMetadata(meta)
      : '';

    const logLine = [timestamp, coloredLevel, message, metaStr]
      .filter(Boolean)
      .join(' ');

    this.writeToOutput(level, logLine);
  }

  /**
   * Verifica si se debe registrar un log según su nivel
   */
  private shouldLog(level: LogLevelString): boolean {
    const messagePriority = this.levelPriority[level];
    const currentPriority = this.levelPriority[this.config.level];

    return messagePriority >= currentPriority;
  }

  /**
   * Formatea la marca de tiempo según la configuración
   */
  private formatTimestamp(date: Date): string {
    switch (this.config.timestampFormat) {
      case 'iso':
        return `[${date.toISOString()}]`;
      case 'locale':
        return `[${date.toLocaleString()}]`;
      case 'short':
        return `[${date.toLocaleTimeString()}]`;
      default:
        return `[${date.toISOString()}]`;
    }
  }

  /**
   * Aplica colores ANSI al texto del nivel
   */
  private applyColor(level: LogLevelString, text: string): string {
    if (this.isProductionOrTest()) {
      return text;
    }

    const colors: Record<LogLevelString, string> = {
      [LogLevel.DEBUG]: '\x1b[36m', // Cyan
      [LogLevel.INFO]: '\x1b[32m',   // Green
      [LogLevel.WARN]: '\x1b[33m',   // Yellow
      [LogLevel.ERROR]: '\x1b[31m'   // Red
    };

    const reset = '\x1b[0m';
    return `${colors[level]}${text}${reset}`;
  }

  /**
   * Formatea los metadatos como JSON string
   */
  private formatMetadata(meta: Readonly<LogMetadata>): string {
    try {
      return `\n${JSON.stringify(meta, null, 2)}`;
    } catch {
      return '\n[Metadatos no serializables]';
    }
  }

  /**
   * Escribe al output correspondiente según el nivel
   */
  private writeToOutput(level: LogLevelString, message: string): void {
    switch (level) {
      case LogLevel.DEBUG:
        console.debug(message);
        break;
      case LogLevel.INFO:
        console.info(message);
        break;
      case LogLevel.WARN:
        console.warn(message);
        break;
      case LogLevel.ERROR:
        console.error(message);
        break;
    }
  }

  /**
   * Normaliza un error al formato ErrorInfo
   */
  private normalizeError(error?: Error | ErrorInfo): ErrorInfo | null {
    if (!error) {
      return null;
    }

    if (this.isErrorInfo(error)) {
      return error;
    }

    const err = error as Error;

    if (this.config.includeStackTrace && err.stack) {
      return {
        name: err.name,
        message: err.message,
        stack: err.stack,
      };
    }

    return {
      name: err.name,
      message: err.message,
    };
  }

  /**
   * Verifica si un objeto es ErrorInfo
   */
  private isErrorInfo(obj: Error | ErrorInfo): obj is ErrorInfo {
    return (
      typeof obj === 'object' &&
      'message' in obj &&
      typeof obj.message === 'string' &&
      'name' in obj &&
      typeof obj.name === 'string'
    );
  }

  /**
   * Verifica si estamos en producción o entorno de pruebas
   */
  private isProductionOrTest(): boolean {
    return process.env["NODE_ENV"] === 'production' ||
           process.env["NODE_ENV"] === 'test' ||
           process.env["JEST_WORKER_ID"] !== undefined;
  }
}

/**
 * Factory para crear instancias de logger
 */
export class LoggerFactory {
  static createConsoleLogger(config?: LoggerConfig): Logger {
    return new ConsoleLogger(config);
  }

  static createFromEnvironment(): Logger {
    const config: LoggerConfig = {
      level: this.getLogLevelFromEnv(),
      enableColors: this.shouldEnableColors(),
      includeStackTrace: process.env["NODE_ENV"] === 'development',
      timestampFormat: 'iso'
    };

    return new ConsoleLogger(config);
  }

  private static getLogLevelFromEnv(): LogLevelString {
    const envLevel = process.env["LOG_LEVEL"]?.toLowerCase();

    switch (envLevel) {
      case 'debug':
        return LogLevel.DEBUG;
      case 'info':
        return LogLevel.INFO;
      case 'warn':
      case 'warning':
        return LogLevel.WARN;
      case 'error':
        return LogLevel.ERROR;
      default:
        // Por defecto, depender del entorno
        return process.env["NODE_ENV"] === 'test'
          ? LogLevel.ERROR
          : LogLevel.INFO;
    }
  }

  private static shouldEnableColors(): boolean {
    // Desactivar colores en producción, tests, o si el usuario lo solicita
    return (
      process.env["NODE_ENV"] !== 'production' &&
      process.env["NODE_ENV"] !== 'test' &&
      process.env["NO_COLOR"] === undefined
    );
  }
}

// Exportar instancia global del logger
export const logger = LoggerFactory.createFromEnvironment();

