/**
 * core/ is PURE: no electron, no node builtins, no IO, no clock reads, no randomness.
 * Enforced by the architectural lint rules in eslint.config.mjs, and proved to fire by
 * `pnpm lint:prove`. Everything here is a millisecond-fast unit test away from verification.
 */
export * from './identity.js';
export * from './policy/constants.js';
export * from './clock/types.js';
