import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';

export default tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/.next/**',
      '**/.turbo/**',
      '**/.agents/**',
      '**/coverage/**',
    ],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.browser,
      },
    },
    rules: {
      // -------------------------------------------------------------
      // Strict Production Logging & Debug Rules (Zero Console Leakage)
      // -------------------------------------------------------------
      'no-console': 'error',
      'no-debugger': 'error',
      'no-alert': 'error',

      // -------------------------------------------------------------
      // Strict Type Safety & Quality
      // -------------------------------------------------------------
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/consistent-type-imports': [
        'error',
        {
          prefer: 'type-imports',
          fixStyle: 'inline-type-imports',
          disallowTypeAnnotations: false,
        },
      ],

      // -------------------------------------------------------------
      // Code Hygiene & Best Practices
      // -------------------------------------------------------------
      'no-duplicate-imports': 'error',
      'no-var': 'error',
      'prefer-const': 'error',
      eqeqeq: ['error', 'always', { null: 'ignore' }],
    },
  },
  {
    files: ['**/apps/api/**/*.ts', 'apps/api/**/*.ts'],
    rules: {
      // NestJS relies on emitDecoratorMetadata and runtime class constructor tokens for DI
      '@typescript-eslint/consistent-type-imports': 'off',
    },
  },
);
