// Which checks a change needs: the plan of `npm run test:affected` (CLAUDE.md 8a).
//
// A pure module: it reads the folder, runs nothing, and answers "given these changed files, what must run?". The
// import graph of `src/lib` is read from the code, so nobody has to remember which component uses which. The direction
// matters: a change in Button can break Input, which uses it; a change in Input cannot break Button. So the checks of a
// changed file are those of the file and of everything that imports it, directly or not.
//
// What cannot be known from imports (design tokens, global CSS, configuration) runs everything, and so does a file the
// rules do not know: a wrong guess in that direction costs time, a wrong guess in the other direction costs a bug.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, posix } from 'node:path';

export const ENGINES = ['chromium', 'firefox', 'webkit'];

const slash = (path) => path.split('\\').join('/');

function listFiles(dir, accept, out = []) {
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      if (name !== 'node_modules') listFiles(full, accept, out);
    } else if (accept(name)) {
      out.push(full);
    }
  }
  return out;
}

const relative = (root, full) => slash(full.slice(root.length + 1));

/** The files of the library, relative to the repository, with slashes. */
export function libraryFiles(root) {
  return listFiles(join(root, 'src/lib'), (name) => /\.(ts|js|svelte)$/.test(name)).map((full) => relative(root, full));
}

function resolveImport(from, specifier, known) {
  const base = posix.normalize(posix.join(posix.dirname(from), specifier));
  const candidates = [base, base.replace(/\.js$/, '.ts'), `${base}.ts`, `${base}.svelte`, `${base}.js`, `${base}/index.ts`];
  return candidates.find((candidate) => known.has(candidate));
}

