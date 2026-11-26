import { describeAuthError } from './authErrors';
import type { AuthError } from '../services/authService';

const err = (type: AuthError['type'], extra: Partial<AuthError> = {}): AuthError =>
  ({ type, message: 'raw message', ...extra });

describe('describeAuthError', () => {
  it('turns field-level validation failures into field errors', () => {
    const failure = describeAuthError(
      err('VALIDATION_ERROR', { fieldErrors: { email: 'Email is required' } }),
    );

    expect(failure).toEqual({
      kind: 'fields',
      fieldErrors: { email: 'Email is required' },
    });
  });

  it('falls back to a banner when a validation failure carries no fields', () => {
    const failure = describeAuthError(err('VALIDATION_ERROR'));

    expect(failure).toEqual({ kind: 'message', message: 'raw message' });
  });

  it('puts a taken username on the username field', () => {
    const failure = describeAuthError(err('USERNAME_TAKEN'));

    expect(failure.kind).toBe('fields');
    expect(failure.kind === 'fields' && failure.fieldErrors.username).toBe('raw message');
  });

  it('puts a password mismatch on the confirmation field', () => {
    const failure = describeAuthError(err('PASSWORD_MISMATCH'));

    expect(failure).toEqual({
      kind: 'fields',
      fieldErrors: { confirmPassword: 'Passwords do not match' },
    });
  });

  it('shows a banner for wrong credentials and duplicate accounts', () => {
    expect(describeAuthError(err('INVALID_CREDENTIALS')).kind).toBe('message');
    expect(describeAuthError(err('USER_ALREADY_EXISTS')).kind).toBe('message');
  });

  it('never leaks the raw server message for a server error', () => {
    const failure = describeAuthError(err('SERVER_ERROR'));

    expect(failure).toEqual({
      kind: 'message',
      message: 'A server error occurred. Please try again later.',
    });
  });

  it('treats an unknown error type as a server error', () => {
    const failure = describeAuthError({ type: 'WAT' } as unknown as AuthError);

    expect(failure.kind).toBe('message');
  });
});
