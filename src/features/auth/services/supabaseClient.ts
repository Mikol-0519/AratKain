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

export const supabase = createClient(supabaseUrl, supabaseKey);
