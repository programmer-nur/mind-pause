// @ts-check
/**
 * The architectural lint rules (TECHNICAL_PLAN 21.2, AGENTS.md 3).
 *
 * These are NOT style rules. Each one mechanically prevents a specific failure the plan warns
 * about, and `pnpm lint:prove` asserts that every one of them actually fires — a rule nobody
 * has seen fail is a rule nobody knows is wired up.
 *
 * NOTE ON FLAT-CONFIG SEMANTICS: for a given file, the LAST matching config wins outright for
 * a given rule — options are replaced, not merged. So `no-restricted-syntax` is composed per
 * file-category below rather than accumulated across blocks. Get this wrong and rules silently
 * disappear, which is exactly the failure mode these rules exist to prevent.
 */
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import svelte from 'eslint-plugin-svelte';

/* ---------------------------------------------------------------- selector groups */

/** RULE 3 — no HTML injection, anywhere. XSS here escalates to the full IPC surface. */
const NO_HTML_INJECTION = [
  {
    selector: "MemberExpression[property.name='innerHTML']",
    message: 'RULE 3: no innerHTML. Render user strings as text nodes — an XSS here reaches every IPC verb (18.8).',
  },
  {
    selector: "MemberExpression[property.name='outerHTML']",
    message: 'RULE 3: no outerHTML. Render user strings as text nodes (18.8).',
  },
  {
    selector: "CallExpression[callee.property.name='insertAdjacentHTML']",
    message: 'RULE 3: no insertAdjacentHTML. Render user strings as text nodes (18.8).',
  },
  {
    selector: "CallExpression[callee.name='eval']",
    message: 'RULE 3: no eval.',
  },
];

/** RULE 2 — core/ may not read an ambient clock or randomness. Clocks are injected (12.6). */
const NO_AMBIENT_NONDETERMINISM = [
  {
    selector: "MemberExpression[object.name='Date'][property.name='now']",
    message: 'RULE 2: core/ is pure. Take a Clock and call clock.nowWall() — Date.now() breaks determinism and replay (12.6).',
  },
  {
    selector: 'NewExpression[callee.name=\'Date\']',
    message: 'RULE 2: core/ is pure. Take a Clock — new Date() breaks determinism and replay (12.6).',
  },
  {
    selector: "MemberExpression[object.name='performance'][property.name='now']",
    message: 'RULE 2: performance.now() is CLOCK_MONOTONIC-family and STOPS during suspend. Use Clock.nowElapsed() (12.6).',
  },
  {
    selector: "MemberExpression[object.name='Math'][property.name='random']",
    message: 'RULE 2: core/ is pure and must be reproducible. Inject randomness from the caller.',
  },
];

/** RULE 4 — `process.platform` lives in exactly one file. */
const NO_PLATFORM_BRANCH = [
  {
    selector: "MemberExpression[object.name='process'][property.name='platform']",
    message:
      'RULE 4: process.platform belongs only in src/main/platform/index.ts. Add a method to ' +
      'PlatformAdapter with a documented degraded return instead (10.5).',
  },
];

/** Network reach, banned at source level to back the "no telemetry" claim (NFR-30). */
const NO_NETWORK_GLOBALS = [
  { name: 'fetch', message: 'NFR-30: this app links no network client. Nothing in src/ may make a request.' },
  { name: 'XMLHttpRequest', message: 'NFR-30: this app links no network client.' },
  { name: 'WebSocket', message: 'NFR-30: this app links no network client.' },
  { name: 'EventSource', message: 'NFR-30: this app links no network client.' },
];

const NETWORK_MODULES = [
  'http', 'https', 'net', 'tls', 'dgram', 'dns', 'http2',
  'node:http', 'node:https', 'node:net', 'node:tls', 'node:dgram', 'node:dns', 'node:http2',
];

/* ---------------------------------------------------------------- config */

export default tseslint.config(
  {
    ignores: [
      'dist/**',
      'release/**',
      'node_modules/**',
    ],
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,

  /* ---- baseline for every source file: no HTML injection, no network, no platform branch ---- */
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: { console: 'readonly', process: 'readonly', globalThis: 'readonly' },
    },
    rules: {
      'no-restricted-syntax': ['error', ...NO_HTML_INJECTION, ...NO_PLATFORM_BRANCH],
      'no-restricted-globals': ['error', ...NO_NETWORK_GLOBALS],
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: NETWORK_MODULES,
              message: 'NFR-30: this app links no network client. See TECHNICAL_PLAN 18.10.',
            },
          ],
        },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },

  /* ---- RULE 1 + RULE 2: core/ is pure. This block must come AFTER the baseline. ---- */
  {
    files: ['src/core/**/*.ts'],
    rules: {
      // Full selector list, because flat config replaces rather than merges.
      'no-restricted-syntax': [
        'error',
        ...NO_HTML_INJECTION,
        ...NO_PLATFORM_BRANCH,
        ...NO_AMBIENT_NONDETERMINISM,
      ],
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['electron', 'electron/**'],
              message: 'RULE 1: core/ is pure. It must be testable with no app, no display and no filesystem.',
            },
            {
              group: ['node:*'],
              message: 'RULE 1: core/ is pure — no node builtins. Pass what you need in as an argument.',
            },
            {
              group: [
                'fs', 'fs/*', 'path', 'os', 'child_process', 'crypto', 'worker_threads',
                'stream', 'zlib', 'util', 'process', ...NETWORK_MODULES,
              ],
              message: 'RULE 1: core/ is pure — no node builtins. Pass what you need in as an argument.',
            },
            {
              group: ['**/main/**', '**/preload/**', '**/renderer/**'],
              message: 'RULE 1: core/ may not import from any outer layer. Dependencies point inward only.',
            },
          ],
        },
      ],
    },
  },

  /* ---- RULE 4 exemption: the single permitted platform switch ---- */
  {
    files: ['src/main/platform/index.ts'],
    rules: {
      // NO_PLATFORM_BRANCH deliberately omitted. This file is the one door.
      'no-restricted-syntax': ['error', ...NO_HTML_INJECTION],
    },
  },

  /* ---- Svelte ---- */
  ...svelte.configs.recommended,
  {
    files: ['**/*.svelte'],
    languageOptions: {
      // The parser itself comes from eslint-plugin-svelte's own config above (it bundles
      // svelte-eslint-parser). We only add the TypeScript sub-parser for <script lang="ts">,
      // which leaves `parser` untouched — flat config merges languageOptions per key.
      parserOptions: { parser: tseslint.parser, extraFileExtensions: ['.svelte'] },
      globals: { console: 'readonly', globalThis: 'readonly', document: 'readonly', window: 'readonly' },
    },
    rules: {
      // RULE 3's Svelte-specific half: {@html ...} is the framework's innerHTML.
      'svelte/no-at-html-tags': 'error',
      'no-restricted-syntax': ['error', ...NO_HTML_INJECTION, ...NO_PLATFORM_BRANCH],
      'no-restricted-globals': ['error', ...NO_NETWORK_GLOBALS],
      '@typescript-eslint/no-explicit-any': 'off', // the Phase 0 bridge type is deliberately loose
    },
  },

  /* ---- build scripts and tests: ordinary code, no architectural constraints ---- */
  {
    files: ['scripts/**/*.mjs', 'test/**/*.ts', '*.mts', '*.mjs', '*.js'],
    languageOptions: {
      globals: { console: 'readonly', process: 'readonly', __dirname: 'readonly', URL: 'readonly' },
    },
    rules: {
      'no-restricted-syntax': 'off',
      'no-restricted-imports': 'off',
      'no-restricted-globals': 'off',
    },
  },
);
