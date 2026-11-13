// `npm run check:docs` also runs this: every `specs/<component>.md` has a "## Quality matrix" section that is filled
// in (rule 7a of the rules for AI assistants). The matrix says, per component, how each kind of problem that a
// text-only reading of the specification does not see is covered: by a test, by a manual check with a date, or not
// at all, with the reason. An empty or made-up cell fails the check, so the matrix cannot drift into a list of
// promises: a test cell must name files and scripts that exist.
//
//   node scripts/check-quality-matrix.mjs
//
// A specification written before the rule (LEGACY) may lack the matrix and is only reported; once it has one, the
// matrix is checked like any other. Remove a name from LEGACY when its matrix is written.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const HEADING = '## Quality matrix';

/** The rows of the matrix, in this order. */
export const ROWS = ['WAI-ARIA', 'Forced colors', 'IME', 'Touch', 'Browsers', 'Browser floor', 'Screen reader'];

/**
 * `test`: an automated test or script, named in backticks (a path or `npm run <script>` that exists).
 * `manual`: checked by hand, with the date (YYYY-MM-DD) and what was used.
 * `manual pending`: needs a manual check that has not been done; allowed only where a machine cannot do it.
 * `n/a`: does not apply to the component, with the reason.
 */
export const STATUSES = ['test', 'manual', 'manual pending', 'n/a'];

/** The rows in which a check can wait for a person (a real screen reader, a real keyboard, a touch device). */
export const MANUAL_ONLY_ROWS = ['Screen reader', 'IME', 'Touch'];

/** Specifications that predate rule 7a (2026-11-13) and have no matrix yet. */
export const LEGACY = ['button', 'checkbox', 'input', 'popup', 'select', 'switch'];

const MIN_REASON = 15;

/**
 * Reads the matrix of a specification.
 * @param {string} markdown
 * @returns {{ found: boolean, rows: { row: string, status: string, where: string }[], problems: string[] }}
 */
export function parseMatrix(markdown) {
  const lines = markdown.split('\n');
  const start = lines.findIndex((line) => line.trim() === HEADING);
  if (start === -1) return { found: false, rows: [], problems: [] };
  const rows = [];
  const problems = [];
  let header = true;
  for (let index = start + 1; index < lines.length; index++) {
    const line = lines[index].trim();
    if (/^##\s/.test(line)) break;
    if (!line.startsWith('|')) continue;
    const cells = line.replace(/^\||\|$/g, '').split('|').map((cell) => cell.trim());
    if (cells.every((cell) => /^:?-{3,}:?$/.test(cell))) continue;
    if (header) {
      header = false;
      continue;
    }
    if (cells.length !== 3) {
      problems.push(`the row "${cells[0]}" has ${cells.length} cells, three are needed (Row, Status, Where)`);
      continue;
    }
    rows.push({ row: cells[0], status: cells[1], where: cells[2] });
  }
  if (!rows.length && !problems.length) problems.push('the table under the heading is missing or has no rows');
  return { found: true, rows, problems };
}

/**
 * Checks the matrix of one specification.
 * @param {string} markdown
 * @param {{ exists: (path: string) => boolean, scripts: string[] }} environment what the repository has
 * @returns {{ errors: string[], pending: string[] }} `pending`: the rows that wait for a manual check
 */
export function checkMatrix(markdown, environment) {
  const { found, rows, problems } = parseMatrix(markdown);
  const errors = [...problems];
  const pending = [];
  if (!found) return { errors: [`no "${HEADING}" section`], pending };

  for (const name of ROWS) {
    const count = rows.filter((entry) => entry.row === name).length;
    if (count === 0) errors.push(`the row "${name}" is missing`);
    if (count > 1) errors.push(`the row "${name}" occurs ${count} times`);
  }
  for (const entry of rows) {
    if (!ROWS.includes(entry.row)) errors.push(`unknown row "${entry.row}" (the rows are: ${ROWS.join(', ')})`);
  }

  for (const { row, status, where } of rows) {
    if (!ROWS.includes(row)) continue;
    const at = `"${row}"`;
    if (!STATUSES.includes(status)) {
      errors.push(`${at}: the status "${status}" is none of: ${STATUSES.join(', ')}`);
      continue;
    }
    if (!where) {
      errors.push(`${at}: the "Where" cell is empty`);
      continue;
    }
    if (status === 'test') {
      const references = [...where.matchAll(/`([^`]+)`/g)].map((match) => match[1]);
      let valid = 0;
      for (const reference of references) {
        const script = /^npm run ([\w:.-]+)/.exec(reference);
        if (script) {
          if (environment.scripts.includes(script[1])) valid++;
          else errors.push(`${at}: the script \`${reference}\` is not in package.json`);
        } else if (reference.includes('/') || /\.(ts|js|mjs|cjs|svelte|md|css)$/.test(reference)) {
          if (environment.exists(reference)) valid++;
          else errors.push(`${at}: the file \`${reference}\` does not exist`);
        }
      }
      if (valid === 0 && !errors.some((message) => message.startsWith(`${at}:`))) {
        errors.push(`${at}: "test" needs a file or an \`npm run\` script in backticks that exists`);
      }
    } else if (status === 'manual') {
      if (!/\b\d{4}-\d{2}-\d{2}\b/.test(where)) errors.push(`${at}: "manual" needs the date of the check (YYYY-MM-DD)`);
    } else if (status === 'manual pending') {
      if (MANUAL_ONLY_ROWS.includes(row)) pending.push(row);
      else errors.push(`${at}: "manual pending" is allowed only for ${MANUAL_ONLY_ROWS.join(', ')}; a machine can do the rest`);
    } else if (status === 'n/a' && where.length < MIN_REASON) {
      errors.push(`${at}: "n/a" needs the reason (at least ${MIN_REASON} characters)`);
    }
  }
  return { errors, pending };
}

function main() {
  const root = fileURLToPath(new URL('..', import.meta.url));
  const specs = join(root, 'specs');
  const scripts = Object.keys(JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).scripts);
  const environment = { exists: (path) => existsSync(join(root, path)), scripts };

  const errors = [];
  const legacy = [];
  const pending = [];
  let withMatrix = 0;
  const files = readdirSync(specs).filter((file) => file.endsWith('.md')).sort();
  for (const file of files) {
    const name = basename(file, '.md');
    const markdown = readFileSync(join(specs, file), 'utf8');
    if (!parseMatrix(markdown).found) {
      if (LEGACY.includes(name)) legacy.push(name);
      else errors.push(`specs/${file}: no "${HEADING}" section (rule 7a)`);
      continue;
    }
    withMatrix++;
    const result = checkMatrix(markdown, environment);
    for (const message of result.errors) errors.push(`specs/${file}: ${message}`);
    for (const row of result.pending) pending.push(`${name}: ${row}`);
  }

  for (const name of LEGACY) {
    if (!files.includes(`${name}.md`)) errors.push(`LEGACY lists "${name}", but specs/${name}.md does not exist`);
  }
  if (errors.length) {
    console.error(`Quality matrix: ${errors.length} problem(s)`);
    for (const message of errors) console.error(`  ${message}`);
    process.exit(1);
  }
  console.log(`Quality matrix: ${withMatrix} of ${files.length} specifications have one and pass.`);
  if (legacy.length) console.log(`  Without a matrix yet (written before rule 7a): ${legacy.join(', ')}.`);
  if (pending.length) console.log(`  Manual checks still pending: ${pending.join('; ')}.`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main();
