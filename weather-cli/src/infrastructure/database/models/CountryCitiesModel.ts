/**
 * Modelo Mongoose para ciudades por país
 * Almacena la lista de ciudades principales de cada país
 */
import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * Interfaz para el documento de ciudades por país
 */
export interface ICountryCities extends Document {
  countryCode: string;      // Código ISO-2 (ej: "ES", "CO")
  countryName: string;      // Nombre del país (ej: "España", "Colombia")
  region: string;           // Región geográfica (ej: "Europa", "América del Sur")
  cities: string[];         // Lista de ciudades principales
  updatedAt: Date;
  createdAt: Date;
}

/**
 * Interfaz para métodos estáticos del modelo
 */
export interface ICountryCitiesModel extends Model<ICountryCities> {
  findByCountryCode(code: string): Promise<ICountryCities | null>;
  getCitiesByCountry(code: string): Promise<string[] | null>;
  getAllCountryCodes(): Promise<string[]>;
}

/**
 * Schema de Mongoose para ciudades por país
 */
const CountryCitiesSchema = new Schema<ICountryCities>(
  {
    countryCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      minlength: 2,
      maxlength: 3,
      index: true,
    },
    countryName: {
      type: String,
      required: true,
      trim: true,
    },
    region: {
      type: String,
      required: true,
      trim: true,
      enum: [
        'Europa',
        'América del Norte',
        'América del Sur',
        'América Central y Caribe',
        'Asia',
        'Oceanía',
        'África',
      ],
    },
    cities: {
      type: [String],
      required: true,
      validate: {
        validator: (v: string[]) => v.length > 0,
        message: 'Debe haber al menos una ciudad',
      },
    },
  },
  {
    timestamps: true,
    collection: 'countrycities',
  }
);

// Índice de texto para búsqueda
CountryCitiesSchema.index({ countryName: 'text', cities: 'text' });

/**
 * Método estático: buscar por código de país
 */
CountryCitiesSchema.statics['findByCountryCode'] = async function (
  code: string
): Promise<ICountryCities | null> {
  return this.findOne({ countryCode: code.toUpperCase() });
};

/**
 * Método estático: obtener solo las ciudades de un país
 */
CountryCitiesSchema.statics['getCitiesByCountry'] = async function (
  code: string
): Promise<string[] | null> {
  const doc = await this.findOne({ countryCode: code.toUpperCase() });
  return doc ? doc.cities : null;
};

/**
 * Método estático: obtener todos los códigos de países
 */
CountryCitiesSchema.statics['getAllCountryCodes'] = async function (): Promise<string[]> {
  const docs = await this.find({}, { countryCode: 1 });
  return docs.map((doc: ICountryCities) => doc.countryCode);
};

export const CountryCitiesModel = mongoose.model<ICountryCities, ICountryCitiesModel>(
  'CountryCities',
  CountryCitiesSchema
);
