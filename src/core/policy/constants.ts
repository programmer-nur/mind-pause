/**
 * Every threshold in the product, in one place (TECHNICAL_PLAN 12.8).
 *
 * User-adjustable values have a HARD CEILING enforced here, in core/policy — never in the UI.
 * The UI is not the security boundary, and a hand-edited config.json must not be able to
 * produce an eight-hour lockout. Clamp on load, log `config_clamped`, carry on.
 */

export const PREROLL_MS = 5_000;
export const PREROLL_MS_MIN = 0;
export const PREROLL_MS_MAX = 15_000;

export const PROTECTION_DEFAULT_MS = 300_000; // 5 min
export const PROTECTION_MIN_MS = 60_000;
export const PROTECTION_PRESETS_MS = [120_000, 300_000, 600_000, 1_200_000] as const;

/**
 * Owner decision 2026-09-26: 30 minutes, TOTAL including every extension. Not user-raisable.
 * A distressed user must not be able to commit their machine for an hour; two "+5"s still fit
 * above the longest 20-minute preset. The escape path is live throughout regardless.
 */
export const PROTECTION_HARD_MAX_MS = 1_800_000;

export const EXTEND_GRANULARITY_MS = 300_000; // "+5 minutes"
export const COOLDOWN_MS = 45_000;

export const REBOOT_RESUME_WINDOW_MS = 1_200_000; // 20 min since the last liveness checkpoint
export const REBOOT_RESUME_CAP_MS = 600_000; // 10 min max resumed after a reboot
export const LOGIN_SETTLE_MS = 20_000;
export const STABLE_RUN_MS = 90_000;

export const BREAKER_COUNT = 3;
export const BREAKER_WINDOW_MS = 600_000;
export const BREAKER_NEAR_LOGIN_COUNT = 2;
export const BREAKER_NEAR_LOGIN_MS = 60_000;

export const WATCHDOG_PERIOD_MS = 1_000;
export const OVERLAY_HEARTBEAT_TIMEOUT_MS = 5_000;

/** Absolute enforcement ceiling. Even with every clock insane, the machine is free by then. */
export const HARD_STOP_OVERRUN_MS = 120_000;

export const ESCAPE_HOLD_MS = 3_000;
export const ESCAPE_HOLD_MS_MAX = 10_000;

export const CLOCK_JUMP_THRESHOLD_MS = 2_000;
export const ITEM_START_TIMEOUT_MS = 5_000;
export const PLAYBACK_BUDGET_MS = 1_200_000;
export const MAX_RECOVERIES_PER_SESSION = 3;
export const TRAY_DEBOUNCE_MS = 400;

export const REFOCUS_CAP = 3;
export const REFOCUS_INTERVAL_MS = 10_000;

export const RENAME_RETRIES = 10;
export const RENAME_BACKOFF_MS = 20;

export const MAX_MEDIA_ITEMS = 3;

/** Liveness checkpoint cadence: frequent enough to bound cross-boot downtime, lazy enough to matter. */
export function checkpointMs(remainingMs: number): number {
  return Math.min(Math.max(Math.floor(remainingMs / 4), 5_000), 15_000);
}

/** Per-item hard timeout, so a hung decoder can never strand a session. */
export function itemMaxMs(probedMs: number): number {
  return Math.min(Math.floor(1.5 * probedMs) + 10_000, 900_000);
}

/** Staleness cutoff, so the app never pops "your pause is over" three days later. */
export function staleGraceMs(plannedMs: number): number {
  return Math.max(2 * plannedMs, 900_000);
}
