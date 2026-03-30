export interface CityCoordinates {
  lat: number;
  lng: number;
  label: string;
}

const KNOWN_CITIES: Record<string, CityCoordinates> = {
  // North America
  "new york": { lat: 40.7128, lng: -74.006, label: "New York, NY" },
  "new york, ny": { lat: 40.7128, lng: -74.006, label: "New York, NY" },
  "los angeles": { lat: 34.0522, lng: -118.2437, label: "Los Angeles, CA" },
  chicago: { lat: 41.8781, lng: -87.6298, label: "Chicago, IL" },
  "chicago, il": { lat: 41.8781, lng: -87.6298, label: "Chicago, IL" },
  houston: { lat: 29.7604, lng: -95.3698, label: "Houston, TX" },
  "houston, tx": { lat: 29.7604, lng: -95.3698, label: "Houston, TX" },
  phoenix: { lat: 33.4484, lng: -112.074, label: "Phoenix, AZ" },
  "phoenix, az": { lat: 33.4484, lng: -112.074, label: "Phoenix, AZ" },
  dallas: { lat: 32.7767, lng: -96.797, label: "Dallas, TX" },
  "dallas, tx": { lat: 32.7767, lng: -96.797, label: "Dallas, TX" },
  denver: { lat: 39.7392, lng: -104.9903, label: "Denver, CO" },
  "denver, co": { lat: 39.7392, lng: -104.9903, label: "Denver, CO" },
  // Asia-Pacific
  sydney: { lat: -33.8688, lng: 151.2093, label: "Sydney, AU" },
  melbourne: { lat: -37.8136, lng: 144.9631, label: "Melbourne, AU" },
  singapore: { lat: 1.3521, lng: 103.8198, label: "Singapore, SG" },
  "singapore, sg": { lat: 1.3521, lng: 103.8198, label: "Singapore, SG" },
  tokyo: { lat: 35.6762, lng: 139.6503, label: "Tokyo, JP" },
  shanghai: { lat: 31.2304, lng: 121.4737, label: "Shanghai, CN" },
  "shanghai, cn": { lat: 31.2304, lng: 121.4737, label: "Shanghai, CN" },
  // Europe
  london: { lat: 51.5074, lng: -0.1278, label: "London, UK" },
  munich: { lat: 48.1351, lng: 11.582, label: "Munich, DE" },
  "munich, de": { lat: 48.1351, lng: 11.582, label: "Munich, DE" },
  // South America
  "sao paulo": { lat: -23.5505, lng: -46.6333, label: "Sao Paulo, BR" },
  "sao paulo, br": { lat: -23.5505, lng: -46.6333, label: "Sao Paulo, BR" },
};

/**
 * Look up coordinates for a known city (case-insensitive).
 * Returns undefined if city is not in the lookup table.
 */
export function getCityCoordinates(city: string): CityCoordinates | undefined {
  return KNOWN_CITIES[city.toLowerCase().trim()];
}

/**
 * Return all known city entries.
 */
export function getAllCities(): CityCoordinates[] {
  return Object.values(KNOWN_CITIES);
}

/**
 * Resolve coordinates for a device with optional lat/lng and location fields.
 * Priority: explicit lat/lng (non-zero) > location name lookup > null (unmappable).
 */
export function resolveDeviceCoordinates(device: {
  lat?: number;
  lng?: number;
  location?: string;
}): { lat: number; lng: number } | null {
  // Use explicit coordinates if they exist and are not (0, 0)
  if (device.lat != null && device.lng != null && (device.lat !== 0 || device.lng !== 0)) {
    return { lat: device.lat, lng: device.lng };
  }

  // Fallback to location name lookup
  if (device.location) {
    const city = getCityCoordinates(device.location);
    if (city) {
      return { lat: city.lat, lng: city.lng };
    }
  }

  return null;
}
