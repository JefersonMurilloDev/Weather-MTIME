/**
 * Comando CLI para obtener el clima por ciudad
 * Implementa la interfaz de usuario para la opción "weather get"
 */
import { Command } from "commander";
import { GetWeatherByCityUseCase } from "@application/use-cases/GetWeatherByCityUseCase";
import { GetWeatherByCityRequestDTO, WeatherResponseDTO } from "@application";
import { isOk, isErr, Result } from "@shared";
import { DomainError } from "@shared/errors";
import { logger } from "@infrastructure/logger/Logger";
import { appConfig } from "@infrastructure/config/Config";
import {
  colors,
  errorMessage,
  separator,
} from "../colors";
import { getUseCase, getDependency } from "@infrastructure/di/Container";
import { HistoryManager } from "./history-command";
import { HistoryService } from "@application/services/HistoryService";

/**
 * Clase para formatear datos de clima en output visual
 */
class ConsoleWeatherFormatter {
  private readonly temperatureColors = {
    cold: colors.blue,
    cool: colors.cyan,
    neutral: colors.white,
    warm: colors.yellow,
    hot: colors.red,
  };

  format(weather: WeatherResponseDTO): string {
    return appConfig.cli.showProgress
      ? this.formatDetailed(weather)
      : this.formatSimple(weather);
  }

  formatSimple(weather: WeatherResponseDTO): string {
    const temperatureColored = this.colorizeTemperature(
      weather.temperature,
      `${weather.temperature.toFixed(1)}°${this.getUnitSymbol(weather.units)}`,
    );

    const location = `${weather.city}, ${weather.country}`;
    const condition = weather.description;

    return `${location}: ${temperatureColored}, ${condition}`;
  }

  formatDetailed(weather: WeatherResponseDTO): string {
    const lines: string[] = [
      colors.blue(colors.bold("🔍 CLI de Clima")),
      colors.gray(separator("─", 40)),
      "",
      `📍  Ubicación: ${colors.bold(`${weather.city}, ${weather.country}`)}`,
      "",
      `🌡️  Temperatura: ${this.colorizeTemperature(
        weather.temperature,
        `${weather.temperature.toFixed(1)}°${this.getUnitSymbol(weather.units)}`,
      )}`,
      `🥶  Sensación térmica: ${weather.feelsLike.toFixed(1)}°${this.getUnitSymbol(weather.units)}`,
      `📈  Máx: ${weather.maxTemperature.toFixed(1)}° - Mín: ${weather.minTemperature.toFixed(1)}°`,
      "",
      `💧  Humedad: ${weather.humidity}%`,
      `📊  Presión: ${weather.pressure} hPa`,
      `👁️  Visibilidad: ${(weather.visibility / 1000).toFixed(1)} km`,
      `💨  Viento: ${(weather.windSpeed * 3.6).toFixed(1)} km/h ${weather.windDirection}°`,
      "",
      `🌤️  Condición: ${weather.condition}`,
      `📝  Descripción: ${weather.description}`,
      "",
      `🕐  Actualizado: ${new Date(weather.timestamp).toLocaleString("es-ES")}`,
      "",
    ];

    // Añadir icono si está disponible
    if (weather.icon) {
      lines.push(
        `🖼️  Icono: https://openweathermap.org/img/wn/${weather.icon}@2x.png`,
      );
    }

    return lines.join("\n");
  }

  /**
   * Colorea la temperatura según su valor
   */
  private colorizeTemperature(temp: number, text: string): string {
    let colorFn: (text: string) => string;

    if (temp < 0) {
      colorFn = this.temperatureColors.cold;
    } else if (temp < 15) {
      colorFn = this.temperatureColors.cool;
    } else if (temp < 25) {
      colorFn = this.temperatureColors.neutral;
    } else if (temp < 35) {
      colorFn = this.temperatureColors.warm;
    } else {
      colorFn = this.temperatureColors.hot;
    }

    return colorFn(text);
  }

  /**
   * Obtiene el símbolo de la unidad de temperatura
   */
  private getUnitSymbol(units: "celsius" | "fahrenheit" | "kelvin"): string {
    switch (units) {
      case "celsius":
        return "C";
      case "fahrenheit":
        return "F";
      case "kelvin":
        return "K";
    }
  }
}

/**
 * Crea el comando CLI para obtener el clima
 */