/** For each file of the library, the files that import it. */
export function importers(root) {
  const files = libraryFiles(root);
  const known = new Set(files);
  const result = new Map(files.map((file) => [file, new Set()]));
  for (const file of files) {
    const text = readFileSync(join(root, file), 'utf8');
    for (const match of text.matchAll(/(?:from|import)\s*\(?\s*['"](\.{1,2}\/[^'"]+)['"]/g)) {
      const target = resolveImport(file, match[1], known);
      if (target) result.get(target).add(file);
    }
  }
  return result;
}

/** The changed files and everything that imports them, however far. */
export function reachedBy(graph, changed) {
  const seen = new Set();
  const queue = [...changed];
  while (queue.length > 0) {
    const file = queue.pop();
    if (seen.has(file)) continue;
    seen.add(file);
    for (const parent of graph.get(file) ?? []) queue.push(parent);
  }
  return seen;
}

/** The folders of `src/lib` that hold a component (not the internal helpers). */
export function componentFolders(root) {
  const lib = join(root, 'src/lib');
  if (!existsSync(lib)) return [];
  return readdirSync(lib)
    .filter((name) => name !== 'internal' && statSync(join(lib, name)).isDirectory())
    .filter((name) => listFiles(join(lib, name), (file) => file.endsWith('.svelte')).length > 0)
    .sort();
}

/** The names of the component pages of the site (its `components/<slug>/` routes). */
function componentSlugs(root) {
  const routes = join(root, 'docs/src/routes/[[lang=lang]]/components');
  if (!existsSync(routes)) return [];
  return readdirSync(routes).filter((name) => statSync(join(routes, name)).isDirectory());
}

function specFiles(root) {
  const dir = join(root, 'e2e');
  return existsSync(dir) ? readdirSync(dir).filter((name) => name.endsWith('.spec.ts')).map((name) => `e2e/${name}`) : [];
}

/** The tests of the site that belong to one component page: its own block and its page in every language and theme. */
function componentPageFilter(name, slug) {
  return `${name} page|components/${slug}/ has no`;
}

const NONE = 'none';
const ALL = 'all';

/**
 * What a file means for the checks.
 * `[pattern, effect, why]`; the first pattern that matches wins. An effect is a name, or a function of the match.
 */
const RULES = [
  [/^(ai|specs|notes|tasks|prompts|ai-chats)\//, NONE, 'text: nothing to run in a browser'],
  [/\.md$/, NONE, 'text: nothing to run in a browser'],
  [/^(LICENSE|VERSION|\.gitignore|\.gitattributes|\.npmignore)$/, NONE, 'no code'],
  [/^\.github\//, NONE, 'a workflow: the branch pushed to GitHub runs it'],
  [/^scripts\//, NONE, 'a script with its own tests and checks'],
  [/^tests\//, NONE, 'unit tests: they run in full every time'],
  [/^src\/lib\/tokens(-accessible)?\.css$/, ALL, 'design tokens reach every component through var()'],
  [/^src\/lib\/index\.ts$/, ALL, 'the exports of the whole library'],
  [/^src\/lib\//, 'library', 'library code'],
  [/^e2e\/(fixtures\/|main\.ts)/, 'lib-all', 'shared part of the browser tests of the library'],
  [/^e2e\/[^/]+\.spec\.ts$/, 'lib-spec', 'a browser test of the library'],
  [/^(playwright|vite\.e2e)\.config\.ts$/, 'lib-all', 'configuration of the browser tests of the library'],
  [/^(package(-lock)?\.json|svelte\.config\.js|tsconfig[^/]*\.json|vitest\.config\.ts|eslint\.config\.[jt]s)$/, ALL, 'configuration or dependencies'],
  [/^docs\/e2e\//, 'docs-all', 'the browser tests of the site'],
  [/^docs\/(playwright\.config\.ts|vite\.config\.ts|svelte\.config\.js|package\.json|scripts\/)/, 'docs-all', 'configuration of the site'],
  [/^docs\/src\/routes\/\[\[lang=lang\]\]\/components\/\+page\.svelte$/, 'docs-overview', 'the overview of the components'],
  [/^docs\/src\/routes\/\[\[lang=lang\]\]\/components\/([a-z0-9-]+)\//, 'docs-component', 'a component page'],
  [/^docs\/src\/docs\/(?:examples|data)\/([a-z0-9-]+)(?:\/|\.ts$)/, 'docs-component', 'examples or tables of a component page'],
  [/^docs\/src\/docs\/([a-z0-9-]+)-examples\.ts$/, 'docs-component', 'examples of a component page'],
  [/^docs\/src\/routes\/\[\[lang=lang\]\]\/docs\/([a-z0-9-]+)\//, 'docs-prose', 'a page of the documentation'],
  [/^docs\/src\/routes\/\[\[lang=lang\]\]\/\+page\.svelte$/, 'docs-home', 'the home page'],
  [/^docs\/(src|static)\//, 'docs-all', 'the whole site: styles, parts, texts, layout, page registry']
];

/**
 * The plan for a list of changed files (relative to the repository, with slashes).
 * `options.all` plans everything; `options.engines` are the browser engines of the end-to-end tests.
 */
export function planFor(changedFiles, options = {}) {
  const root = options.root;
  const files = [...new Set(changedFiles.map(slash))].filter((file) => file !== '' && !file.startsWith('node_modules'));
  const plan = {
    engines: options.engines ?? ENGINES,
    all: null,
    lib: { all: false, specs: [], components: [] },
    docs: { all: false, filters: [] },
    floor: false,
    notes: []
  };
  const libChanged = [];
  const specs = new Set();
  const filters = new Set();
  const components = new Set();
  const note = (file, text) => plan.notes.push({ file, text });

  if (options.all) {
    plan.all = 'everything was asked for';
    plan.lib.all = true;
    plan.docs.all = true;
    plan.floor = true;
    return plan;
  }

  const slugs = componentSlugs(root);
  const folders = componentFolders(root);
  const nameOf = (slug) => folders.find((folder) => folder.toLowerCase() === slug) ?? slug.charAt(0).toUpperCase() + slug.slice(1);

  for (const file of files) {
    const rule = RULES.find(([pattern]) => pattern.test(file));
    if (!rule) {
      plan.all ??= `${file}: a file that no rule knows`;
      note(file, 'unknown file: everything runs');
      continue;
    }
    const [pattern, effect, why] = rule;
    const match = pattern.exec(file);
    if (effect === NONE) note(file, why);
    else if (effect === ALL) {
      plan.all ??= `${file}: ${why}`;
      note(file, `${why}: everything runs`);
    } else if (effect === 'library') {
      libChanged.push(file);
      note(file, why);
    } else if (effect === 'lib-all') {
      plan.lib.all = true;
      note(file, `${why}: all browser tests of the library`);
    } else if (effect === 'lib-spec') {
      specs.add(file);
      note(file, why);
    } else if (effect === 'docs-all') {
      plan.docs.all = true;
      note(file, `${why}: all browser tests of the site`);
    } else if (effect === 'docs-overview') {
      filters.add('components overview|components/ has no');
      note(file, why);
    } else if (effect === 'docs-home') {
      filters.add('home page|theme (/ru/|/zh/|/) has no');
      note(file, why);
    } else if (effect === 'docs-prose') {
      filters.add(`docs/${match[1]}/ has no`);
      if (match[1] === 'getting-started') filters.add('installation tabs');
      note(file, why);
    } else if (effect === 'docs-component') {
      const slug = match[1];
      if (slugs.includes(slug)) {
        filters.add(componentPageFilter(nameOf(slug), slug));
        note(file, `${why}: the page of ${nameOf(slug)}`);
      } else {
        plan.docs.all = true;
        note(file, `${why}, but no page of that name: all browser tests of the site`);
      }
    }
  }

  if (plan.all) {
    plan.lib.all = true;
    plan.docs.all = true;
    plan.floor = true;
    return plan;
  }

  if (libChanged.length > 0) {
    plan.floor = libChanged.some((file) => !file.endsWith('.md'));
    const reached = reachedBy(importers(root), libChanged);
    const available = specFiles(root);
    const prefixes = new Set();
    for (const file of reached) {
      const [, , folder] = file.split('/');
      if (file.startsWith('src/lib/internal/popup/')) prefixes.add('popup');
      else if (folders.includes(folder)) {
        prefixes.add(folder.toLowerCase());
        components.add(folder);
      }
    }
    for (const prefix of prefixes) for (const spec of available) if (spec.startsWith(`e2e/${prefix}`)) specs.add(spec);
    if (components.size > 0 && available.includes('e2e/forced-colors.spec.ts')) specs.add('e2e/forced-colors.spec.ts');
    for (const name of components) {
      const slug = name.toLowerCase();
      if (slugs.includes(slug)) filters.add(componentPageFilter(name, slug));
    }
  }

  plan.lib.specs = [...specs].sort();
  plan.lib.components = [...components].sort();
  plan.docs.filters = plan.docs.all ? [] : [...filters].sort();
  return plan;
}

/** Whether the plan has end-to-end tests of the library to run. */
export const runsLibrary = (plan) => plan.lib.all || plan.lib.specs.length > 0;

/** Whether the plan has end-to-end tests of the site to run. */
export const runsDocs = (plan) => plan.docs.all || plan.docs.filters.length > 0;
