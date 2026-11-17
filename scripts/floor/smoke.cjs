// Smoke run of the library on the lowest browser versions (specs/popup.md, "browser floor"). It runs inside the
// official Playwright image of an old release (scripts/floor/run.mjs), so it may use only the API that exists
// from Playwright 1.7 to 1.22: no `getByRole`, no `expect`, no `emulateMedia({ reducedMotion })`.
//
//   node smoke.cjs <chromium|firefox|webkit> <base url> <output dir>
//
// It opens the e2e fixtures built for the floor (the Button / Switch / Checkbox / Input page, the Select lab, the
// Tooltip lab, the Radio lab, the grid lab and the Spin lab), drives them with real clicks and keys and checks what only a real engine can show: that nothing throws
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

async function radioPage(context) {
  const page = await newPage(context, base + '/#radio');
  await page.waitForSelector(idOf('lab-fruit'));
  await settle(page);
  const inputs = (group) => `${idOf(group)} input[type="radio"]`;
  const checkedOf = (group) =>
    page.evaluate((sel) => Array.from(document.querySelectorAll(sel)).filter((input) => input.checked).map((input) => input.value).join(','), inputs(group));
  const activeValue = () => page.evaluate(() => {
    const active = document.activeElement;
    return active && active.type === 'radio' ? active.value : active ? active.tagName : 'none';
  });

  // First, on the page as it was made: the Tab order. A group is one Tab stop, on the checked radio.
  await check('radio: a group is one Tab stop, on the checked radio, and the focus ring is drawn on its mark', async () => {
    await page.focus(idOf('lab-before'));
    await page.keyboard.press('Tab');
    const single = await activeValue();
    await page.keyboard.press('Tab');
    const fruit = await activeValue();
    const ring = await page.evaluate(() => {
      const mark = document.activeElement.nextElementSibling;
      const style = getComputedStyle(mark);
      return style.outlineStyle + ' ' + style.outlineWidth;
    });
    await page.keyboard.press('Tab');
    const size = await activeValue();
    return [single === 'on' && fruit === 'Pear' && size === 'Medium' && ring.indexOf('solid') === 0, `single ${single}, fruit group ${fruit}, size group ${size}, ring ${ring}`];
  });

  await check('radio: the arrow keys move the selection inside a group and leave the other groups alone', async () => {
    await page.focus(`${idOf('lab-fruit')} input[value="Pear"]`);
    await page.keyboard.press('ArrowRight');
    const afterRight = await checkedOf('lab-fruit');
    const focused = await activeValue();
    await page.keyboard.press('ArrowLeft');
    const afterLeft = await checkedOf('lab-fruit');
    const size = await checkedOf('lab-size');
    return [afterRight === 'Orange' && focused === 'Orange' && afterLeft === 'Pear' && size === 'Medium', `right ${afterRight} (focus ${focused}), left ${afterLeft}, size group ${size}`];
  });

  await check('radio: a click selects a radio and unchecks the previous one, in the view and in the state', async () => {
    await page.click(`${idOf('lab-fruit')} input[value="Apple"]`);
    const checked = await checkedOf('lab-fruit');
    const state = await textOf(page, idOf('lab-value'));
    return [checked === 'Apple' && state === 'Apple', `checked ${checked}, state ${state}`];
  });

  await check('radio: selecting does not change a size or move a neighbour', async () => {
    const read = () =>
      page.evaluate(() =>
        Array.from(document.querySelectorAll('main label')).map((label) => {
          const r = label.getBoundingClientRect();
          return [r.x, r.y + window.scrollY, r.width, r.height].map((value) => Math.round(value * 100) / 100).join(',');
        }).join(' | ')
      );
    const before = await read();
    await page.click(`${idOf('lab-fruit')} input[value="Orange"]`);
    await page.click(`${idOf('lab-size')} input[value="Large"]`);
    const after = await read();
    return [before === after, before === after ? 'same boxes' : 'a box moved'];
  });

  await check('radio button: the buttons are 32px high, share a border, and only the outer corners are round', async () => {
    const info = await page.evaluate((sel) => {
      return Array.from(document.querySelectorAll(sel)).map((input) => {
        const label = input.parentElement;
        const r = label.getBoundingClientRect();
        const style = getComputedStyle(label);
        return { height: r.height, x: r.x, right: r.right, left: style.borderTopLeftRadius, rightRadius: style.borderTopRightRadius, border: style.borderTopWidth };
      });
    }, inputs('lab-size'));
    const heights = info.every((item) => Math.abs(item.height - 32) < 0.5);
    const corners = info[0].left === '6px' && info[0].rightRadius === '0px' && info[1].left === '0px' && info[1].rightRadius === '0px' && info[2].rightRadius === '6px';
    const shared = Math.abs(info[1].x - (info[0].right - 1)) < 0.5;
    return [info.length === 3 && heights && corners && shared, `heights ${info.map((item) => item.height).join(',')}, corners ${info.map((item) => item.left + '/' + item.rightRadius).join(' ')}, overlap ${shared}`];
  });

  await check('radio button: the checked solid button is filled', async () => {
    // The fill changes over 0.2 s after the click of the check before.
    await settle(page);
    const color = await page.evaluate((sel) => getComputedStyle(document.querySelector(sel).parentElement).backgroundColor, `${idOf('lab-size')} input:checked`);
    // The pointer is still over the button after the click, so the fill may be the hover shade; it must be a fill.
    return [color !== 'rgb(255, 255, 255)' && color !== 'rgba(0, 0, 0, 0)', color];
  });

  await check('radio: a group without a name has no form owner, and its arrow keys still work', async () => {
    await page.click(`${idOf('lab-vertical')} input[value="Free"]`);
    await page.keyboard.press('ArrowDown');
    const checked = await checkedOf('lab-vertical');
    const owner = await page.evaluate((sel) => Array.from(document.querySelectorAll(sel)).map((input) => input.form === null).join(','), inputs('lab-vertical'));
    return [checked === 'Team' && owner === 'true,true', `checked ${checked}, no form owner ${owner}`];
  });

  await page.close();
}

