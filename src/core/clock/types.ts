/**
 * The three clock primitives (TECHNICAL_PLAN 12.6).
 *
 * Exposed by MEANING, never by platform API name, because the platform defaults invert:
 * on Linux CLOCK_MONOTONIC EXCLUDES suspend, on Darwin it INCLUDES it. That inversion is
 * exactly the bug a shared core ships if it trusts a framework's idea of "monotonic".
 */
export interface Clock {
  /** Wall clock, ms since epoch. Steppable by NTP or the user. Bridges reboots ONLY. */
  nowWall(): number;

  /**
   * Monotonic, INCLUDING time the machine spent suspended. Nanoseconds.
   * THE COUNTDOWN USES THIS.
   * Linux CLOCK_BOOTTIME · macOS mach_continuous_time() · Windows QueryInterruptTimePrecise()
   */
  nowElapsed(): bigint;

  /**
   * Monotonic, EXCLUDING suspend. Nanoseconds. Diagnostics only (sleptMs = dElapsed - dActive).
   * Linux CLOCK_MONOTONIC · macOS mach_absolute_time() · Windows QueryUnbiasedInterruptTimePrecise()
   */
  nowActive(): bigint;
}

/** Deterministic clock for tests. Pure, so it belongs in core. */
export class FakeClock implements Clock {
  private wallMs: number;
  private elapsedNs: bigint;
  private activeNs: bigint;

  constructor(wallMs = 1_758_900_000_000, elapsedNs = 0n, activeNs = 0n) {
    this.wallMs = wallMs;
    this.elapsedNs = elapsedNs;
    this.activeNs = activeNs;
  }

  nowWall(): number {
    return this.wallMs;
  }
  nowElapsed(): bigint {
    return this.elapsedNs;
  }
  nowActive(): bigint {
    return this.activeNs;
  }

  /** Ordinary passage of time: all three advance together. */
  advance(ms: number): void {
    this.wallMs += ms;
    this.elapsedNs += BigInt(ms) * 1_000_000n;
    this.activeNs += BigInt(ms) * 1_000_000n;
  }

  /** The machine was suspended: wall and elapsed advance, active does not. */
  suspend(ms: number): void {
    this.wallMs += ms;
    this.elapsedNs += BigInt(ms) * 1_000_000n;
  }

  /** Someone moved the system clock. Monotonic clocks are unaffected — that is the point. */
  stepWallClock(deltaMs: number): void {
    this.wallMs += deltaMs;
  }
}
