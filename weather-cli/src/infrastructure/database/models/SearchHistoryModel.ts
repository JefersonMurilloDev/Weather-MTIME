/**
 * Modelo de Mongoose para el historial de búsquedas
 */
import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * Interfaz del documento de historial
 */
export interface ISearchHistory extends Document {
  searchQuery: string;
  cityName: string;
  countryCode: string;
  temperature: number;
  feelsLike: number;
  humidity: number;
  condition: string;
  description: string;
  coordinates?: {
    lat: number;
    lon: number;
  };
  searchedAt: Date;
  searchType: 'city' | 'country' | 'coordinates';
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Schema de Mongoose para historial de búsquedas
 */
const SearchHistorySchema = new Schema<ISearchHistory>(
  {
    searchQuery: {
      type: String,
      required: [true, 'La consulta de búsqueda es requerida'],
      trim: true,
      index: true,
    },
    cityName: {
      type: String,
      required: [true, 'El nombre de la ciudad es requerido'],
      trim: true,
      index: true,
    },
    countryCode: {
      type: String,
      required: [true, 'El código de país es requerido'],
      uppercase: true,
      minlength: 2,
      maxlength: 3,
      index: true,
    },
    temperature: {
      type: Number,
      required: [true, 'La temperatura es requerida'],
    },
    feelsLike: {
      type: Number,
      required: [true, 'La sensación térmica es requerida'],
    },
    humidity: {
      type: Number,
      required: [true, 'La humedad es requerida'],
      min: 0,
      max: 100,
    },
    condition: {
      type: String,
      required: [true, 'La condición del clima es requerida'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'La descripción es requerida'],
      trim: true,
    },
    coordinates: {
      lat: { type: Number },
      lon: { type: Number },
    },
    searchedAt: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
    searchType: {
      type: String,
      enum: ['city', 'country', 'coordinates'],
      default: 'city',
      index: true,
    },
  },
  {
    timestamps: true, // Agrega createdAt y updatedAt automáticamente
    collection: 'search_history',
  }
);

// Índice compuesto para búsquedas frecuentes
SearchHistorySchema.index({ cityName: 1, countryCode: 1 });
SearchHistorySchema.index({ searchedAt: -1 });

// Índice de texto para búsqueda full-text
SearchHistorySchema.index(
  { searchQuery: 'text', cityName: 'text', description: 'text' },
  { weights: { searchQuery: 10, cityName: 5, description: 1 } }
);

/**
 * Método virtual para formato de display
 */
SearchHistorySchema.virtual('displayString').get(function (this: ISearchHistory) {
  const date = this.searchedAt.toLocaleString();
  return `${this.cityName}, ${this.countryCode}: ${this.temperature.toFixed(1)}°C\n  ${this.searchQuery} - ${date}`;
});

/**
 * Método estático para obtener estadísticas
 */
SearchHistorySchema.statics['getStats'] = async function () {
  const stats = await this.aggregate([
    {
      $facet: {
        totalSearches: [{ $count: 'count' }],
        uniqueCities: [
          { $group: { _id: { city: '$cityName', country: '$countryCode' } } },
          { $count: 'count' },
        ],
        uniqueCountries: [
          { $group: { _id: '$countryCode' } },
          { $count: 'count' },
        ],
        mostSearchedCity: [
          {
            $group: {
              _id: { city: '$cityName', country: '$countryCode' },
              count: { $sum: 1 },
            },
          },
          { $sort: { count: -1 } },
          { $limit: 1 },
        ],
        averageTemperature: [
          { $group: { _id: null, avg: { $avg: '$temperature' } } },
        ],
        searchesByType: [
          { $group: { _id: '$searchType', count: { $sum: 1 } } },
        ],
      },
    },
  ]);

  const result = stats[0];
  return {
    totalSearches: result.totalSearches[0]?.count || 0,
    uniqueCities: result.uniqueCities[0]?.count || 0,
    uniqueCountries: result.uniqueCountries[0]?.count || 0,
    mostSearchedCity: result.mostSearchedCity[0]
      ? {
          city: result.mostSearchedCity[0]._id.city,
          country: result.mostSearchedCity[0]._id.country,
          count: result.mostSearchedCity[0].count,
        }
      : null,
    averageTemperature: result.averageTemperature[0]?.avg || 0,
    searchesByType: result.searchesByType.reduce(
      (acc: Record<string, number>, item: { _id: string; count: number }) => {
        acc[item._id] = item.count;
        return acc;
      },
      {}
    ),
  };
};

/**
 * Interfaz del modelo con métodos estáticos
 */
export interface ISearchHistoryModel extends Model<ISearchHistory> {
  getStats(): Promise<{
    totalSearches: number;
    uniqueCities: number;
    uniqueCountries: number;
    mostSearchedCity: { city: string; country: string; count: number } | null;
    averageTemperature: number;
    searchesByType: Record<string, number>;
  }>;
}

/**
 * Modelo de Mongoose
 */
export const SearchHistoryModel = mongoose.model<ISearchHistory, ISearchHistoryModel>(
  'SearchHistory',
  SearchHistorySchema
);
