// ESLint mit Prettier (CLAUDE.md, Befehle). Design System, Dokumente und Daten sind Quellen, kein Code.
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import prettier from 'eslint-plugin-prettier/recommended';
import globals from 'globals';

export default tseslint.config(
  {
    ignores: [
      'dist',
      'reports',
      'node_modules',
      'design-system',
      'docs',
      'data',
      '.claude',
      '.stryker-tmp',
      'test-results',
      'playwright-report',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.strict,
  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: { 'react-hooks': reactHooks },
    rules: reactHooks.configs.recommended.rules,
    languageOptions: { globals: globals.browser },
  },
  {
    files: ['src/sw/**/*.ts'],
    languageOptions: { globals: globals.serviceworker },
  },
  {
    files: ['*.{js,ts,mjs}', 'scripts/**/*.{ts,mjs}', 'tests/**/*.ts'],
    languageOptions: { globals: globals.node },
  },
  prettier,
);
