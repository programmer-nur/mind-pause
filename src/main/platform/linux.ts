import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { join } from 'node:path';
import { homedir } from 'node:os';
import type {
  PlatformAdapter,
  PlatformProbe,
  EnforcementLevel,
  TrayRegistration,
} from './types.js';

const exec = promisify(execFile);

function env(name: string): string {
  return process.env[name] ?? '';
}

function isFlatpak(): boolean {
  return env('FLATPAK_ID') !== '';
}

async function dbusNameHasOwner(name: string): Promise<boolean | null> {
  // No D-Bus library dependency: shell out, and return null if the tooling is absent.
  try {
    const { stdout } = await exec('gdbus', [
      'call', '--session',
      '--dest', 'org.freedesktop.DBus',
      '--object-path', '/org/freedesktop/DBus',
      '--method', 'org.freedesktop.DBus.NameHasOwner',
      name,
    ], { timeout: 3000 });
    return stdout.includes('true');
  } catch {
    try {
      const { stdout } = await exec('busctl', ['--user', 'list', '--no-pager'], { timeout: 3000 });
      return stdout.includes(name);
    } catch {
      return null;
    }
  }
}

export class LinuxAdapter implements PlatformAdapter {
  dataDir(): string {
    const xdg = env('XDG_DATA_HOME');
    return join(xdg !== '' ? xdg : join(homedir(), '.local', 'share'), 'mind-pause');
  }
  stateDir(): string {
    const xdg = env('XDG_STATE_HOME');
    return join(xdg !== '' ? xdg : join(homedir(), '.local', 'state'), 'mind-pause');
  }
  logDir(): string {
    return join(this.stateDir(), 'logs');
  }

  async probeEnforcementLevel(): Promise<{ level: EnforcementLevel; reason: string }> {
    const sessionType = env('XDG_SESSION_TYPE').toLowerCase();
    const desktop = env('XDG_CURRENT_DESKTOP').toLowerCase();

    if (isFlatpak()) {
      return {
        level: 'OBSERVING',
        reason:
          'Flatpak attaches wp_security_context_v1, so compositors hide the privileged globals ' +
          '(layer-shell, session-lock) from us. A sandboxed build cannot exceed an ordinary window.',
      };
    }
    if (sessionType === 'x11') {
      return {
        level: 'SHIELDED',
        reason: 'X11 session: one override-redirect window spans the union of all outputs.',
      };
    }
    if (sessionType === 'wayland') {
      if (desktop.includes('gnome')) {
        return {
          level: 'OBSERVING',
          reason:
            'GNOME/Wayland: Mutter does not implement wlr-layer-shell and Wayland forbids ' +
            'client-controlled stacking, so we cannot stay on top. This is a reminder, not a cover.',
        };
      }
      // KWin and wlroots DO implement layer-shell, but reaching it needs the helper binary (V1).
      return {
        level: 'PRESENT',
        reason:
          `Wayland on ${desktop || 'an unknown compositor'}: layer-shell may be available, but the ` +
          'helper binary that uses it is V1. Until then, an ordinary always-on-top window.',
      };
    }
    return {
      level: 'OBSERVING',
      reason: `Unrecognised session type ${sessionType || '(unset)'} — assuming the weakest level.`,
    };
  }

  async trayRegistered(): Promise<{ state: TrayRegistration; reason: string }> {
    const owned = await dbusNameHasOwner('org.kde.StatusNotifierWatcher');
    if (owned === null) {
      return { state: 'unknown', reason: 'Neither gdbus nor busctl is available to ask the session bus.' };
    }
    if (owned) {
      return { state: 'registered', reason: 'org.kde.StatusNotifierWatcher has an owner on the session bus.' };
    }
    return {
      state: 'no-watcher',
      reason:
        'No StatusNotifierWatcher on the session bus. Stock GNOME ships none; Fedora has the ' +
        'AppIndicator extension packaged but not installed. The tray will silently not appear — ' +
        'fall back to the main window, .desktop Actions and the CLI.',
    };
  }

  trayIcon(): { file: string; template: boolean } {
    return { file: 'tray.png', template: false };
  }

  assistiveTechPresent(): boolean {
    // AT-SPI bus presence is the Linux signal. Unknown must mean "yes" (14.2 R4).
    return env('GTK_MODULES').includes('atk-bridge') || env('QT_ACCESSIBILITY') === '1';
  }

  async probe(): Promise<PlatformProbe> {
    const [enf, tray] = await Promise.all([this.probeEnforcementLevel(), this.trayRegistered()]);
    return {
      platform: 'linux',
      sessionDescription: `${env('XDG_CURRENT_DESKTOP') || 'unknown DE'} / ${env('XDG_SESSION_TYPE') || 'unknown session'}`,
      enforcement: enf.level,
      enforcementReason: enf.reason,
      tray: tray.state,
      trayReason: tray.reason,
      sandboxed: isFlatpak(),
    };
  }
}
