/**
 * Configuración de inyección de dependencias con TSyringe
 *
 * Responsable de registrar y resolver todas las dependencias de la aplicación
 * según el patrón de inversión de dependencias (DIP)
 */

import { container } from 'tsyringe';
import { WeatherRepository } from '@domain/repositories/WeatherRepository';
import { WeatherRepositoryImpl } from '@infrastructure/repositories/WeatherRepositoryImpl';
import { GetWeatherByCityUseCase } from '@application/use-cases/GetWeatherByCityUseCase';
import { GetWeatherByCountryUseCase } from '@application/use-cases/GetWeatherByCountryUseCase';
// Cliente OpenWeatherMap
import { OpenWeatherMapClient } from '@infrastructure/api/OpenWeatherMapClient';
// Cliente basado en Open-Meteo (sin API key)
import { OpenMeteoClient } from '@infrastructure/api/OpenMeteoClient';
import { ConsoleLogger, Logger } from '@infrastructure/logger/Logger';
import { appConfig } from '@infrastructure/config/Config';

// Logger global del contenedor, configurado según appConfig
const logger: Logger = new ConsoleLogger({
  level: appConfig.logging.level,
  enableColors: appConfig.logging.enableColors,
  enableTimestamp: true,
  includeStackTrace: appConfig.isDevelopment(),
  timestampFormat: 'iso'
});

/**
 * Interfaz para servicios de validación (serán implementados más adelante)
 */
interface CityValidatorService {
  validateCityName(name: string): boolean;
  validateCountryCode(code: string): boolean;
  normalizeCityName(name: string): string;
}

interface CountryValidatorService {
  validateCountryCode(code: string): boolean;
  normalizeCountryCode(code: string): string;
  getCountryName(code: string): string;
}

interface WeatherCacheService {
  get(key: string): Promise<any | null>;
  set(key: string, value: any): Promise<void>;
  generateKey(country: string, limit: number): string;
}

/**
 * Implementaciones temporales de validators
 */
class SimpleCityValidator implements CityValidatorService {
  validateCityName(name: string): boolean {
    return name.length >= 2 && /^[a-zA-Z\s\-']+$/.test(name);
  }

  validateCountryCode(code: string): boolean {
    // Validar códigos ISO 2 letras
    return code.length === 2 && /^[A-Z]{2}$/.test(code);
  }

  normalizeCityName(name: string): string {
    return name.trim().replace(/\s+/g, ' ');
  }
}

class SimpleCountryValidator implements CountryValidatorService {
  private readonly isoCodes = new Set(['ES', 'US', 'MX', 'AR', 'CO', 'PE', 'CL', 'BR', 'FR', 'DE', 'IT', 'PT']);

  validateCountryCode(code: string): boolean {
    return this.isoCodes.has(code.toUpperCase());
  }

  normalizeCountryCode(code: string): string {
    return code.toUpperCase().trim();
  }

  getCountryName(code: string): string {
    const names: Record<string, string> = {
      'ES': 'España',
      'US': 'Estados Unidos',
      'MX': 'México',
      'AR': 'Argentina',
      'CO': 'Colombia',
      'PE': 'Perú',
      'CL': 'Chile',
      'BR': 'Brasil',
      'FR': 'Francia',
      'DE': 'Alemania',
      'IT': 'Italia',
      'PT': 'Portugal'
    };

    return names[code] || code;
  }
}

class InMemoryCache implements WeatherCacheService {
  private cache = new Map<string, any>();

  async get(key: string): Promise<any | null> {
    return this.cache.get(key) || null;
  }

  async set(key: string, value: any): Promise<void> {
    this.cache.set(key, value);

    // Limitar el tamaño del cache
    if (this.cache.size > 100) {
      // Eliminar el entry más antiguo
      const iterator = this.cache.keys().next();
      if (!iterator.done) {
        this.cache.delete(iterator.value);
      }
    }
  }

  generateKey(country: string, limit: number): string {
    return `country:${country}:${limit}`;
  }
}

/**
 * Configura el container de dependencias
 * Registra todas las abstracciones y sus implementaciones concretas
 */
export function configureContainer(): void {
  logger.debug('Configurando contenedor de dependencias...');

  // 1. Registrar configuración como valor
  container.registerInstance('WeatherAPIConfig', {
    apiKey: appConfig.weatherApi.key,
    baseURL: appConfig.weatherApi.baseUrl,
    timeout: appConfig.weatherApi.timeout,
    maxRetries: appConfig.weatherApi.maxRetries,
    retryDelay: appConfig.weatherApi.retryDelay
  });

  // 2. Registrar servicios de infrastructure
  container.register<Logger>('Logger', { useValue: logger });

  // Registrar cliente de API de clima según proveedor configurado
  if (appConfig.app.provider === 'openweather') {
    container.registerSingleton<OpenWeatherMapClient>(
      'WeatherAPIClient',
      OpenWeatherMapClient,
    );
  } else {
    container.registerSingleton<OpenMeteoClient>(
      'WeatherAPIClient',
      OpenMeteoClient,
    );
  }

  // 3. Registrar Repository que depende de WeatherAPIClient
  container.registerSingleton<WeatherRepository>(
    'WeatherRepository',
    WeatherRepositoryImpl,
  );

  // 4. Registrar validadores
  container.registerSingleton<CityValidatorService>(
    'CityValidatorService',
    SimpleCityValidator,
  );

  container.registerSingleton<CountryValidatorService>(
    'CountryValidatorService',
    SimpleCountryValidator,
  );

  // 5. Registrar servicios de cache
  container.registerSingleton<WeatherCacheService>(
    'WeatherCacheService',
    InMemoryCache,
  );

  // 6. Registrar Casos de Uso (constructor injection con @inject)
  container.registerSingleton(GetWeatherByCityUseCase, GetWeatherByCityUseCase);
  container.registerSingleton(GetWeatherByCountryUseCase, GetWeatherByCountryUseCase);

  logger.debug('✅ Contenedor de dependencias configurado');
}

/**
 * Obtiene una instancia de un caso de uso del container
 */
export function getUseCase<T>(token: any): T {
  return container.resolve(token);
}

/**
 * Obtiene una dependencia por su token
 */
export function getDependency<T>(token: string): T {
  return container.resolve(token);
}

/**
 * Limpiar el container (útil para testing)
 */
export function clearContainer(): void {
  container.clearInstances();
  container.reset();
  logger.debug('Contenedor reiniciado');
}
