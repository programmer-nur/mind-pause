# Contributing to Mind Pause

Thank you — genuinely. This is a one-maintainer project with a five-year horizon, so the things
that make a contribution easy to accept are mostly about *not* increasing the surface area.

**Read [AGENTS.md](AGENTS.md) first.** It is the operational contract: the invariants, how to add
a state or a platform behaviour, and the release gates. This file is just the on-ramp.

## Before you write code

1. **Check the exclusion list** in [PRODUCT_REQUIREMENTS §4.4](PRODUCT_REQUIREMENTS.md). It is
   long and deliberate — accounts, sync, streaks, any history, website blocking, URL/process
   detection, a mobile app, auto-update, watchdogs. Each entry has a one-line reason. A PR that
   adds one of these will be declined however good the code is.
2. **Open an issue first** for anything beyond a bug fix. A rejected PR wastes your evening.
3. **Some changes need an ADR before the code**: the protection policy, the escape path, the
   persistence format, the media profile, the shell or frontend framework, the threat model, or
   anything that adds a network dependency, a privileged component, or an OS permission prompt.

## The rules that are enforced mechanically

Four architectural lint rules hold this codebase up. They are not style preferences — each one
prevents a specific failure described in the plan, and `pnpm lint:prove` asserts that every one
of them actually fires (including negative controls, because a config that errors on everything
is just as broken as one that errors on nothing).

| Rule | |
|---|---|
| 1 | `src/core/**` imports nothing — no `electron`, no `node:*`, no outer layer |
| 2 | No `Date.now()`, `new Date()`, `performance.now()` or `Math.random()` in `src/core/**`. Clocks are injected. |
| 3 | No `innerHTML` / `outerHTML` / `insertAdjacentHTML` / `{@html}` anywhere |
| 4 | `process.platform` appears only in `src/main/platform/index.ts` |

Plus, in CI: **no HTTP client, socket library, or network-capable package may enter the
dependency graph**, and no source file may call a network global. That check is what turns "we
send nothing" from a promise into a property a stranger can verify.

## Running the gates

```bash
pnpm install --frozen-lockfile   # NOT --ignore-scripts; see the note in pnpm-workspace.yaml
pnpm gates                       # everything CI runs
```

Individually: `pnpm lint` · `pnpm typecheck` · `pnpm lint:prove` · `pnpm deps:check` ·
`pnpm identity:check` · `pnpm test`

## Adding a dependency

Answer these in the PR description:

1. Does it pull in a network client or socket library? → it will be declined; `deps:check` fails anyway.
2. Can it read window titles, URLs, process lists, keystrokes, the clipboard, or the screen? → declined.
3. Is it a *runtime* renderer dependency? → almost certainly declined. We target **zero**: every
   frontend package is a direct path from an XSS to the whole IPC surface.
4. Is the licence compatible, and does `pnpm notices` regenerate cleanly?
5. Could you vendor or replace it in 2031 if it were abandoned?

## Writing user-facing copy

Read every string aloud imagining the worst possible moment: someone who has just lost money they
needed, at 3am. If it would make that person feel **watched, graded, or mocked**, it fails.

- Describe the situation, never the person. **No evaluative adjective — including positive ones.**
- Every instruction is an invitation with a stated out.
- No counting, no comparison, no streaks.
- No clinical vocabulary applied to the user.

Banned strings are a release gate: `block`, `lock`, `prevent`, `impossible`, `streak`, `relapse`,
`failure`, and anything of the form "you can't leave until…".

## Platform claims

If you believe something in the plan about a platform is wrong, **check it against primary
documentation and say so explicitly in the PR**. Several first-pass claims in the research behind
this plan were wrong and were caught exactly that way. Do not silently act on a hunch — and do not
silently accept a claim either.

## Reporting a security issue

Please do not open a public issue. Email the maintainer address in `package.json`. Because there
is no server, no account and no network code, the realistic classes are: a path that lets the
renderer reach something it should not, a dependency that reaches the network, or a way to leave
enforcement running with no valid session. That last one is the one we care about most.
