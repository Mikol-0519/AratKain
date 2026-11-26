import { toSpots, sortSpots, type Spot } from '../domain/spot';

const raw = (over: Record<string, unknown> = {}) => ({
  establishmentId: 1,
  name: 'A place',
  estabType: 'cafe',
  averageRating: 4,
  reviewCount: 10,
  isOpen: true,
  latitude: 10,
  longitude: 123,
  address: '',
  description: '',
  phone: '',
  ...over,
});

const spot = (over: Partial<Spot>): Spot => ({
  id: 0, name: '', type: 'cafe', rating: 0, reviewCount: 0,
  distance: '', distanceKm: null, openState: 'open',
  lat: 0, lng: 0, address: '', description: '', phone: '',
  ...over,
});

describe('toSpots', () => {
  it('keeps a missing type and a missing open flag as unknown', () => {
    const [s] = toSpots([raw({ estabType: null, isOpen: null })]);

    expect(s.type).toBe('unknown');      // was cast to "cafe"
    expect(s.openState).toBe('unknown'); // was collapsed to "open"
  });

  it('normalises type case and whitespace', () => {
    const [s] = toSpots([raw({ estabType: ' Cafe ' })]);

    expect(s.type).toBe('cafe');
  });
});

describe('sortSpots', () => {
  it('puts unrated venues last when sorting by rating', () => {
    const sorted = sortSpots(
      [spot({ name: 'Unrated', rating: 0 }), spot({ name: 'Top', rating: 4.5 })],
      'rating',
    );

    expect(sorted.map(s => s.name)).toEqual(['Top', 'Unrated']);
  });

  it('puts the nearest venue first and unknown distances last', () => {
    const sorted = sortSpots(
      [
        spot({ name: 'Unknown', distanceKm: null }),
        spot({ name: 'Far', distanceKm: 5 }),
        spot({ name: 'Near', distanceKm: 0.4 }),
      ],
      'distance',
    );

    expect(sorted.map(s => s.name)).toEqual(['Near', 'Far', 'Unknown']);
  });
});
