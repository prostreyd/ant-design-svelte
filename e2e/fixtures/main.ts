import '$lib/tokens.css';
// The contrast tests need the accessible colors: the default light tokens are Ant Design's own and do not
// reach WCAG AA for text (see tokens-accessible.css).
import '$lib/tokens-accessible.css';
import { mount } from 'svelte';
import App from './App.svelte';
import PopupLab from './PopupLab.svelte';
import RadioLab from './RadioLab.svelte';
import SelectLab from './SelectLab.svelte';
import TooltipLab from './TooltipLab.svelte';

const target = document.getElementById('app');
if (!target) {
  throw new Error('Root element #app not found');
}

// `/#popup` opens the lab of the popup primitive, `/#select` the one of the Select, `/#tooltip` the one of the
// Tooltip and `/#radio` the one of the Radio; every other URL is the component page.
const pages: Record<string, typeof App> = { '#popup': PopupLab, '#select': SelectLab, '#tooltip': TooltipLab, '#radio': RadioLab };
mount(pages[location.hash] ?? App, { target });
