// eslint.config.js — ESLint 9 flat config
const js = require('@eslint/js');
const tseslint = require('@typescript-eslint/eslint-plugin');
const tsParser = require('@typescript-eslint/parser');
const reactPlugin = require('eslint-plugin-react');
const reactHooksPlugin = require('eslint-plugin-react-hooks');

// Globals communs React Native / browser / Node
const browserGlobals = {
  fetch: 'readonly',
  setTimeout: 'readonly',
  clearTimeout: 'readonly',
  setInterval: 'readonly',
  clearInterval: 'readonly',
  requestAnimationFrame: 'readonly',
  cancelAnimationFrame: 'readonly',
  console: 'readonly',
  URL: 'readonly',
  URLSearchParams: 'readonly',
  FormData: 'readonly',
  Blob: 'readonly',
  Response: 'readonly',
  Request: 'readonly',
  Headers: 'readonly',
  AbortController: 'readonly',
  AbortSignal: 'readonly',
  Event: 'readonly',
  EventTarget: 'readonly',
  localStorage: 'readonly',
  sessionStorage: 'readonly',
  window: 'readonly',
  document: 'readonly',
  navigator: 'readonly',
  alert: 'readonly',
  confirm: 'readonly',
  prompt: 'readonly',
  performance: 'readonly',
  TextEncoder: 'readonly',
  TextDecoder: 'readonly',
  atob: 'readonly',
  btoa: 'readonly',
  crypto: 'readonly',
  queueMicrotask: 'readonly',
  structuredClone: 'readonly',
};

const nodeGlobals = {
  require: 'readonly',
  module: 'writable',
  exports: 'writable',
  __dirname: 'readonly',
  __filename: 'readonly',
  process: 'readonly',
  Buffer: 'readonly',
  global: 'readonly',
};

const reactNativeGlobals = {
  __DEV__: 'readonly',
};

/** @type {import('eslint').Linter.FlatConfig[]} */
module.exports = [
  // ── Fichiers ignorés ───────────────────────────────────────────────────────
  {
    ignores: [
      'node_modules/**',
      '.expo/**',
      'dist/**',
      'build/**',
      'scripts/**',
      '*.config.js',
      '*.config.ts',
      'babel.config.js',
      'metro.config.js',
      '.eslintrc.js',
      'start-web.js',
      'supabase/**',   // Edge Functions Deno — syntaxe différente
    ],
  },
  // ── JavaScript de base ─────────────────────────────────────────────────────
  js.configs.recommended,
  // ── TypeScript + React (fichiers app) ─────────────────────────────────────
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
      },
      globals: {
        ...browserGlobals,
        ...nodeGlobals,
        ...reactNativeGlobals,
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
    },
    settings: {
      react: { version: 'detect' },
    },
    rules: {
      // ── TypeScript ──────────────────────────────────────────────────────
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/ban-ts-comment': 'warn',

      // ── React ───────────────────────────────────────────────────────────
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'react/display-name': 'off',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // ── Qualité ─────────────────────────────────────────────────────────
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-debugger': 'error',
      'prefer-const': 'error',
      'no-var': 'error',
      eqeqeq: ['error', 'always'],
      'no-empty': ['error', { allowEmptyCatch: true }],

      // Override pour les variables non utilisées (TypeScript gère ça)
      'no-unused-vars': 'off',
      // no-undef géré par TypeScript
      'no-undef': 'off',
    },
  },
];
