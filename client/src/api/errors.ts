import type { AuthError, PostgrestError } from '@supabase/supabase-js';

function isPostgrestError(err: unknown): err is PostgrestError {
  return (
    typeof err === 'object' &&
    err !== null &&
    'message' in err &&
    'code' in err &&
    typeof (err as PostgrestError).message === 'string'
  );
}

export function throwIfError(error: PostgrestError | AuthError | null): void {
  if (error) throw error;
}

export function getApiErrorMessage(err: unknown): string {
  if (isPostgrestError(err)) {
    if (err.code === '23505') {
      return 'Connection already exists between these nodes';
    }
    return err.message;
  }

  if (err instanceof Error && err.message) {
    return err.message;
  }

  return 'Something went wrong';
}
