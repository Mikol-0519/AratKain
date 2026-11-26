import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProfilePage from './ProfilePage';

/**
 * The profile save was silently broken: the code read
 * `const { data: session } = await getSession()` and then used
 * `session.session?.user.id` - one level too deep, so `userId` was always
 * undefined and the update matched no rows while the UI reported success.
 *
 * This pins the fix: the update must be scoped to the real user id.
 */

const calls: { payload: unknown; column: string; value: unknown }[] = [];

jest.mock('../../auth/services/supabaseClient', () => ({
  supabase: {
    auth: {
      getSession: async () => ({
        data: { session: { user: { id: 'user-42', email: 'a@b.com' } } },
      }),
    },
    from: () => ({
      select: () => ({
        eq: () => ({ maybeSingle: async () => ({ data: null }) }),
      }),
      update: (payload: unknown) => ({
        eq: (column: string, value: unknown) => {
          calls.push({ payload, column, value });
          return Promise.resolve({ error: null });
        },
      }),
    }),
    storage: { from: () => ({ upload: async () => ({ error: null }) }) },
  },
  isRecoveryCallback: false,
  watchForRecoveryNavigation: () => () => {},
}));

const user = { id: 'user-42', email: 'a@b.com', username: 'mikel', fullname: 'Mikel' };

beforeEach(() => {
  calls.length = 0;
});

const renderProfile = () =>
  render(
    <ProfilePage
      user={user}
      onBack={() => {}}
      onUpdated={() => {}}
    />,
  );

it('scopes the profile update to the signed-in user id', async () => {
  renderProfile();

  await userEvent.click(screen.getByRole('button', { name: /Save Changes/i }));

  await waitFor(() => {
    expect(calls).toHaveLength(1);
  });
  expect(calls[0].column).toBe('user_id');
  expect(calls[0].value).toBe('user-42');
  expect(calls[0].payload).toEqual({ username: 'mikel', fullname: 'Mikel' });
});

it('reports success once the update succeeds', async () => {
  renderProfile();

  await userEvent.click(screen.getByRole('button', { name: /Save Changes/i }));

  await waitFor(() => {
    expect(screen.getByText(/Profile updated successfully/i)).toBeInTheDocument();
  });
});
