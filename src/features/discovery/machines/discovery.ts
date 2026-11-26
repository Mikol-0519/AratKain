import { Spot } from '../domain/spot';

/**
 * The explicit state machines behind the Discover / Saved / Profile screens.
 *
 * HomePage.tsx used to track these as a dozen independent `useState` calls
 * (`activeNav`, `showProfile`, `showFavorites`, `spots`, `loading`, `error`,
 * `search`, `activeFilter`, `selectedSpot`, `userLat`, `userLng`, `locating`,
 * `favorites`, `loggingOut`). Any two of them could disagree — and two of
 * them *did*: `activeNav` and the `show*` overlay flags were kept in sync by
 * hand in three different places.
 */

/**
 * Which of the three top-level views is showing.
 *
 * Replaces `activeNav` + `showProfile` + `showFavorites`. The old trio had
 * to be updated together by hand; now the overlays are derived from it:
 *
 *   nav === 'profile' → the profile overlay is open
 *   nav === 'saved'   → the saved overlay is open
 *   nav === 'discover'→ neither overlay is open
 */
export type DiscoveryNav = 'discover' | 'saved' | 'profile';

/**
 * The list of places.
 *
 * `spots` is carried in every case on purpose: when a refresh fails the
 * previous list stays on screen (the user keeps their context) and the error
 * appears as a toast. Blanking the map on a failed refresh was a regression
 * the old code avoided by accident.
 */
export type SpotsState =
  | { status: 'idle'; spots: Spot[] }
  | { status: 'loading'; spots: Spot[] }
  | { status: 'ready'; spots: Spot[] }
  | { status: 'error'; spots: Spot[]; message: string };

export const emptySpotsState: SpotsState = { status: 'idle', spots: [] };

/**
 * The geolocation lifecycle.
 *
 * Replaces the `userLat`/`userLng` nullable pair plus the `locating` flag
 * plus the `error` string. The old version had a fourth, invisible state:
 * "the browser never called back", which left the button stuck on
 * "Locating…" forever because `getCurrentPosition` was called without a
 * timeout.
 */
export type LocationState =
  | { status: 'idle' }
  | { status: 'locating' }
  | { status: 'located'; lat: number; lng: number }
  /** Permission denied, or the platform has no geolocation at all. */
  | { status: 'unavailable'; message: string }
  /** The lookup started but did not complete in time. */
  | { status: 'timeout'; message: string };

/**
 * The saved-places set.
 *
 * `pending` holds the ids whose write is still in flight, so the Save button
 * can show that a tap registered — and so a failed write can be reverted
 * instead of silently leaving the UI and the database out of sync.
 */
export interface FavoritesState {
  ids: Set<number>;
  pending: Set<number>;
  error: string;
}

export const emptyFavoritesState: FavoritesState = {
  ids: new Set<number>(),
  pending: new Set<number>(),
  error: '',
};

/** True when the given place is currently being written. */
export const isFavoritePending = (state: FavoritesState, id: number): boolean =>
  state.pending.has(id);
