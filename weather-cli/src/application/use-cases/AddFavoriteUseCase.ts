import { inject, injectable } from 'tsyringe';
import { FavoriteRepository } from '@domain/repositories/FavoriteRepository';
import { Favorite } from '@domain/entities/Favorite';
import { ApplicationError, DomainError } from '@shared/errors/DomainError';
import { Result, ok, err } from '../../shared';
import { logger } from '@infrastructure/logger/Logger';

export interface AddFavoriteParams {
  city: string;
  country: string;
}

@injectable()
export class AddFavoriteUseCase {
  constructor(
    @inject('FavoriteRepository') private repository: FavoriteRepository
  ) {}

  async execute(params: AddFavoriteParams): Promise<Result<void, DomainError>> {
    try {
      // Validar si ya existe
      const exists = await this.repository.exists(params.city, params.country);
      if (exists) {
        return err(new ApplicationError('Favorito ya existe', 'DUPLICATE_FAVORITE'));
      }

      const favorite = new Favorite(params.city, params.country);
      await this.repository.save(favorite);
      
      return ok(undefined);
    } catch (error) {
      logger.error('Error al guardar favorito', error as Error);
      return err(new ApplicationError('Error al guardar favorito', 'INTERNAL_ERROR'));
    }
  }
}
