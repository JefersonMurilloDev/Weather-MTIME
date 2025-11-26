/**
 * Implementación del servicio de validación de ciudades
 */
export interface CityValidatorService {
    validateCityName(name: string): boolean;
    validateCountryCode(code: string): boolean;
    normalizeCityName(name: string): string;
}

export class SimpleCityValidator implements CityValidatorService {
    validateCityName(name: string): boolean {
        return name.length >= 2 && /^[a-zA-Z\s\-']+$/.test(name);
    }

    validateCountryCode(code: string): boolean {
        // Validar códigos ISO 2 letras
        return code.length === 2 && /^[A-Z]{2}$/.test(code);
    }

    normalizeCityName(name: string): string {
        return name.trim().replace(/\s+/g, ' ');
    }
}
