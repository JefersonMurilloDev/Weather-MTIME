/**
 * Gestión de conexión a MongoDB usando Mongoose
 * Singleton para mantener una única conexión
 */
import mongoose from 'mongoose';

export interface MongoConfig {
  uri: string;
  maxPoolSize?: number;
  connectTimeoutMS?: number;
}

/**
 * Clase singleton para gestionar la conexión a MongoDB con Mongoose
 */
export class MongoConnection {
  private static instance: MongoConnection | null = null;
  private isConnected = false;

  private constructor(private readonly config: MongoConfig) {}

  /**
   * Obtiene la instancia singleton
   */
  static getInstance(config: MongoConfig): MongoConnection {
    if (!MongoConnection.instance) {
      MongoConnection.instance = new MongoConnection(config);
    }
    return MongoConnection.instance;
  }

  /**
   * Conecta a MongoDB usando Mongoose
   */
  async connect(): Promise<void> {
    if (this.isConnected) {
      return;
    }

    try {
      mongoose.set('strictQuery', true);

      await mongoose.connect(this.config.uri, {
        maxPoolSize: this.config.maxPoolSize || 10,
        connectTimeoutMS: this.config.connectTimeoutMS || 5000,
      });

      this.isConnected = true;

      // Manejar eventos de conexión (silencioso)
      mongoose.connection.on('error', () => {
        this.isConnected = false;
      });

      mongoose.connection.on('disconnected', () => {
        this.isConnected = false;
      });

    } catch (error) {
      this.isConnected = false;
      throw error;
    }
  }

  /**
   * Verifica el estado de la conexión
   */
  async healthCheck(): Promise<boolean> {
    try {
      if (!this.isConnected || mongoose.connection.readyState !== 1) {
        return false;
      }
      await mongoose.connection.db?.admin().ping();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Cierra la conexión
   */
  async disconnect(): Promise<void> {
    if (this.isConnected) {
      await mongoose.disconnect();
      this.isConnected = false;
      console.log('🔌 Desconectado de MongoDB');
    }
  }

  /**
   * Obtiene el estado de conexión
   */
  getConnectionState(): boolean {
    return this.isConnected && mongoose.connection.readyState === 1;
  }

  /**
   * Resetea la instancia singleton (útil para tests)
   */
  static async resetInstance(): Promise<void> {
    if (MongoConnection.instance) {
      await MongoConnection.instance.disconnect();
      MongoConnection.instance = null;
    }
  }
}
