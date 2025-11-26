# Weather CLI ☀️

CLI de consulta de clima desarrollada con TypeScript, siguiendo principios de Clean Architecture y Domain-Driven Design.

## Características

- 🌡️ Consulta el clima de cualquier ciudad del mundo
- 🌍 Consulta el clima de múltiples ciudades por país
- 📊 Historial de búsquedas con estadísticas (MongoDB)
- 💾 Caché en memoria para optimizar consultas
- 🐳 Docker Compose para MongoDB

## Requisitos

- Node.js 18+
- Docker y Docker Compose (opcional, para historial persistente)
- API Key de [OpenWeatherMap](https://openweathermap.org/api)

## Instalación

```bash
# Clonar el repositorio
git clone https://github.com/JefersonMurilloDev/Weather-MTIME.git
cd weather-cli

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tu API_KEY de OpenWeatherMap
```

## Configuración

Edita el archivo `.env`:

```env
# Requerido
OPENWEATHERMAP_API_KEY=tu_api_key_aqui

# Opcional - MongoDB para historial persistente
MONGO_ENABLED=true
MONGO_URL=mongodb://jefersonmurillodev:123456@localhost:27017
MONGO_DB_NAME=WEATHER-CLI
```

## Uso

### Consultar clima por ciudad

```bash
# Formato: ciudad, código de país
npx tsx src/index.ts weather get "Madrid, ES"
npx tsx src/index.ts weather get "Tokyo, JP"
npx tsx src/index.ts weather get "New York, US"

# Con unidades específicas
npx tsx src/index.ts weather get "London, GB" --units fahrenheit
```

### Consultar clima por país

```bash
# Muestra el clima de las principales ciudades del país
npx tsx src/index.ts country CO --limit 5
npx tsx src/index.ts country ES --limit 3
npx tsx src/index.ts country JP
```

### Ver historial de búsquedas

```bash
# Ver últimas búsquedas
npx tsx src/index.ts history

# Ver más búsquedas
npx tsx src/index.ts history --limit 20

# Ver estadísticas de uso (requiere MongoDB)
npx tsx src/index.ts history --stats

# Limpiar historial
npx tsx src/index.ts history --clear --force
```

### Ayuda

```bash
npx tsx src/index.ts --help
npx tsx src/index.ts weather --help
npx tsx src/index.ts country --help
```

## Docker (MongoDB)

Para habilitar el historial persistente:

```bash
# Iniciar MongoDB
docker-compose up -d

# Verificar que está corriendo
docker ps

# Mongo Express disponible en http://localhost:8081
# Usuario: admin / Contraseña: admin123
```

## Arquitectura

```
src/
├── application/          # Casos de uso y servicios
│   ├── use-cases/
│   └── services/
├── domain/               # Entidades y repositorios (interfaces)
│   ├── entities/
│   └── repositories/
├── infrastructure/       # Implementaciones concretas
│   ├── api/              # Clientes HTTP (OpenWeatherMap)
│   ├── cache/            # Adaptadores de caché
│   ├── config/           # Configuración
│   ├── database/         # MongoDB/Mongoose
│   ├── di/               # Inyección de dependencias
│   └── repositories/     # Implementaciones de repositorios
├── presentation/         # CLI (Commander.js)
│   └── cli/
└── shared/               # Utilidades compartidas
    └── errors/
```

## Tests

```bash
# Ejecutar todos los tests
npm test

# Con cobertura
npm run test:coverage
```

## Scripts disponibles

| Script | Descripción |
|--------|-------------|
| `npm start` | Ejecuta la CLI |
| `npm test` | Ejecuta los tests |
| `npm run build` | Compila TypeScript |
| `npm run lint` | Ejecuta ESLint |

## Tecnologías

- **TypeScript** - Tipado estático
- **Commander.js** - Framework CLI
- **Mongoose** - ODM para MongoDB
- **tsyringe** - Inyección de dependencias
- **Zod** - Validación de esquemas
- **Axios** - Cliente HTTP
- **Jest** - Testing

## Licencia

MIT
