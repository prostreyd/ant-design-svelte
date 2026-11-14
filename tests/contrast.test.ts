import { describe, expect, it } from 'vitest';
import { contrastText, luminance, parseComputedColor, TEXT_ON_DARK, TEXT_ON_LIGHT } from '../src/lib/internal/contrast';

describe('parseComputedColor', () => {
  it('reads rgb() and rgba() with commas or spaces', () => {
    expect(parseComputedColor('rgb(135, 208, 104)')).toEqual([135, 208, 104]);
    expect(parseComputedColor('rgba(0, 0, 0, 0.85)')).toEqual([0, 0, 0]);
    expect(parseComputedColor('rgb(255 85 0 / 50%)')).toEqual([255, 85, 0]);
  });

  it('reads color(srgb ...) with 0 to 1 channels', () => {
    expect(parseComputedColor('color(srgb 1 0.5 0)')).toEqual([255, 127.5, 0]);
  });

  it('returns null for what it cannot read', () => {
    expect(parseComputedColor('oklch(0.5 0.1 200)')).toBeNull();
    expect(parseComputedColor('')).toBeNull();
    expect(parseComputedColor('transparent')).toBeNull();
  });
});

describe('contrastText: the text color of decision 3b', () => {
  it('white on a dark background, black on a light one', () => {
    expect(contrastText('rgb(0, 0, 0)')).toBe(TEXT_ON_DARK);
    expect(contrastText('rgb(255, 255, 255)')).toBe(TEXT_ON_LIGHT);
  });

  it('is the color of the two that contrasts more, on the colors measured on the Ant Design demo', () => {
    // [background, expected text]: light theme presets, a custom light green and a custom orange.
    const cases: Array<[string, string]> = [
      ['rgb(250, 219, 20)', TEXT_ON_LIGHT], // yellow
      ['rgb(22, 119, 255)', TEXT_ON_LIGHT], // blue: black 5.12, white 4.10
      ['rgb(114, 46, 209)', TEXT_ON_DARK], // purple
      ['rgb(47, 84, 235)', TEXT_ON_DARK], // geekblue
      ['rgb(135, 208, 104)', TEXT_ON_LIGHT], // #87d068
      ['rgb(255, 85, 0)', TEXT_ON_LIGHT] // #f50: black 6.55, white 3.21
    ];
    for (const [background, text] of cases) expect(contrastText(background), background).toBe(text);
  });

  it('the chosen color reaches 4.5:1 on a sweep of grays and hues', () => {
    const ratio = (a: number, b: number) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
    for (let r = 0; r <= 255; r += 15) {
      for (let g = 0; g <= 255; g += 15) {
        for (let b = 0; b <= 255; b += 51) {
          const text = contrastText(`rgb(${r}, ${g}, ${b})`);
          const textLuminance = text === TEXT_ON_DARK ? 1 : 0;
          expect(ratio(luminance(r, g, b), textLuminance)).toBeGreaterThanOrEqual(4.5);
        }
      }
    }
  });

  it('returns null for a color it cannot read', () => {
    expect(contrastText('oklch(0.5 0.1 200)')).toBeNull();
  });
});
