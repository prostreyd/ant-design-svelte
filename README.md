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

Early alpha (`0.1.0-alpha.1`). Available components: `Button`. More components are planned.

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

See the [Button page](https://prostreyd.github.io/ant-design-svelte/components/button/) of the documentation
site for examples and the API table, or [`src/lib/Button/README.md`](./src/lib/Button/README.md) in the repository.

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