async function gridPage(context) {
  const page = await newPage(context, base + '/#grid');
  // The host is an empty block with no height until a row is drawn, so it is waited for as attached, not as visible.
  await page.waitForSelector(idOf('host'), { state: 'attached' });
  const draw = (scenes, width) => page.evaluate((args) => window.__gridLab.set(args[0], args[1]), [scenes, width]);
  const boxes = (id) =>
    page.evaluate((rowId) => {
      const host = document.querySelector('[data-testid="host"]').getBoundingClientRect();
      return Array.from(document.querySelectorAll('[data-testid="' + rowId + '"] > .ads-col > .box')).map((box) => {
        const r = box.getBoundingClientRect();
        return { x: r.left - host.left, y: r.top - host.top, w: r.width };
      });
    }, id);
  const near = (a, b) => Math.abs(a - b) < 0.6;
  const cols = (count, span) => Array.from({ length: count }, () => ({ span, height: 10 }));

  await check('grid: a column is (W + gutter) * span / 24 - gutter wide, in the places of the Ant Design demo', async () => {
    await draw([{ id: 'row', gutter: 32, cols: cols(4, 6) }], 488);
    const found = await boxes('row');
    const ok = found.length === 4 && found.every((box, i) => near(box.w, 98) && near(box.x, i * 130));
    return [ok, found.map((box) => `${Math.round(box.x)}+${Math.round(box.w)}`).join(' ')];
  });

  await check('grid: a Row is as wide as its parent, whatever the gutter, and the page does not scroll sideways', async () => {
    await draw([{ id: 'row', gutter: 24, cols: cols(4, 6) }], 500);
    const row = await page.evaluate(() => {
      const r = document.querySelector('[data-testid="row"]').getBoundingClientRect();
      const host = document.querySelector('[data-testid="host"]').getBoundingClientRect();
      return { dx: r.left - host.left, w: r.width, over: document.documentElement.scrollWidth - document.documentElement.clientWidth };
    });
    return [near(row.dx, 0) && near(row.w, 500) && row.over === 0, `offset ${row.dx}, width ${row.w}, overflow ${row.over}`];
  });

  await check('grid: the vertical gutter is the gap between the lines', async () => {
    await draw([{ id: 'row', gutter: [16, 24], cols: cols(8, 6).map(() => ({ span: 6, height: 30 })) }], 800);
    const found = await boxes('row');
    return [found.length === 8 && near(found[4].y - (found[0].y + 30), 24), `first line ${Math.round(found[0].y)}, second ${Math.round(found[4].y)}`];
  });

  await check('grid: offset, push and pull move columns by 24ths of the Row', async () => {
    await draw([{ id: 'row', gutter: 0, cols: [{ span: 6, offset: 6, height: 10 }, { span: 6, push: 6, height: 10 }, { span: 6, pull: 12, height: 10 }] }], 480);
    const found = await boxes('row');
    return [near(found[0].x, 120) && near(found[1].x, 360) && near(found[2].x, 120 + 120 + 120 - 240), found.map((box) => Math.round(box.x)).join(' ')];
  });

  await check('grid: justify and align place the columns', async () => {
    await draw([{ id: 'row', justify: 'space-between', align: 'bottom', cols: [{ span: 4, height: 20 }, { span: 4, height: 60 }] }], 480);
    const found = await boxes('row');
    return [found.length === 2 && near(found[0].x, 0) && near(found[1].x + found[1].w, 480) && near(found[0].y, 40), found.map((box) => Math.round(box.x) + ',' + Math.round(box.y)).join(' ')];
  });

  await check('grid: columns of 24 do not wrap by rounding (a sample of widths, gutters and partitions)', async () => {
    const parts = [[24], [12, 12], [8, 8, 8], [6, 6, 6, 6], [4, 4, 4, 4, 4, 4], [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2], [5, 7, 12], [9, 5, 10]];
    const scenes = [];
    [0, 8, 16, 32].forEach((gutter) => parts.forEach((spans, i) => scenes.push({ id: 'p' + gutter + '-' + i, gutter, cols: spans.map((span) => ({ span, height: 4 })) })));
    await draw(scenes, 1000);
    const wrapped = await page.evaluate(() => {
      const host = document.querySelector('[data-testid="host"]');
      const rows = Array.from(host.querySelectorAll(':scope > .ads-row'));
      const found = [];
      for (let width = 420; width <= 1500; width += 5) {
        host.style.width = width + 'px';
        rows.forEach((row) => {
          const tops = {};
          Array.from(row.querySelectorAll(':scope > .ads-col')).forEach((col) => { tops[Math.round(col.getBoundingClientRect().top)] = true; });
          if (Object.keys(tops).length > 1) found.push(row.getAttribute('data-testid') + ' at ' + width);
        });
      }
      return found;
    });
    return [wrapped.length === 0, wrapped.slice(0, 3).join(', ')];
  });

  await check('grid: the responsive values switch at 576, 768, 992, 1200, 1600 and 1920 px', async () => {
    await draw([{ id: 'row', cols: [{ xs: 2, sm: 4, md: 6, lg: 8, xl: 10, xxl: 12, xxxl: 14, height: 10 }] }], 960);
    const steps = [[575, 2], [576, 4], [767, 4], [768, 6], [991, 6], [992, 8], [1199, 8], [1200, 10], [1599, 10], [1600, 12], [1919, 12], [1920, 14]];
    const bad = [];
    for (const step of steps) {
      await page.setViewportSize({ width: step[0], height: VIEWPORT.height });
      const found = await boxes('row');
      if (!near(found[0].w, (960 * step[1]) / 24)) bad.push(step[0] + 'px: ' + Math.round(found[0].w));
    }
    return [bad.length === 0, bad.join(', ')];
  });

  await check('grid: Breakpoints names the screen and follows a resize', async () => {
    const seen = [];
    for (const step of [[500, 'xs'], [800, 'md'], [1300, 'xl'], [2000, 'xxxl'], [575, 'xs'], [576, 'sm']]) {
      await page.setViewportSize({ width: step[0], height: VIEWPORT.height });
      await settle(page);
      seen.push(step[0] + ':' + (await textOf(page, idOf('current'))));
      if ((await textOf(page, idOf('current'))) !== step[1]) return [false, seen.join(' ')];
    }
    return [true, seen.join(' ')];
  });

  await check('grid: right to left mirrors an offset', async () => {
    await page.setViewportSize(VIEWPORT);
    await page.evaluate(() => { document.documentElement.dir = 'rtl'; });
    await draw([{ id: 'row', cols: [{ span: 6, offset: 6, height: 10 }] }], 480);
    const found = await boxes('row');
    await page.evaluate(() => { document.documentElement.dir = 'ltr'; });
    return [near(found[0].x + found[0].w, 480 - 120), Math.round(found[0].x) + '+' + Math.round(found[0].w)];
  });

  await page.close();
}

