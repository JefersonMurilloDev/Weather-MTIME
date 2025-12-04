import mongoose, { Schema, Document } from 'mongoose';

export interface IFavorite extends Document {
  city: string;
  country: string;
  createdAt: Date;
}

const FavoriteSchema: Schema = new Schema({
  city: { type: String, required: true },
  country: { type: String, required: true, minlength: 2, maxlength: 2 },
  createdAt: { type: Date, default: Date.now }
});

// Índice compuesto único para evitar duplicados de la misma ciudad/país
FavoriteSchema.index({ city: 1, country: 1 }, { unique: true });

export const FavoriteModel = mongoose.model<IFavorite>('Favorite', FavoriteSchema);
