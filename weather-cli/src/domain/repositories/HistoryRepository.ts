/**
 * Interfaz del repositorio de historial de búsquedas
 * Define el contrato para cualquier implementación de persistencia
 */
import { SearchHistory, SearchType } from '@domain/entities/SearchHistory';

/**
 * Opciones para consultar el historial
 */
export interface HistoryQueryOptions {
  /** Número máximo de resultados */
  limit?: number;
  /** Número de resultados a saltar (para paginación) */
  skip?: number;
  /** Filtrar por tipo de búsqueda */
  searchType?: SearchType;
  /** Filtrar por código de país */
  countryCode?: string;
  /** Filtrar desde una fecha */
  fromDate?: Date;
  /** Filtrar hasta una fecha */
  toDate?: Date;
  /** Término de búsqueda en texto */
  searchTerm?: string;
}

/**
 * Estadísticas del historial
 */
export interface HistoryStats {
  totalSearches: number;
  uniqueCities: number;
  uniqueCountries: number;
  mostSearchedCity: { city: string; country: string; count: number } | null;
  averageTemperature: number;
  searchesByType: Record<SearchType, number>;
}

/**
 * Repositorio de historial de búsquedas
 */
export interface HistoryRepository {
  /**
   * Guarda un nuevo registro de búsqueda
   * @param history - Registro a guardar
   * @returns El registro guardado con ID asignado
   */
  save(history: SearchHistory): Promise<SearchHistory>;

  /**
   * Obtiene registros del historial
   * @param options - Opciones de consulta
   * @returns Lista de registros
   */
  findAll(options?: HistoryQueryOptions): Promise<SearchHistory[]>;

  /**
   * Busca un registro por ID
   * @param id - ID del registro
   * @returns El registro o null si no existe
   */
  findById(id: string): Promise<SearchHistory | null>;

  /**
   * Busca registros por ciudad y país
   * @param cityName - Nombre de la ciudad
   * @param countryCode - Código del país
   * @param limit - Límite de resultados
   * @returns Lista de registros
   */
  findByCity(cityName: string, countryCode: string, limit?: number): Promise<SearchHistory[]>;

  /**
   * Elimina un registro por ID
   * @param id - ID del registro a eliminar
   * @returns true si se eliminó, false si no existía
   */
  delete(id: string): Promise<boolean>;

  /**
   * Elimina todos los registros del historial
   * @returns Número de registros eliminados
   */
  deleteAll(): Promise<number>;

  /**
   * Cuenta el total de registros
   * @param options - Opciones de filtrado
   * @returns Número de registros
   */
  count(options?: HistoryQueryOptions): Promise<number>;

  /**
   * Obtiene estadísticas del historial
   * @returns Estadísticas agregadas
   */
  getStats(): Promise<HistoryStats>;

  /**
   * Verifica la conexión con el almacenamiento
   * @returns true si la conexión es exitosa
   */
  healthCheck(): Promise<boolean>;
}
