# Mind Pause

**A deliberate pause between an impulse and acting on it.**

You keep up to three short messages you recorded yourself. When you feel an urge, you start a
*pause* from the tray: one message plays, then a calm countdown holds the screen for a length of
time you chose in advance. Then it ends.

Fully offline. No account, no backend, no cloud, no telemetry — and no network client is linked
into the binary at all, so that claim is something you can verify rather than something you have
to trust.

> **Status: Phase 0 (pipeline scaffold).** The app currently puts an icon in your tray and can
> show a diagnostics window. **There is no pause engine yet.** See
> [docs/TECHNICAL_PLAN.md](docs/TECHNICAL_PLAN.md) for the full roadmap.

---

## What it does not do

**It cannot lock your computer, and it never claims to.**

An ordinary desktop application can cover your screen. It cannot own your machine. Every one of
these ends a pause in seconds, and all of them are supposed to work:

| Bypass | Works on |
|---|---|
| Quit the app, or kill the process | everywhere |
| Ctrl+Alt+Del → Task Manager | Windows |
| Cmd+Opt+Esc → Force Quit, or Activity Monitor | macOS |
| Ctrl+Alt+F3 → a TTY → `pkill mindpause` | Linux |
| Reboot | everywhere |
| Log in as another user | everywhere |
| Safe Mode | everywhere |
| Uninstall | everywhere, in one click |
| Pick up your phone | everywhere |

This list is published because it is the design, not a caveat. Anything strong enough to close
these gaps would need administrator rights, a signed kernel driver, or entitlements that do not
exist for an app like this — and would make Mind Pause malware-shaped, unsignable, and genuinely
dangerous to the person using it.

**What it offers instead is friction**: a few seconds of deliberate, named action between the
impulse and the thing. That is the whole product, and it is enough to be worth building.

## You can always leave

Five ways out, all documented, all tested every release:

1. **Hold the "End this pause" button for 3 seconds.**
2. **"I need my computer now"** — one click, no hold, released immediately. Always present.
3. **Hold Esc for 3 seconds**, from any screen.
4. **`mindpause end`** from a terminal.
5. **A `SAFE_MODE` marker file** in the app's state folder — creatable from a recovery shell,
   another account, Safe Mode, or a live USB. This is the guarantee that you always have a way
   back that does not depend on our code working.

## Privacy, stated honestly

Mind Pause never sends your recordings anywhere — it has no network code.

It **cannot** protect you from: someone using this computer while you are signed in; software
already running as you, including malware; an administrator on this machine; backup or sync tools
that copy your files; or anyone who can compel or seize this device.

Your recordings are encrypted on disk. That protects them from other accounts on this computer,
from a stolen or discarded disk, from search indexes and thumbnails, and from copies picked up by
cloud sync — **not** from someone sitting at your unlocked, signed-in desktop. If you share this
computer, a separate user account plus disk encryption protects you far more than this app can.

Mind Pause is not a medical or clinical tool and makes no treatment claims.

## Platform support

| Tier | Targets | Commitment |
|---|---|---|
| **1** | Windows 10 22H2+/11 · macOS 13+ · Ubuntu LTS & Fedora Workstation (GNOME Wayland) | Tested every release |
| **2** | KDE Plasma 6 Wayland | Tested at release; bugs fixed but do not block |
| **3** | Sway / Hyprland / niri / river / COSMIC · XFCE / MATE / Cinnamon on X11 · Debian, Mint, Pop!_OS, Arch | Community-reported, no proactive testing |
| **4** | **Unsupported:** GNOME-on-X11 sessions · non-systemd distros · remote/VNC/RDP sessions · any "make it unkillable" request | Documented as unsupported |

**On Linux, how much the pause surface can do depends on your desktop.** On GNOME Wayland an
application cannot stay on top of other windows at all — so there, Mind Pause is a reminder rather
than a cover, and it says so on screen instead of pretending otherwise. Run `mindpause
--print-probe` to see exactly what it can do on your machine.

### Releases are not code-signed yet

- **Windows:** SmartScreen will warn, and Smart App Control may block the installer outright on
  some Windows 11 machines. Verify the published SHA-256 and use *More info → Run anyway*.
- **macOS:** Gatekeeper requires *System Settings → Privacy & Security → Open Anyway* on first
  launch.
- **Linux:** unaffected; verify the `SHA256SUMS` signature.

### If the Linux AppImage will not start

The Chromium sandbox is left **enabled**, unlike most Electron AppImages. It is verified working
on the Tier-1 targets. If your distro cannot initialise it, run the AppImage once with
`--no-sandbox` and please open an issue telling us which distro — we would rather fix it than
disable the sandbox for everyone.

## Building

See [docs/BUILD.md](docs/BUILD.md). Short version:

```bash
pnpm install --frozen-lockfile
pnpm gates          # lint, typecheck, architecture rules, zero-egress, identity, tests
pnpm dist:linux     # or dist:win / dist:mac
```

## Documentation

| | |
|---|---|
| [PROJECT_VISION.md](PROJECT_VISION.md) | Why this exists and what it will never become |
| [PRODUCT_REQUIREMENTS.md](PRODUCT_REQUIREMENTS.md) | Requirements, scope tiers, traceability |
| [SYSTEM_ARCHITECTURE.md](SYSTEM_ARCHITECTURE.md) | The architecture of record |
| [docs/TECHNICAL_PLAN.md](docs/TECHNICAL_PLAN.md) | The full plan, with all reasoning and rejected alternatives |
| [AGENTS.md](AGENTS.md) | How to work in this repository |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Start here before your first change |

## Licence

[GPL-3.0-or-later](LICENSE). The privacy claims above are only credible if you can check them, so
the source is open and the "no network code" property is enforced by a CI check
(`pnpm deps:check`) rather than asserted in a README.
