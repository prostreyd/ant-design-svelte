<script lang="ts">
  import { getSiteTheme, setSiteTheme, type SiteTheme } from './theme';

  interface Props {
    active: 'home' | 'components';
  }

  let { active }: Props = $props();
  let theme = $state<SiteTheme>(getSiteTheme());

  function toggleTheme(): void {
    theme = theme === 'dark' ? 'light' : 'dark';
    setSiteTheme(theme);
  }
</script>

<header class="site-header">
  <div class="header-inner">
    <a class="brand" href="./" aria-label="Svelte UI — главная">
      <span class="brand-mark" aria-hidden="true">S</span>
      <span class="brand-name">Svelte UI</span>
      <span class="brand-version">v0.1</span>
    </a>

    <nav class="main-nav" aria-label="Основная навигация">
      <a class:active={active === 'home'} href="./">Главная</a>
      <a class:active={active === 'components'} href="./components.html">Компоненты</a>
      <a href="./components.html#design-tokens">Дизайн-токены</a>
    </nav>

    <div class="header-actions">
      <button
        class="theme-toggle"
        type="button"
        aria-label={theme === 'dark' ? 'Включить светлую тему' : 'Включить тёмную тему'}
        aria-pressed={theme === 'dark'}
        title={theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}
        onclick={toggleTheme}
      >
        {#if theme === 'dark'}
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="12" r="4"></circle>
            <path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42"></path>
          </svg>
        {:else}
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M20.9 13A8.5 8.5 0 0 1 11 3.1 8.7 8.7 0 1 0 20.9 13Z"></path>
          </svg>
        {/if}
      </button>

      <a
        class="github-link"
        href="https://github.com/prostreyd/ant-design-svelte"
        target="_blank"
        rel="noreferrer"
        aria-label="Открыть GitHub репозиторий"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="currentColor"
            d="M12 .9a11.1 11.1 0 0 0-3.51 21.63c.56.1.76-.24.76-.54v-2.1c-3.1.68-3.76-1.32-3.76-1.32-.5-1.3-1.24-1.65-1.24-1.65-1.02-.7.08-.69.08-.69 1.13.08 1.72 1.16 1.72 1.16 1 .1.75 2.45 3.64 1.75.1-.72.4-1.2.7-1.48-2.48-.28-5.08-1.24-5.08-5.52 0-1.22.44-2.21 1.16-2.99-.12-.29-.5-1.42.11-2.95 0 0 .95-.3 3.05 1.14a10.6 10.6 0 0 1 5.55 0c2.1-1.43 3.05-1.14 3.05-1.14.61 1.53.23 2.66.11 2.95.72.78 1.16 1.77 1.16 2.99 0 4.29-2.6 5.24-5.09 5.52.4.35.76 1.03.76 2.08v3.08c0 .3.2.65.77.54A11.1 11.1 0 0 0 12 .9Z"
          />
        </svg>
        <span>GitHub</span>
      </a>
    </div>
  </div>
</header>

<style>
  .site-header {
    position: sticky;
    z-index: 10;
    top: 0;
    border-bottom: 1px solid var(--ads-color-border-secondary);
    background: var(--site-header-bg);
    backdrop-filter: blur(16px);
  }

  .header-inner {
    display: flex;
    width: min(1200px, calc(100% - 48px));
    height: 68px;
    align-items: center;
    justify-content: space-between;
    margin: 0 auto;
  }

  .brand,
  .main-nav,
  .github-link,
  .header-actions {
    display: flex;
    align-items: center;
  }

  .header-actions {
    gap: 16px;
  }

  .brand {
    gap: 10px;
    color: var(--ads-color-text);
    text-decoration: none;
  }

  .brand-mark {
    display: grid;
    width: 32px;
    height: 32px;
    place-items: center;
    border-radius: 10px;
    background: var(--ads-color-primary);
    color: var(--ads-color-text-inverse);
    font-size: 17px;
    font-weight: 750;
  }

  .brand-name {
    font-size: 17px;
    font-weight: 680;
    letter-spacing: -0.035em;
  }

  .brand-version {
    padding: 3px 7px;
    border: 1px solid var(--ads-color-border-secondary);
    border-radius: 999px;
    color: var(--ads-color-text-secondary);
    font-size: 11px;
  }

  .main-nav {
    height: 100%;
    gap: 32px;
  }

  .main-nav a {
    position: relative;
    display: inline-flex;
    height: 100%;
    align-items: center;
    color: var(--ads-color-text-secondary);
    font-size: 14px;
    text-decoration: none;
    transition: color var(--ads-motion-duration) var(--ads-motion-ease);
  }

  .main-nav a:hover,
  .main-nav a.active {
    color: var(--ads-color-primary);
  }

  .main-nav a.active::after {
    position: absolute;
    right: 0;
    bottom: -1px;
    left: 0;
    height: 2px;
    background: var(--ads-color-primary);
    content: '';
  }

  .github-link {
    gap: 8px;
    color: var(--ads-color-text);
    font-size: 13px;
    font-weight: 600;
    text-decoration: none;
  }

  .github-link:hover {
    color: var(--ads-color-primary);
  }

  .github-link svg {
    width: 18px;
    height: 18px;
  }

  .theme-toggle {
    display: grid;
    width: 34px;
    height: 34px;
    flex: 0 0 auto;
    place-items: center;
    border: 1px solid var(--ads-color-border-secondary);
    border-radius: 9px;
    background: var(--ads-color-bg-container);
    color: var(--ads-color-text-secondary);
    cursor: pointer;
    transition:
      border-color var(--ads-motion-duration) var(--ads-motion-ease),
      color var(--ads-motion-duration) var(--ads-motion-ease),
      background var(--ads-motion-duration) var(--ads-motion-ease);
  }

  .theme-toggle:hover {
    border-color: var(--ads-color-primary-border);
    color: var(--ads-color-primary);
  }

  .theme-toggle:focus-visible {
    outline: var(--ads-focus-outline-width) solid var(--ads-color-focus-outline);
    outline-offset: var(--ads-focus-outline-offset);
  }

  .theme-toggle svg {
    width: 17px;
    height: 17px;
    fill: none;
    stroke: currentColor;
    stroke-linecap: round;
    stroke-linejoin: round;
    stroke-width: 1.7;
  }

  @media (max-width: 680px) {
    .header-inner {
      width: min(100% - 32px, 1200px);
      height: 62px;
    }

    .main-nav {
      gap: 16px;
    }

    .main-nav a {
      font-size: 12px;
    }

    .main-nav a:last-child,
    .github-link span,
    .brand-version {
      display: none;
    }
  }

  @media (max-width: 360px) {
    .github-link,
    .main-nav a:first-child {
      display: none;
    }

    .header-inner {
      width: min(100% - 24px, 1200px);
    }

    .brand {
      gap: 7px;
    }

    .brand-mark {
      width: 28px;
      height: 28px;
    }

    .brand-name {
      font-size: 15px;
    }

    .main-nav {
      gap: 0;
    }

    .main-nav a {
      font-size: 11px;
    }
  }
</style>
