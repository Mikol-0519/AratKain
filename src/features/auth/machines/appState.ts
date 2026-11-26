import { AuthUser } from '../services/authService';

/**
 * The application-level state machine.
 *
 * Before this existed, `App.tsx` tracked three independent values —
 * `page` (6 variants), `user` (user | null) and `loading` (boolean) — which
 * made illegal combinations representable: `page === 'dashboard'` with
 * `user === null` rendered the landing page, and `page === 'landing'` with a
 * signed-in user was equally possible.
 *
 * The state below is a single discriminated union. Exactly one case is
 * active, the compiler enforces it, and `switch (state.status)` is
 * exhaustive.
 *
 * Transitions:
 *
 *   restoring ──no session──────────────▶ signed-out { route: 'landing' }
 *   restoring ──session─────────────────▶ signed-in  { user }
 *   restoring ──recovery link───────────▶ signed-out { route: 'reset-password' }
 *   signed-out ──login/register ok─────▶ signed-in  { user }
 *   signed-in  ──logout / session gone─▶ signed-out { route: 'landing' }
 *   signed-out ──navigate──────────────▶ signed-out { route: <other> }
 */
export type AuthRoute =
  | 'landing'
  | 'login'
  | 'register'
  | 'forgot-password'
  | 'reset-password';

export type AppState =
  | { status: 'restoring' }
  | { status: 'signed-out'; route: AuthRoute }
  | { status: 'signed-in'; user: AuthUser };
