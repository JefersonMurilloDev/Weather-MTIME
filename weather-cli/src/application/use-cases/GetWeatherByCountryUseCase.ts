/**
 * Caso de uso para obtener el clima de múltiples ciudades en un país
 * Permite consultar el clima de varias ciudades importantes simultáneamente
 */
import { injectable, inject } from "tsyringe";
import {
  WeatherRepository,
  WeatherResult,
  TemperatureUnit,
} from "../../domain/index";
import {
  Result,
  ok,
  err,
  ValidationError,
  NotFoundError,
} from "../../shared/index";
import { ApiError, ApplicationError, DomainError } from "@shared/errors/DomainError";
import { GetWeatherByCountryRequestDTO } from "../dto/WeatherRequestDTO";
import { WeatherListResponseDTO } from "../dto/WeatherResponseDTO";

/**
 * Entrada interna del caso de uso
 */
interface GetWeatherByCountryInput {
  countryCode: string;
  limit: number;
  units: TemperatureUnit;
  language?: string;
}

/**
 * Servicio de validación de países
 */
interface CountryValidatorService {
  validateCountryCode(code: string): boolean;
  normalizeCountryCode(code: string): string;
  getCountryName(code: string): string;
}

/**
 * Servicio de caché para optimizar consultas repetidas
 */
interface WeatherCacheService {
  get(key: string): Promise<WeatherResult[] | null>;
  set(key: string, value: WeatherResult[]): Promise<void>;
  generateKey(country: string, limit: number): string;
}

@injectable()
export class GetWeatherByCountryUseCase {
  constructor(
    @inject("WeatherRepository")
    private readonly weatherRepository: WeatherRepository,

    @inject("CountryValidatorService")
    private readonly countryValidator: CountryValidatorService,

    @inject("WeatherCacheService")
    private readonly cacheService: WeatherCacheService,
  ) {}

  /**
   * Ejecuta la obtención de clima por país
   * @param request - DTO con los datos de la petición
   * @returns Result con la lista de climas o un error
   */
  async execute(
    request: GetWeatherByCountryRequestDTO,
  ): Promise<Result<WeatherListResponseDTO, DomainError>> {
    try {
      // Paso 1: Validar entrada
      const validationResult = this.validateRequest(request);
      if (!validationResult.success) {
        return err(validationResult.error);
      }

      // Paso 2: Transformar entrada
      const input = this.transformInput(request);

      // Paso 3: Verificar caché
      const cacheKey = this.cacheService.generateKey(
        input.countryCode,
        input.limit,
      );

      const cachedResult = await this.cacheService.get(cacheKey);
      if (cachedResult) {
        const response = this.transformToDTO(cachedResult, input.countryCode);
        return ok(response);
      }

      // Paso 4: Obtener climas del repositorio
      let weatherResults: WeatherResult[];
      try {
        weatherResults = await this.weatherRepository.getByCountry(
          input.countryCode,
          input.limit,
        );
      } catch (error) {
        return this.handleRepositoryError(error);
      }

      // Paso 5: Guardar en caché
      await this.cacheService.set(cacheKey, weatherResults);

      // Paso 6: Transformar a DTO de respuesta
      const response = this.transformToDTO(weatherResults, input.countryCode);

      return ok(response);
    } catch {
      return err(
        new ApplicationError(
          "Error inesperado al procesar la solicitud por país",
          "UNEXPECTED_ERROR",
        ),
      );
    }
  }

  /**
   * Valida la petición entrante
   */
  private validateRequest(
    request: GetWeatherByCountryRequestDTO,
  ): Result<true, ValidationError> {
    // Validar país
    if (!request.country || request.country.trim().length === 0) {
      return err(ValidationError.forField("country", "El país es requerido"));
    }

    // Validar límite
    if (request.limit !== undefined) {
      if (request.limit < 1 || request.limit > 50) {
        return err(
          ValidationError.forField(
            "limit",
            "El límite debe estar entre 1 y 50",
          ),
        );
      }
    }

    return ok(true as const);
  }

  /**
   * Transforma el DTO de entrada al formato interno
   */
  private transformInput(
    request: GetWeatherByCountryRequestDTO,
  ): GetWeatherByCountryInput {
    const normalizedCountry = this.countryValidator.normalizeCountryCode(
      request.country,
    );

    const units: TemperatureUnit =
      request.units === "fahrenheit"
        ? TemperatureUnit.FAHRENHEIT
        : request.units === "kelvin"
        ? TemperatureUnit.KELVIN
        : TemperatureUnit.CELSIUS;

    return {
      countryCode: normalizedCountry,
      limit: request.limit || 5,
      units,
      language: request.language || "es",
    };
  }

  /**
   * Transforma los resultados del dominio al DTO de respuesta
   */
  private transformToDTO(
    results: WeatherResult[],
    countryCode: string,
  ): WeatherListResponseDTO {
    const countryName = this.countryValidator.getCountryName(countryCode);

    return {
      country: countryName,
      totalCities: results.length,
      cities: results.map((result) => this.mapWeatherResultToDTO(result)),
      units: "celsius", // Por defecto, se puede parametrizar
    };
  }

  /**
   * Mapea un WeatherResult individual al formato DTO para la lista
   */
  private mapWeatherResultToDTO(result: WeatherResult): any {
    const weather = result.weather;

    return {
      city: result.city.name,
      country: result.city.country,
      temperature: weather.temperature,
      feelsLike: weather.feelsLike,
      minTemperature: weather.minTemperature,
      maxTemperature: weather.maxTemperature,
      pressure: weather.pressure,
      humidity: weather.humidity,
      visibility: weather.visibility,
      windSpeed: weather.windSpeed,
      windDirection: weather.windDirection,
      condition: weather.condition,
      description: weather.description,
      timestamp: weather.timestamp.toISOString(),
      units: "celsius",
    };
  }

  /**
   * Maneja errores del repositorio
   */
  private handleRepositoryError(
    error: unknown,
  ): Result<WeatherListResponseDTO, DomainError> {
    if (error instanceof NotFoundError) {
      return err(error);
    }

    if (error instanceof ApiError) {
      return err(error);
    }

    return err(
      new ApiError(
        "Error al obtener datos del país",
        "OpenWeatherMap",
        undefined,
        true,
      ),
    );
  }
}
