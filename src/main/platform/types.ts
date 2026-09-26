/**
 * The platform adapter (TECHNICAL_PLAN 10.5, SYSTEM_ARCHITECTURE 8).
 *
 * ONE interface, THREE implementations. `platform/index.ts` holds the only `process.platform`
 * switch in the codebase; a lint rule fails the build on any other use.
 *
 * Every method has a DOCUMENTED DEGRADED RETURN. "Unsupported here" is an ordinary typed
 * outcome, never an exception — `OBSERVING` on GNOME Wayland is a normal result that changes
 * the UI copy, not an error that fails the session.
 *
 * Phase 0 implements only the probes needed to verify the pipeline. The remaining methods
 * land in Phases 4-5; their signatures are listed in TECHNICAL_PLAN 10.5.
 */

/** What the protection surface ACTUALLY achieved. Persisted, and it binds the UI copy (14.3). */
export type EnforcementLevel =
  /** Above-normal window on every display we could target; platform honours always-on-top. */
  | 'SHIELDED'
  /** Always-on-top exists but coverage is partial, or activation was refused. */
  | 'PRESENT'
  /** The countdown runs; nothing is reliably on top. A normal outcome, not a failure. */
  | 'OBSERVING';

export type TrayRegistration = 'registered' | 'no-watcher' | 'unknown';

export interface PlatformProbe {
  readonly platform: 'win32' | 'darwin' | 'linux';
  /** e.g. "GNOME/wayland", "Windows 11", "macOS 26" — for diagnostics only, never logged with PII. */
  readonly sessionDescription: string;
  readonly enforcement: EnforcementLevel;
  /** Why we landed on that level, in one human-readable clause. Shown in diagnostics. */
  readonly enforcementReason: string;
  readonly tray: TrayRegistration;
  readonly trayReason: string;
  /** True inside a Flatpak sandbox: privileged Wayland globals are hidden from us (17.7). */
  readonly sandboxed: boolean;
}

export interface PlatformAdapter {
  /** Non-synced local app data. Never Documents/Roaming/iCloud-synced trees (11.2). */
  dataDir(): string;
  stateDir(): string;
  logDir(): string;
  /** Detect the level actually achievable right now. Called at session start, persisted. */
  probeEnforcementLevel(): Promise<{ level: EnforcementLevel; reason: string }>;
  /** Whether a tray host exists. On Linux this is a real question (17.2). */
  trayRegistered(): Promise<{ state: TrayRegistration; reason: string }>;
  /** Assistive technology present? Unknown MUST return true — refocus drops to zero (14.2 R4). */
  assistiveTechPresent(): boolean;
  /**
   * Which tray icon to load, and whether it is a macOS template image.
   * Lives here because "which icon file" is platform behaviour, and `process.platform` is
   * confined to platform/index.ts by lint rule 4.
   */
  trayIcon(): { file: string; template: boolean };
  probe(): Promise<PlatformProbe>;
}
