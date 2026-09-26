<script lang="ts">
  /**
   * Phase 0 diagnostics. This is the ancestor of `mind-pause doctor`: it reports what the app
   * can ACTUALLY do on this machine, which is the honesty mechanism the whole product rests on
   * (14.3). It never claims a capability it has not probed.
   */
  type Probe = {
    platform: string;
    sessionDescription: string;
    enforcement: 'SHIELDED' | 'PRESENT' | 'OBSERVING';
    enforcementReason: string;
    tray: 'registered' | 'no-watcher' | 'unknown';
    trayReason: string;
    sandboxed: boolean;
    paths: Record<string, string>;
  };
  type Versions = Record<string, string>;

  const api = (globalThis as unknown as { mindpause: any }).mindpause;

  let probe = $state<Probe | null>(null);
  let versions = $state<Versions | null>(null);

  $effect(() => {
    void api.diagnostics.get().then((p: Probe) => (probe = p));
    void api.diagnostics.versions().then((v: Versions) => (versions = v));
  });

  /** The copy each enforcement level is PERMITTED to use. Never more than the level says. */
  const copy: Record<string, string> = {
    SHIELDED: 'Your screen is held for the length of the pause.',
    PRESENT: 'Mind Pause stays on top for the length of the pause.',
    OBSERVING: "Your pause runs. On this desktop Mind Pause can't stay on top — it's a reminder, not a cover.",
  };
</script>

<main>
  <h1>Mind Pause</h1>
  <p class="sub">Phase 0 — pipeline check. No pause engine yet.</p>

  {#if probe}
    <section>
      <h2>What this machine can actually do</h2>
      <div class="row">
        <span class="k">Session</span><span class="v">{probe.sessionDescription}</span>
      </div>
      <div class="row">
        <span class="k">Enforcement</span>
        <span class="v"><span class="tag tag-{probe.enforcement.toLowerCase()}">{probe.enforcement}</span></span>
      </div>
      <p class="why">{probe.enforcementReason}</p>
      <p class="claim">Permitted copy: <em>{copy[probe.enforcement]}</em></p>

      <div class="row">
        <span class="k">Tray</span>
        <span class="v"><span class="tag tag-{probe.tray === 'registered' ? 'shielded' : 'observing'}">{probe.tray}</span></span>
      </div>
      <p class="why">{probe.trayReason}</p>

      {#if probe.sandboxed}
        <p class="why warn">Running sandboxed — privileged compositor protocols are hidden from us.</p>
      {/if}
    </section>

    <section>
      <h2>Where your files would live</h2>
      {#each Object.entries(probe.paths) as [name, path] (name)}
        <div class="row"><span class="k">{name}</span><span class="v mono">{path}</span></div>
      {/each}
      <button onclick={() => api.shell.revealDataDir()}>Open the data folder</button>
    </section>
  {:else}
    <p class="sub">Probing…</p>
  {/if}

  {#if versions}
    <section>
      <h2>Build</h2>
      {#each Object.entries(versions) as [name, value] (name)}
        <div class="row"><span class="k">{name}</span><span class="v mono">{value}</span></div>
      {/each}
    </section>
  {/if}
</main>

<style>
  main { max-width: 640px; margin: 0 auto; padding: 40px 28px 64px; }
  h1 { font-size: 22px; font-weight: 600; margin: 0; }
  .sub { color: var(--muted); margin: 4px 0 28px; }
  section { background: var(--raised); border: 1px solid var(--line); border-radius: 10px; padding: 18px 20px; margin-bottom: 18px; }
  h2 { font-size: 13px; font-weight: 600; text-transform: none; color: var(--muted); margin: 0 0 14px; }
  .row { display: flex; gap: 16px; padding: 5px 0; align-items: baseline; }
  .k { flex: 0 0 96px; color: var(--muted); font-size: 13px; }
  .v { flex: 1; word-break: break-all; }
  .mono { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 12.5px; }
  .why { color: var(--muted); font-size: 13px; margin: 8px 0 14px; }
  .warn { color: var(--warn); }
  .claim { font-size: 13px; margin: 0 0 14px; }
  .claim em { color: var(--accent); font-style: normal; }
  .tag { font-size: 11px; letter-spacing: 0.04em; padding: 2px 8px; border-radius: 999px; border: 1px solid var(--line); }
  .tag-shielded { color: var(--accent); border-color: var(--accent); }
  .tag-present { color: var(--text); }
  .tag-observing { color: var(--warn); border-color: var(--warn); }
  button { margin-top: 12px; background: transparent; color: var(--text); border: 1px solid var(--line); border-radius: 7px; padding: 9px 14px; font: inherit; font-size: 13px; cursor: pointer; min-height: 44px; }
  button:hover { border-color: var(--accent); }
  button:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
</style>
