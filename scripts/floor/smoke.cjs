// Smoke run of the library on the lowest browser versions (specs/popup.md, "browser floor"). It runs inside the
// official Playwright image of an old release (scripts/floor/run.mjs), so it may use only the API that exists
// from Playwright 1.7 to 1.22: no `getByRole`, no `expect`, no `emulateMedia({ reducedMotion })`.
//
//   node smoke.cjs <chromium|firefox|webkit> <base url> <output dir>
//
// It opens the e2e fixtures built for the floor (the Button / Switch / Checkbox / Input page, the Select lab and
// the Tooltip lab), drives them with real clicks and keys and checks what only a real engine can show: that nothing throws
// (an API missing in the old engine), that sizes are the designed ones, that a panel opens where it should and
// stays in the viewport, and that `:focus-visible` works (the reason of the Safari 15.4 floor).
/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS on purpose: it runs in the old Node of the old images, where `NODE_PATH` finds the `playwright` package only for `require` */
const fs = require('fs');
const path = require('path');
const playwright = require('playwright');

const [engine, base, outDir] = process.argv.slice(2);
const VIEWPORT = { width: 1000, height: 800 };
const results = [];
const errors = [];

function record(name, ok, detail) {
  results.push({ name, ok: Boolean(ok), detail: detail === undefined ? '' : String(detail) });
}

async function check(name, run) {
  try {
    const outcome = await run();
    // A check returns `true`, or `[ok, detail]` when the numbers are worth showing.
    if (Array.isArray(outcome)) record(name, outcome[0], outcome[1]);
    else record(name, outcome === true, outcome === true ? '' : outcome);
  } catch (error) {
    record(name, false, `threw: ${String(error && error.message ? error.message : error).split('\n')[0]}`);
  }
}

const rectOf = (page, selector, closest) =>
  page.evaluate(
    ([sel, up]) => {
      let element = document.querySelector(sel);
      if (element && up) element = element.closest(up);
      if (!element) return null;
      const r = element.getBoundingClientRect();
      return { x: r.x, y: r.y, width: r.width, height: r.height, right: r.right, bottom: r.bottom };
    },
    [selector, closest || null]
  );

const attributeOf = (page, selector, name) => page.evaluate(([sel, attr]) => document.querySelector(sel).getAttribute(attr), [selector, name]);
const textOf = (page, selector) => page.evaluate((sel) => document.querySelector(sel).textContent.trim(), selector);
const idOf = (testid) => `[data-testid="${testid}"]`;
const PANEL = '.ads-popup:not([hidden])';

/** The rectangles of the options of the open panel, with their text. */
const optionsOf = (page) =>
  page.evaluate((panel) => {
    return Array.from(document.querySelectorAll(`${panel} [role="option"]`)).map((option) => {
      const r = option.getBoundingClientRect();
      return { text: option.textContent.trim(), x: r.x + r.width / 2, y: r.y + r.height / 2 };
    });
  }, PANEL);

const settle = (page) => page.waitForTimeout(450);

/**
 * What an old engine may not understand on purpose: each is an enhancement that the library writes so that the
 * engine which does not know it simply keeps the plain look, and nothing breaks. Everything else that the audit
 * reports fails the run. Adding a line here is a decision about the browser floor (specs/popup.md): give the reason.
 */
