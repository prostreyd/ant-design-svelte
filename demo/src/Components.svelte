<script lang="ts">
  import { Button, VERSION } from '$lib';
  import SiteHeader from './SiteHeader.svelte';
  import codeExpandIcon from './assets/code-expand.svg';
  import codeCollapseIcon from './assets/code-collapse.svg';

  const buttonExamples = {
    types: `<Button type="primary">Primary</Button>
<Button>Default</Button>
<Button type="dashed">Dashed</Button>
<Button type="text">Text</Button>
<Button type="link">Link</Button>`,
    sizes: `<Button type="primary" size="large">Large</Button>
<Button type="primary">Medium</Button>
<Button type="primary" size="small">Small</Button>
<Button shape="round">Round</Button>`,
    icons: `{#snippet uploadIcon()}
  <svg viewBox="0 0 16 16" aria-hidden="true">
    <path d="M8 12V2m0 0L4 6m4-4 4 4M2 14h12" />
  </svg>
{/snippet}

<Button type="primary" icon={uploadIcon}>Upload</Button>
<Button type="primary" icon={uploadIcon} iconPlacement="end">
  Upload
</Button>`,
    states: `<Button type="primary" loading>Saving</Button>
<Button disabled>Unavailable</Button>
<Button type="primary" danger>Delete</Button>

<Button onclick={() => (count += 1)}>
  Нажми меня · {count}
</Button>`,
    links: `<Button href="/docs">Open documentation</Button>
<Button type="primary" block>Continue</Button>`
  };
  type ExampleKey = keyof typeof buttonExamples;

  let codeLanguage = $state<'javascript' | 'typescript'>('typescript');
  let openCode = $state<Record<ExampleKey, boolean>>({
    types: false,
    sizes: false,
    icons: false,
    states: false,
    links: false
  });
  let copyStatus = $state<Partial<Record<ExampleKey, 'copied' | 'error'>>>({});

  function getExampleCode(example: ExampleKey): string {
    const scriptAttribute = codeLanguage === 'typescript' ? ' lang="ts"' : '';
    const scriptLines = [
      `<script${scriptAttribute}>`,
      `  import { Button } from 'ant-design-svelte';`,
      ...(example === 'states' ? ['', '  let count = $state(0);'] : []),
      '<\/script>',
      '',
      buttonExamples[example]
    ];

    return scriptLines.join('\n');
  }

  async function copyExample(example: ExampleKey): Promise<void> {
    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error('Clipboard API is unavailable');
      }

      await navigator.clipboard.writeText(getExampleCode(example));
      copyStatus = { ...copyStatus, [example]: 'copied' };
    } catch {
      copyStatus = { ...copyStatus, [example]: 'error' };
    }
  }

  const usageExample = `import 'ant-design-svelte/tokens.css';
import { Button } from 'ant-design-svelte';

<Button type="primary" onclick={() => console.log('saved')}>
  Сохранить изменения
</Button>`;

  let clickCount = $state(0);

  const categories = [
    { name: 'Все компоненты', count: 1, icon: '▦' },
    { name: 'Общие', count: 1, icon: '◉' },
    { name: 'Макет', count: 0, icon: '▤' },
    { name: 'Навигация', count: 0, icon: '⌘' },
    { name: 'Ввод данных', count: 0, icon: '⌨' },
    { name: 'Отображение данных', count: 0, icon: '▧' },
    { name: 'Обратная связь', count: 0, icon: '◌' },
    { name: 'Прочее', count: 0, icon: '＋' }
  ] as const;

  const components = [
    {
      name: 'Button',
      title: 'Кнопка',
      category: 'Общие',
      description: 'Запускает действие или ведёт на страницу. Поддерживает варианты, размеры и состояния.',
      status: 'Готов',
      href: '#button-details'
    }
  ] as const;

  let query = $state('');
  let activeCategory = $state<(typeof categories)[number]['name']>('Все компоненты');

  const filteredComponents = $derived(
    components.filter((component) => {
      const matchesCategory =
        activeCategory === 'Все компоненты' || component.category === activeCategory;
      const searchText = `${component.name} ${component.title} ${component.description}`.toLowerCase();
      return matchesCategory && searchText.includes(query.trim().toLowerCase());
    })
  );
</script>

