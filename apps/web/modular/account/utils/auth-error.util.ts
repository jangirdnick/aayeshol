import type { z } from 'zod';

type SafeParseLike<T> =
  | { success: true; data: T }
  | {
      success: false;
      error: {
        issues: Array<{
          path: Array<string | number | symbol>;
          message: string;
        }>;
      };
    };

/**
 * Extracts and maps Zod validation issues into a key-value record for form field error display.
 * Compatible with Zod v4 parsing results.
 *
 * @param result - The Zod `safeParse` result
 * @returns A record mapping field names to user-friendly error messages
 */
export function extractZodErrors<T>(
  result: SafeParseLike<T> | ReturnType<z.ZodType<T>['safeParse']>,
): Record<string, string> {
  if (result.success) {
    return {};
  }

  const errors: Record<string, string> = {};

  for (const issue of result.error.issues) {
    const key = issue.path.length > 0 ? String(issue.path[0]) : 'root';
    // Preserve the first error encountered per field
    if (!errors[key]) {
      errors[key] = issue.message;
    }
  }

  return errors;
}
