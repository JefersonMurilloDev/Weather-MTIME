import 'reflect-metadata';

import { WeatherRepositoryImpl, WeatherAPIClient } from '@infrastructure/repositories/WeatherRepositoryImpl';
import { Logger } from '@infrastructure/logger/Logger';
import { City, Weather, WeatherCondition, TemperatureUnit } from '@domain/index';
import { Type } from '@infrastructure/api/WeatherAPIResponse';

// Mock dependencies
const mockApiClient = {
    getCurrentWeatherByCityName: jest.fn(),
    getCurrentWeatherByCoordinates: jest.fn(),
    getCitiesByCountry: jest.fn(),
};

const mockLogger = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
};

const mockCacheService = {
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
    clear: jest.fn(),
};

describe('WeatherRepositoryImpl', () => {
    let repository: WeatherRepositoryImpl;

    beforeEach(() => {
        jest.clearAllMocks();
        repository = new WeatherRepositoryImpl(
            mockApiClient as any,
            mockLogger as any,
            mockCacheService as any
        );
    });

    it('should return weather result when API call is successful', async () => {
        // Arrange
        const cityName = 'Madrid';
        const mockApiResponse: Type = {
            coord: { lat: 40.4168, lon: -3.7038 },
            weather: [{ id: 800, main: 'Clear', description: 'clear sky', icon: '01d' }],
            base: 'stations',
            main: {
                temp: 293.15, // 20°C
                feels_like: 293.15,
                temp_min: 293.15,
                temp_max: 293.15,
                pressure: 1013,
                humidity: 50
            },
            visibility: 10000,
            wind: { speed: 5, deg: 0 },
            clouds: { all: 0 },
            dt: 1634567890,
            sys: { country: 'ES', sunrise: 1634534567, sunset: 1634578901 },
            timezone: 7200,
            id: 3117735,
            name: 'Madrid',
            cod: 200
        };

        mockApiClient.getCurrentWeatherByCityName.mockResolvedValue(mockApiResponse);

        // Act
        const result = await repository.getByCity({
            city: new City('Madrid', 'ES', 0, 0),
            units: TemperatureUnit.CELSIUS
        });

        // Assert
        expect(result).toBeDefined();
        expect(result.city.name).toBe('Madrid');
        expect(result.weather.temperature).toBe(293.15);
        expect(mockApiClient.getCurrentWeatherByCityName).toHaveBeenCalledWith('Madrid', 'ES', 'metric');
    });

    it('should throw error when API call fails', async () => {
        // Arrange
        mockApiClient.getCurrentWeatherByCityName.mockRejectedValue(new Error('API Error'));

        // Act & Assert
        await expect(repository.getByCity({
            city: new City('Madrid', 'ES', 0, 0)
        })).rejects.toThrow();
    });
});
