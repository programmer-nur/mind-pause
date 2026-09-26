# AGENTS.md — working in this repository

For any contributor, human or AI. Read this before changing anything.

> **Current state: Phase 0 complete on Linux.** The scaffold, the four architectural lint rules,
> the gate scripts and the Linux AppImage all exist and pass. Windows and macOS artifacts are
> built by CI but have **not** been installed or verified on real hardware yet. There is no pause
> engine — that is Phase 1 onward.

---

## 1. Read these first, in this order

| Document | What it is | When you need it |
|---|---|---|
| [PROJECT_VISION.md](PROJECT_VISION.md) | Why this exists, and what it will never be | Before proposing any feature |
| [PRODUCT_REQUIREMENTS.md](PRODUCT_REQUIREMENTS.md) | FRs, NFRs, scope tiers, traceability matrix | Before implementing anything |
| [SYSTEM_ARCHITECTURE.md](SYSTEM_ARCHITECTURE.md) | The architecture of record | Before touching structure |
| [docs/TECHNICAL_PLAN.md](docs/TECHNICAL_PLAN.md) | The full 30-section plan, with all reasoning and rejected alternatives | When you want to know *why* |
| `docs/adr/` | Individual decisions | Before reversing one |

**If a document disagrees with the code, one of them is a bug.** Fix it, do not work around it.

---

## 2. Commands

**Commands marked ✓ exist and pass today. The rest are specified for the phase that adds them.**

```bash
pnpm install --frozen-lockfile   # ✓ NOT --ignore-scripts: it blocks Electron's runtime download.
                                 #   Lifecycle scripts are denied by default and allowlisted
                                 #   explicitly in pnpm-workspace.yaml — a stricter posture.

pnpm gates               # ✓ everything CI runs. Run this before claiming anything works.
pnpm lint                # ✓ ESLint, including the four architectural rules
pnpm lint:prove          # ✓ proves those four rules actually FIRE (with negative controls)
pnpm typecheck           # ✓ tsc (main) + svelte-check (renderer)
pnpm deps:check          # ✓ fails if anything in src/ or the runtime graph can reach the network
pnpm identity:check      # ✓ app id frozen, consistent, and Flathub-legal
pnpm test                # ✓ Vitest
pnpm test:core           # ✓ core/ only — milliseconds, no app, no display, no real clock
pnpm build               # ✓ tsc + vite -> dist/
pnpm start               # ✓ build, then launch Electron locally
pnpm dist:linux          # ✓ AppImage -> release/   (also dist:win / dist:mac)

pnpm test:integration    # Phase 2 — store, crypto, migrations (real fs, temp dirs)
pnpm test:e2e            # Phase 6 — Playwright + _electron
pnpm fixtures            # Phase 3 — generate the media fixture corpus with the bundled ffmpeg
pnpm notices             # Phase 8 — regenerate THIRD_PARTY_NOTICES.md
```

### Verifying what a machine can actually do

```bash
"release/Mind Pause-0.0.1.AppImage" --print-probe   # JSON: enforcement level + WHY, tray, paths
"release/Mind Pause-0.0.1.AppImage" --diagnostics   # the same, in a window
```

`--print-probe` is the ancestor of `mindpause doctor` (FR-65). Use it instead of guessing what a
platform supports — and instead of asking a user to describe their desktop.

### Development safety — non-negotiable, and active from the first shield commit

Building a full-screen protection surface means repeatedly locking yourself out of your own machine.

- `NODE_ENV !== 'production'` **caps any protection period at 30 seconds.** No exceptions.
- `MINDPAUSE_NO_SHIELD=1` is checked at shield creation and skips it entirely.
- Have a **second machine with SSH access** configured *before* you raise a shield for the first
  time.
- Memorise the `SAFE_MODE` marker path for your platform, and keep `mind-pause end` on your PATH.

---

## 3. Invariants — never break these without an ADR

These are not style preferences. Each one prevents a specific failure described in the plan.

### 3.1 Architecture

1. **`src/core/**` is pure.** No `electron`, no `node:*`, no filesystem, no network, no
   `Date.now()`, no `performance.now()`, no `Math.random()`. Clocks and config are **injected**.
   *Why: it is the part that can trap a user, and purity is what makes every recovery scenario a
   millisecond unit test instead of a manual ritual.*
2. **`process.platform` appears in exactly one file**: `src/main/platform/index.ts`. Everything
   conditional lives behind `PlatformAdapter`.
3. **The renderer owns no authoritative state.** It renders events. If it dies, the engine is
   unaffected.
