import '$lib/tokens.css';
// The contrast tests need the accessible colors: the default light tokens are Ant Design's own and do not
// reach WCAG AA for text (see tokens-accessible.css).
import '$lib/tokens-accessible.css';
import { mount } from 'svelte';
import App from './App.svelte';
import GridLab from './GridLab.svelte';
import MessageLab from './MessageLab.svelte';
import OverlayLab from './OverlayLab.svelte';
import PopupLab from './PopupLab.svelte';
import RadioLab from './RadioLab.svelte';
import SelectLab from './SelectLab.svelte';
import TooltipLab from './TooltipLab.svelte';

const target = document.getElementById('app');
if (!target) {
  throw new Error('Root element #app not found');
}

// `/#popup` opens the lab of the popup primitive, `/#select` the one of the Select, `/#tooltip` the one of the
// Tooltip, `/#radio` the one of the Radio, `/#grid` the one of the Row and Col and `/#message` the one of the Message and `/#overlay` the one of the overlay primitives; every other URL is the component page.
const pages: Record<string, typeof App> = { '#popup': PopupLab, '#select': SelectLab, '#tooltip': TooltipLab, '#radio': RadioLab, '#grid': GridLab, '#message': MessageLab, '#overlay': OverlayLab };
mount(pages[location.hash] ?? App, { target });
