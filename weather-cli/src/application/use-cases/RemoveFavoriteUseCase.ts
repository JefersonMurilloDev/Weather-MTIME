import { inject, injectable } from 'tsyringe';
import { FavoriteRepository } from '@domain/repositories/FavoriteRepository';
import { ApplicationError, DomainError } from '@shared/errors/DomainError';
import { Result, ok, err } from '../../shared';
import { logger } from '@infrastructure/logger/Logger';

export interface RemoveFavoriteParams {
  city: string;
  country: string;
}

@injectable()
export class RemoveFavoriteUseCase {
  constructor(
    @inject('FavoriteRepository') private repository: FavoriteRepository
  ) {}

  async execute(params: RemoveFavoriteParams): Promise<Result<void, DomainError>> {
    try {
      const deleted = await this.repository.delete(params.city, params.country);
      if (!deleted) {
        return err(new ApplicationError('Favorito no encontrado', 'NOT_FOUND'));
      }
      return ok(undefined);
    } catch (error) {
      logger.error('Error al eliminar favorito', error as Error);
      return err(new ApplicationError('Error al eliminar favorito', 'INTERNAL_ERROR'));
    }
  }
}
