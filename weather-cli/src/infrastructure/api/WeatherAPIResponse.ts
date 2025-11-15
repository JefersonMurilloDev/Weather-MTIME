/**
 * Esquemas y tipos para la respuesta de la API de OpenWeatherMap
 * Utiliza Zod para validación y generación de tipos TypeScript seguros
 */
import { z } from 'zod';

/**
 * Esquema de coordenadas geográficas
 */
const CoordinateSchema = z.object({
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180)
});

/**
 * Esquema principal del clima
 */
const WeatherSchema = z.object({
  id: z.number(),
  main: z.string(),
  description: z.string(),
  icon: z.string()
});

/**
 * Esquema de temperaturas principales
 */
const MainSchema = z.object({
  temp: z.number(),
  feels_like: z.number(),
  temp_min: z.number(),
  temp_max: z.number(),
  pressure: z.number().positive(),
  humidity: z.number().min(0).max(100)
});

/**
 * Esquema de viento
 */
const WindSchema = z.object({
  speed: z.number().min(0),
  deg: z.number().optional(),
  gust: z.number().optional()
});

/**
 * Esquema de nubes
 */
const CloudsSchema = z.object({
  all: z.number().min(0).max(100).optional()
});

/**
 * Esquema de información del país
 */
const SysSchema = z.object({
  country: z.string().length(2).optional(),
  sunrise: z.number().optional(),
  sunset: z.number().optional()
});

/**
 * Esquema de respuesta principal de OpenWeatherMap
 */
const OpenWeatherResponseSchema = z.object({
  coord: CoordinateSchema,
  weather: z.array(WeatherSchema),
  base: z.string().optional(),
  main: MainSchema,
  visibility: z.number().min(0).max(10000).optional(),
  wind: WindSchema,
  clouds: CloudsSchema.optional(),
  dt: z.number(),
  sys: SysSchema,
  timezone: z.number().optional(),
  id: z.number().optional(),
  name: z.string(),
  cod: z.number()
});

/**
 * Tipo TypeScript inferido del esquema
 */
export type Type = z.infer<typeof OpenWeatherResponseSchema>;

/**
 * Tipo para errores de API específicos
 */
export const APIErrorSchema = z.object({
  cod: z.union([z.string(), z.number()]),
  message: z.string()
});

export type APIError = z.infer<typeof APIErrorSchema>;

/**
 * Función para parsear y validar la respuesta de la API
 * @param data - Datos crudos de la respuesta
 * @returns Datos validados o lanza error si son inválidos
 */
export function parseWeatherResponse(data: unknown): Type {
  try {
    return OpenWeatherResponseSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Respuesta de API inválida: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Función para detectar si la respuesta es un error de API
 * @param data - Datos de respuesta
 * @returns true si es un error, false si es respuesta válida
 */
export function isAPIError(data: unknown): data is APIError {
  try {
    APIErrorSchema.parse(data);
    return true;
  } catch {
    return false;
  }
}
