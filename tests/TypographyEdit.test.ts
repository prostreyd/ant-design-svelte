import { fireEvent, render, screen } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import TypographyParagraph from '../src/lib/Typography/TypographyParagraph.svelte';
import TypographySnippetsHarness from './fixtures/TypographySnippetsHarness.svelte';
import TypographyHarness from './fixtures/TypographyHarness.svelte';

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

const raw = (html: string) => createRawSnippet(() => ({ render: () => html }));
const text = (value: string) => raw(`<span>${value}</span>`);
const button = (name: string) => screen.getByRole('button', { name });
const area = () => screen.getByRole('textbox') as HTMLTextAreaElement;
const part = () => document.querySelector('.ads-typography') as HTMLElement;

/** Opens the field with the pencil and waits until it has the focus. */
async function open(): Promise<HTMLTextAreaElement> {
  await fireEvent.click(button('Edit'));
  const field = area();
  await vi.waitFor(() => expect(field).toHaveFocus());
  return field;
}
const type = (field: HTMLTextAreaElement, value: string) => fireEvent.input(field, { target: { value } });

describe('Typography: edit start (TYP-17, TYP-18)', () => {
  it('TYP-17: editable adds a button named Edit with the pencil, and no field yet', () => {
    render(TypographyParagraph, { props: { editable: true, content: 'Hello' } });
    expect(button('Edit')).toHaveAttribute('type', 'button');
    expect(screen.queryByRole('textbox')).toBeNull();
  });

  it('TYP-17: triggerType without icon removes the pencil; with text a click on the text starts the editing', async () => {
    render(TypographyParagraph, { props: { editable: { triggerType: ['text'] }, content: 'Hello' } });
    expect(screen.queryByRole('button')).toBeNull();
    await fireEvent.click(document.querySelector('.ads-typography-content') as HTMLElement);
    expect(area()).toHaveValue('Hello');
  });

  it('TYP-17: with both triggers the pencil stays, a click on the text starts, and onstart is called once per start', async () => {
    const onstart = vi.fn();
    render(TypographyParagraph, { props: { editable: { triggerType: ['icon', 'text'], onstart }, content: 'Hello' } });
    await fireEvent.click(button('Edit'));
    expect(onstart).toHaveBeenCalledOnce();
  });

  it('TYP-17: a click on a link inside the text, or on a selected text, does not start the editing', async () => {
    render(TypographyParagraph, {
      props: { editable: { triggerType: ['text'] }, children: raw('<span>Go <a href="/x" id="inner">there</a></span>') }
    });
    await fireEvent.click(document.getElementById('inner') as HTMLElement);
    expect(screen.queryByRole('textbox')).toBeNull();
    vi.spyOn(window, 'getSelection').mockReturnValue({ toString: () => 'there' } as Selection);
    await fireEvent.click(document.querySelector('.ads-typography-content') as HTMLElement);
    expect(screen.queryByRole('textbox')).toBeNull();
  });

  it('TYP-18: a click on an action button never starts the editing through the text', async () => {
    const onstart = vi.fn();
    Object.defineProperty(navigator, 'clipboard', { value: { writeText: vi.fn().mockResolvedValue(undefined) }, configurable: true });
    Object.defineProperty(window, 'isSecureContext', { value: true, configurable: true });
    render(TypographyParagraph, { props: { editable: { triggerType: ['text'], onstart }, copyable: true, content: 'Hello' } });
    await fireEvent.click(button('Copy'));
    expect(onstart).not.toHaveBeenCalled();
    expect(screen.queryByRole('textbox')).toBeNull();
    Reflect.deleteProperty(navigator, 'clipboard');
  });

  it('TYP-18: the starting text is editable.text, else content, else the rendered child', async () => {
    const a = render(TypographyParagraph, { props: { editable: { text: 'Given' }, content: 'Content' } });
    expect((await open()).value).toBe('Given');
    a.unmount();
    const b = render(TypographyParagraph, { props: { editable: true, content: 'Content' } });
    expect((await open()).value).toBe('Content');
    b.unmount();
    render(TypographyParagraph, { props: { editable: true, children: text('Child text') } });
    expect((await open()).value).toBe('Child text');
  });

  it('TYP-18: the field is focused with the caret at the end, and onstart is called once', async () => {
    const onstart = vi.fn();
    render(TypographyParagraph, { props: { editable: { onstart }, content: 'Hello' } });
    const field = await open();
    expect(field.selectionStart).toBe(5);
    expect(field.selectionEnd).toBe(5);
    expect(onstart).toHaveBeenCalledOnce();
  });

  it('TYP-18: the field replaces the text and the buttons, and carries maxlength and autoSize', async () => {
    render(TypographyParagraph, { props: { editable: { maxLength: 7 }, copyable: true, content: 'Hello' } });
    const field = await open();
    expect(field).toHaveAttribute('maxlength', '7');
    expect(part().querySelector('.ads-typography-content')).toBeNull();
    expect(screen.queryByRole('button')).toBeNull();
    expect(field).toHaveClass('ads-input-textarea-auto');
  });

  it('TYP-18: autoSize false turns the auto-sizing off', async () => {
    render(TypographyParagraph, { props: { editable: { autoSize: false }, content: 'Hello' } });
    expect(await open()).not.toHaveClass('ads-input-textarea-auto');
  });

  it.each([
    ['by default', undefined, 'Edit', 'Edit'],
    ['with a tip of its own', 'Rename', 'Rename', 'Rename'],
    ['with the tip off', false as const, 'Edit', 'Edit']
  ])('TYP-25: the field is named like the edit button %s, and the enter mark is hidden', async (_, tooltip, trigger, name) => {
    render(TypographyParagraph, { props: { editable: { tooltip }, content: 'x' } });
    await fireEvent.click(button(trigger));
    expect(area()).toHaveAccessibleName(name);
    expect(document.querySelector('.ads-typography-enter')).toHaveAttribute('aria-hidden', 'true');
  });

  it('TYP-18: with no text at all the field opens empty', async () => {
    render(TypographyParagraph, { props: { editable: true } });
    expect((await open()).value).toBe('');
  });
});

