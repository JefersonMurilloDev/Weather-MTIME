/**
 * DTO (Data Transfer Object) para la petición de clima por ciudad
 * Utilizado para transferir datos entre la capa de presentación y aplicación
 */
export interface GetWeatherByCityRequestDTO {
  /** Nombre de la ciudad */
  cityName: string;
  /** Código ISO del país (opcional) */
  countryCode?: string;
  /** Unidades de temperatura: celsius, fahrenheit o kelvin */
  units?: 'celsius' | 'fahrenheit' | 'kelvin';
  /** Idioma para la descripción del clima */
  language?: string;
}

/**
 * DTO para la petición de clima por coordenadas
 */
export interface GetWeatherByCoordinatesRequestDTO {
  /** Latitud geográfica */
  latitude: number;
  /** Longitud geográfica */
  longitude: number;
  /** Unidades de temperatura (opcional) */
  units?: 'celsius' | 'fahrenheit' | 'kelvin';
  /** Idioma (opcional) */
  language?: string;
}

/**
 * DTO para la petición de clima por país
 */
export interface GetWeatherByCountryRequestDTO {
  /** Código ISO del país o nombre completo */
  country: string;
  /** Número máximo de ciudades a devolver (por defecto 5) */
  limit?: number;
  /** Unidades de temperatura (opcional) */
  units?: 'celsius' | 'fahrenheit' | 'kelvin';
  /** Idioma (opcional) */
  language?: string;
}
