/**
 * THE ONLY `process.platform` SWITCH IN THE CODEBASE.
 *
 * A custom lint rule (eslint.config.mjs) fails the build on `process.platform` anywhere else.
 * If you need platform-specific behaviour, add a method to PlatformAdapter with a documented
 * degraded return — do not branch here and do not branch at the call site.
 */
import type { PlatformAdapter } from './types.js';
import { LinuxAdapter } from './linux.js';
import { Win32Adapter } from './win32.js';
import { DarwinAdapter } from './darwin.js';

export * from './types.js';

let cached: PlatformAdapter | undefined;

export function platformAdapter(): PlatformAdapter {
  if (cached) return cached;
  switch (process.platform) {
    case 'win32':
      cached = new Win32Adapter();
      break;
    case 'darwin':
      cached = new DarwinAdapter();
      break;
    default:
      // Everything else is treated as Linux/freedesktop. The adapter degrades honestly rather
      // than throwing: an unrecognised session lands on OBSERVING, which is a valid outcome.
      cached = new LinuxAdapter();
      break;
  }
  return cached;
}
