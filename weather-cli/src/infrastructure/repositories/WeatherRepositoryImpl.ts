/**
 * Implementación concreta del repositorio de clima
 * Se conecta a la API de OpenWeatherMap para obtener datos reales
 * Implementa el patrón Repository para abstraer el acceso a datos
 */
import { injectable, inject } from 'tsyringe';
import {
  WeatherRepository,
  WeatherQueryParams,
  WeatherResult,
  City,
  Weather,
  WeatherCondition,
  TemperatureUnit,
  Coordinates
} from '@domain/index';
import { CacheService } from '@domain/services/CacheService';
import { Type } from '@infrastructure/api/WeatherAPIResponse';
import {
  NotFoundError,
  ApiError,
  ConfigurationError
} from '@shared';
import { Logger } from '@infrastructure/logger/Logger';
import { ApplicationError } from '@shared/errors';
import { CountryCitiesRepository } from '@domain/repositories/CountryCitiesRepository';
import { getCitiesForCountry } from '@infrastructure/data/CitiesByCountry';

/**
 * Interfaz para el cliente HTTP de la API de clima
 */
export interface WeatherAPIClient {
  getCurrentWeatherByCityName(
    cityName: string,
    countryCode?: string,
    units?: string
  ): Promise<Type>;

  getCurrentWeatherByCoordinates(
    lat: number,
    lon: number,
    units?: string
  ): Promise<Type>;

  getCitiesByCountry(
    countryCode: string,
    limit?: number
  ): Promise<Type[]>;
}

/**
 * Mapeador de unidades de temperatura a parámetros de API
 */
const UNIT_TO_API_PARAM: Record<TemperatureUnit, string> = {
  [TemperatureUnit.CELSIUS]: 'metric',
  [TemperatureUnit.FAHRENHEIT]: 'imperial',
  [TemperatureUnit.KELVIN]: 'standard'
};

/**
 * Mapeador de condiciones de API a enum del dominio
 */
const API_CONDITION_TO_DOMAIN: Record<string, WeatherCondition> = {
  'Clear': WeatherCondition.CLEAR,
  'Clouds': WeatherCondition.CLOUDS,
  'Rain': WeatherCondition.RAIN,
  'Drizzle': WeatherCondition.DRIZZLE,
  'Thunderstorm': WeatherCondition.THUNDERSTORM,
  'Snow': WeatherCondition.SNOW,
  'Mist': WeatherCondition.MIST,
  'Fog': WeatherCondition.FOG,
  'Haze': WeatherCondition.HAZE
};

@injectable()
export class WeatherRepositoryImpl implements WeatherRepository {
  private countryCitiesRepo: CountryCitiesRepository | null = null;

  constructor(
    @inject('WeatherAPIClient')
    private readonly apiClient: WeatherAPIClient,

    @inject('Logger')
    private readonly logger: Logger,

    @inject('CacheService')
    private readonly cacheService: CacheService
  ) {
    // Intentar obtener el repositorio de ciudades (opcional)
    try {
      const { container } = require('tsyringe');
      if (container.isRegistered('CountryCitiesRepository')) {
        this.countryCitiesRepo = container.resolve('CountryCitiesRepository');
      }
    } catch {
      // MongoDB no está habilitado, usar fallback local
    }
  }

  /**
   * Obtiene el clima actual para una ciudad específica
   */
  async getByCity(params: WeatherQueryParams): Promise<WeatherResult> {
    const cacheKey = `weather:city:${params.city.name}:${params.city.country}:${params.units}`;

    try {
      // Intentar obtener del caché
      const cached = await this.cacheService.get<WeatherResult>(cacheKey);
      if (cached) {
        this.logger.debug(`Cache hit para ${params.city.toString()}`);
        // Restaurar prototipos si es necesario (al serializar/deserializar se pierden métodos)
        // Por simplicidad en memoria, asumimos que se mantiene el objeto,
        // pero en un caché real (Redis) habría que re-hidratar las entidades.
        return cached;
      }
    } catch (error) {
      this.logger.warn('Error al leer del caché', { error: String(error) });
    }

    this.logger.info(
      `Obteniendo clima para ciudad: ${params.city.toString()}`
    );

    try {
      // Llamar a la API externa
      const apiResponse = await this.apiClient.getCurrentWeatherByCityName(
        params.city.name,
        params.city.country,
        params.units ? UNIT_TO_API_PARAM[params.units] : undefined
      );

      // Mapear respuesta de API a entidades del dominio
      const weather = this.mapAPIToWeather(apiResponse);
      const city = this.mapAPIToCity(apiResponse);

      const result: WeatherResult = {
        weather,
        city,
        requestedAt: new Date()
      };

      // Guardar en caché (TTL 10 minutos por defecto)
      try {
        await this.cacheService.set(cacheKey, result);
      } catch (error) {
        this.logger.warn('Error al guardar en caché', { error: String(error) });
      }

      this.logger.info(
        `Clima obtenido exitosamente para ${city.toString()}`
      );

      return result;

    } catch (error) {
      // Manejar diferentes tipos de errores de API
      if (error instanceof Error) {
        this.logger.error('Error al obtener clima por ciudad:', error);
      } else {
        this.logger.error('Error al obtener clima por ciudad:', {
          name: 'UnknownError',
          message: String(error),
        });
      }

      throw this.handleAPIError(error, params.city.toString());
    }
  }

