#!/usr/bin/env node
/**
 * Prove the architectural lint rules actually fire.
 *
 * A rule nobody has watched fail is a rule nobody knows is wired up — and these four are the
 * mechanism the architecture rests on (TECHNICAL_PLAN 21.2). This lints in-memory probe
 * snippets at paths that match each rule's globs, and fails if a rule that should have fired
 * did not. It also includes NEGATIVE controls, so a config that errors on everything cannot
 * masquerade as a config that works.
 *
 * Nothing is written to disk.
 */
import { ESLint } from 'eslint';

const eslint = new ESLint();

/** @type {{name:string, filePath:string, code:string, expect:string|null}[]} */
const probes = [
  {
    name: 'RULE 1  core/ may not import electron',
    filePath: 'src/core/__lintproof__a.ts',
    code: "import { app } from 'electron';\nexport const x = app;\n",
    expect: 'no-restricted-imports',
  },
  {
    name: 'RULE 1  core/ may not import node builtins',
    filePath: 'src/core/__lintproof__b.ts',
    code: "import { readFileSync } from 'node:fs';\nexport const x = readFileSync;\n",
    expect: 'no-restricted-imports',
  },
  {
    name: 'RULE 1  core/ may not import an outer layer',
    filePath: 'src/core/__lintproof__c.ts',
    code: "import { platformAdapter } from '../main/platform/index.js';\nexport const x = platformAdapter;\n",
    expect: 'no-restricted-imports',
  },
  {
    name: 'RULE 2  core/ may not read an ambient clock',
    filePath: 'src/core/__lintproof__d.ts',
    code: 'export const t = Date.now();\n',
    expect: 'no-restricted-syntax',
  },
  {
    name: 'RULE 2  core/ may not use performance.now() (stops during suspend)',
    filePath: 'src/core/__lintproof__e.ts',
    code: 'export const t = performance.now();\n',
    expect: 'no-restricted-syntax',
  },
  {
    name: 'RULE 2  core/ may not use Math.random()',
    filePath: 'src/core/__lintproof__f.ts',
    code: 'export const r = Math.random();\n',
    expect: 'no-restricted-syntax',
  },
  {
    name: 'RULE 3  no innerHTML anywhere',
    filePath: 'src/renderer/__lintproof__g.ts',
    code: 'export function paint(el: HTMLElement, s: string) { el.innerHTML = s; }\n',
    expect: 'no-restricted-syntax',
  },
  {
    name: 'RULE 3  no insertAdjacentHTML anywhere',
    filePath: 'src/main/__lintproof__h.ts',
    code: 'export function paint(el: any, s: string) { el.insertAdjacentHTML("beforeend", s); }\n',
    expect: 'no-restricted-syntax',
  },
  {
    name: 'RULE 3  no {@html} in Svelte',
    filePath: 'src/renderer/__lintproof__i.svelte',
    code: '<script lang="ts">let s = "x";</script>\n{@html s}\n',
    expect: 'svelte/no-at-html-tags',
  },
  {
    name: 'RULE 4  process.platform is banned outside platform/index.ts',
    filePath: 'src/main/__lintproof__j.ts',
    code: "export const isMac = process.platform === 'darwin';\n",
    expect: 'no-restricted-syntax',
  },
  {
    name: 'NFR-30  no network module imports in src/',
    filePath: 'src/main/__lintproof__k.ts',
    code: "import { request } from 'node:https';\nexport const x = request;\n",
    expect: 'no-restricted-imports',
  },
  {
    name: 'NFR-30  no fetch() in src/',
    filePath: 'src/main/__lintproof__l.ts',
    code: 'export const go = () => fetch("https://example.com");\n',
    expect: 'no-restricted-globals',
  },

  /* ---- negative controls: these MUST NOT error, or the config is simply broken ---- */
  {
    name: 'CONTROL  platform/index.ts may use process.platform',
    filePath: 'src/main/platform/__lintproof__m.ts',
    code: "export const p: string = process.platform;\n",
    expect: null,
  },
  {
    name: 'CONTROL  ordinary core code is clean',
    filePath: 'src/core/__lintproof__n.ts',
    code: 'export function add(a: number, b: number): number { return a + b; }\n',
    expect: null,
  },
];

let failures = 0;
for (const probe of probes) {
  const [result] = await eslint.lintText(probe.code, { filePath: probe.filePath, warnIgnored: true });
  const messages = result?.messages ?? [];

  // An ignored probe would report zero errors and look like a pass for the negative controls
  // while silently voiding every positive one. That happened once; it must never pass quietly.
  if (messages.some((m) => m.ruleId === null && /ignore/i.test(m.message))) {
    console.error(`  FAIL  ${probe.name}\n        probe path is IGNORED by eslint.config.mjs — the probe proved nothing.`);
    failures++;
    continue;
  }
  const ruleIds = messages.filter((m) => m.severity === 2).map((m) => m.ruleId);

  if (probe.expect === null) {
    if (ruleIds.length > 0) {
      console.error(`  FAIL  ${probe.name}\n        expected no errors, got: ${ruleIds.join(', ')}`);
      failures++;
    } else {
      console.log(`  ok    ${probe.name}`);
    }
    continue;
  }

  if (ruleIds.includes(probe.expect)) {
    console.log(`  ok    ${probe.name}`);
  } else {
    console.error(
      `  FAIL  ${probe.name}\n        expected rule "${probe.expect}" to fire; got: ${ruleIds.join(', ') || '(nothing)'}`,
    );
    failures++;
  }
}

console.log('');
if (failures > 0) {
  console.error(`prove-lint-rules: ${failures} of ${probes.length} probes FAILED — the architecture is not being enforced.`);
  process.exit(1);
}
console.log(`prove-lint-rules: all ${probes.length} probes passed. The architectural rules are wired up.`);
