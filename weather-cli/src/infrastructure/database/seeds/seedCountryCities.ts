/**
 * Script de seed para poblar la colección de ciudades por país
 * Ejecutar: npx tsx src/infrastructure/database/seeds/seedCountryCities.ts
 */
import 'reflect-metadata';
import mongoose from 'mongoose';
import { CountryCitiesModel } from '../models/CountryCitiesModel';
import { getAllCitiesByCountry } from '../../data/CitiesByCountry';

// Mapeo de códigos de país a nombres y regiones
const COUNTRY_INFO: Record<string, { name: string; region: string }> = {
  // Europa
  ES: { name: 'España', region: 'Europa' },
  FR: { name: 'Francia', region: 'Europa' },
  DE: { name: 'Alemania', region: 'Europa' },
  IT: { name: 'Italia', region: 'Europa' },
  GB: { name: 'Reino Unido', region: 'Europa' },
  PT: { name: 'Portugal', region: 'Europa' },
  NL: { name: 'Países Bajos', region: 'Europa' },
  BE: { name: 'Bélgica', region: 'Europa' },
  PL: { name: 'Polonia', region: 'Europa' },
  CZ: { name: 'República Checa', region: 'Europa' },
  AT: { name: 'Austria', region: 'Europa' },
  CH: { name: 'Suiza', region: 'Europa' },
  SE: { name: 'Suecia', region: 'Europa' },
  NO: { name: 'Noruega', region: 'Europa' },
  DK: { name: 'Dinamarca', region: 'Europa' },
  FI: { name: 'Finlandia', region: 'Europa' },
  IE: { name: 'Irlanda', region: 'Europa' },
  GR: { name: 'Grecia', region: 'Europa' },
  RU: { name: 'Rusia', region: 'Europa' },
  UA: { name: 'Ucrania', region: 'Europa' },
  TR: { name: 'Turquía', region: 'Europa' },
  RO: { name: 'Rumania', region: 'Europa' },
  HU: { name: 'Hungría', region: 'Europa' },
  SK: { name: 'Eslovaquia', region: 'Europa' },
  HR: { name: 'Croacia', region: 'Europa' },
  RS: { name: 'Serbia', region: 'Europa' },
  BG: { name: 'Bulgaria', region: 'Europa' },

  // América del Norte
  US: { name: 'Estados Unidos', region: 'América del Norte' },
  CA: { name: 'Canadá', region: 'América del Norte' },
  MX: { name: 'México', region: 'América del Norte' },

  // América del Sur
  BR: { name: 'Brasil', region: 'América del Sur' },
  AR: { name: 'Argentina', region: 'América del Sur' },
  CO: { name: 'Colombia', region: 'América del Sur' },
  PE: { name: 'Perú', region: 'América del Sur' },
  CL: { name: 'Chile', region: 'América del Sur' },
  VE: { name: 'Venezuela', region: 'América del Sur' },
  EC: { name: 'Ecuador', region: 'América del Sur' },
  UY: { name: 'Uruguay', region: 'América del Sur' },
  PY: { name: 'Paraguay', region: 'América del Sur' },
  BO: { name: 'Bolivia', region: 'América del Sur' },

  // América Central y Caribe
  CR: { name: 'Costa Rica', region: 'América Central y Caribe' },
  PA: { name: 'Panamá', region: 'América Central y Caribe' },
  CU: { name: 'Cuba', region: 'América Central y Caribe' },
  DO: { name: 'República Dominicana', region: 'América Central y Caribe' },
  PR: { name: 'Puerto Rico', region: 'América Central y Caribe' },
  GT: { name: 'Guatemala', region: 'América Central y Caribe' },
  HN: { name: 'Honduras', region: 'América Central y Caribe' },
  SV: { name: 'El Salvador', region: 'América Central y Caribe' },
  NI: { name: 'Nicaragua', region: 'América Central y Caribe' },
  JM: { name: 'Jamaica', region: 'América Central y Caribe' },
  TT: { name: 'Trinidad y Tobago', region: 'América Central y Caribe' },

  // Asia
  JP: { name: 'Japón', region: 'Asia' },
  CN: { name: 'China', region: 'Asia' },
  IN: { name: 'India', region: 'Asia' },
  KR: { name: 'Corea del Sur', region: 'Asia' },
  TH: { name: 'Tailandia', region: 'Asia' },
  VN: { name: 'Vietnam', region: 'Asia' },
  PH: { name: 'Filipinas', region: 'Asia' },
  ID: { name: 'Indonesia', region: 'Asia' },
  MY: { name: 'Malasia', region: 'Asia' },
  SG: { name: 'Singapur', region: 'Asia' },
  TW: { name: 'Taiwán', region: 'Asia' },
  HK: { name: 'Hong Kong', region: 'Asia' },
  PK: { name: 'Pakistán', region: 'Asia' },
  BD: { name: 'Bangladesh', region: 'Asia' },
  LK: { name: 'Sri Lanka', region: 'Asia' },
  NP: { name: 'Nepal', region: 'Asia' },
  AE: { name: 'Emiratos Árabes Unidos', region: 'Asia' },
  SA: { name: 'Arabia Saudita', region: 'Asia' },
  IL: { name: 'Israel', region: 'Asia' },
  IR: { name: 'Irán', region: 'Asia' },

  // Oceanía
  AU: { name: 'Australia', region: 'Oceanía' },
  NZ: { name: 'Nueva Zelanda', region: 'Oceanía' },
  FJ: { name: 'Fiyi', region: 'Oceanía' },

  // África
  ZA: { name: 'Sudáfrica', region: 'África' },
  EG: { name: 'Egipto', region: 'África' },
  NG: { name: 'Nigeria', region: 'África' },
  KE: { name: 'Kenia', region: 'África' },
  MA: { name: 'Marruecos', region: 'África' },
  GH: { name: 'Ghana', region: 'África' },
  TZ: { name: 'Tanzania', region: 'África' },
  ET: { name: 'Etiopía', region: 'África' },
  DZ: { name: 'Argelia', region: 'África' },
  TN: { name: 'Túnez', region: 'África' },
};

