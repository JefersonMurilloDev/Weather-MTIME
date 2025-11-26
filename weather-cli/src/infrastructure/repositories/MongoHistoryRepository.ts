/**
 * Implementación del repositorio de historial usando Mongoose
 */
import { injectable, inject } from 'tsyringe';
import { FilterQuery } from 'mongoose';
import { 
  HistoryRepository, 
  HistoryQueryOptions, 
  HistoryStats 
} from '@domain/repositories/HistoryRepository';
import { SearchHistory, SearchType } from '@domain/entities/SearchHistory';
import { MongoConnection } from '@infrastructure/database/MongoConnection';
import { SearchHistoryModel, ISearchHistory } from '@infrastructure/database/models/SearchHistoryModel';
import { Logger } from '@infrastructure/logger/Logger';

@injectable()
export class MongoHistoryRepository implements HistoryRepository {
  private initialized = false;

  constructor(
    @inject('MongoConnection')
    private readonly mongoConnection: MongoConnection,

    @inject('Logger')
    private readonly logger: Logger,
  ) {}

  /**
   * Asegura que la conexión esté establecida
   */
  private async ensureConnection(): Promise<void> {
    if (!this.initialized) {
      await this.mongoConnection.connect();
      this.initialized = true;
    }
  }

  /**
   * Convierte un documento de Mongoose a entidad de dominio
   */
  private toEntity(doc: ISearchHistory): SearchHistory {
    return SearchHistory.fromPlainObject({
      id: doc._id?.toString() || null,
      searchQuery: doc.searchQuery,
      cityName: doc.cityName,
      countryCode: doc.countryCode,
      temperature: doc.temperature,
      feelsLike: doc.feelsLike,
      humidity: doc.humidity,
      condition: doc.condition,
      description: doc.description,
      coordinates: doc.coordinates || null,
      searchedAt: doc.searchedAt,
      searchType: doc.searchType as SearchType,
    });
  }

  async save(history: SearchHistory): Promise<SearchHistory> {
    try {
      await this.ensureConnection();

      const doc = new SearchHistoryModel({
        searchQuery: history.searchQuery,
        cityName: history.cityName,
        countryCode: history.countryCode,
        temperature: history.temperature,
        feelsLike: history.feelsLike,
        humidity: history.humidity,
        condition: history.condition,
        description: history.description,
        coordinates: history.coordinates || undefined,
        searchedAt: history.searchedAt,
        searchType: history.searchType,
      });

      const saved = await doc.save();
      this.logger.debug(`Historial guardado con ID: ${saved._id}`);

      return this.toEntity(saved);
    } catch (error) {
      this.logger.error('Error guardando historial en MongoDB:', error as Error);
      throw error;
    }
  }

  async findAll(options: HistoryQueryOptions = {}): Promise<SearchHistory[]> {
    try {
      await this.ensureConnection();

      const query = this.buildQuery(options);
      
      let queryBuilder = SearchHistoryModel
        .find(query)
        .sort({ searchedAt: -1 });

      if (options.skip) {
        queryBuilder = queryBuilder.skip(options.skip);
      }

      if (options.limit) {
        queryBuilder = queryBuilder.limit(options.limit);
      }

      const docs = await queryBuilder.exec();
      return docs.map((doc: ISearchHistory) => this.toEntity(doc));
    } catch (error) {
      this.logger.error('Error obteniendo historial de MongoDB:', error as Error);
      throw error;
    }
  }

  async findById(id: string): Promise<SearchHistory | null> {
    try {
      await this.ensureConnection();

      const doc = await SearchHistoryModel.findById(id).exec();
      return doc ? this.toEntity(doc) : null;
    } catch (error) {
      this.logger.error('Error buscando historial por ID:', error as Error);
      throw error;
    }
  }

  async findByCity(cityName: string, countryCode: string, limit = 10): Promise<SearchHistory[]> {
    try {
      await this.ensureConnection();

      const docs = await SearchHistoryModel
        .find({
          cityName: { $regex: new RegExp(cityName, 'i') },
          countryCode: countryCode.toUpperCase(),
        })
        .sort({ searchedAt: -1 })
        .limit(limit)
        .exec();

      return docs.map((doc: ISearchHistory) => this.toEntity(doc));
    } catch (error) {
      this.logger.error('Error buscando historial por ciudad:', error as Error);
      throw error;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      await this.ensureConnection();

      const result = await SearchHistoryModel.findByIdAndDelete(id).exec();
      return result !== null;
    } catch (error) {
      this.logger.error('Error eliminando historial:', error as Error);
      throw error;
    }
  }

  async deleteAll(): Promise<number> {
    try {
      await this.ensureConnection();

      const result = await SearchHistoryModel.deleteMany({}).exec();
      this.logger.info(`Eliminados ${result.deletedCount} registros del historial`);
      return result.deletedCount;
    } catch (error) {
      this.logger.error('Error eliminando todo el historial:', error as Error);
      throw error;
    }
  }

  async count(options: HistoryQueryOptions = {}): Promise<number> {
    try {
      await this.ensureConnection();

      const query = this.buildQuery(options);
      return await SearchHistoryModel.countDocuments(query).exec();
    } catch (error) {
      this.logger.error('Error contando historial:', error as Error);
      throw error;
    }
  }

  async getStats(): Promise<HistoryStats> {
    try {
      await this.ensureConnection();

      // Usar el método estático del modelo
      const stats = await SearchHistoryModel.getStats();

      return {
        totalSearches: stats.totalSearches,
        uniqueCities: stats.uniqueCities,
        uniqueCountries: stats.uniqueCountries,
        mostSearchedCity: stats.mostSearchedCity,
        averageTemperature: stats.averageTemperature,
        searchesByType: stats.searchesByType as Record<SearchType, number>,
      };
    } catch (error) {
      this.logger.error('Error obteniendo estadísticas:', error as Error);
      throw error;
    }
  }

  async healthCheck(): Promise<boolean> {
    return this.mongoConnection.healthCheck();
  }

  /**
   * Construye el query de Mongoose basado en las opciones
   */
  private buildQuery(options: HistoryQueryOptions): FilterQuery<ISearchHistory> {
    const query: FilterQuery<ISearchHistory> = {};

    if (options.searchType) {
      query.searchType = options.searchType;
    }

    if (options.countryCode) {
      query.countryCode = options.countryCode.toUpperCase();
    }

    if (options.fromDate || options.toDate) {
      query.searchedAt = {};
      if (options.fromDate) {
        query.searchedAt.$gte = options.fromDate;
      }
      if (options.toDate) {
        query.searchedAt.$lte = options.toDate;
      }
    }

    if (options.searchTerm) {
      query.$text = { $search: options.searchTerm };
    }

    return query;
  }
}