describe('Typography: edit end (TYP-19 to TYP-22)', () => {
  it('TYP-19: Enter keeps the text: the field closes, onchange(text) then onend', async () => {
    const calls: string[] = [];
    render(TypographyHarness, {
      props: { asContent: true, text: 'Hello', props: { editable: { onchange: (t: string) => calls.push(`change:${t}`), onend: () => calls.push('end') } } }
    });
    const field = await open();
    await type(field, 'Hello!');
    await fireEvent.keyDown(field, { key: 'Enter' });
    expect(screen.queryByRole('textbox')).toBeNull();
    expect(calls).toEqual(['change:Hello!', 'end']);
    expect(part()).toHaveTextContent('Hello!');
  });

  it('TYP-19: an unchanged text calls onend only', async () => {
    const onchange = vi.fn();
    const onend = vi.fn();
    render(TypographyParagraph, { props: { editable: { onchange, onend }, content: 'Hello' } });
    await fireEvent.keyDown(await open(), { key: 'Enter' });
    expect(onchange).not.toHaveBeenCalled();
    expect(onend).toHaveBeenCalledOnce();
  });

  it('TYP-19: Enter during an IME composition does nothing', async () => {
    const onend = vi.fn();
    render(TypographyParagraph, { props: { editable: { onend }, content: 'Hello' } });
    const field = await open();
    await fireEvent.keyDown(field, { key: 'Enter', isComposing: true });
    await fireEvent.keyDown(field, { key: 'Enter', keyCode: 229 });
    expect(area()).toBeInTheDocument();
    expect(onend).not.toHaveBeenCalled();
  });

  it('TYP-20: Shift, Ctrl, Alt and Meta with Enter insert nothing and end nothing', async () => {
    const onend = vi.fn();
    render(TypographyParagraph, { props: { editable: { onend }, content: 'Hello' } });
    const field = await open();
    for (const modifier of ['shiftKey', 'ctrlKey', 'altKey', 'metaKey']) {
      const event = new KeyboardEvent('keydown', { key: 'Enter', [modifier]: true, bubbles: true, cancelable: true });
      field.dispatchEvent(event);
      expect(event.defaultPrevented).toBe(true);
    }
    expect(area()).toBeInTheDocument();
    expect(onend).not.toHaveBeenCalled();
  });

  it('TYP-20: line breaks that are pasted or typed in are dropped: the text is one line', async () => {
    const onchange = vi.fn();
    render(TypographyParagraph, { props: { editable: { onchange }, content: 'Hello' } });
    const field = await open();
    await type(field, 'two\r\nlines\nhere');
    expect(field.value).toBe('twolineshere');
    await fireEvent.keyDown(field, { key: 'Enter' });
    expect(onchange).toHaveBeenCalledWith('twolineshere');
  });

  it('TYP-21: Escape cancels: the text is discarded, oncancel is called, onchange and onend are not, nothing above hears it', async () => {
    const oncancel = vi.fn();
    const onchange = vi.fn();
    const onend = vi.fn();
    const above = vi.fn();
    document.addEventListener('keydown', above);
    render(TypographyParagraph, { props: { editable: { oncancel, onchange, onend }, content: 'Hello' } });
    const field = await open();
    await type(field, 'Changed');
    await fireEvent.keyDown(field, { key: 'Escape' });
    expect(screen.queryByRole('textbox')).toBeNull();
    expect(part()).toHaveTextContent('Hello');
    expect(oncancel).toHaveBeenCalledOnce();
    expect(onchange).not.toHaveBeenCalled();
    expect(onend).not.toHaveBeenCalled();
    expect(above).not.toHaveBeenCalled();
    document.removeEventListener('keydown', above);
  });

  it('TYP-21: Escape during a composition is left to the composition', async () => {
    const oncancel = vi.fn();
    render(TypographyParagraph, { props: { editable: { oncancel }, content: 'Hello' } });
    const field = await open();
    await fireEvent.keyDown(field, { key: 'Escape', isComposing: true });
    expect(area()).toBeInTheDocument();
    expect(oncancel).not.toHaveBeenCalled();
  });

  it('TYP-22: blur keeps the text like Enter, and focus stays where the user put it', async () => {
    const onchange = vi.fn();
    const onend = vi.fn();
    render(TypographyParagraph, { props: { editable: { onchange, onend }, content: 'Hello' } });
    const other = document.createElement('button');
    document.body.appendChild(other);
    const field = await open();
    await type(field, 'Hello!');
    other.focus();
    await vi.waitFor(() => expect(screen.queryByRole('textbox')).toBeNull());
    expect(onchange).toHaveBeenCalledWith('Hello!');
    expect(onend).toHaveBeenCalledOnce();
    expect(other).toHaveFocus();
    other.remove();
  });

  it('TYP-22: after Enter, Escape and Tab-out the focus returns to the edit button', async () => {
    render(TypographyParagraph, { props: { editable: true, content: 'Hello' } });
    await fireEvent.keyDown(await open(), { key: 'Enter' });
    await vi.waitFor(() => expect(button('Edit')).toHaveFocus());
    await fireEvent.keyDown(await open(), { key: 'Escape' });
    await vi.waitFor(() => expect(button('Edit')).toHaveFocus());
    const field = await open();
    await fireEvent.keyDown(field, { key: 'Tab' });
    await fireEvent.blur(field);
    await vi.waitFor(() => expect(button('Edit')).toHaveFocus());
    expect(screen.queryByRole('textbox')).toBeNull();
  });

  it('TYP-22: an empty text can be kept, and it is passed on', async () => {
    const onchange = vi.fn();
    render(TypographyParagraph, { props: { editable: { onchange }, content: 'Hello' } });
    const field = await open();
    await type(field, '');
    await fireEvent.keyDown(field, { key: 'Enter' });
    expect(onchange).toHaveBeenCalledWith('');
  });

  it('TYP-19: ending twice in a row calls the callbacks once (a blur that follows Enter)', async () => {
    const onend = vi.fn();
    render(TypographyParagraph, { props: { editable: { onend }, content: 'Hello' } });
    const field = await open();
    await fireEvent.keyDown(field, { key: 'Enter' });
    await fireEvent.blur(field);
    expect(onend).toHaveBeenCalledOnce();
  });
});

