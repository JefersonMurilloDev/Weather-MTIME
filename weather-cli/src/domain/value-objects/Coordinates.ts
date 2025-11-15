/**
 * Value Object que representa las coordenadas geográficas
 * Es inmutable y valida sus valores al ser creado
 */
export class Coordinates {
  private readonly _latitude: number;
  private readonly _longitude: number;

  /**
   * Crea una instancia de coordenadas válidas
   * @param latitude - Latitud en grados (-90 a 90)
   * @param longitude - Longitud en grados (-180 a 180)
   * @throws Error si las coordenadas son inválidas
   */
  constructor(latitude: number, longitude: number) {
    this.validateLatitude(latitude);
    this.validateLongitude(longitude);
    this._latitude = latitude;
    this._longitude = longitude;
  }

  get latitude(): number {
    return this._latitude;
  }

  get longitude(): number {
    return this._longitude;
  }

  /**
   * Calcula la distancia a otras coordenadas usando la fórmula de Haversine
   * @param other - Coordenadas de destino
   * @returns Distancia en kilómetros
   */
  distanceTo(other: Coordinates): number {
    const R = 6371; // Radio de la Tierra en km
    const dLat = this.toRadians(other.latitude - this._latitude);
    const dLon = this.toRadians(other.longitude - this._longitude);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(this._latitude)) * Math.cos(this.toRadians(other.latitude)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Determina si estas coordenadas están dentro de un radio determinado
   * @param center - Centro del área
   * @param radiusKm - Radio en kilómetros
   * @returns true si está dentro del radio
   */
  isWithinRadius(center: Coordinates, radiusKm: number): boolean {
    return this.distanceTo(center) <= radiusKm;
  }

  /**
   * Serializa las coordenadas a formato string
   */
  toString(): string {
    return `${this._latitude.toFixed(6)}, ${this._longitude.toFixed(6)}`;
  }

  /**
   * Convierte a objeto plano para serialización
   */
  toJSON(): { latitude: number; longitude: number } {
    return {
      latitude: this._latitude,
      longitude: this._longitude
    };
  }

  /**
   * Crea coordenadas desde un string en formato "lat, lon"
   * @param coordString - String con formato "lat, lon"
   * @returns Nueva instancia de Coordinates
   */
  static fromString(coordString: string): Coordinates {
    const parts = coordString.split(',').map(s => s.trim());
    if (parts.length !== 2) {
      throw new Error('Formato de coordenadas inválido. Use: "latitud, longitud"');
    }

    const [latStr, lonStr] = parts;
    const lat = parseFloat(latStr!);
    const lon = parseFloat(lonStr!);

    if (isNaN(lat) || isNaN(lon)) {
      throw new Error('Latitud o longitud no son números válidos');
    }

    return new Coordinates(lat, lon);
  }

  private validateLatitude(latitude: number): void {
    if (isNaN(latitude)) {
      throw new Error('La latitud debe ser un número');
    }
    if (latitude < -90 || latitude > 90) {
      throw new Error('La latitud debe estar entre -90 y 90 grados');
    }
  }

  private validateLongitude(longitude: number): void {
    if (isNaN(longitude)) {
      throw new Error('La longitud debe ser un número');
    }
    if (longitude < -180 || longitude > 180) {
      throw new Error('La longitud debe estar entre -180 y 180 grados');
    }
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}
