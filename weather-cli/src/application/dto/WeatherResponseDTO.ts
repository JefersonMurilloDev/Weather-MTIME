/**
 * DTO para la respuesta de datos climáticos
 * Proporciona una estructura limpia para devolver datos al cliente
 */
export interface WeatherResponseDTO {
  /** Ciudad solicitada */
  city: string;
  /** País de la ciudad */
  country: string;
  /** Temperatura actual */
  temperature: number;
  /** Sensación térmica */
  feelsLike: number;
  /** Temperatura mínima */
  minTemperature: number;
  /** Temperatura máxima */
  maxTemperature: number;
  /** Presión atmosférica en hPa */
  pressure: number;
  /** Humedad relativa en porcentaje */
  humidity: number;
  /** Visibilidad en metros */
  visibility: number;
  /** Velocidad del viento en m/s */
  windSpeed: number;
  /** Dirección del viento en grados */
  windDirection: number;
  /** Condición general del clima */
  condition: string;
  /** Descripción detallada del clima */
  description: string;
  /** URL del icono representativo */
  icon?: string;
  /** Unidades de temperatura usadas */
  units: TemperatureUnitDTO;
  /** Fecha y hora de la medición */
  timestamp: string;
  /** Coordenadas geográficas (opcional) */
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

/**
 * DTO para la respuesta de múltiples ciudades
 */
export interface WeatherListResponseDTO {
  /** País solicitado */
  country: string;
  /** Número total de ciudades encontradas */
  totalCities: number;
  /** Lista de datos climáticos por ciudad */
  cities: WeatherResponseDTO[];
  /** Unidades de temperatura usadas */
  units: TemperatureUnitDTO;
}

/**
 * Unidades de temperatura disponibles
 */
export type TemperatureUnitDTO = 'celsius' | 'fahrenheit' | 'kelvin';

/**
 * DTO para representar un error en la respuesta
 */
export interface ErrorResponseDTO {
  /** Indica que la operación falló */
  success: false;
  /** Mensaje de error en español */
  message: string;
  /** Código único del error */
  errorCode: string;
  /** Detalles adicionales del error (opcional) */
  details?: unknown;
  /** Sugerencia al usuario para resolver el error */
  suggestion?: string;
}
