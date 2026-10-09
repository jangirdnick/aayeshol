/**
 * Strict email regex pattern requiring valid username, @ symbol, domain name, and TLD.
 * Prevents invalid email formats like 'user@domain' or 'user@@domain.com'.
 */
export const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

/**
 * Strong password regex pattern enforcing enterprise-grade complexity.
 * Requires:
 * - 8 to 128 characters in length
 * - At least 1 lowercase letter (a-z)
 * - At least 1 uppercase letter (A-Z)
 * - At least 1 numeric digit (0-9)
 * - At least 1 special character (!@#$%^&*()_+-=[]{};':"|,.<>/?)
 */
export const STRONG_PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{8,128}$/;
