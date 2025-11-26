import { CacheService } from '@domain/services/CacheService';
import { injectable } from 'tsyringe';

interface CacheEntry<T> {
    value: T;
    expiresAt: number;
    lastAccessed: number;
}

/**
 * Implementación de caché en memoria con TTL y limpieza automática
 */
@injectable()
export class MemoryCacheAdapter implements CacheService {
    private cache = new Map<string, CacheEntry<any>>();
    private readonly defaultTtlSeconds = 600; // 10 minutos por defecto
    private readonly maxEntries = 100;

    async get<T>(key: string): Promise<T | null> {
        const entry = this.cache.get(key);

        if (!entry) {
            return null;
        }

        // Verificar expiración
        if (Date.now() > entry.expiresAt) {
            this.cache.delete(key);
            return null;
        }

        // Actualizar último acceso (para LRU simple)
        entry.lastAccessed = Date.now();
        return entry.value;
    }

    async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
        // Limpieza si excedemos el tamaño
        if (this.cache.size >= this.maxEntries) {
            this.evictOldest();
        }

        const ttl = ttlSeconds ?? this.defaultTtlSeconds;
        const expiresAt = Date.now() + (ttl * 1000);

        this.cache.set(key, {
            value,
            expiresAt,
            lastAccessed: Date.now()
        });
    }

    async delete(key: string): Promise<void> {
        this.cache.delete(key);
    }

    async clear(): Promise<void> {
        this.cache.clear();
    }

    /**
     * Elimina la entrada menos recientemente usada (LRU simple)
     * o la que esté más próxima a expirar si se prefiere
     */
    private evictOldest(): void {
        let oldestKey: string | null = null;
        let oldestAccess = Infinity;

        for (const [key, entry] of this.cache.entries()) {
            // Si ya expiró, es el mejor candidato
            if (Date.now() > entry.expiresAt) {
                this.cache.delete(key);
                return; // Encontramos uno expirado, suficiente por ahora
            }

            if (entry.lastAccessed < oldestAccess) {
                oldestAccess = entry.lastAccessed;
                oldestKey = key;
            }
        }

        if (oldestKey) {
            this.cache.delete(oldestKey);
        }
    }
}