  /**
   * Obtiene el clima basado en coordenadas geográficas
   */
  async getByCoordinates(
    coordinates: Coordinates,
    units?: TemperatureUnit
  ): Promise<WeatherResult> {
    this.logger.info(
      `Obteniendo clima por coordenadas: ${coordinates.toString()}`
    );

    try {
      const apiResponse = await this.apiClient.getCurrentWeatherByCoordinates(
        coordinates.latitude,
        coordinates.longitude,
        units ? UNIT_TO_API_PARAM[units] : undefined
      );

      const weather = this.mapAPIToWeather(apiResponse);
      const city = this.mapAPIToCity(apiResponse);

      return {
        weather,
        city,
        requestedAt: new Date()
      };

    } catch (error) {
      if (error instanceof Error) {
        this.logger.error('Error al obtener clima por coordenadas:', error);
      } else {
        this.logger.error('Error al obtener clima por coordenadas:', {
          name: 'UnknownError',
          message: String(error),
        });
      }

      throw this.handleAPIError(error, `coords(${coordinates.toString()})`);
    }
  }

  /**
   * Obtiene el clima para múltiples ciudades en un país
   * Usa búsqueda dinámica, con fallback a lista predefinida
   */
  async getByCountry(
    countryCode: string,
    limit?: number
  ): Promise<WeatherResult[]> {
    const upperCountry = countryCode.toUpperCase();
    const maxCities = limit && limit > 0 ? limit : 5;

    this.logger.info(
      `Obteniendo clima para ${maxCities} ciudades en país: ${upperCountry}`
    );

    // Intentar obtener ciudades desde MongoDB primero
    let cities: string[] | undefined;
    
    if (this.countryCitiesRepo) {
      try {
        cities = await this.countryCitiesRepo.getCitiesByCountry(upperCountry);
        if (cities && cities.length > 0) {
          this.logger.debug(`Ciudades obtenidas de MongoDB para ${upperCountry}`);
        }
      } catch (error) {
        this.logger.warn(`Error obteniendo ciudades de MongoDB: ${error}`);
      }
    }

    // Fallback al archivo local si no hay datos en MongoDB
    if (!cities || cities.length === 0) {
      cities = getCitiesForCountry(upperCountry);
      if (cities && cities.length > 0) {
        this.logger.debug(`Ciudades obtenidas del archivo local para ${upperCountry}`);
      }
    }
    
    if (cities && cities.length > 0) {
      const citiesToQuery = cities.slice(0, maxCities);
      return this.getWeatherForCities(citiesToQuery, upperCountry);
    }

    // Para países sin lista predefinida, intentar búsqueda dinámica
    this.logger.info(
      `País ${upperCountry} no tiene ciudades predefinidas, intentando búsqueda dinámica...`
    );

    try {
      // Intentar obtener ciudades dinámicamente del cliente API
      const apiResults = await this.apiClient.getCitiesByCountry(upperCountry, maxCities);
      
      if (apiResults && apiResults.length > 0) {
        return apiResults.map(apiResponse => ({
          weather: this.mapAPIToWeather(apiResponse),
          city: this.mapAPIToCity(apiResponse),
          requestedAt: new Date(),
        }));
      }
    } catch (error) {
      this.logger.warn(
        `Búsqueda dinámica falló para ${upperCountry}, el país podría no existir o no tener datos disponibles`,
        { error: String(error) }
      );
    }

    // Si todo falla, devolver array vacío con mensaje informativo
    this.logger.warn(
      `No se encontraron ciudades para el país ${upperCountry}. ` +
      `Intenta con el código ISO-2 del país (ej: ES, US, FR, DE, JP, etc.)`
    );
    return [];
  }

  /**
   * Obtiene el clima para una lista de ciudades en un país
   */
  private async getWeatherForCities(
    cities: string[],
    countryCode: string
  ): Promise<WeatherResult[]> {
    const results: WeatherResult[] = [];

    for (const cityName of cities) {
      const result = await this.tryGetWeatherForCityInCountry(
        cityName,
        countryCode,
        undefined,
      );

      if (result) {
        results.push(result);
      }
    }

    this.logger.info(
      `Obtenidos ${results.length} registros de clima para el país ${countryCode}`
    );

    return results;
  }

