<script lang="ts">
  import { onMount, untrack, type Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import Popup from '../internal/popup/Popup.svelte';
  import { resolveOption } from '../internal/options.js';
  import { classList, styleText } from '../internal/semantic.js';
  import { setSelectContext, type Registration } from './context.js';
  import {
    SELECT_MODES,
    SELECT_PLACEMENTS,
    SELECT_SIZES,
    SELECT_VARIANTS,
    clipTagText,
    defaultResultsText,
    entriesByValue,
    filterNodes,
    flattenNodes,
    hasSeparator,
    indexEntries,
    moveActive,
    nodesFromRegistrations,
    normalizeOptions,
    normalizeSize,
    orphanEntry,
    resolveFieldNames,
    resolveStatus,
    seekEnabled,
    splitTokens,
    typeAheadIndex,
    type SelectEntry
  } from './options.js';
  import SelectIcon from './SelectIcon.svelte';
  import type { SelectFocusOptions, SelectOptionItem, SelectProps, SelectValue } from './types.js';

  let {
    value = $bindable(undefined),
    mode = 'default',
    options = [],
    fieldNames = undefined,
    placeholder = undefined,
    disabled = false,
    loading = false,
    size = 'medium',
    variant = 'outlined',
    status = undefined,
    prefix = undefined,
    suffix = undefined,
    allowClear = false,
    removeIcon = undefined,
    menuItemSelectedIcon = undefined,
    loadingIcon = undefined,
    showSearch = undefined,
    searchValue = $bindable(''),
    onsearch,
    filterOption = true,
    filterSort = undefined,
    optionFilterProp = 'label',
    autoClearSearchValue = true,
    maxTagCount = undefined,
    maxTagPlaceholder = undefined,
    maxTagTextLength = undefined,
    maxCount = undefined,
    tokenSeparators = [],
    tagRender = undefined,
    optionRender = undefined,
    labelRender = undefined,
    notFoundContent = undefined,
    resultsText = undefined,
    open = $bindable(false),
    onopenchange,
    placement = 'bottomLeft',
    popupMatchSelectWidth = true,
    listHeight = 256,
    container = undefined,
    popupRender = undefined,
    defaultActiveFirstOption = true,
    onchange,
    onselect,
    ondeselect,
    onclear,
    onfocus,
    onblur,
    onpopupscroll,
    oninputkeydown,
    onkeydown,
    oninput,
    autocomplete = 'new-password',
    children = undefined,
    classNames,
    styles,
    class: customClass,
    style: customStyle,
    id = undefined,
    tabindex = undefined,
    'aria-label': ariaLabel = undefined,
    'aria-labelledby': ariaLabelledby = undefined,
    'aria-describedby': ariaDescribedby = undefined,
    'aria-invalid': ariaInvalid = undefined,
    ...rest
  }: SelectProps = $props();

  const uid = $props.id();
  const comboboxId = $derived(id ?? `${uid}-combobox`);
  const listId = `${uid}-listbox`;
  const valueId = `${uid}-value`;
  const optionId = (index: number) => `${uid}-option-${index}`;

  // Every option is validated on each render: a value outside the contract throws while developing and falls
  // back to the default in a production build.
  const resolved = $derived({
    mode: resolveOption('Select', 'mode', mode, SELECT_MODES, 'default'),
    size: normalizeSize(resolveOption('Select', 'size', size, SELECT_SIZES, 'medium')),
    variant: resolveOption('Select', 'variant', variant, SELECT_VARIANTS, 'outlined'),
    status: resolveStatus(status),
    placement: resolveOption('Select', 'placement', placement, SELECT_PLACEMENTS, 'bottomLeft')
  });
  const multi = $derived(resolved.mode !== 'default');
  const tags = $derived(resolved.mode === 'tags');
  const searchable = $derived(showSearch ?? multi);
  const invalid = $derived(resolved.status === 'error');

  // ---- The options -----------------------------------------------------------------------------------------

  // Options written as markup register while they are created, in the order they were created; the order of the
  // markup is read from the invisible marker each one leaves (and again whenever the markup changes).
  //
  // The list is a plain array and only a counter is state: a registration and a removal can happen in the same
  // update (a keyed block that replaces its items), and a read of state inside the teardown of a removed item does
  // not see what the creation of a new one wrote a moment before, so a list kept in state loses the new item.
  const registered: Registration[] = [];
  let registryChanges = 0;
  let registryVersion = $state(0);
  let registry: HTMLElement | undefined = $state();

  const registryChanged = () => untrack(() => (registryVersion = ++registryChanges));

  setSelectContext({
    register(registration) {
      registered.push(registration);
      registryChanged();
      return () => {
        registered.splice(registered.indexOf(registration), 1);
        registryChanged();
      };
    }
  });

  // An option inserted in the middle of the markup mounts last, and a keyed block can move one: both change the
  // children of the registry element, which is when the order is read again.
  $effect(() => {
    const element = registry;
    if (!element) return;
    const observer = new MutationObserver(registryChanged);
    observer.observe(element, { childList: true, subtree: true });
    return () => observer.disconnect();
  });

  const names = $derived(resolveFieldNames(fieldNames));
  const hasOptionsProp = $derived(options.length > 0);
  const nodes = $derived.by(() => {
    if (hasOptionsProp) return normalizeOptions(options, names);
    void registryVersion;
    return nodesFromRegistrations(registered);
  });
  const entries = $derived(flattenNodes(nodes));
  const entryByValue = $derived(entriesByValue(entries));
  const dataOf = (item: SelectValue): SelectOptionItem => (entryByValue.get(item) ?? orphanEntry(item)).data;

  // ---- The value -------------------------------------------------------------------------------------------

  const selected = $derived.by<SelectValue[]>(() => {
    if (value === undefined || value === null) return [];
    if (Array.isArray(value)) return multi ? value : value.slice(0, 1);
    return [value];
  });
  const selectedEntries = $derived(selected.map((item) => entryByValue.get(item) ?? orphanEntry(item)));
  const maxReached = $derived(multi && maxCount !== undefined && selected.length >= maxCount);
  const isDisabledEntry = (entry: SelectEntry): boolean =>
    entry.disabled || (maxReached && !selected.includes(entry.value));

  // ---- Search and the visible list -------------------------------------------------------------------------

  const searchText = $derived(searchable ? searchValue : '');
  const visibleNodes = $derived(
    filterNodes(nodes, { text: searchText, filterOption, filterProp: optionFilterProp, filterSort })
  );
  const visibleEntries = $derived(flattenNodes(visibleNodes));
  const entryIndex = $derived(indexEntries(visibleEntries));

  // ---- The highlighted option ------------------------------------------------------------------------------

  // The value of the highlighted option (DOM focus stays on the field; `aria-activedescendant` points at it).
  let activeValue = $state<SelectValue | undefined>(undefined);
  // Whether the highlight was moved by the user (arrow keys, pointer) since the search text last changed.
  let navigated = false;
  const popupOpen = $derived(open && !disabled);
  const activeIndex = $derived(
    activeValue === undefined ? -1 : visibleEntries.findIndex((entry) => entry.value === activeValue)
  );

  type ActiveTarget = 'default' | 'selected' | 'first' | 'last';

  function entryFor(target: ActiveTarget): SelectEntry | undefined {
    const first = () => visibleEntries[seekEnabled(visibleEntries, 0, 1, isDisabledEntry)];
    if (target === 'first') return first();
    if (target === 'last') {
      return visibleEntries[seekEnabled(visibleEntries, visibleEntries.length - 1, -1, isDisabledEntry)];
    }
    // The selected option of a single field is highlighted when the list opens, as long as the list is not
    // filtered; the first option is the fallback (always for `selected`, per `defaultActiveFirstOption` otherwise).
    if (!multi && searchText === '') {
      const current = visibleEntries.find((entry) => selected[0] === entry.value && !isDisabledEntry(entry));
      if (current) return current;
    }
    return target === 'selected' || defaultActiveFirstOption ? first() : undefined;
  }

  function setActive(entry: SelectEntry | undefined): void {
    activeValue = entry?.value;
  }

  function moveHighlight(delta: number): void {
    const index = moveActive(visibleEntries, activeIndex, delta, isDisabledEntry);
    if (index === -1) return;
    navigated = true;
    activeValue = visibleEntries[index].value;
  }

  // The highlight follows the list: while the list is open one option is highlighted whenever there is one to
  // highlight, and it is forgotten when the list closes. A list that changed keeps the highlighted option when
  // it is still there.
  $effect(() => {
    if (!popupOpen) {
      activeValue = undefined;
      return;
    }
    if (activeIndex !== -1) return;
    // The option the user moved to is gone (the options changed): the text decides again.
    navigated = false;
    const entry = untrack(() => entryFor('default'));
    if (entry) activeValue = entry.value;
  });

  let listElement: HTMLElement | null = $state(null);

  /** Scrolls the list so that the highlighted option is in view (a browser does not do this for `aria-activedescendant`). */
  function scrollToActive(): void {
    const list = listElement;
    const index = untrack(() => activeIndex);
    if (!list || index < 0) return;
    if (index === 0) {
      list.scrollTop = 0;
      return;
    }
    // The option is in the list: both are drawn from the same `visibleEntries`, in the same update.
    const element = list.querySelector(`[id="${optionId(index)}"]`) as HTMLElement;
    const top = element.offsetTop;
    const bottom = top + element.offsetHeight;
    if (top < list.scrollTop) list.scrollTop = top;
    else if (bottom > list.scrollTop + list.clientHeight) list.scrollTop = bottom - list.clientHeight;
  }

  $effect(() => {
    void activeIndex;
    void popupOpen;
    scrollToActive();
  });

  // The list keeps the wheel to itself (`overscroll-behavior: contain`) only while it scrolls. A list that does not
  // scroll would otherwise hold the wheel for nothing, and the page would not move under the cursor. Measured after
  // each change of what the list shows, and once more in the next frame, when the layout has settled. A list that is
  // wrongly taken for one that does not scroll lets the wheel through at its end, which does no harm.
  let listScrolls = $state(false);
  $effect(() => {
    void visibleNodes;
    void popupOpen;
    void listHeight;
    const list = listElement;
    if (!list) {
      listScrolls = false;
      return;
    }
    const measure = () => (listScrolls = list.scrollHeight > list.clientHeight);
    measure();
    const frame = requestAnimationFrame(measure);
    return () => cancelAnimationFrame(frame);
  });

  // ---- Opening and closing ---------------------------------------------------------------------------------

  /** Changes the open state on behalf of the user. The parent may refuse (a function binding). */
  function setOpen(next: boolean): void {
    if (open === next) return;
    open = next;
    onopenchange?.(next);
  }

  // Called by the handlers of a field that is not disabled (a disabled field handles nothing).
  function openList(target: ActiveTarget | 'keep' = 'default'): void {
    setOpen(true);
    navigated = false;
    if (target !== 'keep') setActive(entryFor(target));
  }

  // The search text is cleared when the list closes, whoever closed it (the user, a press outside, the parent).
  $effect(() => {
    if (popupOpen || searchValue === '') return;
    untrack(() => updateSearch(''));
  });

  function updateSearch(text: string): void {
    searchValue = text;
    onsearch?.(text);
  }

  // ---- Changing the value ----------------------------------------------------------------------------------

  function addValue(item: SelectValue): void {
    if (maxReached) return;
    const next = [...selected, item];
    value = next;
    onselect?.(item, dataOf(item));
    onchange?.(next, next.map(dataOf));
  }

  function removeValue(item: SelectValue): void {
    const next = selected.filter((other) => other !== item);
    value = next;
    ondeselect?.(item, dataOf(item));
    onchange?.(next, next.map(dataOf));
  }

  function selectEntry(entry: SelectEntry): void {
    if (isDisabledEntry(entry)) return;
    if (!multi) {
      if (selected[0] !== entry.value) {
        value = entry.value;
        onselect?.(entry.value, entry.data);
        onchange?.(entry.value, entry.data);
      }
      setOpen(false);
      return;
    }
    if (selected.includes(entry.value)) removeValue(entry.value);
    else addValue(entry.value);
    if (autoClearSearchValue && searchValue !== '') updateSearch('');
  }

  /** `tags`: the typed text becomes a value (an existing option when its text or value is the same). */
  function addText(text: string): void {
    const typed = text.trim();
    updateSearch('');
    const match = entries.find((entry) => entry.text === typed || String(entry.value) === typed);
    if (match && isDisabledEntry(match)) return;
    const item = match ? match.value : typed;
    if (!selected.includes(item)) addValue(item);
  }

  /** `multiple` and `tags`: the text had a separator in it; every part becomes a value (or is dropped). */
  function commitTokens(text: string): void {
    const next = [...selected];
    const added: SelectValue[] = [];
    for (const part of splitTokens(text, tokenSeparators)) {
      if (maxCount !== undefined && next.length >= maxCount) break;
      const lower = part.toLowerCase();
      const match = entries.find((entry) => entry.text.toLowerCase() === lower || String(entry.value) === part);
      const item = match ? match.value : tags ? part : undefined;
      if (item === undefined || (match && match.disabled) || next.includes(item)) continue;
      next.push(item);
      added.push(item);
    }
    updateSearch('');
    if (added.length === 0) return;
    value = next;
    for (const item of added) onselect?.(item, dataOf(item));
    onchange?.(next, next.map(dataOf));
  }

  function clear(): void {
    const next = multi ? [] : undefined;
    value = next;
    onchange?.(next, next);
    if (searchValue !== '') updateSearch('');
    combobox?.focus();
    onclear?.();
  }

  // ---- The focused element ---------------------------------------------------------------------------------

  let root: HTMLElement | undefined = $state();
  let combobox: HTMLElement | undefined = $state();
  let panel: HTMLElement | null = $state(null);
  // Whether an IME composition is open in the search input.
  let composing = $state(false);
  let focused = false;

  function handleFocusIn(event: FocusEvent): void {
    findLabels();
    if (focused) return;
    focused = true;
    onfocus?.(event);
  }

  function handleFocusOut(event: FocusEvent): void {
    const next = event.relatedTarget as Node | null;
    // Focus that goes to the clear button or into the panel (an input in `popupRender`) has not left the field.
    if (next && (root?.contains(next) || panel?.contains(next))) return;
    focused = false;
    setOpen(false);
    onblur?.(event);
  }

  function handleRootMouseDown(event: MouseEvent): void {
    if (disabled || event.button !== 0) return;
    const target = event.target as Element;
    // The buttons of the field (clear, remove) act on click and do not take focus from the field.
    if (target.closest('button')) {
      event.preventDefault();
      return;
    }
    // A press on the text of a search field puts the caret there and only opens the list.
    if (searchable && target === combobox) {
      if (!popupOpen) openList();
      return;
    }
    event.preventDefault();
    combobox?.focus();
    if (popupOpen) setOpen(false);
    else openList();
  }

  // A `<div>` is not labelable, so a `<label for>` does not name it. The labels that point at the field are found
  // and the field refers to them by `aria-labelledby`; a click on one focuses the field.
  let labelIds = $state<string | undefined>(undefined);
  const labelClicks: HTMLElement[] = [];
  const focusFromLabel = () => combobox?.focus();

  function findLabels(): void {
    if (searchable || ariaLabel || ariaLabelledby || !id || !root) return;
    const found = [...root.ownerDocument.querySelectorAll('label')].filter((label) => label.htmlFor === id);
    found.forEach((label, index) => {
      if (!label.id) label.id = `${uid}-label-${index}`;
      if (!labelClicks.includes(label)) {
        label.addEventListener('click', focusFromLabel);
        labelClicks.push(label);
      }
    });
    labelIds = found.length > 0 ? found.map((label) => label.id).join(' ') : undefined;
  }

  onMount(() => {
    findLabels();
    return () => {
      for (const label of labelClicks) label.removeEventListener('click', focusFromLabel);
      labelClicks.length = 0;
    };
  });

  // ---- The keyboard ----------------------------------------------------------------------------------------

  let typed = '';
  let typedTimer: ReturnType<typeof setTimeout> | undefined;

  function typeAhead(character: string): void {
    typed += character;
    clearTimeout(typedTimer);
    typedTimer = setTimeout(() => (typed = ''), 500);
    if (!popupOpen) openList('keep');
    const index = typeAheadIndex(visibleEntries, activeIndex, typed, isDisabledEntry);
    if (index !== -1) {
      navigated = true;
      activeValue = visibleEntries[index].value;
    }
  }

  /** Enter or Space with the list open: select the highlighted option, or (`tags`) add the typed text. */
  function commitActive(): void {
    if (tags && searchValue.trim() !== '' && !navigated) {
      addText(searchValue);
      return;
    }
    const entry = visibleEntries[activeIndex];
    if (entry) selectEntry(entry);
  }

  function removeLast(): boolean {
    if (!multi || searchValue !== '') return false;
    const last = [...selectedEntries].reverse().find((entry) => !entry.disabled);
    if (!last) return false;
    removeValue(last.value);
    return true;
  }

  function handleKeydown(event: KeyboardEvent & { currentTarget: EventTarget & HTMLElement }): void {
    onkeydown?.(event);
    oninputkeydown?.(event);
    if (disabled || composing || event.isComposing || event.ctrlKey || event.metaKey) return;
    const key = event.key;
    const modified = event.altKey;

    switch (key) {
      case 'ArrowDown':
        event.preventDefault();
        if (!popupOpen) openList(modified ? 'keep' : 'selected');
        else moveHighlight(1);
        return;
      case 'ArrowUp':
        if (!popupOpen) {
          // Alt+Up on a closed field does nothing.
          if (!modified) {
            event.preventDefault();
            openList('last');
          }
        } else {
          event.preventDefault();
          if (modified) {
            const entry = visibleEntries[activeIndex];
            if (entry) selectEntry(entry);
            setOpen(false);
          } else moveHighlight(-1);
        }
        return;
      case 'Enter':
        if (!popupOpen) {
          if (searchable) return;
          event.preventDefault();
          openList();
          return;
        }
        event.preventDefault();
        commitActive();
        return;
      case ' ':
        // A space is a character while text is being typed: in a search field, or in the type-ahead.
        if (searchable) return;
        if (typed !== '') {
          event.preventDefault();
          typeAhead(' ');
          return;
        }
        event.preventDefault();
        if (!popupOpen) openList();
        else commitActive();
        return;
      case 'Home':
      case 'End': {
        // In a search field these keys move the caret.
        if (searchable) return;
        event.preventDefault();
        const target = key === 'Home' ? 'first' : 'last';
        if (!popupOpen) openList(target);
        else {
          navigated = true;
          setActive(entryFor(target));
        }
        return;
      }
      case 'PageDown':
      case 'PageUp':
        if (!popupOpen) return;
        event.preventDefault();
        moveHighlight(key === 'PageDown' ? 10 : -10);
        return;
      case 'Tab':
        // Tab only closes the list and leaves the value alone (decision 5).
        if (popupOpen) setOpen(false);
        return;
      case 'Backspace':
        if (removeLast()) event.preventDefault();
        return;
    }
    if (!searchable && key.length === 1 && !modified) {
      event.preventDefault();
      typeAhead(key);
    }
  }

  function handleInput(event: Event & { currentTarget: EventTarget & HTMLInputElement }): void {
    oninput?.(event);
    const input = event.currentTarget;
    const text = input.value;
    if (multi && hasSeparator(text, tokenSeparators)) {
      commitTokens(text);
      // The state may already hold what is left (an empty text), so the field is written back from it.
      input.value = searchValue;
      return;
    }
    updateSearch(text);
    navigated = false;
    setActive(entryFor('default'));
    if (!popupOpen) openList('keep');
  }

  // ---- The announcement of the number of matches --------------------------------------------------------

  // What a searchable field tells assistive technology while it is searched: the number of matches, or the
  // empty-result text. One line says both, because a text that appears together with the panel (the list opens
  // empty on the first key that matches nothing) is not announced by a live region of its own.
  let announcement = $state('');
  let emptyElement: HTMLElement | undefined = $state();
  const resultCount = $derived(visibleEntries.length);

  $effect(() => {
    const count = resultCount;
    if (!searchable || !popupOpen || searchValue === '' || composing) {
      announcement = '';
      return;
    }
    // After the list stopped changing, so a fast typist hears the last number only. The empty-result text is read
    // from its element (it can be a snippet); with no result that element is drawn in the same update.
    const timer = setTimeout(
      () =>
        (announcement =
          count === 0 ? emptyElement!.textContent!.trim() : (resultsText ?? defaultResultsText)(count)),
      300
    );
    return () => clearTimeout(timer);
  });

  // ---- What is drawn ---------------------------------------------------------------------------------------

  const selectedText = $derived(selectedEntries.map((entry) => entry.text).join(', '));
  const describedBy = $derived(
    searchable
      ? [ariaDescribedby, selected.length > 0 ? valueId : undefined].filter(Boolean).join(' ') || undefined
      : ariaDescribedby
  );

  const limit = $derived(maxTagCount === undefined ? Infinity : Math.max(0, maxTagCount));
  const shownEntries = $derived(selectedEntries.slice(0, limit));
  const restEntries = $derived(selectedEntries.slice(limit));

  const clearConfig = $derived(typeof allowClear === 'object' ? allowClear : undefined);
  const clearVisible = $derived(selected.length > 0 && !disabled);
  const showPlaceholder = $derived(selected.length === 0 && placeholder !== undefined);
  // The search icon takes the place of the arrow while a single field is searched.
  const arrowName = $derived(!multi && searchable && popupOpen ? 'search' : 'arrow');

  const rootClass = $derived(
    classList(
      'ads-select',
      `ads-select-${resolved.size}`,
      `ads-select-${resolved.variant}`,
      resolved.status && `ads-select-status-${resolved.status}`,
      multi ? 'ads-select-multiple' : 'ads-select-single',
      disabled && 'ads-select-disabled',
      popupOpen && 'ads-select-open',
      customClass,
      classNames?.root
    )
  );

  // `aria-labelledby` of the field: the consumer's, or the labels found for a field that is not searchable.
  const labelledBy = $derived(ariaLabelledby ?? (searchable ? undefined : labelIds));
  // The listbox is named like the field. For a native `<label for>` of the `<input>` it refers to the field itself.
  const listLabelledBy = $derived(ariaLabel ? undefined : (labelledBy ?? comboboxId));

  const comboboxAttrs = $derived<HTMLAttributes<HTMLElement>>({
    id: comboboxId,
    role: 'combobox',
    'aria-expanded': popupOpen ? 'true' : 'false',
    'aria-controls': popupOpen ? listId : undefined,
    'aria-activedescendant': popupOpen && activeIndex >= 0 ? optionId(activeIndex) : undefined,
    'aria-autocomplete': searchable ? 'list' : undefined,
    'aria-label': ariaLabel,
    'aria-labelledby': labelledBy,
    'aria-describedby': describedBy,
    'aria-invalid': invalid ? 'true' : ariaInvalid,
    'aria-busy': loading ? 'true' : undefined,
    class: classList('ads-select-input', classNames?.input),
    style: styleText(styles?.input),
    onkeydown: handleKeydown
  });

  /** Moves focus to the field. */
  export function focus(options?: SelectFocusOptions): void {
    combobox?.focus(options);
  }

  /** Removes focus from the field. */
  export function blur(): void {
    combobox?.blur();
  }
</script>

{#snippet content(node: string | Snippet)}
  {#if typeof node === 'string'}{node}{:else}{@render node()}{/if}
{/snippet}

{#snippet icon(custom: string | Snippet | undefined, name: 'arrow' | 'search' | 'clear' | 'check' | 'remove' | 'loading')}
  {#if custom === undefined}<SelectIcon {name} />{:else}{@render content(custom)}{/if}
{/snippet}

{#snippet itemContent(entry: SelectEntry)}
  {#if labelRender}
    {@render labelRender(entry.data)}
  {:else if typeof entry.label === 'function'}
    {@render entry.label()}
  {:else}
    {entry.text}
  {/if}
{/snippet}

{#snippet tag(entry: SelectEntry)}
  {@const closable = !disabled && !entry.disabled}
  {#if tagRender}
    <span class="ads-select-tag-slot"
      >{@render tagRender({
        value: entry.value,
        label: entry.label ?? entry.text,
        closable,
        onclose: () => removeValue(entry.value)
      })}</span
    >
  {:else}
    <span
      class={classList('ads-select-tag', !closable && 'ads-select-tag-disabled', classNames?.item)}
      style={styleText(styles?.item)}
    >
      <span class="ads-select-tag-text" title={entry.title}>
        {#if labelRender || typeof entry.label === 'function'}
          {@render itemContent(entry)}
        {:else}
          {clipTagText(entry.text, maxTagTextLength)}
        {/if}
      </span>
      {#if closable}
        <button
          type="button"
          class="ads-select-tag-remove"
          tabindex="-1"
          aria-label={`Remove ${entry.text}`}
          onclick={() => removeValue(entry.value)}
        >
          {@render icon(removeIcon, 'remove')}
        </button>
      {/if}
    </span>
  {/if}
{/snippet}

<!-- What the field shows: the tags or the selected item, and the placeholder. -->
{#snippet selection()}
  {#if multi}
    {#each shownEntries as entry, index (index)}
      {@render tag(entry)}
    {/each}
    {#if restEntries.length > 0}
      <span
        class={classList('ads-select-tag ads-select-tag-rest', classNames?.item)}
        style={styleText(styles?.item)}
      >
        <span class="ads-select-tag-text">
          {#if maxTagPlaceholder === undefined}
            {`+ ${restEntries.length} ...`}
          {:else if typeof maxTagPlaceholder === 'string'}
            {maxTagPlaceholder}
          {:else}
            {@render maxTagPlaceholder(restEntries.map((entry) => entry.data))}
          {/if}
        </span>
      </span>
    {/if}
  {:else if selectedEntries.length > 0}
    <span
      class={classList('ads-select-item', searchText !== '' && 'ads-select-item-hidden', classNames?.item)}
      style={styleText(styles?.item)}
      title={selectedEntries[0].title}>{@render itemContent(selectedEntries[0])}</span
    >
  {/if}
  {#if showPlaceholder}
    <span
      class={classList(
        'ads-select-placeholder',
        searchText !== '' && 'ads-select-placeholder-hidden',
        classNames?.placeholder
      )}
      style={styleText(styles?.placeholder)}>{@render content(placeholder!)}</span
    >
  {/if}
{/snippet}

{#snippet optionRow(entry: SelectEntry, index: number)}
  {@const isSelected = selected.includes(entry.value)}
  {@const isDisabled = isDisabledEntry(entry)}
  <!-- svelte-ignore a11y_click_events_have_key_events, a11y_interactive_supports_focus -->
  <div
    id={optionId(index)}
    role="option"
    aria-selected={isSelected}
    aria-disabled={isDisabled ? 'true' : undefined}
    title={entry.title}
    class={classList(
      'ads-select-option',
      index === activeIndex && 'ads-select-option-active',
      isSelected && 'ads-select-option-selected',
      isDisabled && 'ads-select-option-disabled',
      entry.class,
      classNames?.listItem
    )}
    style={styleText(styles?.listItem)}
    onclick={() => selectEntry(entry)}
    onmousemove={() => {
      if (activeValue === entry.value || isDisabled) return;
      navigated = true;
      activeValue = entry.value;
    }}
  >
    <span class="ads-select-option-content">
      {#if optionRender}
        {@render optionRender(entry.data, index)}
      {:else if entry.children}
        {@render entry.children()}
      {:else if typeof entry.label === 'function'}
        {@render entry.label()}
      {:else}
        {entry.text}
      {/if}
    </span>
    {#if multi || menuItemSelectedIcon !== undefined}
      <span class="ads-select-option-state" aria-hidden="true">
        {#if isSelected}{@render icon(menuItemSelectedIcon, 'check')}{/if}
      </span>
    {/if}
  </div>
{/snippet}

{#snippet list()}
  <div
    id={listId}
    role="listbox"
    aria-multiselectable={multi ? 'true' : undefined}
    aria-label={ariaLabel}
    aria-labelledby={listLabelledBy}
    class={classList('ads-select-list', classNames?.list)}
    style={styleText(`max-height: ${listHeight}px`, styles?.list)}
    data-scrollable={listScrolls ? '' : undefined}
    bind:this={listElement}
    onscroll={onpopupscroll}
  >
    {#each visibleNodes as node, nodeIndex (nodeIndex)}
      {#if node.kind === 'group'}
        {@const groupId = `${uid}-group-${nodeIndex}`}
        <div role="group" aria-labelledby={groupId} class={classList('ads-select-group', node.group.class)}>
          <div role="presentation" id={groupId} class="ads-select-group-label" title={node.group.title}>
            {#if typeof node.group.label === 'function'}
              {@render node.group.label()}
            {:else}
              {node.group.label}
            {/if}
          </div>
          {#each node.group.options as entry, memberIndex (memberIndex)}
            {@render optionRow(entry, entryIndex.get(entry)!)}
          {/each}
        </div>
      {:else}
        {@render optionRow(node.entry, entryIndex.get(node.entry)!)}
      {/if}
    {/each}
  </div>
  {#if visibleEntries.length === 0}
    <div class="ads-select-empty" bind:this={emptyElement}>
      {#if notFoundContent === undefined}No data{:else}{@render content(notFoundContent)}{/if}
    </div>
  {/if}
  {#if searchable}
    <!--
      A live region without a role: Orca takes a role="status" element for the status bar of a browser and drops the
      change of its text (or reads it only some of the time, when Chromium sends two events for it and Orca merges them).
      aria-live="polite" with aria-atomic is what role="status" stands for in every other screen reader.
    -->
    <div class="ads-select-sr" aria-live="polite" aria-atomic="true">{announcement}</div>
  {/if}
{/snippet}

<!--
  `SelectOption` and `SelectOptGroup` written as children draw nothing where they are: they register with the
  Select, which draws them in its list. They are rendered before the field, so the options exist while the list is
  closed (the field shows the label of the selected value) and in a server render.
-->
{#if !hasOptionsProp && children}
  <div hidden class="ads-select-registry" bind:this={registry}>{@render children()}</div>
{/if}

<!--
  The root never changes for the life of the field: showing or hiding the prefix, the clear button or the
  loading icon never re-creates the focused element. All the keyboard work is in the focused element inside.
-->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  class={rootClass}
  style={styleText(customStyle, styles?.root)}
  bind:this={root}
  onmousedown={handleRootMouseDown}
  onfocusin={handleFocusIn}
  onfocusout={handleFocusOut}
>
  {#if prefix}
    <span class={classList('ads-select-prefix', classNames?.prefix)} style={styleText(styles?.prefix)}
      >{@render content(prefix)}</span
    >
  {/if}
  <div class={classList('ads-select-content', classNames?.content)} style={styleText(styles?.content)}>
    {#if searchable}
      {@render selection()}
      <span class="ads-select-search" data-value={searchValue}>
        <input
          {...rest}
          {...comboboxAttrs}
          bind:this={combobox}
          type="text"
          value={searchValue}
          {disabled}
          {tabindex}
          {autocomplete}
          autocapitalize="off"
          spellcheck="false"
          oninput={handleInput}
          oncompositionstart={() => (composing = true)}
          oncompositionend={() => (composing = false)}
        />
      </span>
      <span hidden id={valueId}>{selectedText}</span>
    {:else}
      <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
      <div
        {...rest}
        {...comboboxAttrs}
        class={classList('ads-select-selector', classNames?.input)}
        bind:this={combobox}
        aria-disabled={disabled ? 'true' : undefined}
        tabindex={disabled ? undefined : (tabindex ?? 0)}
      >
        {@render selection()}
      </div>
    {/if}
  </div>
  {#if allowClear}
    <button
      type="button"
      class={classList('ads-select-clear', !clearVisible && 'ads-select-clear-hidden', classNames?.clear)}
      style={styleText(styles?.clear)}
      aria-label={clearConfig?.label ?? 'Clear'}
      tabindex={clearConfig?.tabIndex}
      onclick={clear}
    >
      {#if clearConfig?.clearIcon === undefined}
        <SelectIcon name="clear" />
      {:else}
        {@render content(clearConfig.clearIcon)}
      {/if}
    </button>
  {/if}
  {#if loading}
    <span class={classList('ads-select-suffix', classNames?.suffix)} style={styleText(styles?.suffix)}
      >{@render icon(loadingIcon, 'loading')}</span
    >
  {:else if suffix !== null}
    <span class={classList('ads-select-suffix', classNames?.suffix)} style={styleText(styles?.suffix)}
      >{#if suffix === undefined}<SelectIcon name={arrowName} />{:else}{@render content(suffix)}{/if}</span
    >
  {/if}
</div>

<Popup
  bind:open={() => popupOpen, setOpen}
  bind:panel
  anchor={root ?? null}
  placement={resolved.placement}
  matchWidth={popupMatchSelectWidth}
  {container}
  layer="dropdown"
  preventBlur
  onplacement={scrollToActive}
>
  <div
    class={classList('ads-select-popup', classNames?.popup)}
    style={styleText(styles?.popup)}
    onfocusout={handleFocusOut}
  >
    {#if popupRender}
      {@render popupRender(list)}
    {:else}
      {@render list()}
    {/if}
  </div>
</Popup>

<style>
  /*
   * The states set private `--_*` variables; the rules that paint the field read them, so the variant, the status,
   * hover, focus and disabled combine without fighting over specificity. The look is the one of Input, so the values
   * come from the `--ads-input-*` tokens; the tags and the panel have their own `--ads-select-*` tokens. Positions use
   * logical properties, so the field mirrors in right-to-left layouts.
   */
  .ads-select {
    --_fs: var(--ads-input-font-size);
    --_lh: var(--ads-input-line-height);
    --_pb: var(--ads-input-padding-block);
    --_pi: var(--ads-input-padding-inline);
    --_radius: var(--ads-input-radius);
    --_border: var(--ads-input-border);
    --_border-hover: var(--ads-input-border-hover);
    --_border-active: var(--ads-input-border-active);
    --_bg: var(--ads-input-bg);
    --_bg-hover: var(--ads-input-bg-hover);
    --_bg-active: var(--ads-input-bg-active);
    --_shadow: var(--ads-input-shadow-active);
    --_tag-h: var(--ads-select-tag-height);

    position: relative;
    display: inline-flex;
    align-items: center;
    box-sizing: border-box;
    width: 100%;
    min-width: 0;
    margin: 0;
    padding-block: var(--_pb);
    padding-inline: var(--_pi);
    border: var(--ads-input-border-width) solid var(--_border);
    border-radius: var(--_radius);
    background-color: var(--_bg);
    color: var(--ads-color-text);
    font-family: var(--ads-font-family);
    font-size: var(--_fs);
    line-height: var(--_lh);
    vertical-align: top;
    cursor: pointer;
    transition:
      border-color var(--ads-motion-duration) var(--ads-motion-ease),
      background-color var(--ads-motion-duration) var(--ads-motion-ease),
      box-shadow var(--ads-motion-duration) var(--ads-motion-ease);
  }

  .ads-select-large {
    --_fs: var(--ads-input-font-size-lg);
    --_lh: var(--ads-input-line-height-lg);
    --_pb: var(--ads-input-padding-block-lg);
    --_pi: var(--ads-input-padding-inline-lg);
    --_radius: var(--ads-input-radius-lg);
    --_tag-h: var(--ads-select-tag-height-lg);
  }

  .ads-select-small {
    --_fs: var(--ads-input-font-size-sm);
    --_pb: var(--ads-input-padding-block-sm);
    --_pi: var(--ads-input-padding-inline-sm);
    --_radius: var(--ads-input-radius-sm);
    --_tag-h: var(--ads-select-tag-height-sm);
  }

  /* With tags the field is as high as its rows: the padding keeps the height of the size for one row of tags. */
  .ads-select-multiple {
    --_pb: var(--ads-select-multiple-padding-block);
    --_pi: var(--ads-select-multiple-padding-inline);
  }

  .ads-select-filled {
    --_border: transparent;
    --_border-hover: transparent;
    --_bg: var(--ads-input-filled-bg);
    --_bg-hover: var(--ads-input-filled-bg-hover);
  }

  .ads-select-borderless {
    --_border: transparent;
    --_border-hover: transparent;
    --_border-active: transparent;
    --_bg: transparent;
    --_bg-hover: transparent;
    --_bg-active: transparent;
    --_shadow: none;
  }

  .ads-select-underlined {
    --_bg: transparent;
    --_bg-hover: transparent;
    --_bg-active: transparent;
    --_pi: 0px;
    --_shadow: none;
  }

  .ads-select-status-error {
    --_border: var(--ads-input-error);
    --_border-hover: var(--ads-input-error-hover);
    --_border-active: var(--ads-input-error);
    --_shadow: var(--ads-input-error-shadow);
  }

  .ads-select-status-warning {
    --_border: var(--ads-input-warning);
    --_border-hover: var(--ads-input-warning-hover);
    --_border-active: var(--ads-input-warning);
    --_shadow: var(--ads-input-warning-shadow);
  }

  .ads-select-filled.ads-select-status-error {
    --_border: transparent;
    --_border-hover: transparent;
    --_bg: var(--ads-input-error-bg);
    --_bg-hover: var(--ads-input-error-bg);
  }

  .ads-select-filled.ads-select-status-warning {
    --_border: transparent;
    --_border-hover: transparent;
    --_bg: var(--ads-input-warning-bg);
    --_bg-hover: var(--ads-input-warning-bg);
  }

  /* Last, so the disabled colors win over the variant and the status. */
  .ads-select-disabled {
    --_border: var(--ads-input-disabled-border);
    --_border-hover: var(--ads-input-disabled-border);
    --_bg: var(--ads-input-disabled-bg);
    --_bg-hover: var(--ads-input-disabled-bg);
    color: var(--ads-color-text-disabled);
    cursor: not-allowed;
  }

  .ads-select-disabled.ads-select-borderless,
  .ads-select-disabled.ads-select-underlined {
    --_bg: transparent;
    --_bg-hover: transparent;
  }

  .ads-select-disabled.ads-select-borderless {
    --_border: transparent;
    --_border-hover: transparent;
  }

  .ads-select.ads-select-underlined {
    border-width: 0 0 var(--ads-input-border-width);
    border-radius: 0;
  }

  .ads-select:not(.ads-select-disabled):hover {
    border-color: var(--_border-hover);
    background-color: var(--_bg-hover);
  }

  /* After the hover rule, so a focused or open field under the pointer keeps the active look. */
  .ads-select:not(.ads-select-disabled):focus-within,
  .ads-select.ads-select-open:not(.ads-select-disabled) {
    border-color: var(--_border-active);
    background-color: var(--_bg-active);
    box-shadow: var(--_shadow);
  }

  /* The borderless field has no border to change, so keyboard focus gets the outline of the other controls. */
  .ads-select.ads-select-borderless:focus-within,
  .ads-select.ads-select-borderless.ads-select-open {
    outline: var(--ads-focus-outline-width) solid var(--ads-color-focus-outline);
    outline-offset: 0;
  }

  /* ---- The content ---- */

  .ads-select-prefix,
  .ads-select-suffix {
    display: flex;
    flex: none;
    align-items: center;
  }

  .ads-select-prefix {
    margin-inline-end: var(--ads-input-gap);
  }

  .ads-select-content {
    position: relative;
    display: flex;
    flex: 1 1 auto;
    align-items: center;
    box-sizing: border-box;
    min-width: 0;
    min-height: calc(var(--_fs) * var(--_lh));
  }

  /* The selection is cut with an ellipsis; it never widens the field. */
  .ads-select-single .ads-select-content {
    overflow: hidden;
  }

  .ads-select-multiple .ads-select-content {
    flex-wrap: wrap;
    align-content: center;
    gap: var(--ads-select-tag-gap);
    min-height: var(--_tag-h);
  }

  /* The focused element of a field that does not search. It holds the selection as its own text. */
  .ads-select-selector {
    display: flex;
    flex: 1 1 auto;
    flex-wrap: inherit;
    align-items: center;
    gap: inherit;
    box-sizing: border-box;
    min-width: 0;
    min-height: inherit;
    outline: 0;
  }

  .ads-select-item {
    display: block;
    flex: 1 1 auto;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  /* Hidden, not removed, so the field keeps its height while the text is typed over it. */
  .ads-select-item-hidden,
  .ads-select-placeholder-hidden {
    visibility: hidden;
  }

  .ads-select-placeholder {
    flex: 1 1 auto;
    min-width: 0;
    overflow: hidden;
    color: var(--ads-input-placeholder);
    text-overflow: ellipsis;
    white-space: nowrap;
    pointer-events: none;
  }

  .ads-select-single .ads-select-search ~ .ads-select-placeholder {
    display: none;
  }

  /* With tags the placeholder lies over the row, so it never makes the tags wrap. */
  .ads-select-multiple .ads-select-placeholder {
    position: absolute;
    inset-inline: calc(var(--ads-input-padding-inline) - var(--ads-select-multiple-padding-inline)) 0;
    top: 50%;
    transform: translateY(-50%);
  }

  /* The text field: over the whole content in a single field, after the tags in a field with tags. */
  .ads-select-search {
    position: absolute;
    inset: 0;
    display: block;
  }

  .ads-select-multiple .ads-select-search {
    position: relative;
    inset: auto;
    display: inline-grid;
    flex: 0 1 auto;
    max-width: 100%;
    height: var(--_tag-h);
    margin-inline-start: calc(var(--ads-input-padding-inline) - var(--ads-select-multiple-padding-inline));
  }

  /* An invisible copy of the text gives the field its width, so that it grows with what is typed. */
  .ads-select-multiple .ads-select-search::after {
    content: attr(data-value) ' ';
    grid-area: 1 / 1;
    min-width: 4px;
    font: inherit;
    visibility: hidden;
    white-space: pre;
    pointer-events: none;
  }

  .ads-select-input {
    box-sizing: border-box;
    min-width: 0;
    margin: 0;
    padding: 0;
    border: 0;
    outline: 0;
    background: transparent;
    color: inherit;
    font: inherit;
    font-size: var(--_fs);
    line-height: var(--_lh);
    text-overflow: ellipsis;
  }

  input.ads-select-input {
    width: 100%;
    height: 100%;
    cursor: inherit;
  }

  /* The width of the input comes from the invisible copy of the text, not from the browser's default width. */
  .ads-select-multiple input.ads-select-input {
    grid-area: 1 / 1;
    width: 0;
    min-width: 100%;
  }

  .ads-select-disabled .ads-select-input {
    cursor: not-allowed;
    opacity: 1;
    -webkit-text-fill-color: currentColor;
  }

  /* ---- Tags ---- */

  .ads-select-tag,
  .ads-select-tag-slot {
    flex: none;
    max-width: 100%;
  }

  .ads-select-tag {
    display: inline-flex;
    align-items: center;
    box-sizing: border-box;
    height: var(--_tag-h);
    padding-inline: var(--ads-select-tag-padding-start) var(--ads-select-tag-padding-end);
    border: var(--ads-input-border-width) solid var(--ads-select-tag-border);
    border-radius: var(--ads-select-tag-radius);
    background: var(--ads-select-tag-bg);
    line-height: calc(var(--_tag-h) - 2 * var(--ads-input-border-width));
    cursor: default;
    user-select: none;
  }

  .ads-select-tag-rest {
    padding-inline-end: var(--ads-select-tag-padding-start);
  }

  .ads-select-tag-text {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .ads-select-tag-disabled {
    color: var(--ads-select-tag-color-disabled);
  }

  .ads-select-tag-remove {
    display: inline-flex;
    flex: none;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
    margin: 0;
    margin-inline-start: var(--ads-select-tag-gap);
    padding: 0;
    border: 0;
    background: transparent;
    color: var(--ads-input-icon-color);
    font: inherit;
    font-size: var(--ads-select-tag-remove-size);
    line-height: 1;
    cursor: pointer;
    transition: color var(--ads-motion-duration) var(--ads-motion-ease);
  }

  .ads-select-tag-remove:hover {
    color: var(--ads-input-icon-color-hover);
  }

  .ads-select-tag-remove:focus-visible {
    outline: var(--ads-focus-outline-width) solid var(--ads-color-focus-outline);
    outline-offset: 1px;
  }

  /* ---- Clear and suffix ---- */

  .ads-select-clear {
    display: inline-flex;
    flex: none;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
    margin: 0;
    margin-inline-start: var(--ads-select-gap);
    padding: 0;
    border: 0;
    border-radius: 50%;
    background: transparent;
    color: var(--ads-input-icon-color);
    font: inherit;
    font-size: var(--ads-select-icon-size);
    line-height: 1;
    cursor: pointer;
    transition: color var(--ads-motion-duration) var(--ads-motion-ease);
  }

  .ads-select-clear:hover {
    color: var(--ads-input-icon-color-hover);
  }

  .ads-select-clear:focus-visible {
    outline: var(--ads-focus-outline-width) solid var(--ads-color-focus-outline);
    outline-offset: 1px;
  }

  /* The button keeps its place while there is nothing to clear, so the field does not change size. */
  .ads-select-clear-hidden {
    visibility: hidden;
  }

  .ads-select-suffix {
    margin-inline-start: var(--ads-select-gap);
    color: var(--ads-input-icon-color);
    font-size: var(--ads-select-icon-size);
    line-height: 1;
  }

  .ads-select-disabled .ads-select-suffix,
  .ads-select-disabled .ads-select-clear {
    color: var(--ads-color-text-disabled);
  }

  /* ---- The panel ---- */

  .ads-select-popup {
    box-sizing: border-box;
    padding: var(--ads-select-popup-padding);
    border-radius: var(--ads-select-popup-radius);
    background-color: var(--ads-select-popup-bg);
    box-shadow: var(--ads-select-popup-shadow);
    color: var(--ads-color-text);
    font-family: var(--ads-font-family);
    font-size: var(--ads-select-option-font-size);
    line-height: var(--ads-select-option-line-height);
  }

  .ads-select-list {
    position: relative;
    overflow: hidden auto;
  }

  /* Only a list that scrolls keeps the wheel from the page (see `listScrolls`). */
  .ads-select-list[data-scrollable] {
    overscroll-behavior: contain;
  }

  .ads-select-option {
    position: relative;
    display: flex;
    align-items: center;
    box-sizing: border-box;
    min-height: var(--ads-select-option-height);
    padding: var(--ads-select-option-padding-block) var(--ads-select-option-padding-inline);
    border-radius: var(--ads-select-option-radius);
    cursor: pointer;
  }

  .ads-select-option + .ads-select-option,
  .ads-select-group-label + .ads-select-option {
    margin-block-start: var(--ads-select-option-gap);
  }

  .ads-select-group + .ads-select-option,
  .ads-select-option + .ads-select-group,
  .ads-select-group + .ads-select-group {
    margin-block-start: var(--ads-select-option-gap);
  }

  .ads-select-option-content {
    flex: 1 1 auto;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  /* The slot of the mark is always there, so a selection never changes the width of the list. */
  .ads-select-option-state {
    display: flex;
    flex: none;
    align-items: center;
    width: var(--ads-select-icon-size);
    margin-inline-start: var(--ads-select-gap);
    font-size: var(--ads-select-icon-size);
    line-height: 1;
  }

  .ads-select-option-active {
    background-color: var(--ads-select-option-active-bg);
  }

  /* After the active rule: a selected option keeps its own background while the highlight is on it. */
  .ads-select-option-selected {
    background-color: var(--ads-select-option-selected-bg);
    color: var(--ads-select-option-selected-color);
    font-weight: var(--ads-select-selected-font-weight);
  }

  .ads-select-option-disabled {
    color: var(--ads-color-text-disabled);
    cursor: not-allowed;
  }

  .ads-select-group-label {
    display: flex;
    align-items: center;
    box-sizing: border-box;
    min-height: var(--ads-select-option-height);
    padding: 0 var(--ads-select-option-padding-inline);
    color: var(--ads-select-group-label-color);
    font-size: var(--ads-select-group-font-size);
    cursor: default;
  }

  .ads-select-empty {
    padding: var(--ads-select-option-padding-block) var(--ads-select-option-padding-inline);
    color: var(--ads-select-empty-color);
    text-align: center;
  }

  /* Read by assistive technology, not seen. */
  .ads-select-sr {
    position: absolute;
    width: 1px;
    height: 1px;
    margin: -1px;
    padding: 0;
    overflow: hidden;
    border: 0;
    clip-path: inset(50%);
    white-space: nowrap;
  }

  /*
   * Windows High Contrast and other forced-colors modes replace the colors and drop the backgrounds, which are
   * what tell the states of the field and of the options apart. The panel gets a border, the focus an outline, the
   * highlighted option the system highlight, the selected option a bar drawn with a border, a disabled option the
   * system gray.
   */
  @media (forced-colors: active) {
    .ads-select:not(.ads-select-disabled):focus-within,
    .ads-select.ads-select-open:not(.ads-select-disabled) {
      outline: var(--ads-focus-outline-width) solid Highlight;
      outline-offset: 1px;
    }

    .ads-select-popup {
      border: 1px solid CanvasText;
    }

    .ads-select-option {
      border-inline-start: 3px solid transparent;
      padding-inline-start: calc(var(--ads-select-option-padding-inline) - 3px);
    }

    .ads-select-option-selected {
      border-inline-start-color: CanvasText;
    }

    .ads-select-option-active {
      background-color: Highlight;
      color: HighlightText;
    }

    .ads-select-option-active.ads-select-option-selected {
      border-inline-start-color: HighlightText;
    }

    .ads-select-option-disabled {
      color: GrayText;
    }

    .ads-select-tag-disabled {
      color: GrayText;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .ads-select,
    .ads-select-clear,
    .ads-select-tag-remove {
      transition: none;
    }
  }
</style>
