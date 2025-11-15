import axios, { AxiosInstance } from "axios";
import { injectable } from "tsyringe";
import { Type as WeatherApiType } from "./WeatherAPIResponse";

/**
 * Cliente HTTP simple para Open-Meteo (sin API key)
 *
 * Este cliente adapta las respuestas de Open-Meteo al formato
 * esperado por nuestro dominio (similar a OpenWeatherMap) para
 * reutilizar el mismo repositorio y mapeos.
 */
@injectable()
export class OpenMeteoClient {
  private readonly geoClient: AxiosInstance;
  private readonly weatherClient: AxiosInstance;

  constructor() {
    this.geoClient = axios.create({
      baseURL: "https://geocoding-api.open-meteo.com/v1",
      timeout: 5000,
    });

    this.weatherClient = axios.create({
      baseURL: "https://api.open-meteo.com/v1",
      timeout: 5000,
    });
  }

  /**
   * Implementa la firma compatible con WeatherAPIClient.getCurrentWeatherByCityName
   */
  async getCurrentWeatherByCityName(
    cityName: string,
    countryCode?: string,
    units?: string,
  ): Promise<WeatherApiType> {
    const coords = await this.resolveCoordinates(cityName, countryCode);

    const unitParam = units === "imperial" ? "fahrenheit" : units === "standard" ? "kelvin" : "celsius";

    const response = await this.weatherClient.get("/forecast", {
      params: {
        latitude: coords.lat,
        longitude: coords.lon,
        temperature_unit: unitParam,
        current: [
          "temperature_2m",
          "relative_humidity_2m",
          "apparent_temperature",
          "pressure_msl",
          "wind_speed_10m",
          "wind_direction_10m",
        ].join(","),
        timezone: "auto",
      },
    });

    const data = response.data;
    const current = data.current;

    // Adaptar respuesta de Open-Meteo al tipo esperado por nuestro repositorio
    const adapted: WeatherApiType = {
      coord: {
        lat: coords.lat,
        lon: coords.lon,
      },
      weather: [
        {
          id: 0,
          main: "Clear",
          description: "Clear sky (Open-Meteo)",
          icon: "01d",
        },
      ],
      base: "stations",
      main: {
        temp: current.temperature_2m,
        feels_like: current.apparent_temperature ?? current.temperature_2m,
        temp_min: current.temperature_2m,
        temp_max: current.temperature_2m,
        pressure: current.pressure_msl ?? 1013,
        humidity: current.relative_humidity_2m ?? 50,
      },
      visibility: 10000,
      wind: {
        speed: current.wind_speed_10m ?? 0,
        deg: current.wind_direction_10m ?? 0,
        gust: undefined,
      },
      clouds: {
        all: undefined,
      },
      dt: Math.floor(Date.now() / 1000),
      sys: {
        country: coords.country,
        sunrise: undefined,
        sunset: undefined,
      },
      timezone: 0,
      id: 0,
      name: coords.name,
      cod: 200,
    };

    return adapted;
  }

  async getCurrentWeatherByCoordinates(
    lat: number,
    lon: number,
    units?: string,
  ): Promise<WeatherApiType> {
    const unitParam = units === "imperial" ? "fahrenheit" : units === "standard" ? "kelvin" : "celsius";

    const response = await this.weatherClient.get("/forecast", {
      params: {
        latitude: lat,
        longitude: lon,
        temperature_unit: unitParam,
        current: [
          "temperature_2m",
          "relative_humidity_2m",
          "apparent_temperature",
          "pressure_msl",
          "wind_speed_10m",
          "wind_direction_10m",
        ].join(","),
        timezone: "auto",
      },
    });

    const data = response.data;
    const current = data.current;

    const adapted: WeatherApiType = {
      coord: { lat, lon },
      weather: [
        {
          id: 0,
          main: "Clear",
          description: "Clear sky (Open-Meteo)",
          icon: "01d",
        },
      ],
      base: "stations",
      main: {
        temp: current.temperature_2m,
        feels_like: current.apparent_temperature ?? current.temperature_2m,
        temp_min: current.temperature_2m,
        temp_max: current.temperature_2m,
        pressure: current.pressure_msl ?? 1013,
        humidity: current.relative_humidity_2m ?? 50,
      },
      visibility: 10000,
      wind: {
        speed: current.wind_speed_10m ?? 0,
        deg: current.wind_direction_10m ?? 0,
        gust: undefined,
      },
      clouds: {
        all: undefined,
      },
      dt: Math.floor(Date.now() / 1000),
      sys: {
        country: undefined,
        sunrise: undefined,
        sunset: undefined,
      },
      timezone: 0,
      id: 0,
      name: "",
      cod: 200,
    };

    return adapted;
  }

  async getCitiesByCountry(): Promise<WeatherApiType[]> {
    // Implementación mínima para no romper la interfaz; se podría
    // ampliar si quieres soporte real por país.
    return [];
  }

  private async resolveCoordinates(
    cityName: string,
    countryCode?: string,
  ): Promise<{ lat: number; lon: number; name: string; country?: string }> {
    // Usamos any aquí porque la estructura de params depende del proveedor
    const params: any = {
      name: cityName,
      count: 1,
      language: "es",
      format: "json",
    };

    if (countryCode) {
      params.countryCode = countryCode.toUpperCase();
    }

    const response = await this.geoClient.get("/search", { params });

    const results = response.data?.results as
      | Array<{ latitude: number; longitude: number; name: string; country_code?: string }>
      | undefined;

    if (!results || results.length === 0) {
      throw new Error(
        `No se encontraron coordenadas para ${cityName}${countryCode ? ", " + countryCode : ""}`,
      );
    }

    const result = results[0]!;

    const baseResult: {
      lat: number;
      lon: number;
      name: string;
      country?: string;
    } = {
      lat: result.latitude,
      lon: result.longitude,
      name: result.name,
    };

    if (result.country_code) {
      baseResult.country = result.country_code;
    }

    return baseResult;
  }
}
