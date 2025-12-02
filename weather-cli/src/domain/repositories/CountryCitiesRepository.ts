/**
 * Interfaz del repositorio de ciudades por país
 * Define el contrato para acceder a los datos de ciudades
 */

export interface CountryCitiesData {
  countryCode: string;
  countryName: string;
  region: string;
  cities: string[];
}

export interface CountryCitiesRepository {
  /**
   * Obtiene las ciudades de un país por su código ISO
   */
  getCitiesByCountry(countryCode: string): Promise<string[] | undefined>;

  /**
   * Obtiene todos los datos de un país
   */
  getCountryData(countryCode: string): Promise<CountryCitiesData | undefined>;

  /**
   * Obtiene todos los códigos de países disponibles
   */
  getAllCountryCodes(): Promise<string[]>;

  /**
   * Verifica si un país existe en la base de datos
   */
  hasCountry(countryCode: string): Promise<boolean>;

  /**
   * Guarda o actualiza los datos de un país
   */
  upsertCountry(data: CountryCitiesData): Promise<void>;

  /**
   * Guarda múltiples países (para seed)
   */
  bulkUpsert(data: CountryCitiesData[]): Promise<number>;
}
