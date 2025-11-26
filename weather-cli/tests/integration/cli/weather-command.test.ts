import 'reflect-metadata';
import { createWeatherCommand } from '../../../src/presentation/cli/commands/weather-command';
import { City, Weather, WeatherCondition } from '@domain/index';
import { ok, err, ValidationError, NotFoundError } from '@shared/index';
import { Command } from 'commander';
import { getUseCase } from '@infrastructure/di/Container';

jest.mock('@infrastructure/di/Container');
jest.mock('@infrastructure/logger/Logger');
jest.mock('@infrastructure/config/Config', () => ({
    appConfig: {
        cli: {
            showProgress: false
        },
        logging: {
            level: 'error',
            enableColors: false
        },
        mongodb: {
            enabled: false
        },
        isDevelopment: () => false,
        isTest: () => true
    }
}));
jest.mock('@presentation/cli/commands/history-command');

describe('Weather Command Integration', () => {
    let command: Command;
    let consoleLogSpy: jest.SpyInstance;
    let consoleErrorSpy: jest.SpyInstance;
    let processExitSpy: jest.SpyInstance;
    let mockExecute: jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();

        mockExecute = jest.fn();
        (getUseCase as jest.Mock).mockReturnValue({
            execute: mockExecute
        });

        command = createWeatherCommand();

        // Suppress console output during tests
        consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
        processExitSpy = jest.spyOn(process, 'exit').mockImplementation((code?: string | number | null | undefined) => {
            throw new Error(`Process.exit called with code ${code}`);
        });
    });

    afterEach(() => {
        consoleLogSpy.mockRestore();
        consoleErrorSpy.mockRestore();
        processExitSpy.mockRestore();
    });

    it('should display weather info when use case returns success', async () => {
        // Arrange
        const mockWeather = new Weather(
            20.0, // temperatura ya en Celsius
            19.0,
            17.0,
            22.0,
            1013,
            50,
            10000,
            5,
            180,
            WeatherCondition.CLEAR,
            'clear sky'
        );
        const mockCity = new City('Madrid', 'ES', 40, -3);

        const mockOutput = {
            weather: mockWeather,
            city: mockCity,
            formatted: {
                display: 'Clima en Madrid, ES',
                temperature: '20.0°C',
                conditions: 'Clear sky'
            }
        };

        mockExecute.mockResolvedValue(ok(mockOutput));

        // Act
        await command.parseAsync(['node', 'test', 'Madrid']);

        // Assert
        expect(mockExecute).toHaveBeenCalled();
        expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Madrid, ES'));
        expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('20.0°C'));
    });

    it('should display error message when city is not found', async () => {
        // Arrange
        mockExecute.mockResolvedValue(err(new NotFoundError('City', 'Unknown')));

        // Act
        try {
            await command.parseAsync(['node', 'test', 'Unknown']);
        } catch (e: any) {
            expect(e.message).toContain('Process.exit called with code 1');
        }

        // Assert
        expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('No se encontró información climática'));
    });

    it('should display validation error when input is invalid', async () => {
        // Arrange
        mockExecute.mockResolvedValue(err(new ValidationError('Invalid city')));

        // Act
        try {
            await command.parseAsync(['node', 'test', 'Invalid']);
        } catch (e: any) {
            expect(e.message).toContain('Process.exit called with code 1');
        }

        // Assert
        expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('La ubicación proporcionada no es válida'));
    });
});