4. **The watchdog never goes through the event queue.** A wedged reducer must not be able to wedge
   the release path.
5. **`remaining()` has exactly one implementation**, in `core/policy/remaining.ts`. Do not compute
   remaining time anywhere else, ever, for any reason.
6. **No path crosses IPC.** Every command parameter is an opaque id, validated in the main process.
7. **No `innerHTML`, `outerHTML`, `insertAdjacentHTML`, or `{@html}`** anywhere in the renderer.

### 3.2 Safety

8. **Never capture, hook, grab or suppress input** — on any platform, for any reason. No
   `WH_KEYBOARD_LL`, no `CGEventTap` in `.defaultTap`, no `XGrabKeyboard`, no `EVIOCGRAB`, no
   `zwp_keyboard_shortcuts_inhibit_v1`. This is [ADR-004] and it is the load-bearing safety
   decision in the product.
9. **Never build a watchdog, service, daemon, or respawn mechanism.** A process the user cannot kill
   is malware-shaped and violates the never-trap constraint.
10. **Enforcement engages only *after* a durable write, and is released *before* the terminal
    write.** Enforced-but-unrecorded is a lockout; released-but-unrecorded is harmless.
11. **Safe means less restrictive, never more.** Every ambiguous recovery path releases enforcement.
12. **A close request always visibly opens the exit confirmation.** Never a silent no-op, never a
    refusal.
13. **Nothing may outlive the process.** No policy registry writes, no system settings changes, no
    profiles, no OS-level state.

### 3.3 Privacy

14. **No HTTP client, socket library, or network-capable package** may enter the dependency graph.
    CI enforces this, and it is what makes "we send nothing" verifiable rather than promised.
15. **Never log** a filename, a path, a media title, a note, a transcript — and **never** a window
    title, a URL, or the name of a process the user tried to open.
16. **No plaintext media, poster, title or note is ever written outside the encrypted store** —
    including temp files and crash dumps.
17. **Never persist a count, a streak, a tally, or a timestamp of a failure.** If your feature needs
    one, the feature is out of scope. See [PRODUCT_REQUIREMENTS §4.4].

---

## 4. How to do the common things

### Add a state or an event

1. Edit `src/core/session/table.ts`. **The table is data; the dispatcher is generated from it.**
2. Run `pnpm test:core`. The **exhaustiveness test will fail** until every new `(phase, event)` pair
   is classified as a valid transition or as Tier A (drop), Tier B (reject), or Tier C (force safe).
   That failure is the feature, not an obstacle.
3. Regenerate the Mermaid diagram. A drift test asserts the committed diagram matches the table.
4. Add a resolver row if the new phase is persistable.
5. **Ask the state criterion first:** does this change (a) the legal events, (b) the running
   effects, or (c) the resolver's decision? If not, **it is a field, not a state.**

### Add a platform behaviour

1. Add the method to `PlatformAdapter` in `src/main/platform/types.ts`, **with a documented degraded
   return** — "unsupported here" must be an ordinary, typed outcome, not an exception.
2. Implement it in all three of `win32/`, `darwin/`, `linux/`. A `throw new Error('not implemented')`
   is not an implementation; a documented degradation is.
3. If it affects what the protection surface can achieve, update `probeEnforcementLevel()` **and**
   the copy bound to each level.

### Add a dependency

1. Does it pull in a network client or a socket library? → **rejected.** `pnpm deps:check` will fail
   anyway.
2. Can it read window titles, URLs, process lists, keystrokes, the clipboard, or the screen? →
   **rejected** ([P5]).
3. Is it a *runtime* renderer dependency? → almost certainly rejected. Target **zero**; every
   frontend package is a direct path to XSS and therefore to the full IPC surface.
4. Licence compatible, and does `pnpm notices` regenerate cleanly?
5. Could you vendor or replace it in 2031 if it were abandoned?

### Change persisted data

1. Bump `schema_version`.
2. Add a migration to the registry **and a committed fixture of the previous version**.
3. Confirm the unknown-**future**-version path still lands in `SAFE_MODE` with a readable message.
4. Add the new field to the justification table in [TECHNICAL_PLAN §11.6]. **A field not in that
   table is not written.**

### Change user-facing copy

Read it aloud imagining the worst possible moment: someone who has just lost money they needed, at
3am. If it would make that person feel **watched, graded, or mocked**, it fails.

The four rules: describe the situation never the person (**no evaluative adjective, including
positive ones**) · every instruction is an invitation with a stated out · no counting and no
comparison · second person, present tense, no exclamation marks, no emoji, no jokes.