describe('Typography: edit and the bound values (TYP-23, TYP-24, TYP-26)', () => {
  it('TYP-23: without bind:content the part keeps its children and only reports the new text', async () => {
    const onchange = vi.fn();
    render(TypographyParagraph, { props: { editable: { onchange }, children: text('Hello') } });
    const field = await open();
    await type(field, 'Hello!');
    await fireEvent.keyDown(field, { key: 'Enter' });
    expect(onchange).toHaveBeenCalledWith('Hello!');
    expect(part()).toHaveTextContent('Hello');
    expect(part()).not.toHaveTextContent('Hello!');
  });

  it('TYP-23: with bind:content the new text is written back to the parent', async () => {
    render(TypographyHarness, { props: { asContent: true, text: 'Hello', props: { editable: true } } });
    const field = await open();
    await type(field, 'Bye');
    await fireEvent.keyDown(field, { key: 'Enter' });
    expect(screen.getByTestId('content')).toHaveTextContent('Bye');
  });

  it('TYP-24: bind:editing: the parent opens and closes the field, and the user closing it is reported back', async () => {
    const onstart = vi.fn();
    const onend = vi.fn();
    render(TypographyHarness, { props: { asContent: true, text: 'Hello', props: { editable: { onstart, onend } } } });
    await fireEvent.click(screen.getByTestId('toggle-editing'));
    const field = area();
    await vi.waitFor(() => expect(field).toHaveFocus());
    expect(field.value).toBe('Hello');
    expect(onstart).not.toHaveBeenCalled();
    await fireEvent.keyDown(field, { key: 'Enter' });
    expect(screen.getByTestId('editing')).toHaveTextContent('false');
    expect(onend).toHaveBeenCalledOnce();
    await fireEvent.click(screen.getByTestId('toggle-editing'));
    await fireEvent.click(screen.getByTestId('toggle-editing'));
    expect(screen.queryByRole('textbox')).toBeNull();
    expect(onstart).not.toHaveBeenCalled();
  });

  it('TYP-24: editing true from the start opens the field with the text', async () => {
    render(TypographyHarness, { props: { asContent: true, text: 'Hello', props: { editable: true, editing: true } } });
    expect(area().value).toBe('Hello');
  });

  it('TYP-24: editing true from the start reads the text of a child too', () => {
    render(TypographyHarness, { props: { text: 'From a child', props: { editable: true, editing: true } } });
    expect(area().value).toBe('From a child');
  });

  it('TYP-24: editing true from the start with no text at all opens an empty field', () => {
    render(TypographyParagraph, { props: { editable: true, editing: true } });
    expect(area().value).toBe('');
  });

  it('TYP-17: a text trigger on a link starts the editing from a click on the link text', async () => {
    render(TypographyHarness, { props: { kind: 'link', text: 'Go', props: { href: '#x', editable: { triggerType: ['text'] } } } });
    await fireEvent.click(document.querySelector('.ads-typography-content') as HTMLElement);
    expect(area()).toBeInTheDocument();
  });

  it('TYP-19: other keys do nothing in the field', async () => {
    const onend = vi.fn();
    render(TypographyParagraph, { props: { editable: { onend }, content: 'Hello' } });
    await fireEvent.keyDown(await open(), { key: 'a' });
    expect(area()).toBeInTheDocument();
    expect(onend).not.toHaveBeenCalled();
  });

  it('TYP-24: a child text is read when the parent opens the field', async () => {
    render(TypographyHarness, { props: { text: 'From a child', props: { editable: true } } });
    await fireEvent.click(screen.getByTestId('toggle-editing'));
    expect(area().value).toBe('From a child');
  });

  it('TYP-26: an ellipsis and editable part shows the whole text in the field', async () => {
    const long = 'word '.repeat(100).trim();
    render(TypographyParagraph, { props: { editable: true, ellipsis: { rows: 2, expandable: true }, content: long } });
    expect((await open()).value).toBe(long);
  });
});

