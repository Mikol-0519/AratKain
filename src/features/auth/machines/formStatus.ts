/**
 * The shared "async form" state machine.
 *
 * Four screens used to model the same thing with four different sets of
 * independent booleans (`loading`, `serverError`, `fieldErrors`, `success`),
 * which made illegal combinations representable — e.g. "submitting" *and*
 * "showing an error" *and* "showing field errors" at the same time.
 *
 * The state below is a single value: exactly one case is active, the compiler
 * enforces it, and `switch (status.status)` is exhaustive.
 */
export type FieldErrors = Record<string, string>;

/**
 * Transitions:
 *
 *   idle ──submit──▶ submitting
 *   submitting ──invalid fields──▶ invalid  ──retry──▶ submitting
 *   submitting ──failure──▶ failed  ──retry──▶ submitting
 *   submitting ──success──▶ succeeded
 *
 * Any state may transition back to `idle` when the form is reset.
 */
export type FormStatus =
  | { status: 'idle' }
  | { status: 'submitting' }
  | { status: 'invalid'; fieldErrors: FieldErrors }
  | { status: 'failed'; message: string }
  | { status: 'succeeded' };

/** True while a request is in flight — used to disable the submit button. */
export const isSubmitting = (status: FormStatus): boolean => status.status === 'submitting';