  private async tryGetWeatherForCityInCountry(
    cityName: string,
    countryCode: string,
    unitsParam?: string,
  ): Promise<WeatherResult | null> {
    const nameVariants = [cityName, this.normalizeCityNameForApi(cityName)];
    const countryVariants = [countryCode, undefined];

    for (const name of nameVariants) {
      for (const country of countryVariants) {
        try {
          const apiResponse = await this.apiClient.getCurrentWeatherByCityName(
            name,
            country,
            unitsParam,
          );

          return {
            weather: this.mapAPIToWeather(apiResponse),
            city: this.mapAPIToCity(apiResponse),
            requestedAt: new Date(),
          };
        } catch (error) {
          if (error instanceof Error) {
            this.logger.error(
              `Error al obtener clima para ciudad ${name} en país ${countryCode}:`,
              error,
            );
          } else {
            this.logger.error(
              `Error al obtener clima para ciudad ${name} en país ${countryCode}:`,
              {
                name: "UnknownError",
                message: String(error),
              },
            );
          }
          continue;
        }
      }
    }

    return null;
  }

  private normalizeCityNameForApi(name: string): string {
    return name
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  /**
   * Mapea la respuesta de la API a la entidad Weather del dominio
   */
  private mapAPIToWeather(apiResponse: Type): Weather {
    try {
      // Extraer datos principales
      const { main, weather: weatherArray, wind, visibility } = apiResponse;

      if (!weatherArray || weatherArray.length === 0) {
        throw new Error('Respuesta de API sin información de clima');
      }

      // Obtener la condición principal del clima
      const primaryWeather = weatherArray[0]!;
      const condition = API_CONDITION_TO_DOMAIN[primaryWeather.main] ||
        WeatherCondition.CLEAR;

      // Crear la entidad Weather
      // Nota: Asumimos que la API devuelve temperaturas en Kelvin por defecto
      return new Weather(
        main.temp,           // temperatura en Kelvin
        main.feels_like,     // sensación térmica en Kelvin
        main.temp_min,       // temperatura mínima en Kelvin
        main.temp_max,       // temperatura máxima en Kelvin
        main.pressure,       // presión atmosférica
        main.humidity,       // humedad relativa
        visibility || 10000, // visibilidad (por defecto 10km)
        wind.speed || 0,     // velocidad del viento
        wind.deg || 0,       // dirección del viento
        condition,           // condición del clima
        primaryWeather.description // descripción detallada
      );

    } catch (error) {
      if (error instanceof Error) {
        this.logger.error('Error al mapear respuesta API a Weather:', error);
      } else {
        this.logger.error('Error al mapear respuesta API a Weather:', {
          name: 'UnknownError',
          message: String(error),
        });
      }
      throw new Error('Formato de respuesta de API inválido');
    }
  }

  /**
   * Mapea la respuesta de la API a la entidad City del dominio
   */
  private mapAPIToCity(apiResponse: Type): City {
    try {
      const name = apiResponse.name ?? 'Unknown';
      const country = apiResponse.sys?.country ?? 'unknown';
      const lat = apiResponse.coord?.lat ?? 0;
      const lon = apiResponse.coord?.lon ?? 0;

      this.logger.debug(`Mapeando ciudad: name=${name}, country=${country}, lat=${lat}, lon=${lon}`);

      return new City(name, country, lat, lon);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error al mapear respuesta API a City: ${errorMessage} | name=${apiResponse.name}, country=${apiResponse.sys?.country}`);
      throw new Error(`Formato de respuesta de API inválido: ${errorMessage}`);
    }
  }

  /**
   * Maneja y clasifica los errores de la API
   */
  private handleAPIError(error: unknown, context: string): Error {
    if (error instanceof Error) {
      // Código 404 - Ciudad no encontrada
      if (error.message.includes('404') || error.message.includes('not found')) {
        return new NotFoundError('Ciudad', context);
      }

      // Código 401 - API Key inválida
      if (error.message.includes('401') || error.message.includes('Invalid API key')) {
        return new ConfigurationError('OpenWeatherMap', 'API_KEY');
      }

      // Código 429 - Límite de peticiones excedido
      if (error.message.includes('429') || error.message.includes('rate limit')) {
        return ApiError.rateLimit('OpenWeatherMap');
      }

      // Timeout
      if (error.message.toLowerCase().includes('timeout')) {
        return ApiError.timeout('OpenWeatherMap', 5000);
      }

      // Otros errores de API
      return new ApiError(
        `Error al consultar el clima: ${error.message}`,
        'OpenWeatherMap',
        undefined,
        this.isOperationalError(error.message)
      );
    }

    // Error desconocido
    return new ApplicationError(
      'Error al comunicarse con el servicio de clima',
      'API_UNKNOWN_ERROR'
    );
  }

  /**
   * Determina si un error es operacional (puede recuperarse)
   * o programático (requiere cambios en el código)
   */
  private isOperationalError(message: string): boolean {
    const operationalPatterns = [
      'timeout',
      'rate limit',
      'too many requests',
      'network',
      'connection',
      'service unavailable'
    ];

    const lowerMessage = message.toLowerCase();
    return operationalPatterns.some(pattern =>
      lowerMessage.includes(pattern)
    );
  }
}
