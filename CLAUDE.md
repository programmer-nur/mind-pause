# CLAUDE.md

Entry point for Claude Code. **Read [AGENTS.md](AGENTS.md) in full before changing anything** — it
is the operational contract for every contributor. This file adds only what is specific to working
here with an AI assistant.

---

## What this project is

**Mind Pause** — a small, offline, cross-platform (Windows/macOS/Linux) desktop app that inserts a
deliberate pause between an impulse and acting on it. The user keeps ≤3 personal recordings; a tray
click plays one, then a calm countdown holds the screen for a duration they chose in advance.

No account. No backend. No cloud. No telemetry. No network client linked into the binary at all.

**Current state: pre-Phase-0. There is no source code yet** — only the five planning documents and
`docs/TECHNICAL_PLAN.md`. Phase 0 (see the roadmap) is: scaffold an empty Electron app and get it
**built, signed, notarized and installed on all three target platforms** before any feature work.

---

## The five things most likely to go wrong, and the rules that prevent them

1. **Trapping a user.** This is the catastrophic failure. `src/core/**` stays pure with an injected
   clock; `remaining()` has exactly one implementation and is clamped so it can never grow; the
   watchdog never goes through the event queue; enforcement releases before the terminal write.
   **Safe always means less restrictive.**
2. **Claiming a capability that does not exist.** Every platform section lists what cannot be done
   and why. `SHIELDED` / `PRESENT` / `OBSERVING` is detected at runtime and **binds the UI copy** —
   the product is not allowed to say "your screen is held" on GNOME Wayland.
3. **Capturing input.** Never. No keyboard hooks, no event taps, no X11 grabs, no `EVIOCGRAB`, on
   any platform, for any reason. This one decision resolves the malware-fingerprint, App-Review,
   accessibility-hazard and never-trap problems at once.
4. **Leaking the recordings.** No path crosses IPC; no plaintext leaves the encrypted store; no
   filename, title, note, window title, URL or process name is ever logged; the data directory is
   re-checked against cloud-sync roots at every launch.
5. **Scope creep.** The exclusion list in [PRODUCT_REQUIREMENTS §4.4](PRODUCT_REQUIREMENTS.md) is
   long and deliberate — accounts, sync, streaks, any history, blocking, detection, a mobile app,
   auto-update, watchdogs. Each entry has a one-line reason. Check it before proposing anything.

---

## Working style in this repo

- **Verify platform claims against primary documentation.** Several first-pass claims in the
  research behind this plan were wrong and were caught by adversarial checking — a stale Fedora
  codec fact, a nonexistent AppKit enum member, a Wayland protocol declared nonexistent that is
  shipping, and a macOS window level that suppresses Touch ID prompts. If you think something in the
  plan is wrong, **check it and say so explicitly**. Do not silently act on a hunch, and do not
  silently accept a claim either.
- **Prefer deleting code to adding it.** Three media items, one offline utility, one maintainer,
  five years.
- **No new abstraction layers.** There is no `utils/`, `helpers/`, `common/`, DI container, plugin
  system, or event bus beyond the single queue — on purpose.
- **Never weaken a safety invariant to make a test pass.** If AGENTS.md §3 and a test disagree, the
  test is wrong or the design needs an ADR.
- **An ADR comes before the code** for anything touching the protection policy, the escape path, the
  persistence format, the media profile, the shell, the threat model, or anything adding a network
  dependency or a privileged component.
- **Report gates honestly.** When you finish, say which release gates you ran and which you did not.
  Never imply a manual gate passed if it was not run.

## Small mechanical rules

- TypeScript `strict`; no `any` in `src/core/**`.
- `pnpm install --frozen-lockfile --ignore-scripts` — never plain `pnpm install`.
- Do not run `pnpm build` or any packaging step unless asked; they are slow and produce artifacts
  nobody wants in a working tree.
- Do not commit or push unless asked.
- When referencing a decision, cite its ADR number — decisions in this project have reasons, and the
  reason is the interesting part.
