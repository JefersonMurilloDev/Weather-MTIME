export class Favorite {
  constructor(
    public readonly city: string,
    public readonly country: string,
    public readonly createdAt: Date = new Date()
  ) {
    this.validate();
  }

  private validate(): void {
    if (!this.city || this.city.trim().length === 0) {
      throw new Error('El nombre de la ciudad es requerido');
    }
    if (!this.country || this.country.trim().length !== 2) {
      throw new Error('El código de país debe tener 2 caracteres (ISO 3166-1 alpha-2)');
    }
  }

  toString(): string {
    return `${this.city}, ${this.country}`;
  }
}
