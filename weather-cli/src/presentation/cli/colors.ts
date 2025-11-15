/**
 * Sistema de colores para CLI sin dependencias externas
 * Implementa códigos ANSI de forma segura y controlada
 *
 * Prioridad de seguridad: No importar librerías con vulnerabilidades conocidas
 */

/**
 * Códigos ANSI para colores y estilos
 * Solo exponemos los colores que realmente usaremos
 */
const ANSI_CODES = {
  // Colores de texto
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',

  // Colores normales
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m',

  // Colores brillantes
  brightRed: '\x1b[91m',
  brightGreen: '\x1b[92m',
  brightYellow: '\x1b[93m',
  brightBlue: '\x1b[94m',
  brightMagenta: '\x1b[95m',
  brightCyan: '\x1b[96m'
} as const;

/**
 * Tipo para los nombres de colores disponibles
 */
type ColorName = keyof typeof ANSI_CODES;

/**
 * Verifica si el terminal soporta colores
 */
function supportsColor(): boolean {
  // Deshabilitar colores en CI/CD, cuando NO_COLOR está definido, o en producción
  if (
    process.env['NO_COLOR'] ||
    process.env['NODE_ENV'] === 'production' ||
    process.env['NODE_ENV'] === 'test' ||
    process.env['CI']) {
    return false;
  }

  // Verificar si es un TTY (terminal interactiva)
  return process.stdout.isTTY && process.stderr.isTTY;
}

/**
 * Función principal para aplicar color a texto
 */
function colorize(text: string, color: ColorName): string {
  if (!supportsColor()) {
    return text;
  }

  const colorCode = ANSI_CODES[color];
  if (!colorCode) {
    // Para producción: simplemente retornar el texto sin color
    return text;
  }

  return `${colorCode}${text}${ANSI_CODES.reset}`;
}

/**
 * API pública de colores - solo exponemos lo necesario
 */
export const colors = {
  // Funciones de color
  red: (text: string) => colorize(text, 'red'),
  green: (text: string) => colorize(text, 'green'),
  yellow: (text: string) => colorize(text, 'yellow'),
  blue: (text: string) => colorize(text, 'blue'),
  cyan: (text: string) => colorize(text, 'cyan'),
  gray: (text: string) => colorize(text, 'gray'),
  white: (text: string) => colorize(text, 'white'),

  // Colores brillantes para énfasis
  brightRed: (text: string) => colorize(text, 'brightRed'),
  brightGreen: (text: string) => colorize(text, 'brightGreen'),
  brightYellow: (text: string) => colorize(text, 'brightYellow'),

  // Estilos
  bold: (text: string) => colorize(text, 'bold'),
  dim: (text: string) => colorize(text, 'dim')
};

/**
 * Funciones auxiliares para casos comunes
 */
export const icons = {
  success: '\u2705',
  error: '\u274c',
  warning: '\u26a0\ufe0f',
  info: '\u2139\ufe0f',
  pointer: '\ud83d\udccb',
  question: '\ud83d\udcac',
  time: '\ud83d\udd52',
  weather: '\ud83c\udf21\ufe0f',
  location: '\ud83d\udccd',
  temperature: '\ud83e\udd76'
};

/**
 * Helper para crear texto enriquecido
 */
export function styled(text: string, styles: ColorName[]): string {
  if (!supportsColor()) {
    return text;
  }

  const codes = styles.map(style => ANSI_CODES[style]).join('');
  return `${codes}${text}${ANSI_CODES.reset}`;
}

/**
 * Función para crear barras de progreso simples
 */
export function progressBar(current: number, total: number, length: number = 20): string {
  const percentage = Math.min(100, Math.max(0, (current / total) * 100));
  const filled = Math.round((length * percentage) / 100);
  const empty = length - filled;

  const bar = '█'.repeat(filled) + '\u2591'.repeat(empty);

  if (supportsColor()) {
    if (percentage < 33) {
      return colors.red(bar);
    } else if (percentage < 66) {
      return colors.yellow(bar);
    } else {
      return colors.green(bar);
    }
  }

  return bar;
}

/**
 * Crea un separador visual
 */
export function separator(char: string = '─', length: number = 40): string {
  return char.repeat(length);
}

/**
 * Formato para mensajes de error en español
 */
export function errorMessage(message: string, suggestion?: string): string {
  const lines = [colors.brightRed(`${icons.error} ${message}`)];

  if (suggestion) {
    lines.push(colors.cyan(`${icons.pointer} Sugerencia: ${suggestion}`));
  }

  return lines.join('\n');
}

/**
 * Formato para mensajes de éxito en español
 */
export function successMessage(message: string): string {
  return colors.green(`${icons.success} ${message}`);
}

/**
 * Formato para mensajes de advertencia en español
 */
export function warningMessage(message: string): string {
  return colors.yellow(`${icons.warning} ${message}`);
}

/**
 * Función para limpiar colores de un texto (útil para tests)
 */
export function stripColors(text: string): string {
  // Regex para eliminar códigos ANSI
  const ansiRegex = /\x1b\[[0-9;]*m/g;
  return text.replace(ansiRegex, '');
}
