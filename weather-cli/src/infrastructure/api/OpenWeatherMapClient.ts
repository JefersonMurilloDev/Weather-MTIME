/**
 * Cliente HTTP para la API de OpenWeatherMap
 * Implementa la interfaz WeatherAPIClient y maneja toda la comunicación externa
 */
import axios, { AxiosInstance, AxiosError } from "axios";
import { injectable, inject } from "tsyringe";
import {
  ConfigurationError,
  ApiError,
  ApplicationError,
} from "@shared/errors/DomainError";
import { parseWeatherResponse, isAPIError } from "./WeatherAPIResponse";
import { Type as WeatherResponseType } from "./WeatherAPIResponse";

/**
 * Interfaz de configuración para el cliente
 */
export interface WeatherAPIConfig {
  apiKey: string;
  baseURL: string;
  timeout: number;
  maxRetries: number;
  retryDelay: number;
}

/**
 * Cliente HTTP que se conecta a OpenWeatherMap API
 * Gestiona: autenticación, reintentos, timeouts, rate limiting
 */
@injectable()
export class OpenWeatherMapClient {
  private readonly client: AxiosInstance;
  private readonly geoClient: AxiosInstance;
  private readonly config: WeatherAPIConfig;
  private readonly logger = console; // Usar console temporalmente

