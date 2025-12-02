/**
 * Ciudades principales por país (código ISO-2)
 * Esta lista se usa como fuente de datos para consultas de clima por país
 * Organizada por regiones geográficas para mejor mantenibilidad
 */

const CITIES_BY_COUNTRY: Record<string, string[]> = {
  // ═══════════════════════════════════════════════════════════════
  // EUROPA
  // ═══════════════════════════════════════════════════════════════
  ES: ["Madrid", "Barcelona", "Valencia", "Sevilla", "Bilbao"],
  FR: ["Paris", "Marseille", "Lyon", "Toulouse", "Nice"],
  DE: ["Berlin", "Hamburg", "Munich", "Cologne", "Frankfurt"],
  IT: ["Rome", "Milan", "Naples", "Turin", "Palermo"],
  GB: ["London", "Birmingham", "Manchester", "Glasgow", "Liverpool"],
  PT: ["Lisbon", "Porto", "Braga", "Coimbra", "Faro"],
  NL: ["Amsterdam", "Rotterdam", "The Hague", "Utrecht", "Eindhoven"],
  BE: ["Brussels", "Antwerp", "Ghent", "Bruges", "Liege"],
  PL: ["Warsaw", "Krakow", "Lodz", "Wroclaw", "Poznan"],
  CZ: ["Prague", "Brno", "Ostrava", "Plzen", "Liberec"],
  AT: ["Vienna", "Graz", "Linz", "Salzburg", "Innsbruck"],
  CH: ["Zurich", "Geneva", "Basel", "Bern", "Lausanne"],
  SE: ["Stockholm", "Gothenburg", "Malmo", "Uppsala", "Vasteras"],
  NO: ["Oslo", "Bergen", "Trondheim", "Stavanger", "Drammen"],
  DK: ["Copenhagen", "Aarhus", "Odense", "Aalborg", "Esbjerg"],
  FI: ["Helsinki", "Espoo", "Tampere", "Vantaa", "Oulu"],
  IE: ["Dublin", "Cork", "Limerick", "Galway", "Waterford"],
  GR: ["Athens", "Thessaloniki", "Patras", "Heraklion", "Larissa"],
  RU: ["Moscow", "Saint Petersburg", "Novosibirsk", "Yekaterinburg", "Kazan"],
  UA: ["Kyiv", "Kharkiv", "Odessa", "Dnipro", "Lviv"],
  TR: ["Istanbul", "Ankara", "Izmir", "Bursa", "Antalya"],
  RO: ["Bucharest", "Cluj-Napoca", "Timisoara", "Iasi", "Constanta"],
  HU: ["Budapest", "Debrecen", "Szeged", "Miskolc", "Pecs"],
  SK: ["Bratislava", "Kosice", "Presov", "Zilina", "Nitra"],
  HR: ["Zagreb", "Split", "Rijeka", "Osijek", "Zadar"],
  RS: ["Belgrade", "Novi Sad", "Nis", "Kragujevac", "Subotica"],
  BG: ["Sofia", "Plovdiv", "Varna", "Burgas", "Ruse"],

  // ═══════════════════════════════════════════════════════════════
  // AMÉRICA DEL NORTE
  // ═══════════════════════════════════════════════════════════════
  US: ["New York", "Los Angeles", "Chicago", "Houston", "Miami"],
  CA: ["Toronto", "Montreal", "Vancouver", "Calgary", "Ottawa"],
  MX: ["Mexico City", "Guadalajara", "Monterrey", "Puebla", "Tijuana"],

  // ═══════════════════════════════════════════════════════════════
  // AMÉRICA DEL SUR
  // ═══════════════════════════════════════════════════════════════
  BR: ["Sao Paulo", "Rio de Janeiro", "Brasilia", "Salvador", "Fortaleza"],
  AR: ["Buenos Aires", "Cordoba", "Rosario", "Mendoza", "La Plata"],
  CO: ["Bogota", "Medellin", "Cali", "Barranquilla", "Cartagena"],
  PE: ["Lima", "Arequipa", "Trujillo", "Chiclayo", "Cusco"],
  CL: ["Santiago", "Valparaiso", "Concepcion", "La Serena", "Antofagasta"],
  VE: ["Caracas", "Maracaibo", "Valencia", "Barquisimeto", "Maracay"],
  EC: ["Quito", "Guayaquil", "Cuenca", "Santo Domingo", "Machala"],
  UY: ["Montevideo", "Salto", "Paysandu", "Las Piedras", "Rivera"],
  PY: ["Asuncion", "Ciudad del Este", "San Lorenzo", "Luque", "Capiata"],
  BO: ["La Paz", "Santa Cruz", "Cochabamba", "Sucre", "Oruro"],

  // ═══════════════════════════════════════════════════════════════
  // AMÉRICA CENTRAL Y CARIBE
  // ═══════════════════════════════════════════════════════════════
  CR: ["San Jose", "Limon", "Alajuela", "Heredia", "Cartago"],
  PA: ["Panama City", "San Miguelito", "Tocumen", "David", "Arraijan"],
  CU: ["Havana", "Santiago de Cuba", "Camaguey", "Holguin", "Santa Clara"],
  DO: ["Santo Domingo", "Santiago", "San Pedro de Macoris", "La Romana", "San Cristobal"],
  PR: ["San Juan", "Bayamon", "Carolina", "Ponce", "Caguas"],
  GT: ["Guatemala City", "Mixco", "Villa Nueva", "Quetzaltenango", "Escuintla"],
  HN: ["Tegucigalpa", "San Pedro Sula", "Choloma", "La Ceiba", "El Progreso"],
  SV: ["San Salvador", "Santa Ana", "San Miguel", "Mejicanos", "Soyapango"],
  NI: ["Managua", "Leon", "Masaya", "Matagalpa", "Chinandega"],
  JM: ["Kingston", "Montego Bay", "Spanish Town", "Portmore", "Mandeville"],
  TT: ["Port of Spain", "San Fernando", "Chaguanas", "Arima", "Point Fortin"],

  // ═══════════════════════════════════════════════════════════════
  // ASIA
  // ═══════════════════════════════════════════════════════════════
  JP: ["Tokyo", "Osaka", "Yokohama", "Nagoya", "Sapporo"],
  CN: ["Beijing", "Shanghai", "Guangzhou", "Shenzhen", "Chengdu"],
  IN: ["Mumbai", "Delhi", "Bangalore", "Hyderabad", "Chennai"],
  KR: ["Seoul", "Busan", "Incheon", "Daegu", "Daejeon"],
  TH: ["Bangkok", "Chiang Mai", "Pattaya", "Phuket", "Nonthaburi"],
  VN: ["Hanoi", "Ho Chi Minh City", "Da Nang", "Hai Phong", "Can Tho"],
  PH: ["Manila", "Quezon City", "Davao", "Cebu City", "Zamboanga"],
  ID: ["Jakarta", "Surabaya", "Bandung", "Medan", "Semarang"],
  MY: ["Kuala Lumpur", "George Town", "Johor Bahru", "Ipoh", "Shah Alam"],
  SG: ["Singapore"],
  TW: ["Taipei", "Kaohsiung", "Taichung", "Tainan", "Hsinchu"],
  HK: ["Hong Kong", "Kowloon", "Tsuen Wan", "Sha Tin", "Tuen Mun"],
  PK: ["Karachi", "Lahore", "Islamabad", "Faisalabad", "Rawalpindi"],
  BD: ["Dhaka", "Chittagong", "Khulna", "Rajshahi", "Sylhet"],
  LK: ["Colombo", "Kandy", "Galle", "Jaffna", "Negombo"],
  NP: ["Kathmandu", "Pokhara", "Lalitpur", "Bharatpur", "Biratnagar"],
  AE: ["Dubai", "Abu Dhabi", "Sharjah", "Ajman", "Ras Al Khaimah"],
  SA: ["Riyadh", "Jeddah", "Mecca", "Medina", "Dammam"],
  IL: ["Tel Aviv", "Jerusalem", "Haifa", "Rishon LeZion", "Petah Tikva"],
  IR: ["Tehran", "Mashhad", "Isfahan", "Karaj", "Shiraz"],

  // ═══════════════════════════════════════════════════════════════
  // OCEANÍA
  // ═══════════════════════════════════════════════════════════════
  AU: ["Sydney", "Melbourne", "Brisbane", "Perth", "Adelaide"],
  NZ: ["Auckland", "Wellington", "Christchurch", "Hamilton", "Tauranga"],
  FJ: ["Suva", "Nadi", "Lautoka", "Labasa", "Ba"],

  // ═══════════════════════════════════════════════════════════════
  // ÁFRICA
  // ═══════════════════════════════════════════════════════════════
  ZA: ["Johannesburg", "Cape Town", "Durban", "Pretoria", "Port Elizabeth"],
  EG: ["Cairo", "Alexandria", "Giza", "Shubra El Kheima", "Port Said"],
  NG: ["Lagos", "Kano", "Ibadan", "Abuja", "Port Harcourt"],
  KE: ["Nairobi", "Mombasa", "Kisumu", "Nakuru", "Eldoret"],
  MA: ["Casablanca", "Rabat", "Fes", "Marrakech", "Tangier"],
  GH: ["Accra", "Kumasi", "Tamale", "Takoradi", "Tema"],
  TZ: ["Dar es Salaam", "Mwanza", "Arusha", "Dodoma", "Mbeya"],
  ET: ["Addis Ababa", "Dire Dawa", "Mekelle", "Gondar", "Hawassa"],
  DZ: ["Algiers", "Oran", "Constantine", "Annaba", "Blida"],
  TN: ["Tunis", "Sfax", "Sousse", "Kairouan", "Bizerte"],
};

/**
 * Lista de todos los códigos de países disponibles
 */
export const COUNTRY_CODES: string[] = Object.keys(CITIES_BY_COUNTRY);

/**
 * Obtiene las ciudades de un país por su código ISO-2
 * @param countryCode - Código ISO-2 del país (ej: "ES", "US")
 * @returns Array de nombres de ciudades o undefined si no existe
 */
export function getCitiesForCountry(countryCode: string): string[] | undefined {
  return CITIES_BY_COUNTRY[countryCode.toUpperCase()];
}

/**
 * Obtiene todos los datos de ciudades por país (para seed)
 */
export function getAllCitiesByCountry(): Record<string, string[]> {
  return { ...CITIES_BY_COUNTRY };
}