{#snippet uploadIcon()}
  <svg viewBox="0 0 16 16" aria-hidden="true">
    <path d="M8 12V2m0 0L4 6m4-4 4 4M2 14h12" />
  </svg>
{/snippet}

{#snippet codeIcon(expanded: boolean)}
  <img src={expanded ? codeCollapseIcon : codeExpandIcon} alt="" aria-hidden="true" />
{/snippet}

{#snippet copyIcon()}
  <svg viewBox="0 0 16 16" aria-hidden="true">
    <rect x="5" y="5" width="9" height="10" rx="1.5" />
    <path d="M11 5V3.5A1.5 1.5 0 0 0 9.5 2h-6A1.5 1.5 0 0 0 2 3.5v7A1.5 1.5 0 0 0 3.5 12H5" />
  </svg>
{/snippet}

{#snippet copiedIcon()}
  <svg viewBox="0 0 16 16" aria-hidden="true">
    <path d="m3 8 3.2 3.2L13 4.5" />
  </svg>
{/snippet}

{#snippet codeLanguageControls()}
  <div class="code-languages" role="group" aria-label="Язык примера">
    <button
      title="JavaScript"
      aria-label="JavaScript"
      class:active={codeLanguage === 'javascript'}
      aria-pressed={codeLanguage === 'javascript'}
      onclick={() => (codeLanguage = 'javascript')}>JS</button
    >
    <button
      title="TypeScript"
      aria-label="TypeScript"
      class:active={codeLanguage === 'typescript'}
      aria-pressed={codeLanguage === 'typescript'}
      onclick={() => (codeLanguage = 'typescript')}>TS</button
    >
  </div>
{/snippet}

<svelte:head>
  <title>Компоненты — Svelte UI</title>
  <meta
    name="description"
    content="Каталог Svelte UI: готовые компоненты, API, примеры и состояния."
  />
</svelte:head>

<SiteHeader active="components" />

<main>
  <section class="catalog-hero">
    <div class="page-width">
      <div class="breadcrumbs"><a href="./">Главная</a><span>/</span><span>Компоненты</span></div>
      <div class="hero-layout">
        <div>
          <div class="eyebrow"><span class="eyebrow-mark">✳</span> БИБЛИОТЕКА КОМПОНЕНТОВ</div>
          <h1>Компоненты</h1>
          <p>
            Основа интерфейса — тщательно типизированные, доступные и понятные компоненты для Svelte 5.
          </p>
          <div class="catalog-stats">
            <span><strong>01</strong> готов</span>
            <i></i>
            <span><strong>v{VERSION}</strong> текущая версия</span>
          </div>
        </div>
        <div class="hero-art" aria-hidden="true">
          <div class="art-orbit orbit-one"></div>
          <div class="art-orbit orbit-two"></div>
          <div class="art-tile tile-back">Aa</div>
          <div class="art-tile tile-front"><span>✓</span><i></i><i></i><i></i></div>
          <div class="art-sparkle sparkle-one">✦</div>
          <div class="art-sparkle sparkle-two">✧</div>
        </div>
      </div>
    </div>
  </section>

  <section class="catalog-section page-width">
    <aside class="catalog-sidebar" aria-label="Категории компонентов">
      <div class="sidebar-title">КАТЕГОРИИ</div>
      {#each categories as category (category.name)}
        <button
          class="category-button"
          class:selected={activeCategory === category.name}
          aria-pressed={activeCategory === category.name}
          onclick={() => (activeCategory = category.name)}
        >
          <span class="category-icon" aria-hidden="true">{category.icon}</span>
          <span>{category.name}</span>
          <span class="category-count">{category.count}</span>
        </button>
      {/each}

      <div class="sidebar-note">
        <span class="note-icon">✦</span>
        <strong>Создано для Svelte</strong>
        <p>Примеры используют Runes и snippets — без React-зависимостей.</p>
      </div>
    </aside>

    <div class="catalog-content">
      <div class="catalog-toolbar">
        <div>
          <h2>{activeCategory}</h2>
          <p>{filteredComponents.length} {filteredComponents.length === 1 ? 'компонент' : 'компонентов'}</p>
        </div>
        <label class="search-box">
          <svg viewBox="0 0 20 20" aria-hidden="true">
            <circle cx="8.7" cy="8.7" r="5.8"></circle>
            <path d="m13 13 4 4"></path>
          </svg>
          <input bind:value={query} type="search" placeholder="Поиск компонентов" aria-label="Поиск компонентов" />
        </label>
      </div>

      {#if filteredComponents.length}
        <div class="component-grid">
          {#each filteredComponents as component (component.name)}
            <a class="component-card" href={component.href}>
              <div class="card-top">
                <span class="component-symbol" aria-hidden="true">B</span>
                <span class="ready-badge"><i></i>{component.status}</span>
              </div>
              <div class="component-title-row">
                <h3>{component.title}</h3>
                <code>{component.name}</code>
              </div>
              <p>{component.description}</p>
              <div class="card-footer">
                <span>{component.category}</span>
                <span class="card-arrow" aria-hidden="true">↗</span>
              </div>
            </a>
          {/each}
        </div>
      {:else}
        <div class="empty-state">
          <span class="empty-icon" aria-hidden="true">⌕</span>
          <h3>{query ? 'Ничего не найдено' : 'Компоненты появятся здесь'}</h3>
          <p>
            {query
              ? 'Попробуйте изменить поисковый запрос или выбрать другую категорию.'
              : 'Эта категория будет пополняться по мере развития библиотеки.'}
          </p>
          {#if query}
            <button class="clear-search" onclick={() => (query = '')}>Сбросить поиск</button>
          {/if}
        </div>
      {/if}
    </div>
  </section>

  <section class="component-details" id="button-details">
    <div class="page-width details-inner">
      <div class="details-heading">
        <div>
          <div class="breadcrumbs"><a href="./components.html">Компоненты</a><span>/</span><span>Button</span></div>
          <span class="ready-badge"><i></i>Готов</span>
          <h2>Button <span>Кнопка</span></h2>
          <p>
            Кнопка запускает действие или ведёт на другую страницу. Выберите стиль, размер и состояние,
            чтобы показать приоритет действия и дать пользователю понятную обратную связь.
          </p>
        </div>
        <a
          class="readme-link"
          href="https://github.com/prostreyd/ant-design-svelte/blob/main/src/lib/Button/README.md"
          target="_blank"
          rel="noreferrer"
        >Документация <span>↗</span></a>
      </div>

      <div class="usage-intro">
        <h3>Использование</h3>
        <p>Импортируйте компонент и подключите токены один раз в точке входа приложения.</p>
        <pre><code>{usageExample}</code></pre>
      </div>

      <section class="examples-section" aria-labelledby="button-examples-title">
        <div class="examples-heading">
          <div>
            <span class="section-kicker">ПРИМЕРЫ</span>
            <h3 id="button-examples-title">Возможности Button</h3>
          </div>
          <p>Попробуйте примеры и посмотрите, как настраивается компонент.</p>
        </div>

        <div class="examples-grid">
          <article class="example-card">
            <div class="example-description">
              <h4>Типы</h4>
              <p>Выберите визуальный приоритет: от основного действия до малозаметной текстовой кнопки.</p>
            </div>
            <div class="example-demo">
              <Button type="primary">Primary</Button>
              <Button>Default</Button>
              <Button type="dashed">Dashed</Button>
              <Button type="text">Text</Button>
              <Button type="link">Link</Button>
            </div>
            <div class="example-code-toolbar">
              <button
                class="code-action code-toggle"
                title={openCode.types ? 'Скрыть код' : 'Показать код'}
                aria-label={openCode.types ? 'Скрыть код' : 'Показать код'}
                aria-expanded={openCode.types}
                aria-controls="button-types-code"
                onclick={() => (openCode.types = !openCode.types)}
              >{@render codeIcon(openCode.types)}</button>
              <button class="code-action" title={copyStatus.types === 'copied' ? 'Скопировано' : 'Скопировать код'} aria-label={copyStatus.types === 'copied' ? 'Скопировано' : 'Скопировать код'} onclick={() => copyExample('types')}>
                {#if copyStatus.types === 'copied'}{@render copiedIcon()}{:else}{@render copyIcon()}{/if}
              </button>
            </div>
            {#if copyStatus.types === 'error'}<p class="copy-error" role="status">Не удалось скопировать. Проверьте разрешение браузера.</p>{/if}
            {#if openCode.types}
              <div class="code-panel" id="button-types-code">
                {@render codeLanguageControls()}
                <pre><code>{getExampleCode('types')}</code></pre>
              </div>
            {/if}
          </article>

          <article class="example-card">
            <div class="example-description">
              <h4>Размеры и форма</h4>
              <p>Размеры large, medium и small подходят для разных плотностей интерфейса.</p>
            </div>
            <div class="example-demo example-demo-align">
              <Button type="primary" size="large">Large</Button>
              <Button type="primary">Medium</Button>
              <Button type="primary" size="small">Small</Button>
              <Button shape="round">Round</Button>
            </div>
            <div class="example-code-toolbar">
              <button
                class="code-action code-toggle"
                title={openCode.sizes ? 'Скрыть код' : 'Показать код'}
                aria-label={openCode.sizes ? 'Скрыть код' : 'Показать код'}
                aria-expanded={openCode.sizes}
                aria-controls="button-sizes-code"
                onclick={() => (openCode.sizes = !openCode.sizes)}
              >{@render codeIcon(openCode.sizes)}</button>
              <button class="code-action" title={copyStatus.sizes === 'copied' ? 'Скопировано' : 'Скопировать код'} aria-label={copyStatus.sizes === 'copied' ? 'Скопировано' : 'Скопировать код'} onclick={() => copyExample('sizes')}>
                {#if copyStatus.sizes === 'copied'}{@render copiedIcon()}{:else}{@render copyIcon()}{/if}
              </button>
            </div>
            {#if copyStatus.sizes === 'error'}<p class="copy-error" role="status">Не удалось скопировать. Проверьте разрешение браузера.</p>{/if}
            {#if openCode.sizes}
              <div class="code-panel" id="button-sizes-code">
                {@render codeLanguageControls()}
                <pre><code>{getExampleCode('sizes')}</code></pre>
              </div>
            {/if}
          </article>

          <article class="example-card">
            <div class="example-description">
              <h4>Иконки</h4>
              <p>Передайте иконку как Svelte snippet и при необходимости разместите её после подписи.</p>
            </div>
            <div class="example-demo">
              <Button type="primary" icon={uploadIcon}>Upload</Button>
              <Button type="primary" icon={uploadIcon} iconPlacement="end">Upload</Button>
            </div>
            <div class="example-code-toolbar">
              <button
                class="code-action code-toggle"
                title={openCode.icons ? 'Скрыть код' : 'Показать код'}
                aria-label={openCode.icons ? 'Скрыть код' : 'Показать код'}
                aria-expanded={openCode.icons}
                aria-controls="button-icons-code"
                onclick={() => (openCode.icons = !openCode.icons)}
              >{@render codeIcon(openCode.icons)}</button>
              <button class="code-action" title={copyStatus.icons === 'copied' ? 'Скопировано' : 'Скопировать код'} aria-label={copyStatus.icons === 'copied' ? 'Скопировано' : 'Скопировать код'} onclick={() => copyExample('icons')}>
                {#if copyStatus.icons === 'copied'}{@render copiedIcon()}{:else}{@render copyIcon()}{/if}
              </button>
            </div>
            {#if copyStatus.icons === 'error'}<p class="copy-error" role="status">Не удалось скопировать. Проверьте разрешение браузера.</p>{/if}
            {#if openCode.icons}
              <div class="code-panel" id="button-icons-code">
                {@render codeLanguageControls()}
                <pre><code>{getExampleCode('icons')}</code></pre>
              </div>
            {/if}
          </article>

          <article class="example-card">
            <div class="example-description">
              <h4>Состояния и действия</h4>
              <p>Загрузка и disabled предотвращают повторное действие. Нажмите кнопку, чтобы проверить callback.</p>
            </div>
            <div class="example-demo">
              <Button type="primary" loading>Saving</Button>
              <Button disabled>Unavailable</Button>
              <Button type="primary" danger>Delete</Button>
              <Button onclick={() => (clickCount += 1)}>Нажми меня · {clickCount}</Button>
            </div>
            <div class="example-code-toolbar">
              <button
                class="code-action code-toggle"
                title={openCode.states ? 'Скрыть код' : 'Показать код'}
                aria-label={openCode.states ? 'Скрыть код' : 'Показать код'}
                aria-expanded={openCode.states}
                aria-controls="button-states-code"
                onclick={() => (openCode.states = !openCode.states)}
              >{@render codeIcon(openCode.states)}</button>
              <button class="code-action" title={copyStatus.states === 'copied' ? 'Скопировано' : 'Скопировать код'} aria-label={copyStatus.states === 'copied' ? 'Скопировано' : 'Скопировать код'} onclick={() => copyExample('states')}>
                {#if copyStatus.states === 'copied'}{@render copiedIcon()}{:else}{@render copyIcon()}{/if}
              </button>
            </div>
            {#if copyStatus.states === 'error'}<p class="copy-error" role="status">Не удалось скопировать. Проверьте разрешение браузера.</p>{/if}
            {#if openCode.states}
              <div class="code-panel" id="button-states-code">
                {@render codeLanguageControls()}
                <pre><code>{getExampleCode('states')}</code></pre>
              </div>
            {/if}
          </article>

          <article class="example-card">
            <div class="example-description">
              <h4>Ссылка и на всю ширину</h4>
              <p>Свойство href рендерит ссылку, а block растягивает кнопку на ширину контейнера.</p>
            </div>
            <div class="example-demo example-demo-column">
              <Button href="#design-tokens">Открыть дизайн-токены</Button>
              <Button type="primary" block>Продолжить</Button>
            </div>
            <div class="example-code-toolbar">
              <button
                class="code-action code-toggle"
                title={openCode.links ? 'Скрыть код' : 'Показать код'}
                aria-label={openCode.links ? 'Скрыть код' : 'Показать код'}
                aria-expanded={openCode.links}
                aria-controls="button-links-code"
                onclick={() => (openCode.links = !openCode.links)}
              >{@render codeIcon(openCode.links)}</button>
              <button class="code-action" title={copyStatus.links === 'copied' ? 'Скопировано' : 'Скопировать код'} aria-label={copyStatus.links === 'copied' ? 'Скопировано' : 'Скопировать код'} onclick={() => copyExample('links')}>
                {#if copyStatus.links === 'copied'}{@render copiedIcon()}{:else}{@render copyIcon()}{/if}
              </button>
            </div>
            {#if copyStatus.links === 'error'}<p class="copy-error" role="status">Не удалось скопировать. Проверьте разрешение браузера.</p>{/if}
            {#if openCode.links}
              <div class="code-panel" id="button-links-code">
                {@render codeLanguageControls()}
                <pre><code>{getExampleCode('links')}</code></pre>
              </div>
            {/if}
          </article>
        </div>
      </section>

      <section class="api-section" aria-labelledby="button-api-title">
        <div class="examples-heading">
          <div>
            <span class="section-kicker">СПРАВКА</span>
            <h3 id="button-api-title">Основные свойства</h3>
          </div>
          <a class="readme-link" href="https://github.com/prostreyd/ant-design-svelte/blob/main/src/lib/Button/README.md" target="_blank" rel="noreferrer">Полный API ↗</a>
        </div>
        <div class="api-table-wrap">
          <table class="api-table">
            <thead>
              <tr><th>Свойство</th><th>Значения</th><th>По умолчанию</th><th>Описание</th></tr>
            </thead>
            <tbody>
              <tr><td><code>type</code></td><td><code>primary | default | dashed | text | link</code></td><td><code>default</code></td><td>Визуальный стиль кнопки.</td></tr>
              <tr><td><code>size</code></td><td><code>large | medium | small</code></td><td><code>medium</code></td><td>Размер кнопки. <code>middle</code> принимается как совместимый алиас <code>medium</code>.</td></tr>
              <tr><td><code>shape</code></td><td><code>default | round | circle</code></td><td><code>default</code></td><td>Форма кнопки.</td></tr>
              <tr><td><code>loading</code></td><td><code>boolean | {'{ delay: number }'}</code></td><td><code>false</code></td><td>Спиннер сразу или после задержки в миллисекундах. Отключает кнопку.</td></tr>
              <tr><td><code>disabled</code></td><td><code>boolean</code></td><td><code>false</code></td><td>Запрещает активацию. Отключённая ссылка также не переходит и выпадает из Tab-порядка.</td></tr>
              <tr><td><code>danger</code></td><td><code>boolean</code></td><td><code>false</code></td><td>Опасное действие (красная цветовая схема).</td></tr>
              <tr><td><code>ghost</code></td><td><code>boolean</code></td><td><code>false</code></td><td>Прозрачный фон, в основном для <code>primary</code> на цветных поверхностях.</td></tr>
              <tr><td><code>block</code></td><td><code>boolean</code></td><td><code>false</code></td><td>Растягивает кнопку на всю ширину контейнера.</td></tr>
              <tr><td><code>href</code></td><td><code>string</code></td><td>—</td><td>Рендерит <code>&lt;a&gt;</code> вместо <code>&lt;button&gt;</code>. Пустая строка тоже выбирает ссылку.</td></tr>
              <tr><td><code>target</code>, <code>rel</code>, <code>download</code></td><td><code>string</code>, <code>string</code>, <code>string | boolean</code></td><td>—</td><td>Нативные атрибуты ссылки. Работают только вместе с <code>href</code>.</td></tr>
              <tr><td><code>htmlType</code></td><td><code>button | submit | reset</code></td><td><code>button</code></td><td>Нативный <code>type</code> кнопки. Игнорируется для ссылки.</td></tr>
              <tr><td><code>form</code>, <code>name</code>, <code>value</code></td><td><code>string</code></td><td>—</td><td>Нативные атрибуты кнопки для форм.</td></tr>
              <tr><td><code>icon</code></td><td><code>Snippet</code></td><td>—</td><td>Иконка-snippet. Скрыта от вспомогательных технологий.</td></tr>
              <tr><td><code>iconPlacement</code></td><td><code>start | end</code></td><td><code>start</code></td><td>Расположение иконки относительно текста.</td></tr>
              <tr><td><code>children</code></td><td><code>Snippet</code></td><td>—</td><td>Текст или содержимое кнопки.</td></tr>
              <tr><td><code>class</code></td><td><code>string</code></td><td>—</td><td>Дополнительный CSS-класс, добавляется к классам компонента.</td></tr>
              <tr><td><code>onclick</code></td><td><code>(event: MouseEvent) =&gt; void</code></td><td>—</td><td>Вызывается один раз при активации доступной кнопки. Не вызывается при <code>disabled</code> и во время загрузки.</td></tr>
              <tr><td>Нативные атрибуты</td><td><code>HTMLButtonAttributes</code> / <code>HTMLAnchorAttributes</code></td><td>—</td><td>Пробрасываются в выбранный нативный элемент, включая ARIA-атрибуты.</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      <div class="tokens-strip" id="design-tokens">
        <div>
          <span class="token-color"></span>
          <span><strong>Design tokens</strong><small>CSS-переменные для настройки стиля</small></span>
        </div>
        <code>--ads-color-primary</code>
        <code>--ads-radius-md</code>
        <code>--ads-control-height</code>
      </div>
    </div>
  </section>
</main>

<footer class="site-footer">
  <div class="page-width footer-inner">
    <a href="./" class="footer-brand"><span class="brand-mark">S</span> Svelte UI</a>
    <p>Вдохновлено принципами Ant Design. Реализация оригинальная для Svelte.</p>
    <span>MIT · Svelte 5 · v{VERSION}</span>
  </div>
</footer>

<style>
  .page-width {
    width: min(1200px, calc(100% - 48px));
    margin: 0 auto;
  }

  .catalog-hero {
    overflow: hidden;
    border-bottom: 1px solid var(--ads-color-border-secondary);
    background:
      radial-gradient(ellipse at 79% 50%, var(--site-color-primary-glow), transparent 28%),
      linear-gradient(110deg, var(--ads-color-bg-subtle), var(--ads-color-bg-container) 70%);
  }

  .breadcrumbs {
    display: flex;
    align-items: center;
    gap: 9px;
    color: var(--ads-color-text-tertiary);
    font-size: 11px;
  }

  .breadcrumbs a {
    color: inherit;
    text-decoration: none;
  }

  .breadcrumbs a:hover {
    color: var(--ads-color-primary);
  }

  .hero-layout {
    display: flex;
    min-height: 253px;
    align-items: center;
    justify-content: space-between;
  }

  .eyebrow {
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--ads-color-primary);
    font-size: 10px;
    font-weight: 750;
    letter-spacing: 0.1em;
  }

  .eyebrow-mark {
    font-size: 15px;
  }

  h1 {
    margin: 11px 0 8px;
    color: var(--ads-color-text);
    font-size: 38px;
    font-weight: 700;
    letter-spacing: -0.05em;
  }

  .hero-layout p {
    max-width: 610px;
    margin: 0;
    color: var(--ads-color-text-secondary);
    font-size: 14px;
    line-height: 1.7;
  }

  .catalog-stats {
    display: flex;
    align-items: center;
    gap: 13px;
    margin-top: 21px;
    color: var(--ads-color-text-tertiary);
    font-size: 11px;
  }

  .catalog-stats strong {
    color: var(--ads-color-text);
    font-size: 12px;
  }

  .catalog-stats i {
    width: 3px;
    height: 3px;
    border-radius: 50%;
    background: var(--ads-color-border);
  }

  .hero-art {
    position: relative;
    width: 230px;
    height: 200px;
    margin-right: 35px;
  }

  .art-orbit {
    position: absolute;
    top: 50%;
    left: 50%;
    border: 1px solid var(--site-color-orbit);
    border-radius: 50%;
    transform: translate(-50%, -50%);
  }

  .orbit-one {
    width: 190px;
    height: 190px;
  }

  .orbit-two {
    width: 145px;
    height: 145px;
    border-style: dashed;
  }

  .art-tile {
    position: absolute;
    display: grid;
    place-items: center;
    border: 1px solid var(--ads-color-border-secondary);
    border-radius: 18px;
    background: var(--ads-color-bg-container);
    box-shadow: var(--site-shadow-art);
  }

  .tile-back {
    top: 28px;
    right: 27px;
    width: 74px;
    height: 74px;
    color: var(--ads-color-violet);
    font-size: 31px;
    font-weight: 650;
    transform: rotate(9deg);
  }

  .tile-front {
    bottom: 24px;
    left: 26px;
    width: 97px;
    height: 81px;
    align-content: center;
    gap: 7px;
    padding: 14px;
    border-radius: 13px;
    transform: rotate(-8deg);
  }

  .tile-front span {
    display: grid;
    width: 23px;
    height: 23px;
    place-items: center;
    border-radius: 7px;
    background: var(--ads-color-primary);
    color: var(--ads-color-text-inverse);
    font-size: 13px;
  }

  .tile-front i {
    position: absolute;
    left: 46px;
    width: 31px;
    height: 4px;
    border-radius: 5px;
    background: var(--ads-color-border-secondary);
  }

  .tile-front i:nth-of-type(1) {
    top: 24px;
  }

  .tile-front i:nth-of-type(2) {
    top: 34px;
    width: 23px;
  }

  .tile-front i:nth-of-type(3) {
    top: 44px;
    width: 28px;
  }

  .art-sparkle {
    position: absolute;
    color: var(--ads-color-primary);
  }

  .sparkle-one {
    top: 27px;
    left: 30px;
    font-size: 18px;
  }

  .sparkle-two {
    right: 16px;
    bottom: 31px;
    color: var(--ads-color-violet);
    font-size: 23px;
  }

  .catalog-section {
    display: grid;
    min-height: 398px;
    grid-template-columns: 220px minmax(0, 1fr);
    gap: 49px;
    padding-top: 41px;
    padding-bottom: 57px;
  }

  .catalog-sidebar {
    display: flex;
    align-items: stretch;
    flex-direction: column;
    gap: 3px;
  }

  .sidebar-title {
    margin: 0 0 11px 10px;
    color: var(--ads-color-text-quaternary);
    font-size: 9px;
    font-weight: 750;
    letter-spacing: 0.12em;
  }

  .category-button {
    display: flex;
    min-height: 36px;
    align-items: center;
    gap: 9px;
    padding: 0 10px;
    border: 0;
    border-radius: 7px;
    background: transparent;
    color: var(--ads-color-text-secondary);
    cursor: pointer;
    font-size: 11px;
    text-align: left;
    transition:
      color var(--ads-motion-duration) var(--ads-motion-ease),
      background var(--ads-motion-duration) var(--ads-motion-ease);
  }

  .category-button:hover,
  .category-button.selected {
    background: var(--ads-color-primary-soft);
    color: var(--ads-color-primary);
  }

  .category-icon {
    display: grid;
    width: 16px;
    place-items: center;
    color: currentColor;
    font-size: 13px;
  }

  .category-count {
    margin-left: auto;
    color: var(--ads-color-text-quaternary);
    font-size: 10px;
  }

  .selected .category-count {
    color: var(--ads-color-primary);
  }

  .sidebar-note {
    display: grid;
    gap: 7px;
    margin-top: 22px;
    padding: 13px;
    border: 1px solid var(--ads-color-border-secondary);
    border-radius: 10px;
    background: var(--ads-color-bg-subtle);
  }

  .note-icon {
    color: var(--ads-color-primary);
    font-size: 15px;
  }

  .sidebar-note strong {
    color: var(--ads-color-text);
    font-size: 10px;
  }

  .sidebar-note p {
    margin: 0;
    color: var(--ads-color-text-tertiary);
    font-size: 9px;
    line-height: 1.6;
  }

  .catalog-toolbar {
    display: flex;
    min-height: 54px;
    align-items: flex-start;
    justify-content: space-between;
    gap: 20px;
    margin-bottom: 17px;
  }

  .catalog-toolbar h2 {
    margin: 0 0 5px;
    color: var(--ads-color-text);
    font-size: 19px;
    font-weight: 680;
    letter-spacing: -0.03em;
  }

  .catalog-toolbar p {
    margin: 0;
    color: var(--ads-color-text-tertiary);
    font-size: 10px;
  }

  .search-box {
    display: flex;
    width: min(250px, 42%);
    height: 34px;
    align-items: center;
    gap: 8px;
    padding: 0 9px;
    border: 1px solid var(--ads-color-border-secondary);
    border-radius: 7px;
    background: var(--ads-color-bg-container);
    transition: border-color var(--ads-motion-duration) var(--ads-motion-ease);
  }

  .search-box:focus-within {
    border-color: var(--ads-color-primary);
  }

  .search-box svg {
    width: 14px;
    height: 14px;
    flex: 0 0 auto;
    fill: none;
    stroke: var(--ads-color-text-tertiary);
    stroke-width: 1.5;
  }

  .search-box input {
    width: 100%;
    min-width: 0;
    border: 0;
    outline: 0;
    background: transparent;
    color: var(--ads-color-text);
    font-size: 10px;
  }

  .search-box input::placeholder {
    color: var(--ads-color-text-quaternary);
  }

  .component-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 13px;
  }

  .component-card {
    display: flex;
    min-height: 160px;
    flex-direction: column;
    padding: 16px;
    border: 1px solid var(--ads-color-border-secondary);
    border-radius: 10px;
    background: var(--ads-color-bg-container);
    color: inherit;
    text-decoration: none;
    transition:
      border-color var(--ads-motion-duration) var(--ads-motion-ease),
      box-shadow var(--ads-motion-duration) var(--ads-motion-ease),
      transform var(--ads-motion-duration) var(--ads-motion-ease);
  }

  .component-card:hover {
    border-color: var(--ads-color-primary-border);
    box-shadow: var(--site-shadow-component-hover);
    transform: translateY(-2px);
  }

  .card-top,
  .component-title-row,
  .card-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .component-symbol {
    display: grid;
    width: 29px;
    height: 29px;
    place-items: center;
    border-radius: 8px;
    background: var(--ads-color-primary-soft);
    color: var(--ads-color-primary);
    font-size: 15px;
    font-weight: 700;
  }

  .ready-badge {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 4px 7px;
    border: 1px solid var(--ads-color-success-border);
    border-radius: 999px;
    background: var(--ads-color-success-soft);
    color: var(--ads-color-success);
    font-size: 9px;
    font-weight: 600;
  }

  .ready-badge i {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: var(--ads-color-success);
  }

  .component-title-row {
    justify-content: flex-start;
    gap: 9px;
    margin-top: 13px;
  }

  .component-title-row h3 {
    margin: 0;
    color: var(--ads-color-text);
    font-size: 15px;
    font-weight: 670;
  }

  .component-title-row code {
    color: var(--ads-color-text-tertiary);
    font-family: var(--ads-font-family-code);
    font-size: 9px;
  }

  .component-card > p {
    margin: 7px 0 14px;
    color: var(--ads-color-text-secondary);
    font-size: 10px;
    line-height: 1.6;
  }

  .card-footer {
    margin-top: auto;
    padding-top: 10px;
    border-top: 1px solid var(--ads-color-border-secondary);
    color: var(--ads-color-text-tertiary);
    font-size: 9px;
  }

  .card-arrow {
    color: var(--ads-color-primary);
    font-size: 14px;
  }

  .empty-state {
    display: flex;
    min-height: 230px;
    align-items: center;
    flex-direction: column;
    justify-content: center;
    padding: 25px;
    border: 1px dashed var(--ads-color-border);
    border-radius: 10px;
    text-align: center;
  }

  .empty-icon {
    color: var(--ads-color-text-quaternary);
    font-size: 25px;
  }

  .empty-state h3 {
    margin: 10px 0 5px;
    color: var(--ads-color-text);
    font-size: 13px;
  }

  .empty-state p {
    max-width: 300px;
    margin: 0;
    color: var(--ads-color-text-tertiary);
    font-size: 10px;
    line-height: 1.65;
  }

  .clear-search {
    margin-top: 13px;
    padding: 6px 10px;
    border: 1px solid var(--ads-color-border-secondary);
    border-radius: 6px;
    background: var(--ads-color-bg-container);
    color: var(--ads-color-primary);
    cursor: pointer;
    font-size: 10px;
  }

  .component-details {
    padding: 52px 0 55px;
    border-top: 1px solid var(--ads-color-border-secondary);
    background: var(--ads-color-bg-subtle);
    scroll-margin-top: 84px;
  }

  .details-heading {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 25px;
    margin-bottom: 24px;
  }

  .details-heading .ready-badge {
    margin-top: 16px;
  }

  .details-heading h2 {
    display: flex;
    align-items: baseline;
    gap: 10px;
    margin: 8px 0;
    color: var(--ads-color-text);
    font-size: 24px;
    font-weight: 680;
    letter-spacing: -0.04em;
  }

  .details-heading h2 span {
    color: var(--ads-color-text-tertiary);
    font-size: 14px;
    font-weight: 450;
    letter-spacing: 0;
  }

  .details-heading p {
    max-width: 720px;
    margin: 0;
    color: var(--ads-color-text-secondary);
    font-size: 13px;
    line-height: 1.7;
  }

  .readme-link {
    flex: 0 0 auto;
    color: var(--ads-color-primary);
    font-size: 10px;
    font-weight: 600;
    text-decoration: none;
  }

  .readme-link span {
    margin-left: 4px;
  }

  .usage-intro {
    margin-bottom: 38px;
    padding: 21px 23px;
    border: 1px solid var(--ads-color-border-secondary);
    border-radius: 10px;
    background: var(--ads-color-bg-container);
  }

  .usage-intro h3,
  .examples-heading h3 {
    margin: 0;
    color: var(--ads-color-text);
    font-size: 18px;
    font-weight: 650;
    letter-spacing: -0.025em;
  }

  .usage-intro p,
  .examples-heading p {
    margin: 7px 0 0;
    color: var(--ads-color-text-secondary);
    font-size: 12px;
    line-height: 1.65;
  }

  .usage-intro pre,
  .example-card pre {
    overflow-x: auto;
    margin: 15px 0 0;
    padding: 15px 17px;
    border-radius: 7px;
    background: var(--ads-color-bg-code);
    color: var(--ads-color-text-secondary);
    font-family: var(--ads-font-family-code);
    font-size: 11px;
    line-height: 1.8;
    tab-size: 2;
  }

  .usage-intro pre {
    max-width: 720px;
  }

  .usage-intro code,
  .example-card code {
    font-family: inherit;
  }

  .examples-section,
  .api-section {
    margin-top: 40px;
  }

  .examples-heading {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 20px;
    margin-bottom: 16px;
  }

  .section-kicker {
    display: block;
    margin-bottom: 7px;
    color: var(--ads-color-primary);
    font-size: 9px;
    font-weight: 750;
    letter-spacing: 0.12em;
  }

  .examples-grid {
    display: grid;
    align-items: start;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 14px;
  }

  .example-card {
    align-self: start;
    min-width: 0;
    padding: 18px;
    border: 1px solid var(--ads-color-border-secondary);
    border-radius: 10px;
    background: var(--ads-color-bg-container);
    transition: border-color var(--ads-motion-duration) var(--ads-motion-ease);
  }

  .example-card:hover,
  .example-card:focus-within {
    border-color: var(--ads-color-border);
  }

  .example-description {
    min-height: 66px;
  }

  .example-description h4 {
    margin: 0;
    color: var(--ads-color-text);
    font-size: 13px;
    font-weight: 650;
  }

  .example-description p {
    margin: 6px 0 0;
    color: var(--ads-color-text-tertiary);
    font-size: 11px;
    line-height: 1.6;
  }

  .example-demo {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 10px;
    min-height: 82px;
    padding: 13px 0;
  }

  .example-demo :global(.ads-btn) {
    flex: 0 0 auto;
  }

  .example-demo-align {
    align-items: flex-end;
  }

  .example-demo-column {
    align-items: stretch;
    flex-direction: column;
  }

  .example-demo-column :global(.ads-btn) {
    justify-content: center;
  }

  .example-code-toolbar {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16px;
    min-height: 28px;
    padding-top: 2px;
  }

  .code-action,
  .code-languages button {
    display: inline-grid;
    width: 22px;
    height: 22px;
    place-items: center;
    padding: 0;
    border: 0;
    border-radius: 6px;
    background: transparent;
    color: var(--ads-color-text-secondary);
    cursor: pointer;
    font-size: 9px;
    font-weight: 650;
    transition:
      color var(--ads-motion-duration) var(--ads-motion-ease),
      background var(--ads-motion-duration) var(--ads-motion-ease);
  }

  .code-action:hover,
  .code-languages button:hover,
  .code-languages button.active {
    color: var(--ads-color-primary);
  }

  .code-action {
    width: 16px;
    height: 16px;
  }

  .code-toggle {
    width: 16px;
    height: 16px;
    opacity: 0.55;
    transition: opacity var(--ads-motion-duration) var(--ads-motion-ease);
  }

  .code-toggle:hover,
  .code-toggle:focus-visible,
  .code-toggle[aria-expanded='true'] {
    opacity: 1;
  }

  .code-languages {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    margin-left: auto;
    padding: 1px;
    border: 1px solid var(--ads-color-border-secondary);
    border-radius: 8px;
    background: var(--ads-color-bg-container);
  }

  .code-languages button.active {
    background: var(--ads-color-primary-soft);
  }

  .code-languages button:first-child {
    border-radius: 5px 3px 3px 5px;
  }

  .code-languages button:last-child {
    border-radius: 3px 5px 5px 3px;
  }

  .code-panel {
    margin-top: 8px;
    padding: 8px;
    border-radius: 7px;
    background: var(--ads-color-bg-code);
  }

  .code-panel .code-languages {
    margin: 0 0 6px auto;
    width: fit-content;
    border: 0;
    background: transparent;
  }

  .code-panel .code-languages button {
    width: auto;
    min-width: 28px;
    height: 22px;
    padding: 0 6px;
  }

  .code-action svg {
    width: 16px;
    height: 16px;
    fill: none;
    stroke: currentColor;
    stroke-linecap: round;
    stroke-linejoin: round;
    stroke-width: 1.5;
  }

  .code-action.code-toggle img {
    display: block;
    width: 16px;
    height: 16px;
  }

  :global(:root[data-theme='dark']) .code-action.code-toggle img {
    filter: invert(1);
  }

  .code-action[aria-label='Скопировано'] {
    color: var(--ads-color-success);
  }

  .code-action:focus-visible,
  .code-languages button:focus-visible {
    outline: var(--ads-focus-outline-width) solid var(--ads-color-focus-outline);
    outline-offset: var(--ads-focus-outline-offset);
  }

  .copy-error {
    margin: 8px 0 0;
    color: var(--ads-color-danger);
    font-size: 10px;
  }

  .example-card pre {
    overflow: auto;
    max-height: 360px;
    margin: 0;
    padding: 10px;
    background: transparent;
  }

  .api-table-wrap {
    overflow-x: auto;
    border: 1px solid var(--ads-color-border-secondary);
    border-radius: 9px;
    background: var(--ads-color-bg-container);
  }

  .api-table {
    width: 100%;
    border-collapse: collapse;
    color: var(--ads-color-text-secondary);
    font-size: 11px;
    text-align: left;
  }

  .api-table th,
  .api-table td {
    padding: 11px 14px;
    border-bottom: 1px solid var(--ads-color-border-secondary);
    vertical-align: top;
  }

  .api-table th {
    background: var(--ads-color-bg-subtle);
    color: var(--ads-color-text);
    font-weight: 650;
    white-space: nowrap;
  }

  .api-table tr:last-child td {
    border-bottom: 0;
  }

  .api-table code {
    color: var(--ads-color-violet);
    font-family: var(--ads-font-family-code);
    font-size: 10px;
  }

  .tokens-strip {
    display: flex;
    min-height: 57px;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
    margin-top: 14px;
    padding: 0 15px;
    border: 1px solid var(--ads-color-border-secondary);
    border-radius: 9px;
    background: var(--ads-color-bg-container);
  }

  .tokens-strip > div {
    display: flex;
    align-items: center;
    gap: 9px;
  }

  .token-color {
    width: 19px;
    height: 19px;
    border: 3px solid var(--ads-color-primary-soft);
    border-radius: 6px;
    background: var(--ads-color-primary);
  }

  .tokens-strip strong,
  .tokens-strip small {
    display: block;
  }

  .tokens-strip strong {
    color: var(--ads-color-text);
    font-size: 9px;
  }

  .tokens-strip small {
    margin-top: 2px;
    color: var(--ads-color-text-tertiary);
    font-size: 8px;
  }

  .tokens-strip code {
    color: var(--ads-color-text-secondary);
    font-family: var(--ads-font-family-code);
    font-size: 8px;
  }

  .site-footer {
    border-top: 1px solid var(--ads-color-border-secondary);
  }

  .footer-inner {
    display: flex;
    min-height: 74px;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    color: var(--ads-color-text-tertiary);
    font-size: 10px;
  }

  .footer-brand {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    color: var(--ads-color-text);
    font-size: 12px;
    font-weight: 650;
    text-decoration: none;
  }

  .brand-mark {
    display: grid;
    width: 22px;
    height: 22px;
    place-items: center;
    border-radius: 7px;
    background: var(--ads-color-primary);
    color: var(--ads-color-text-inverse);
    font-size: 12px;
    font-weight: 750;
  }

  .footer-inner p {
    margin: 0;
    text-align: center;
  }

  @media (max-width: 820px) {
    .catalog-section {
      grid-template-columns: 180px minmax(0, 1fr);
      gap: 25px;
    }

    .hero-art {
      margin-right: 0;
    }

    .examples-grid {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 620px) {
    .page-width {
      width: min(100% - 32px, 1200px);
    }

    .hero-layout {
      min-height: 218px;
    }

    .hero-art {
      display: none;
    }

    h1 {
      font-size: 32px;
    }

    .catalog-section {
      grid-template-columns: 1fr;
      gap: 23px;
      padding-top: 26px;
    }

    .catalog-sidebar {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .sidebar-title,
    .sidebar-note {
      grid-column: 1 / -1;
    }

    .sidebar-note {
      display: none;
    }

    .catalog-toolbar {
      align-items: flex-start;
      flex-direction: column;
    }

    .search-box {
      width: 100%;
    }

    .component-grid {
      grid-template-columns: 1fr;
    }

    .details-heading {
      align-items: flex-start;
      flex-direction: column;
    }

    .examples-heading {
      align-items: flex-start;
      flex-direction: column;
    }

    .example-card {
      padding: 15px;
    }

    .api-table {
      min-width: 670px;
    }

    .tokens-strip {
      align-items: flex-start;
      flex-direction: column;
      padding: 13px;
    }

    .footer-inner {
      align-items: flex-start;
      flex-direction: column;
      justify-content: center;
      padding-top: 18px;
      padding-bottom: 18px;
    }

    .footer-inner p {
      text-align: left;
    }
  }

  @media (max-width: 360px) {
    .catalog-sidebar {
      grid-template-columns: 1fr;
    }

    .sidebar-title,
    .sidebar-note {
      grid-column: auto;
    }
  }
</style>
