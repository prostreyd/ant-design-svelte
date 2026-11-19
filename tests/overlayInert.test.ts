// What is put out of reach while a layer is open (specs/overlay.md, O2).
import { afterEach, describe, expect, it } from 'vitest';
import { KEEP_ATTRIBUTE, hideOutside } from '../src/lib/internal/overlay/inertOutside';

const proto = HTMLElement.prototype as unknown as { inert?: boolean };
const hadInert = 'inert' in proto;

/** The engine knows `inert` (what Chromium 102, Firefox 112 and Safari 15.5 and later do), or it does not (the floor). */
function engineWithInert(known: boolean): void {
  if (known) Object.defineProperty(proto, 'inert', { value: false, configurable: true, writable: true });
  else delete proto.inert;
}

afterEach(() => {
  if (hadInert) engineWithInert(true);
  else delete proto.inert;
  document.body.innerHTML = '';
});

/** `<body><app/><aside/><layer/></body>`: the layer is a child of the body, as a portal puts it. */
function page() {
  document.body.innerHTML = '<div id="app"></div><aside id="aside"></aside><div id="layer"><div id="box"></div></div>';
  const get = (id: string) => document.getElementById(id) as HTMLElement;
  return { app: get('app'), aside: get('aside'), layer: get('layer'), box: get('box') };
}

describe('hideOutside (O2)', () => {
  it('puts inert on the siblings of the layer, and not on the layer', () => {
    engineWithInert(true);
    const { app, aside, layer, box } = page();
    const release = hideOutside(layer);
    expect(app.hasAttribute('inert')).toBe(true);
    expect(aside.hasAttribute('inert')).toBe(true);
    expect(layer.hasAttribute('inert')).toBe(false);
    expect(box.hasAttribute('inert')).toBe(false);
    release();
    expect(app.hasAttribute('inert')).toBe(false);
    expect(aside.hasAttribute('inert')).toBe(false);
  });

  it('uses inert alone where the engine knows it', () => {
    engineWithInert(true);
    const { app, layer } = page();
    hideOutside(layer);
    expect(app.hasAttribute('aria-hidden')).toBe(false);
  });

  it('adds aria-hidden where the engine does not know inert, and takes it away again', () => {
    engineWithInert(false);
    const { app, layer } = page();
    const release = hideOutside(layer);
    expect(app.getAttribute('aria-hidden')).toBe('true');
    release();
    expect(app.hasAttribute('aria-hidden')).toBe(false);
    expect(app.hasAttribute('inert')).toBe(false);
  });

  it('gives back the aria-hidden an element had, whatever it was', () => {
    engineWithInert(false);
    const { app, aside, layer } = page();
    app.setAttribute('aria-hidden', 'false');
    aside.setAttribute('aria-hidden', 'true');
    const release = hideOutside(layer);
    expect(app.getAttribute('aria-hidden')).toBe('true');
    release();
    expect(app.getAttribute('aria-hidden')).toBe('false');
    expect(aside.getAttribute('aria-hidden')).toBe('true');
  });

  it('an element that was already inert is left inert when the layer closes', () => {
    engineWithInert(true);
    const { app, layer } = page();
    app.setAttribute('inert', '');
    const release = hideOutside(layer);
    expect(app.hasAttribute('inert')).toBe(true);
    release();
    expect(app.hasAttribute('inert')).toBe(true);
  });

  it('reaches the siblings of every ancestor, up to the body, and not the ancestors', () => {
    engineWithInert(true);
    document.body.innerHTML =
      '<div id="a"><div id="b"><div id="layer"></div><p id="near"></p></div><p id="mid"></p></div><p id="far"></p>';
    const get = (id: string) => document.getElementById(id) as HTMLElement;
    hideOutside(get('layer'));
    for (const id of ['near', 'mid', 'far']) expect(get(id).hasAttribute('inert')).toBe(true);
    for (const id of ['a', 'b', 'layer']) expect(get(id).hasAttribute('inert')).toBe(false);
  });

  it('does not touch what is not shown on a page, or what asks to be kept', () => {
    engineWithInert(true);
    document.body.innerHTML =
      '<script id="s"></script><style id="st"></style><div id="keep"></div><div id="layer"></div><div id="x"></div>';
    const get = (id: string) => document.getElementById(id) as HTMLElement;
    get('keep').setAttribute(KEEP_ATTRIBUTE, '');
    hideOutside(get('layer'));
    expect(get('s').hasAttribute('inert')).toBe(false);
    expect(get('st').hasAttribute('inert')).toBe(false);
    expect(get('keep').hasAttribute('inert')).toBe(false);
    expect(get('x').hasAttribute('inert')).toBe(true);
  });

  it('does not touch what is added to the page after it was called', () => {
    engineWithInert(true);
    const { layer } = page();
    hideOutside(layer);
    const popup = document.createElement('div');
    document.body.append(popup);
    expect(popup.hasAttribute('inert')).toBe(false);
  });

  it('is counted per element: closing two layers in either order frees an element only when the last lets go', () => {
    engineWithInert(true);
    const { app, layer } = page();
    const other = document.createElement('div');
    document.body.append(other);
    const first = hideOutside(layer);
    const second = hideOutside(other);
    // The second layer hides the first one, and the page again.
    expect(layer.hasAttribute('inert')).toBe(true);
    first();
    expect(app.hasAttribute('inert')).toBe(true);
    expect(layer.hasAttribute('inert')).toBe(true);
    second();
    expect(app.hasAttribute('inert')).toBe(false);
    expect(layer.hasAttribute('inert')).toBe(false);

    const third = hideOutside(layer);
    const fourth = hideOutside(other);
    fourth();
    expect(app.hasAttribute('inert')).toBe(true);
    expect(layer.hasAttribute('inert')).toBe(false);
    third();
    expect(app.hasAttribute('inert')).toBe(false);
  });

  it('letting go twice lets go of one hold', () => {
    engineWithInert(true);
    const { app, layer } = page();
    const other = document.createElement('div');
    document.body.append(other);
    const first = hideOutside(layer);
    hideOutside(other);
    first();
    first();
    expect(app.hasAttribute('inert')).toBe(true);
  });

  it('a layer that is not in the page hides nothing and does not fail', () => {
    engineWithInert(true);
    const { app } = page();
    const release = hideOutside(document.createElement('div'));
    expect(app.hasAttribute('inert')).toBe(false);
    expect(() => release()).not.toThrow();
  });
});
