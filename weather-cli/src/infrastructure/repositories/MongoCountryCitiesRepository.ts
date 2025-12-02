/**
 * Implementación del repositorio de ciudades usando MongoDB
 * Con fallback al archivo local si MongoDB no está disponible
 */
import { injectable, inject } from 'tsyringe';
import { CountryCitiesRepository, CountryCitiesData } from '@domain/repositories/CountryCitiesRepository';
import { CountryCitiesModel } from '@infrastructure/database/models/CountryCitiesModel';
import { MongoConnection } from '@infrastructure/database/MongoConnection';
import { Logger } from '@infrastructure/logger/Logger';
import { getCitiesForCountry } from '@infrastructure/data/CitiesByCountry';

@injectable()
export class MongoCountryCitiesRepository implements CountryCitiesRepository {
  constructor(
    @inject('MongoConnection') private mongoConnection: MongoConnection,
    @inject('Logger') private logger: Logger
  ) {}

  /**
   * Verifica si MongoDB está disponible
   */
  private async isMongoAvailable(): Promise<boolean> {
    try {
      return await this.mongoConnection.healthCheck();
    } catch {
      return false;
    }
  }

  /**
   * Obtiene las ciudades de un país
   * Primero intenta MongoDB, luego fallback al archivo local
   */
  async getCitiesByCountry(countryCode: string): Promise<string[] | undefined> {
    const code = countryCode.toUpperCase();

    // Intentar MongoDB primero
    if (await this.isMongoAvailable()) {
      try {
        const cities = await CountryCitiesModel.getCitiesByCountry(code);
        if (cities && cities.length > 0) {
          this.logger.debug(`Ciudades obtenidas de MongoDB para ${code}`);
          return cities;
        }
      } catch (error) {
        this.logger.warn(`Error obteniendo ciudades de MongoDB: ${error}`);
      }
    }

    // Fallback al archivo local
    this.logger.debug(`Usando fallback local para ${code}`);
    return getCitiesForCountry(code);
  }

  /**
   * Obtiene todos los datos de un país
   */
  async getCountryData(countryCode: string): Promise<CountryCitiesData | undefined> {
    const code = countryCode.toUpperCase();

    if (await this.isMongoAvailable()) {
      try {
        const doc = await CountryCitiesModel.findByCountryCode(code);
        if (doc) {
          return {
            countryCode: doc.countryCode,
            countryName: doc.countryName,
            region: doc.region,
            cities: doc.cities,
          };
        }
      } catch (error) {
        this.logger.warn(`Error obteniendo datos de país: ${error}`);
      }
    }

    // Fallback: solo tenemos las ciudades en el archivo local
    const cities = getCitiesForCountry(code);
    if (cities) {
      return {
        countryCode: code,
        countryName: code, // No tenemos el nombre en el archivo local
        region: 'Desconocida',
        cities,
      };
    }

    return undefined;
  }

  /**
   * Obtiene todos los códigos de países disponibles
   */
  async getAllCountryCodes(): Promise<string[]> {
    if (await this.isMongoAvailable()) {
      try {
        const codes = await CountryCitiesModel.getAllCountryCodes();
        if (codes.length > 0) {
          return codes;
        }
      } catch (error) {
        this.logger.warn(`Error obteniendo códigos de países: ${error}`);
      }
    }

    // Fallback: obtener del archivo local
    const { COUNTRY_CODES } = await import('@infrastructure/data/CitiesByCountry');
    return COUNTRY_CODES;
  }

  /**
   * Verifica si un país existe
   */
  async hasCountry(countryCode: string): Promise<boolean> {
    const cities = await this.getCitiesByCountry(countryCode);
    return cities !== undefined && cities.length > 0;
  }

  /**
   * Guarda o actualiza los datos de un país
   */
  async upsertCountry(data: CountryCitiesData): Promise<void> {
    if (!(await this.isMongoAvailable())) {
      throw new Error('MongoDB no está disponible');
    }

    await CountryCitiesModel.findOneAndUpdate(
      { countryCode: data.countryCode.toUpperCase() },
      {
        countryCode: data.countryCode.toUpperCase(),
        countryName: data.countryName,
        region: data.region,
        cities: data.cities,
      },
      { upsert: true, new: true }
    );

    this.logger.info(`País ${data.countryCode} guardado/actualizado en MongoDB`);
  }

  /**
   * Guarda múltiples países (para seed inicial)
   */
  async bulkUpsert(data: CountryCitiesData[]): Promise<number> {
    if (!(await this.isMongoAvailable())) {
      throw new Error('MongoDB no está disponible');
    }

    const operations = data.map((item) => ({
      updateOne: {
        filter: { countryCode: item.countryCode.toUpperCase() },
        update: {
          $set: {
            countryCode: item.countryCode.toUpperCase(),
            countryName: item.countryName,
            region: item.region,
            cities: item.cities,
          },
        },
        upsert: true,
      },
    }));

    const result = await CountryCitiesModel.bulkWrite(operations);
    const count = result.upsertedCount + result.modifiedCount;
    
    this.logger.info(`Seed completado: ${count} países guardados/actualizados`);
    return count;
  }
}
