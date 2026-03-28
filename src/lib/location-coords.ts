export interface CityCoordinates {
  lat: number;
  lng: number;
  label: string;
}

const KNOWN_CITIES: Record<string, CityCoordinates> = {
  "new york": { lat: 40.7128, lng: -74.006, label: "New York, NY" },
  "los angeles": { lat: 34.0522, lng: -118.2437, label: "Los Angeles, CA" },
  chicago: { lat: 41.8781, lng: -87.6298, label: "Chicago, IL" },
  houston: { lat: 29.7604, lng: -95.3698, label: "Houston, TX" },
  phoenix: { lat: 33.4484, lng: -112.074, label: "Phoenix, AZ" },
  dallas: { lat: 32.7767, lng: -96.797, label: "Dallas, TX" },
  denver: { lat: 39.7392, lng: -104.9903, label: "Denver, CO" },
};

/**
 * Look up coordinates for a known city (case-insensitive).
 * Returns undefined if city is not in the lookup table.
 */
export function getCityCoordinates(
  city: string
): CityCoordinates | undefined {
  return KNOWN_CITIES[city.toLowerCase().trim()];
}

/**
 * Return all known city entries.
 */
export function getAllCities(): CityCoordinates[] {
  return Object.values(KNOWN_CITIES);
}
