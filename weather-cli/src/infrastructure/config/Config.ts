/**
 * Gestión centralizada de la configuración de la aplicación
 * Lee desde variables de entorno, archivos de configuración, etc.
 */
import * as dotenv from 'dotenv';
import { z } from 'zod';
import { TemperatureUnit } from '@domain/entities/Weather';
import { LogLevelString } from '@infrastructure/logger/Logger';

/**
 * Esquema de validación para la configuración
 * Asegura que las variables de entorno sean válidas al iniciar
 */
const ConfigSchema = z.object({
  // Configuración del API
  weatherApi: z.object({
    key: z.string().min(10, 'La API key debe tener al menos 10 caracteres'),
    baseUrl: z.string().url('Debe ser una URL válida').default('https://api.openweathermap.org/data/2.5'),
    timeout: z.number().int().positive().default(5000),
    maxRetries: z.number().int().min(0).max(5).default(3),
    retryDelay: z.number().int().positive().default(1000)
  }),

  // Configuración del CLI
  cli: z.object({
    defaultUnits: z.nativeEnum(TemperatureUnit).default(TemperatureUnit.CELSIUS),
    defaultLanguage: z.string().length(2).default('es'),
    showProgress: z.boolean().default(true)
  }),

  // Configuración de logging
  logging: z.object({
    level: z.custom<LogLevelString>((val) =>
      ['debug', 'info', 'warn', 'error'].includes(val as string)
    ).default('info'),
    enableColors: z.boolean().default(true),
    logFile: z.string().optional()
  }),

  // Configuración de caché
  cache: z.object({
    enabled: z.boolean().default(true),
    ttlSeconds: z.number().int().positive().default(600), // 10 minutos
    maxEntries: z.number().int().positive().default(100)
  }),

  // Configuración general
  app: z.object({
    nodeEnv: z.enum(['development', 'test', 'production']).default('development'),
    version: z.string().default('1.0.0'),
    provider: z.enum(['open-meteo', 'openweather']).default('open-meteo')
  })
});

type AppConfigType = z.infer<typeof ConfigSchema>;

/**
 * Clase singleton para gestionar la configuración
 */
export class AppConfig {
  private static instance: AppConfig | null = null;
  private readonly config: AppConfigType;

  private constructor() {
    // Cargar variables de entorno
    dotenv.config();

    // Construir configuración a partir del esquema
    const rawConfig = this.buildRawConfig();

    try {
      // Validar y parsear la configuración
      this.config = ConfigSchema.parse(rawConfig);

      // Verificar si estamos en modo desarrollo
      if (this.isDevelopment()) {
        console.log('✅ Configuración cargada exitosamente');
      }
    } catch (error) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'errors' in error &&
        Array.isArray((error as any).errors)
      ) {
        console.error('❌ Errores de configuración:');
        (error as any).errors.forEach((err: any) => {
          console.error(`  - ${err.path.join('.')}: ${err.message}`);
        });
      } else {
        console.error('❌ Error inesperado al validar la configuración:');
        console.error(error);
      }
      throw new Error('Configuración inválida. Verifica las variables de entorno.');
    }
  }

  /**
   * Obtiene la instancia singleton
   */
  static getInstance(): AppConfig {
    if (!AppConfig.instance) {
      AppConfig.instance = new AppConfig();
    }
    return AppConfig.instance;
  }

  /**
   * Este método es solo para testing - resetea la instancia
   */
  static reset(): void {
    AppConfig.instance = null;
  }

  /**
   * Construye el objeto de configuración crudo
   */
  private buildRawConfig(): Record<string, unknown> {
    return {
      weatherApi: {
        key: process.env["OPENWEATHER_API_KEY"],
        baseUrl: process.env["OPENWEATHER_BASE_URL"],
        timeout: parseInt(process.env["WEATHER_API_TIMEOUT"] || '5000', 10),
        maxRetries: parseInt(process.env["WEATHER_API_MAX_RETRIES"] || '3', 10),
        retryDelay: parseInt(process.env["WEATHER_API_RETRY_DELAY"] || '1000', 10)
      },
      cli: {
        defaultUnits: process.env["WEATHER_CLI_DEFAULT_UNITS"],
        defaultLanguage: process.env["WEATHER_CLI_DEFAULT_LANGUAGE"],
        showProgress: process.env["WEATHER_CLI_SHOW_PROGRESS"] !== 'false'
      },
      logging: {
        level: process.env["LOG_LEVEL"],
        enableColors: process.env["NO_COLOR"] !== 'true',
        logFile: process.env["LOG_FILE"]
      },
      cache: {
        enabled: process.env["CACHE_ENABLED"] !== 'false',
        ttlSeconds: parseInt(process.env["CACHE_TTL_SECONDS"] || '600', 10),
        maxEntries: parseInt(process.env["CACHE_MAX_ENTRIES"] || '100', 10)
      },
      app: {
        nodeEnv: process.env["NODE_ENV"],
        version: process.env["npm_package_version"] || '1.0.0',
        provider: (process.env["WEATHER_PROVIDER"] as 'open-meteo' | 'openweather' | undefined) || 'open-meteo'
      }
    };
  }

  // Getters para acceder a la configuración de forma type-safe

  get weatherApi() {
    return this.config.weatherApi;
  }

  get cli() {
    return this.config.cli;
  }

  get logging() {
    return this.config.logging;
  }

  get cache() {
    return this.config.cache;
  }

  get app() {
    return this.config.app;
  }

  /**
   * Verifica si estamos en desarrollo
   */
  isDevelopment(): boolean {
    return this.config.app.nodeEnv === 'development';
  }

  /**
   * Verifica si estamos en testing
   */
  isTest(): boolean {
    return this.config.app.nodeEnv === 'test';
  }

  /**
   * Verifica si estamos en producción
   */
  isProduction(): boolean {
    return this.config.app.nodeEnv === 'production';
  }
}

// Exportar tipos útiles
export type { AppConfigType };
export const appConfig = AppConfig.getInstance();
