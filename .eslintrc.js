/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    ecmaFeatures: { jsx: true },
  },
  settings: {
    react: { version: 'detect' },
  },
  plugins: ['@typescript-eslint', 'react', 'react-hooks'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
  ],
  rules: {
    // ── TypeScript ─────────────────────────────────────────────────────────
    '@typescript-eslint/no-explicit-any': 'warn',          // Signaler les `any` restants
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/ban-ts-comment': 'warn',

    // ── React ──────────────────────────────────────────────────────────────
    'react/react-in-jsx-scope': 'off',                     // React 17+ automatic JSX runtime
    'react/prop-types': 'off',                             // On utilise TypeScript à la place
    'react/display-name': 'off',
    'react-hooks/rules-of-hooks': 'error',                 // Hooks uniquement dans les composants
    'react-hooks/exhaustive-deps': 'warn',                 // Dépendances useEffect

    // ── Qualité ────────────────────────────────────────────────────────────
    'no-console': ['warn', { allow: ['warn', 'error'] }],  // console.log interdit en prod
    'no-debugger': 'error',
    'prefer-const': 'error',
    'no-var': 'error',
    'eqeqeq': ['error', 'always'],

    // ── Désactivés car gérés par Prettier ──────────────────────────────────
    'semi': 'off',
    'quotes': 'off',
    'indent': 'off',
    'comma-dangle': 'off',
  },
  env: {
    browser: true,
    node: true,
    es6: true,
  },
  ignorePatterns: [
    'node_modules/',
    '.expo/',
    'dist/',
    'build/',
    '*.config.js',
    'babel.config.js',
    'scripts/',
  ],
};
