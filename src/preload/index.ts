/**
 * The contextBridge surface — the ONLY door between renderer and main.
 *
 * Hand-written and enumerated. No dynamic dispatch, no generic `invoke(channel, ...args)`,
 * and no verb that accepts a filesystem path: the main process resolves every path itself
 * (18.8). The renderer is not a trust boundary, so this list is the attack surface.
 */
import { contextBridge, ipcRenderer } from 'electron';

const api = {
  diagnostics: {
    get: () => ipcRenderer.invoke('diagnostics:get'),
    versions: () => ipcRenderer.invoke('diagnostics:versions'),
  },
  shell: {
    /** Reveals the app's own data directory. Takes no argument, by design. */
    revealDataDir: () => ipcRenderer.invoke('shell:revealDataDir'),
  },
} as const;

contextBridge.exposeInMainWorld('mindpause', api);

export type MindPauseApi = typeof api;