export function createWeatherCommand(): Command {
  const formatter = new ConsoleWeatherFormatter();
  const historyManager = new HistoryManager();
  
  // Obtener servicio de historial MongoDB si está habilitado
  const getHistoryService = (): HistoryService | null => {
    if (appConfig.mongodb.enabled) {
      try {
        return getDependency<HistoryService>('HistoryService');
      } catch {
        return null;
      }
    }
    return null;
  };

  return new Command("get")
    .description("Obtiene el clima actual de una ciudad")
    .argument(
      "<ubicacion>",
      'Nombre de la ciudad (ej: Madrid) o "ciudad, país"',
    )
    .option(
      "-u, --units <units>",
      "Unidades de temperatura: celsius, fahrenheit, kelvin",
      "celsius",
    )
    .option(
      "-l, --language <language>",
      "Idioma de la respuesta (código ISO)",
      "es",
    )
    .option("-s, --simple", "Muestra solo información básica")
    .option(
      "-v, --verbose",
      "Muestra información detallada del error si ocurre",
    )
    .action(async (location: string, options) => {
      logger.info(`Solicitando clima para: ${location}`);

      // Tipar explícitamente las opciones del CLI
      const typedOptions = options as {
        units: "celsius" | "fahrenheit" | "kelvin";
        language: string;
        simple?: boolean;
        verbose?: boolean;
      };

      try {
        // Obtener el caso de uso mediante DI
        const useCase = getUseCase<GetWeatherByCityUseCase>(
          GetWeatherByCityUseCase,
        );

        // Validar la ubicación
        const locationParts = location.split(",").map((s: string) => s.trim());
        const cityName = locationParts[0];
        const countryCode = locationParts[1];

        if (!cityName) {
          console.error(
            errorMessage("Debes proporcionar el nombre de una ciudad"),
          );
          return;
        }

        // Crear DTO con los parámetros
        const request: GetWeatherByCityRequestDTO = {
          cityName,
          units: typedOptions.units,
          language: typedOptions.language,
          ...(countryCode ? { countryCode } : {}),
        };

        logger.debug("Ejecutando caso de uso...", {
          cityName: request.cityName,
          countryCode: request.countryCode ?? null,
          units: request.units ?? null,
          language: request.language ?? null,
        });

        // Ejecutar el caso de uso
        const result: Result<
          Awaited<ReturnType<GetWeatherByCityUseCase["execute"]>> extends Result<infer T, DomainError>
            ? T
            : never,
          DomainError
        > = await useCase.execute(request);

        if (isOk(result)) {
          // Éxito - Mostrar resultado
          const weatherData = result.value.weather;

          // Registrar en historial (fire-and-forget para no bloquear)
          const historyService = getHistoryService();
          if (historyService) {
            // Usar MongoDB - no esperamos la respuesta
            setImmediate(() => {
              historyService.save({
                searchQuery: location,
                cityName: result.value.city.name,
                countryCode: result.value.city.country,
                temperature: weatherData.temperature,
                feelsLike: weatherData.feelsLike,
                humidity: weatherData.humidity,
                condition: weatherData.condition,
                description: weatherData.description,
              }).catch((err) => logger.debug('Error guardando en MongoDB:', err));
            });
          } else {
            // Fallback a archivo local
            historyManager.logSearch(
              location,
              result.value.city.name,
              result.value.city.country,
              weatherData.temperature,
            );
          }
          const responseDTO: WeatherResponseDTO = {
            city: result.value.city.name,
            country: result.value.city.country,
            temperature: weatherData.temperature,
            feelsLike: weatherData.feelsLike,
            minTemperature: weatherData.minTemperature,
            maxTemperature: weatherData.maxTemperature,
            pressure: weatherData.pressure,
            humidity: weatherData.humidity,
            visibility: weatherData.visibility,
            windSpeed: weatherData.windSpeed,
            windDirection: weatherData.windDirection,
            condition: weatherData.condition,
            description: weatherData.description,
            timestamp: weatherData.timestamp.toISOString(),
            units: options.units,
          } as WeatherResponseDTO;

          // Mostrar según la opción elegida
          const output = typedOptions.simple
            ? formatter.formatSimple(responseDTO)
            : formatter.format(responseDTO);

          console.log(output);
        } else if (isErr(result)) {
          // Error - Mostrar mensaje en español
          const error = result.error as any;

          if (typedOptions.verbose && typeof error.toJSON === "function") {
            console.error(colors.brightRed("❌ Error detallado:"));
            console.error(
              colors.brightRed(JSON.stringify(error.toJSON(), null, 2)),
            );
          } else if (typedOptions.verbose) {
            console.error(colors.brightRed("❌ Error:"));
            console.error(colors.brightRed(String(error?.message ?? error)));
          } else {
            // Mensajes de error user-friendly
            const code = error?.code as string | undefined;
            const message = String(error?.message ?? "");

            if (code === "VALIDATION_ERROR") {
              console.error(
                errorMessage(
                  "La ubicación proporcionada no es válida",
                  "Asegúrate de usar el formato 'Ciudad' o 'Ciudad, PAÍS' y solo letras y espacios",
                ),
              );
            } else if (message.includes("no fue encontrado")) {
              console.error(
                errorMessage(
                  `No se encontró información climática para "${location}"`,
                  `Intenta con el nombre en inglés o agrega el país (ej: "${location}, ES")`,
                ),
              );
            } else if (message.includes("API_KEY")) {
              console.error(
                errorMessage(
                  "Error de configuración: La API key del proveedor de clima no está configurada o es inválida",
                  "Revisa tu archivo .env o la configuración del CLI",
                ),
              );
            } else if (message.toLowerCase().includes("timeout")) {
              console.error(
                errorMessage(
                  "Error de conexión: El servicio de clima no responde",
                  "Verifica tu conexión a internet e intenta nuevamente",
                ),
              );
            } else {
              console.error(colors.brightRed(`❌ Error: ${message}`));
            }
          }

          process.exit(1);
        }
      } catch (error) {
        if (error instanceof Error) {
          logger.error("Error inesperado", error);
        } else {
          logger.error("Error inesperado", {
            name: "UnknownError",
            message: String(error),
          });
        }
        console.error(
          errorMessage("Error inesperado al procesar la solicitud"),
        );

        if (typedOptions.verbose) {
          console.error(error);
        }

        process.exit(1);
      }
    });
}
