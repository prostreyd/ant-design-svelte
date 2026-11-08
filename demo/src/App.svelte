<script lang="ts">
  import { Button, VERSION } from '$lib';
  import SiteHeader from './SiteHeader.svelte';
</script>

{#snippet uploadIcon()}
  <svg viewBox="0 0 16 16" aria-hidden="true">
    <path d="M8 12V2m0 0L4 6m4-4 4 4M2 14h12" />
  </svg>
{/snippet}

<svelte:head>
  <title>Svelte UI — Компоненты для Svelte 5</title>
  <meta
    name="description"
    content="Оригинальная библиотека UI-компонентов для Svelte 5: типизация, доступность и дизайн-токены."
  />
</svelte:head>

<SiteHeader active="home" />

<main>
  <section class="hero page-width">
    <div class="hero-copy">
      <div class="eyebrow"><span class="status-dot"></span> Svelte 5 · TypeScript · MIT</div>
      <h1>Знакомая система компонентов.<br /><span>Нативно для Svelte 5.</span></h1>
      <p class="hero-description">
        Открытая библиотека UI-компонентов с продуманными API, доступностью и удобством,
        которого ждёшь от современного Svelte.
      </p>

      <div class="hero-actions">
        <Button type="primary" href="./components.html">
          Смотреть компоненты
          <span class="arrow" aria-hidden="true">→</span>
        </Button>
        <a class="text-action" href="#principles">Принципы проекта</a>
      </div>

      <div class="hero-meta">
        <span><span class="meta-check">✓</span> Svelte 5 Runes</span>
        <span><span class="meta-check">✓</span> Строгий TypeScript</span>
        <span><span class="meta-check">✓</span> Оригинальная реализация</span>
      </div>
    </div>

    <div class="hero-visual" aria-label="Пример компонента Button">
      <div class="visual-glow"></div>
      <div class="preview-card">
        <div class="preview-top">
          <div class="window-dots" aria-hidden="true"><i></i><i></i><i></i></div>
          <span>Button · preview</span>
          <span class="preview-version">v{VERSION}</span>
        </div>

        <div class="preview-content">
          <div class="preview-label">Варианты</div>
          <div class="preview-row">
            <Button type="primary">Primary</Button>
            <Button>Default</Button>
          </div>
          <div class="preview-row">
            <Button type="dashed">Dashed</Button>
            <Button type="text">Text</Button>
            <Button type="link">Link</Button>
          </div>

          <div class="preview-divider"></div>
          <div class="preview-label">Размеры и состояния</div>
          <div class="preview-row align-bottom">
            <Button type="primary" size="large">Large</Button>
            <Button type="primary">Medium</Button>
            <Button type="primary" size="small">Small</Button>
          </div>
          <div class="preview-row">
            <Button type="primary" icon={uploadIcon}>Upload</Button>
            <Button type="primary" icon={uploadIcon} iconPlacement="end">Upload</Button>
          </div>
          <div class="preview-row">
            <Button type="primary" danger>Danger action</Button>
            <Button type="primary" disabled>Disabled</Button>
          </div>
        </div>

        <div class="preview-code">
          <span class="code-muted">&lt;</span><span class="code-tag">Button</span>
          <span class="code-attr"> type</span>=<span class="code-value">"primary"</span><span
            class="code-muted">&gt;</span
          ><br />
          &nbsp;&nbsp;Save changes<br />
          <span class="code-muted">&lt;/</span><span class="code-tag">Button</span><span
            class="code-muted">&gt;</span
          >
        </div>
      </div>
      <div class="floating-note"><span>✦</span> Сделано для Svelte 5</div>
    </div>
  </section>

  <section class="stats-strip">
    <div class="page-width stats-inner">
      <div><strong>01</strong><span>компонент доступен</span></div>
      <div><strong>100%</strong><span>покрытие Button тестами</span></div>
      <div><strong>MIT</strong><span>открытая лицензия</span></div>
      <div><strong>0</strong><span>React-зависимостей</span></div>
    </div>
  </section>

  <section class="principles page-width" id="principles">
    <div class="section-heading">
      <span class="section-kicker">НАШ ПОДХОД</span>
      <h2>Продумано для реальной разработки</h2>
      <p>Публичные API знакомы, реализация и опыт использования — свои, Svelte-native.</p>
    </div>

    <div class="principle-grid">
      <article class="principle-card">
        <span class="principle-icon blue">⌘</span>
        <h3>Идиоматичный Svelte</h3>
        <p>Runes, snippets и колбэки. Без переноса React- или Vue-паттернов в чужую среду.</p>
      </article>
      <article class="principle-card">
        <span class="principle-icon violet">◇</span>
        <h3>Понятный контракт</h3>
        <p>У компонента есть спецификация, типы, примеры и тесты на публичное поведение.</p>
      </article>
      <article class="principle-card">
        <span class="principle-icon mint">◉</span>
        <h3>Настраиваемая основа</h3>
        <p>Scoped-стили и CSS-токены помогают настроить интерфейс, не загрязняя приложение.</p>
      </article>
    </div>
  </section>

  <section class="components-callout">
    <div class="page-width callout-inner">
      <div>
        <span class="section-kicker">БИБЛИОТЕКА РАСТЁТ</span>
        <h2>Начни с первого компонента</h2>
        <p>Button уже включает варианты, размеры, состояния загрузки и доступную клавиатурную навигацию.</p>
      </div>
      <Button href="./components.html#button-details">
        Открыть Button
        <span class="arrow" aria-hidden="true">→</span>
      </Button>
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

  .hero {
    display: grid;
    min-height: 594px;
    grid-template-columns: 1.02fr 0.98fr;
    align-items: center;
    gap: 50px;
    padding-top: 54px;
    padding-bottom: 68px;
  }

  .hero-copy {
    position: relative;
    z-index: 1;
  }

  .eyebrow {
    display: inline-flex;
    align-items: center;
    gap: 9px;
    padding: 7px 12px;
    border: 1px solid var(--ads-color-border-secondary);
    border-radius: 999px;
    background: var(--ads-color-bg-subtle);
    color: var(--ads-color-text-secondary);
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.015em;
  }

  .status-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--ads-color-success);
    box-shadow: 0 0 0 3px var(--ads-color-success-soft);
  }

  h1 {
    margin: 25px 0 20px;
    color: var(--ads-color-text);
    font-size: clamp(36px, 4.2vw, 55px);
    font-weight: 720;
    letter-spacing: -0.055em;
    line-height: 1.11;
  }

  h1 span {
    color: var(--ads-color-primary);
  }

  .hero-description {
    max-width: 520px;
    margin: 0;
    color: var(--ads-color-text-secondary);
    font-size: 17px;
    line-height: 1.75;
  }

  .hero-actions {
    display: flex;
    align-items: center;
    gap: 24px;
    margin-top: 30px;
  }

  .hero-actions :global(.ads-btn),
  .callout-inner :global(.ads-btn) {
    min-height: 44px;
    gap: 10px;
    padding: 0 18px;
    font-weight: 600;
  }

  .arrow {
    font-size: 17px;
    line-height: 1;
  }

  .text-action {
    color: var(--ads-color-text-secondary);
    font-size: 14px;
    font-weight: 600;
    text-decoration: none;
  }

  .text-action:hover {
    color: var(--ads-color-primary);
  }

  .hero-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 18px;
    margin-top: 29px;
    color: var(--ads-color-text-tertiary);
    font-size: 11px;
  }

  .meta-check {
    margin-right: 4px;
    color: var(--ads-color-success);
    font-weight: 700;
  }

  .hero-visual {
    position: relative;
    display: grid;
    min-height: 420px;
    place-items: center;
  }

  .visual-glow {
    position: absolute;
    width: 440px;
    height: 440px;
    border-radius: 50%;
    background:
      radial-gradient(circle at 30% 35%, var(--site-color-art-glow), transparent 53%),
      radial-gradient(circle at 70% 70%, var(--site-color-violet-glow), transparent 52%);
    filter: blur(2px);
  }

  .preview-card {
    position: relative;
    width: min(100%, 495px);
    overflow: hidden;
    border: 1px solid var(--ads-color-border-secondary);
    border-radius: 17px;
    background: var(--ads-color-bg-container);
    box-shadow: var(--site-shadow-card);
    transform: rotate(1deg);
  }

  .preview-top {
    display: flex;
    height: 44px;
    align-items: center;
    justify-content: space-between;
    padding: 0 16px;
    border-bottom: 1px solid var(--ads-color-border-secondary);
    color: var(--ads-color-text-tertiary);
    font-size: 11px;
  }

  .window-dots {
    display: flex;
    gap: 5px;
  }

  .window-dots i {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--ads-color-border);
  }

  .window-dots i:first-child {
    background: #ff7875;
  }

  .window-dots i:nth-child(2) {
    background: #ffc53d;
  }

  .window-dots i:nth-child(3) {
    background: #73d13d;
  }

  .preview-version {
    color: var(--ads-color-text-quaternary);
  }

  .preview-content {
    display: grid;
    gap: 12px;
    padding: 21px 22px 18px;
  }

  .preview-label {
    color: var(--ads-color-text-tertiary);
    font-size: 10px;
    font-weight: 650;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .preview-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
  }

  .preview-row :global(.ads-btn) {
    min-height: 31px;
    padding: 0 10px;
    font-size: 11px;
  }

  .preview-row :global(.ads-btn-icon svg) {
    width: 12px;
    height: 12px;
    fill: none;
    stroke: currentColor;
    stroke-linecap: round;
    stroke-linejoin: round;
    stroke-width: 1.6;
  }

  .preview-row.align-bottom {
    align-items: flex-end;
  }

  .preview-divider {
    height: 1px;
    margin: 3px 0;
    background: var(--ads-color-border-secondary);
  }

  .preview-code {
    padding: 15px 22px;
    border-top: 1px solid var(--ads-color-border-secondary);
    background: var(--ads-color-bg-code);
    color: var(--ads-color-text-secondary);
    font-family: var(--ads-font-family-code);
    font-size: 11px;
    line-height: 1.85;
  }

  .code-muted {
    color: var(--ads-color-text-tertiary);
  }

  .code-tag {
    color: var(--ads-color-code-blue);
  }

  .code-attr {
    color: var(--ads-color-code-purple);
  }

  .code-value {
    color: var(--ads-color-code-green);
  }

  .floating-note {
    position: absolute;
    right: -2px;
    bottom: 17px;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 11px 15px;
    border: 1px solid var(--ads-color-border-secondary);
    border-radius: 12px;
    background: var(--ads-color-bg-container);
    box-shadow: var(--site-shadow-card-hover);
    color: var(--ads-color-text-secondary);
    font-size: 12px;
    font-weight: 600;
  }

  .floating-note span {
    color: var(--ads-color-primary);
    font-size: 16px;
  }

  .stats-strip {
    border-top: 1px solid var(--ads-color-border-secondary);
    border-bottom: 1px solid var(--ads-color-border-secondary);
    background: var(--ads-color-bg-subtle);
  }

  .stats-inner {
    display: grid;
    min-height: 91px;
    grid-template-columns: repeat(4, 1fr);
    align-items: center;
  }

  .stats-inner > div {
    display: flex;
    align-items: baseline;
    justify-content: center;
    gap: 9px;
  }

  .stats-inner strong {
    color: var(--ads-color-text);
    font-size: 18px;
    letter-spacing: -0.04em;
  }

  .stats-inner span {
    color: var(--ads-color-text-tertiary);
    font-size: 11px;
  }

  .principles {
    padding-top: 83px;
    padding-bottom: 94px;
  }

  .section-heading {
    max-width: 650px;
    margin: 0 auto 36px;
    text-align: center;
  }

  .section-kicker {
    color: var(--ads-color-primary);
    font-size: 10px;
    font-weight: 750;
    letter-spacing: 0.13em;
  }

  .section-heading h2,
  .callout-inner h2 {
    margin: 11px 0 10px;
    color: var(--ads-color-text);
    font-size: 29px;
    font-weight: 680;
    letter-spacing: -0.045em;
  }

  .section-heading p,
  .callout-inner p {
    margin: 0;
    color: var(--ads-color-text-secondary);
    font-size: 14px;
    line-height: 1.75;
  }

  .principle-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 17px;
  }

  .principle-card {
    padding: 23px 24px 25px;
    border: 1px solid var(--ads-color-border-secondary);
    border-radius: 14px;
    background: var(--ads-color-bg-container);
    transition:
      transform var(--ads-motion-duration) var(--ads-motion-ease),
      box-shadow var(--ads-motion-duration) var(--ads-motion-ease);
  }

  .principle-card:hover {
    box-shadow: var(--site-shadow-principle-hover);
    transform: translateY(-3px);
  }

  .principle-icon {
    display: grid;
    width: 35px;
    height: 35px;
    place-items: center;
    border-radius: 10px;
    font-size: 17px;
    font-weight: 700;
  }

  .principle-icon.blue {
    background: var(--ads-color-primary-soft);
    color: var(--ads-color-primary);
  }

  .principle-icon.violet {
    background: var(--ads-color-violet-soft);
    color: var(--ads-color-violet);
  }

  .principle-icon.mint {
    background: var(--ads-color-success-soft);
    color: var(--ads-color-success);
  }

  .principle-card h3 {
    margin: 20px 0 8px;
    color: var(--ads-color-text);
    font-size: 15px;
    font-weight: 650;
  }

  .principle-card p {
    margin: 0;
    color: var(--ads-color-text-secondary);
    font-size: 12px;
    line-height: 1.75;
  }

  .components-callout {
    padding: 44px 0;
    background:
      radial-gradient(ellipse at 80% 10%, var(--site-color-primary-glow), transparent 35%),
      var(--ads-color-bg-subtle);
  }

  .callout-inner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 30px;
  }

  .callout-inner h2 {
    margin-bottom: 7px;
    font-size: 23px;
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

  .footer-brand .brand-mark {
    width: 22px;
    height: 22px;
    border-radius: 7px;
    font-size: 12px;
  }

  .footer-inner p {
    margin: 0;
    text-align: center;
  }

  @media (max-width: 900px) {
    .hero {
      min-height: 0;
      grid-template-columns: 1fr;
      gap: 24px;
      padding-top: 64px;
    }

    .hero-copy {
      max-width: 680px;
    }

    .hero-visual {
      min-height: 390px;
    }

    .stats-inner {
      grid-template-columns: repeat(2, 1fr);
      gap: 18px;
      padding-top: 20px;
      padding-bottom: 20px;
    }

    .stats-inner > div {
      justify-content: flex-start;
    }
  }

  @media (max-width: 620px) {
    .page-width {
      width: min(100% - 32px, 1200px);
    }

    .hero {
      padding-top: 46px;
      padding-bottom: 45px;
    }

    h1 {
      font-size: 36px;
    }

    .hero-description {
      font-size: 15px;
    }

    .hero-actions {
      align-items: flex-start;
      flex-direction: column;
      gap: 16px;
    }

    .hero-meta {
      gap: 10px 14px;
      line-height: 1.6;
    }

    .hero-visual {
      min-height: 345px;
    }

    .visual-glow {
      width: 100%;
      height: auto;
      aspect-ratio: 1;
    }

    .preview-card {
      transform: none;
    }

    .preview-content {
      gap: 9px;
      padding: 17px 14px;
    }

    .preview-row {
      gap: 6px;
    }

    .preview-row :global(.ads-btn) {
      padding: 0 8px;
      font-size: 10px;
    }

    .floating-note {
      right: 0;
      bottom: 0;
    }

    .stats-inner {
      gap: 15px 8px;
    }

    .stats-inner > div {
      align-items: flex-start;
      flex-direction: column;
      gap: 2px;
    }

    .principles {
      padding-top: 60px;
      padding-bottom: 64px;
    }

    .section-heading h2 {
      font-size: 24px;
    }

    .principle-grid {
      grid-template-columns: 1fr;
    }

    .components-callout {
      padding: 34px 0;
    }

    .callout-inner {
      align-items: flex-start;
      flex-direction: column;
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
</style>
