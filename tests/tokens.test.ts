// The color tokens: the default light values are the ones of the Ant Design token documentation, the optional
// accessible file keeps WCAG contrast, and the dark theme keeps it without the file.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (file: string) => readFileSync(join(import.meta.dirname, '..', 'src', 'lib', file), 'utf8');
const tokensCss = read('tokens.css');
const accessibleCss = read('tokens-accessible.css');

/** The custom properties of the block with exactly this selector, comments removed. */
function block(css: string, selector: string): Map<string, string> {
  const source = css.replace(/\/\*[\s\S]*?\*\//g, '');
  for (const match of source.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    if (match[1].trim() !== selector) continue;
    return new Map([...match[2].matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()]));
  }
  throw new Error(`${selector} not found`);
}

const light = block(tokensCss, ':root');
const dark = block(tokensCss, ":root[data-theme='dark']");
const accessible = block(accessibleCss, ":root:not([data-theme='dark'])");

/** What the light theme resolves to with the accessible file imported (it wins whatever the order of the imports). */
const lightAccessible = new Map([...light, ...accessible]);
/** What the dark theme resolves to: the dark block overrides the light one. */
const darkTheme = new Map([...light, ...dark]);

type Rgba = { r: number; g: number; b: number; a: number };

function parse(value: string): Rgba {
  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(value);
  if (hex) {
    const h = hex[1].length === 3 ? [...hex[1]].map((c) => c + c).join('') : hex[1];
    return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16), a: 1 };
  }
  const fn = /^rgba?\(([^)]+)\)$/.exec(value);
  if (!fn) throw new Error(`Unsupported color: ${value}`);
  const [r, g, b, a = '1'] = fn[1].split(/[\s,/]+/).filter(Boolean);
  return { r: +r, g: +g, b: +b, a: a.endsWith('%') ? parseFloat(a) / 100 : +a };
}

function over(top: Rgba, bottom: Rgba): Rgba {
  const a = top.a + bottom.a * (1 - top.a);
  const mix = (t: number, b: number) => (t * top.a + b * bottom.a * (1 - top.a)) / a;
  return { r: mix(top.r, bottom.r), g: mix(top.g, bottom.g), b: mix(top.b, bottom.b), a };
}

function luminance(c: Rgba): number {
  const f = (v: number) => {
    const x = v / 255;
    return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b);
}

