/**
 * Mind Pause — main process entry (Phase 0).
 *
 * Phase 0 ships an app that deliberately does almost nothing: it takes the single-instance
 * lock, puts an icon in the tray, and can open one diagnostics window. Its job is to prove the
 * pipeline — build, package, install, launch — on all three platforms before any feature work.
 *
 * What is already load-bearing here, and must not regress:
 *   - single instance per OS user, forwarding the second launch's verb (FR-63)
 *   - no window at startup: the app is tray-resident and silent
 *   - the renderer is sandboxed, context-isolated, node-integration-off
 *   - every navigation and window-open is denied
 *   - the IPC surface is a hand-written, enumerated list
 */
import { app, BrowserWindow, Menu, Tray, ipcMain, nativeImage, shell } from 'electron';
import { join } from 'node:path';
import { AUMID, PRODUCT_NAME, TRAY_TOOLTIP, APP_ID } from '../core/identity.js';
import { platformAdapter } from './platform/index.js';
import type { PlatformProbe } from './platform/types.js';

const RESOURCES = app.isPackaged
  ? join(process.resourcesPath, 'resources')
  : join(app.getAppPath(), 'resources');

const RENDERER_INDEX = join(app.getAppPath(), 'dist', 'renderer', 'index.html');

let tray: Tray | undefined;
let diagnosticsWindow: BrowserWindow | undefined;

/* ------------------------------------------------------------------ single instance */

// Must be Local-namespaced per user, never Global: fast user switching legitimately means two
// sessions each running their own copy, and protection is per-user (19.7).
if (!app.requestSingleInstanceLock({ verb: 'activate' })) {
  app.quit();
} else {
  app.on('second-instance', (_event, _argv, _cwd, additionalData) => {
    // Phase 5 routes the forwarded CLI verb into the engine's event queue. For now: show
    // diagnostics, which is the only surface that exists.
    void additionalData;
    void openDiagnostics();
  });
  void main();
}

/* ------------------------------------------------------------------ lifecycle */

async function main(): Promise<void> {
  app.setAppUserModelId(AUMID);
  app.setName(PRODUCT_NAME);

  await app.whenReady();

  // Tray-resident: no Dock tile on macOS, no window on any platform.
  app.dock?.hide();

  hardenSession();
  registerIpc();
  createTray();

  // Never quit because the last window closed — this app lives in the tray.
  app.on('window-all-closed', () => {
    /* intentionally empty */
  });
}

/* ------------------------------------------------------------------ hardening */

function hardenSession(): void {
  // Deny every navigation and every window-open request. There is no remote content, and the
  // only external URL the app may ever open is the releases page, via an explicit user action.
  app.on('web-contents-created', (_event, contents) => {
    contents.on('will-navigate', (event, url) => {
      if (!url.startsWith('file://')) event.preventDefault();
    });
    contents.setWindowOpenHandler(() => ({ action: 'deny' }));
  });
}

/* ------------------------------------------------------------------ IPC */

/**
 * The entire IPC surface. Hand-written and enumerated — no dynamic dispatch, no generic
 * invoke, and no channel that accepts a filesystem path as a parameter (18.8).
 */
function registerIpc(): void {
  ipcMain.handle('diagnostics:get', async (): Promise<PlatformProbe & { paths: Record<string, string> }> => {
    const adapter = platformAdapter();
    const probe = await adapter.probe();
    return {
      ...probe,
      paths: {
        data: adapter.dataDir(),
        state: adapter.stateDir(),
        logs: adapter.logDir(),
      },
    };
  });

  ipcMain.handle('diagnostics:versions', () => ({
    app: app.getVersion(),
    appId: APP_ID,
    electron: process.versions.electron,
    chrome: process.versions.chrome,
    node: process.versions.node,
  }));

  // The single permitted external action: reveal the data directory. Takes NO argument — the
  // main process resolves the path itself, so the renderer cannot ask for an arbitrary folder.
  ipcMain.handle('shell:revealDataDir', async () => {
    await shell.openPath(platformAdapter().dataDir());
  });
}

/* ------------------------------------------------------------------ tray */

function trayIcon(): Electron.NativeImage {
  // No `process.platform` here: which icon to use, and whether it is a template image, is
  // platform behaviour and therefore lives behind the adapter (lint rule 4).
  const { file, template } = platformAdapter().trayIcon();
  const img = nativeImage.createFromPath(join(RESOURCES, 'icons', file));
  if (template) img.setTemplateImage(true);
  return img;
}

function createTray(): void {
  tray = new Tray(trayIcon());
  tray.setToolTip(TRAY_TOOLTIP);
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: 'Start a pause', enabled: false }, // Phase 3-4
      { type: 'separator' },
      { label: 'Diagnostics…', click: () => void openDiagnostics() },
      { type: 'separator' },
      { label: `Quit ${PRODUCT_NAME}`, click: () => app.quit() },
    ]),
  );
  // A stray click must never launch anything (FR-60). In Phase 6 this opens a popover whose
  // single large button starts a pause; for now it opens diagnostics.
  tray.on('click', () => void openDiagnostics());
}

/* ------------------------------------------------------------------ diagnostics window */

async function openDiagnostics(): Promise<void> {
  if (diagnosticsWindow && !diagnosticsWindow.isDestroyed()) {
    diagnosticsWindow.show();
    diagnosticsWindow.focus();
    return;
  }
  diagnosticsWindow = new BrowserWindow({
    width: 720,
    height: 720,
    show: false,
    title: `${PRODUCT_NAME} — Diagnostics`,
    backgroundColor: '#0E0F12', // dark-first: this app runs at 01:00 in a dark room (20.2)
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(app.getAppPath(), 'dist', 'preload', 'index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      devTools: !app.isPackaged,
    },
  });
  diagnosticsWindow.on('closed', () => {
    diagnosticsWindow = undefined;
  });
  await diagnosticsWindow.loadFile(RENDERER_INDEX);
  diagnosticsWindow.show();
}
