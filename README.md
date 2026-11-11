# svelte-ant-design

An independent UI component library for **Svelte 5**, with an API inspired by
Ant Design.

**Documentation and live examples:** <https://prostreyd.github.io/ant-design-svelte/>
(English, Russian and Chinese).

> API вдохновлён Ant Design (MIT). Реализация оригинальная для Svelte.
>
> *(The API is inspired by Ant Design (MIT). The implementation is original for Svelte.)*

> В ходе разработки использовался ИИ для помощи в коде, тестах и документации.
> Весь код прошёл ручную проверку и тестирование.
>
> *(AI tools were used during development to help with code, tests, and documentation.
> All code was manually reviewed and tested.)*

## Status

Version `0.4.0`. Available components: `Button`, `Checkbox` (with `CheckboxGroup`), `Input` (with `InputTextArea`, `InputPassword`, `InputSearch` and `InputOTP`), `Switch`. More components are planned.

## Installation

```sh
npm install svelte-ant-design
```

Requires `svelte` `^5.0.0` as a peer dependency.

## Usage

Import the design tokens once in your application entry point. Without them, the
components render unstyled.

```ts
import 'svelte-ant-design/tokens.css';
```

```svelte
<script lang="ts">
  import { Button } from 'svelte-ant-design';
</script>

<Button type="primary" onclick={() => console.log('clicked')}>Save</Button>
```

Import components by name. The package is ESM and declares `sideEffects: ["**/*.css"]`, so a
bundler that supports tree shaking leaves out the components you do not use. This is checked with
Vite in `tests/packaging`; other bundlers are not covered.

See the [Button](https://prostreyd.github.io/ant-design-svelte/components/button/),
[Checkbox](https://prostreyd.github.io/ant-design-svelte/components/checkbox/),
[Input](https://prostreyd.github.io/ant-design-svelte/components/input/) and
[Switch](https://prostreyd.github.io/ant-design-svelte/components/switch/) pages of the documentation site for
examples and the API tables, or [`src/lib/Button/README.md`](./src/lib/Button/README.md),
[`src/lib/Checkbox/README.md`](./src/lib/Checkbox/README.md),
[`src/lib/Input/README.md`](./src/lib/Input/README.md) and
[`src/lib/Switch/README.md`](./src/lib/Switch/README.md) in the repository.

### Colors and contrast

In the light theme the colors are the values of the Ant Design token documentation, so the components look
like Ant Design. Those values do not reach WCAG AA for text: white on the primary fill is 4.10:1 and on the
danger fill 3.27:1 (4.5:1 is needed), the off track of a switch is 1.84:1 against a white page and the border of
an unchecked checkbox or the border of an input 1.41:1 (3:1 is needed). For a contrast guarantee import one more file after the tokens:

```ts
import 'svelte-ant-design/tokens.css';
import 'svelte-ant-design/tokens-accessible.css';
```

It darkens the fills, the link and text colors, the switch tracks, the checkbox border and the input border, placeholder and count; every text pair is then at least 4.5:1.
The dark theme needs no extra file. The contrast tests run with the accessible file.

### Dark theme

`tokens.css` does not touch the rest of your page: it sets no `color-scheme` for the light
theme. For the dark palette set `data-theme="dark"` on the `<html>` element; that selector also
sets `color-scheme: dark`.

## Development

```sh
npm install
npm run dev        # documentation site (SvelteKit, in docs/), with live reload
npm test           # unit and accessibility tests of the library and of the site content (Vitest)
npm run test:coverage
npm run test:e2e   # library tests in a real browser (Playwright)
npm run check      # svelte-check (type checking of the library)
npm run check:docs # svelte-check of the documentation site
npm run lint       # ESLint
npm run package    # build dist/ with svelte-package
```

The documentation site lives in `docs/` and imports the library from `src/lib`, so its examples
always show the code in the repository. To build it the way GitHub Pages serves it and test the result:

```sh
BASE_PATH=/ant-design-svelte npm run build   # static site in docs/build
BASE_PATH=/ant-design-svelte npm run test:docs   # link and SEO check, then browser tests
```

(On Windows `cmd` set the variable first: `set BASE_PATH=/ant-design-svelte`.) Leave `BASE_PATH` unset to
build and test the site at the root of a local server.

## Contributing

Issues and pull requests are welcome. Please run `npm test`, `npm run check`, and
`npm run lint` before opening a pull request.

## License

[MIT](./LICENSE)
