import type { ReactElement } from 'react';
import type { SpotType } from '../domain/spot';

/**
 * The icon set used across the discovery screens.
 *
 * These were duplicated verbatim in HomePage.tsx and FavoritesPage.tsx as
 * two separate `Icon` objects — adding an icon meant editing both.
 */
export const Icon = {
  Food: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
      <line x1="7" y1="2" x2="7" y2="22" />
      <path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7" />
    </svg>
  ),
  Bookmark: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  ),
  BookmarkFilled: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  ),
  User: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  Search: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  Locate: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
    </svg>
  ),
  Alert: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  Star: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  ),
  MapPin: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  ),
  Close: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  Navigate: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <polygon points="3 11 22 2 13 21 11 13 3 11" />
    </svg>
  ),
  Logout: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  ),
  X: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  ArrowLeft: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  ),
  Trash: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  ),
};

/**
 * Inner SVG markup for each place type.
 *
 * One source of truth: the React icons below and the HTML string handed to
 * Leaflet's `divIcon` (which cannot host a React tree) both render these
 * exact paths, so a marker and its list card can never drift apart.
 */
const TYPE_GLYPH: Record<SpotType, string> = {
  cafe:
    '<path d="M4 8h11a4 4 0 0 1 0 8h-1v1a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3V8z"/>' +
    '<path d="M15 10h1.5a2.5 2.5 0 0 1 0 5H15"/>' +
    '<path d="M7 3v2M10 3v2M13 3v2"/>',
  restaurant:
    '<path d="M3 2v7a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V2"/>' +
    '<line x1="7" y1="2" x2="7" y2="22"/>' +
    '<path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7"/>',
  bar:
    '<path d="M5 3h14l-7 8z"/>' +
    '<path d="M12 11v8"/>' +
    '<path d="M8 21h8"/>',
  unknown:
    '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>' +
    '<circle cx="12" cy="10" r="3"/>',
};

const glyphSvg = (type: SpotType, strokeWidth: number): ReactElement => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    dangerouslySetInnerHTML={{ __html: TYPE_GLYPH[type] }}
  />
);

/** React icon for a place type, coloured by the surrounding text colour. */
export const TYPE_ICON: Record<SpotType, () => ReactElement> = {
  cafe: () => glyphSvg('cafe', 1.5),
  restaurant: () => glyphSvg('restaurant', 1.5),
  bar: () => glyphSvg('bar', 1.5),
  unknown: () => glyphSvg('unknown', 1.5),
};

/**
 * The same glyph as a standalone SVG string, for HTML templates (Leaflet
 * markers). `stroke` is set inline because those markers sit on a coloured
 * circle with no CSS cascade.
 */
export function typeGlyphMarkup(type: SpotType, stroke = 'currentColor'): string {
  return (
    `<svg viewBox="0 0 24 24" fill="none" stroke="${stroke}" stroke-width="1.5" ` +
    `stroke-linecap="round" stroke-linejoin="round">${TYPE_GLYPH[type]}</svg>`
  );
}

export default Icon;
