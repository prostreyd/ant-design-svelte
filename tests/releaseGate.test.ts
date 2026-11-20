// The gate of a release (scripts/release-gate.mjs, stage `gate` of .github/workflows/publish.yml): nothing is published unless the
// tests passed for the exact commit of the tag. These tests walk through what the gate decides from the runs GitHub has for a
// commit, with no network and a clock of their own. A mistake here would let an untested commit out, so every outcome is written down.
import { describe, expect, it } from 'vitest';
import { outputLines, stateOf, waitFor, WORKFLOWS } from '../scripts/release-gate.mjs';

type Run = { status: string; conclusion: string | null };
const green: Run = { status: 'completed', conclusion: 'success' };
const red: Run = { status: 'completed', conclusion: 'failure' };
const cancelled: Run = { status: 'completed', conclusion: 'cancelled' };
const going: Run = { status: 'in_progress', conclusion: null };
const queued: Run = { status: 'queued', conclusion: null };

describe('what the runs of one workflow for one commit add up to', () => {
  it('a green run is a success, whatever else there is', () => {
    expect(stateOf([green])).toBe('success');
    expect(stateOf([cancelled, green])).toBe('success');
    expect(stateOf([red, green])).toBe('success');
    expect(stateOf([going, green])).toBe('success');
  });

  it('a run that has not finished is pending (also one that runs again after a failure)', () => {
    expect(stateOf([going])).toBe('pending');
    expect(stateOf([queued])).toBe('pending');
    expect(stateOf([red, going])).toBe('pending');
    expect(stateOf([cancelled, queued])).toBe('pending');
  });

  it('only red runs are failed (a failure or a time out)', () => {
    expect(stateOf([red])).toBe('failed');
    expect(stateOf([{ status: 'completed', conclusion: 'timed_out' }])).toBe('failed');
    expect(stateOf([cancelled, red])).toBe('failed');
  });

  it('no run, or only cancelled and skipped ones, is missing: the workflow has not been run for this commit', () => {
    expect(stateOf([])).toBe('missing');
    expect(stateOf([cancelled])).toBe('missing');
    expect(stateOf([cancelled, { status: 'completed', conclusion: 'skipped' }])).toBe('missing');
  });
});

/** A fake of GitHub: `script[file]` is the list of what the runs look like at each look; the last one stays. */
function fake(script: Record<string, Run[][]>) {
  const looks: Record<string, number> = {};
  const asked: string[] = [];
  let clock = 0;
  return {
    asked,
    elapsed: () => clock,
    options: {
      fetchRuns: async (file: string) => {
        asked.push(file);
        const steps = script[file] ?? [[]];
        const index = Math.min(looks[file] ?? 0, steps.length - 1);
        looks[file] = (looks[file] ?? 0) + 1;
        return steps[index];
      },
      now: () => clock,
      sleep: async (seconds: number) => {
        clock += seconds;
      }
    }
  };
}

describe('the gate waits for the tests of the commit', () => {
  it('asks for the two workflows that have to be green: CI and the screen reader', () => {
    expect(WORKFLOWS).toEqual([
      { key: 'ci', file: 'ci.yml' },
      { key: 'orca', file: 'screen-reader.yml' }
    ]);
  });

  it('both are green at once: both are successes, and nothing is waited for', async () => {
    const github = fake({ 'ci.yml': [[green]], 'screen-reader.yml': [[green]] });
    expect(await waitFor(github.options)).toEqual({ ci: 'success', orca: 'success' });
    expect(github.elapsed()).toBe(0);
  });

  it('a run that is going is waited for, and its end decides', async () => {
    const github = fake({ 'ci.yml': [[going], [going], [green]], 'screen-reader.yml': [[green]] });
    expect(await waitFor(github.options)).toEqual({ ci: 'success', orca: 'success' });
    expect(github.elapsed()).toBe(60);
  });

  it('a workflow that is green is not asked about again while the other one is waited for', async () => {
    const github = fake({ 'ci.yml': [[green]], 'screen-reader.yml': [[going], [going], [green]] });
    await waitFor(github.options);
    expect(github.asked.filter((file) => file === 'ci.yml')).toHaveLength(1);
  });

  it('a run that has not appeared yet is waited for: the tag comes seconds after the push, and the run is made a few seconds later', async () => {
    const github = fake({ 'ci.yml': [[], [], [going], [green]], 'screen-reader.yml': [[green]] });
    expect(await waitFor(github.options)).toEqual({ ci: 'success', orca: 'success' });
  });

  it('no run after two minutes is missing, so publish.yml runs the workflow itself', async () => {
    const github = fake({ 'ci.yml': [[green]], 'screen-reader.yml': [[]] });
    expect(await waitFor(github.options)).toEqual({ ci: 'success', orca: 'missing' });
    expect(github.elapsed()).toBe(120);
  });

  it('a run that was cancelled by a newer push is missing too, not a success and not a failure', async () => {
    const github = fake({ 'ci.yml': [[cancelled]], 'screen-reader.yml': [[green]] });
    expect(await waitFor(github.options)).toEqual({ ci: 'missing', orca: 'success' });
  });

  it('a red run stops the gate at once, without waiting for the other workflow', async () => {
    const github = fake({ 'ci.yml': [[red]], 'screen-reader.yml': [[going]] });
    const result = await waitFor(github.options);
    expect(result.ci).toBe('failed');
    expect(result.orca).toBeUndefined();
    expect(github.elapsed()).toBe(0);
  });

  it('a failed run that is run again (re-run of the failed jobs) is waited for, and its new end decides', async () => {
    const github = fake({ 'ci.yml': [[red, going], [red, going], [red, green]], 'screen-reader.yml': [[green]] });
    expect(await waitFor(github.options)).toEqual({ ci: 'success', orca: 'success' });
  });

  it('a run that does not end in 45 minutes is an error: the gate does not guess', async () => {
    const github = fake({ 'ci.yml': [[going]], 'screen-reader.yml': [[green]] });
    await expect(waitFor(github.options)).rejects.toThrow(/Timed out after 45 minutes, still waiting for ci.yml: pending/);
  });

  it('a short time out can be set, and a missing run is not waited for longer than asked', async () => {
    const github = fake({ 'ci.yml': [[]], 'screen-reader.yml': [[]] });
    expect(await waitFor({ ...github.options, appearSeconds: 10, intervalSeconds: 5 })).toEqual({ ci: 'missing', orca: 'missing' });
    expect(github.elapsed()).toBe(10);
  });
});

describe('what the gate hands to the next jobs', () => {
  it('writes one line for each workflow in the form of $GITHUB_OUTPUT', () => {
    expect(outputLines({ ci: 'success', orca: 'missing' })).toBe('ci=success\norca=missing\n');
  });
});
