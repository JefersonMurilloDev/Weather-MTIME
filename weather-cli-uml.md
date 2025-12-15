# Diagrama UML - Weather CLI (Clean Architecture)

## Arquitectura General

```mermaid
graph TB
    %% Capas de Arquitectura Limpia
    subgraph "Presentation Layer (Púrpura)"
        CLI[WeatherCLI]
        WEATHER_CMD[WeatherCommand]
        COUNTRY_CMD[CountryCommand]
        CONFIG_CMD[ConfigCommand]
        HISTORY_CMD[HistoryCommand]
    end
    
    subgraph "Application Layer (Verde)"
        CITY_UC[GetWeatherByCityUseCase]
        COUNTRY_UC[GetWeatherByCountryUseCase]
        REQUEST_DTO[WeatherRequestDTO]
        RESPONSE_DTO[WeatherResponseDTO]
        APP_ERRORS[ApplicationErrors]
    end
    
    subgraph "Domain Layer (Azul - Centro)"
        WEATHER[Weather]
        CITY[City]
        COORDS[Coordinates]
        WEATHER_REPO[WeatherRepository Interface]
    end
    
    subgraph "Infrastructure Layer (Naranja)"
        WEATHER_IMPL[WeatherRepositoryImpl]
        OPEN_METEO[OpenMeteoClient]
        OPEN_WEATHER[OpenWeatherMapClient]
        CONFIG[Config]
        LOGGER[Logger]
        CONTAINER[DI Container]
    end
    
    %% Dependencias (siempre hacia adentro)
    CLI --> CITY_UC
    CLI --> COUNTRY_UC
    WEATHER_CMD --> CITY_UC
    COUNTRY_CMD --> COUNTRY_UC
    
    CITY_UC --> WEATHER_REPO
    COUNTRY_UC --> WEATHER_REPO
    CITY_UC --> REQUEST_DTO
    CITY_UC --> RESPONSE_DTO
    
    WEATHER_IMPL -.-> WEATHER_REPO
    WEATHER_IMPL --> OPEN_METEO
    WEATHER_IMPL --> OPEN_WEATHER
    WEATHER_IMPL --> CONFIG
    WEATHER_IMPL --> LOGGER
    
    OPEN_METEO --> CONFIG
    OPEN_WEATHER --> CONFIG
    
    CLI --> CONFIG
    CLI --> LOGGER
    
    %% Relaciones de Dominio
    WEATHER_REPO --> WEATHER
    WEATHER_REPO --> CITY
    WEATHER_REPO --> COORDS
    
    CITY --> COORDS
```

## Diagrama de Clases Detallado

