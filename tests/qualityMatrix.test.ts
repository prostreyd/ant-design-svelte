// The check of the quality matrix of the specifications (scripts/check-quality-matrix.mjs, rule 7a).
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { checkMatrix, parseMatrix, ROWS } from '../scripts/check-quality-matrix.mjs';

const environment = {
  exists: (path: string) => path === 'e2e/select.spec.ts' || path === 'tests/Select.test.ts',
  scripts: ['test:floor', 'test:e2e']
};

const NOT_APPLICABLE = 'the component does not apply here at all';

/** A complete matrix: every row not applicable, with a reason; `rows` replaces rows by name. */
function matrix(rows: Record<string, [string, string]> = {}, extra = ''): string {
  const lines = ROWS.map((name: string) => {
    const [status, where] = rows[name] ?? ['n/a', NOT_APPLICABLE];
    return `| ${name} | ${status} | ${where} |`;
  });
  return ['# Spec', '', '## Quality matrix', '', '| Row | Status | Where |', '|---|---|---|', ...lines, extra, '', '## Next section', ''].join('\n');
}

const errorsOf = (markdown: string) => checkMatrix(markdown, environment).errors;

describe('quality matrix: the rows', () => {
  it('a complete matrix passes', () => {
    expect(checkMatrix(matrix(), environment)).toEqual({ errors: [], pending: [] });
  });

  it('a specification without the section fails and says so', () => {
    expect(errorsOf('# Spec\n\n## Something else\n')).toEqual(['no "## Quality matrix" section']);
  });

  it('a missing row fails and names it', () => {
    const markdown = matrix().replace(/^\| IME .*\n/m, '');
    expect(errorsOf(markdown)).toEqual(['the row "IME" is missing']);
  });

  it('a row that occurs twice fails', () => {
    const markdown = matrix({}, `| Touch | n/a | ${NOT_APPLICABLE} |`);
    expect(errorsOf(markdown)).toEqual(['the row "Touch" occurs 2 times']);
  });

  it('a row that is not in the list fails', () => {
    const markdown = matrix({}, `| Print styles | n/a | ${NOT_APPLICABLE} |`);
    expect(errorsOf(markdown)[0]).toContain('unknown row "Print styles"');
  });

  it('a row with the wrong number of cells fails', () => {
    const markdown = matrix({}, '| Touch | n/a |');
    expect(errorsOf(markdown).some((message: string) => message.includes('three are needed'))).toBe(true);
  });

  it('a section without a table fails', () => {
    expect(errorsOf('## Quality matrix\n\nTo be written.\n')).toEqual(
      expect.arrayContaining(['the table under the heading is missing or has no rows'])
    );
  });

  it('the table ends at the next heading: rows after it are not read', () => {
    const markdown = matrix() + '\n| Touch | test | `nothing` |\n';
    expect(errorsOf(markdown)).toEqual([]);
  });

  it('parseMatrix reads the three cells of a row', () => {
    const { rows } = parseMatrix(matrix({ IME: ['manual', '2026-11-13, a Pinyin keyboard'] }));
    expect(rows.find((entry: { row: string }) => entry.row === 'IME')).toEqual({ row: 'IME', status: 'manual', where: '2026-11-13, a Pinyin keyboard' });
  });
});

describe('quality matrix: the status and the "Where" cell', () => {
  it('an unknown status fails', () => {
    expect(errorsOf(matrix({ IME: ['done', 'yes'] }))[0]).toContain('the status "done" is none of');
  });

  it('an empty "Where" cell fails', () => {
    expect(errorsOf(matrix({ IME: ['test', ''] }))).toEqual(['"IME": the "Where" cell is empty']);
  });

  it('test: a file that exists passes', () => {
    expect(errorsOf(matrix({ Browsers: ['test', '`e2e/select.spec.ts` in three engines'] }))).toEqual([]);
  });

  it('test: a script of package.json passes', () => {
    expect(errorsOf(matrix({ 'Browser floor': ['test', '`npm run test:floor`'] }))).toEqual([]);
  });

  it('test: a file that does not exist fails and names it', () => {
    expect(errorsOf(matrix({ Browsers: ['test', '`e2e/gone.spec.ts`'] }))).toEqual(['"Browsers": the file `e2e/gone.spec.ts` does not exist']);
  });

  it('test: a script that is not in package.json fails', () => {
    expect(errorsOf(matrix({ 'Browser floor': ['test', '`npm run test:nothing`'] }))).toEqual([
      '"Browser floor": the script `npm run test:nothing` is not in package.json'
    ]);
  });

  it('test: a cell that names nothing fails', () => {
    expect(errorsOf(matrix({ Browsers: ['test', 'it is tested somewhere'] }))).toEqual([
      '"Browsers": "test" needs a file or an `npm run` script in backticks that exists'
    ]);
  });

  it('test: a word in backticks that is not a path is not a reference', () => {
    expect(errorsOf(matrix({ Browsers: ['test', '`forcedColors` and `tests/Select.test.ts`'] }))).toEqual([]);
  });

  it('manual: needs the date of the check', () => {
    expect(errorsOf(matrix({ 'Screen reader': ['manual', 'checked with Orca'] }))).toEqual(['"Screen reader": "manual" needs the date of the check (YYYY-MM-DD)']);
    expect(errorsOf(matrix({ 'Screen reader': ['manual', '2026-11-12, Orca with Chromium'] }))).toEqual([]);
  });

  it('manual pending: allowed where a machine cannot check, and reported', () => {
    const result = checkMatrix(matrix({ 'Screen reader': ['manual pending', 'NVDA and VoiceOver not run'], Touch: ['manual pending', 'no touch device'] }), environment);
    expect(result.errors).toEqual([]);
    expect(result.pending).toEqual(['Touch', 'Screen reader']);
  });

  it('manual pending: not allowed where a machine can check', () => {
    expect(errorsOf(matrix({ Browsers: ['manual pending', 'not run yet'] }))[0]).toContain('"manual pending" is allowed only for');
  });

  it('n/a: needs a reason of some length', () => {
    expect(errorsOf(matrix({ IME: ['n/a', 'no input'] }))[0]).toContain('"n/a" needs the reason');
    expect(errorsOf(matrix({ IME: ['n/a', 'the component takes no text input'] }))).toEqual([]);
  });
});

describe('quality matrix: the repository', () => {
  const run = () =>
    spawnSync(process.execPath, [join(process.cwd(), 'scripts/check-quality-matrix.mjs')], { encoding: 'utf8' });

  it('the specifications of the repository pass the check', () => {
    const result = run();
    expect(result.stderr).toBe('');
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('Quality matrix:');
  });
});
