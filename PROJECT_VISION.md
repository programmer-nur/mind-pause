# Mind Pause — Project Vision

**Status:** source of truth · **Owner:** the maintainer · **Last reviewed:** 2026-09-26
**Change policy:** this document changes rarely. A change here almost always requires an ADR.

### Decisions taken 2026-09-26

| | |
|---|---|
| Platforms | **All three in the first release.** Linux included → Electron confirmed (ADR-001). |
| Licence | **GPL-3.0-or-later** (ADR-023) — which also unlocks Certum's open-source code-signing tier. |
| Code signing | **None paid in v1.** Consequences per platform in TECHNICAL_PLAN §23.3.1; macOS autostart risk is R16. |
| macOS | **In scope, pending a Phase 0 test** of whether an unsigned bundle can register a login item. |
| Protection cap | **30 minutes** total including extensions (`PROTECTION_HARD_MAX_MS = 1_800_000`). |
| Displays | **All displays** by default; remains a setting. |
| Name | **Mind Pause.** Identity strings freeze in Phase 0. |
| App id | **`io.github.programmer_nur.MindPause`** — FROZEN 2026-09-26. Note the **underscore**: Flathub requires the domain portion convert `-` to `_` (the GitHub user is `programmer-nur`), and the hyphenated form would be rejected at review on a value that is immutable once shipped. |
| Audience | **Myself first**, published as open source. Contributors welcome; `CONTRIBUTING.md` required. |

---

## 1. The one-sentence product

> **Mind Pause puts your own words between you and the reflex, for as long as you decided in
> advance.**

A small, offline desktop application. The user keeps up to three short recordings they made
themselves. When they feel an urge to do something they are trying not to do, they trigger a *pause*
from the tray: one recording plays, then a calm countdown holds the screen for a duration they chose
earlier, then it ends.

That is the whole product. Everything below exists to stop it becoming something else.

---

## 2. Why this exists

Between an impulse and acting on it there is a gap of twenty to sixty seconds in which a person is
genuinely ambivalent. Almost nothing occupies that gap. Blockers try to remove the option, which
produces reactance and gets disabled. Trackers try to shame the outcome, which produces shame, which
the evidence associates with *worse* outcomes rather than better ones.

Mind Pause occupies the gap with the one voice the user cannot dismiss as someone else's opinion:
their own, recorded when they were calm, saying what they actually want.

### The mechanism, and its honest limits

| Ingredient | What it is | Evidence |
|---|---|---|
| **The recording** | Self-administered episodic future thinking — a vivid, personalized future cue, which reliably reduces delay discounting and, in several samples, craving | This is the mechanism. **The recording step is therefore the most valuable part of the product**, not the playback chrome. |
| **Choosing the duration in advance** | An implementation intention (an if-then plan) | Gollwitzer & Sheeran's meta-analysis (94 studies) reports d ≈ 0.65, and larger effects for discrete, time-bound acts (d ≈ 0.79) than sustained ones (d ≈ 0.31). A pause is the favourable case. |
| **The countdown** | Scaffolding, not the active ingredient | The `one sec` RCT (PNAS 2023) found ~36% dismissal of the consumption attempt and ~37% fewer opening attempts — and identified the **dismiss option**, not the delay, as the most effective ingredient. |

**The corollary that governs every design decision in this project:** a user who presses the button
and leaves at 0:40 still got the deliberation the mechanism is made of. **Nothing in the copy, the
UI, or the data may treat an early exit as failure.**

**And the limit, stated up front:** whether this app reduces the underlying behaviour is not
measurable without telemetry, telemetry is excluded, and therefore **no such claim may ever be
made** — in the app, in the README, or anywhere else.

---

## 3. Three commitments that are not negotiable

### 3.1 It cannot lock a computer, and it will never claim to

An unprivileged desktop application can cover the screen. It cannot own the machine. Ctrl+Alt+Del,
Force Quit, a TTY switch, a reboot, a second user account, or the phone in the user's pocket each
defeat it in seconds. Anything strong enough to change that requires administrator rights, a signed
kernel driver, or an Apple entitlement that does not exist for this use case — and would make the
app malware-shaped, unsignable, and a genuine hazard to the person using it.

So we ship **friction**, we say so in the product, and **we publish the bypass list in the README as
a feature of the design**. Making the weakness explicit is a trust asset *and* a reactance reducer:
the user stops testing the cage because there is no cage.

