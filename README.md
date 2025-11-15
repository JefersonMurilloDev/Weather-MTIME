# MTIME / Weather CLI

Este repositorio contiene el proyecto **weather-cli**, una línea de comandos escrita en TypeScript que sigue principios de **Clean Architecture** para consultar el clima actual de distintas ciudades y países usando proveedores externos de clima (Open-Meteo y OpenWeatherMap).

## ¿Qué es este proyecto?

La idea principal es tener una aplicación de consola que permita:

- **Consultar el clima por ciudad** (ej: `Madrid, ES`).
- **Listar el clima de varias ciudades de un país** (ej: España, Brasil, Colombia).
- **Cambiar de proveedor de clima** mediante configuración (`open-meteo` u `openweather`).
- **Guardar historial de consultas** en un archivo local.
- **Tener una arquitectura limpia y extensible** (domain, application, infrastructure, presentation).

Todo esto está implementado en la carpeta `weather-cli/`, que es un proyecto Node.js/TypeScript independiente.

## Estructura principal

Dentro de `weather-cli/` encontrarás:

- `src/domain/`
  - Entidades como `Weather`, `City`, `Coordinates`.
  - Interfaces como `WeatherRepository`.
- `src/application/`
  - Casos de uso: `GetWeatherByCityUseCase`, `GetWeatherByCountryUseCase`, etc.
  - DTOs y errores de aplicación.
- `src/infrastructure/`
  - **API clients**: `OpenMeteoClient`, `OpenWeatherMapClient`.
  - **Repositorios**: `WeatherRepositoryImpl` que combina los clientes con la lógica de dominio.
  - **Config**: lectura/validación de variables de entorno con Zod.
  - **Logger**: sistema de logging estructurado.
  - **DI Container**: configuración de dependencias con `tsyringe`.
- `src/presentation/cli/`
  - Comandos de CLI (`weather-command.ts`, `country-command.ts`, `history-command.ts`, `config-command.ts`).
  - Entrada principal del CLI (`WeatherCLI.ts` y `src/index.ts`).

Esta separación permite cambiar proveedores de clima, almacenamiento, o interfaz de usuario sin romper el resto del sistema.

## Proveedores de clima

Actualmente se soportan dos proveedores:

- **Open-Meteo** (por defecto)
  - No requiere API key.
  - Se usa principalmente para desarrollo y pruebas.
- **OpenWeatherMap**
  - Requiere API key (`OPENWEATHER_API_KEY`).
  - Usa geocoding oficial y el endpoint `/data/2.5/weather`.

Puedes elegir el proveedor mediante la variable de entorno `WEATHER_PROVIDER`.

## Configuración y variables de entorno

En la carpeta `weather-cli/` se utiliza un archivo `.env` (ignorado por git). Ejemplo básico:

```env
# Proveedor de clima
WEATHER_PROVIDER=open-meteo   # o "openweather"

# Solo necesario si usas OpenWeatherMap
OPENWEATHER_API_KEY=TU_API_KEY
OPENWEATHER_BASE_URL=https://api.openweathermap.org/data/2.5

# Opciones de CLI
WEATHER_CLI_DEFAULT_UNITS=metric
WEATHER_CLI_DEFAULT_LANGUAGE=es
```

La configuración se valida con Zod en `src/infrastructure/config/Config.ts`, y se expone a través de un singleton `AppConfig`.

## Scripts principales

Dentro de `weather-cli/`:

- `npm run type-check` – Ejecuta `tsc --noEmit` para comprobar tipos.
- `npm run lint` – Ejecuta ESLint sobre `src/`.
- `npm run build` – Compila TypeScript a JavaScript en `dist/`.

## Cómo ejecutar el CLI en desarrollo

Desde `weather-cli/` (con Node y dependencias instaladas):

```bash
# Instalar dependencias
npm install

# Ejecutar en modo TS (tsx)
npx tsx src/index.ts --help
```

Ejemplos de comandos:

```bash
# Clima por ciudad (proveedor actual)
npx tsx src/index.ts weather get "Madrid, ES"

# Clima por ciudad con logs detallados
npx tsx src/index.ts weather get "Madrid, ES" --verbose

# Clima por país (lista de ciudades configuradas en TOP_CITIES_BY_COUNTRY)
npx tsx src/index.ts country ES --limit 3 --detailed
npx tsx src/index.ts country BR --limit 3 --detailed
npx tsx src/index.ts country CO --limit 3 --detailed

# Ver historial de consultas
npx tsx src/index.ts history

# Ver o cambiar configuración
npx tsx src/index.ts config list
```

