import { injectable } from 'tsyringe';
import { FavoriteRepository } from '@domain/repositories/FavoriteRepository';
import { Favorite } from '@domain/entities/Favorite';
import { FavoriteModel } from '../database/models/FavoriteModel';
import { logger } from '@infrastructure/logger/Logger';

@injectable()
export class MongoFavoriteRepository implements FavoriteRepository {
  async save(favorite: Favorite): Promise<void> {
    try {
      await FavoriteModel.create({
        city: favorite.city,
        country: favorite.country,
        createdAt: favorite.createdAt
      });
      logger.debug(`Favorito guardado: ${favorite.toString()}`);
    } catch (error: any) {
      // Si es error de duplicado (código 11000), lo ignoramos o manejamos silenciosamente
      if (error.code === 11000) {
        logger.debug(`Favorito ya existe: ${favorite.toString()}`);
        return;
      }
      throw error;
    }
  }

  async findAll(): Promise<Favorite[]> {
    const docs = await FavoriteModel.find().sort({ createdAt: -1 });
    return docs.map(doc => new Favorite(doc.city, doc.country, doc.createdAt));
  }

  async delete(city: string, country: string): Promise<boolean> {
    const result = await FavoriteModel.deleteOne({ 
      city: { $regex: new RegExp(`^${city}$`, 'i') }, // Case insensitive
      country: country.toUpperCase() 
    });
    return result.deletedCount > 0;
  }

  async exists(city: string, country: string): Promise<boolean> {
    const count = await FavoriteModel.countDocuments({
      city: { $regex: new RegExp(`^${city}$`, 'i') },
      country: country.toUpperCase()
    });
    return count > 0;
  }
}
