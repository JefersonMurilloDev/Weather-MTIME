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

import { CityValidatorService, SimpleCityValidator } from '@infrastructure/validation/CityValidator';
import { CountryValidatorService, SimpleCountryValidator } from '@infrastructure/validation/CountryValidator';

import { CacheService } from '@domain/services/CacheService';
import { MemoryCacheAdapter } from '@infrastructure/cache/MemoryCacheAdapter';
import { WeatherCacheAdapter, WeatherCacheService } from '@infrastructure/cache/WeatherCacheAdapter';

// MongoDB
import { HistoryRepository } from '@domain/repositories/HistoryRepository';
import { MongoConnection } from '@infrastructure/database/MongoConnection';
import { MongoHistoryRepository } from '@infrastructure/repositories/MongoHistoryRepository';
import { HistoryService } from '@application/services/HistoryService';

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
  container.registerSingleton<CacheService>(
    'CacheService',
    MemoryCacheAdapter,
  );

  // 6. Registrar servicio de caché específico para clima por país
  container.registerSingleton<WeatherCacheService>(
    'WeatherCacheService',
    WeatherCacheAdapter,
  );

  // 7. Registrar MongoDB (solo si está habilitado)
  if (appConfig.mongodb.enabled) {
    logger.debug('🔄 MongoDB habilitado, registrando conexión...');
    
    const mongoConnection = MongoConnection.getInstance({
      uri: appConfig.mongodb.uri,
      maxPoolSize: appConfig.mongodb.maxPoolSize,
      connectTimeoutMS: appConfig.mongodb.connectTimeoutMS,
    });

    container.registerInstance('MongoConnection', mongoConnection);

    container.registerSingleton<HistoryRepository>(
      'HistoryRepository',
      MongoHistoryRepository,
    );

    // Registrar servicio de historial
    container.registerSingleton<HistoryService>(
      'HistoryService',
      HistoryService,
    );

    // Pre-conectar a MongoDB en background (no bloquea)
    mongoConnection.connect().catch((err) => {
      logger.warn('No se pudo pre-conectar a MongoDB:', err);
    });

    logger.debug('✅ MongoDB configurado');
  } else {
    logger.debug('MongoDB deshabilitado, usando historial en archivo');
  }

  // 8. Registrar Casos de Uso (constructor injection con @inject)
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
