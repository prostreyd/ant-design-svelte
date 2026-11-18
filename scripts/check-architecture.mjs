// `npm run check:docs` also runs this: the dependencies between the components of the library follow rule 6b of the
// rules for AI assistants. A component may render another public component, use a shared primitive from
// `src/lib/internal/`, or neither; what it may not do is reach into another component's private files, make a cycle,
// or add a dependency that nobody wrote down. The check reads the imports of `src/lib/` and the "## Dependencies"
// section of every `specs/<component>.md`:
//
//   node scripts/check-architecture.mjs
//
//  1. `internal/` imports no component.
//  2. A component imports another component only through a file that `src/lib/index.ts` exports (its public surface),
//     never through its private files, and never through the package entry itself.
//  3. Every such import is listed in DEPENDENCIES below with the reason, and every listed dependency is still in the
//     code (a stale entry fails).
//  4. The components make no cycle.
//  5. The specification of a component has a "## Dependencies" section that names every component it imports and
//     every primitive (a folder of `internal/`) it uses. A specification written before the rule (LEGACY) may lack the
//     section and is only reported.
//
// Imports that only name types (`import type`) cost nothing at run time: they are checked for the public surface (2)
// but need no entry in DEPENDENCIES and make no cycle.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { posix } from 'node:path';
import { fileURLToPath } from 'node:url';

export const HEADING = '## Dependencies';

/** The folder of the shared parts that no component owns; it is never part of the public API. */
export const INTERNAL = 'internal';

/**
 * The components that render another public component, with the reason. Adding an entry is a decision of the owner:
 * it is written in the specification of the component (rule 6b), and the new edge must not close a cycle.
 * @type {{ from: string, to: string, why: string }[]}
 */
export const DEPENDENCIES = [
  { from: 'Input', to: 'Button', why: 'InputSearch draws the same button the user sees for `enterButton`' },
  { from: 'Modal', to: 'Button', why: 'the OK and Cancel buttons are the same element the user sees elsewhere, set with the same props (`okButtonProps`)' }
];

/** Specifications that predate rule 6b (2026-11-17) and have no dependencies section yet. */
export const LEGACY = [];

/**
 * The imports of a source file: static `import` and `export ... from`, and `import()`.
 * @param {string} source
 * @returns {{ specifier: string, type: boolean }[]}
 */
