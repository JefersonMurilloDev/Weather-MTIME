/**
 * Entidad que representa una ciudad con sus atributos básicos
 * Esta clase forma parte del núcleo de dominio y no depende de capas externas
 */
export class City {
  constructor(
    private readonly _name: string,
    private readonly _country: string,
    private readonly _latitude?: number,
    private readonly _longitude?: number,
  ) {
    this.validateName(_name);
    this.validateCountry(_country);
  }

  get name(): string {
    return this._name;
  }

  get country(): string {
    return this._country;
  }

  get latitude(): number | undefined {
    return this._latitude;
  }

  get longitude(): number | undefined {
    return this._longitude;
  }

  /**
   * Verifica si la ciudad tiene coordenadas geográficas válidas
   * @returns true si tiene latitud y longitud definidas
   */
  hasCoordinates(): boolean {
    return this._latitude !== undefined && this._longitude !== undefined;
  }

  toString(): string {
    return `${this._name}, ${this._country}`;
  }

  /**
   * Valida que el nombre de la ciudad cumpla con los requisitos mínimos
   * @param name - Nombre de la ciudad a validar
   * @throws Error si el nombre es inválido
   */
  private validateName(name: string): void {
    if (!name || name.trim().length === 0) {
      throw new Error("El nombre de la ciudad no puede estar vacío");
    }
    if (name.length < 2) {
      throw new Error(
        "El nombre de la ciudad debe tener al menos 2 caracteres",
      );
    }
    if (!/^[a-zA-Z\s\-']+$/.test(name)) {
      throw new Error("El nombre de la ciudad contiene caracteres inválidos");
    }
  }

  /**
   * Valida que el país cumpla con el formato aceptado (código ISO o nombre)
   * @param country - País a validar (código ISO 2/3 letras o nombre completo)
   * @throws Error si el país es inválido
   */
  private validateCountry(country: string): void {
    if (!country || country.trim().length === 0) {
      throw new Error("El país no puede estar vacío");
    }
    // Acepta códigos ISO de 2 o 3 letras, o nombres de país
    if (country.length !== 2 && country.length !== 3) {
      if (!/^[a-zA-Z\s\-']+$/.test(country)) {
        throw new Error("El país contiene caracteres inválidos");
      }
    }
  }
}
