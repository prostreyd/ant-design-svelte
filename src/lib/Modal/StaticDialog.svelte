<script lang="ts">
  import { untrack, type Snippet } from 'svelte';
  import Icon from '../internal/icons/Icon.svelte';
  import { classList, styleText } from '../internal/semantic.js';
  import Modal from './Modal.svelte';
  import { closeEntry, finalize, type ModalRecord } from './store.js';
  import type { ModalFooterContext, ModalText } from './types.js';

  /**
   * One static dialog (`modal.confirm` and the others): a `Modal` with the layout of a dialog (an icon, a title, a text), the defaults
   * of a dialog, the role of an alert dialog, and the two ways it can end: `true` for OK, `false` for everything else.
   */
  let { record }: { record: ModalRecord } = $props();

  const uid = $props.id();
  const titleId = `ads-modal-confirm-title-${uid}`;
  const descriptionId = `ads-modal-confirm-description-${uid}`;

  /** The dialog's own state: `bind:open` of the Modal, and closed by the store when the call asks (destroy, destroyAll). */
  let open = $state(true);
  let cancelPending = $state(false);
  /** How it was closed last: OK makes the handle resolve `true`. */
  let lastAction: 'ok' | 'cancel' | undefined;

  const options = $derived(record.options);
  const iconName = $derived(record.kind === 'confirm' ? 'warning' : record.kind);
  const hasTitle = $derived(options.title !== undefined && options.title !== '');
  const hasContent = $derived(options.content !== undefined && options.content !== '');
  const showIcon = $derived(options.icon !== false);
  const okCancel = $derived(options.okCancel ?? record.kind === 'confirm');

  // The defaults of a dialog (P15): the mask does not close it, and focus goes to the OK button.
  const mask = $derived.by(() => {
    const given = options.mask;
    if (given === false) return false;
    return typeof given === 'object' ? { closable: false, ...given } : { closable: false };
  });
  const focusable = $derived({ autoFocusButton: 'ok' as const, ...options.focusable });
  const cancelButtonProps = $derived(cancelPending ? { ...options.cancelButtonProps, loading: true } : options.cancelButtonProps);

  // A dialog that is created closed (a host took over while it was leaving) never opens and never leaves: it goes at once.
  $effect(() => {
    if (!untrack(() => record.open)) finalize(untrack(() => record.id));
  });
  $effect(() => {
    if (!record.open) open = false;
  });
  $effect(() => {
    if (!open) untrack(() => closeEntry(record.id, lastAction === 'ok'));
  });

  const isThenable = (value: unknown): value is PromiseLike<unknown> =>
    typeof value === 'object' && value !== null && typeof (value as { then?: unknown }).then === 'function';

  // OK: the Modal (`closeOnOk`) waits for the Promise. A reject keeps the dialog open, and then it has not been answered.
  function onok(event: MouseEvent): unknown {
    lastAction = 'ok';
    const result = options.onok?.(event);
    if (!isThenable(result)) return;
    return Promise.resolve(result).catch((error: unknown) => {
      lastAction = undefined;
      throw error;
    });
  }

  // Cancel, Escape, the close button and the mask all come here. A Promise from `oncancel` is waited for: the dialog takes over the
  // closing (so the Modal must not close it at once) and the Cancel button is loading meanwhile.
  function oncancel(event: MouseEvent | KeyboardEvent): void {
    lastAction = 'cancel';
    const result = options.oncancel?.(event);
    if (event.defaultPrevented) {
      lastAction = undefined;
      return;
    }
    if (!isThenable(result)) return;
    event.preventDefault();
    cancelPending = true;
    Promise.resolve(result).then(
      () => {
        cancelPending = false;
        open = false;
      },
      () => {
        cancelPending = false;
        lastAction = undefined;
      }
    );
  }

  function onafterclose(): void {
    // Without a leave animation (reduced motion) the dialog is gone before the effect above has said how it was closed: the handle must
    // still be answered, and before the record is taken out of the list.
    closeEntry(record.id, lastAction === 'ok');
    options.onafterclose?.();
    finalize(record.id);
  }
</script>

