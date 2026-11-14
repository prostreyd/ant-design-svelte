import '$lib/tokens.css';
// The contrast tests need the accessible colors: the default light tokens are Ant Design's own and do not
// reach WCAG AA for text (see tokens-accessible.css).
import '$lib/tokens-accessible.css';
import { mount } from 'svelte';
import App from './App.svelte';
import PopupLab from './PopupLab.svelte';
import SelectLab from './SelectLab.svelte';
import TooltipLab from './TooltipLab.svelte';

const target = document.getElementById('app');
if (!target) {
  throw new Error('Root element #app not found');
}

// `/#popup` opens the lab of the popup primitive, `/#select` the one of the Select and `/#tooltip` the one of the
// Tooltip; every other URL is the component page.
const pages: Record<string, typeof App> = { '#popup': PopupLab, '#select': SelectLab, '#tooltip': TooltipLab };
mount(pages[location.hash] ?? App, { target });
