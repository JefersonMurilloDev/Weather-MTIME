/**
 * Interfaz para el servicio de caché
 * Define las operaciones básicas de almacenamiento en caché
 */
export interface CacheService {
    /**
     * Obtiene un valor del caché
     * @param key Clave única
     */
    get<T>(key: string): Promise<T | null>;

    /**
     * Guarda un valor en el caché
     * @param key Clave única
     * @param value Valor a guardar
     * @param ttlSeconds Tiempo de vida en segundos (opcional)
     */
    set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;

    /**
     * Elimina un valor del caché
     * @param key Clave única
     */
    delete(key: string): Promise<void>;

    /**
     * Limpia todo el caché
     */
    clear(): Promise<void>;
}
