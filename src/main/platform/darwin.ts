import { join } from 'node:path';
import { homedir } from 'node:os';
import type {
  PlatformAdapter, PlatformProbe, EnforcementLevel, TrayRegistration,
} from './types.js';

export class DarwinAdapter implements PlatformAdapter {
  dataDir(): string { return join(homedir(), 'Library', 'Application Support', 'MindPause'); }
  stateDir(): string { return this.dataDir(); }
  logDir(): string { return join(homedir(), 'Library', 'Logs', 'MindPause'); }

  /** App Translocation breaks autostart, path-keyed grants and any in-bundle file (16.7). */
  isTranslocated(): boolean {
    return process.execPath.includes('/AppTranslocation/');
  }
  inApplications(): boolean {
    return process.execPath.startsWith('/Applications/');
  }

  async probeEnforcementLevel(): Promise<{ level: EnforcementLevel; reason: string }> {
    // Phase 4 adds the real check: activate, then read NSApp.isActive after a bounded retry.
    // Cooperative activation on macOS 14+ CAN be refused, and if it is, presentation options are
    // never honoured and the user gets a live Dock while the UI claims a pause is running (16.3).
    return {
      level: 'SHIELDED',
      reason: 'Assumed until Phase 4 verifies NSApp.isActive after activation; refusal degrades to PRESENT.',
    };
  }

  async trayRegistered(): Promise<{ state: TrayRegistration; reason: string }> {
    // NSStatusItem always "registers". On a notched MacBook with a full menu bar the item is
    // parked off-screen and isVisible still returns true — a visibility problem Phase 5 detects
    // by reading the button window's frame origin (16.1).
    return {
      state: 'registered',
      reason: 'NSStatusItem registers. Note: on notched displays a full menu bar can hide it silently.',
    };
  }

  trayIcon(): { file: string; template: boolean } {
    // Template image so AppKit tints it; essential on macOS 26's transparent menu bar (16.1).
    return { file: 'trayTemplate.png', template: true };
  }

  assistiveTechPresent(): boolean {
    return true; // Phase 4: VoiceOver-running check. Unknown means yes (14.2 R4).
  }

  async probe(): Promise<PlatformProbe> {
    const [enf, tray] = await Promise.all([this.probeEnforcementLevel(), this.trayRegistered()]);
    const notes: string[] = [];
    if (this.isTranslocated()) notes.push('APP TRANSLOCATED — autostart and in-bundle files are unreliable.');
    else if (!this.inApplications()) notes.push('Not in /Applications — move it before enabling autostart.');
    return {
      platform: 'darwin',
      sessionDescription: `macOS ${process.getSystemVersion?.() ?? ''} ${notes.join(' ')}`.trim(),
      enforcement: enf.level, enforcementReason: enf.reason,
      tray: tray.state, trayReason: tray.reason,
      sandboxed: false,
    };
  }
}