describe('Typography: edit options', () => {
  it('editable.tooltip: a string is the name, false keeps the name Edit', () => {
    const a = render(TypographyParagraph, { props: { editable: { tooltip: 'Change it' }, content: 'x' } });
    expect(button('Change it')).toBeInTheDocument();
    a.unmount();
    render(TypographyParagraph, { props: { editable: { tooltip: false }, content: 'x' } });
    expect(button('Edit')).toBeInTheDocument();
  });

  it('editable.tabIndex goes to the pencil', () => {
    render(TypographyParagraph, { props: { editable: { tabIndex: -1 }, content: 'x' } });
    expect(button('Edit')).toHaveAttribute('tabindex', '-1');
  });

  it('editable.icon replaces the pencil', () => {
    render(TypographySnippetsHarness, { props: { which: 'editIcon' } });
    expect(button('Edit').querySelector('[data-edit]')).not.toBeNull();
  });

  it('editable.enterIcon: the default mark, a snippet, and null removes it', async () => {
    const a = render(TypographyParagraph, { props: { editable: true, content: 'x' } });
    await open();
    expect(document.querySelector('.ads-typography-enter svg')).not.toBeNull();
    a.unmount();
    const b = render(TypographySnippetsHarness, { props: { which: 'enterIcon' } });
    await open();
    expect(document.querySelector('.ads-typography-enter [data-enter]')).not.toBeNull();
    b.unmount();
    render(TypographyParagraph, { props: { editable: { enterIcon: null }, content: 'x' } });
    await open();
    expect(document.querySelector('.ads-typography-enter')).toBeNull();
  });

  it('a title takes the font size of its text in the field', async () => {
    render(TypographyParagraph, { props: { editable: true, content: 'x', styles: { textarea: { color: 'red' } } } });
    const field = await open();
    expect(field.style.fontSize).toBe('inherit');
    expect(field.style.lineHeight).toBe('inherit');
    expect(field.style.color).toBe('red');
  });
});
