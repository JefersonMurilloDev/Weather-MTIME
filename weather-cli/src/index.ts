/**
 * Punto de entrada principal de Weather CLI
 *
 * Este archivo es el que se ejecuta cuando el usuario corre el comando `weather`
 * o cualquiera de sus subcomandos. Configura el entorno y delega a WeatherCLI.
 */

// Importar reflect-metadata necesario para inyección de dependencias
import 'reflect-metadata';

// Importar y ejecutar el CLI
import { runCLI } from './presentation/cli/WeatherCLI';

// Función principal asíncrona
async function main() {
  try {
    await runCLI();
  } catch (error) {
    // Error crítico que no fue capturado por el CLI
    console.error('Error fatal al iniciar la aplicación:', error);
    process.exit(1);
  }
}

// Ejecutar la aplicación
main();
