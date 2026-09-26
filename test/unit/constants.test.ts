import { describe, it, expect } from 'vitest';
import {
  PROTECTION_DEFAULT_MS,
  PROTECTION_MIN_MS,
  PROTECTION_HARD_MAX_MS,
  PROTECTION_PRESETS_MS,
  EXTEND_GRANULARITY_MS,
  HARD_STOP_OVERRUN_MS,
  checkpointMs,
  staleGraceMs,
  itemMaxMs,
} from '../../src/core/policy/constants.js';
import { FakeClock } from '../../src/core/clock/types.js';

/**
 * Phase 0 smoke tests. Their job is to prove the test harness runs against the pure core with
 * no app, no display and no real clock — the property Phase 1's real suite depends on.
 */
describe('duration model', () => {
  it('holds the owner-decided ceiling of 30 minutes', () => {
    expect(PROTECTION_HARD_MAX_MS).toBe(30 * 60 * 1000);
  });

  it('orders min <= default <= every preset <= hard max', () => {
    expect(PROTECTION_MIN_MS).toBeLessThanOrEqual(PROTECTION_DEFAULT_MS);
    for (const preset of PROTECTION_PRESETS_MS) {
      expect(preset).toBeGreaterThanOrEqual(PROTECTION_MIN_MS);
      expect(preset).toBeLessThanOrEqual(PROTECTION_HARD_MAX_MS);
    }
  });

  it('leaves room for at least two extensions above the longest preset', () => {
    const longest = Math.max(...PROTECTION_PRESETS_MS);
    expect(longest + 2 * EXTEND_GRANULARITY_MS).toBeLessThanOrEqual(PROTECTION_HARD_MAX_MS);
  });

  it('bounds the absolute enforcement ceiling well inside two minutes of overrun', () => {
    expect(HARD_STOP_OVERRUN_MS).toBe(120_000);
  });
});

describe('derived timings', () => {
  it('clamps the liveness checkpoint between 5s and 15s', () => {
    expect(checkpointMs(1_000)).toBe(5_000);
    expect(checkpointMs(40_000)).toBe(10_000);
    expect(checkpointMs(10_000_000)).toBe(15_000);
  });

  it('never lets the stale grace fall below fifteen minutes', () => {
    expect(staleGraceMs(60_000)).toBe(900_000);
    expect(staleGraceMs(900_000)).toBe(1_800_000);
  });

  it('caps a single item even when the probe reports something absurd', () => {
    expect(itemMaxMs(60_000)).toBe(100_000);
    expect(itemMaxMs(10_000_000)).toBe(900_000);
  });
});

describe('FakeClock models the suspend inversion that breaks naive designs', () => {
  it('advances all three clocks during ordinary time', () => {
    const c = new FakeClock();
    const w0 = c.nowWall();
    const e0 = c.nowElapsed();
    const a0 = c.nowActive();
    c.advance(5_000);
    expect(c.nowWall() - w0).toBe(5_000);
    expect(c.nowElapsed() - e0).toBe(5_000_000_000n);
    expect(c.nowActive() - a0).toBe(5_000_000_000n);
  });

  it('advances elapsed but NOT active across a suspend — the countdown must keep running', () => {
    const c = new FakeClock();
    const e0 = c.nowElapsed();
    const a0 = c.nowActive();
    c.suspend(3 * 60 * 60 * 1000); // lid closed for three hours
    expect(c.nowElapsed() - e0).toBe(10_800_000_000_000n);
    expect(c.nowActive() - a0).toBe(0n);
  });

  it('leaves monotonic clocks untouched when the wall clock is stepped', () => {
    const c = new FakeClock();
    const e0 = c.nowElapsed();
    c.stepWallClock(60 * 60 * 1000); // user moves the clock forward an hour
    expect(c.nowElapsed()).toBe(e0); // the bypass does not work inside a boot
  });
});