  constructor(@inject("WeatherAPIConfig") config: WeatherAPIConfig) {
    this.config = config;

    // Validar configuración
    if (!config.apiKey) {
      throw new ConfigurationError("OpenWeatherMap", "API_KEY");
    }

    if (!config.baseURL) {
      throw new ConfigurationError("OpenWeatherMap", "BASE_URL");
    }

    // Crear cliente axios configurado para /data/2.5/*
    this.client = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout,
      params: {
        appid: config.apiKey,
      },
    });

    // Cliente separado para geocoding (/geo/1.0/*)
    this.geoClient = axios.create({
      baseURL: "https://api.openweathermap.org",
      timeout: config.timeout,
      params: {
        appid: config.apiKey,
      },
    });

    // Añadir interceptores de logging
    this.setupInterceptors();
  }

  /**
   * Obtiene el clima actual por nombre de ciudad
   *
   * Estrategia recomendada por la documentación:
   * 1) Usar API de geocoding (/geo/1.0/direct) para obtener lat/lon
   * 2) Consultar /data/2.5/weather por coordenadas
   */
  async getCurrentWeatherByCityName(
    cityName: string,
    countryCode?: string,
    units?: string,
  ): Promise<WeatherResponseType> {
    this.logger.info(
      `Consultando clima para ciudad: ${cityName}, ${countryCode || "Sin país"}`,
    );

    const coords = await this.resolveCoordinates(cityName, countryCode);
    return this.getCurrentWeatherByCoordinates(
      coords.lat,
      coords.lon,
      units,
    );
  }

  /**
   * Obtiene el clima actual por coordenadas geográficas
   */
  async getCurrentWeatherByCoordinates(
    lat: number,
    lon: number,
    units?: string,
  ): Promise<WeatherResponseType> {
    this.logger.info(`Consultando clima por coordenadas: ${lat}, ${lon}`);

    const response = await this.executeWithRetry(() =>
      this.client.get("/weather", {
        params: {
          lat,
          lon,
          units: units || "metric",
          mode: "json",
        },
      }),
    );

    return response;
  }

  /**
   * Obtiene el clima para múltiples ciudades por país
   */
  async getCitiesByCountry(
    countryCode: string,
    limit: number = 5,
  ): Promise<WeatherResponseType[]> {
    this.logger.info(
      `Consultando clima para ${limit} ciudades en país: ${countryCode}`,
    );

    // Debido a que OpenWeatherMap API no tiene un endpoint directo para obtener
    // el clima de múltiples ciudades por país, implementamos una alternativa:
    try {
      const response = await this.client.get("/find", {
        params: {
          q: countryCode,
          type: "like",
          sort: "population",
          cnt: limit,
          units: "metric",
        },
      });

      // Si el endpoint devuelve una lista de ciudades
      if (response.data && response.data.list) {
        return response.data.list.map((item: any) =>
          parseWeatherResponse(item),
        );
      }

      // Si es una sola ciudad, devolver como array
      return [parseWeatherResponse(response.data)];
    } catch (error) {
      this.logger.error(`Error al consultar país ${countryCode}:`, error);
      throw this.handleAPIError(error);
    }
  }

  /**
   * Ejecuta una petición HTTP con manejo de errores
   */
  private async executeWithRetry(
    requestFn: () => Promise<any>,
  ): Promise<WeatherResponseType> {
    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try {
        this.logger.log(`Intento ${attempt} de ${this.config.maxRetries}`);

        const response = await requestFn();
        const data = response.data;

        // Verificar si la respuesta es un error de API
        if (isAPIError(data)) {
          throw new Error(`API Error ${data.cod}: ${data.message}`);
        }

        // Parsear y validar la respuesta
        return parseWeatherResponse(data);
      } catch (error) {
        // Si es un error de rate limiting, esperar más tiempo
        if (this.isRateLimitError(error)) {
          const retryAfter =
            this.getRetryAfter(error) || this.config.retryDelay * attempt;

          this.logger.warn(
            `Rate limit alcanzado. Reintentando después de ${retryAfter}ms`,
          );

          await this.delay(retryAfter);
          continue;
        }

        // Si es un error no operacional, no reintentar
        if (!this.isRetryableError(error)) {
          this.logger.error("Error no recuperable:", error);
          throw error;
        }

        // Esperar antes del siguiente intento
        if (attempt < this.config.maxRetries) {
          const delayTime = this.config.retryDelay * attempt;
          this.logger.warn(
            `Error en intento ${attempt}. Reintentando después de ${delayTime}ms`,
          );
          await this.delay(delayTime);
        }
      }
    }

    // Todos los intentos fallaron
    throw new ApplicationError(
      `Fallaron todos los intentos después de ${this.config.maxRetries} veces`,
      "MAX_RETRIES_EXCEEDED",
    );
  }

  private async resolveCoordinates(
    cityName: string,
    countryCode?: string,
  ): Promise<{ lat: number; lon: number; name: string; country?: string }> {
    const query = countryCode ? `${cityName},${countryCode}` : cityName;

    this.logger.info(
      `Resolviendo coordenadas via OpenWeatherMap Geocoding para: ${query}`,
    );

    const response = await this.geoClient.get("/geo/1.0/direct", {
      params: {
        q: query,
        limit: 1,
      },
    });

    const results = response.data as
      | Array<{
          name: string;
          lat: number;
          lon: number;
          country?: string;
        }>
      | undefined;

    if (!results || results.length === 0) {
      throw new ApiError(
        `No se encontraron coordenadas para ${query}`,
        "OpenWeatherMap",
        404,
      );
    }

    const result = results[0]!;

    const baseResult: {
      lat: number;
      lon: number;
      name: string;
      country?: string;
    } = {
      lat: result.lat,
      lon: result.lon,
      name: result.name,
    };

    if (result.country) {
      baseResult.country = result.country;
    }

    return baseResult;
  }

  /**
   * Configura los interceptores de axios para logging
   */
  private setupInterceptors(): void {
    // Interceptor de petición
    this.client.interceptors.request.use(
      (config) => {
        this.logger.log(`→ ${config.method?.toUpperCase()} ${config.url}`, {
          params: config.params,
          headers: {
            // Ocultar API key del log
            ...config.headers,
            "x-api-key": config.headers["x-api-key"] ? "[REDACTED]" : undefined,
          },
        });
        return config;
      },
      (error) => {
        this.logger.error("Error en petición:", error);
        return Promise.reject(error);
      },
    );

    // Interceptor de respuesta
    this.client.interceptors.response.use(
      (response) => {
        this.logger.log(`← ${response.status} ${response.config.url}`);
        return response;
      },
      (error: AxiosError) => {
        // Manejo específico de errores HTTP
        if (error.response) {
          const status = error.response.status;
          const url = error.config?.url;

          this.logger.error(
            `Error HTTP ${status} para ${url}:`,
            error.response.data,
          );

          switch (status) {
            case 401:
              return Promise.reject(
                new ConfigurationError("OpenWeatherMap", "API_KEY_INVALID"),
              );
            case 403:
              return Promise.reject(
                new ApiError("Acceso denegado", "OpenWeatherMap", 403),
              );
            case 404:
              return Promise.reject(
                new ApiError("Recurso no encontrado", "OpenWeatherMap", 404),
              );
            case 429:
              return Promise.reject(
                ApiError.rateLimit(
                  "OpenWeatherMap",
                  error.response.headers?.["retry-after"],
                ),
              );
          }
        } else if (error.request) {
          this.logger.error("Sin respuesta del servidor:", error.message);
          return Promise.reject(
            ApiError.timeout("OpenWeatherMap", this.config.timeout),
          );
        }

        return Promise.reject(error);
      },
    );
  }

  /**
   * Determina si un error es de rate limiting
   */
  private isRateLimitError(error: unknown): boolean {
    if (error instanceof AxiosError && error.response) {
      return error.response.status === 429;
    }
    return false;
  }

  /**
   * Obtiene el header Retry-After si existe
   */
  private getRetryAfter(error: unknown): number | null {
    if (error instanceof AxiosError && error.response) {
      const retryAfter = error.response.headers["retry-after"];
      if (retryAfter) {
        const seconds = parseInt(retryAfter, 10);
        return seconds * 1000; // Convertir a milisegundos
      }
    }
    return null;
  }

  /**
   * Determina si un error es recuperable (debe reintentarse)
   */
  private isRetryableError(error: unknown): boolean {
    if (error instanceof AxiosError) {
      // Reintentar errores de red
      if (!error.response) {
        return true;
      }

      // Reintentar errores 5xx y 429 (rate limit)
      const status = error.response.status;
      return status >= 500 || status === 429 || status === 408;
    }

    // Reintentar errores de timeout
    if (error instanceof Error) {
      return error.message.toLowerCase().includes("timeout");
    }

    return false;
  }

  /**
   * Función auxiliar para esperar un tiempo determinado
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Maneja errores específicos de la API
   */
  private handleAPIError(error: unknown): Error {
    // El error ya puede estar procesado por los interceptores
    if (error instanceof Error) {
      return error;
    }

    return new ApplicationError(
      "Error desconocido en la API de clima",
      "UNKNOWN_API_ERROR",
    );
  }
}
