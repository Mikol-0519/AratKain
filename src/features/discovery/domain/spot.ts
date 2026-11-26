/**
 * The shared domain model for a place ("spot").
 *
 * This used to be defined twice — once in HomePage.tsx and once in
 * FavoritesPage.tsx — with the same fields but independently maintained
 * casts. The mapping code also disagreed with Android on two important
 * cases (see `toSpotType` and `toOpenState` below).
 */

/**
 * The three establishment types the UI knows about.
 * `unknown` covers rows whose `estab_type` is NULL or not one of the three.
 */
export type SpotType = 'cafe' | 'restaurant' | 'bar' | 'unknown';

/** The type filter offered in the UI. `all` means "no type filter". */
export type SpotTypeFilter = 'all' | Exclude<SpotType, 'unknown'>;

/**
 * Open/closed is a genuine three-state value in the database
 * (`establishments.is_open` is a nullable boolean and nothing ever writes
 * it), so the model must keep it three-state:
 *
 *   - `open`    — the venue is open
 *   - `closed`  — the venue is closed
 *   - `unknown` — the venue has not published hours
 *
 * The web app used to collapse `unknown` into `open` ("Open" badge on a
 * venue nobody has said is open) while Android hid the badge entirely.
 * Both were wrong; `unknown` is now rendered honestly on both.
 */
export type OpenState = 'open' | 'closed' | 'unknown';

export interface Spot {
  id: number;
  name: string;
  type: SpotType;
  rating: number;
  reviewCount: number;
  /** Formatted distance, e.g. "1.4 km". Empty when unknown. */
  distance: string;
  /** Raw distance in km. `null` when the venue was not reached by proximity. */
  distanceKm: number | null;
  openState: OpenState;
  lat: number;
  lng: number;
  address: string;
  description: string;
  phone: string;
}

export const TYPE_COLOR: Record<SpotType, string> = {
  cafe: '#C56A3D',
  restaurant: '#2C1A0E',
  bar: '#8B5CF6',
  unknown: '#8A7060',
};

export const TYPE_GRADIENT: Record<SpotType, string> = {
  cafe: 'linear-gradient(135deg, #3D1C08 0%, #8B4513 50%, #C56A3D 100%)',
  restaurant: 'linear-gradient(135deg, #1A2744 0%, #2C3E6B 50%, #4A6FA5 100%)',
  bar: 'linear-gradient(135deg, #2D1B4E 0%, #6B3FA0 50%, #9B6FD0 100%)',
  unknown: 'linear-gradient(135deg, #3A3128 0%, #5A4B3A 50%, #8A7060 100%)',
};

/** Human-readable label for a type, used where an icon is not enough. */
export const TYPE_LABEL: Record<SpotType, string> = {
  cafe: 'Cafe',
  restaurant: 'Restaurant',
  bar: 'Bar',
  unknown: 'Place',
};

/**
 * Normalise the free-text `estab_type` column into a known type.
 *
 * The column is plain text in Postgres, so it can hold anything. The old
 * code cast it (`as "cafe" | "restaurant" | "bar"`) and let a NULL become
 * "cafe" — which made a restaurant with no type render as a coffee shop,
 * and made the badge disagree with the cafe filter (the filter queries
 * `estab_type = 'cafe'` and would not return that row).
 */
export function toSpotType(value: unknown): SpotType {
  if (typeof value !== 'string') return 'unknown';
  switch (value.trim().toLowerCase()) {
    case 'cafe':
      return 'cafe';
    case 'restaurant':
      return 'restaurant';
    case 'bar':
      return 'bar';
    default:
      return 'unknown';
  }
}

/** Map the nullable `is_open` column onto the three-state model. */
export function toOpenState(value: unknown): OpenState {
  if (value === true) return 'open';
  if (value === false) return 'closed';
  return 'unknown';
}

function num(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

/**
 * Map a backend `EstablishmentResponse` onto a `Spot`.
 *
 * `raw` is deliberately `unknown`-ish (the API is not typed) — every field
 * is read defensively so a missing or null column can never crash the map.
 */
export function toSpot(raw: any): Spot {
  const distanceKm = typeof raw?.distanceKm === 'number' ? raw.distanceKm : null;

  return {
    id: num(raw?.establishmentId, 0),
    name: raw?.name ?? 'Unnamed place',
    type: toSpotType(raw?.estabType),
    rating: num(raw?.averageRating, 0),
    reviewCount: num(raw?.reviewCount, 0),
    distance: distanceKm === null ? '' : `${distanceKm.toFixed(1)} km`,
    distanceKm,
    openState: toOpenState(raw?.isOpen),
    lat: num(raw?.latitude, 0),
    lng: num(raw?.longitude, 0),
    address: raw?.address ?? '',
    description: raw?.description ?? '',
    phone: raw?.phone ?? '',
  };
}

export function toSpots(raw: any[] | null | undefined): Spot[] {
  if (!Array.isArray(raw)) return [];
  return raw.map(toSpot);
}

/**
 * Sort modes for the results list.
 *
 * The UI claims "sorted by rating" / "sorted by distance" in its subtitle,
 * so the claim has to be true. Unrated venues and venues without a distance
 * always sort last rather than first.
 */
export type SpotSort = 'rating' | 'distance';

export function sortSpots(spots: Spot[], mode: SpotSort): Spot[] {
  const sorted = [...spots];
  sorted.sort((a, b) => {
    if (mode === 'distance') {
      const da = a.distanceKm;
      const db = b.distanceKm;
      if (da === null && db === null) return b.rating - a.rating;
      if (da === null) return 1;
      if (db === null) return -1;
      if (da !== db) return da - db;
      return b.rating - a.rating;
    }
    if (a.rating !== b.rating) return b.rating - a.rating;
    return a.name.localeCompare(b.name);
  });
  return sorted;
}
