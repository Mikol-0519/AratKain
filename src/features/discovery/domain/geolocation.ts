/**
 * Locating the user is two separate problems: asking the browser for a fix,
 * and deciding what to do when it cannot give one. Keeping both here lets the
 * page stay a thin view and makes the retry/fallback rules testable.
 */

export type LocationFix = { lat: number; lng: number; approximate?: boolean };
export type LocationFailure = 'unsupported' | 'insecure' | 'denied' | 'timeout' | 'unknown';

const STORAGE_KEY = 'aratkain.lastLocation';
const CACHE_AGE_MS = 5 * 60 * 1000;

const MESSAGES: Record<LocationFailure, string> = {
  unsupported: 'This browser does not support location.',
  insecure: 'Location requires HTTPS or localhost. Open the app over a secure connection.',
  denied: 'Location access was denied. Allow it in your browser settings, then try again.',
  timeout: "Couldn't find your location. Try again, or turn on Wi-Fi and device location.",
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

/** Remember a successful fix so a later failure still has something to show. */
const remember = (position: GeolocationPosition): LocationFix => {
  const fix = { lat: position.coords.latitude, lng: position.coords.longitude };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(fix));
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
    return valid ? { lat: fix.lat, lng: fix.lng, approximate: true } : null;
  } catch {
    return null;
  }
};

/**
 * Try a fast network fix first (works indoors), then one high-accuracy attempt.
 * If neither completes, reuse the last saved fix instead of leaving the user
 * with a dead-end error. Permission denials are never retried.
 */
export const locateUser = async (): Promise<LocationFix> => {
  if (!navigator.geolocation) throw new LocationError('unsupported');
  if (!window.isSecureContext && window.location.hostname !== 'localhost') {
    throw new LocationError('insecure');
  }

  let sawTimeout = false;
  for (const highAccuracy of [false, true]) {
    try {
      return remember(await getPosition({
        enableHighAccuracy: highAccuracy,
        timeout: highAccuracy ? 20000 : 15000,
        maximumAge: CACHE_AGE_MS,
      }));
    } catch (error) {
      if (errorCode(error) === 1) throw new LocationError('denied'); // PERMISSION_DENIED
      if (errorCode(error) === 3) sawTimeout = true;                  // TIMEOUT
    }
  }

  const cached = lastKnownLocation();
  if (cached) return cached;
  throw new LocationError(sawTimeout ? 'timeout' : 'unknown');
};
