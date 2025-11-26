/**
 * Entidad que representa un registro de historial de búsqueda
 * Forma parte del núcleo de dominio
 */
export class SearchHistory {
  constructor(
    private readonly _id: string | null,
    private readonly _searchQuery: string,
    private readonly _cityName: string,
    private readonly _countryCode: string,
    private readonly _temperature: number,
    private readonly _feelsLike: number,
    private readonly _humidity: number,
    private readonly _condition: string,
    private readonly _description: string,
    private readonly _coordinates: { lat: number; lon: number } | null,
    private readonly _searchedAt: Date,
    private readonly _searchType: SearchType = SearchType.CITY,
  ) {}

  // Getters
  get id(): string | null {
    return this._id;
  }

  get searchQuery(): string {
    return this._searchQuery;
  }

  get cityName(): string {
    return this._cityName;
  }

  get countryCode(): string {
    return this._countryCode;
  }

  get temperature(): number {
    return this._temperature;
  }

  get feelsLike(): number {
    return this._feelsLike;
  }

  get humidity(): number {
    return this._humidity;
  }

  get condition(): string {
    return this._condition;
  }

  get description(): string {
    return this._description;
  }

  get coordinates(): { lat: number; lon: number } | null {
    return this._coordinates;
  }

  get searchedAt(): Date {
    return this._searchedAt;
  }

  get searchType(): SearchType {
    return this._searchType;
  }

  /**
   * Representación legible del registro
   */
  toString(): string {
    return `${this._cityName}, ${this._countryCode}: ${this._temperature.toFixed(1)}°C`;
  }

  /**
   * Formato para mostrar en consola
   */
  toDisplayString(): string {
    const date = this._searchedAt.toLocaleString();
    return `${this._cityName}, ${this._countryCode}: ${this._temperature.toFixed(1)}°C\n  ${this._searchQuery} - ${date}`;
  }

  /**
   * Crea una instancia desde datos planos (ej: desde MongoDB)
   */
  static fromPlainObject(data: SearchHistoryData): SearchHistory {
    return new SearchHistory(
      data.id || null,
      data.searchQuery,
      data.cityName,
      data.countryCode,
      data.temperature,
      data.feelsLike,
      data.humidity,
      data.condition,
      data.description,
      data.coordinates || null,
      new Date(data.searchedAt),
      data.searchType || SearchType.CITY,
    );
  }

  /**
   * Convierte a objeto plano para persistencia
   */
  toPlainObject(): SearchHistoryData {
    return {
      id: this._id,
      searchQuery: this._searchQuery,
      cityName: this._cityName,
      countryCode: this._countryCode,
      temperature: this._temperature,
      feelsLike: this._feelsLike,
      humidity: this._humidity,
      condition: this._condition,
      description: this._description,
      coordinates: this._coordinates,
      searchedAt: this._searchedAt,
      searchType: this._searchType,
    };
  }
}

/**
 * Tipos de búsqueda soportados
 */
export enum SearchType {
  CITY = 'city',
  COUNTRY = 'country',
  COORDINATES = 'coordinates',
}

/**
 * Interfaz para datos planos de historial
 */
export interface SearchHistoryData {
  id?: string | null;
  searchQuery: string;
  cityName: string;
  countryCode: string;
  temperature: number;
  feelsLike: number;
  humidity: number;
  condition: string;
  description: string;
  coordinates?: { lat: number; lon: number } | null;
  searchedAt: Date;
  searchType?: SearchType;
}