const ENHANCEMENTS = [
  [/^@media \(forced-colors/, 'forced colors (Windows High Contrast): an engine without it never applies the block (Firefox before 89, Safari)'],
  [/^forced-color-adjust:/, 'it only occurs inside the forced-colors block above'],
  [/^color-scheme:/, 'dark native controls: Firefox before 96 keeps the light ones in the dark theme'],
  [/^overscroll-behavior:/, 'the list of a panel does not hold the scroll of the page at its end: Safari before 16']
];

/**
 * Runs in the page: asks this engine whether it understands every selector, declaration and media query of the CSS
 * the page loaded. A declaration or a rule the engine does not know is dropped without a sound, so a geometry
 * check sees it only when it happens to move a measured box; here the engine itself is the judge
 * (`CSS.supports`). Vendor-prefixed names are counted apart: they are fallbacks that another engine does not know
 * on purpose. Self-contained (it is serialized into the page) and written for the engines it checks.
 */
function cssAudit() {
  var found = [];
  var vendor = [];
  var atRules = {};
  var counts = { selectors: 0, declarations: 0, medias: 0 };
  var prefixed = /(^|[\s:(,])-(webkit|moz|ms|o)-|::?-(webkit|moz|ms)-/i;
  // A selector is judged by the parser of the engine: `insertRule` throws on one it does not know. (`CSS.supports`
  // with `selector()` says no to `::placeholder` in WebKit 15.4, which styles it.)
  var probe = document.createElement('style');
  document.head.appendChild(probe);
  function knowsSelector(selector) {
    try {
      probe.sheet.insertRule(selector + '{}', 0);
      probe.sheet.deleteRule(0);
      return true;
    } catch {
      return false;
    }
  }

  function topIndex(text, start, chars) {
    var depth = 0;
    var quote = '';
    for (var i = start; i < text.length; i++) {
      var c = text.charAt(i);
      if (quote) {
        if (c === '\\') i++;
        else if (c === quote) quote = '';
        continue;
      }
      if (c === '"' || c === "'") quote = c;
      else if (c === '(' || c === '[') depth++;
      else if (c === ')' || c === ']') depth--;
      else if (depth === 0 && chars.indexOf(c) !== -1) return i;
    }
    return -1;
  }

  function splitTop(text, separator) {
    var parts = [];
    var from = 0;
    for (;;) {
      var at = topIndex(text, from, separator);
      if (at === -1) {
        parts.push(text.slice(from));
        return parts;
      }
      parts.push(text.slice(from, at));
      from = at + 1;
    }
  }

  function blockEnd(text, open) {
    var depth = 0;
    var quote = '';
    for (var i = open; i < text.length; i++) {
      var c = text.charAt(i);
      if (quote) {
        if (c === '\\') i++;
        else if (c === quote) quote = '';
        continue;
      }
      if (c === '"' || c === "'") quote = c;
      else if (c === '{') depth++;
      else if (c === '}') {
        depth--;
        if (depth === 0) return i;
      }
    }
    return text.length;
  }

  function report(list, text) {
    (prefixed.test(text) ? vendor : list).push(text.length > 140 ? text.slice(0, 140) + '...' : text);
  }

  function declarationsOf(body) {
    splitTop(body, ';').forEach(function (chunk) {
      var colon = chunk.indexOf(':');
      if (colon === -1 || chunk.indexOf('{') !== -1) return;
      var property = chunk.slice(0, colon).trim();
      var value = chunk.slice(colon + 1).replace(/!important\s*$/i, '').trim();
      if (!property || property.slice(0, 2) === '--') return;
      counts.declarations++;
      if (!CSS.supports(property, value)) report(found, property + ': ' + value);
    });
  }

  function walk(text, inKeyframes) {
    var i = 0;
    while (i < text.length) {
      var stop = topIndex(text, i, '{;');
      if (stop === -1) return;
      var prelude = text.slice(i, stop).trim();
      if (text.charAt(stop) === ';') {
        i = stop + 1;
        continue;
      }
      var end = blockEnd(text, stop);
      var body = text.slice(stop + 1, end);
      i = end + 1;
      if (prelude.charAt(0) === '@') {
        var name = prelude.slice(1).split(/[\s({]/)[0].toLowerCase();
        atRules[name] = (atRules[name] || 0) + 1;
        if (name === 'media') {
          counts.medias++;
          var query = prelude.slice(6).trim();
          if (query !== 'not all' && matchMedia(query).media === 'not all') found.push('@media ' + query);
          walk(body, false);
        } else if (name === 'supports' || name === 'layer' || name === 'scope') {
          walk(body, false);
        } else if (/keyframes$/.test(name)) {
          walk(body, true);
        } else if (name === 'container' && !window.CSSContainerRule) {
          found.push('@container');
        } else if (name === 'property' && !window.CSSPropertyRule) {
          found.push('@property');
        } else if (name === 'container') {
          walk(body, false);
        }
      } else {
        if (!inKeyframes) {
          splitTop(prelude, ',').forEach(function (selector) {
            selector = selector.trim();
            counts.selectors++;
            if (selector && !knowsSelector(selector)) report(found, 'selector ' + selector);
          });
        }
        declarationsOf(body);
      }
    }
  }

  var links = Array.prototype.slice.call(document.querySelectorAll('link[rel="stylesheet"]'));
  return Promise.all(
    links.map(function (link) {
      return fetch(link.href).then(function (response) {
        return response.text();
      });
    })
  ).then(function (sheets) {
    sheets.forEach(function (css) {
      walk(css.replace(/\/\*[\s\S]*?\*\//g, ''), false);
    });
    return { sheets: sheets.length, counts: counts, atRules: atRules, found: found, vendor: vendor };
  });
}

async function newPage(context, url) {
  const page = await context.newPage();
  page.setDefaultTimeout(8000);
  page.on('pageerror', (error) => errors.push(`pageerror at ${url}: ${error.message.split('\n')[0]}`));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`console.error at ${url}: ${message.text().split('\n')[0]}`);
  });
  await page.goto(url);
  return page;
}

async function homePage(context) {
  const page = await newPage(context, base + '/');
  await page.waitForSelector(idOf('default'));

  await check('button: the variants render and the medium one is 32px high', async () => {
    for (const id of ['default', 'primary', 'dashed', 'text', 'link', 'danger-primary', 'disabled']) {
      const r = await rectOf(page, idOf(id));
      if (!r || r.width <= 0 || r.height <= 0) return `${id} has no box`;
    }
    const height = (await rectOf(page, idOf('default'))).height;
    return [Math.abs(height - 32) < 0.5, `default is ${height}px`];
  });

  await check('switch: a click flips it and the size does not change', async () => {
    const before = await rectOf(page, idOf('sw-off'));
    const state = await attributeOf(page, idOf('sw-off'), 'aria-checked');
    await page.click(idOf('sw-off'));
    await settle(page);
    const after = await rectOf(page, idOf('sw-off'));
    const flipped = await attributeOf(page, idOf('sw-off'), 'aria-checked');
    const same = Math.abs(before.width - after.width) < 0.5 && Math.abs(before.height - after.height) < 0.5;
    return [state === 'false' && flipped === 'true' && same, `aria-checked ${state} -> ${flipped}, ${before.width}x${before.height} -> ${after.width}x${after.height}`];
  });

  await check('checkbox: a click checks it', async () => {
    const was = await page.evaluate((sel) => document.querySelector(sel).checked, idOf('cb-off'));
    await page.click(idOf('cb-off'));
    const now = await page.evaluate((sel) => document.querySelector(sel).checked, idOf('cb-off'));
    return [was === false && now === true, `checked ${was} -> ${now}`];
  });

  await check('input: typing sets the value', async () => {
    await page.click(idOf('in-rest'));
    await page.keyboard.type('hello');
    const value = await page.evaluate((sel) => document.querySelector(sel).value, idOf('in-rest'));
    return [value === 'hello', `value "${value}"`];
  });

  await check(':focus-visible: a key focus matches it and the ring is drawn', async () => {
    await page.focus(idOf('default'));
    await page.keyboard.press('Tab');
    const info = await page.evaluate(() => {
      const element = document.activeElement;
      let matches = false;
      try {
        matches = element.matches(':focus-visible');
      } catch {
        matches = false;
      }
      const style = getComputedStyle(element);
      return { matches, outline: `${style.outlineStyle} ${style.outlineWidth}`, shadow: style.boxShadow, tag: element.tagName };
    });
    const drawn = info.outline.indexOf('none') === -1 || info.shadow !== 'none';
    return [info.matches && drawn, `${info.tag} matches=${info.matches} outline=${info.outline} shadow=${info.shadow.slice(0, 40)}`];
  });

  await check('css: this engine understands every selector, declaration and media query of the shipped CSS', async () => {
    const audit = await page.evaluate(cssAudit);
    const { selectors, declarations, medias } = audit.counts;
    fs.writeFileSync(path.join(outDir, `${engine}-css-audit.json`), JSON.stringify(audit, null, 2));
    if (audit.sheets === 0 || selectors < 100 || declarations < 300) return [false, `the audit read too little: ${audit.sheets} sheets, ${selectors} selectors, ${declarations} declarations`];
    const failures = audit.found.filter((text) => !ENHANCEMENTS.some(([pattern]) => pattern.test(text)));
    const head = failures.slice(0, 3).join(' || ');
    return [
      failures.length === 0,
      `${selectors} selectors, ${declarations} declarations, ${medias} media queries; not understood: ${failures.length}${head ? ` (${head})` : ''}, enhancements ${audit.found.length - failures.length}, vendor-prefixed ${audit.vendor.length}`
    ];
  });

  await page.screenshot({ path: path.join(outDir, `${engine}-home.png`) });
  await page.close();
}

async function tooltipPage(context) {
  const page = await newPage(context, base + '/#tooltip');
  await page.waitForSelector(idOf('main'));
  await settle(page);
  const TIP = '[role="tooltip"]';
  const shown = () => page.evaluate((sel) => Array.from(document.querySelectorAll(sel)).some((tip) => tip.getBoundingClientRect().width > 0), TIP);

  await check('tooltip: hovering the trigger opens the tip above it, inside the viewport, and leaving closes it', async () => {
    const trigger = await rectOf(page, idOf('main'));
    await page.mouse.move(trigger.x + trigger.width / 2, trigger.y + trigger.height / 2);
    await settle(page);
    if (!(await shown())) return 'the tip did not open on hover';
    const tip = await rectOf(page, `${PANEL} .ads-tooltip`);
    const above = tip.bottom <= trigger.y + 0.5;
    const centered = Math.abs(tip.x + tip.width / 2 - (trigger.x + trigger.width / 2)) < 1.5;
    const inside = tip.x >= 0 && tip.right <= VIEWPORT.width && tip.y >= 0;
    await page.mouse.move(900, 700);
    await settle(page);
    const closed = !(await shown());
    return [above && centered && inside && closed, `above ${above}, centered ${centered}, inside ${inside}, closed ${closed}`];
  });

  await check('tooltip: the tip does not move the trigger or its neighbour', async () => {
    const before = [await rectOf(page, idOf('main')), await rectOf(page, idOf('neighbor'))];
    const trigger = before[0];
    await page.mouse.move(trigger.x + trigger.width / 2, trigger.y + trigger.height / 2);
    await settle(page);
    const during = [await rectOf(page, idOf('main')), await rectOf(page, idOf('neighbor'))];
    await page.mouse.move(900, 700);
    await settle(page);
    const moved = before.some((r, i) => Math.abs(r.x - during[i].x) > 0.01 || Math.abs(r.y - during[i].y) > 0.01 || Math.abs(r.width - during[i].width) > 0.01);
    return [!moved, moved ? 'something moved' : 'nothing moved'];
  });

  await check('tooltip: keyboard focus opens it, aria-describedby points at it, Escape closes it and focus stays', async () => {
    await page.focus(idOf('main'));
    await settle(page);
    if (!(await shown())) return 'focus did not open it';
    const id = await page.evaluate((sel) => document.querySelector(sel + ':not([hidden]) ' + '[role="tooltip"]').id, '.ads-popup');
    const described = await attributeOf(page, idOf('main'), 'aria-describedby');
    await page.keyboard.press('Escape');
    await settle(page);
    const closed = !(await shown());
    const stays = await page.evaluate(() => document.activeElement && document.activeElement.getAttribute('data-testid') === 'main');
    const removed = (await attributeOf(page, idOf('main'), 'aria-describedby')) === null;
    return [described === id && closed && stays && removed, `describedby ${described === id}, closed ${closed}, focus stays ${stays}, attribute removed ${removed}`];
  });

  await check('tooltip: a disabled button still opens the tip on hover (specs/tooltip.md, P8)', async () => {
    const trigger = await rectOf(page, idOf('disabled'));
    await page.mouse.move(trigger.x + trigger.width / 2, trigger.y + trigger.height / 2);
    await settle(page);
    const open = await shown();
    await page.mouse.move(900, 700);
    await settle(page);
    return [open, open ? 'opened' : 'the engine does not pass the mouse events of a disabled button to the wrapper'];
  });

  await check('tooltip: the preset colors are painted, with a readable text color', async () => {
    await page.evaluate(() => window.__tooltipLab.set({ open: true, color: 'blue' }));
    await settle(page);
    const painted = await page.evaluate(() => {
      const box = document.querySelector('.ads-popup:not([hidden]) .ads-tooltip');
      const style = getComputedStyle(box);
      return { background: style.backgroundColor, color: style.color };
    });
    await page.evaluate(() => window.__tooltipLab.set({ open: false, color: undefined }));
    await settle(page);
    return [painted.background === 'rgb(22, 119, 255)' && painted.color === 'rgb(0, 0, 0)', `${painted.background} with ${painted.color}`];
  });

  await check('tooltip: a custom color gets a contrasting text color', async () => {
    await page.evaluate(() => window.__tooltipLab.set({ open: true, color: '#87d068' }));
    await settle(page);
    const painted = await page.evaluate(() => {
      const style = getComputedStyle(document.querySelector('.ads-popup:not([hidden]) .ads-tooltip'));
      return { background: style.backgroundColor, color: style.color };
    });
    await page.evaluate(() => window.__tooltipLab.set({ open: false, color: undefined }));
    return [painted.background === 'rgb(135, 208, 104)' && painted.color === 'rgb(0, 0, 0)', `${painted.background} with ${painted.color}`];
  });
  await page.close();
}

async function selectPage(context) {
  const page = await newPage(context, base + '/#select');
  await page.waitForSelector(idOf('single'));
  await settle(page);

  await check('select: the fields are 40, 32 and 24px high', async () => {
    const sizes = [];
    for (const [size, height] of [['large', 40], ['medium', 32], ['small', 24]]) {
      const r = await rectOf(page, idOf(`size-${size}`), '.ads-select');
      sizes.push(`${size} ${r ? r.height : 'none'}`);
      if (!r || Math.abs(r.height - height) > 0.5) return [false, sizes.join(', ')];
    }
    return [true, sizes.join(', ')];
  });

  await check('select: a click opens the panel under the field, inside the viewport, and an option can be picked', async () => {
    await page.click(idOf('single'));
    await page.waitForSelector(PANEL);
    await settle(page);
    const field = await rectOf(page, idOf('single'), '.ads-select');
    const panel = await rectOf(page, PANEL);
    const options = await optionsOf(page);
    await page.screenshot({ path: path.join(outDir, `${engine}-select-open.png`) });
    const inside = panel.x >= -1 && panel.right <= VIEWPORT.width + 1 && panel.y >= -1 && panel.bottom <= VIEWPORT.height + 1;
    const below = panel.y >= field.bottom - 2;
    if (options.length < 3) return [false, `${options.length} options`];
    const happy = options.filter((option) => option.text === 'Happy')[0];
    await page.mouse.click(happy.x, happy.y);
    await settle(page);
    const value = await textOf(page, idOf('single-value'));
    const changes = await textOf(page, idOf('changes'));
    return [inside && below && value === 'happy' && changes === '1', `panel ${Math.round(panel.x)},${Math.round(panel.y)} ${Math.round(panel.width)}x${Math.round(panel.height)} field bottom ${Math.round(field.bottom)}; value=${value} changes=${changes}`];
  });

  await check('select: ArrowDown opens, Escape closes', async () => {
    await page.focus(idOf('search'));
    await page.keyboard.press('ArrowDown');
    await page.waitForSelector(PANEL);
    await page.keyboard.press('Escape');
    await settle(page);
    const left = await page.evaluate((panel) => document.querySelectorAll(panel).length, PANEL);
    return [left === 0, `${left} panels left open`];
  });

  await check('select search: typing filters the options', async () => {
    await page.focus(idOf('search'));
    await page.keyboard.type('happ');
    await page.waitForSelector(PANEL);
    await settle(page);
    const options = await optionsOf(page);
    await page.keyboard.press('Escape');
    await settle(page);
    return [options.length === 1 && options[0].text === 'Happy', options.map((option) => option.text).join(' | ')];
  });

  await check('select at the bottom of the page: the panel opens above the field and stays in the viewport', async () => {
    await page.evaluate((sel) => document.querySelector(sel).scrollIntoView({ block: 'end' }), idOf('bottom'));
    await settle(page);
    await page.click(idOf('bottom'));
    await page.waitForSelector(PANEL);
    await settle(page);
    const field = await rectOf(page, idOf('bottom'), '.ads-select');
    const panel = await rectOf(page, PANEL);
    await page.screenshot({ path: path.join(outDir, `${engine}-select-flip.png`) });
    const above = panel.bottom <= field.y + 2;
    const inside = panel.y >= -1 && panel.bottom <= VIEWPORT.height + 1;
    return [above && inside, `field ${Math.round(field.y)}-${Math.round(field.bottom)}, panel ${Math.round(panel.y)}-${Math.round(panel.bottom)}, viewport ${VIEWPORT.height}`];
  });

  await page.close();
}

(async () => {
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await playwright[engine].launch();
  const version = browser.version();
  const context = await browser.newContext({ viewport: VIEWPORT });
  const userAgent = await (async () => {
    const page = await context.newPage();
    const value = await page.evaluate(() => navigator.userAgent);
    await page.close();
    return value;
  })();
  try {
    await homePage(context);
    await selectPage(context);
    await tooltipPage(context);
  } catch (error) {
    record('run', false, `threw: ${String(error && error.message ? error.message : error).split('\n')[0]}`);
  }
  record('no page errors and no console errors on any page', errors.length === 0, errors.slice(0, 3).join(' || '));
  await browser.close();
  const summary = { engine, version, userAgent, playwright: require('playwright/package.json').version, results };
  fs.writeFileSync(path.join(outDir, `${engine}.json`), JSON.stringify(summary, null, 2));
  for (const result of results) console.log(`${result.ok ? 'PASS' : 'FAIL'}  ${result.name}${result.detail ? `  [${result.detail}]` : ''}`);
  console.log(`${engine} ${version} (Playwright ${summary.playwright}): ${results.filter((r) => r.ok).length}/${results.length} passed`);
  process.exit(results.every((result) => result.ok) ? 0 : 1);
})().catch((error) => {
  console.error('smoke crashed:', error);
  process.exit(2);
});
