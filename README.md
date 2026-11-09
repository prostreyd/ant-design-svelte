# svelte-ant-design

An independent UI component library for **Svelte 5**, with an API inspired by
Ant Design.

> API вдохновлён Ant Design (MIT). Реализация оригинальная для Svelte.
>
> *(The API is inspired by Ant Design (MIT). The implementation is original for Svelte.)*

> В ходе разработки использовался ИИ для помощи в коде, тестах и документации.
> Весь код прошёл ручную проверку и тестирование.
>
> *(AI tools were used during development to help with code, tests, and documentation.
> All code was manually reviewed and tested.)*

## Status

Early alpha (`0.1.0-alpha.0`). Available components: `Button`. More components are planned.

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

See [`src/lib/Button/README.md`](./src/lib/Button/README.md) for the full Button API.

### Dark theme

`tokens.css` does not touch the rest of your page: it sets no `color-scheme` for the light
theme. For the dark palette set `data-theme="dark"` on the `<html>` element; that selector also
sets `color-scheme: dark`.

## Development

```sh
npm install
npm run dev        # demo playground (Vite)
npm test           # unit and accessibility tests (Vitest)
npm run test:coverage
npm run check      # svelte-check (type checking)
npm run lint       # ESLint
npm run package    # build dist/ with svelte-package
```

## Contributing

Issues and pull requests are welcome. Please run `npm test`, `npm run check`, and
`npm run lint` before opening a pull request.

## License

[MIT](./LICENSE)
