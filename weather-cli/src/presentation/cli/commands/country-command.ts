/**
 * Comando CLI para obtener el clima de múltiples ciudades en un país
 * Implementa la interfaz de usuario para la opción "weather country"
 */
import { Command } from 'commander';
import { GetWeatherByCountryUseCase } from '@application/use-cases/GetWeatherByCountryUseCase';
import { GetWeatherByCountryRequestDTO } from '@application';
import { isOk, isErr } from '@shared';
import { logger } from '@infrastructure/logger/Logger';
import { appConfig } from '@infrastructure/config/Config';
import { getUseCase } from '@infrastructure/di/Container';
import { colors, icons, errorMessage, successMessage, separator } from '../colors';

/**
 * Formateador de lista de ciudades
 */
class CountryWeatherFormatter {
  format(countryData: any): string {
    if (appConfig.cli.showProgress) {
      return this.formatDetailed(countryData);
    }

    return this.formatSimple(countryData);
  }

  private formatSimple(data: any): string {
    const lines = [
      `País: ${data.country}`,
      `Total de ciudades: ${data.totalCities}`,
      'Datos por ciudad:'
    ];

    data.cities.forEach((city: any, index: number) => {
      const temp = `${city.temperature.toFixed(1)}°${this.getUnitName(data.units)}`;
      lines.push(`  ${index + 1}. ${city.city}: ${colors.bold(temp)} - ${city.description}`);
    });

    return lines.join('\n');
  }

  private formatDetailed(data: any): string {
    const lines = [
      colors.blue(colors.bold('🌍 Clima por País')),
      colors.gray(separator('═', 50)),
      '',
      `📍 País: ${colors.bold(data.country)}`,
      `${icons.info} Total de ciudades: ${data.totalCities}`,
      colors.gray(separator('─', 30)),
      ''
    ];

    data.cities.forEach((weather: any) => {
      lines.push(...this.formatCityWeather(weather, data.units));
      lines.push(''); // Espaciado entre ciudades
    });

    return lines.join('\n');
  }

  private formatCityWeather(weather: any, units: string): string[] {
    const temp = `${weather.temperature.toFixed(1)}°${this.getUnitName(units)}`;
    const feelsLike = `${weather.feelsLike.toFixed(1)}°${this.getUnitName(units)}`;

    return [
      `${colors.bold(`🏙️  ${weather.city}`)}`,
      `   🌡️  Temperatura: ${colors.bold(temp)}`,
      `   🥶  Sensación térmica: ${feelsLike}`,
      `   📈  Max: ${weather.maxTemperature.toFixed(1)}° - Min: ${weather.minTemperature.toFixed(1)}°`,
      `   💧  Humedad: ${weather.humidity}%`,
      `   💨  Viento: ${(weather.windSpeed * 3.6).toFixed(1)} km/h`,
      `   🌤️  Condición: ${weather.description}`,
      `   🕐  Actualizado: ${new Date(weather.timestamp).toLocaleString('es-ES')}`
    ];
  }

  private getUnitName(units: string): string {
    return units === 'celsius' ? 'C' : units === 'fahrenheit' ? 'F' : 'K';
  }
}

/**
 * Crea el comando para obtener clima por país
 */
export function createCountryCommand(): Command {
  const formatter = new CountryWeatherFormatter();

  return new Command('country')
    .description('Obtiene el clima de múltiples ciudades en un país')
    .alias('c')
    .argument('<pais>', 'Nombre o código ISO del país (ej: España, ES)')
    .option('-l, --limit <limit>', 'Número máximo de ciudades a mostrar (1-50)', '5')
    .option('-u, --units <units>', 'Unidades de temperatura: celsius, fahrenheit, kelvin', 'celsius')
    .option('-d, --detailed', 'Muestra información detallada de cada ciudad')
    .option('-v, --verbose', 'Muestra información detallada del error si ocurre')
    .action(async (country: string, options) => {
      logger.info(`Solicitando clima para país: ${country}`);

      const typedOptions = options as {
        limit: string;
        units: 'celsius' | 'fahrenheit' | 'kelvin';
        detailed?: boolean;
        verbose?: boolean;
      };

      try {
        // Validar el límite
        const limit = parseInt(typedOptions.limit, 10);
        if (isNaN(limit) || limit < 1 || limit > 50) {
          console.error(errorMessage('El límite debe ser un número entre 1 y 50'));
          process.exit(1);
        }

        // Crear DTO
        const request: GetWeatherByCountryRequestDTO = {
          country: country,
          limit: limit,
          units: typedOptions.units,
        };

        const useCase = getUseCase<GetWeatherByCountryUseCase>(
          GetWeatherByCountryUseCase,
        );

        logger.debug('Ejecutando caso de uso por país...', {
          country: request.country,
          limit: request.limit ?? null,
          units: request.units ?? null,
        });

        const result = await useCase.execute(request);

        if (isOk(result)) {
          console.log(formatter.format(result.value));
          console.log(successMessage('✅ Datos obtenidos exitosamente'));
        } else if (isErr(result)) {
          const error = result.error;

          if (typedOptions.verbose) {
            console.error(colors.brightRed('❌ Error detallado:'));
            console.error(colors.red(JSON.stringify(error.toJSON(), null, 2)));
          } else {
            if (error.message.includes('no fue encontrado')) {
              console.error(errorMessage(
                `El país "${country}" no fue encontrado`,
                'Verifica el nombre o usa el código ISO (ej: "ES" para España)'
              ));
            } else {
              console.error(errorMessage(error.message));
            }
          }

          process.exit(1);
        }

      } catch (error) {
        if (error instanceof Error) {
          logger.error('Error procesando comando país', error);
        } else {
          logger.error('Error procesando comando país', {
            name: 'UnknownError',
            message: String(error),
          });
        }
        console.error(errorMessage('Error al procesar la solicitud'));

        if (typedOptions.verbose) {
          console.error(error);
        }

        process.exit(1);
      }
    });
}
