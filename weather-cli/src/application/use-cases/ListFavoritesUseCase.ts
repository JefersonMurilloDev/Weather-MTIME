import { inject, injectable } from 'tsyringe';
import { FavoriteRepository } from '@domain/repositories/FavoriteRepository';
import { Favorite } from '@domain/entities/Favorite';
import { ApplicationError, DomainError } from '@shared/errors/DomainError';
import { Result, ok, err } from '../../shared';
import { logger } from '@infrastructure/logger/Logger';

@injectable()
export class ListFavoritesUseCase {
  constructor(
    @inject('FavoriteRepository') private repository: FavoriteRepository
  ) {}

  async execute(): Promise<Result<Favorite[], DomainError>> {
    try {
      const favorites = await this.repository.findAll();
      return ok(favorites);
    } catch (error) {
      logger.error('Error al listar favoritos', error as Error);
      return err(new ApplicationError('Error al listar favoritos', 'INTERNAL_ERROR'));
    }
  }
}
