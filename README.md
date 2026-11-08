# ant-design-svelte

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

Early version (`0.1.0`). Available components: `Button`. More components are planned.

## Installation

```sh
npm install ant-design-svelte
```

Requires `svelte` `^5.0.0` as a peer dependency.

## Usage

Import the design tokens once in your application entry point. Without them, the
components render unstyled.

```ts
import 'ant-design-svelte/tokens.css';
```

```svelte
<script lang="ts">
  import { Button } from 'ant-design-svelte';
</script>

<Button type="primary" onclick={() => console.log('clicked')}>Save</Button>
```

See [`src/lib/Button/README.md`](./src/lib/Button/README.md) for the full Button API.

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
