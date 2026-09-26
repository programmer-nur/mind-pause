#!/usr/bin/env node
/**
 * Identity strings are immutable once shipped (23.5). This asserts the single source of truth
 * in src/core/identity.ts agrees with electron-builder.yml, and FAILS while the GitHub-username
 * placeholder is still present — so the placeholder cannot reach a release by being forgotten.
 */
import { readFileSync } from 'node:fs';

const idTs = readFileSync('src/core/identity.ts', 'utf8');
const builder = readFileSync('electron-builder.yml', 'utf8');

const placeholder = idTs.match(/GITHUB_USERNAME_PLACEHOLDER\s*=\s*'([^']+)'/)?.[1];
const appIdTemplate = idTs.match(/APP_ID\s*=\s*`([^`]+)`/)?.[1];
if (!placeholder || !appIdTemplate) {
  console.error('check-identity: could not parse src/core/identity.ts');
  process.exit(1);
}
const appId = appIdTemplate.replace('${GITHUB_USERNAME_PLACEHOLDER}', placeholder);
const builderAppId = builder.match(/^appId:\s*(\S+)/m)?.[1];

let failures = 0;
const say = (ok, msg) => { console.log(`  ${ok ? 'ok   ' : 'FAIL '} ${msg}`); if (!ok) failures++; };

say(builderAppId === appId, `electron-builder.yml appId matches identity.ts  (${builderAppId})`);

if (appId.includes(placeholder)) {
  console.log(`  BLOCK  APP_ID still contains the placeholder "${placeholder}".`);
  console.log('         Phase 0 cannot close until the real GitHub username is set in');
  console.log('         src/core/identity.ts AND electron-builder.yml. The app id is immutable');
  console.log('         once shipped: changing it later orphans every macOS login-item');
  console.log('         registration and every Flatpak install.');
  failures++;
}

process.exit(failures > 0 ? 1 : 0);
