import { inject, injectable } from 'tsyringe';
import { FavoriteRepository } from '@domain/repositories/FavoriteRepository';
import { GetWeatherByCityUseCase } from './GetWeatherByCityUseCase';
import { TemperatureUnit } from '@domain/entities/Weather';
import { Result, ok, err, isOk } from '../../shared';
import { ApplicationError, DomainError } from '@shared/errors/DomainError';
import { WeatherResult } from '@domain/repositories/WeatherRepository';
import { City } from '@domain/entities/City';
import { logger } from '@infrastructure/logger/Logger';

export interface FavoriteWeatherResult {
  city: City;
  weather: WeatherResult['weather'] | null;
  error?: string;
}

@injectable()
export class GetWeatherForFavoritesUseCase {
  constructor(
    @inject('FavoriteRepository') private favoriteRepository: FavoriteRepository,
    @inject(GetWeatherByCityUseCase) private getWeatherByCityUseCase: GetWeatherByCityUseCase
  ) {}

  async execute(units: TemperatureUnit = TemperatureUnit.CELSIUS): Promise<Result<FavoriteWeatherResult[], DomainError>> {
    try {
      const favorites = await this.favoriteRepository.findAll();
      
      if (favorites.length === 0) {
        return ok([]);
      }

      // Ejecutar peticiones en paralelo
      const promises = favorites.map(async (fav) => {
        const result = await this.getWeatherByCityUseCase.execute({
          cityName: fav.city,
          countryCode: fav.country,
          units: units,
          language: 'es'
        });

        if (isOk(result)) {
          return {
            city: result.value.city,
            weather: result.value.weather
          };
        } else {
           return {
             city: new City(fav.city, fav.country),
             weather: null,
             error: result.error.message
           };
        }
      });

      const results = await Promise.all(promises);
      return ok(results);

    } catch (error) {
      logger.error('Error obteniendo favoritos', error as Error);
      return err(new ApplicationError('Error al obtener clima de favoritos', 'INTERNAL_ERROR'));
    }
  }
}
