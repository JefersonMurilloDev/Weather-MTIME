/**
 * Implementación del servicio de validación de países
 */
export interface CountryValidatorService {
    validateCountryCode(code: string): boolean;
    normalizeCountryCode(code: string): string;
    getCountryName(code: string): string;
}

export class SimpleCountryValidator implements CountryValidatorService {
    private readonly isoCodes = new Set(['ES', 'US', 'MX', 'AR', 'CO', 'PE', 'CL', 'BR', 'FR', 'DE', 'IT', 'PT']);

    validateCountryCode(code: string): boolean {
        return this.isoCodes.has(code.toUpperCase());
    }

    normalizeCountryCode(code: string): string {
        return code.toUpperCase().trim();
    }

    getCountryName(code: string): string {
        const names: Record<string, string> = {
            'ES': 'España',
            'US': 'Estados Unidos',
            'MX': 'México',
            'AR': 'Argentina',
            'CO': 'Colombia',
            'PE': 'Perú',
            'CL': 'Chile',
            'BR': 'Brasil',
            'FR': 'Francia',
            'DE': 'Alemania',
            'IT': 'Italia',
            'PT': 'Portugal'
        };

        return names[code] || code;
    }
}
