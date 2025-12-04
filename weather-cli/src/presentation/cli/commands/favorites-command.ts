import { Command } from 'commander';
import { colors, icons } from '../colors';
import { getUseCase } from '@infrastructure/di/Container';
import { AddFavoriteUseCase } from '@application/use-cases/AddFavoriteUseCase';
import { ListFavoritesUseCase } from '@application/use-cases/ListFavoritesUseCase';
import { RemoveFavoriteUseCase } from '@application/use-cases/RemoveFavoriteUseCase';
import { GetWeatherForFavoritesUseCase, FavoriteWeatherResult } from '@application/use-cases/GetWeatherForFavoritesUseCase';
import { isOk, isErr } from '../../../shared';
import { Favorite } from '@domain/entities/Favorite';
import { TemperatureUnit } from '@domain/entities/Weather';

export function createFavoritesCommand(): Command {
  const command = new Command('favorites')
    .alias('fav')
    .description('Gestionar ciudades favoritas');

  // ... (ADD y LIST)

  command
    .command('add')
    .description('Agregar una ciudad a favoritos')
    .argument('<city>', 'Nombre de la ciudad')
    .argument('<country>', 'Código de país (ISO 2 letras)')
    .action(async (city: string, country: string) => {
      const useCase = getUseCase<AddFavoriteUseCase>(AddFavoriteUseCase);
      const result = await useCase.execute({ city, country });

      if (isOk(result)) {
        console.log(colors.green(`${icons.success} Ciudad agregada a favoritos: ${city}, ${country.toUpperCase()}`));
      } else if (isErr(result)) {
        console.error(colors.red(`${icons.error} Error: ${result.error.message}`));
      }
    });

  // Subcomando: LIST
  command
    .command('list')
    .alias('ls')
    .description('Listar ciudades favoritas')
    .action(async () => {
      const useCase = getUseCase<ListFavoritesUseCase>(ListFavoritesUseCase);
      const result = await useCase.execute();

      if (isOk(result)) {
        const favorites = result.value;
        if (favorites.length === 0) {
          console.log(colors.yellow('No tienes favoritos guardados.'));
          return;
        }

        console.log(colors.cyan('\n🌟 Tus Ciudades Favoritas:\n'));
        favorites.forEach((fav: Favorite) => {
          console.log(`   ${icons.location} ${colors.bold(fav.city)}, ${fav.country}`);
        });
        console.log('');
      } else if (isErr(result)) {
        console.error(colors.red(`${icons.error} Error al listar favoritos: ${result.error.message}`));
      }
    });

  // Subcomando: REMOVE
  command
    .command('remove')
    .alias('rm')
    .description('Eliminar una ciudad de favoritos')
    .argument('<city>', 'Nombre de la ciudad')
    .argument('<country>', 'Código de país (ISO 2 letras)')
    .action(async (city: string, country: string) => {
      const useCase = getUseCase<RemoveFavoriteUseCase>(RemoveFavoriteUseCase);
      const result = await useCase.execute({ city, country });

      if (isOk(result)) {
        console.log(colors.green(`${icons.success} Ciudad eliminada de favoritos: ${city}, ${country.toUpperCase()}`));
      } else if (isErr(result)) {
        console.error(colors.red(`${icons.error} Error: ${result.error.message}`));
      }
    });

  // Subcomando: CHECK (Ver clima de todos)
  command
    .command('check')
    .description('Ver el clima actual de todos los favoritos')
    .option('-u, --units <units>', 'Unidades (celsius, fahrenheit, kelvin)', 'celsius')
    .action(async (options) => {
      const useCase = getUseCase<GetWeatherForFavoritesUseCase>(GetWeatherForFavoritesUseCase);
      
      const units = options.units === 'fahrenheit' 
        ? TemperatureUnit.FAHRENHEIT 
        : options.units === 'kelvin' 
          ? TemperatureUnit.KELVIN 
          : TemperatureUnit.CELSIUS;

      const result = await useCase.execute(units);

      if (isOk(result)) {
        const weatherResults = result.value;
        
        if (weatherResults.length === 0) {
          console.log(colors.yellow('No tienes favoritos guardados. Usa "favorites add" para agregar uno.'));
          return;
        }

        console.log(colors.cyan(`\n🌍 Clima de tus Favoritos (${options.units}):\n`));
        
        weatherResults.forEach((item: FavoriteWeatherResult) => {
          if (item.weather) {
            const temp = item.weather.getTemperatureInUnit(units).toFixed(1);
            const symbol = units === TemperatureUnit.CELSIUS ? '°C' : units === TemperatureUnit.FAHRENHEIT ? '°F' : 'K';
            const condition = item.weather.description;
            
            console.log(
              `   ${icons.location} ${colors.bold(item.city.toString().padEnd(30))} ` +
              `${colors.yellow(temp + symbol)}  ` +
              `${colors.dim(condition)}`
            );
          } else {
            console.log(
              `   ${icons.error} ${colors.bold(item.city.toString().padEnd(30))} ` +
              `${colors.red('Error: ' + (item.error || 'Desconocido'))}`
            );
          }
        });
        console.log('');

      } else if (isErr(result)) {
        console.error(colors.red(`${icons.error} Error al obtener clima de favoritos: ${result.error.message}`));
      }
    });

  return command;
}
