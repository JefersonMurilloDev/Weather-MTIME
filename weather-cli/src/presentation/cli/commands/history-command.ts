/**
 * Comando CLI para ver el historial de búsquedas
 * Soporta MongoDB (si está habilitado) o archivo local como fallback
 */
import { Command } from 'commander';
import { logger } from '@infrastructure/logger/Logger';
import { colors, icons, warningMessage } from '../colors';
import { appConfig } from '@infrastructure/config/Config';
import { getDependency } from '@infrastructure/di/Container';
import { HistoryService } from '@application/services/HistoryService';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

interface HistoryEntry {
  timestamp: string; // ISO string para persistencia
  query: string;
  city: string;
  country?: string;
  temperature: number;
}

/**
 * Gestor de historial persistente en archivo JSON
 */
export class HistoryManager {
  private static readonly historyFileName = '.weather-cli-history.json';
  private static searches: HistoryEntry[] = [];

  private static getHistoryFilePath(): string {
    return path.join(os.homedir(), HistoryManager.historyFileName);
  }

  private static loadFromFile(): void {
    const filePath = this.getHistoryFilePath();
    try {
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf-8');
        const parsed = JSON.parse(content) as HistoryEntry[];
        this.searches = Array.isArray(parsed) ? parsed : [];
      } else {
        this.searches = [];
      }
    } catch (error) {
      logger.warn('Error leyendo historial desde archivo', error as any);
      this.searches = [];
    }
  }

  private static saveToFile(): void {
    const filePath = this.getHistoryFilePath();
    try {
      fs.writeFileSync(filePath, JSON.stringify(this.searches, null, 2), 'utf-8');
    } catch (error) {
      logger.warn('Error guardando historial en archivo', error as any);
    }
  }

  /**
   * Registra una búsqueda
   */
  logSearch(query: string, city: string, country: string | undefined, temperature: number): void {
    // Cargar historial actual
    HistoryManager.loadFromFile();

    const entry: HistoryEntry = {
      timestamp: new Date().toISOString(),
      query,
      city,
      temperature
    };

    if (country !== undefined) {
      entry.country = country;
    }

    HistoryManager.searches.push(entry);

    // Mantener solo las últimas 100 búsquedas
    if (HistoryManager.searches.length > 100) {
      HistoryManager.searches.shift();
    }

    HistoryManager.saveToFile();
  }

  /**
   * Obtiene el historial
   */
  getHistory(): typeof HistoryManager.searches {
    HistoryManager.loadFromFile();
    return HistoryManager.searches;
  }

  /**
   * Limpia el historial
   */
  clear(): void {
    HistoryManager.searches = [];
    HistoryManager.saveToFile();
  }
}

/**
 * Obtiene el servicio de historial MongoDB si está disponible
 */
