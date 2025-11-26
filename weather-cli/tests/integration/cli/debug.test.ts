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
        isDevelopment: () => false,
        isTest: () => true
    }
}));
jest.mock('@presentation/cli/commands/history-command');

describe('Debug Test', () => {
    it('should pass imports and creation', () => {
        try {
            const cmd = createWeatherCommand();
            expect(cmd).toBeDefined();
        } catch (e) {
            console.error('ERROR IN TEST:', e);
            throw e;
        }
    });
});
