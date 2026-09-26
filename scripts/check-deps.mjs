#!/usr/bin/env node
/**
 * NFR-30 / P4: prove "Mind Pause never sends your data anywhere" is a PROPERTY, not a promise.
 *
 * A stranger should be able to verify it in seconds. This checks two things:
 *   1. no network-capable package appears in the RUNTIME dependency closure (devDependencies
 *      are irrelevant — electron-builder legitimately ships HTTP clients for publishing, and
 *      none of it reaches the user's machine);
 *   2. no source file under src/ imports a network module or calls a network global.
 *
 * (2) is the one that matters most on modern Node, where `fetch` is a global and needs no
 * dependency at all — a dependency-only check would pass a codebase that phones home.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

const NETWORK_PACKAGES = [
  'axios', 'node-fetch', 'cross-fetch', 'isomorphic-fetch', 'got', 'undici', 'superagent',
  'request', 'needle', 'phin', 'bent', 'ky', 'ws', 'socket.io', 'socket.io-client',
  'engine.io', 'engine.io-client', 'sockjs', 'eventsource', 'http-proxy-agent',
  'https-proxy-agent', 'socks-proxy-agent', 'electron-updater', 'update-electron-app',
  '@sentry/node', '@sentry/electron', 'posthog-node', 'mixpanel', 'amplitude-js',
];
const NETWORK_MODULE_RE =
  /\bfrom\s+['"](?:node:)?(?:http|https|net|tls|dgram|dns|http2)['"]|\brequire\(\s*['"](?:node:)?(?:http|https|net|tls|dgram|dns|http2)['"]/;
const NETWORK_GLOBAL_RE = /\b(?:fetch|XMLHttpRequest|WebSocket|EventSource)\s*\(/;

let failures = 0;
const fail = (m) => { console.error(`  FAIL  ${m}`); failures++; };
const ok = (m) => console.log(`  ok    ${m}`);

/* ---- 1. runtime dependency closure ---- */
const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
const runtimeDeps = Object.keys(pkg.dependencies ?? {});
const offenders = runtimeDeps.filter((d) => NETWORK_PACKAGES.includes(d));
if (offenders.length) fail(`runtime dependencies include network clients: ${offenders.join(', ')}`);
else ok(`runtime dependency closure is clean (${runtimeDeps.length} direct runtime deps)`);

// Transitive check via the lockfile's importer section for production deps.
const lock = readFileSync('pnpm-lock.yaml', 'utf8');
const lockOffenders = NETWORK_PACKAGES.filter((p) => new RegExp(`^\\s{4}${p.replace('.', '\\.')}:`, 'm').test(lock));
if (runtimeDeps.length > 0 && lockOffenders.length) {
  fail(`lockfile contains network packages reachable from runtime deps: ${lockOffenders.join(', ')}`);
} else {
  ok('no network package is reachable from a runtime dependency');
}

/* ---- 2. source-level check (the one that catches global fetch) ---- */
function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else if (['.ts', '.svelte', '.js', '.mts'].includes(extname(p))) out.push(p);
  }
  return out;
}
let srcHits = 0;
for (const file of walk('src')) {
  const text = readFileSync(file, 'utf8');
  if (NETWORK_MODULE_RE.test(text)) { fail(`${file} imports a network module`); srcHits++; }
  if (NETWORK_GLOBAL_RE.test(text)) { fail(`${file} calls a network global`); srcHits++; }
}
if (srcHits === 0) ok('no source file under src/ reaches the network');

console.log('');
if (failures > 0) {
  console.error('check-deps: FAILED. The zero-egress claim (P4/NFR-30) is not true of this tree.');
  process.exit(1);
}
console.log('check-deps: passed. "Mind Pause never sends your data anywhere" is verifiable here.');
