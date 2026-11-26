import { locateUser, lastKnownLocation } from './geolocation';

/** Geolocation has no jsdom implementation, so each test supplies one. */
const mockGeolocation = (implementation: (...args: any[]) => void) => {
  const getCurrentPosition = jest.fn(implementation);
  Object.defineProperty(navigator, 'geolocation', {
    configurable: true,
    value: { getCurrentPosition },
  });
  return getCurrentPosition;
};

const mockIpLookup = (body: unknown, ok = true) => {
  const fetch = jest.fn().mockResolvedValue({ ok, json: async () => body });
  global.fetch = fetch as jest.Mock;
  return fetch;
};

const position = (lat: number, lng: number) =>
  ({ coords: { latitude: lat, longitude: lng } } as GeolocationPosition);

beforeEach(() => localStorage.clear());

it('uses the fast network fix first and remembers it', async () => {
  const getCurrentPosition = mockGeolocation((success) => success(position(10.3, 123.9)));

  const fix = await locateUser();

  expect(fix).toMatchObject({ lat: 10.3, lng: 123.9, source: 'gps' });
  expect(getCurrentPosition).toHaveBeenCalledTimes(1);
  expect(getCurrentPosition.mock.calls[0][2]).toMatchObject({
    enableHighAccuracy: false,
    maximumAge: 300000,
  });
  expect(lastKnownLocation()).toMatchObject({ lat: 10.3, lng: 123.9, approximate: true });
});

it('retries with high accuracy when the fast attempt times out', async () => {
  const getCurrentPosition = mockGeolocation(jest.fn()
    .mockImplementationOnce((_success, error) => error({ code: 3 }))
    .mockImplementationOnce((success) => success(position(10.1, 123.2))));

  const fix = await locateUser();

  expect(getCurrentPosition).toHaveBeenCalledTimes(2);
  expect(getCurrentPosition.mock.calls[1][2]).toMatchObject({ enableHighAccuracy: true });
  expect(fix).toMatchObject({ lat: 10.1, lng: 123.2, source: 'gps' });
});

it('falls back to the last saved fix before any IP lookup', async () => {
  localStorage.setItem('aratkain.lastLocation', JSON.stringify({ lat: 10.5, lng: 123.4 }));
  mockGeolocation((_success, error) => error({ code: 3 }));
  const fetch = mockIpLookup({});

  const fix = await locateUser();

  expect(fix).toMatchObject({ lat: 10.5, lng: 123.4, approximate: true, source: 'saved' });
  expect(fetch).not.toHaveBeenCalled();
});

it('uses an IP-based approximate location when the browser cannot fix and nothing is saved', async () => {
  mockGeolocation((_success, error) => error({ code: 3 }));
  const fetch = mockIpLookup({
    success: true, latitude: 10.3167206, longitude: 123.8907141, city: 'Cebu City',
  });

  const fix = await locateUser();

  expect(fetch).toHaveBeenCalledWith('https://ipwho.is/', expect.any(Object));
  expect(fix).toEqual({
    lat: 10.3167206,
    lng: 123.8907141,
    approximate: true,
    source: 'ip',
    label: 'Cebu City',
  });
  expect(lastKnownLocation()).toMatchObject({ lat: 10.3167206, lng: 123.8907141 });
});

it('reports a failure when the IP lookup returns a bad response', async () => {
  mockGeolocation((_success, error) => error({ code: 2 })); // POSITION_UNAVAILABLE
  mockIpLookup({ success: false });

  await expect(locateUser()).rejects.toMatchObject({ reason: 'network' });
});

it('does not retry a permission denial', async () => {
  const getCurrentPosition = mockGeolocation((_success, error) => error({ code: 1 }));

  await expect(locateUser()).rejects.toMatchObject({ reason: 'denied' });
  expect(getCurrentPosition).toHaveBeenCalledTimes(1);
});

it('reports browsers without geolocation', async () => {
  Object.defineProperty(navigator, 'geolocation', {
    configurable: true,
    value: undefined,
  });

  await expect(locateUser()).rejects.toMatchObject({ reason: 'unsupported' });
});

it('ignores corrupt saved fixes', () => {
  localStorage.setItem('aratkain.lastLocation', '{not json');
  expect(lastKnownLocation()).toBeNull();
});
