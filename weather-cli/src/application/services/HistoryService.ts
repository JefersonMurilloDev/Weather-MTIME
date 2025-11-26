/**
 * Servicio de aplicación para gestionar el historial de búsquedas
 * Abstrae la persistencia (MongoDB o archivo local)
 */
import { injectable, inject } from 'tsyringe';
import { SearchHistory, SearchType } from '@domain/entities/SearchHistory';
import { HistoryRepository, HistoryStats } from '@domain/repositories/HistoryRepository';
import { Logger } from '@infrastructure/logger/Logger';

export interface SaveHistoryParams {
  searchQuery: string;
  cityName: string;
  countryCode: string;
  temperature: number;
  feelsLike?: number;
  humidity?: number;
  condition?: string;
  description?: string;
  coordinates?: { lat: number; lon: number };
  searchType?: SearchType;
}

@injectable()
export class HistoryService {
  constructor(
    @inject('HistoryRepository')
    private readonly historyRepository: HistoryRepository,

    @inject('Logger')
    private readonly logger: Logger,
  ) {}

  /**
   * Guarda una búsqueda en el historial
   */
  async save(params: SaveHistoryParams): Promise<SearchHistory | null> {
    try {
      const history = new SearchHistory(
        null, // ID será generado por MongoDB
        params.searchQuery,
        params.cityName,
        params.countryCode.toUpperCase(),
        params.temperature,
        params.feelsLike ?? params.temperature,
        params.humidity ?? 0,
        params.condition ?? 'Unknown',
        params.description ?? '',
        params.coordinates ?? null,
        new Date(),
        params.searchType ?? SearchType.CITY,
      );

      const saved = await this.historyRepository.save(history);
      this.logger.info(`✅ Historial guardado: ${saved.cityName}, ${saved.countryCode}`);
      return saved;
    } catch (error) {
      this.logger.error('Error guardando historial:', error as Error);
      return null;
    }
  }

  /**
   * Obtiene todo el historial
   */
  async getAll(limit?: number): Promise<SearchHistory[]> {
    try {
      const options = limit ? { limit } : {};
      return await this.historyRepository.findAll(options);
    } catch (error) {
      this.logger.error('Error obteniendo historial:', error as Error);
      return [];
    }
  }

  /**
   * Busca historial por ciudad
   */
  async findByCity(cityName: string, countryCode: string): Promise<SearchHistory[]> {
    try {
      return await this.historyRepository.findByCity(cityName, countryCode);
    } catch (error) {
      this.logger.error('Error buscando por ciudad:', error as Error);
      return [];
    }
  }

  /**
   * Limpia todo el historial
   */
  async clearAll(): Promise<number> {
    try {
      const count = await this.historyRepository.deleteAll();
      this.logger.info(`🗑️ Historial limpiado: ${count} registros eliminados`);
      return count;
    } catch (error) {
      this.logger.error('Error limpiando historial:', error as Error);
      return 0;
    }
  }

  /**
   * Obtiene estadísticas del historial
   */
  async getStats(): Promise<HistoryStats | null> {
    try {
      return await this.historyRepository.getStats();
    } catch (error) {
      this.logger.error('Error obteniendo estadísticas:', error as Error);
      return null;
    }
  }

  /**
   * Verifica si el servicio está disponible
   */
  async isAvailable(): Promise<boolean> {
    try {
      return await this.historyRepository.healthCheck();
    } catch {
      return false;
    }
  }
}