async function seed() {
  // Cargar variables de entorno
  const dotenv = await import('dotenv');
  dotenv.config();

  const baseUrl = process.env['MONGO_URL'];
  const dbName = process.env['MONGO_DB_NAME'];

  if (!baseUrl || !dbName) {
    console.error('❌ Error: Variables de entorno requeridas no configuradas');
    console.error('   Asegúrate de tener MONGO_URL y MONGO_DB_NAME en tu archivo .env');
    process.exit(1);
  }

  const mongoUrl = `${baseUrl}/${dbName}?authSource=admin`;

  console.log('🔄 Conectando a MongoDB...');
  console.log(`   Base de datos: ${dbName}`);
  
  try {
    await mongoose.connect(mongoUrl);
    console.log('✅ Conectado a MongoDB');

    const citiesByCountry = getAllCitiesByCountry();
    const documents = [];

    for (const [code, cities] of Object.entries(citiesByCountry)) {
      const info = COUNTRY_INFO[code];
      if (info) {
        documents.push({
          countryCode: code,
          countryName: info.name,
          region: info.region,
          cities: cities,
        });
      } else {
        console.warn(`⚠️  No se encontró información para el país: ${code}`);
      }
    }

    console.log(`📦 Insertando ${documents.length} países...`);

    // Usar bulkWrite para upsert
    const operations = documents.map((doc) => ({
      updateOne: {
        filter: { countryCode: doc.countryCode },
        update: { $set: doc },
        upsert: true,
      },
    }));

    const result = await CountryCitiesModel.bulkWrite(operations);
    
    console.log('✅ Seed completado:');
    console.log(`   - Insertados: ${result.upsertedCount}`);
    console.log(`   - Actualizados: ${result.modifiedCount}`);
    console.log(`   - Total países: ${documents.length}`);

    // Mostrar resumen por región
    const byRegion = documents.reduce((acc, doc) => {
      acc[doc.region] = (acc[doc.region] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log('\n📊 Países por región:');
    for (const [region, count] of Object.entries(byRegion)) {
      console.log(`   - ${region}: ${count}`);
    }

  } catch (error) {
    console.error('❌ Error en seed:', error);
    await mongoose.disconnect();
    process.exit(1);
  }

  await mongoose.disconnect();
  console.log('\n🔌 Desconectado de MongoDB');
  process.exit(0);
}

// Ejecutar seed
seed();
