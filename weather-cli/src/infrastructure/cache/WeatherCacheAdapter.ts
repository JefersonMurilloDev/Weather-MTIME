/**
 * Adaptador de caché específico para datos de clima
 * Extiende MemoryCacheAdapter con funcionalidad específica para weather
 */
import { injectable, inject } from 'tsyringe';
import { CacheService } from '@domain/services/CacheService';
import { WeatherResult } from '@domain/index';

/**
 * Interfaz específica para caché de clima por país
 */
export interface WeatherCacheService {
    get(key: string): Promise<WeatherResult[] | null>;
    set(key: string, value: WeatherResult[]): Promise<void>;
    generateKey(country: string, limit: number): string;
}

/**
 * Implementación del servicio de caché para datos de clima
 */
@injectable()
export class WeatherCacheAdapter implements WeatherCacheService {
    constructor(
        @inject('CacheService')
        private readonly cacheService: CacheService
    ) {}

    async get(key: string): Promise<WeatherResult[] | null> {
        return this.cacheService.get<WeatherResult[]>(key);
    }

    async set(key: string, value: WeatherResult[]): Promise<void> {
        // TTL de 10 minutos para datos de clima por país
        await this.cacheService.set(key, value, 600);
    }

    /**
     * Genera una clave única para caché basada en país y límite
     */
    generateKey(country: string, limit: number): string {
        return `weather:country:${country.toUpperCase()}:limit:${limit}`;
    }
}