### 3.2 There is always a safe, documented way out

The escape path is a safety requirement, not a UX nicety. Over a five-year horizon, a medical event,
a child, an on-call page, or a call from a hospital are certainties, not edge cases.

Five escape paths, all documented, all tested every release: hold the button for three seconds; a
one-click emergency exit with no hold at all; hold Esc for three seconds from any surface;
`mind-pause end` from a terminal; and a marker file that can be created from a recovery shell,
another account, safe mode, or a live USB — **the guarantee that a locked-out user always has a way
back that does not require our code to be working.**

### 3.3 The recordings are among the most private files a person owns

A voice memo about a gambling or pornography habit is not ordinary user data. There is no account,
no backend, no cloud, and **no network client linked into the binary at all** — which turns "we send
nothing" from a promise into a property a stranger can verify with a dependency-tree query.

And we are honest about the boundary: encryption at rest protects against other accounts, stolen
disks, search indexes, thumbnails, backup tools and cloud sync. It does **not** protect against
someone sitting at the unlocked, signed-in desktop — the primary realistic adversary. The app says
so, and recommends the thing that actually helps: a separate OS user account.

---

## 4. Who this is for

**Two users, both real:**

1. **The ambivalent person in the approach phase** — twenty to sixty seconds before the thing, aware
   it is happening, not yet committed.
2. **The person doing a preventive pause** — before starting work, at the end of the evening, at a
   time they know is difficult.

**Explicitly not designed for the person mid-binge.** Someone in the grip of an impulse does not
open a tray menu. Designing for that user is where this product would start lying about itself. This
is also why the global hotkey is in the MVP and scheduled pauses are in V1: both lower the cost of
self-triggering, which is the scarce resource.

**And it cannot follow the user to a phone**, which is where a large share of the target behaviour
actually happens. Onboarding says this in one sentence rather than letting users discover it as a
betrayal.

---

## 5. Safety posture

The product touches gambling and pornography — populations with measurable distress and, for
gambling, substantially elevated suicide risk concentrated in acute post-loss states. That makes the
following hard requirements rather than polish:

- **No streaks, no counters, no history, no score.** Banned at the architecture level, not just the
  copy level: there is no field in which such a number could be stored. A streak converts one slip
  into a total loss, which is maximum shame per unit of information, and shame-proneness is
  associated with worse substance-use outcomes while guilt is not.
- **No evaluative adjective is ever applied to the user — including positive ones.** Praise implies
  a scale, and a scale implies the other end.
- **No clinical vocabulary.** Not "addiction", "addict", "relapse", "clean", "sober" or "recovery"
  applied *to the user* by the app. The app has assessed nobody and is not entitled to those words.
  The user's own recording is the only place values-language belongs — there it is theirs, and it is
  preserved verbatim and never analysed, scored, or transcribed.
- **No moralising** about the behaviour. The app is an instrument for a goal the *user* set.
- **One quiet line, once:** *"This app isn't treatment. Talking to someone helps."* Plus a
  user-entered "Someone I can call" (V1). No region-locked helpline list — it cannot be kept correct
  offline for five years, and a wrong number is worse than none.
- **Nothing frightening.** No red, no alarm sounds, no flashing, no countdown that turns hostile, and
  never the sentence *"You can't leave until the timer ends"* — which would be both a lie and the
  single most dangerous string this product could ship.

---

## 6. What this will never become

Each exclusion is permanent, and each has one line that kills it. These are not "not yet"; they are
"no".

