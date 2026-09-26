/**
 * Frozen identity strings (TECHNICAL_PLAN 23.5, SYSTEM_ARCHITECTURE 12).
 *
 * FROZEN 2026-09-26. These are IMMUTABLE. Changing APP_ID orphans every macOS login-item
 * registration and every Flatpak install; changing the publisher identity resets SmartScreen
 * reputation. `scripts/check-identity.mjs` asserts electron-builder.yml agrees with this file
 * and that the Flathub naming rule below still holds.
 */

/** The GitHub URL component: github.com/<GITHUB_USERNAME>/mind-pause */
export const GITHUB_USERNAME = 'programmer-nur';

/**
 * Reverse-DNS app id — the macOS bundle id, the Flatpak app id, and the .desktop file name.
 *
 * NOTE THE UNDERSCORE. Flathub's rule: "Each component must contain only the characters
 * [A-Z][a-z][0-9]_. A dash - is only allowed in the last component" and "the domain portion
 * must be in lowercase and must convert dash - to underscore _". So the hyphen in the GitHub
 * username becomes an underscore here. `io.github.programmer-nur.MindPause` would be rejected
 * at Flathub review — and this value cannot be changed afterwards.
 * https://docs.flathub.org/docs/for-app-authors/requirements
 */
export const APP_ID = 'io.github.programmer_nur.MindPause';

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
