/**
 * Enumeración de las condiciones climáticas posibles
 * Basada en los códigos de clima estándar de OpenWeatherMap
 */
export enum WeatherCondition {
  CLEAR = 'Clear',
  CLOUDS = 'Clouds',
  RAIN = 'Rain',
  DRIZZLE = 'Drizzle',
  THUNDERSTORM = 'Thunderstorm',
  SNOW = 'Snow',
  MIST = 'Mist',
  FOG = 'Fog',
  HAZE = 'Haze'
}

/**
 * Unidades de temperatura soportadas por la aplicación
 */
export enum TemperatureUnit {
  CELSIUS = 'celsius',
  FAHRENHEIT = 'fahrenheit',
  KELVIN = 'kelvin'
}

/**
 * Entidad que representa el estado del clima en un momento específico
 * Contiene todas las métricas climáticas relevantes
 */
export class Weather {
  constructor(
    private readonly _temperature: number,
    private readonly _feelsLike: number,
    private readonly _minTemperature: number,
    private readonly _maxTemperature: number,
    private readonly _pressure: number,
    private readonly _humidity: number,
    private readonly _visibility: number,
    private readonly _windSpeed: number,
    private readonly _windDirection: number,
    private readonly _condition: WeatherCondition,
    private readonly _description: string,
    private readonly _timestamp: Date = new Date()
  ) {
    this.validateTemperature(_temperature);
    this.validateHumidity(_humidity);
    this.validatePressure(_pressure);
  }

  // Getters
  get temperature(): number {
    return this._temperature;
  }

  get feelsLike(): number {
    return this._feelsLike;
  }

  get minTemperature(): number {
    return this._minTemperature;
  }

  get maxTemperature(): number {
    return this._maxTemperature;
  }

  get pressure(): number {
    return this._pressure;
  }

  get humidity(): number {
    return this._humidity;
  }

  get visibility(): number {
    return this._visibility;
  }

  get windSpeed(): number {
    return this._windSpeed;
  }

  get windDirection(): number {
    return this._windDirection;
  }

  get condition(): WeatherCondition {
    return this._condition;
  }

  get description(): string {
    return this._description;
  }

  get timestamp(): Date {
    return this._timestamp;
  }

  /**
   * Convierte la temperatura a la unidad solicitada
   * @param unit - Unidad de temperatura deseada
   * @returns Temperatura convertida
   */
  getTemperatureInUnit(unit: TemperatureUnit): number {
    switch (unit) {
      case TemperatureUnit.CELSIUS:
        return this.convertKelvinToCelsius(this._temperature);
      case TemperatureUnit.FAHRENHEIT:
        return this.convertKelvinToFahrenheit(this._temperature);
      case TemperatureUnit.KELVIN:
      default:
        return this._temperature;
    }
  }

  /**
   * Verifica si hace frío (menos de 10°C)
   */
  isCold(): boolean {
    return this.convertKelvinToCelsius(this._temperature) < 10;
  }

  /**
   * Verifica si hace calor (más de 30°C)
   */
  isHot(): boolean {
    return this.convertKelvinToCelsius(this._temperature) > 30;
  }

  /**
   * Serializa el objeto a JSON
   */
  toJSON(): object {
    return {
      temperature: this._temperature,
      feelsLike: this._feelsLike,
      minTemperature: this._minTemperature,
      maxTemperature: this._maxTemperature,
      pressure: this._pressure,
      humidity: this._humidity,
      visibility: this._visibility,
      windSpeed: this._windSpeed,
      windDirection: this._windDirection,
      condition: this._condition,
      description: this._description,
      timestamp: this._timestamp.toISOString()
    };
  }

  private validateTemperature(temperature: number): void {
    if (isNaN(temperature) || temperature < -273.15) {
      throw new Error('Valor de temperatura inválido');
    }
  }

  private validateHumidity(humidity: number): void {
    if (isNaN(humidity) || humidity < 0 || humidity > 100) {
      throw new Error('La humedad debe estar entre 0 y 100');
    }
  }

  private validatePressure(pressure: number): void {
    if (isNaN(pressure) || pressure < 0) {
      throw new Error('Valor de presión inválido');
    }
  }

  private convertKelvinToCelsius(kelvin: number): number {
    return kelvin - 273.15;
  }

  private convertKelvinToFahrenheit(kelvin: number): number {
    return (kelvin - 273.15) * 9/5 + 32;
  }
}