| | |
|---|---|
| **Accounts or login** | Nothing to authenticate; an account is a liability store attached to the most sensitive media a person owns |
| **Cloud sync or backup** | The entire value proposition is that these recordings never leave the machine; a sync bug here is a catastrophe, not an incident |
| **Streaks, badges, gamification, any history** | See §5. A local chart of your own urges is precisely the file that must not exist on a shared machine |
| **Social accountability partners** | Turns a private struggle into a disclosable event and creates coercion dynamics one maintainer cannot supervise |
| **AI coaching or chat** | Turns a four-file offline app into a model-hosting product with a crisis-safety surface a solo maintainer cannot staff at 3am |
| **Website, app, DNS or hosts blocking** | Needs elevation or a trusted root CA or an Apple entitlement; DNS-over-HTTPS silently defeats hosts entries; breaks "we never read what you do"; and is defeated by the phone in the user's pocket |
| **URL or process detection of any kind** | Three browser extensions with three store reviews, or OS accessibility permissions with a frightening consent dialog — and it converts "reads nothing about you" into "watches everything you do" |
| **A mobile app** | iOS requires Screen Time / FamilyControls entitlements and is a wholly separate product. Promising it is exactly the fake cross-platform promise we refuse to make. |
| **Telemetry or analytics, even anonymous** | There is nothing to feed them and no way to justify them |
| **Auto-update pings** | Even a version check is a network beacon, and it leaks "this machine runs Mind Pause and woke up at 02:13" to a router that the primary adversary may control |
| **A PIN to end a pause, delay-to-uninstall, an admin service, a watchdog** | Hard-commitment theatre: defeated in under a minute, flagged by antivirus, and it turns an ally into an adversary the user then wants to beat |
| **Any input capture, on any platform, ever** | It is the strongest malware heuristic, it breaks assistive technology, it risks genuinely trapping a user, and it is defeated by a reboot anyway |
| **Multi-user profiles** | One person, one machine. Profiles imply a shared device, which is a different and much harder privacy problem. |

---

## 7. Product principles

Eight principles, each falsifiable by a test that runs every release. The full table with its gates
is in [PRODUCT_REQUIREMENTS.md](PRODUCT_REQUIREMENTS.md#1-product-principles-and-their-release-gates).

1. The escape is always ≤2 interactions, visible, and keyboard-reachable.
2. We ship soft commitment, and we say so.
3. Urge to first frame under 3 seconds.
4. Zero bytes leave the machine.
5. We never read what you do.
6. Nothing persisted can be used against the user.
7. Every screen works keyboard-only, at 200% zoom, with a screen reader.
8. Scope veto: anything needing an account, a server, a browser extension, or an OS accessibility
   permission is out by default and needs a written exception.

Two structural rules follow from them, and they are the ones a future contributor will be tempted to
break:

- **The UI never owns session state.** If the renderer dies, the engine is unaffected.
- **Safe means less restrictive, never more.** Every ambiguous recovery path releases enforcement.

---

## 8. How we will know if it works, with no telemetry

**This is built for the maintainer first, and published because it is open source — not launched to
recruited users.** That makes the validation strategy smaller and sharper, and it does not relax any
safety gate.

1. **Dogfood honestly — the primary signal.** N=1 but real: a private paper log for 90 days. Did I
   press it? When? Did I leave early? Did I resent it?
2. **An opt-in feedback file** the user reads in full and emails themselves if they choose. Zero
   background transmission.
3. **The category mix of issues, once the repository is public, is the real metric.** A flood of
   *"how do I get out of this"* means the escape design failed — the single most important signal in
   the product. Requests for a phone version mean the desktop instrument is wrong. Requests for
   blocking mean the positioning failed.
4. **Local pass/fail release gates**, including the panic test and the zero-egress capture.

**What does not relax because the audience is one person.** The panic test, the zero-egress capture
and the screen-reader pass are **safety** gates, not product-validation gates. They stay. The panic
test can be run with friends or family; it does not need a user base. The moment the repository is
public, the set of people who could be harmed by a bad escape path is not empty.

### The kill criterion, agreed in advance

> If after 90 days of my own logging the button is essentially never pressed **during a real urge** —
> only on a schedule, or out of curiosity — then the reactive trigger model is wrong. The honest
> response is to make **scheduled pauses** the product, **not** to build a detector.

N=1 is a weak sample for a product and an entirely adequate one for *this* decision, because the
person keeping the log is the person the tool was built for. It is not, and must never be presented
as, evidence of efficacy for anyone else.

---

## 9. Success, defined

- A user can go from urge to their own voice in under three seconds, offline, on a five-year-old
  laptop.
- Nobody is ever trapped by this software.
- Nobody's recordings are ever lost or leaked by this software.
- The maintainer can still build, sign and ship it in 2031, having touched it a few times a year.
- Nothing in the product ever claims something it cannot do.

Everything else is secondary.

---

## See also

- [PRODUCT_REQUIREMENTS.md](PRODUCT_REQUIREMENTS.md) — requirements, scope tiers, traceability
- [SYSTEM_ARCHITECTURE.md](SYSTEM_ARCHITECTURE.md) — the architecture of record
- [docs/TECHNICAL_PLAN.md](docs/TECHNICAL_PLAN.md) — the full 30-section plan and its reasoning
- [AGENTS.md](AGENTS.md) — how to work in this repository
