import 'reflect-metadata';
import { GetWeatherByCityUseCase } from '@application/use-cases/GetWeatherByCityUseCase';
import { WeatherRepository, City, Weather, WeatherCondition, TemperatureUnit } from '@domain/index';
import { ValidationError, NotFoundError } from '@shared/index';

// Mock dependencies
const mockWeatherRepository = {
    getByCity: jest.fn(),
    getByCoordinates: jest.fn(),
    getByCountry: jest.fn(),
};

const mockCityValidator = {
    validateCityName: jest.fn(),
    validateCountryCode: jest.fn(),
    normalizeCityName: jest.fn(),
};

describe('GetWeatherByCityUseCase', () => {
    let useCase: GetWeatherByCityUseCase;

    beforeEach(() => {
        jest.clearAllMocks();
        useCase = new GetWeatherByCityUseCase(
            mockWeatherRepository as any,
            mockCityValidator as any
        );
    });

    it('should return weather data when input is valid', async () => {
        // Arrange
        const request = {
            cityName: 'Madrid',
            countryCode: 'ES',
            units: 'celsius' as const
        };

        mockCityValidator.validateCountryCode.mockReturnValue(true);
        mockCityValidator.normalizeCityName.mockReturnValue('Madrid');

        const mockWeatherResult = {
            city: new City('Madrid', 'ES', 40, -3),
            weather: new Weather(
                293.15, // temp (20°C)
                19, // feels_like
                18, // min_temp
                22, // max_temp
                1013, // pressure
                50, // humidity
                10000, // visibility
                10, // wind_speed
                180, // wind_direction
                WeatherCondition.CLEAR,
                'clear sky'
            ),
            requestedAt: new Date()
        };

        mockWeatherRepository.getByCity.mockResolvedValue(mockWeatherResult);

        // Act
        const result = await useCase.execute(request);

        // Assert
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.value.city.name).toBe('Madrid');
            expect(result.value.formatted.temperature).toBe('20.0°C');
        }
    });

    it('should return ValidationError when city name is empty', async () => {
        // Arrange
        const request = {
            cityName: '',
            units: 'celsius' as const
        };

        // Act
        const result = await useCase.execute(request);

        // Assert
        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error).toBeInstanceOf(ValidationError);
        }
    });

    it('should return ValidationError when country code is invalid', async () => {
        // Arrange
        const request = {
            cityName: 'Madrid',
            countryCode: 'XX', // Invalid code
            units: 'celsius' as const
        };

        mockCityValidator.validateCountryCode.mockReturnValue(false);

        // Act
        const result = await useCase.execute(request);

        // Assert
        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error).toBeInstanceOf(ValidationError);
        }
    });

    it('should return NotFoundError when repository throws NotFoundError', async () => {
        // Arrange
        const request = {
            cityName: 'UnknownCity',
            units: 'celsius' as const
        };

        mockCityValidator.normalizeCityName.mockReturnValue('UnknownCity');
        mockWeatherRepository.getByCity.mockRejectedValue(new NotFoundError('City', 'UnknownCity'));

        // Act
        const result = await useCase.execute(request);

        // Assert
        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error).toBeInstanceOf(NotFoundError);
        }
    });
});
