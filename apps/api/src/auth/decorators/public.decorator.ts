import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Marks a route handler as public — skips JWT authentication guard.
 *
 * @example
 * \@Public()
 * \@Post('register')
 * register() { ... }
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
