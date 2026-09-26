# Mind Pause — Product Requirements

**Status:** source of truth for scope · **Last reviewed:** 2026-09-26
**Rule:** a requirement without a test id is not covered. The traceability matrix in §6 is the
completeness check for the whole product.

Tiers: **M** = MVP · **V** = V1 · **F** = Future · **X** = permanently excluded.

---

## 1. Product principles and their release gates

Each principle is falsifiable. **Any failing gate blocks the release** — there is no "ship with a
known accessibility regression" path.

| # | Principle | Gate | Test id |
|---|---|---|---|
| **P1** | The escape is always ≤2 interactions, visible, keyboard-reachable | **Panic test:** three people who have never seen the app exit a running pause within 10 s, unaided | `MAN-06` |
| **P2** | We ship soft commitment, and we say so | No code path elevates privileges, installs a service, respawns after a kill, hides a process, or impedes uninstall | `CI-lint`, `MAN-23` |
| **P3** | Urge to first frame under 3 s | Cold start → tray ≤1.5 s; trigger → first frame ≤1.5 s, on reference machine **R1** | `MAN-01`, `MAN-02` |
| **P4** | Zero bytes leave the machine | A full session under a deny-all firewall with packet capture shows zero connection attempts. The pcap is a release artifact. | `MAN-08`, `CI-deps` |
| **P5** | We never read what you do | No window-title, URL, process-enumeration, keystroke, clipboard or screenshot API in the app **or its dependency tree** | `CI-deps`, review |
| **P6** | Nothing persisted can be used against the user | Every persisted field is enumerated and justified; nothing timestamps a failure; "Delete everything" is one action | `UNIT-fields`, `MAN-22` |
| **P7** | Every screen works keyboard-only, at 200% zoom, with a screen reader | Orca **first**, then NVDA, then VoiceOver | `MAN-09`, `MAN-11` |
| **P8** | Scope veto — account, server, browser extension, or OS accessibility permission is out by default | Requires a written ADR exception | review |

---

## 2. Functional requirements

