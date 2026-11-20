// The gate of a release (.github/workflows/publish.yml, stage `gate`): before anything is published, the tests have to have passed
// for the exact commit that the tag points to. Two workflows count: `CI` (lint, types, unit tests, the e2e tests of the library
// and of the site in three engines) and `Screen reader` (Orca). For each of them the gate looks at the runs that GitHub has for
// that commit (a push to main or to a branch, a pull request: the same commit is the same code) and answers one of:
//
//   success   a run of this commit finished green. It is not run again.
//   failed    runs of this commit finished, and none of them green. The release stops. Re-run the failed jobs of that run, then this job.
//   missing   there is no run (a push that Orca does not start for, a run that a newer push cancelled, a run that was cancelled by hand).
//             publish.yml then runs the workflow itself, so a release is never published on a commit that was not tested.
//
// A run that is still going is waited for. A run that has not appeared yet is waited for a short time too: the tag is pushed
// seconds after the push to main, and GitHub makes the runs a few seconds later.
//
// The decision (`stateOf`, `waitFor`) takes no network and no clock of its own, so tests/releaseGate.test.ts can walk through it.
import { appendFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

/** The workflows that have to be green for a release: the key goes to the outputs of the job, the file names the workflow. */
export const WORKFLOWS = [
  { key: 'ci', file: 'ci.yml' },
  { key: 'orca', file: 'screen-reader.yml' }
];

/**
 * What the runs of one workflow for one commit add up to. `runs` are the `status` and `conclusion` of GitHub:
 * a green run decides at once; otherwise a run that is not finished means waiting; otherwise a red run means failed;
 * and a commit with no run, or only cancelled and skipped ones, has no result yet (missing).
 */
export function stateOf(runs) {
  if (runs.some((run) => run.status === 'completed' && run.conclusion === 'success')) return 'success';
  if (runs.some((run) => run.status !== 'completed')) return 'pending';
  if (runs.some((run) => run.conclusion === 'failure' || run.conclusion === 'timed_out')) return 'failed';
  return 'missing';
}

/**
 * Waits until every workflow has a final state and returns `{ [key]: 'success' | 'failed' | 'missing' }`. It returns as soon as one
 * workflow is red (the release is stopped anyway) and throws when the time is up while a run still goes.
 *
 * @param {{ fetchRuns: (file: string) => Promise<{status: string, conclusion: string|null}[]>,
 *   now?: () => number, sleep?: (seconds: number) => Promise<void>, workflows?: typeof WORKFLOWS,
 *   appearSeconds?: number, timeoutSeconds?: number, intervalSeconds?: number }} options
 */
export async function waitFor({
  fetchRuns,
  now = () => Date.now() / 1000,
  sleep = (seconds) => new Promise((resolve) => setTimeout(resolve, seconds * 1000)),
  workflows = WORKFLOWS,
  appearSeconds = 120,
  timeoutSeconds = 45 * 60,
  intervalSeconds = 30
}) {
  const start = now();
  /** @type {Record<string, string>} */
  const result = {};
  for (;;) {
    const waiting = [];
    for (const { key, file } of workflows) {
      if (result[key]) continue;
      const state = stateOf(await fetchRuns(file));
      const late = now() - start;
      if (state === 'success' || state === 'failed') result[key] = state;
      else if (state === 'missing' && late >= appearSeconds) result[key] = 'missing';
      else waiting.push(`${file}: ${state}`);
      if (state === 'failed') return { ...result };
    }
    if (waiting.length === 0) return { ...result };
    if (now() - start >= timeoutSeconds) throw new Error(`Timed out after ${Math.round(timeoutSeconds / 60)} minutes, still waiting for ${waiting.join(', ')}`);
    await sleep(intervalSeconds);
  }
}

/** The lines for `$GITHUB_OUTPUT`: `ci=success`, `orca=missing`. */
export const outputLines = (result) => Object.entries(result).map(([key, state]) => `${key}=${state}\n`).join('');

/** The runs that GitHub has for one commit of one workflow file. `GITHUB_TOKEN` needs `actions: read`. */
async function fetchRunsFromGitHub(file, { repository, sha, token }) {
  const url = `https://api.github.com/repos/${repository}/actions/workflows/${file}/runs?head_sha=${sha}&per_page=30`;
  const response = await fetch(url, { headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' } });
  if (!response.ok) throw new Error(`GitHub answered ${response.status} for ${file}: ${await response.text()}`);
  const body = await response.json();
  return body.workflow_runs.map((run) => ({ status: run.status, conclusion: run.conclusion }));
}

async function main() {
  const { GITHUB_TOKEN: token, GITHUB_REPOSITORY: repository, GITHUB_SHA: sha, GITHUB_OUTPUT: output } = process.env;
  if (!token || !repository || !sha) throw new Error('GITHUB_TOKEN, GITHUB_REPOSITORY and GITHUB_SHA are needed');
  console.log(`Waiting for the tests of ${sha}: ${WORKFLOWS.map((workflow) => workflow.file).join(', ')}`);
  const result = await waitFor({ fetchRuns: (file) => fetchRunsFromGitHub(file, { repository, sha, token }) });
  for (const { key, file } of WORKFLOWS) console.log(`${file}: ${result[key] ?? 'not decided (another workflow is red)'}`);
  if (output) appendFileSync(output, outputLines(result));
  const red = WORKFLOWS.filter((workflow) => result[workflow.key] === 'failed');
  if (red.length > 0) {
    console.error(`::error::The tests are red for ${sha}: ${red.map((workflow) => workflow.file).join(', ')}. Fix them or re-run the failed jobs of that run, then re-run this job.`);
    process.exit(1);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(`::error::${error.message}`);
    process.exit(1);
  });
}
