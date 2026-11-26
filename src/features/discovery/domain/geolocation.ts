/**
 * Locating the user is two separate problems: asking the browser for a fix,
 * and deciding what to do when it cannot give one. Keeping both here lets the
 * page stay a thin view and makes the retry/fallback rules testable.
 */

export type LocationFix = {
  lat: number;
  lng: number;
  approximate?: boolean;
  source?: 'gps' | 'saved' | 'ip';
  label?: string;
};
export type LocationFailure =
  | 'unsupported' | 'insecure' | 'denied' | 'timeout' | 'network' | 'unknown';

const STORAGE_KEY = 'aratkain.lastLocation';
const CACHE_AGE_MS = 5 * 60 * 1000;
const IP_LOOKUP_URL = 'https://ipwho.is/';
const IP_TIMEOUT_MS = 6000;

const MESSAGES: Record<LocationFailure, string> = {
  unsupported: 'This browser does not support location.',
  insecure: 'Location requires HTTPS or localhost. Open the app over a secure connection.',
  denied: 'Location access was denied. Allow it in your browser settings, then try again.',
  timeout: "Couldn't find your location. Try again, or turn on Wi-Fi and device location.",
  network: "Couldn't estimate your location from your connection either. Please try again later.",
  unknown: 'Could not determine your location.',
};

export class LocationError extends Error {
  constructor(public readonly reason: LocationFailure) {
    super(MESSAGES[reason]);
    this.name = 'LocationError';
  }
}

const getPosition = (options: PositionOptions): Promise<GeolocationPosition> =>
  new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, options);
  });

const errorCode = (error: unknown): number | undefined => {
  if (typeof error !== 'object' || error === null || !('code' in error)) return undefined;
  const code = (error as { code?: unknown }).code;
  return typeof code === 'number' ? code : undefined;
};

/** Remember a fix so a later failure still has something to show. */
const remember = (fix: LocationFix): LocationFix => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      lat: fix.lat, lng: fix.lng, city: fix.label,
    }));
  } catch { /* storage can be disabled; the fix still works for this session */ }
  return fix;
};

/** A previously saved fix, clearly marked as approximate. */
export const lastKnownLocation = (): LocationFix | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const fix = JSON.parse(raw);
    const valid = typeof fix?.lat === 'number' && typeof fix?.lng === 'number'
      && Number.isFinite(fix.lat) && Number.isFinite(fix.lng)
      && Math.abs(fix.lat) <= 90 && Math.abs(fix.lng) <= 180;
    if (!valid) return null;
    return {
      lat: fix.lat,
      lng: fix.lng,
      approximate: true,
      source: 'saved',
      label: typeof fix.city === 'string' ? fix.city : undefined,
    };
  } catch {
    return null;
  }
};

/**
 * Last resort: estimate the city from the public IP address. Free, no key,
 * CORS-enabled. Accuracy is city-level, so the result is always flagged as
 * approximate and never presented as a GPS fix.
 */
const ipLocation = async (): Promise<LocationFix> => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), IP_TIMEOUT_MS);
  try {
    const res = await fetch(IP_LOOKUP_URL, { signal: controller.signal });
    if (!res.ok) throw new Error('IP lookup failed');
    const data = await res.json();
    const valid = data?.success === true
      && typeof data.latitude === 'number' && Number.isFinite(data.latitude)
      && typeof data.longitude === 'number' && Number.isFinite(data.longitude)
      && Math.abs(data.latitude) <= 90 && Math.abs(data.longitude) <= 180;
    if (!valid) throw new Error('Invalid IP lookup response');

    return remember({
      lat: data.latitude,
      lng: data.longitude,
      approximate: true,
      source: 'ip',
      label: typeof data.city === 'string' ? data.city : undefined,
    });
  } finally {
    clearTimeout(timer);
  }
};

/**
 * Try a fast network fix first (works indoors), then one high-accuracy attempt.
 * Desktop browsers often cannot produce either; fall back to a saved fix, then
 * to an IP estimate. Permission denials are never retried.
 */
export const locateUser = async (): Promise<LocationFix> => {
  if (!navigator.geolocation) throw new LocationError('unsupported');
  if (!window.isSecureContext && window.location.hostname !== 'localhost') {
    throw new LocationError('insecure');
  }

  let sawTimeout = false;
  for (const highAccuracy of [false, true]) {
    try {
      const pos = await getPosition({
        enableHighAccuracy: highAccuracy,
        timeout: highAccuracy ? 20000 : 15000,
        maximumAge: CACHE_AGE_MS,
      });
      return remember({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        source: 'gps',
      });
    } catch (error) {
      if (errorCode(error) === 1) throw new LocationError('denied'); // PERMISSION_DENIED
      if (errorCode(error) === 3) sawTimeout = true;                  // TIMEOUT
    }
  }

  const cached = lastKnownLocation();
  if (cached) return cached;

  try {
    return await ipLocation();
  } catch {
    throw new LocationError(sawTimeout ? 'timeout' : 'network');
  }
};