function getHistoryService(): HistoryService | null {
  if (appConfig.mongodb.enabled) {
    try {
      return getDependency<HistoryService>('HistoryService');
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * Crea el comando de historial
 */
export function createHistoryCommand(): Command {
  const historyManager = new HistoryManager();

  const history = new Command('history')
    .description('Muestra el historial de búsquedas')
    .alias('h')
    .addHelpText('after', `
Ejemplos:
  weather history                    # Muestra las últimas búsquedas
  weather history --limit 20         # Muestra las últimas 20 búsquedas
  weather history --stats            # Muestra estadísticas de uso
  weather history --clear --force    # Limpia el historial`);

  history
    .option('-l, --limit <limit>', 'Límite de búsquedas a mostrar', '10')
    .option('-s, --stats', 'Muestra estadísticas de uso')
    .option('-c, --clear', 'Limpia todo el historial')
    .option('-f, --force', 'Confirma la acción de limpiar')
    .action(async (options) => {
      const historyService = getHistoryService();

      try {
        // Comando: --stats (solo MongoDB)
        if (options.stats) {
          if (!historyService) {
            console.log(warningMessage('Las estadísticas requieren MongoDB habilitado'));
            console.log(colors.dim('Configura MONGO_ENABLED=true en tu .env'));
            return;
          }

          const stats = await historyService.getStats();
          if (!stats) {
            console.log(warningMessage('No se pudieron obtener las estadísticas'));
            return;
          }

          console.log(colors.blue(colors.bold(`📊 Estadísticas de Uso`)));
          console.log(colors.gray('─'.repeat(50)));
          console.log('');
          console.log(`🔍 Total de búsquedas: ${colors.bold(String(stats.totalSearches))}`);
          console.log(`🏙️  Ciudades únicas: ${colors.bold(String(stats.uniqueCities))}`);
          console.log(`🌍 Países únicos: ${colors.bold(String(stats.uniqueCountries))}`);
          
          if (stats.mostSearchedCity) {
            console.log(`⭐ Ciudad más buscada: ${colors.bold(`${stats.mostSearchedCity.city}, ${stats.mostSearchedCity.country}`)} (${stats.mostSearchedCity.count} veces)`);
          }
          
          if (stats.averageTemperature > 0) {
            console.log(`🌡️  Temperatura promedio: ${colors.bold(`${stats.averageTemperature.toFixed(1)}°C`)}`);
          }
          console.log('');
          return;
        }

        // Comando: --clear
        if (options.clear) {
          if (!options.force) {
            console.log(warningMessage('⚠️  Estás a punto de limpiar TODO el historial.'));
            console.log(colors.dim('   Esto no se puede deshacer.'));
            console.log('');
            console.log(colors.yellow('Agrega --force para confirmar'));
            return;
          }

          if (historyService) {
            const count = await historyService.clearAll();
            console.log(colors.green(`✅ Historial limpiado: ${count} registros eliminados`));
          } else {
            historyManager.clear();
            console.log(colors.green('✅ Historial local limpiado'));
          }
          return;
        }

        // Comando: mostrar historial
        const limit = parseInt(options.limit, 10);
        if (isNaN(limit) || limit < 1) {
          console.error(`❌ Error: --limit debe ser un número positivo`);
          process.exit(1);
        }

        // Usar MongoDB o archivo local
        if (historyService) {
          const searches = await historyService.getAll(limit);

          if (searches.length === 0) {
            console.log(warningMessage('No hay búsquedas en el historial'));
            return;
          }

          console.log(colors.blue(colors.bold(`${icons.time} Historial de búsquedas`)));
          console.log(colors.dim('(MongoDB)'));
          console.log(colors.gray('─'.repeat(50)));
          console.log('');

          searches.forEach((search) => {
            const temp = colors.bold(`${search.temperature.toFixed(1)}°C`);
            const location = `${search.cityName}, ${search.countryCode}`;
            const date = search.searchedAt;

            console.log(`${colors.bold(location)}: ${temp}`);
            console.log(colors.dim(`  "${search.searchQuery}" - ${date.toLocaleString('es-ES')}`));
            console.log('');
          });

          console.log(colors.dim(`💡 Mostrando ${searches.length} búsquedas más recientes`));

        } else {
          // Fallback a archivo local
          const searches = historyManager.getHistory();
          const displayCount = Math.min(limit, searches.length);

          if (searches.length === 0) {
            console.log(warningMessage('No hay búsquedas en el historial'));
            return;
          }

          console.log(colors.blue(colors.bold(`${icons.time} Historial de búsquedas`)));
          console.log(colors.dim('(archivo local)'));
          console.log(colors.gray('─'.repeat(50)));
          console.log('');

          const recent = searches.slice(-displayCount);
          recent.reverse();

          recent.forEach((search) => {
            const temp = colors.bold(`${search.temperature}°C`);
            const location = search.country
              ? `${search.city}, ${search.country}`
              : search.city;
            const date = new Date(search.timestamp);

            console.log(`${colors.bold(location)}: ${temp}`);
            console.log(colors.dim(`  ${search.query} - ${date.toLocaleString('es-ES')}`));
            console.log('');
          });

          if (searches.length > displayCount) {
            console.log(colors.dim(`💡 Mostrando las ${displayCount} más recientes de ${searches.length} búsquedas`));
          }
        }

      } catch (error) {
        if (error instanceof Error) {
          logger.error('Error en historial', error);
        } else {
          logger.error('Error en historial', {
            name: 'UnknownError',
            message: String(error),
          });
        }
        console.error(`❌ Error al procesar el historial: ${error}`);
        process.exit(1);
      }
    });

  return history;
}
