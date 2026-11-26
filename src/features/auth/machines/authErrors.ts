import { AuthError } from '../services/authService';

/**
 * Maps a service-layer failure onto the two shapes a form can render:
 * per-field errors, or a single banner message.
 *
 * The mapping used to live as two `switch` statements inside LoginPage and
 * RegisterPage. They disagreed (RegisterPage handled `PASSWORD_MISMATCH`,
 * LoginPage did not), and `PASSWORD_MISMATCH` was in fact never thrown —
 * `registerUser` reports it as a `VALIDATION_ERROR` on `confirmPassword`.
 * One mapping, one place, no dead branches.
 */
export type FieldErrors = Record<string, string>;

export type AuthFailure =
  | { kind: 'fields'; fieldErrors: FieldErrors }
  | { kind: 'message'; message: string };

const SERVER_ERROR_MESSAGE = 'A server error occurred. Please try again later.';

export function describeAuthError(error: unknown): AuthFailure {
  const authError = error as AuthError | undefined;

  switch (authError?.type) {
    case 'VALIDATION_ERROR': {
      const fieldErrors = authError.fieldErrors;
      if (fieldErrors && Object.keys(fieldErrors).length > 0) {
        return { kind: 'fields', fieldErrors };
      }
      return { kind: 'message', message: authError.message ?? 'Please fix the errors below' };
    }

    case 'INVALID_CREDENTIALS':
      return {
        kind: 'message',
        message: 'Invalid email or password. Please check your credentials and try again.',
      };

    case 'USERNAME_TAKEN':
      return {
        kind: 'fields',
        fieldErrors: { username: authError.message ?? 'This username is already taken.' },
      };

    case 'USER_ALREADY_EXISTS':
      return {
        kind: 'message',
        message: authError.message ?? 'An account with this email already exists.',
      };

    case 'PASSWORD_MISMATCH':
      return { kind: 'fields', fieldErrors: { confirmPassword: 'Passwords do not match' } };

    case 'SERVER_ERROR':
    default:
      return { kind: 'message', message: SERVER_ERROR_MESSAGE };
  }
}