Full specification and rationale for each: [docs/TECHNICAL_PLAN.md §5](docs/TECHNICAL_PLAN.md#5-functional-requirements).

### 2.1 Onboarding

| ID | Requirement | Tier |
|---|---|---|
| FR-01 | Exactly three first-run screens, ~60 s, **zero mandatory inputs and zero OS permission prompts** | M |
| FR-02 | A pause can start **before** onboarding completes and **with zero media** (`allow_bare_pause`, default true) — onboarding is never a gate on the core value | M |
| FR-03 | Autostart offered on screen 3, default on, with the platform's own consequence explained *before* it happens | M |
| FR-04 | The app states once: what it is, what it is not, where files live, and that leaving is always allowed | M |
| FR-05 | A user-entered "Someone I can call", shown on the completion screen only if set | V |

### 2.2 Media library

| ID | Requirement | Tier |
|---|---|---|
| FR-10 | Import via OS file picker (primary) or drag-and-drop (secondary) | M |
| FR-11 | At most **3** items, shown as three fixed slots; empty slots read as invitations | M |
| FR-12 | Every import is **copied** into app storage and **normalized** to the guaranteed profile. The original is never modified, moved, or referenced again. | M |
| FR-13 | Import is asynchronous, shows progress, is cancellable, and leaves **no residue** on cancel | M |
| FR-14 | Per item: opaque id, title (**never defaulted from the source filename**), duration, dimensions, has-audio, poster, created-at, slot, optional note | M |
| FR-15 | Replace, delete, reorder. Delete is immediate and irreversible, with a confirmation that honestly states backups and snapshots may retain copies. | M |
| FR-16 | An optional free-text note per item, shown during playback and on the protection screen — the caption, accessibility, and mute fallback | M |
| FR-17 | **Rehearse the full pause** (20-second protection period) so the sequence is proven before the first real urge | M |
| FR-18 | Record audio in-app, via native capture (not the webview) | V |
| FR-19 | Trim / re-take | V |
| FR-20 | On-device transcription behind an opt-in model download | F |

### 2.3 Session

| ID | Requirement | Tier |
|---|---|---|
| FR-30 | Start from: tray popover, main window, global hotkey (where the platform allows), CLI | M |
| FR-31 | Default is **one item per session, by rotation**. "Play everything" is a visible non-default. | M |
| FR-32 | PREROLL (5 s, 0–15 s) probes files, warms audio, enumerates displays, and offers a **free cancel that leaves no record** | M |
| FR-33 | No seek, no scrub, no skip-within-item. Pause **is** allowed; the countdown is unaffected; auto-resume after 60 s. | M |
| FR-34 | Protection: countdown, optional breathing pacer, **+5 minutes**, presets 2/5/10/20 (default 5), min 1 min, **hard maximum 30 minutes including all extensions** | M |
| FR-35 | Media time does **not** count toward the protection duration | M |
| FR-36 | Completion: no score, no streak, no counter, no confetti. One optional secondary: "Another five?" | M |
| FR-37 | Playback and protection are independently enterable: *Just the message* and *Just five quiet minutes* | M |
| FR-38 | Scheduled and idle-cued pauses (clock and idle timer only, **no content inspection**) | V |

### 2.4 Protection surface

| ID | Requirement | Tier |
|---|---|---|
| FR-40 | Covers **all displays** by default (settable to the active one); reconciles hotplug within ~1 s | M |
| FR-41 | **Never** captures, hooks, grabs or suppresses input on any platform. Every OS shortcut keeps working. | M |
| FR-42 | The achieved enforcement level (`SHIELDED` / `PRESENT` / `OBSERVING`) is detected, persisted, and **binds the UI copy**. The UI may never claim more than the level says. | M |
| FR-43 | Focus taken once at start, re-asserted ≤3 times and ≤once per 10 s, then never. **Zero refocus when assistive technology is present or detection is unavailable.** | M |
| FR-44 | A close request (Alt+F4, Cmd+Q, close button, `xdg_toplevel.close`) **always visibly opens the exit confirmation** — never a silent no-op | M |
| FR-45 | Screen-capture protection on the playback window (Windows, macOS). Wayland has no equivalent and the UI says so. | M |
| FR-46 | Firm mode: duck other applications' audio | V |

### 2.5 Escape and safety

| ID | Requirement | Tier |
|---|---|---|
| FR-50 | Tier 1 — hold 3 s (configurable 0–10 s) with a progress ring; Space/Enter held works | M |
| FR-51 | Tier 2 — **one click, no hold, released in <100 ms**, always present | M |
| FR-52 | Hold Esc 3 s ends any pause from any surface | M |
| FR-53 | `mind-pause end` ends any pause from a terminal or another session | M |
| FR-54 | A `SAFE_MODE` marker file at a documented path, creatable from a recovery shell, another account, safe mode, or a live USB | M |
| FR-55 | Shift-at-launch enters safe mode (unreliable on Wayland; the marker file is the documented route there) | M |
| FR-56 | Enforcement is released **before** the terminal record is written, never after | M |
| FR-57 | `EMERGENCY.txt` at a stable path **outside the app bundle**, with its content also on the protection screen as selectable text | M |
| FR-58 | An early exit is recorded only as an outcome enum on the single session record. Never counted, never compared, never framed as failure. | M |

### 2.6 System integration

| ID | Requirement | Tier |
|---|---|---|
| FR-60 | Tray with ≤6 entries; left-click opens a popover with one large Start button — **a stray click never launches a five-minute takeover** | M |
| FR-61 | The tray is **never the only entry point**; a failed registration is detected and explained once | M |
| FR-62 | Autostart via the platform's own user-visible mechanism; the app **detects and reports** OS-side disabling and **never silently re-enables it** | M |
| FR-63 | Single instance per OS user; a second launch forwards its verb and exits 0 | M |
| FR-64 | Suspend, resume, lock, unlock, fast-user-switch and shutdown handled per the table in TECHNICAL_PLAN §19.4 | M |
| FR-65 | CLI: `pause`, `end`, `safe`, `status`, `doctor`, `replay` — identical verbs and exit codes on all three platforms | M |

### 2.7 Data and privacy

| ID | Requirement | Tier |
|---|---|---|
| FR-70 | Data lives in the platform's non-synced local app-data directory, **verified at every launch** not to be inside a cloud-sync root; on a hit, refuse and offer relocation | M |
| FR-71 | Media blobs, posters and the index are encrypted at rest with a keyfile-wrapped DEK, with the UI stating exactly what that does and does not protect against | M |
| FR-72 | **Export my recordings** writes decrypted copies to a folder the user picks | M |
| FR-73 | **Delete everything** removes media, posters, index, keyfile, session and breaker state, logs, the autostart entry and the safe-mode marker, in one action | M |
| FR-74 | File logging off by default; the troubleshooting toggle states what is written, caps size, and auto-reverts after 24 h | M |
| FR-75 | Diagnostics export only, after the user reads the exact bytes in-app. No upload path, no crash-reporting SDK. | M |
| FR-76 | Optional OS-keychain and Argon2id passphrase key slots, with an unmissable no-recovery warning on the latter | V |

---

## 3. Non-functional requirements

All numbers measured on **reference machine R1** (a designated five-year-old laptop). Numbers
measured anywhere else do not count. Full list: [TECHNICAL_PLAN §6](docs/TECHNICAL_PLAN.md#6-non-functional-requirements).

| Category | Headline budgets |
|---|---|
| **Performance** | Cold start → tray ≤1.5 s · trigger → surface ≤500 ms · trigger → first frame ≤1.5 s · idle RSS ≤200 MB · idle CPU ≤0.5% · escape ≤100 ms · durable state write p99 ≤50 ms |
| **Resources** | Installed ≤400 MB · installer ≤180 MB · durable non-media state ≤64 KB · logs ≤3 MB total |
| **Reliability** | No crash, kill, power loss or torn write may leave a machine enforced with no valid session · enforcement bounded absolutely at `planned + extends + 120 s` · every durable write atomic, CRC-checked and shadowed · unknown future schema → SAFE_MODE, never a crash |
| **Privacy** | No HTTP client or socket package in the graph (CI-enforced) · no plaintext outside the encrypted store, ever, including temp files and crash dumps · 0700/0600 at creation · no IPC channel accepts a path |
| **Accessibility** | WCAG 2.1 AA throughout; **AAA on the countdown and both escape controls, including at the dimmest dim setting** · targets ≥44 pt (≥56 pt for Start and both escapes) · motion ≤300 ms · countdown announced at coarse intervals, never per second |
| **Offline** | Every feature works with no network, permanently. There is no degraded offline mode because there is no online mode. |

---

## 4. Scope

### 4.1 MVP — must have (~13–15 weeks solo; the sum of Phases 0–8)

Tray + window + autostart · import, normalize, 3 slots, notes, rehearse · one item per session by
rotation · protection with presets and +5 · all-displays surface with the level enum and **no input
capture** · global hotkey (Windows/macOS) · the full five-path escape architecture · the complete
state machine, boot resolver, atomic persistence, breaker, watchdog and overlay deadman · encryption
with the keyfile slot, Export, Delete everything · settings, logging off by default, diagnostics ·
full keyboard and screen-reader support · cloud-sync-root detection · signed Windows installer,
notarized macOS DMG, one Linux format (AppImage) with the support-tier table published.

### 4.2 V1 — should have (~6 months)

Scheduled and idle-cued pauses · in-app audio recording · the native audio-device addon · optional
keychain and passphrase key slots · "Someone I can call" · Firm mode · the Linux layer-shell helper ·
Flatpak then AUR · trim/re-take · user-configurable display name.

### 4.3 Future — could have, assume cut

On-device transcription behind an opt-in model download · an encrypted local export/import bundle ·
documented DE-shortcut binding as a second trigger.

### 4.4 Excluded, permanently

Accounts · cloud sync · streaks, counters, any history · social accountability · AI coaching ·
website/app/DNS/hosts blocking · URL or process detection · a mobile app · analytics · a PIN,
delay-to-uninstall, admin service, or watchdog · auto-update pings · in-app content · multi-user
profiles · **any input capture on any platform, ever**.

Each with its one-line justification: [PROJECT_VISION §6](PROJECT_VISION.md#6-what-this-will-never-become).

---

## 5. Product decisions that reverse the original brief

Recorded here because they are the ones most likely to be re-litigated.

| Brief said | We do | Why |
|---|---|---|
| Play all three recordings sequentially | **Play one, by rotation** | Three items sequentially is an 8–14 minute commitment *before* the pause starts, and the scarce resource is willingness to press the button while ambivalent. Keep three for habituation resistance; play one. |
| A 5-minute *lock* on the *whole computer* | **A calm always-on-top presence** | The lock is fictional, and a whole-machine takeover also blocks the things the user might do *instead* — which is the main generator of the punitive feeling that precedes uninstall |
| Fixed 5 minutes | **User-chosen in advance, with a prominent +5** | Fixed duration is imposed; chosen duration is an if-then plan. Voluntary extension is the only honest efficacy signal available offline. |
| A tray click is the trigger | **Tray + global hotkey in MVP; scheduled in V1** | A person in the grip of an impulse does not open a tray menu |
| Media upload/import *and* "recorded by the user" | **Import-only in MVP; in-app recording in V1** | A phone is a better recording device, and in-app capture adds mic TCC, Windows privacy gates, Flatpak device permissions and a disclosure event |

---

## 6. Traceability matrix

**Every one of the 30 required scenarios maps to a requirement, a module, a state transition, and a
test.** A row with no test id is not covered.

| # | Scenario | FR | Module | State transition(s) | Test id | Tier |
|---|---|---|---|---|---|---|
| 1 | First-run onboarding | FR-01..04 | `renderer/screens/Onboarding` | `UNINITIALIZED → IDLE` | `E2E-01`, `MAN-25` | M |
| 2 | Media import | FR-10..13 | `main/media/import` | — | `INT-media-*`, `MAN-20` | M |
| 3 | Maximum 3 media items | FR-11 | `core/policy` | — | `UNIT-policy-slots` | M |
| 4 | Audio support | FR-14, FR-16 | `main/media`, `renderer/Playback` | `PLAYING` | `INT-media-audio`, `E2E-02` | M |
| 5 | Video support | FR-12 | `main/media` | `PLAYING` | `INT-media-video` | M |
| 6 | Media metadata | FR-14 | `main/store/index` | — | `INT-index` | M |
| 7 | Media replacement / removal | FR-15 | `main/media`, `main/store` | — | `INT-index-mutate` | M |
| 8 | Session creation | FR-30, FR-32 | `core/session` | `IDLE → PREROLL` | `UNIT-table` | M |
| 9 | Sequential playback | FR-31 | `core/session` | `PLAYING → PLAYING` (self-loop on `playIndex`) | `UNIT-table`, `E2E-03` | M |
| 10 | Session completion | FR-36 | `core/session` | `PROTECTION → COOLDOWN` | `UNIT-table`, `E2E-03` | M |
| 11 | Focus / protection period | FR-34, FR-40..45 | `main/protection` | `→ PROTECTION` | `MAN-05`, `MAN-26` | M |
| 12 | Countdown | FR-34 | `core/policy/remaining` | `PROTECTION → PROTECTION` (`E_TICK`) | `UNIT-remaining-property` | M |
| 13 | Tray / menu-bar quick action | FR-60, FR-61 | `main/tray`, `platform/*` | `E_START_REQUESTED` | `MAN-03` | M |
| 14 | Autostart | FR-62 | `main/autostart`, `platform/*` | — | `MAN-04` | M |
| 15 | Settings | FR-74, §2.7 | `renderer/screens/Settings` | — | `E2E-04` | M |
| 16 | Local persistence | FR-70 | `main/store/atomic` | every barrier write | `INT-atomic-*` | M |
| 17 | Crash recovery | — | `core/boot` | `BootResolve → PROTECTION` (`RESUME_SAME_BOOT`) | `UNIT-resolve-01`, `MAN-13` | M |
| 18 | Restart during an active session | — | `core/boot` | same row as 17 | `UNIT-resolve-02` | M |
| 19 | Sleep / wake during a session | FR-64 | `main/power`, `core/clock` | `E_SUSPEND` / `E_RESUME` | `UNIT-clock-suspend`, `MAN-15` | M |
| 20 | Reboot during a session | — | `core/boot` | `BootResolve → PROTECTION` (`RESUME_CROSS_BOOT`, forced `PRESENT`) | `UNIT-resolve-03`, `MAN-14` | M |
| 21 | App update behavior | — | `main/store/migrations` | `BootResolve → SAFE_MODE` on unknown schema; `→ COOLDOWN` on version change mid-pause | `INT-migrate-*`, `MAN-24` | M |
| 22 | Media file deletion / movement | FR-12 | `main/media` | — (impossible by construction: we copy) | `INT-media-orphan` | M |
| 23 | Corrupted media handling | FR-15 | `main/media/integrity` | `PLAYING → PLAYING` on `E_ITEM_FAIL`; `PREROLL → PROTECTION` if none playable | `INT-degradation-*` | M |
| 24 | Multiple monitors | FR-40 | `main/protection`, `platform/*` | `E_DISPLAYS_CHANGED` | `MAN-05` | M |
| 25 | Accessibility | FR-43, P7 | `renderer/a11y`, `platform/*` | — | `MAN-09`, `MAN-10`, `MAN-11` | M |
| 26 | Keyboard handling | FR-41, FR-44 | `main/protection` | — | `MAN-12` | M |
| 27 | Unexpected app termination | FR-56 | `main/protection` (deadman), `core/boot` | `PROTECTION → ABORTED` via `E_WATCHDOG_RELEASE` | `MAN-13`, `UNIT-invariants` | M |
| 28 | Deliberate bypass attempts | FR-58 | `core/policy`, `main/log` | `E_CLOCK_JUMP`; breaker events | `MAN-16`, `MAN-17` | M |
| 29 | Emergency / escape path | FR-50..57 | `main/protection`, `main/cli` | `→ ABORTED` | `MAN-06`, `MAN-18`, `E2E-05` | M |
| 30 | Privacy of stored media | FR-70..75 | `main/store/crypto` | — | `INT-crypto-*`, `MAN-08`, `MAN-22` | M |

**Every scenario is MVP.** That is deliberate: these are not features, they are the conditions under
which the product is allowed to exist.

---

## 7. Open product questions

Answer these before Phase 1; each changes the plan.

1. ~~Is Linux in scope for the **first** release?~~ **Answered 2026-09-26: yes, all three. ADR-001
   stands — Electron confirmed.**
2. ~~Is the maintainer in the US or Canada?~~ **Answered: Bangladesh.** Azure Trusted Signing is
   unavailable; Certum's open-source tier is the cheapest path if signing is funded.
3. ~~GPL-3.0-or-later, or permissive?~~ **Answered: GPL-3.0-or-later. ADR-023 accepted**, which also
   unlocks Certum's open-source certificate.
4. ~~Which reverse-DNS domain do you control?~~ **Answered: `io.github.<GITHUB-USERNAME>.MindPause`.**
   **Outstanding: the GitHub username.**
5. ~~Is the signing floor acceptable?~~ **Answered: no paid signing in v1.** See TECHNICAL_PLAN
   §23.3.1 for what that costs per platform, and R16 for the macOS autostart risk it creates.
6. ~~60-minute hard maximum, or 30?~~ **Answered: 30 minutes** (`PROTECTION_HARD_MAX_MS = 1_800_000`).
7. ~~All displays by default, or the active one?~~ **Answered: all displays.** Remains a setting.
8. ~~Is "Mind Pause" the shipped name?~~ **Answered: yes.** Frozen in Phase 0.
9. ~~Will you honour the kill criterion?~~ **Answered: personal-first; 90-day dogfood.**
10. ~~Who is the second person?~~ **Answered: open source, contributors may appear.**