export function parseImports(source) {
  const text = source.replace(/<!--[\s\S]*?-->/g, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  const found = [];
  for (const match of text.matchAll(/(?:^|[\n;>{}])\s*(?:import|export)\s+(type\s+)?([^'";]*?)\bfrom\s+['"]([^'"]+)['"]/g)) {
    // `import type { A }` and `import { type A, type B }` name types only: nothing is loaded at run time.
    const members = match[2].includes('{') ? match[2].replace(/[{}]/g, '').split(',').map((part) => part.trim()).filter(Boolean) : [];
    const onlyTypes = members.length > 0 && !/^[\w$]+\s*,/.test(match[2].trim()) && members.every((part) => part.startsWith('type '));
    found.push({ specifier: match[3], type: Boolean(match[1]) || onlyTypes });
  }
  for (const match of text.matchAll(/(?:^|[\n;>{}])\s*import\s+['"]([^'"]+)['"]/g)) found.push({ specifier: match[1], type: false });
  for (const match of text.matchAll(/\bimport\(\s*['"]([^'"]+)['"]\s*\)/g)) found.push({ specifier: match[1], type: false });
  return found;
}

/** `types.js` and `types.ts` are the same module. */
const normalize = (path) => path.replace(/\.js$/, '.ts');

/** `InputNumber` is specified in `input-number.md`. */
export const specName = (folder) => folder.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();

/**
 * The imports between the folders of `src/lib/`.
 * @param {Record<string, string>} files source of every `.ts` and `.svelte` file, keyed by the path under `src/lib/`
 * @returns {{ from: string, to: string, target: string, type: boolean, file: string }[]}
 */
export function importsBetweenFolders(files) {
  const edges = [];
  for (const [file, source] of Object.entries(files)) {
    const from = file.split('/')[0];
    if (!file.includes('/')) continue; // the package entry and the other top-level files may import anything
    for (const { specifier, type } of parseImports(source)) {
      if (!specifier.startsWith('.')) continue;
      const target = normalize(posix.normalize(posix.join(posix.dirname(file), specifier)));
      const to = target.includes('/') ? target.split('/')[0] : '(entry)';
      if (to === from) continue;
      edges.push({ from, to, target, type, file });
    }
  }
  return edges;
}

/** The files that `src/lib/index.ts` exports: the public surface of every component. */
export function publicFiles(indexSource) {
  return new Set(
    parseImports(indexSource)
      .filter(({ specifier }) => specifier.startsWith('./'))
      .map(({ specifier }) => normalize(posix.normalize(specifier)))
  );
}

/** The first cycle among the runtime edges between components, as a list of names, or null. */
export function findCycle(edges) {
  const graph = new Map();
  for (const { from, to } of edges) {
    if (!graph.has(from)) graph.set(from, new Set());
    graph.get(from).add(to);
  }
  const state = new Map();
  const path = [];
  const visit = (node) => {
    state.set(node, 'open');
    path.push(node);
    for (const next of graph.get(node) ?? []) {
      if (state.get(next) === 'open') return [...path.slice(path.indexOf(next)), next];
      if (!state.has(next)) {
        const cycle = visit(next);
        if (cycle) return cycle;
      }
    }
    path.pop();
    state.set(node, 'done');
    return null;
  };
  for (const node of graph.keys()) {
    if (!state.has(node)) {
      const cycle = visit(node);
      if (cycle) return cycle;
    }
  }
  return null;
}

/** The text of the "## Dependencies" section of a specification, or null when there is none. */
export function dependenciesSection(markdown) {
  const start = markdown.search(/^## Dependencies\s*$/m);
  if (start < 0) return null;
  const rest = markdown.slice(start + HEADING.length);
  const end = rest.search(/^## /m);
  return end < 0 ? rest : rest.slice(0, end);
}

/**
 * @param {{
 *   files: Record<string, string>,
 *   indexSource: string,
 *   specs: Record<string, string>,
 *   dependencies?: { from: string, to: string, why: string }[],
 *   legacy?: string[]
 * }} input `specs` is keyed by the name of the file without `.md`
 * @returns {{ errors: string[], legacy: string[], components: string[] }}
 */
export function checkArchitecture({ files, indexSource, specs, dependencies = DEPENDENCIES, legacy = LEGACY }) {
  const errors = [];
  const edges = importsBetweenFolders(files);
  const publics = publicFiles(indexSource);
  const components = [...new Set(Object.keys(files).filter((file) => file.includes('/')).map((file) => file.split('/')[0]))]
    .filter((folder) => folder !== INTERNAL)
    .sort();

  for (const edge of edges) {
    const at = `src/lib/${edge.file}`;
    if (edge.to === '(entry)') {
      errors.push(`${at}: imports the package entry (${edge.target}); import the component file instead`);
    } else if (edge.from === INTERNAL && edge.to !== INTERNAL) {
      errors.push(`${at}: \`internal/\` imports the component ${edge.to} (${edge.target}); shared parts must not depend on components`);
    } else if (edge.from !== INTERNAL && edge.to !== INTERNAL) {
      if (!publics.has(edge.target)) {
        errors.push(`${at}: imports ${edge.target}, a private file of ${edge.to}; use a file that src/lib/index.ts exports`);
      }
      if (!edge.type && !dependencies.some((entry) => entry.from === edge.from && entry.to === edge.to)) {
        errors.push(
          `${at}: ${edge.from} renders ${edge.to}, which is not in DEPENDENCIES (scripts/check-architecture.mjs); add it with the reason and list it in specs/${specName(edge.from)}.md under "${HEADING}" (rule 6b)`
        );
      }
    }
  }

  const runtime = edges.filter((edge) => !edge.type && edge.from !== INTERNAL && edge.to !== INTERNAL && edge.to !== '(entry)');
  for (const entry of dependencies) {
    if (!runtime.some((edge) => edge.from === entry.from && edge.to === entry.to)) {
      errors.push(`DEPENDENCIES lists ${entry.from} -> ${entry.to}, but the code does not import it; remove the entry`);
    }
    if (entry.why.trim().length < 15) errors.push(`DEPENDENCIES ${entry.from} -> ${entry.to}: the reason is missing or too short`);
  }
  const cycle = findCycle(runtime);
  if (cycle) errors.push(`the components make a cycle: ${cycle.join(' -> ')}; a shared part belongs in internal/ (rule 6b)`);

  const withLegacy = [];
  for (const component of components) {
    const name = specName(component);
    const spec = specs[name];
    if (spec === undefined) {
      errors.push(`src/lib/${component}/ has no specification (specs/${name}.md)`);
      continue;
    }
    const section = dependenciesSection(spec);
    if (section === null) {
      if (legacy.includes(name)) withLegacy.push(name);
      else errors.push(`specs/${name}.md: no "${HEADING}" section (rule 6b)`);
      continue;
    }
    const used = new Set(runtime.filter((edge) => edge.from === component).map((edge) => edge.to));
    for (const dependency of used) {
      if (!new RegExp(`\\b${dependency}\\b`).test(section)) errors.push(`specs/${name}.md: "${HEADING}" does not name the component ${dependency}`);
    }
    const primitives = new Set(
      edges
        .filter((edge) => edge.from === component && edge.to === INTERNAL && edge.target.split('/').length > 2)
        .map((edge) => edge.target.split('/')[1])
    );
    for (const primitive of primitives) {
      if (!new RegExp(`\\b${primitive}\\b`, 'i').test(section)) errors.push(`specs/${name}.md: "${HEADING}" does not name the primitive internal/${primitive}`);
    }
  }
  for (const name of legacy) {
    if (specs[name] === undefined) errors.push(`LEGACY lists "${name}", but specs/${name}.md does not exist`);
  }
  return { errors, legacy: withLegacy, components };
}

/**
 * Reads `src/lib/`, its entry and the specifications of a checkout.
 * @param {string} root
 * @returns {{ files: Record<string, string>, indexSource: string, specs: Record<string, string> }}
 */
export function readRepository(root) {
  /** @type {Record<string, string>} */
  const files = {};
  const walk = (directory) => {
    for (const entry of readdirSync(directory)) {
      const path = `${directory}/${entry}`;
      if (statSync(path).isDirectory()) walk(path);
      else if (/\.(ts|svelte)$/.test(entry)) files[path.slice(`${root}/src/lib/`.length)] = readFileSync(path, 'utf8');
    }
  };
  walk(`${root}/src/lib`);
  /** @type {Record<string, string>} */
  const specs = {};
  if (existsSync(`${root}/specs`)) {
    for (const file of readdirSync(`${root}/specs`).filter((name) => name.endsWith('.md'))) {
      specs[file.slice(0, -3)] = readFileSync(`${root}/specs/${file}`, 'utf8');
    }
  }
  return { files, indexSource: files['index.ts'] ?? '', specs };
}

function main() {
  const root = fileURLToPath(new URL('..', import.meta.url)).replace(/\/$/, '');
  const result = checkArchitecture(readRepository(root));
  if (result.errors.length) {
    console.error(`Architecture: ${result.errors.length} problem(s)`);
    for (const message of result.errors) console.error(`  ${message}`);
    process.exit(1);
  }
  console.log(`Architecture: ${result.components.length} components, ${DEPENDENCIES.length} dependencies between components, no cycles.`);
  if (result.legacy.length) console.log(`  Without a dependencies section yet (written before rule 6b): ${result.legacy.join(', ')}.`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main();
