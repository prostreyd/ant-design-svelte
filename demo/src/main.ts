import { mount } from 'svelte';
import '$lib/tokens.css';
import App from './App.svelte';
import './app.css';
import { initializeSiteTheme } from './theme';

initializeSiteTheme();

const target = document.getElementById('app');

if (!target) {
  throw new Error('Root element #app not found');
}

const app = mount(App, { target });

export default app;