async function spinPage(context) {
  const page = await newPage(context, base + '/#spin');
  await page.waitForFunction(() => Boolean(window.__spinLab));
  const mount = (props, content, options) =>
    page.evaluate((args) => window.__spinLab.set(args), Object.assign({ props: props, content: content || 'none' }, options || {}));
  const rect = (selector) => rectOf(page, selector);
  const near = (a, b, tolerance) => Math.abs(a - b) <= (tolerance === undefined ? 1 : tolerance);
  const cx = (r) => r.x + r.width / 2;
  const cy = (r) => r.y + r.height / 2;

  await check('spin: the dot box is 14, 20 and 32 px, the root is exactly that without a description', async () => {
    const sizes = [];
    for (const size of ['small', 'medium', 'large']) {
      await mount({ size: size, 'aria-label': 'Loading' });
      const r = await rect('.ads-spin');
      sizes.push(Math.round(r.width) + 'x' + Math.round(r.height));
    }
    return [sizes.join(' ') === '14x14 20x20 32x32', sizes.join(' ')];
  });

  await check('spin: the indicator is centered over the description, 12 px apart', async () => {
    await mount({ description: 'Loading' });
    const root = await rect('.ads-spin');
    const part = await rect('.ads-spin-indicator');
    const text = await rect('.ads-spin-description');
    const gap = text.y - (part.y + part.height);
    return [near(cx(part), cx(root)) && near(cx(text), cx(root)) && near(gap, 12, 0.6), 'gap ' + gap];
  });

  await check('spin: the dots turn and pulse (a running animation whose clock moves)', async () => {
    await mount({ 'aria-label': 'Loading' });
    const sample = () =>
      page.evaluate(() => {
        const found = document.querySelector('.ads-spin-dots').getAnimations()[0];
        return found ? { state: found.playState, time: Number(found.currentTime) } : null;
      });
    const first = await sample();
    await page.waitForTimeout(250);
    const second = await sample();
    return [Boolean(first && second && second.state === 'running' && second.time > first.time), JSON.stringify([first, second])];
  });

  await check('spin: embedded: the indicator is centered in the content, the content is dimmed and takes no pointer', async () => {
    await mount({ 'aria-label': 'Loading' }, 'button');
    await settle(page);
    const covered = await rect('.ads-spin-container');
    const part = await rect('.ads-spin-indicator');
    const style = await page.evaluate(() => {
      const s = getComputedStyle(document.querySelector('.ads-spin-container'));
      return { opacity: s.opacity, events: s.pointerEvents };
    });
    const button = await rect(idOf('inner-button'));
    await page.mouse.click(cx(button), cy(button));
    const clicks = await page.evaluate(() => window.__spinLab.clicks());
    const centered = near(cx(part), cx(covered)) && near(cy(part), cy(covered));
    return [centered && style.opacity === '0.5' && style.events === 'none' && clicks === 0, JSON.stringify(style) + ' clicks ' + clicks];
  });

  await check('spin: the content does not move or resize when spinning toggles', async () => {
    await mount({ spinning: false, description: 'Loading' }, 'text');
    const before = JSON.stringify([await rect('.ads-spin-container'), await rect(idOf('after'))]);
    await page.evaluate(() => window.__spinLab.update({ spinning: true }));
    await settle(page);
    const during = JSON.stringify([await rect('.ads-spin-container'), await rect(idOf('after'))]);
    return [before === during, before === during ? '' : before + ' -> ' + during];
  });

  await check('spin: the delay holds the indicator back for the whole time (the clock of the page)', async () => {
    await mount({ delay: 400, description: 'Loading' }, 'text');
    await page.waitForSelector('[role="status"]', { timeout: 5000 });
    const waited = await page.evaluate(() => window.__spinLab.appearedAt - window.__spinLab.mountedAt);
    return [waited >= 390 && waited < 3000, 'waited ' + Math.round(waited) + ' ms'];
  });

  await check('spin: fullscreen covers the viewport, centers the indicator and takes the clicks', async () => {
    await mount({ fullscreen: true, description: 'Loading' });
    const box = await rect('.ads-spin-fullscreen');
    const section = await rect('.ads-spin-section');
    const outside = await rect(idOf('outside'));
    const hit = await page.evaluate(
      (point) => Boolean(document.elementFromPoint(point[0], point[1]).closest('.ads-spin-fullscreen')),
      [cx(outside), cy(outside)]
    );
    const covers = box.x === 0 && box.y === 0 && box.width === VIEWPORT.width && box.height === VIEWPORT.height;
    return [covers && near(cx(section), VIEWPORT.width / 2, 1.5) && near(cy(section), VIEWPORT.height / 2, 1.5) && hit, JSON.stringify(box)];
  });

  await check('spin: the progress ring fills the dot box and starts at 12 o\'clock', async () => {
    await mount({ percent: 25, size: 'large', 'aria-label': 'Upload' });
    const svg = await rect('svg.ads-spin-ring');
    const arc = await page.evaluate(() => {
      const circle = document.querySelector('.ads-spin-ring-arc');
      return { offset: circle.getAttribute('stroke-dashoffset'), transform: circle.getAttribute('transform') };
    });
    return [near(svg.width, 32, 0.6) && arc.offset === '75' && arc.transform === 'rotate(-90 50 50)', JSON.stringify(arc)];
  });

  await check('spin: right to left: the first dot is at the right edge and the indicator stays centered', async () => {
    await mount({ description: 'Loading' }, 'none', { dir: 'rtl' });
    const root = await rect('.ads-spin');
    const part = await rect('.ads-spin-indicator');
    const first = await page.evaluate(() => document.querySelector('.ads-spin-dots > span').offsetLeft);
    return [near(cx(part), cx(root)) && first > part.width / 2 - 1, 'first dot at ' + first];
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
    await radioPage(context);
    await gridPage(context);
    await spinPage(context);
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
