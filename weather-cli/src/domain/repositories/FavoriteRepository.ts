import { Favorite } from '../entities/Favorite';

export interface FavoriteRepository {
  save(favorite: Favorite): Promise<void>;
  findAll(): Promise<Favorite[]>;
  delete(city: string, country: string): Promise<boolean>;
  exists(city: string, country: string): Promise<boolean>;
}