/** WCAG contrast ratio of `top` painted over `bottom`, measured against `bottom`. */
function ratio(tokens: Map<string, string>, top: string, bottom: string): number {
  const base = parse(tokens.get(bottom)!);
  const surface = over(base, { r: 255, g: 255, b: 255, a: 1 });
  const color = over(parse(tokens.get(top)!), surface);
  const [hi, lo] = [luminance(color), luminance(surface)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const normalize = (value: string) => value.toLowerCase().replace(/\s+/g, ' ');

describe('default light tokens', () => {
  // The values of the Ant Design token documentation (React, checked on 2026-11-10): colorPrimary and its
  // Hover/Active/Border, colorError and its Hover/Active, colorLink and its Hover/Active, the text colors, the
  // border colors, the Button component tokens and the global tokens of the Switch.
  const documented: Record<string, string> = {
    '--ads-color-primary': '#1677ff',
    '--ads-color-primary-hover': '#4096ff',
    '--ads-color-primary-active': '#0958d9',
    '--ads-color-primary-border': '#91caff',
    '--ads-color-danger': '#ff4d4f',
    '--ads-color-danger-hover': '#ff7875',
    '--ads-color-danger-active': '#d9363e',
    '--ads-color-text': 'rgba(0, 0, 0, 0.88)',
    '--ads-color-text-secondary': 'rgba(0, 0, 0, 0.65)',
    '--ads-color-text-tertiary': 'rgba(0, 0, 0, 0.45)',
    '--ads-color-text-quaternary': 'rgba(0, 0, 0, 0.25)',
    '--ads-color-text-disabled': 'rgba(0, 0, 0, 0.25)',
    '--ads-color-text-inverse': '#fff',
    '--ads-color-border': '#d9d9d9',
    '--ads-color-border-secondary': '#f0f0f0',
    '--ads-color-bg-container': '#ffffff',
    '--ads-color-bg-container-disabled': 'rgba(0, 0, 0, 0.04)',
    // Button: the solid fill is colorPrimary / colorPrimaryHover / colorPrimaryActive, the text and link colors
    // follow colorPrimary*, colorLink* and colorError*.
    '--ads-color-primary-solid': '#1677ff',
    '--ads-color-primary-solid-hover': '#4096ff',
    '--ads-color-primary-solid-active': '#0958d9',
    '--ads-color-primary-text': '#1677ff',
    '--ads-color-primary-text-hover': '#4096ff',
    '--ads-color-primary-text-active': '#0958d9',
    '--ads-color-danger-solid': '#ff4d4f',
    '--ads-color-danger-solid-hover': '#ff7875',
    '--ads-color-danger-solid-active': '#d9363e',
    '--ads-color-danger-text': '#ff4d4f',
    '--ads-color-danger-text-hover': '#ff7875',
    '--ads-color-danger-text-active': '#d9363e',
    '--ads-color-link': '#1677ff',
    '--ads-color-link-hover': '#69b1ff',
    '--ads-color-link-active': '#0958d9',
    '--ads-button-text-hover-bg': 'rgba(0, 0, 0, 0.04)',
    '--ads-button-text-active-bg': 'rgba(0, 0, 0, 0.15)',
    // Switch: colorPrimary / colorPrimaryHover for the on track, colorTextQuaternary / colorTextTertiary for the
    // off track, colorTextLightSolid for the text, opacityLoading for a loading switch.
    '--ads-switch-track-on': '#1677ff',
    '--ads-switch-track-on-hover': '#4096ff',
    '--ads-switch-track-off': 'rgba(0, 0, 0, 0.25)',
    '--ads-switch-track-off-hover': 'rgba(0, 0, 0, 0.45)',
    '--ads-switch-handle-bg': '#ffffff',
    '--ads-switch-content-color': '#ffffff',
    '--ads-switch-loading-opacity': '0.65',
    // Checkbox: colorBgContainer, colorBorder, colorPrimary, colorPrimaryHover, colorWhite, colorBgContainerDisabled and
    // colorTextDisabled, and the sizes of controlInteractiveSize, borderRadiusSM, lineWidth, lineWidthBold, paddingXS,
    // marginXS, fontSize and lineHeight.
    '--ads-checkbox-bg': '#ffffff',
    '--ads-checkbox-border': '#d9d9d9',
    '--ads-checkbox-border-hover': '#1677ff',
    '--ads-checkbox-checked-bg': '#1677ff',
    '--ads-checkbox-checked-bg-hover': '#4096ff',
    '--ads-checkbox-check-color': '#ffffff',
    '--ads-checkbox-indeterminate-color': '#1677ff',
    '--ads-checkbox-disabled-bg': 'rgba(0, 0, 0, 0.04)',
    '--ads-checkbox-disabled-border': '#d9d9d9',
    '--ads-checkbox-disabled-check-color': 'rgba(0, 0, 0, 0.25)',
    '--ads-checkbox-size': '16px',
    '--ads-checkbox-radius': '4px',
    '--ads-checkbox-border-width': '1px',
    '--ads-checkbox-check-width': '2px',
    '--ads-checkbox-label-padding': '8px',
    '--ads-checkbox-group-gap': '8px',
    '--ads-checkbox-font-size': '14px',
    '--ads-checkbox-line-height': '1.5714',
    '--ads-motion-duration-fast': '0.1s',
    '--ads-motion-duration-slow': '0.3s',
    '--ads-motion-ease-out-back': 'cubic-bezier(0.12, 0.4, 0.29, 1.46)'
  };

  for (const [token, value] of Object.entries(documented)) {
    it(`${token} is ${value}`, () => {
      expect(normalize(light.get(token) ?? '')).toBe(normalize(value));
    });
  }

  it('checkbox: the default unchecked border is below 3:1 against the page, which is why the accessible file darkens it', () => {
    expect(ratio(light, '--ads-checkbox-border', '--ads-color-bg-container')).toBeLessThan(3);
    expect(ratio(light, '--ads-checkbox-checked-bg-hover', '--ads-color-bg-container')).toBeLessThan(3);
  });

  it('has a pressed color for the switch that equals the hover color (the documentation names none)', () => {
    expect(light.get('--ads-switch-track-on-active')).toBe(light.get('--ads-switch-track-on-hover'));
    expect(light.get('--ads-switch-track-off-active')).toBe(light.get('--ads-switch-track-off-hover'));
  });
});

describe('accessible tokens (tokens-accessible.css)', () => {
  it('declares only tokens that tokens.css declares', () => {
    for (const token of accessible.keys()) expect(light.has(token), token).toBe(true);
  });

  it('changes the -solid, -text, link, switch and checkbox tokens, and nothing else', () => {
    const allowed = /^--ads-(color-(primary|danger)-(solid|text)(-hover|-active)?|color-link(-hover|-active)?|switch-track-(on|off)(-hover|-active)?|switch-loading-opacity|checkbox-border|checkbox-checked-bg-hover)$/;
    for (const token of accessible.keys()) expect(token, token).toMatch(allowed);
  });

  it('does not apply in the dark theme', () => {
    expect(accessibleCss).toContain(":root:not([data-theme='dark'])");
    expect(accessibleCss).not.toMatch(/^:root\s*\{/m);
  });

  it('wins over the :root of tokens.css whatever the order of the imports (it is more specific)', () => {
    // :root is one pseudo-class; :root:not([attribute]) is two (the :not() counts as its argument).
    expect(":root:not([data-theme='dark'])".match(/:root|\[|:not/g)?.length).toBeGreaterThan(1);
  });

  const solid = ['primary', 'danger'].flatMap((kind) => ['', '-hover', '-active'].map((state) => `--ads-color-${kind}-solid${state}`));
  const text = ['primary-text', 'danger-text', 'link'].flatMap((kind) => ['', '-hover', '-active'].map((state) => `--ads-color-${kind}${state}`));

  for (const token of solid) {
    it(`${token}: text on it reaches 4.5:1`, () => {
      expect(ratio(lightAccessible, '--ads-color-text-inverse', token)).toBeGreaterThanOrEqual(4.5);
    });
  }

  for (const token of text) {
    it(`${token}: it reaches 4.5:1 as text on the page`, () => {
      expect(ratio(lightAccessible, token, '--ads-color-bg-container')).toBeGreaterThanOrEqual(4.5);
    });
  }

  for (const state of ['', '-hover', '-active']) {
    for (const side of ['on', 'off']) {
      const track = `--ads-switch-track-${side}${state}`;
      it(`${track}: the track reaches 3:1 on the page, the handle 3:1 and the text 4.5:1 on the track`, () => {
        expect(ratio(lightAccessible, track, '--ads-color-bg-container')).toBeGreaterThanOrEqual(3);
        expect(ratio(lightAccessible, '--ads-switch-handle-bg', track)).toBeGreaterThanOrEqual(3);
        expect(ratio(lightAccessible, '--ads-switch-content-color', track)).toBeGreaterThanOrEqual(4.5);
      });
    }
  }

  it('does not dim a loading switch', () => {
    expect(lightAccessible.get('--ads-switch-loading-opacity')).toBe('1');
  });

  it('checkbox: the border and the hover border reach 3:1 against the page', () => {
    for (const token of ['--ads-checkbox-border', '--ads-checkbox-border-hover']) {
      expect(ratio(lightAccessible, token, '--ads-color-bg-container'), token).toBeGreaterThanOrEqual(3);
    }
  });

  it('checkbox: the checked fill, also on hover, reaches 3:1 against the page and the check mark reaches 3:1 on it', () => {
    for (const fill of ['--ads-checkbox-checked-bg', '--ads-checkbox-checked-bg-hover']) {
      expect(ratio(lightAccessible, fill, '--ads-color-bg-container'), `${fill} on the page`).toBeGreaterThanOrEqual(3);
      expect(ratio(lightAccessible, '--ads-checkbox-check-color', fill), `check mark on ${fill}`).toBeGreaterThanOrEqual(3);
    }
  });

  it('checkbox: the indeterminate bar reaches 3:1 against the box', () => {
    expect(ratio(lightAccessible, '--ads-checkbox-indeterminate-color', '--ads-checkbox-bg')).toBeGreaterThanOrEqual(3);
  });
});

describe('dark theme (no extra file needed)', () => {
  const solid = ['primary', 'danger'].flatMap((kind) => ['', '-hover', '-active'].map((state) => `--ads-color-${kind}-solid${state}`));
  const text = ['primary-text', 'danger-text', 'link'].flatMap((kind) => ['', '-hover', '-active'].map((state) => `--ads-color-${kind}${state}`));

  for (const token of solid) {
    it(`${token}: text on it reaches 4.5:1`, () => {
      expect(ratio(darkTheme, '--ads-color-text-inverse', token)).toBeGreaterThanOrEqual(4.5);
    });
  }

  for (const token of text) {
    it(`${token}: it reaches 4.5:1 as text on the page`, () => {
      expect(ratio(darkTheme, token, '--ads-color-bg-container')).toBeGreaterThanOrEqual(4.5);
    });
  }

  for (const state of ['', '-hover', '-active']) {
    for (const side of ['on', 'off']) {
      const track = `--ads-switch-track-${side}${state}`;
      it(`${track}: the track reaches 3:1 on the page, the handle 3:1 and the text 4.5:1 on the track`, () => {
        expect(ratio(darkTheme, track, '--ads-color-bg-container')).toBeGreaterThanOrEqual(3);
        expect(ratio(darkTheme, '--ads-switch-handle-bg', track)).toBeGreaterThanOrEqual(3);
        expect(ratio(darkTheme, '--ads-switch-content-color', track)).toBeGreaterThanOrEqual(4.5);
      });
    }
  }

  it('does not dim a loading switch', () => {
    expect(darkTheme.get('--ads-switch-loading-opacity')).toBe('1');
  });

  it('checkbox: the border and the hover border reach 3:1 against the page', () => {
    for (const token of ['--ads-checkbox-border', '--ads-checkbox-border-hover']) {
      expect(ratio(darkTheme, token, '--ads-color-bg-container'), token).toBeGreaterThanOrEqual(3);
    }
  });

  it('checkbox: the checked fill, also on hover, reaches 3:1 against the page and the check mark reaches 3:1 on it', () => {
    for (const fill of ['--ads-checkbox-checked-bg', '--ads-checkbox-checked-bg-hover']) {
      expect(ratio(darkTheme, fill, '--ads-color-bg-container'), `${fill} on the page`).toBeGreaterThanOrEqual(3);
      expect(ratio(darkTheme, '--ads-checkbox-check-color', fill), `check mark on ${fill}`).toBeGreaterThanOrEqual(3);
    }
  });

  it('checkbox: the indeterminate bar reaches 3:1 against the box', () => {
    expect(ratio(darkTheme, '--ads-checkbox-indeterminate-color', '--ads-checkbox-bg')).toBeGreaterThanOrEqual(3);
  });
});
