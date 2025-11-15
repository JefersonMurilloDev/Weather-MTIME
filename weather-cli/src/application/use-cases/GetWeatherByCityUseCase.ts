/**
 * Caso de uso para obtener el clima de una ciudad específica
 * Este es el núcleo de la lógica de negocio para la funcionalidad "clima por ciudad"
 */
import { injectable, inject } from "tsyringe";
import {
  WeatherRepository,
  WeatherQueryParams,
  WeatherResult,
  City,
  Weather,
  TemperatureUnit,
} from "../../domain/index";
import {
  Result,
  ok,
  err,
  ValidationError,
  NotFoundError,
  ApiError,
} from "../../shared/index";
import { GetWeatherByCityRequestDTO } from "../dto/WeatherRequestDTO";
import { DomainError, ApplicationError } from "@shared/errors/DomainError";

/**
 * DTO transformado interno con entidades del dominio
 */
interface GetWeatherByCityInput {
  cityName: string;
  countryCode?: string;
  units: TemperatureUnit;
  language?: string;
}

/**
 * Salida del caso de uso con datos formateados
 */
interface GetWeatherByCityOutput {
  weather: Weather;
  city: City;
  formatted: {
    display: string;
    temperature: string;
    conditions: string;
  };
}

/**
 * Interfaz para el servicio de validación
 */
interface CityValidatorService {
  validateCityName(name: string): boolean;
  validateCountryCode(code: string): boolean;
  normalizeCityName(name: string): string;
}

@injectable()
export class GetWeatherByCityUseCase {
  constructor(
    @inject("WeatherRepository")
    private readonly weatherRepository: WeatherRepository,

    @inject("CityValidatorService")
    private readonly cityValidator: CityValidatorService,
  ) {}

  /**
   * Ejecuta el caso de uso para obtener el clima por ciudad
   * @param request - DTO con los datos de la petición
   * @returns Result con el clima obtenido o un error específico
   */
  async execute(
    request: GetWeatherByCityRequestDTO,
  ): Promise<Result<GetWeatherByCityOutput, DomainError>> {
    try {
      // Paso 1: Validar entrada
      const validationResult = this.validateRequest(request);
      if (!validationResult.success) {
        return err(validationResult.error);
      }

      // Paso 2: Transformar DTO a entidades de dominio
      const domainInput = this.transformToDomain(request);

      // Paso 3: Crear ciudad
      let city: City;
      try {
        city = new City(
          domainInput.cityName,
          domainInput.countryCode || "ES",
          undefined, // latitud se obtendrá del API
          undefined, // longitud se obtendrá del API
        );
      } catch (error) {
        return err(
          new ValidationError(
            error instanceof Error ? error.message : "Error al crear la ciudad",
          ),
        );
      }

      // Paso 4: Preparar parámetros para el repositorio
      const queryParams: WeatherQueryParams = {
        city,
        units: domainInput.units,
        ...(domainInput.language ? { language: domainInput.language } : {}),
      };

      // Paso 5: Intentar obtener el clima
      let weatherResult: WeatherResult;
      try {
        weatherResult = await this.weatherRepository.getByCity(queryParams);
      } catch (error) {
        return this.handleRepositoryError(error);
      }

      // Paso 6: Formatear la respuesta para el usuario
      const output = this.formatOutput(weatherResult, domainInput.units);

      return ok(output);
    } catch {
      // Error inesperado
      return err(
        new ApplicationError(
          "Error inesperado al procesar la solicitud",
          "UNEXPECTED_ERROR",
        ),
      );
    }
  }

  /**
   * Valida que la petición contenga datos válidos
   */
  private validateRequest(
    request: GetWeatherByCityRequestDTO,
  ): Result<true, ValidationError> {
    // Validar nombre de ciudad
    if (!request.cityName || request.cityName.trim().length === 0) {
      return err(
        ValidationError.forField(
          "cityName",
          "El nombre de la ciudad es requerido",
        ),
      );
    }

    if (request.cityName.length < 2) {
      return err(
        ValidationError.forField(
          "cityName",
          "El nombre debe tener al menos 2 caracteres",
        ),
      );
    }

    // Validar código de país si se proporciona
    if (request.countryCode) {
      if (!this.cityValidator.validateCountryCode(request.countryCode)) {
        return err(
          ValidationError.forField("countryCode", "Código de país inválido"),
        );
      }
    }

    // Validar unidades de temperatura
    if (
      request.units &&
      !["celsius", "fahrenheit", "kelvin"].includes(request.units)
    ) {
      return err(
        ValidationError.forField("units", "Unidad de temperatura no soportada"),
      );
    }

    return ok(true as const);
  }

  /**
   * Transforma el DTO a formato de dominio
   */
  private transformToDomain(
    request: GetWeatherByCityRequestDTO,
  ): GetWeatherByCityInput {
    const normalizedCityName = this.cityValidator.normalizeCityName(
      request.cityName,
    );
    const units: TemperatureUnit =
      request.units === "fahrenheit"
        ? TemperatureUnit.FAHRENHEIT
        : request.units === "kelvin"
        ? TemperatureUnit.KELVIN
        : TemperatureUnit.CELSIUS;

    return {
      cityName: normalizedCityName,
      ...(request.countryCode ? { countryCode: request.countryCode } : {}),
      units,
      language: request.language || "es",
    };
  }

  /**
   * Maneja los errores del repositorio y los convierte a errores de dominio
   */
  private handleRepositoryError(
    error: unknown,
  ): Result<GetWeatherByCityOutput, DomainError> {
    if (error instanceof NotFoundError) {
      return err(error);
    }

    if (error instanceof ApiError) {
      return err(error);
    }

    if (error instanceof ValidationError) {
      return err(error);
    }

    // Error de conexión o timeout
    if (error instanceof Error && error.message.includes("timeout")) {
      return err(ApiError.timeout("OpenWeatherMap", 5000));
    }

    // Error desconocido
    return err(
      new ApiError(
        "Error al comunicarse con el servicio de clima",
        "OpenWeatherMap",
        undefined,
        false,
      ),
    );
  }

  /**
   * Formatea la salida para mostrar al usuario
   */
  private formatOutput(
    result: WeatherResult,
    units: TemperatureUnit,
  ): GetWeatherByCityOutput {
    const unitSymbol = this.getUnitSymbol(units);
    const temp = result.weather.getTemperatureInUnit(units);

    return {
      weather: result.weather,
      city: result.city,
      formatted: {
        display: `Clima en ${result.city.toString()}`,
        temperature: `${temp.toFixed(1)}°${unitSymbol}`,
        conditions:
          result.weather.description.charAt(0).toUpperCase() +
          result.weather.description.slice(1),
      },
    };
  }

  /**
   * Obtiene el símbolo de unidad según el tipo
   */
  private getUnitSymbol(units: TemperatureUnit): string {
    switch (units) {
      case TemperatureUnit.CELSIUS:
        return "C";
      case TemperatureUnit.FAHRENHEIT:
        return "F";
      case TemperatureUnit.KELVIN:
        return "K";
      default:
        return "°";
    }
  }
}