## Ejemplos de salida reales

### Clima por ciudad (Madrid, ES, OpenWeatherMap)

```bash
$ npx tsx src/index.ts weather get "Madrid, ES" --verbose
[dotenv@17.2.3] injecting env (7) from .env -- tip: ...
✅ Configuración cargada exitosamente
[2025-11-15T16:34:29.465Z] INFO  Solicitando clima para: Madrid, ES
[2025-11-15T16:34:29.467Z] INFO  Obteniendo clima para ciudad: Madrid, ES
Consultando clima para ciudad: Madrid, ES
Resolviendo coordenadas via OpenWeatherMap Geocoding para: Madrid,ES
Consultando clima por coordenadas: 40.4167047, -3.7035825

🌤️  Clima actual en Madrid, ES
   🌡️  Temperatura: 11.6°C
   🥶  Sensación térmica: 11.2°C
   📈  Max: 12.7° - Min: 10.7°
   💧  Humedad: 92%
   💨  Viento: 5.1 km/h
   🌤️  Condición: broken clouds (OpenWeatherMap)
   🕐  Actualizado: 15/11/2025, 16:34:30
```

### Clima por país (España, Open-Meteo)

```bash
$ npx tsx src/index.ts country ES --limit 3 --detailed
[dotenv@17.2.3] injecting env (7) from .env -- tip: ...
✅ Configuración cargada exitosamente
[2025-11-15T15:47:46.565Z] INFO  Solicitando clima para país: ES
[2025-11-15T15:47:46.568Z] INFO  Obteniendo clima para 3 ciudades en país: ES
[2025-11-15T15:47:49.096Z] INFO  Obtenidos 3 registros de clima para el país ES

🌍 Clima por País
══════════════════════════════════════════════════

📍 País: España
ℹ️ Total de ciudades: 3
──────────────────────────────

🏙️  Madrid
   🌡️  Temperatura: 12.3°C
   🥶  Sensación térmica: 10.8°C
   📈  Max: 12.3° - Min: 12.3°
   💧  Humedad: 90%
   💨  Viento: 43.2 km/h
   🌤️  Condición: Clear sky (Open-Meteo)
   🕐  Actualizado: 15/11/2025, 10:47:48

🏙️  Barcelona
   🌡️  Temperatura: 19.1°C
   🥶  Sensación térmica: 18.0°C
   📈  Max: 19.1° - Min: 19.1°
   💧  Humedad: 54%
   💨  Viento: 24.8 km/h
   🌤️  Condición: Clear sky (Open-Meteo)
   🕐  Actualizado: 15/11/2025, 10:47:48

🏙️  Valencia
   🌡️  Temperatura: 20.3°C
   🥶  Sensación térmica: 20.4°C
   📈  Max: 20.3° - Min: 20.3°
   💧  Humedad: 54%
   💨  Viento: 2.9 km/h
   🌤️  Condición: Clear sky (Open-Meteo)
   🕐  Actualizado: 15/11/2025, 10:47:49

✅ ✅ Datos obtenidos exitosamente
```

## Arquitectura limpia (Clean Architecture)

El proyecto está diseñado para:

- Mantener la **lógica de negocio** en el dominio y en los casos de uso.
- Aislar infraestructuras externas (APIs de clima, filesystem, logging).
- Permitir pruebas y sustitución de dependencias usando inyección de dependencias.

Capas:

- **Domain**: modelos puros y reglas de negocio básicas.
- **Application**: casos de uso, orquestación, validación.
- **Infrastructure**: integración con APIs externas, configuración, logging, repositorios.
- **Presentation**: CLI (Commander.js), interacción con el usuario.

## Estado actual

- Soporte completo para Open-Meteo y OpenWeatherMap.
- Comandos `weather` y `country` funcionando con logs detallados.
- TypeScript estricto (`exactOptionalPropertyTypes`, `noPropertyAccessFromIndexSignature`, `isolatedModules`).
- Linting y type-check en verde.

## Próximas mejoras posibles

- Añadir más países y ciudades a `TOP_CITIES_BY_COUNTRY`.
- Mejorar aún más la presentación en consola (colores, tablas).
- Empaquetar el CLI como binario global (`npm link` o publicación en npm).
- Añadir pruebas automatizadas para casos de uso y adaptadores de API.
