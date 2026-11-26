import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL!;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY!;

/**
 * True when the page was loaded as a password-recovery callback (user clicked
 * the link in the reset email). With the implicit flow the tokens — including
 * `type=recovery` — arrive in the URL fragment: #access_token=…&type=recovery.
 *
 * Read this BEFORE createClient() below: auth-js parses the same URL on startup
 * and then strips it, so anything read later is unreliable. We route to the
 * reset-password form ourselves instead of relying on the PASSWORD_RECOVERY
 * event, which auth-js emits asynchronously and can be missed
 * (see supabase/auth-js#1948).
 */
export const isRecoveryCallback =
  typeof window !== 'undefined' &&
  (/type=recovery/i.test(window.location.hash) ||
   /type=recovery/i.test(window.location.search));

/**
 * Watch for a recovery link that arrives while the app is already open.
 *
 * `isRecoveryCallback` above is a snapshot taken at module load, because
 * auth-js parses and strips the fragment during startup. But a recovery link
 * clicked in a tab that already has the app open is a *fragment-only*
 * navigation: the document is never reloaded, so auth-js never parses the
 * tokens and the snapshot stays stale — the user is left on the landing page
 * instead of the reset form, with no error.
 *
 * Reloading makes the normal path run. Safe: auth-js strips the fragment with
 * `history.replaceState`, which does not fire `hashchange`, so this cannot
 * loop.
 *
 * @returns a cleanup function.
 */
export function watchForRecoveryNavigation(): () => void {
  const onHashChange = () => {
    if (/type=recovery/i.test(window.location.hash)) {
      window.location.reload();
    }
  };
  window.addEventListener('hashchange', onHashChange);
  return () => window.removeEventListener('hashchange', onHashChange);
}

export const supabase = createClient(supabaseUrl, supabaseKey);