```mermaid
classDiagram
    %% Domain Layer
    class Weather {
        <<Entity>>
        -_temperature: number
        -_feelsLike: number
        -_minTemperature: number
        -_maxTemperature: number
        -_pressure: number
        -_humidity: number
        -_visibility: number
        -_windSpeed: number
        -_windDirection: number
        -_condition: WeatherCondition
        -_description: string
        -_timestamp: Date
        +getTemperatureInUnit(unit: TemperatureUnit): number
        +isCold(): boolean
        +isHot(): boolean
        +toJSON(): object
    }
    
    class City {
        <<Entity>>
        -_name: string
        -_country: string
        -_latitude?: number
        -_longitude?: number
        +hasCoordinates(): boolean
        +toString(): string
    }
    
    class Coordinates {
        <<Value Object>>
        -_latitude: number
        -_longitude: number
        +distanceTo(other: Coordinates): number
        +toString(): string
    }
    
    class WeatherRepository {
        <<Interface>>
        <<Domain>>
        +getByCity(params: WeatherQueryParams): Promise~WeatherResult~
        +getByCoordinates(coords: Coordinates, units?: TemperatureUnit): Promise~WeatherResult~
        +getByCountry(countryCode: string, limit?: number): Promise~WeatherResult[]~
    }
    
    class WeatherCondition {
        <<Enumeration>>
        CLEAR
        CLOUDS
        RAIN
        DRIZZLE
        THUNDERSTORM
        SNOW
        MIST
        FOG
        HAZE
    }
    
    class TemperatureUnit {
        <<Enumeration>>
        CELSIUS
        FAHRENHEIT
        KELVIN
    }
    
    %% Application Layer
    class GetWeatherByCityUseCase {
        <<Use Case>>
        -weatherRepository: WeatherRepository
        +execute(cityName: string, countryCode?: string): Promise~WeatherResponseDTO~
    }
    
    class GetWeatherByCountryUseCase {
        <<Use Case>>
        -weatherRepository: WeatherRepository
        +execute(countryCode: string, limit?: number): Promise~WeatherResponseDTO[]~
    }
    
    class WeatherRequestDTO {
        <<DTO>>
        +city: string
        +country?: string
        +units?: TemperatureUnit
        +language?: string
    }
    
    class WeatherResponseDTO {
        <<DTO>>
        +weather: Weather
        +city: City
        +requestedAt: Date
    }
    
    %% Infrastructure Layer
    class WeatherRepositoryImpl {
        <<Repository Implementation>>
        -openMeteoClient: OpenMeteoClient
        -openWeatherMapClient: OpenWeatherMapClient
        -config: Config
        -logger: Logger
        +getByCity(params: WeatherQueryParams): Promise~WeatherResult~
        +getByCoordinates(coords: Coordinates, units?: TemperatureUnit): Promise~WeatherResult~
        +getByCountry(countryCode: string, limit?: number): Promise~WeatherResult[]~
    }
    
    class OpenMeteoClient {
        <<API Client>>
        -client: AxiosInstance
        -config: Config
        -logger: Logger
        +getCurrentWeather(lat: number, lng: number): Promise~WeatherAPIResponse~
        +resolveCoordinates(cityName: string, countryCode?: string): Promise~Coordinates~
    }
    
    class OpenWeatherMapClient {
        <<API Client>>
        -client: AxiosInstance
        -geoClient: AxiosInstance
        -config: Config
        -logger: Logger
        +getCurrentWeather(lat: number, lng: number): Promise~WeatherAPIResponse~
        +resolveCoordinates(cityName: string, countryCode?: string): Promise~Coordinates~
    }
    
    %% Presentation Layer
    class WeatherCLI {
        <<CLI Application>>
        -program: Command
        +createCLI(): Command
        +setupCommands(program: Command): void
        +runCLI(): Promise~void~
    }
    
    class WeatherCommand {
        <<Command>>
        +createCommand(): Command
    }
    
    class CountryCommand {
        <<Command>>
        +createCommand(): Command
    }
    
    %% Relaciones
    WeatherRepository <|-- WeatherRepositoryImpl
    GetWeatherByCityUseCase --> WeatherRepository
    GetWeatherByCountryUseCase --> WeatherRepository
    WeatherRepositoryImpl --> OpenMeteoClient
    WeatherRepositoryImpl --> OpenWeatherMapClient
    WeatherCommand --> GetWeatherByCityUseCase
    CountryCommand --> GetWeatherByCountryUseCase
    WeatherCLI --> WeatherCommand
    WeatherCLI --> CountryCommand
    
    City --> Coordinates
    WeatherRepository --> Weather
    WeatherRepository --> City
    WeatherRepository --> Coordinates
    
    Weather --> WeatherCondition
    Weather --> TemperatureUnit
    
    GetWeatherByCityUseCase --> WeatherRequestDTO
    GetWeatherByCityUseCase --> WeatherResponseDTO
```

## Flujo de Datos

```mermaid
sequenceDiagram
    participant CLI as WeatherCLI
    participant UC as GetWeatherByCityUseCase
    participant REPO as WeatherRepositoryImpl
    participant API as OpenWeatherMapClient
    participant DOMAIN as Weather Domain
    
    CLI->>UC: execute("Bogotá", "CO")
    UC->>REPO: getByCity({city, units})
    REPO->>API: resolveCoordinates("Bogotá", "CO")
    API-->>REPO: Coordinates(4.7110, -74.0721)
    REPO->>API: getCurrentWeather(lat, lng)
    API-->>REPO: WeatherAPIResponse
    REPO->>DOMAIN: Weather.create(data)
    DOMAIN-->>REPO: Weather Entity
    REPO-->>UC: WeatherResult
    UC-->>CLI: WeatherResponseDTO
    CLI-->>User: Formatted Weather Output
```

## Patrones de Diseño Implementados

1. **Clean Architecture**: Capas claramente separadas con dependencias hacia adentro
2. **Repository Pattern**: Abstracción del acceso a datos
3. **Dependency Injection**: Container para gestionar dependencias
4. **Command Pattern**: Para los comandos CLI
5. **DTO Pattern**: Para transferencia de datos entre capas
6. **Value Objects**: Para objetos inmutables como Coordinates
7. **Result Pattern**: Para manejo de errores (en shared/result)

## Notas Técnicas

- **TypeScript**: Tipado fuerte en todo el proyecto
- **Commander.js**: Framework CLI para manejo de comandos
- **Axios**: Cliente HTTP para llamadas a APIs externas
- **Clean Architecture**: Estructura en capas con reglas de dependencia claras
- **SOLID Principles**: Aplicados en todo el diseño
- **Error Handling**: Centralizado con tipos específicos de error
