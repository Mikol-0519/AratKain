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

const position = (lat: number, lng: number) =>
  ({ coords: { latitude: lat, longitude: lng } } as GeolocationPosition);

beforeEach(() => localStorage.clear());

it('uses the fast network fix first and remembers it', async () => {
  const getCurrentPosition = mockGeolocation((success) => success(position(10.3, 123.9)));

  const fix = await locateUser();

  expect(fix).toEqual({ lat: 10.3, lng: 123.9 });
  expect(getCurrentPosition).toHaveBeenCalledTimes(1);
  expect(getCurrentPosition.mock.calls[0][2]).toMatchObject({
    enableHighAccuracy: false,
    maximumAge: 300000,
  });
  expect(lastKnownLocation()).toEqual({ lat: 10.3, lng: 123.9, approximate: true });
});

it('retries with high accuracy when the fast attempt times out', async () => {
  const getCurrentPosition = mockGeolocation(jest.fn()
    .mockImplementationOnce((_success, error) => error({ code: 3 }))
    .mockImplementationOnce((success) => success(position(10.1, 123.2))));

  const fix = await locateUser();

  expect(getCurrentPosition).toHaveBeenCalledTimes(2);
  expect(getCurrentPosition.mock.calls[1][2]).toMatchObject({ enableHighAccuracy: true });
  expect(fix).toEqual({ lat: 10.1, lng: 123.2 });
});

it('falls back to the last saved fix when both attempts fail', async () => {
  localStorage.setItem('aratkain.lastLocation', JSON.stringify({ lat: 10.5, lng: 123.4 }));
  const getCurrentPosition = mockGeolocation((_success, error) => error({ code: 3 }));

  const fix = await locateUser();

  expect(getCurrentPosition).toHaveBeenCalledTimes(2);
  expect(fix).toEqual({ lat: 10.5, lng: 123.4, approximate: true });
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
