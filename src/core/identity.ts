/**
 * Frozen identity strings (TECHNICAL_PLAN 23.5, SYSTEM_ARCHITECTURE 12).
 *
 * These are IMMUTABLE once shipped. Changing APP_ID orphans every user's macOS login-item
 * registration and every Flatpak install; changing the publisher identity resets SmartScreen
 * reputation. The single source of truth is this file; `scripts/check-identity.mjs` asserts
 * electron-builder.yml agrees with it, and fails the build while the placeholder is present.
 */

/** Placeholder sentinel. `scripts/check-identity.mjs` fails while this appears in APP_ID. */
export const GITHUB_USERNAME_PLACEHOLDER = 'PLACEHOLDER-GITHUB-USERNAME';

/**
 * Reverse-DNS app id. Flathub's convention for a GitHub-hosted project with no domain.
 * TODO(phase-0, BLOCKING): replace the placeholder with the real GitHub username.
 */
export const APP_ID = `io.github.${GITHUB_USERNAME_PLACEHOLDER}.MindPause`;

/** User-facing product name. The V1 "display name" setting changes UI strings only, never these. */
export const PRODUCT_NAME = 'Mind Pause';

/** Binary / process name, as it appears in Task Manager and Activity Monitor. */
export const BINARY_NAME = 'mindpause';

/** Windows Application User Model ID. */
export const AUMID = 'MindPause.Desktop';

/** Name of the autostart entry, as the user sees it in the OS's own UI. */
export const AUTOSTART_ENTRY_NAME = 'MindPause';

/** Tray tooltip. Contentless by design (18.7) — it is visible to anyone using the machine. */
export const TRAY_TOOLTIP = 'Mind Pause';

/** Custom scheme used to stream decrypted media to the renderer (13.4). */
export const MEDIA_SCHEME = 'mindpause';