Banned strings are a **release gate**: `block`, `lock`, `prevent`, `impossible`, `streak`,
`relapse`, `failure`, and anything of the form "you can't leave until…".

---

## 5. When an ADR is required

Write one in `docs/adr/` before the code, for any change to:

- the protection policy · the escape path · the threat model
- the persistence format · the media profile · the shell or frontend framework
- anything that adds a network dependency, a privileged component, or an OS permission prompt
- anything that reverses a decision in the [ADR table](docs/TECHNICAL_PLAN.md#29-architecture-decision-records)

Template: *Context* (including the forces pulling the other way) · *Decision* (imperative) ·
*Alternatives rejected* (each with the **specific evidence** that killed it) · *Consequences*
(including the bad ones we are accepting) · *Revisit if* (a concrete condition).

---

## 6. Release gates — none of these are waivable

A failure blocks the release. There is no "ship with a known regression in this list" path.

| | Gate |
|---|---|
| **The panic test** | Three people who have never seen the app exit a running pause within 10 seconds, unaided |
| **Zero egress** | A full session under a deny-all firewall with packet capture; the pcap ships as a release artifact |
| **Screen readers** | Orca **first**, then NVDA, then VoiceOver |
| **Contrast** | AA throughout; **AAA on the countdown and both escape controls, including at the dimmest dim setting** |
| **Honest copy** | No banned string; the not-treatment line present; the bypass list published |
| **Level honesty** | No `OBSERVING` session renders blocking language |
| **The uninstaller** | Actually run it, and verify nothing is left behind |
| **Escape parity** | README, Help, `EMERGENCY.txt` and the code all describe the **same** escape paths |
| **Migration** | Install over the previous version *with real state present* and confirm the backup was written |

The full 26-row manual matrix is in
[TECHNICAL_PLAN §22.6](docs/TECHNICAL_PLAN.md#226-per-release-manual-matrix).

---

## 7. Things that look like bugs and are not

Do not "fix" these. Each is a deliberate decision with an ADR behind it.

| Looks wrong | Is correct because |
|---|---|
| The tray icon is hidden in the Windows 11 overflow flyout | That is the OS default for new icons and there is no reliable way to force promotion. The tray is never the only entry point. |
| Autostart is off and we did not re-enable it | The user (or Windows) turned it off. **Silently rewriting `StartupApproved` is a documented malware pattern.** We report; we do not repair. |
| The overlay does not cover the second monitor on GNOME Wayland | Wayland forbids clients from using global screen coordinates. This is why the enforcement level exists and why the copy changes. |
| `kill -9` ends the pause | **By design.** Killing the process is a documented escape path. |
| Suspending the laptop does not pause the countdown | **By design.** Time away from the machine is time away from the urge. |
| A reboot resumes only a weaker overlay, capped at 10 minutes | The declawed cross-boot resume ([ADR-015]) — full resume at login is the boot-loop hazard. |
| Two ordinary reboots do not trip the circuit breaker | They must not. Session-end messages are handled precisely so a normal restart is not counted as a crash. |
| We do not resist Task Manager / Force Quit | No unprivileged process can, and anything that could would be malware. |
| There is no history, no streak, no session count | Banned at the architecture level. There is no field in which such a number could be stored. |
| There is no auto-updater | [ADR-019]. It would reintroduce a network client and create a key that reaches every install. |
| The single-instance mutex is `Local\` and not `Global\` | Fast user switching legitimately means two sessions each running their own copy. |
| `poster` files have no `.jpg` extension | An extension would let the file manager thumbnail the user's face and falsify the "opaque blobs" claim. |

---

## 8. If you are an AI agent

- **Do not add a feature because it is easy.** Check [PRODUCT_REQUIREMENTS §4.4] first: the
  exclusion list is long, deliberate, and each entry has a one-line reason.
- **Do not add an abstraction "for flexibility."** There is no `utils/`, no `helpers/`, no
  `common/`, no DI container, and no plugin system, on purpose.
- **Do not weaken a safety invariant to make a test pass.** If §3 and a test disagree, the test is
  wrong or the design needs an ADR.
- **Do not claim a capability the plan says is impossible.** The three platform sections list what
  cannot be done and why. If you believe one of them is wrong, **verify it against primary
  documentation and say so explicitly** — several first-pass claims in the research behind this plan
  *were* wrong, and were corrected by exactly that process. Do not silently act on a hunch.
- **Prefer deleting code to adding it.** This is a three-media offline utility with a five-year
  horizon and one maintainer.
- When you finish a change, state plainly which release gates you ran and which you did not.
