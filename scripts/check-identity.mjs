#!/usr/bin/env node
/**
 * Identity strings are immutable once shipped (23.5). This asserts:
 *   1. electron-builder.yml's appId matches src/core/identity.ts byte for byte;
 *   2. the Flathub naming rule still holds — the domain portion of the app id must be the
 *      GitHub username with every dash converted to an underscore. Getting this wrong means
 *      rejection at Flathub review, on a value that cannot be changed afterwards.
 *      https://docs.flathub.org/docs/for-app-authors/requirements
 *   3. no placeholder sentinel survives anywhere in the identity file.
 */
import { readFileSync } from 'node:fs';

const idTs = readFileSync('src/core/identity.ts', 'utf8');
const builder = readFileSync('electron-builder.yml', 'utf8');

const pick = (re, what) => {
  const m = idTs.match(re);
  if (!m?.[1]) {
    console.error(`check-identity: could not parse ${what} from src/core/identity.ts`);
    process.exit(1);
  }
  return m[1];
};

const appId = pick(/APP_ID\s*=\s*'([^']+)'/, 'APP_ID');
const githubUser = pick(/GITHUB_USERNAME\s*=\s*'([^']+)'/, 'GITHUB_USERNAME');
const builderAppId = builder.match(/^appId:\s*(\S+)/m)?.[1];

let failures = 0;
const check = (ok, msg) => {
  console.log(`  ${ok ? 'ok   ' : 'FAIL '} ${msg}`);
  if (!ok) failures++;
};

check(builderAppId === appId, `electron-builder.yml appId matches identity.ts  (${appId})`);

const parts = appId.split('.');
check(parts.length === 4 && parts[0] === 'io' && parts[1] === 'github', 'app id has the io.github.<user>.<App> shape');
check(parts[2] === githubUser.replaceAll('-', '_'), `domain portion "${parts[2]}" is "${githubUser}" with dashes converted to underscores (Flathub rule)`);
check(!/-/.test(parts.slice(0, 3).join('.')), 'no dash appears outside the last component (Flathub rule)');
check(parts.slice(0, 3).join('.') === parts.slice(0, 3).join('.').toLowerCase(), 'domain portion is lowercase (Flathub rule)');
check(!/PLACEHOLDER/i.test(idTs), 'no placeholder sentinel survives in identity.ts');

console.log('');
if (failures > 0) {
  console.error('check-identity: FAILED. These strings are immutable once shipped — fix before releasing.');
  process.exit(1);
}
console.log('check-identity: passed. Identity strings are frozen and internally consistent.');