{#snippet text(value: ModalText)}
  {#if typeof value === 'function'}{@render value()}{:else}{value}{/if}
{/snippet}

{#snippet okOnly(context: ModalFooterContext)}{@render context.ok()}{/snippet}

{#snippet body()}
  <div
    class={classList('ads-modal-confirm-body', !showIcon && 'ads-modal-confirm-body-plain', options.classNames?.confirmBody)}
    style={styleText(options.styles?.confirmBody)}
  >
    {#if showIcon}
      <!-- `false` was handled by `showIcon`: what is left is the icon the caller gave, or nothing (the icon of the kind). -->
      {@const customIcon = options.icon as Snippet | string | undefined}
      <span
        class={classList('ads-modal-confirm-icon', `ads-modal-confirm-icon-${iconName}`, options.classNames?.icon)}
        style={styleText(options.styles?.icon)}
        aria-hidden="true"
      >
        {#if customIcon === undefined}
          <Icon name={iconName} />
        {:else if typeof customIcon === 'string'}
          {customIcon}
        {:else}
          {@render customIcon()}
        {/if}
      </span>
    {/if}
    {#if hasTitle}
      <div class={classList('ads-modal-title', 'ads-modal-confirm-title', options.classNames?.title)} style={styleText(options.styles?.title)} id={titleId}>
        {@render text(options.title as ModalText)}
      </div>
    {/if}
    {#if hasContent}
      <div
        class={classList('ads-modal-description', 'ads-modal-confirm-description', !hasTitle && 'ads-modal-confirm-description-alone', options.classNames?.description)}
        style={styleText(options.styles?.description)}
        id={descriptionId}
      >
        {@render text(options.content as ModalText)}
      </div>
    {/if}
  </div>
{/snippet}

<Modal
  bind:open
  role="alertdialog"
  aria-labelledby={hasTitle ? titleId : hasContent ? descriptionId : undefined}
  aria-describedby={hasTitle && hasContent ? descriptionId : undefined}
  okText={options.okText}
  cancelText={options.cancelText}
  okType={options.okType}
  okButtonProps={options.okButtonProps}
  {cancelButtonProps}
  closeOnOk
  {onok}
  {oncancel}
  closable={options.closable ?? false}
  closeIcon={options.closeIcon}
  {mask}
  keyboard={options.keyboard}
  centered={options.centered}
  width={options.width ?? 'var(--ads-modal-confirm-width)'}
  zIndex={options.zIndex}
  container={options.container}
  {focusable}
  scrollLock={options.scrollLock}
  zoomFromClick={options.zoomFromClick}
  class={options.class}
  style={options.style}
  wrapClassName={options.wrapClassName}
  classNames={options.classNames}
  styles={options.styles}
  footer={options.footer !== undefined ? options.footer : okCancel ? undefined : okOnly}
  onafteropenchange={options.onafteropenchange}
  {onafterclose}
>
  {@render body()}
</Modal>

<style>
  /* The row of a dialog: the icon at the start, the title and the text in one column beside it (the text under the title, in line with it). */
  .ads-modal-confirm-body {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    column-gap: var(--ads-modal-confirm-icon-gap);
    align-items: start;
  }

  .ads-modal-confirm-body-plain {
    grid-template-columns: minmax(0, 1fr);
  }

  .ads-modal-confirm-icon {
    grid-column: 1;
    grid-row: 1;
    display: flex;
    margin-block-start: 1px;
    font-size: var(--ads-modal-confirm-icon-size);
    line-height: 1;
  }

  .ads-modal-confirm-icon-info {
    color: var(--ads-modal-confirm-icon-info);
  }

  .ads-modal-confirm-icon-success {
    color: var(--ads-modal-confirm-icon-success);
  }

  .ads-modal-confirm-icon-warning {
    color: var(--ads-modal-confirm-icon-warning);
  }

  .ads-modal-confirm-icon-error {
    color: var(--ads-modal-confirm-icon-error);
  }

  .ads-modal-confirm-title {
    grid-column: 2;
    grid-row: 1;
    color: var(--ads-modal-title-color);
    font-size: var(--ads-modal-title-font-size);
    font-weight: var(--ads-modal-title-font-weight);
    line-height: var(--ads-modal-title-line-height);
    overflow-wrap: break-word;
  }

  .ads-modal-confirm-description {
    grid-column: 2;
    grid-row: 2;
    margin-block-start: var(--ads-modal-header-gap);
    color: var(--ads-modal-body-color);
    overflow-wrap: break-word;
  }

  /* No title: the text is the first line, beside the icon. */
  .ads-modal-confirm-description-alone {
    grid-row: 1;
    margin-block-start: 0;
  }

  .ads-modal-confirm-body-plain > .ads-modal-confirm-title,
  .ads-modal-confirm-body-plain > .ads-modal-confirm-description {
    grid-column: 1;
  }
</style>
