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
    // Radio: the component tokens of the React page (radioSize, dotColorDisabled, wrapperMarginInlineEnd, buttonPaddingInline,
    // buttonCheckedBgDisabled, buttonCheckedColorDisabled, buttonBg, buttonColor) and the global ones the checkbox
    // lists; the dot (6px), the label padding (8px on both sides) and the button heights were measured on the public demo
    // of React 6.7.0 on 2026-11-15, where the table says `dotSize` 8.
    '--ads-radio-size': '16px',
    '--ads-radio-dot-size': '6px',
    '--ads-radio-border-width': '1px',
    '--ads-radio-font-size': '14px',
    '--ads-radio-line-height': '1.5714',
    '--ads-radio-label-padding': '8px',
    '--ads-radio-group-gap': '8px',
    '--ads-radio-button-padding-inline': '15px',
    '--ads-radio-button-padding-inline-sm': '7px',
    '--ads-radio-bg': '#ffffff',
    '--ads-radio-border': '#d9d9d9',
    '--ads-radio-border-hover': '#1677ff',
    '--ads-radio-checked-bg': '#1677ff',
    '--ads-radio-checked-bg-hover': '#4096ff',
    '--ads-radio-dot-color': '#ffffff',
    '--ads-radio-disabled-bg': 'rgba(0, 0, 0, 0.04)',
    '--ads-radio-disabled-border': '#d9d9d9',
    '--ads-radio-disabled-dot-color': 'rgba(0, 0, 0, 0.25)',
    '--ads-radio-button-bg': '#ffffff',
    '--ads-radio-button-checked-bg': '#ffffff',
    '--ads-radio-button-border': '#d9d9d9',
    '--ads-radio-button-color': 'rgba(0, 0, 0, 0.88)',
    '--ads-radio-button-disabled-bg': 'rgba(0, 0, 0, 0.04)',
    '--ads-radio-button-disabled-border': '#d9d9d9',
    '--ads-radio-button-disabled-color': 'rgba(0, 0, 0, 0.25)',
    '--ads-radio-button-checked-disabled-bg': 'rgba(0, 0, 0, 0.15)',
    '--ads-radio-button-checked-disabled-color': 'rgba(0, 0, 0, 0.25)',
    '--ads-motion-ease-in-out-circ': 'cubic-bezier(0.78, 0.14, 0.15, 0.86)',
    // Input: the component tokens (activeBg, activeBorderColor, activeShadow, addonBg, errorActiveShadow, hoverBg,
    // hoverBorderColor, inputFontSize*, paddingBlock*, paddingInline*, warningActiveShadow) and the global tokens
    // colorBorder, colorBorderDisabled, colorBgContainerDisabled, colorFillTertiary, colorError, colorErrorBg,
    // colorWarning, colorWarningBg, borderRadius*, lineWidth, lineHeight, lineHeightLG and paddingXXS (React page, 2026-11-11).
    '--ads-input-bg': '#ffffff',
    '--ads-input-bg-hover': '#ffffff',
    '--ads-input-bg-active': '#ffffff',
    '--ads-input-border': '#d9d9d9',
    '--ads-input-border-hover': '#4096ff',
    '--ads-input-border-active': '#1677ff',
    '--ads-input-shadow-active': '0 0 0 2px rgba(5, 145, 255, 0.1)',
    '--ads-input-addon-bg': 'rgba(0, 0, 0, 0.02)',
    '--ads-input-filled-bg': 'rgba(0, 0, 0, 0.04)',
    '--ads-input-disabled-bg': 'rgba(0, 0, 0, 0.04)',
    '--ads-input-disabled-border': '#d9d9d9',
    '--ads-input-error': '#ff4d4f',
    '--ads-input-error-shadow': '0 0 0 2px rgba(255, 38, 5, 0.06)',
    '--ads-input-error-bg': '#fff2f0',
    '--ads-input-warning': '#faad14',
    '--ads-input-warning-shadow': '0 0 0 2px rgba(255, 215, 5, 0.1)',
    '--ads-input-warning-bg': '#fffbe6',
    '--ads-input-font-size': '14px',
    '--ads-input-font-size-lg': '16px',
    '--ads-input-font-size-sm': '14px',
    '--ads-input-padding-block': '4px',
    '--ads-input-padding-block-lg': '7px',
    '--ads-input-padding-block-sm': '0px',
    '--ads-input-padding-inline': '11px',
    '--ads-input-padding-inline-lg': '11px',
    '--ads-input-padding-inline-sm': '7px',
    '--ads-input-radius': '6px',
    '--ads-input-radius-lg': '8px',
    '--ads-input-radius-sm': '4px',
    '--ads-input-border-width': '1px',
    '--ads-input-line-height': '1.5714285714285714',
    '--ads-input-line-height-lg': '1.5',
    '--ads-input-gap': '4px',
    // Select (React token table, read 2026-11-12): the option, the multiple tag, the panel.
    '--ads-select-option-height': '32px',
    '--ads-select-option-font-size': '14px',
    '--ads-select-option-line-height': '1.5714285714285714',
    '--ads-select-option-padding-block': '5px',
    '--ads-select-option-padding-inline': '12px',
    '--ads-select-option-active-bg': 'rgba(0, 0, 0, 0.04)',
    '--ads-select-option-selected-bg': '#e6f4ff',
    '--ads-select-option-selected-color': 'rgba(0, 0, 0, 0.88)',
    '--ads-select-selected-font-weight': '600',
    '--ads-select-tag-bg': 'rgba(0, 0, 0, 0.06)',
    '--ads-select-tag-border': 'transparent',
    '--ads-select-tag-color-disabled': 'rgba(0, 0, 0, 0.25)',
    '--ads-select-tag-height': '24px',
    '--ads-select-tag-height-lg': '32px',
    '--ads-select-tag-height-sm': '16px',
    '--ads-select-popup-bg': '#ffffff',
    '--ads-select-popup-radius': '8px',
    '--ads-select-option-radius': '4px',
    '--ads-select-group-label-color': 'rgba(0, 0, 0, 0.45)',
    '--ads-dropdown-z-index': '1050',
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

  it('radio: the default unchecked border and checked hover fill are below 3:1 against the page, which is why the accessible file darkens them', () => {
    expect(ratio(light, '--ads-radio-border', '--ads-color-bg-container')).toBeLessThan(3);
    expect(ratio(light, '--ads-radio-button-border', '--ads-color-bg-container')).toBeLessThan(3);
    expect(ratio(light, '--ads-radio-checked-bg-hover', '--ads-color-bg-container')).toBeLessThan(3);
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

  it('changes the -solid, -text, link, switch, checkbox, radio, input, select, form, message, modal, spin and menu tokens, and nothing else', () => {
    const allowed = /^--ads-(color-(primary|danger)-(solid|text)(-hover|-active)?|color-link(-hover|-active)?|switch-track-(on|off)(-hover|-active)?|switch-loading-opacity|checkbox-border|checkbox-checked-bg-hover|radio-(border|checked-bg-hover|button-border)|input-(border|border-hover|border-active|placeholder|icon-color|icon-color-hover|count-color|error-hover|warning|warning-hover)|select-(group-label-color|empty-color)|form-(help-color|extra-color|warning-text|success-icon|warning-icon|tooltip-icon-color)|message-icon-(success|warning)|modal-confirm-icon-(success|warning)|spin-(description-color|mask-bg)|menu-(item-selected-color|submenu-selected-color|horizontal-(hover|selected)-color|group-title-color|danger-(color|hover-color|selected-color)|dark-(item-selected-bg|danger-selected-bg|danger-active-bg)))$/;
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

  it('radio: the border and the hover border reach 3:1 against the page, the button border too', () => {
    for (const token of ['--ads-radio-border', '--ads-radio-border-hover', '--ads-radio-button-border']) {
      expect(ratio(lightAccessible, token, '--ads-color-bg-container'), token).toBeGreaterThanOrEqual(3);
    }
  });

  it('radio: the checked fill, also on hover, reaches 3:1 against the page and the dot reaches 3:1 on it', () => {
    for (const fill of ['--ads-radio-checked-bg', '--ads-radio-checked-bg-hover']) {
      expect(ratio(lightAccessible, fill, '--ads-color-bg-container'), `${fill} on the page`).toBeGreaterThanOrEqual(3);
      expect(ratio(lightAccessible, '--ads-radio-dot-color', fill), `dot on ${fill}`).toBeGreaterThanOrEqual(3);
    }
  });

  it('radio: the text of a button reaches 4.5:1 on its background in every state', () => {
    expect(ratio(lightAccessible, '--ads-radio-button-color', '--ads-radio-button-bg'), 'rest').toBeGreaterThanOrEqual(4.5);
    for (const color of ['--ads-color-primary-text', '--ads-color-primary-text-hover', '--ads-color-primary-text-active']) {
      expect(ratio(lightAccessible, color, '--ads-radio-button-checked-bg'), color).toBeGreaterThanOrEqual(4.5);
    }
    for (const fill of ['--ads-color-primary-solid', '--ads-color-primary-solid-hover', '--ads-color-primary-solid-active']) {
      expect(ratio(lightAccessible, '--ads-color-text-inverse', fill), fill).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('radio: the checked button border reaches 3:1 against the page', () => {
    for (const border of ['--ads-color-primary-text', '--ads-color-primary-text-hover', '--ads-color-primary-solid']) {
      expect(ratio(lightAccessible, border, '--ads-color-bg-container'), border).toBeGreaterThanOrEqual(3);
    }
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

  it('radio: the border and the hover border reach 3:1 against the page, the button border too', () => {
    for (const token of ['--ads-radio-border', '--ads-radio-border-hover', '--ads-radio-button-border']) {
      expect(ratio(darkTheme, token, '--ads-color-bg-container'), token).toBeGreaterThanOrEqual(3);
    }
  });

  it('radio: the checked fill, also on hover, reaches 3:1 against the page and the dot reaches 3:1 on it', () => {
    for (const fill of ['--ads-radio-checked-bg', '--ads-radio-checked-bg-hover']) {
      expect(ratio(darkTheme, fill, '--ads-color-bg-container'), `${fill} on the page`).toBeGreaterThanOrEqual(3);
      expect(ratio(darkTheme, '--ads-radio-dot-color', fill), `dot on ${fill}`).toBeGreaterThanOrEqual(3);
    }
  });

  it('radio: the text of a button reaches 4.5:1 on its background in every state', () => {
    expect(ratio(darkTheme, '--ads-radio-button-color', '--ads-radio-button-bg'), 'rest').toBeGreaterThanOrEqual(4.5);
    for (const color of ['--ads-color-primary-text', '--ads-color-primary-text-hover', '--ads-color-primary-text-active']) {
      expect(ratio(darkTheme, color, '--ads-radio-button-checked-bg'), color).toBeGreaterThanOrEqual(4.5);
    }
    for (const fill of ['--ads-color-primary-solid', '--ads-color-primary-solid-hover', '--ads-color-primary-solid-active']) {
      expect(ratio(darkTheme, '--ads-color-text-inverse', fill), fill).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('radio: the checked button border reaches 3:1 against the page', () => {
    for (const border of ['--ads-color-primary-text', '--ads-color-primary-text-hover', '--ads-color-primary-solid']) {
      expect(ratio(darkTheme, border, '--ads-color-bg-container'), border).toBeGreaterThanOrEqual(3);
    }
  });
});

describe('input tokens: contrast', () => {
  /** The page, then the translucent layers painted over it (a filled field), as the browser composites them. */
  function surface(tokens: Map<string, string>, ...layers: string[]): Rgba {
    return layers.reduce((below, layer) => over(parse(tokens.get(layer)!), below), over(parse(tokens.get('--ads-color-bg-container')!), { r: 255, g: 255, b: 255, a: 1 }));
  }

  function contrast(tokens: Map<string, string>, foreground: string, ...layers: string[]): number {
    const background = surface(tokens, ...layers);
    const color = over(parse(tokens.get(foreground)!), background);
    const [hi, lo] = [luminance(color), luminance(background)].sort((x, y) => y - x);
    return (hi + 0.05) / (lo + 0.05);
  }

  /** The backgrounds a field can have: the page, filled, filled on hover, and the error and warning fills. */
  const grounds: Array<[string, string[]]> = [
    ['the page', []],
    ['filled', ['--ads-input-filled-bg']],
    ['filled on hover', ['--ads-input-filled-bg-hover']],
    ['filled error', ['--ads-input-error-bg']],
    ['filled warning', ['--ads-input-warning-bg']]
  ];

  const boundaries = [
    '--ads-input-border',
    '--ads-input-border-hover',
    '--ads-input-border-active',
    '--ads-input-error',
    '--ads-input-error-hover',
    '--ads-input-warning',
    '--ads-input-warning-hover',
    '--ads-color-focus-outline'
  ];

  it('the default light border, hover border, warning border and placeholder are below the WCAG ratios, which is why the accessible file exists', () => {
    expect(contrast(light, '--ads-input-border')).toBeLessThan(3);
    expect(contrast(light, '--ads-input-border-hover')).toBeLessThan(3);
    expect(contrast(light, '--ads-input-warning')).toBeLessThan(3);
    expect(contrast(light, '--ads-input-placeholder')).toBeLessThan(4.5);
    expect(contrast(light, '--ads-input-count-color')).toBeLessThan(4.5);
  });

  for (const [theme, tokens] of [['light with the accessible file', lightAccessible], ['dark', darkTheme]] as const) {
    describe(theme, () => {
      for (const token of boundaries) {
        it(`${token}: the boundary reaches 3:1 against the page`, () => {
          expect(contrast(tokens, token), token).toBeGreaterThanOrEqual(3);
        });
      }

      for (const [name, layers] of grounds) {
        it(`the placeholder, the count and the over-limit count reach 4.5:1 on ${name}`, () => {
          expect(contrast(tokens, '--ads-input-placeholder', ...layers), 'placeholder').toBeGreaterThanOrEqual(4.5);
          expect(contrast(tokens, '--ads-input-count-color', ...layers), 'count').toBeGreaterThanOrEqual(4.5);
          expect(contrast(tokens, '--ads-color-danger-text', ...layers), 'count over the limit').toBeGreaterThanOrEqual(4.5);
        });

        it(`the clear icon, also on hover, reaches 3:1 on ${name}`, () => {
          expect(contrast(tokens, '--ads-input-icon-color', ...layers), 'icon').toBeGreaterThanOrEqual(3);
          expect(contrast(tokens, '--ads-input-icon-color-hover', ...layers), 'icon on hover').toBeGreaterThanOrEqual(3);
        });
      }
    });
  }

  it('the dark theme defines the colours of the input again', () => {
    for (const token of [...light.keys()].filter((name) => name.startsWith('--ads-input-') && !/(font-size|padding|radius|border-width|line-height|gap|icon-size|addon-padding|otp-gap)/.test(name))) {
      expect(dark.has(token), token).toBe(true);
    }
  });
});

describe('select tokens: contrast', () => {
  /** The colors the panel paints over the page: its own background, then the translucent layers of a row or a tag. */
  function surface(tokens: Map<string, string>, ...layers: string[]): Rgba {
    return layers.reduce(
      (below, layer) => over(parse(tokens.get(layer)!), below),
      over(parse(tokens.get('--ads-select-popup-bg')!), { r: 255, g: 255, b: 255, a: 1 })
    );
  }

  function contrast(tokens: Map<string, string>, foreground: string, ...layers: string[]): number {
    const background = surface(tokens, ...layers);
    const color = over(parse(tokens.get(foreground)!), background);
    const [hi, lo] = [luminance(color), luminance(background)].sort((x, y) => y - x);
    return (hi + 0.05) / (lo + 0.05);
  }

  /** What a row of the list can be: plain, highlighted, selected. */
  const rows: Array<[string, string[]]> = [
    ['a plain row', []],
    ['the highlighted row', ['--ads-select-option-active-bg']],
    ['the selected row', ['--ads-select-option-selected-bg']]
  ];

  it('the default light group label and empty-result text are below 4.5:1, which is why the accessible file darkens them', () => {
    expect(contrast(light, '--ads-select-group-label-color')).toBeLessThan(4.5);
    expect(contrast(light, '--ads-select-empty-color')).toBeLessThan(4.5);
  });

  for (const [theme, tokens] of [['light with the accessible file', lightAccessible], ['dark', darkTheme]] as const) {
    describe(theme, () => {
      it('the group label and the empty-result text reach 4.5:1 on the panel', () => {
        expect(contrast(tokens, '--ads-select-group-label-color'), 'group label').toBeGreaterThanOrEqual(4.5);
        expect(contrast(tokens, '--ads-select-empty-color'), 'empty').toBeGreaterThanOrEqual(4.5);
      });

      for (const [name, layers] of rows) {
        it(`the text of an option reaches 4.5:1 on ${name}`, () => {
          expect(contrast(tokens, '--ads-color-text', ...layers)).toBeGreaterThanOrEqual(4.5);
        });
      }

      it('the text of the selected option reaches 4.5:1 on the selected row', () => {
        expect(contrast(tokens, '--ads-select-option-selected-color', '--ads-select-option-selected-bg')).toBeGreaterThanOrEqual(4.5);
      });

      it('the text of a tag reaches 4.5:1 on the tag, and its remove icon, also on hover, 3:1', () => {
        expect(contrast(tokens, '--ads-color-text', '--ads-select-tag-bg')).toBeGreaterThanOrEqual(4.5);
        expect(contrast(tokens, '--ads-input-icon-color', '--ads-select-tag-bg'), 'icon').toBeGreaterThanOrEqual(3);
        expect(contrast(tokens, '--ads-input-icon-color-hover', '--ads-select-tag-bg'), 'icon on hover').toBeGreaterThanOrEqual(3);
      });

      it('the mark of a selected option reaches 3:1 on the selected row', () => {
        expect(contrast(tokens, '--ads-color-text', '--ads-select-option-selected-bg')).toBeGreaterThanOrEqual(3);
      });
    });
  }

  it('the dark theme defines the colors of the select again', () => {
    for (const token of [...light.keys()].filter((name) => /^--ads-select-.*(bg|color|border|shadow)$/.test(name))) {
      expect(dark.has(token), token).toBe(true);
    }
  });
});

describe('tooltip tokens (specs/tooltip.md)', () => {
  const presets = ['pink', 'red', 'yellow', 'orange', 'cyan', 'green', 'blue', 'purple', 'geekblue', 'magenta', 'volcano', 'gold', 'lime'];
  // The backgrounds measured on the Ant Design demo (React 6.7.0, 2026-11-13, Chromium 158).
  const measured: Record<string, [string, string]> = {
    pink: ['#eb2f96', '#cb2b83'],
    red: ['#f5222d', '#d32029'],
    yellow: ['#fadb14', '#d8bd14'],
    orange: ['#fa8c16', '#d87a16'],
    cyan: ['#13c2c2', '#13a8a8'],
    green: ['#52c41a', '#49aa19'],
    blue: ['#1677ff', '#1668dc'],
    purple: ['#722ed1', '#642ab5'],
    geekblue: ['#2f54eb', '#2b4acb'],
    magenta: ['#eb2f96', '#cb2b83'],
    volcano: ['#fa541c', '#d84a1b'],
    gold: ['#faad14', '#d89614'],
    lime: ['#a0d911', '#8bbb11']
  };

  it('the 13 presets have their background and text in the light and the dark theme, 26 backgrounds in all', () => {
    expect(presets.length * 2).toBe(26);
    for (const name of presets) {
      for (const [theme, tokens] of [['light', light], ['dark', darkTheme]] as const) {
        expect(tokens.has(`--ads-tooltip-preset-${name}`), `${theme} ${name}`).toBe(true);
        expect(tokens.has(`--ads-tooltip-preset-${name}-text`), `${theme} ${name} text`).toBe(true);
      }
    }
  });

  it('the backgrounds are the ones measured on the Ant Design demo, in both themes', () => {
    for (const name of presets) {
      expect(normalize(light.get(`--ads-tooltip-preset-${name}`)!), `light ${name}`).toBe(measured[name][0]);
      expect(normalize(darkTheme.get(`--ads-tooltip-preset-${name}`)!), `dark ${name}`).toBe(measured[name][1]);
    }
  });

  it('every preset text reaches 4.5:1 on its background: light, dark and with the accessible file', () => {
    for (const [theme, tokens] of [['light', light], ['light with tokens-accessible.css', lightAccessible], ['dark', darkTheme]] as const) {
      for (const name of presets) {
        expect(ratio(tokens, `--ads-tooltip-preset-${name}-text`, `--ads-tooltip-preset-${name}`), `${theme} ${name}`).toBeGreaterThanOrEqual(4.5);
      }
    }
  });

  it('the text of a preset is the one of black and white that contrasts more (decision 3b)', () => {
    for (const [theme, tokens] of [['light', light], ['dark', darkTheme]] as const) {
      for (const name of presets) {
        const text = tokens.get(`--ads-tooltip-preset-${name}-text`)!;
        const other = text === '#ffffff' ? '#000000' : '#ffffff';
        const own = ratio(tokens, `--ads-tooltip-preset-${name}-text`, `--ads-tooltip-preset-${name}`);
        const withOther = new Map(tokens).set('--other', other);
        expect(own, `${theme} ${name}`).toBeGreaterThanOrEqual(ratio(withOther, '--other', `--ads-tooltip-preset-${name}`));
      }
    }
  });

  it('the default box reaches 4.5:1: white on #262626 (85% black on a white page), and on #424242 in the dark theme', () => {
    expect(normalize(light.get('--ads-tooltip-bg')!)).toBe('#262626');
    expect(ratio(light, '--ads-tooltip-color', '--ads-tooltip-bg')).toBeGreaterThan(15);
    expect(ratio(darkTheme, '--ads-tooltip-color', '--ads-tooltip-bg')).toBeGreaterThan(10);
  });

  it('the sizes are the ones measured on the Ant Design demo', () => {
    expect(light.get('--ads-tooltip-radius')).toBe('6px');
    expect(light.get('--ads-tooltip-padding')).toBe('6px 8px');
    expect(light.get('--ads-tooltip-min-height')).toBe('32px');
    expect(light.get('--ads-tooltip-max-width')).toBe('250px');
    expect(light.get('--ads-tooltip-z-index')).toBe('1070');
  });
});

describe('spin tokens', () => {
  // The sizes and times of the Ant Design token documentation and the public demos (React 6.7.1, read 2026-11-17).
  it('default light: the dimensions, the content opacity and the layer of the documentation', () => {
    expect(light.get('--ads-spin-dot-size')).toBe('20px');
    expect(light.get('--ads-spin-dot-size-sm')).toBe('14px');
    expect(light.get('--ads-spin-dot-size-lg')).toBe('32px');
    expect(light.get('--ads-spin-gap')).toBe('12px');
    expect(light.get('--ads-spin-container-opacity')).toBe('0.5');
    expect(light.get('--ads-spin-fullscreen-z-index')).toBe('1000');
    expect(light.get('--ads-spin-mask-bg')).toBe('rgba(0, 0, 0, 0.45)');
    expect(light.get('--ads-spin-color')).toBe('#1677ff');
    expect(light.get('--ads-spin-duration')).toBe('1.2s');
    expect(light.get('--ads-spin-pulse-duration')).toBe('1s');
  });

  it('the dots reach 3:1 on the page (WCAG 1.4.11) in the default light set, the accessible set and the dark theme', () => {
    expect(ratio(light, '--ads-spin-color', '--ads-color-bg-container')).toBeGreaterThanOrEqual(3);
    expect(ratio(lightAccessible, '--ads-spin-color', '--ads-color-bg-container')).toBeGreaterThanOrEqual(3);
    expect(ratio(darkTheme, '--ads-spin-color', '--ads-color-bg-container')).toBeGreaterThanOrEqual(3);
  });

  it('the description is below 4.5:1 in the default light set, which is why the accessible file darkens it', () => {
    expect(ratio(light, '--ads-spin-description-color', '--ads-color-bg-container')).toBeLessThan(4.5);
  });

  it('the description reaches 4.5:1 as text with the accessible file and in the dark theme', () => {
    expect(ratio(lightAccessible, '--ads-spin-description-color', '--ads-color-bg-container')).toBeGreaterThanOrEqual(4.5);
    expect(ratio(darkTheme, '--ads-spin-description-color', '--ads-color-bg-container')).toBeGreaterThanOrEqual(4.5);
  });

  /** The white text of a fullscreen Spin against the mask over the page of the theme. */
  function whiteOnMask(tokens: Map<string, string>): number {
    const page = over(parse(tokens.get('--ads-color-bg-container')!), { r: 255, g: 255, b: 255, a: 1 });
    const masked = over(parse(tokens.get('--ads-spin-mask-bg')!), page);
    const [hi, lo] = [luminance(parse(tokens.get('--ads-spin-fullscreen-color')!)), luminance(masked)].sort((x, y) => y - x);
    return (hi + 0.05) / (lo + 0.05);
  }

  it('fullscreen: the white dots reach 3:1 on the default mask over a white page, but the white text does not reach 4.5:1', () => {
    expect(light.get('--ads-spin-fullscreen-color')).toBe('#ffffff');
    expect(whiteOnMask(light)).toBeGreaterThanOrEqual(3);
    expect(whiteOnMask(light)).toBeLessThan(4.5);
  });

  it('fullscreen: the accessible mask gives the white text 4.5:1 over a white page, and the dark theme over its page', () => {
    expect(whiteOnMask(lightAccessible)).toBeGreaterThanOrEqual(4.5);
    expect(whiteOnMask(darkTheme)).toBeGreaterThanOrEqual(4.5);
  });
});

describe('message tokens (specs/message.md)', () => {
  // Measured on the Ant Design demo (React 6.7.1, 2026-11-16, Chromium, light and dark theme).
  const measuredLight: Record<string, string> = {
    '--ads-message-z-index': '2010',
    '--ads-message-top': '8px',
    '--ads-message-gap': '16px',
    '--ads-message-bg': '#ffffff',
    '--ads-message-color': 'rgba(0, 0, 0, 0.88)',
    '--ads-message-padding': '9px 12px',
    '--ads-message-radius': '8px',
    '--ads-message-icon-size': '16px',
    '--ads-message-icon-gap': '8px',
    '--ads-message-icon-success': '#52c41a',
    '--ads-message-icon-error': '#ff4d4f',
    '--ads-message-icon-warning': '#faad14',
    '--ads-message-icon-info': '#1677ff'
  };

  it('the light values are the ones measured on the Ant Design demo', () => {
    for (const [token, value] of Object.entries(measuredLight)) expect(normalize(light.get(token) ?? ''), token).toBe(normalize(value));
    expect(normalize(light.get('--ads-message-shadow')!)).toContain('0 6px 16px 0 rgba(0, 0, 0, 0.08)');
  });

  it('the dark theme has the box #1f1f1f with the text of Ant Design (85% white)', () => {
    expect(normalize(dark.get('--ads-message-bg')!)).toBe('#1f1f1f');
    expect(normalize(dark.get('--ads-message-color')!)).toBe('rgba(255, 255, 255, 0.85)');
  });

  it('the close button is 24 px, the smallest target of WCAG 2.5.8, and the box line is 22 px', () => {
    expect(light.get('--ads-message-close-size')).toBe('24px');
    expect(light.get('--ads-message-line-height')).toBe('22px');
  });

  for (const [theme, tokens] of [['light with the accessible file', lightAccessible], ['dark', darkTheme]] as const) {
    describe(theme, () => {
      it('the text reaches 4.5:1 on the box, and the close button 4.5:1 in rest and hover', () => {
        expect(ratio(tokens, '--ads-message-color', '--ads-message-bg')).toBeGreaterThanOrEqual(4.5);
        expect(ratio(tokens, '--ads-message-close-color', '--ads-message-bg')).toBeGreaterThanOrEqual(4.5);
        expect(ratio(tokens, '--ads-message-close-color-hover', '--ads-message-bg')).toBeGreaterThanOrEqual(4.5);
      });

      it('each type icon reaches 3:1 on the box (WCAG 1.4.11)', () => {
        for (const type of ['info', 'success', 'error', 'warning']) {
          expect(ratio(tokens, `--ads-message-icon-${type}`, '--ads-message-bg'), type).toBeGreaterThanOrEqual(3);
        }
      });
    });
  }

  it('the default light green and amber are below 3:1 on the white box, which is why the accessible file darkens them', () => {
    expect(ratio(light, '--ads-message-icon-success', '--ads-message-bg')).toBeLessThan(3);
    expect(ratio(light, '--ads-message-icon-warning', '--ads-message-bg')).toBeLessThan(3);
    expect(ratio(light, '--ads-message-icon-error', '--ads-message-bg')).toBeGreaterThanOrEqual(3);
    expect(ratio(light, '--ads-message-icon-info', '--ads-message-bg')).toBeGreaterThanOrEqual(3);
  });

  it('the dark theme overrides everything that is a color of the box', () => {
    for (const token of ['bg', 'color', 'shadow', 'icon-info', 'icon-success', 'icon-error', 'icon-warning', 'close-color', 'close-color-hover', 'close-bg', 'close-bg-hover']) {
      expect(dark.has(`--ads-message-${token}`), token).toBe(true);
    }
  });
});

describe('modal tokens (specs/modal.md)', () => {
  // Measured on the Ant Design demo (React 6.7.1, 2026-11-18, Chromium, light theme).
  const measured: Record<string, string> = {
    '--ads-modal-z-index': '1000',
    '--ads-modal-width': '520px',
    '--ads-modal-top': '100px',
    '--ads-modal-mask-bg': 'rgba(0, 0, 0, 0.45)',
    '--ads-modal-content-bg': '#ffffff',
    '--ads-modal-radius': '8px',
    '--ads-modal-padding': '20px 24px',
    '--ads-modal-title-color': 'rgba(0, 0, 0, 0.88)',
    '--ads-modal-title-font-size': '16px',
    '--ads-modal-title-line-height': '24px',
    '--ads-modal-title-font-weight': '600',
    '--ads-modal-header-gap': '8px',
    '--ads-modal-footer-margin-top': '12px',
    '--ads-modal-footer-gap': '8px',
    '--ads-modal-close-size': '32px',
    '--ads-modal-close-inset': '12px',
    '--ads-modal-close-color': 'rgba(0, 0, 0, 0.45)',
    '--ads-modal-confirm-width': '416px',
    '--ads-modal-confirm-icon-size': '22px',
    '--ads-modal-confirm-icon-gap': '12px',
    '--ads-modal-confirm-icon-success': '#52c41a',
    '--ads-modal-confirm-icon-error': '#ff4d4f',
    '--ads-modal-confirm-icon-warning': '#faad14',
    '--ads-modal-confirm-icon-info': '#1677ff'
  };

  it('the light values are the ones measured on the Ant Design demo', () => {
    for (const [token, value] of Object.entries(measured)) expect(normalize(light.get(token) ?? ''), token).toBe(normalize(value));
    expect(normalize(light.get('--ads-modal-shadow')!)).toContain('0 6px 16px 0 rgba(0, 0, 0, 0.08)');
    expect(normalize(light.get('--ads-modal-motion-ease')!)).toBe('cubic-bezier(0.08, 0.82, 0.17, 1)');
  });

  it('a message is above a Modal, so a message from the OK button is seen', () => {
    expect(Number(light.get('--ads-message-z-index'))).toBeGreaterThan(Number(light.get('--ads-modal-z-index')));
  });

  it('the layer is under the three popup layers, so a Select in a Modal opens above it', () => {
    const modal = Number(light.get('--ads-modal-z-index'));
    for (const popup of ['popover', 'dropdown', 'tooltip']) expect(modal, popup).toBeLessThan(Number(light.get(`--ads-${popup}-z-index`)));
  });

  it('the dark theme has the card #1f1f1f with the text of Ant Design (85% white)', () => {
    expect(normalize(dark.get('--ads-modal-content-bg')!)).toBe('#1f1f1f');
    expect(normalize(dark.get('--ads-modal-title-color')!)).toBe('rgba(255, 255, 255, 0.85)');
    expect(normalize(dark.get('--ads-modal-body-color')!)).toBe('rgba(255, 255, 255, 0.85)');
  });

  for (const [theme, tokens] of [['light with the accessible file', lightAccessible], ['dark', darkTheme]] as const) {
    describe(theme, () => {
      it('the title and the body reach 4.5:1 on the card', () => {
        expect(ratio(tokens, '--ads-modal-title-color', '--ads-modal-content-bg')).toBeGreaterThanOrEqual(4.5);
        expect(ratio(tokens, '--ads-modal-body-color', '--ads-modal-content-bg')).toBeGreaterThanOrEqual(4.5);
      });

      it('the close icon reaches 3:1 on the card in rest and in hover (WCAG 1.4.11)', () => {
        expect(ratio(tokens, '--ads-modal-close-color', '--ads-modal-content-bg')).toBeGreaterThanOrEqual(3);
        expect(ratio(tokens, '--ads-modal-close-color-hover', '--ads-modal-content-bg')).toBeGreaterThanOrEqual(3);
      });

      it('each icon of a static dialog reaches 3:1 on the card', () => {
        for (const type of ['info', 'success', 'error', 'warning']) {
          expect(ratio(tokens, `--ads-modal-confirm-icon-${type}`, '--ads-modal-content-bg'), type).toBeGreaterThanOrEqual(3);
        }
      });
    });
  }

  it('the default light green and amber are below 3:1 on the white card, which is why the accessible file darkens them', () => {
    expect(ratio(light, '--ads-modal-confirm-icon-success', '--ads-modal-content-bg')).toBeLessThan(3);
    expect(ratio(light, '--ads-modal-confirm-icon-warning', '--ads-modal-content-bg')).toBeLessThan(3);
    expect(ratio(light, '--ads-modal-confirm-icon-error', '--ads-modal-content-bg')).toBeGreaterThanOrEqual(3);
    expect(ratio(light, '--ads-modal-confirm-icon-info', '--ads-modal-content-bg')).toBeGreaterThanOrEqual(3);
  });

  it('the dark theme overrides everything that is a color of the card', () => {
    for (const token of ['content-bg', 'shadow', 'title-color', 'body-color', 'close-color', 'close-color-hover', 'close-bg-hover', 'confirm-icon-info', 'confirm-icon-success', 'confirm-icon-warning', 'confirm-icon-error']) {
      expect(dark.has(`--ads-modal-${token}`), token).toBe(true);
    }
  });
});

describe('menu tokens (specs/menu.md)', () => {
  // The "Design Token" table of the Ant Design React page (checked 2026-11-16).
  const documented: Record<string, string> = {
    '--ads-menu-item-height': '40px',
    '--ads-menu-item-margin-block': '4px',
    '--ads-menu-item-margin-inline': '4px',
    '--ads-menu-item-padding-inline': '16px',
    '--ads-menu-item-radius': '8px',
    '--ads-menu-submenu-item-radius': '4px',
    '--ads-menu-icon-size': '14px',
    '--ads-menu-icon-gap': '10px',
    '--ads-menu-collapsed-width': '80px',
    '--ads-menu-collapsed-icon-size': '16px',
    '--ads-menu-horizontal-line-height': '46px',
    '--ads-menu-active-bar-height': '2px',
    '--ads-menu-group-title-font-size': '14px',
    '--ads-menu-popup-min-width': '160px',
    '--ads-menu-bg': '#ffffff',
    '--ads-menu-popup-bg': '#ffffff',
    '--ads-menu-submenu-bg': 'rgba(0, 0, 0, 0.02)',
    '--ads-menu-item-color': 'rgba(0, 0, 0, 0.88)',
    '--ads-menu-item-hover-bg': 'rgba(0, 0, 0, 0.06)',
    '--ads-menu-item-active-bg': '#e6f4ff',
    '--ads-menu-item-selected-bg': '#e6f4ff',
    '--ads-menu-item-selected-color': '#1677ff',
    '--ads-menu-item-disabled-color': 'rgba(0, 0, 0, 0.25)',
    '--ads-menu-group-title-color': 'rgba(0, 0, 0, 0.45)',
    '--ads-menu-danger-color': '#ff4d4f',
    '--ads-menu-danger-selected-bg': '#fff2f0',
    '--ads-menu-horizontal-selected-color': '#1677ff',
    '--ads-menu-dark-bg': '#001529',
    '--ads-menu-dark-popup-bg': '#001529',
    '--ads-menu-dark-submenu-bg': '#000c17',
    '--ads-menu-dark-item-color': 'rgba(255, 255, 255, 0.65)',
    '--ads-menu-dark-item-hover-color': '#ffffff',
    '--ads-menu-dark-item-selected-bg': '#1677ff',
    '--ads-menu-dark-item-disabled-color': 'rgba(255, 255, 255, 0.25)',
    '--ads-menu-dark-danger-color': '#ff4d4f',
    '--ads-menu-dark-danger-selected-bg': '#ff4d4f'
  };

  for (const [token, value] of Object.entries(documented)) {
    it(`${token} is ${value}`, () => {
      expect(normalize(light.get(token) ?? '')).toBe(normalize(value));
    });
  }

  /** The color of `foreground` over the layers of a surface: the base token first, then the translucent layers of a state. */
  function contrast(tokens: Map<string, string>, base: string, foreground: string, ...layers: string[]): number {
    const white: Rgba = { r: 255, g: 255, b: 255, a: 1 };
    const background = layers.reduce((below, layer) => over(parse(tokens.get(layer)!), below), over(parse(tokens.get(base)!), white));
    const color = over(parse(tokens.get(foreground)!), background);
    const [hi, lo] = [luminance(color), luminance(background)].sort((x, y) => y - x);
    return (hi + 0.05) / (lo + 0.05);
  }

  /** What each state of a light menu paints: [name, base, foreground, layers]. */
  const lightPairs: Array<[string, string, string, string[]]> = [
    ['the item', '--ads-menu-bg', '--ads-menu-item-color', []],
    ['the item on hover', '--ads-menu-bg', '--ads-menu-item-hover-color', ['--ads-menu-item-hover-bg']],
    ['the selected item', '--ads-menu-bg', '--ads-menu-item-selected-color', ['--ads-menu-item-selected-bg']],
    ['a submenu with the selected item', '--ads-menu-bg', '--ads-menu-submenu-selected-color', []],
    ['the horizontal selected item', '--ads-menu-bg', '--ads-menu-horizontal-selected-color', []],
    ['the horizontal item on hover', '--ads-menu-bg', '--ads-menu-horizontal-hover-color', []],
    ['the group title', '--ads-menu-bg', '--ads-menu-group-title-color', []],
    ['the group title in a submenu', '--ads-menu-bg', '--ads-menu-group-title-color', ['--ads-menu-submenu-bg']],
    ['the item in a popup', '--ads-menu-popup-bg', '--ads-menu-item-color', []],
    ['the danger item', '--ads-menu-bg', '--ads-menu-danger-color', []],
    ['the danger item on hover', '--ads-menu-bg', '--ads-menu-danger-hover-color', ['--ads-menu-item-hover-bg']],
    ['the selected danger item', '--ads-menu-bg', '--ads-menu-danger-selected-color', ['--ads-menu-danger-selected-bg']]
  ];

  it('three defaults of the light theme are below 4.5:1, which is why the accessible file darkens them', () => {
    expect(contrast(light, '--ads-menu-bg', '--ads-menu-item-selected-color', '--ads-menu-item-selected-bg')).toBeLessThan(4.5);
    expect(contrast(light, '--ads-menu-bg', '--ads-menu-group-title-color')).toBeLessThan(4.5);
    expect(contrast(light, '--ads-menu-bg', '--ads-menu-danger-color')).toBeLessThan(4.5);
    expect(contrast(light, '--ads-menu-bg', '--ads-menu-danger-selected-color', '--ads-menu-danger-selected-bg')).toBeLessThan(4.5);
  });

  it('the dark menu defaults are below 4.5:1 for the selected and danger-selected fills with white text', () => {
    expect(contrast(light, '--ads-menu-dark-item-selected-bg', '--ads-menu-dark-item-selected-color')).toBeLessThan(4.5);
    expect(contrast(light, '--ads-menu-dark-danger-selected-bg', '--ads-menu-dark-danger-selected-color')).toBeLessThan(4.5);
  });

  for (const [theme, tokens] of [['light with the accessible file', lightAccessible], ['dark', darkTheme]] as const) {
    describe(theme, () => {
      for (const [name, base, foreground, layers] of lightPairs) {
        it(`${name} reaches 4.5:1`, () => {
          expect(contrast(tokens, base, foreground, ...layers)).toBeGreaterThanOrEqual(4.5);
        });
      }

      it('the dark menu: the item, the hovered item, the group title, the disabled item are readable, and the fills reach 4.5:1 with white text', () => {
        expect(contrast(tokens, '--ads-menu-dark-bg', '--ads-menu-dark-item-color')).toBeGreaterThanOrEqual(4.5);
        expect(contrast(tokens, '--ads-menu-dark-bg', '--ads-menu-dark-item-hover-color')).toBeGreaterThanOrEqual(4.5);
        expect(contrast(tokens, '--ads-menu-dark-submenu-bg', '--ads-menu-dark-item-color')).toBeGreaterThanOrEqual(4.5);
        expect(contrast(tokens, '--ads-menu-dark-bg', '--ads-menu-dark-group-title-color')).toBeGreaterThanOrEqual(4.5);
        expect(contrast(tokens, '--ads-menu-dark-popup-bg', '--ads-menu-dark-item-color')).toBeGreaterThanOrEqual(4.5);
        expect(contrast(tokens, '--ads-menu-dark-item-selected-bg', '--ads-menu-dark-item-selected-color')).toBeGreaterThanOrEqual(4.5);
        expect(contrast(tokens, '--ads-menu-dark-bg', '--ads-menu-dark-danger-color')).toBeGreaterThanOrEqual(4.5);
        expect(contrast(tokens, '--ads-menu-dark-bg', '--ads-menu-dark-danger-hover-color')).toBeGreaterThanOrEqual(4.5);
        expect(contrast(tokens, '--ads-menu-dark-danger-selected-bg', '--ads-menu-dark-danger-selected-color')).toBeGreaterThanOrEqual(4.5);
      });
    });
  }

  it('the dark theme of the page defines the colors of the light menu again', () => {
    for (const token of [...light.keys()].filter((name) => /^--ads-menu-(?!dark-)(bg|popup-bg|submenu-bg|split|popup-shadow|item-(color|hover-color|hover-bg|active-bg|selected-color|selected-bg|disabled-color)|submenu-selected-color|group-title-color|danger-.*(color|bg)|horizontal-(hover|selected)-color)$/.test(name))) {
      expect(dark.has(token), token).toBe(true);
    }
  });

  it('the accessible file changes only the colors that missed, in the light menu and in the dark menu', () => {
    const changed = [...accessible.keys()].filter((token) => token.startsWith('--ads-menu-'));
    expect(changed.sort()).toEqual([
      '--ads-menu-danger-color',
      '--ads-menu-danger-hover-color',
      '--ads-menu-danger-selected-color',
      '--ads-menu-dark-danger-active-bg',
      '--ads-menu-dark-danger-selected-bg',
      '--ads-menu-dark-item-selected-bg',
      '--ads-menu-group-title-color',
      '--ads-menu-horizontal-hover-color',
      '--ads-menu-horizontal-selected-color',
      '--ads-menu-item-selected-color',
      '--ads-menu-submenu-selected-color'
    ]);
  });

  it('the z-index of the popups is the dropdown layer, which the primitive sets; the dark menu keeps its colors on a dark page', () => {
    expect(dark.get('--ads-menu-dark-bg')).toBeUndefined();
    expect(dark.get('--ads-menu-dark-item-selected-bg')).toBe('#1668dc');
  });
});
