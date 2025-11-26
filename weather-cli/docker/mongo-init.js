/**
 * Script de inicialización de MongoDB
 * Se ejecuta automáticamente cuando el contenedor inicia por primera vez
 * 
 * Nota: Mongoose maneja el schema, aquí solo creamos índices para optimización
 */

// Usar la base de datos configurada en docker-compose
db = db.getSiblingDB('WEATHER-CLI');

// Crear índices para optimizar consultas de historial
db.createCollection('searchhistories');
db.searchhistories.createIndex({ searchedAt: -1 }); // Ordenar por fecha descendente
db.searchhistories.createIndex({ cityName: 1, countryCode: 1 }); // Búsqueda por ciudad

print('✅ Base de datos WEATHER-CLI inicializada');
print('📊 Colección searchhistories creada con índices');
