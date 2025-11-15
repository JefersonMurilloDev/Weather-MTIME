/**
 * Comando CLI para gestionar la configuración de la aplicación
 */
import { Command } from "commander";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { logger } from "@infrastructure/logger/Logger";
import {
  colors,
  successMessage,
  warningMessage,
  errorMessage,
} from "../colors";

/**
 * Gestor de configuración
 */
class ConfigManager {
  private readonly configPath: string;
  private readonly configFile = ".weather-cli-config.json";

  constructor() {
    this.configPath = path.join(os.homedir(), this.configFile);
  }

  /**
   * Lee la configuración actual
   */
  async getConfig(): Promise<any> {
    try {
      if (fs.existsSync(this.configPath)) {
        const content = await fs.promises.readFile(this.configPath, "utf-8");
        return JSON.parse(content);
      }
      return {};
    } catch (error) {
      logger.warn("Error leyendo configuración", { error: String(error) });
      return {};
    }
  }

  /**
   * Guarda la configuración
   */
  async saveConfig(config: any): Promise<void> {
    try {
      await fs.promises.writeFile(
        this.configPath,
        JSON.stringify(config, null, 2),
      );
    } catch (error) {
      throw new Error(`No se pudo guardar la configuración: ${error}`);
    }
  }

  /**
   * Muestra la configuración actual
   */
  displayConfig(config: any): void {
    console.log(colors.blue(colors.bold("🔧 Configuración actual:")));
    console.log(colors.gray(separator("─", 30)));

    if (Object.keys(config).length === 0) {
      console.log(colors.dim("  No hay configuración guardada."));
      return;
    }

    Object.entries(config).forEach(([key, value]) => {
      console.log(
        `  ${colors.bold(key)}: ${colors.cyan(JSON.stringify(value))}`,
      );
    });
  }
}

/**
 * Crea el comando de configuración
 */
export function createConfigCommand(): Command {
  const configManager = new ConfigManager();

  const config = new Command("config")
    .description("Gestiona la configuración de la aplicación")
    .alias("cfg")
    .addHelpText(
      "after",
      `
Ejemplos:
  weather config set api.key YOUR_API_KEY
  weather config get api.key
  weather config list
  weather config reset`,
    );

  // Subcomando: list
  config
    .command("list")
    .alias("ls")
    .description("Muestra toda la configuración actual")
    .action(async () => {
      logger.info("Listando configuración actual");

      try {
        const config = await configManager.getConfig();
        configManager.displayConfig(config);
      } catch (error) {
        if (error instanceof Error) {
          logger.error("Error al leer configuración", error);
        } else {
          logger.error("Error al leer configuración", {
            name: "UnknownError",
            message: String(error),
          });
        }
        console.error(errorMessage("Error al leer configuración"));
        process.exit(1);
      }
    });

  // Subcomando: reset
  config
    .command("reset")
    .description("Restablece toda la configuración a valores por defecto")
    .option("-f, --force", "Confirma la acción sin preguntar")
    .action(async (options) => {
      logger.warn("Reseteando configuración completa");

      try {
        const config = await configManager.getConfig();

        if (Object.keys(config).length === 0) {
          console.log(warningMessage("No hay configuración para resetear"));
          return;
        }

        if (!options.force) {
          console.log(
            warningMessage(
              "⚠️  Estás a punto de resetear TODA la configuración.",
            ),
          );
          console.log(warningMessage("Esto eliminará:"));

          Object.keys(config).forEach((key) => {
            console.log(`  - ${key}`);
          });

          console.log("");
          console.log(warningMessage("Agrega --force para confirmar"));
          return;
        }

        await configManager.saveConfig({});
        console.log(successMessage("✅ Configuración reseteada exitosamente"));
      } catch (error) {
        if (error instanceof Error) {
          logger.error("Error al resetear configuración", error);
        } else {
          logger.error("Error al resetear configuración", {
            name: "UnknownError",
            message: String(error),
          });
        }
        console.error(errorMessage("Error al resetear configuración"));
        process.exit(1);
      }
    });

  return config;
}

/**
 * Separador visual
 */
function separator(char: string = "─", length: number = 30): string {
  return char.repeat(length);
}
