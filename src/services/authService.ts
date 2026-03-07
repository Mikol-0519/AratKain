import { supabase } from './supabaseClient';

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

// ── Register ───────────────────────────────────────────────────────────────────

export async function registerUser(
  username: string,
  fullname: string,
  email: string,
  password: string,
  confirmPassword: string
): Promise<AuthUser> {

  // Client-side validation
  const fieldErrors: Record<string, string> = {};
  if (!username.trim())               fieldErrors.username = 'Username is required';
  else if (username.length < 3)       fieldErrors.username = 'Username must be at least 3 characters';
  else if (!/^[a-zA-Z0-9_]+$/.test(username))
                                       fieldErrors.username = 'Username can only contain letters, numbers, and underscores';
  if (!fullname.trim())               fieldErrors.fullname = 'Full name is required';
  if (!email.includes('@'))           fieldErrors.email    = 'Enter a valid email address';
  if (password.length < 6)            fieldErrors.password = 'Password must be at least 6 characters';
  if (password !== confirmPassword)   fieldErrors.confirmPassword = 'Passwords do not match';

  if (Object.keys(fieldErrors).length > 0) {
    const err: AuthError = { type: 'VALIDATION_ERROR', message: 'Please fix the errors below', fieldErrors };
    throw err;
  }

  // Check if username already exists in our users table
  const { data: existingUser } = await supabase
    .from('users')
    .select('username')
    .eq('username', username)
    .maybeSingle();

  if (existingUser) {
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

  // Save extra profile data into our users table
  const { error: insertError } = await supabase.from('users').insert({
    user_id:  data.user.id,
    username,
    fullname,
    email,
    password: '—',          // actual password is managed by Supabase Auth
    role:     'user',
  });

  if (insertError) {
    const err: AuthError = { type: 'SERVER_ERROR', message: 'Failed to save user profile. Please try again.' };
    throw err;
  }

  return { id: data.user.id, email, username, fullname };
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

  // Fetch profile from our users table
  const { data: profile } = await supabase
    .from('users')
    .select('username, fullname')
    .eq('user_id', data.user.id)
    .maybeSingle();

  return {
    id:       data.user.id,
    email:    data.user.email ?? email,
    username: profile?.username ?? email.split('@')[0],
    fullname: profile?.fullname ?? '',
  };
}

// ── Logout ─────────────────────────────────────────────────────────────────────

export async function logoutUser(): Promise<void> {
  await supabase.auth.signOut();
}