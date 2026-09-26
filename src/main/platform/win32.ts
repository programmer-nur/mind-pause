import { join } from 'node:path';
import type {
  PlatformAdapter, PlatformProbe, EnforcementLevel, TrayRegistration,
} from './types.js';

function env(n: string): string { return process.env[n] ?? ''; }

export class Win32Adapter implements PlatformAdapter {
  // LOCALAPPDATA, never Roaming: session state must not follow the user to another machine,
  // and Roaming is copied by roaming profiles / Enterprise State Roaming (11.2).
  dataDir(): string { return join(env('LOCALAPPDATA'), 'MindPause'); }
  stateDir(): string { return join(env('LOCALAPPDATA'), 'MindPause'); }
  logDir(): string { return join(this.stateDir(), 'logs'); }

  async probeEnforcementLevel(): Promise<{ level: EnforcementLevel; reason: string }> {
    // Phase 4 adds the SHQueryUserNotificationState() check that degrades to PRESENT while an
    // exclusive-fullscreen app (QUNS_RUNNING_D3D_FULL_SCREEN) or presentation mode is active.
    return {
      level: 'SHIELDED',
      reason: 'Windows honours HWND_TOPMOST per monitor. Degrades to PRESENT under exclusive fullscreen (Phase 4).',
    };
  }

  async trayRegistered(): Promise<{ state: TrayRegistration; reason: string }> {
    // Shell_NotifyIcon registration effectively always succeeds. The real Windows 11 problem is
    // VISIBILITY, not registration: new icons default into the overflow flyout and there is no
    // reliable way to promote them (15.1). Hence the first-run card, not a detection routine.
    return {
      state: 'registered',
      reason: 'Shell_NotifyIcon registers reliably. Note: Windows 11 hides new icons in the overflow flyout by default.',
    };
  }

  trayIcon(): { file: string; template: boolean } {
    return { file: 'tray.png', template: false };
  }

  assistiveTechPresent(): boolean {
    // Phase 4: SystemParametersInfo(SPI_GETSCREENREADER) + UIA client presence.
    // Until then, assume present — the safe direction (14.2 R4).
    return true;
  }

  async probe(): Promise<PlatformProbe> {
    const [enf, tray] = await Promise.all([this.probeEnforcementLevel(), this.trayRegistered()]);
    return {
      platform: 'win32',
      sessionDescription: `Windows ${process.getSystemVersion?.() ?? ''}`.trim(),
      enforcement: enf.level, enforcementReason: enf.reason,
      tray: tray.state, trayReason: tray.reason,
      sandboxed: false,
    };
  }
}
