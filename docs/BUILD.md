# BUILD.md

For the version of you who comes back in eighteen months.

## Prerequisites

| | |
|---|---|
| Node | 22 LTS or newer |
| pnpm | 12.x (`packageManager` in package.json pins the exact version) |
| Platform | Builds are **not** cross-platform: a macOS artifact needs macOS, a Windows artifact needs Windows |

## Install

```bash
pnpm install --frozen-lockfile
```

**Not `--ignore-scripts`.** That is the usual supply-chain advice and it does not work here:
Electron's `postinstall` is what downloads the ~230 MB runtime binary. Instead, lifecycle scripts
are **denied by default** and allowlisted explicitly in `pnpm-workspace.yaml`
(`allowBuilds: electron, esbuild`), with `electron-winstaller` explicitly denied because we ship
NSIS rather than Squirrel. That is a stricter posture than a blanket flag, not a looser one.

## Everyday commands

```bash
pnpm gates            # everything CI runs. Run this before you push.
pnpm build            # tsc (main + preload) + vite (renderer) -> dist/
pnpm start            # build, then launch Electron locally
pnpm dist:linux       # AppImage  -> release/
pnpm dist:win         # NSIS      -> release/
pnpm dist:mac         # DMG       -> release/
```

## Verifying what a machine can actually do

```bash
"release/Mind Pause-0.0.1.AppImage" --print-probe
```

Prints JSON: the detected enforcement level (`SHIELDED` / `PRESENT` / `OBSERVING`) **and the
reason**, whether a tray host exists, the resolved data paths, and versions. This is the ancestor
of `mindpause doctor` (FR-65) and it is how a support request gets the truth without anyone
clicking a tray icon.

`--diagnostics` opens the same information in a window, which is also how the renderer path gets
exercised non-interactively.

## Toolchain pins, and why

| Pin | Reason |
|---|---|
| **TypeScript 6.0.3** | **Not 7.x.** `typescript-eslint` 8.x declares `typescript: >=4.8.4 <6.1.0` and throws outright on TS 7 ([typescript-eslint#10940](https://github.com/typescript-eslint/typescript-eslint/issues/10940)). Revisit when typescript-eslint ships TS 7 support. |
| `module`/`moduleResolution: node16` | TS 7 removed `node10`; `node16` works on both lines, and relative imports therefore need explicit `.js` extensions. |
| Electron 44.x | Pinned exactly. Upgrade on a quarterly cadence; Chromium majors carry security fixes. |
| Vite `build.target: chrome152` | Matches the Chromium inside the pinned Electron. Bump both together. |
| `svelte.config.mjs`, `vite.config.mts`, `eslint.config.mjs` | `package.json` is deliberately CJS so the Electron main process is CJS. The `.m*` extensions keep the ESM config files unambiguous. |

## Linux packaging notes

- The AppImage uses electron-builder's **static type-2 runtime**, so it does **not** need
  `libfuse2` — which Ubuntu 24.04 does not install and has renamed to `libfuse2t64`. Verified by
  running `--appimage-version` on a clean 24.04 box.
- **The Chromium sandbox is left enabled.** electron-builder's default is
  `Exec=AppRun --no-sandbox %U`; `appImage.executableArgs: []` replaces that default. Verified on
  Ubuntu 24.04 / GNOME 46 / Wayland with `kernel.apparmor_restrict_unprivileged_userns=1`:
  renderers start normally with the sandbox on.
- `desktopName` + `linux.syncDesktopName` give the `.desktop` file the app-id name and set
  `StartupWMClass`, so GNOME associates the running window with the entry. Flathub also requires
  the `.desktop` filename to equal the app id.
- **`Actions=StartPause;` is deliberately not declared yet.** electron-builder writes only the
  `[Desktop Entry]` group, so declaring an action without its `[Desktop Action StartPause]` group
  produces an entry that `desktop-file-validate` rejects and launchers silently ignore. Phase 5
  adds it via an `afterPack` hook alongside the CLI verb it needs to invoke.

## Signing

**Nothing is signed in v1** — owner decision, see TECHNICAL_PLAN §23.3.1 for the per-platform
consequences and R16 for the macOS autostart risk it creates.

When that is revisited, the cheap path is ~$99/yr (Apple Developer Program) plus Certum's
**open-source** code-signing certificate (~€69+VAT plus shipping in year one, ~€29/yr after) —
the GPL-3.0 licence is what makes the project eligible for that tier. Azure Trusted Signing is
**not** available: individual eligibility is US/Canada only.

CI builds unsigned artifacts and hashes; signing happens locally, so no key that could push code
to existing installs ever lives in CI secrets.
