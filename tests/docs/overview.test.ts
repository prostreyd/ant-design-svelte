// The cards of the components overview page show the name and a silhouette of every component of the roadmap, ready
// or planned. A component that is added to the roadmap cannot get a card without a silhouette.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { WIREFRAMES } from '../../docs/src/docs/overview';
import { componentGroups } from '../../docs/src/docs/pages';

const items = componentGroups.flatMap((group) => group.items);
const root = join(import.meta.dirname, '..', '..');
const source = (path: string) => readFileSync(join(root, path), 'utf8');

describe('overview cards: a silhouette for every component', () => {
  it('every component of the roadmap has one, and every silhouette is of a component of the roadmap', () => {
    expect([...WIREFRAMES].sort()).toEqual(items.map((item) => item.name).sort());
  });

  it('the ready components come first in the list, like in the sidebar', () => {
    const ready = items.filter((item) => item.path).map((item) => item.name).sort();
    expect([...WIREFRAMES].slice(0, ready.length).sort()).toEqual(ready);
  });

  it('the wireframe component draws every name of the list', () => {
    const wireframe = source('docs/src/docs/components/Wireframe.svelte');
    for (const name of WIREFRAMES) expect(wireframe, name).toContain(`name === '${name}'`);
  });
});

describe('overview cards: only the name and a silhouette', () => {
  it('the page draws no description, no tag and no live component on a card', () => {
    const page = source('docs/src/routes/[[lang=lang]]/components/+page.svelte');
    expect(page).not.toMatch(/blurb|ComponentPreview|class="tag/);
  });

  it('a ready card is a link and a planned one is not; the state is for a screen reader only', () => {
    const page = source('docs/src/routes/[[lang=lang]]/components/+page.svelte');
    expect(page).toContain("tone=\"ready\"");
    expect(page).toContain("tone=\"planned\"");
    expect(page).toMatch(/<span class="sr">\{t\('tag\.ready'\)\}<\/span>/);
    expect(page).toMatch(/<span class="sr">\{t\('tag\.plan'\)\}<\/span>/);
  });
});
