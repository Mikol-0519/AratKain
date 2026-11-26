import { supabase } from './supabaseClient';
import {
  validatePassword,
  validatePasswordConfirmation,
} from '../utils/passwordPolicy';

// ── Types ──────────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  fullname: string;
}

export interface AuthError {
  type:
    | 'INVALID_CREDENTIALS'
    | 'USER_ALREADY_EXISTS'
    | 'USERNAME_TAKEN'
    | 'PASSWORD_MISMATCH'
    | 'VALIDATION_ERROR'
    | 'SERVER_ERROR';
  message: string;
  fieldErrors?: Record<string, string>;
}

/**
 * The outcome of a registration attempt.
 *
 * The register form used to always assume success and send the user to the
 * dashboard. That is only true when Supabase returns a session — which it
 * does when email confirmation is disabled. When confirmation is enabled,
 * `signUp` returns a user but no session, the own-row RLS policy on
 * `users` then rejects the profile insert, and the user got the unhelpful
 * "Failed to save user profile". This makes the branch explicit.
 */
export type RegisterOutcome =
  | { status: 'authenticated'; user: AuthUser }
  | { status: 'pending-confirmation'; email: string };

// ── Profile lookup ────────────────────────────────────────────────────────────

/**
 * Load the public profile for a user id.
 *
 * Used by the session restore, by the login flow and by the auth-state
 * subscription — three call sites that used to carry their own copy of this
 * query and their own fallback rules.
 */
export async function fetchAuthUser(userId: string, email: string): Promise<AuthUser> {
  const { data: profile } = await supabase
    .from('users')
    .select('username, fullname')
    .eq('user_id', userId)
    .maybeSingle();

  return {
    id: userId,
    email,
    username: profile?.username ?? email.split('@')[0] ?? '',
    fullname: profile?.fullname ?? '',
  };
}

// ── Register ───────────────────────────────────────────────────────────────────

export async function registerUser(
  username: string,
  fullname: string,
  email: string,
  password: string,
  confirmPassword: string
): Promise<RegisterOutcome> {

  // Client-side validation
  const fieldErrors: Record<string, string> = {};
  if (!username.trim())               fieldErrors.username = 'Username is required';
  else if (username.length < 3)       fieldErrors.username = 'Username must be at least 3 characters';
  else if (!/^[a-zA-Z0-9_]+$/.test(username))
                                       fieldErrors.username = 'Username can only contain letters, numbers, and underscores';
  if (!fullname.trim())               fieldErrors.fullname = 'Full name is required';
  if (!email.includes('@'))           fieldErrors.email    = 'Enter a valid email address';
  const passwordError = validatePassword(password);
  if (passwordError)                 fieldErrors.password = passwordError;
  const mismatchError = validatePasswordConfirmation(password, confirmPassword);
  if (mismatchError)      fieldErrors.confirmPassword = mismatchError;

  if (Object.keys(fieldErrors).length > 0) {
    const err: AuthError = { type: 'VALIDATION_ERROR', message: 'Please fix the errors below', fieldErrors };
    throw err;
  }

  // Check if username already exists using a hardened DB RPC — the users
  // table itself is no longer readable without a session (RLS hardening).
  const { data: usernameTaken, error: rpcError } = await supabase.rpc(
    'username_taken',
    { username_to_check: username },
  );

  if (rpcError) {
    const err: AuthError = { type: 'SERVER_ERROR', message: 'Could not verify the username. Please try again.' };
    throw err;
  }

  if (usernameTaken) {
    const err: AuthError = {
      type: 'USERNAME_TAKEN',
      message: `Username "${username}" is already taken. Please choose another.`,
    };
    throw err;
  }

  // Sign up via Supabase Auth
  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) {
    if (error.message.toLowerCase().includes('already registered') ||
        error.message.toLowerCase().includes('already exists')) {
      const err: AuthError = {
        type: 'USER_ALREADY_EXISTS',
        message: 'An account with this email already exists.',
      };
      throw err;
    }
    const err: AuthError = { type: 'SERVER_ERROR', message: error.message };
    throw err;
  }

  if (!data.user) {
    const err: AuthError = { type: 'SERVER_ERROR', message: 'Registration failed. Please try again.' };
    throw err;
  }

  // No session yet => Supabase is configured to require email confirmation.
  // The profile insert below would be rejected by the own-row RLS policy
  // (it needs an authenticated caller), so stop here and tell the user
  // what is actually happening instead of reporting a failed insert.
  if (!data.session) {
    return { status: 'pending-confirmation', email };
  }

  // Save extra profile data into our users table
  const { error: insertError } = await supabase.from('users').insert({
    user_id:  data.user.id,
    username,
    fullname,
    email,
    // Legacy column: the backend's own auth endpoints are gone, so nothing
    // reads this any more. It is dropped in
    // AratKain-Backend/sql/migrations/002_drop_users_password.sql — run step 1
    // of that migration, then this line, then step 2.
    password: '—',
    role:     'user',
  });

  if (insertError) {
    const err: AuthError = { type: 'SERVER_ERROR', message: 'Failed to save user profile. Please try again.' };
    throw err;
  }

  return {
    status: 'authenticated',
    user: { id: data.user.id, email, username, fullname },
  };
}

// ── Login ──────────────────────────────────────────────────────────────────────

export async function loginUser(email: string, password: string): Promise<AuthUser> {

  // Client-side validation
  const fieldErrors: Record<string, string> = {};
  if (!email.trim())        fieldErrors.email    = 'Email is required';
  else if (!email.includes('@')) fieldErrors.email = 'Enter a valid email address';
  if (!password.trim())     fieldErrors.password = 'Password is required';

  if (Object.keys(fieldErrors).length > 0) {
    const err: AuthError = { type: 'VALIDATION_ERROR', message: 'Please fix the errors below', fieldErrors };
    throw err;
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    if (error.message.toLowerCase().includes('invalid') ||
        error.message.toLowerCase().includes('credentials') ||
        error.message.toLowerCase().includes('password')) {
      const err: AuthError = {
        type: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password. Please try again.',
      };
      throw err;
    }
    const err: AuthError = { type: 'SERVER_ERROR', message: 'A server error occurred. Please try again later.' };
    throw err;
  }

  if (!data.user) {
    const err: AuthError = { type: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' };
    throw err;
  }

  return fetchAuthUser(data.user.id, data.user.email ?? email);
}

// ── Logout ─────────────────────────────────────────────────────────────────────

export async function logoutUser(): Promise<void> {
  await supabase.auth.signOut();
}
