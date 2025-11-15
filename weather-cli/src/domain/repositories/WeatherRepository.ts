/**
 * Interfaz que define el contrato para obtener datos climáticos
 * Esta interfaz forma parte del dominio y no depende de implementaciones externas
 * Cumple con el principio de inversión de dependencias (DIP)
 */
import { Weather, TemperatureUnit } from "../entities/Weather";
import { City } from "../entities/City";
import { Coordinates } from "../value-objects/Coordinates";

/**
 * DTO que encapsula los parámetros para buscar el clima
 */
export interface WeatherQueryParams {
  city: City;
  units?: TemperatureUnit;
  language?: string;
}

/**
 * Resultado de la búsqueda de clima que incluye información adicional
 */
export interface WeatherResult {
  weather: Weather;
  city: City;
  requestedAt: Date;
}

/**
 * Interfaz para el repositorio de clima
 * Define las operaciones disponibles sin especificar cómo se implementan
 */
export interface WeatherRepository {
  /**
   * Obtiene el clima actual para una ciudad específica
   * @param params - Parámetros de búsqueda incluyendo la ciudad
   * @returns Promise que resuelve con el resultado del clima
   * @throws ApplicationError si ocurre algún error durante la búsqueda
   */
  getByCity(params: WeatherQueryParams): Promise<WeatherResult>;

  /**
   * Obtiene el clima actual basado en coordenadas geográficas
   * @param coordinates - Coordenadas geográficas
   * @param units - Unidades de temperatura (opcional)
   * @returns Promise que resuelve con el resultado del clima
   */
  getByCoordinates(
    coordinates: Coordinates,
    units?: TemperatureUnit,
  ): Promise<WeatherResult>;

  /**
   * Obtiene el clima para múltiples ciudades de un país
   * @param countryCode - Código ISO del país
   * @param limit - Número máximo de ciudades a devolver
   * @returns Promise que resuelve con array de resultados climáticos
   */
  getByCountry(countryCode: string, limit?: number): Promise<WeatherResult[]>;
}
