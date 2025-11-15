/**
 * CLI principal de Weather-CLI
 * Define todos los comandos disponibles y su configuración
 */
import { Command } from "commander";
import * as fs from "fs";
import * as path from "path";
import { createWeatherCommand } from "./commands/weather-command";
import { createCountryCommand } from "./commands/country-command";
import { createConfigCommand } from "./commands/config-command";
import { createHistoryCommand } from "./commands/history-command";
import { logger } from "@infrastructure/logger/Logger";
import { appConfig } from "@infrastructure/config/Config";
import { colors, icons } from "./colors";

/**
 * Interfaz para manejo de errores global
 */
function handleGlobalError(error: Error): void {
  logger.error("Error no capturado", error);

  console.error(colors.red(`${icons.error} Error inesperado:`));
  console.error(colors.red(`  ${error.message}`));

  if (appConfig.isDevelopment()) {
    console.error(colors.dim(error.stack || ""));
  }

  process.exit(1);
}

/**
 * Lee el package.json para obtener información del proyecto
 */
function getPackageInfo(): {
  name: string;
  version: string;
  description: string;
} {
  try {
    const packagePath = path.join(__dirname, "../../..", "package.json");
    const packageContent = fs.readFileSync(packagePath, "utf-8");
    const packageJson = JSON.parse(packageContent);

    return {
      name: packageJson.name || "weather-cli",
      version: packageJson.version || "1.0.0",
      description: packageJson.description || "CLI de clima con TypeScript",
    };
  } catch {
    return {
      name: "weather-cli",
      version: "1.0.0",
      description: "CLI de clima con TypeScript",
    };
  }
}

/**
 * Crea el programa CLI principal
 */
export function createCLI(): Command {
  const packageInfo = getPackageInfo();

  // Configurar container de dependencias
  const { configureContainer } = require("@infrastructure/di/Container");
  configureContainer();

  const program = new Command()
    .name(packageInfo.name)
    .description(packageInfo.description)
    .version(
      `${packageInfo.name} v${packageInfo.version}`,
      "-v, --version",
      "Muestra la versión",
    )
    .helpOption("-h, --help", "Muestra ayuda")
    .addHelpCommand("help [command]");

  // Banner de bienvenida
  program.hook("preAction", (thisCommand) => {
    // Solo mostrar banner para comandos principales
    if (thisCommand.parent?.args.length === 0) {
      console.log();
      console.log(colors.blue(colors.bold("☀️  Weather CLI")));
      console.log(colors.dim(`   ${packageInfo.description}`));
      console.log(colors.dim(`   v${packageInfo.version}`));
      console.log();
    }
  });

  // Configurar manejo de errores
  program.exitOverride((err) => {
    if (err.code === "commander.helpDisplayed") {
      return;
    }

    if (err.code === "commander.version") {
      return;
    }

    if (err.code === "commander.unknownCommand") {
      console.error(
        colors.red(`\n${icons.error} Comando no reconocido: ${err.message}`),
      );
      console.error(
        colors.yellow(
          `\n💡 Usa "${program.name()} --help" para ver los comandos disponibles`,
        ),
      );
      process.exit(1);
    } else if (err.code === "commander.missingArgument") {
      console.error(
        colors.red(
          `\n${icons.error} Falta argumento requerido: ${err.message}`,
        ),
      );
      process.exit(1);
    } else if (err.code === "commander.excessArguments") {
      console.error(
        colors.red(`\n${icons.error} Demasiados argumentos proporcionados`),
      );
      process.exit(1);
    }
  });

  // Comando por defecto - mostrar ayuda
  program.action(() => {
    program.help();
  });

  return program;
}

/**
 * Configura y añade todos los subcomandos
 */
export function setupCommands(program: Command): void {
  // Comando: weather get
  const weatherCommand = new Command("weather")
    .description("Consultas relacionadas con el clima")
    .alias("w");

  weatherCommand.addCommand(createWeatherCommand());
  program.addCommand(weatherCommand);

  // Comando: country
  program.addCommand(createCountryCommand());

  // Comando: config
  program.addCommand(createConfigCommand());

  // Comando: history
  program.addCommand(createHistoryCommand());
}

/**
 * Inicializa y ejecuta el CLI
 */
export async function runCLI(): Promise<void> {
  try {
    // Configurar manejo de errores globales
    process.on("uncaughtException", handleGlobalError);
    process.on("unhandledRejection", (error) => {
      handleGlobalError(error as Error);
    });

    // Crear CLI
    const program = createCLI();
    setupCommands(program);

    // Parsear argumentos
    await program.parseAsync(process.argv);
  } catch (error) {
    handleGlobalError(error as Error);
  }
}

// Si se ejecuta directamente
if (require.main === module) {
  runCLI().catch((error) => {
    console.error(colors.red("Error fatal:"), error);
    process.exit(1);
  });
}

export default { createCLI, setupCommands, runCLI };
