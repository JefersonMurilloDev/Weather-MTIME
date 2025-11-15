/**
 * Comando CLI para ver el historial de búsquedas
 * (Implementación simplificada - en producción usaríamos una base de datos)
 */
import { Command } from 'commander';
import { logger } from '@infrastructure/logger/Logger';
import { colors, icons, warningMessage } from '../colors';
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
 * Crea el comando de historial
 */
export function createHistoryCommand(): Command {
  const historyManager = new HistoryManager();

  const history = new Command('history')
    .description('Muestra el historial de búsquedas')
    .alias('h')
    .addHelpText('after', `
Ejemplos:
  weather history                    # Muestra todas las búsquedas
  weather history --limit 20         # Muestra las últimas 20 búsquedas
  weather history --clear            # Limpia el historial`);

  history
    .option('-l, --limit <limit>', 'Límite de búsquedas a mostrar (por defecto: 10)', '10')
    .option('-c, --clear', 'Limpia todo el historial')
    .action(async (options) => {
      try {
        if (options.clear) {
          console.log(warningMessage('⚠️  Estás a punto de limpiar TODO el historial.'));
          console.log(colors.dim('   Esto no se puede deshacer.'));
          console.log('');
          console.log('Agrega --force para confirmar');
          return;
        }

        const limit = parseInt(options.limit, 10);
        if (isNaN(limit) || limit < 1) {
          console.error(`❌ Error: --limit debe ser un número positivo`);
          process.exit(1);
        }

        const searches = historyManager.getHistory();
        const displayCount = Math.min(limit, searches.length);

        if (searches.length === 0) {
          console.log(warningMessage('No hay búsquedas en el historial'));
          return;
        }

        console.log(colors.blue(colors.bold(`${icons.time} Historial de búsquedas`)));
        console.log(colors.gray('─'.repeat(50)));
        console.log('');

        // Mostrar las búsquedas más recientes
        const recent = searches.slice(-displayCount);
        recent.reverse(); // Mostrar más reciente primero

        recent.forEach((search, _index) => {
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
