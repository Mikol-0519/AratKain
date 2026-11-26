import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import HomePage from './HomePage';

/**
 * Covers the two HomePage behaviours that were actual bugs:
 *
 *  - a failed fetch must surface an error, not a silently empty list
 *  - `is_open = null` is "unknown", not "open"
 */

// Minimal Leaflet stand-in: HomePage only needs these to exist.
const leafletStub = {
  map: () => ({
    setView() {}, invalidateSize() {}, panTo() {},
    on() {}, off() {}, remove() {},
  }),
  tileLayer: () => ({ addTo() {} }),
  marker: () => {
    const m = {
      addTo() { return m; }, bindTooltip() { return m; },
      on() { return m; }, remove() {},
    };
    return m;
  },
  divIcon: (o: unknown) => o,
};

// Built inside the factory: jest hoists jest.mock above the module's
// imports, so the factory runs before any top-level const is initialised.
// Plain functions, not jest.fn(): CRA sets `resetMocks: true`, which wipes
// mockResolvedValue before every test.
jest.mock('../../auth/services/supabaseClient', () => ({
  supabase: {
    auth: { getUser: async () => ({ data: { user: null } }) },
    from: () => ({
      select: () => ({ eq: async () => ({ data: [] }) }),
    }),
  },
  isRecoveryCallback: false,
  watchForRecoveryNavigation: () => () => {},
}));

const establishment = (over: Record<string, unknown> = {}) => ({
  establishmentId: 1,
  name: 'Burnham Brew',
  estabType: 'cafe',
  averageRating: 4.5,
  reviewCount: 12,
  isOpen: null,
  latitude: 10.31,
  longitude: 123.88,
  address: 'Cebu',
  ...over,
});

const user = { id: 'u1', email: 'a@b.com', username: 'mikel', fullname: 'Mikel' };

beforeEach(() => {
  (window as any).L = leafletStub;
  global.fetch = jest.fn();
});

const renderHome = () =>
  render(
    <HomePage
      user={user}
      onLogout={() => {}}
      onUserUpdate={() => {}}
    />,
  );

it('shows an error instead of a silently empty list when the fetch fails', async () => {
  (global.fetch as jest.Mock).mockRejectedValue(new Error('backend down'));

  renderHome();

  await waitFor(() => {
    expect(screen.getByText(/Could not load places/)).toBeInTheDocument();
  });
  expect(screen.queryByText('Burnham Brew')).not.toBeInTheDocument();
});

it('renders unknown opening hours as unknown, not as open', async () => {
  (global.fetch as jest.Mock).mockResolvedValue({
    ok: true,
    json: async () => [establishment({ isOpen: null })],
  });

  renderHome();

  // The name appears twice: in the list and in the "Top Rated" widget.
  await waitFor(() => {
    expect(screen.getAllByText('Burnham Brew').length).toBeGreaterThan(0);
  });
  expect(screen.getByText('Hours unknown')).toBeInTheDocument();
  expect(screen.queryByText('Open')).not.toBeInTheDocument();
});

it('renders a closed venue as closed', async () => {
  (global.fetch as jest.Mock).mockResolvedValue({
    ok: true,
    json: async () => [establishment({ isOpen: false })],
  });

  renderHome();

  await waitFor(() => {
    expect(screen.getByText('Closed')).toBeInTheDocument();
  });
});

it('renders an open venue as open', async () => {
  (global.fetch as jest.Mock).mockResolvedValue({
    ok: true,
    json: async () => [establishment({ isOpen: true })],
  });

  renderHome();

  await waitFor(() => {
    expect(screen.getByText('Open')).toBeInTheDocument();
  });
});

it('searches through the backend search endpoint', async () => {
  (global.fetch as jest.Mock).mockResolvedValue({
    ok: true,
    json: async () => [establishment()],
  });

  renderHome();
  await waitFor(() => expect(global.fetch).toHaveBeenCalled());

  const input = screen.getByPlaceholderText(/Search cafes/);
  fireEvent.change(input, { target: { value: 'coffee' } });
  fireEvent.keyDown(input, { key: 'Enter' });

  await waitFor(() => {
    const searched = (global.fetch as jest.Mock).mock.calls
      .some(([url]) => String(url).includes('/api/establishments/search?q=coffee'));
    expect(searched).toBe(true);
  });
});

it('loads nearby places from the browser location when Near Me is clicked', async () => {
  (global.fetch as jest.Mock).mockResolvedValue({
    ok: true,
    json: async () => [establishment()],
  });
  localStorage.clear();
  Object.defineProperty(navigator, 'geolocation', {
    configurable: true,
    value: {
      getCurrentPosition: jest.fn((success) =>
        success({ coords: { latitude: 10.31, longitude: 123.88 } })),
    },
  });

  renderHome();
  await waitFor(() => expect(global.fetch).toHaveBeenCalled());
  fireEvent.click(screen.getByRole('button', { name: /Near Me/i }));

  await waitFor(() => {
    const call = (global.fetch as jest.Mock).mock.calls
      .find(([url]) => String(url).includes('/api/establishments/nearby'));
    expect(call).toBeTruthy();
    expect(JSON.parse(call![1].body)).toMatchObject({
      latitude: 10.31,
      longitude: 123.88,
    });
  });
});
