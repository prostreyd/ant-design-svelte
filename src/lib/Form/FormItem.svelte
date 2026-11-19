<script lang="ts">
  import type { Snippet } from 'svelte';
  import { untrack } from 'svelte';
  import Col from '../Grid/Col.svelte';
  import Row from '../Grid/Row.svelte';
  import Tooltip from '../Tooltip/Tooltip.svelte';
  import { isProduction } from '../internal/env.js';
  import { resolveOption } from '../internal/options.js';
  import { classList, styleText } from '../internal/semantic.js';
  import FeedbackIcon from './FeedbackIcon.svelte';
  import { getFormContext, type FormContext } from './context.js';
  import { itemColumns } from './layout.js';
  import { lookupRules, pathId, pathKey, pathText, toPath } from './path.js';
  import { createForm, type FieldEntry } from './store.svelte.js';
  import type {
    FormField,
    FormItemLayout,
    FormItemProps,
    FormNamePathPart,
    FormRule,
    FormRuleConfig,
    FormTooltipConfig,
    FormValidateStatus,
    FormValidateTrigger
  } from './types.js';

  const ITEM_LAYOUTS = ['horizontal', 'vertical'] as const satisfies readonly FormItemLayout[];

  const uid = $props.id();

  let {
    name,
    label,
    rules,
    required,
    help,
    extra,
    tooltip,
    hasFeedback = false,
    validateStatus,
    validateFirst = false,
    validateTrigger,
    validateDebounce,
    dependencies,
    initialValue,
    hidden = false,
    preserve,
    messageVariables,
    colon,
    labelAlign,
    labelWrap,
    labelCol,
    wrapperCol,
    layout,
    htmlFor,
    class: customClass,
    style,
    children,
    ...rest
  }: FormItemProps = $props();

  // An item outside a `Form` is a plain row: it has the defaults and a store of its own.
  const standalone = {
    form: createForm(),
    id: uid,
    name: undefined,
    layout: 'horizontal',
    labelCol: undefined,
    wrapperCol: undefined,
    labelAlign: 'end',
    labelWrap: false,
    colon: true,
    requiredMark: true,
    validateTrigger: ['change'],
    rules: undefined,
    preserve: true,
    disabled: undefined,
    size: undefined,
    variant: undefined,
    tooltip: undefined,
    classNames: {},
    styles: {},
    feedbackIcons: {}
  } satisfies FormContext;
  const ctx: FormContext = getFormContext() ?? standalone;

  const path = $derived(name === undefined ? undefined : toPath(name));
  const itemLayout = $derived(
    layout === undefined ? ctx.layout : resolveOption('FormItem', 'layout', layout, ITEM_LAYOUTS, 'horizontal')
  );

  // ---- ids ------------------------------------------------------------------------------------------------------
  // `<form name>_<field name>`, as the ids of Ant Design; a form without a name uses its own unique id instead, so two
  // forms with the same field names never share ids.
  const controlId = $derived(
    path ? `${ctx.name ?? ctx.id}_${pathId(path)}` : `${uid}`
  );
  const helpId = $derived(`${controlId}_help`);
  const extraId = $derived(`${controlId}_extra`);
  const labelId = $derived(`${controlId}_label`);

  // ---- rules and the state of the field -------------------------------------------------------------------------
  const triggers = $derived(
    validateTrigger === undefined
      ? ctx.validateTrigger
      : ((Array.isArray(validateTrigger) ? [...validateTrigger] : [validateTrigger]) as FormValidateTrigger[])
  );

  // The rules of the form for this name come first, then the item's own.
  function currentRules(): FormRuleConfig[] {
    const own = path ? lookupRules<FormRule>(ctx.rules, path) : [];
    return [...own, ...(rules ?? [])].map((rule) => (typeof rule === 'function' ? rule(ctx.form) : rule));
  }

  const isRequired = $derived(required ?? currentRules().some((rule) => rule.required === true));
  const labelText = $derived(typeof label === 'string' ? label : undefined);

  const meta = $derived(path ? ctx.form.fieldMeta(path) : { touched: false, validating: false, validated: false, errors: [] as string[], warnings: [] as string[] });

  const status = $derived.by((): FormValidateStatus | undefined => {
    if (validateStatus) return validateStatus;
    if (meta.validating) return 'validating';
    if (meta.errors.length > 0) return 'error';
    if (meta.warnings.length > 0) return 'warning';
    if (hasFeedback && meta.validated) return 'success';
    return undefined;
  });
  const controlStatus = $derived(status === 'error' || status === 'warning' ? status : undefined);

  // ---- the messages ---------------------------------------------------------------------------------------------
  type Message = { key: string; kind: 'error' | 'warning' | 'help'; content: string | Snippet };

  const messages = $derived.by((): Message[] => {
    if (help === false) return [];
    if (help !== undefined) {
      const kind = status === 'error' ? 'error' : status === 'warning' ? 'warning' : 'help';
      return [{ key: 'help', kind, content: help }];
    }
    const seen: Record<string, number> = {};
    const list: Message[] = [];
    for (const [kind, texts] of [['error', meta.errors], ['warning', meta.warnings]] as const) {
      for (const text of texts) {
        const id = `${kind}\u0000${text}`;
        const count = seen[id] ?? 0;
        seen[id] = count + 1;
        list.push({ key: `${id}\u0000${count}`, kind, content: text });
      }
    }
    return list;
  });
  const hasMessages = $derived(messages.length > 0);
  const hasExtra = $derived(extra !== undefined && extra !== null && (extra as unknown) !== '');
  const describedBy = $derived([hasMessages ? helpId : '', hasExtra ? extraId : ''].filter(Boolean).join(' '));

  // ---- what the control gets ------------------------------------------------------------------------------------
  const attrs = $derived.by(() => {
    const result: Record<string, string> = { id: controlId };
    if (describedBy) result['aria-describedby'] = describedBy;
    if (controlStatus === 'error') result['aria-invalid'] = 'true';
    if (isRequired) result['aria-required'] = 'true';
    if (label !== undefined && label !== null) result['aria-labelledby'] = labelId;
    return result;
  });

  function makeEntry(fieldPath: FormNamePathPart[]): FieldEntry {
    return {
      id: Symbol('field'),
      path: () => fieldPath,
      rules: () => currentRules(),
      triggers: () => triggers,
      validateFirst: () => validateFirst,
      debounce: () => validateDebounce,
      dependencies: () => (dependencies ?? []).map(toPath),
      variables: () => ({ name: labelText ?? pathText(fieldPath), ...(messageVariables ?? {}) }),
      preserve: () => preserve ?? ctx.preserve,
      composing: () => composing,
      controlId: () => controlId,
      container: () => content
    };
  }

  const entry = $derived(path ? makeEntry(path) : undefined);

  const feedbackShown = $derived(hasFeedback !== false && status !== undefined);

  const field: FormField = {
    get value() {
      return path ? ctx.form.valueAt(path) : undefined;
    },
    set value(next: unknown) {
      if (entry) ctx.form.userChange(entry, next);
    },
    get status() {
      return controlStatus;
    },
    get attrs() {
      return attrs;
    },
    get errors() {
      return meta.errors;
    },
    get warnings() {
      return meta.warnings;
    },
    get validating() {
      return meta.validating;
    },
    get touched() {
      return meta.touched;
    },
    get disabled() {
      return ctx.disabled;
    },
    get size() {
      return ctx.size;
    },
    get variant() {
      return ctx.variant;
    },
    get feedback() {
      return feedbackShown ? feedbackSnippet : undefined;
    }
  };

  // The value the item starts with, before the first render, so a server render shows it.
  untrack(() => {
    if (path && initialValue !== undefined) ctx.form.setItemInitial(path, initialValue);
  });

  const warned: Record<string, true> = {};
  $effect(() => {
    const store = ctx.form;
    const mine = entry;
    const fieldPath = path;
    if (!mine || !fieldPath) return;
    untrack(() => {
      if (initialValue !== undefined) store.setItemInitial(fieldPath, initialValue);
      if (!isProduction() && store.valueAt(fieldPath) === undefined && !warned[pathKey(fieldPath)]) {
        warned[pathKey(fieldPath)] = true;
        console.warn(
          `FormItem "${pathText(fieldPath)}": the field has no initial value. A control that binds it with a default of its ` +
            'own (Input, Switch, Checkbox) throws props_invalid_value. Give it one in `initialValues` of the Form, or `initialValue` on the item.'
        );
      }
    });
    return store.register(mine);
  });

  // With a `model` on the form, a value that was changed from outside (a control that binds the model, code that assigns to
  // it) is a user change; the store tells it from its own writes.
  $effect(() => {
    if (entry) ctx.form.observe(entry);
  });

  // ---- the control box: IME and blur ----------------------------------------------------------------------------
  let content = $state<HTMLElement | null>(null);
  let composing = false;

  function compositionEnd(): void {
    composing = false;
    if (entry) ctx.form.compositionEnd(entry);
  }

  function focusOut(event: FocusEvent): void {
    // Focus that moves inside the control box (a clear button, a stepper) is not the control losing focus.
    const next = event.relatedTarget as Node | null;
    if (next && content?.contains(next)) return;
    if (entry) ctx.form.blur(entry);
  }

  // ---- the label and its tooltip --------------------------------------------------------------------------------
  const hasLabelColumn = $derived(label !== undefined);
  const effectiveColon = $derived((colon ?? ctx.colon) && itemLayout === 'horizontal' && ctx.layout !== 'inline');
  const effectiveAlign = $derived(itemLayout === 'vertical' ? 'start' : (labelAlign ?? ctx.labelAlign));
  const effectiveWrap = $derived(labelWrap ?? ctx.labelWrap);
  const requiredMark = $derived(ctx.requiredMark);
  const markSnippet = $derived(typeof requiredMark === 'function' ? requiredMark : undefined);
  const showStar = $derived(requiredMark === true && isRequired);
  const showOptional = $derived(requiredMark === 'optional' && !isRequired);

  const tooltipConfig = $derived.by((): FormTooltipConfig | undefined => {
    if (tooltip === undefined) return undefined;
    const own = typeof tooltip === 'string' || typeof tooltip === 'function' ? { title: tooltip } : tooltip;
    return { ...(ctx.tooltip ?? {}), ...own };
  });

  const columns = $derived(itemColumns(ctx.layout === 'inline' ? 'inline' : itemLayout, labelCol ?? ctx.labelCol, wrapperCol ?? ctx.wrapperCol));
  const rowLayout = $derived(ctx.layout === 'inline' ? 'inline' : itemLayout);

  const rootClasses = $derived(
    classList(
      'ads-form-item',
      `ads-form-item-${rowLayout}`,
      hidden && 'ads-form-item-hidden',
      status && `ads-form-item-has-${status}`,
      hasMessages && 'ads-form-item-with-help',
      ctx.classNames.root,
      customClass
    )
  );
  const rootStyle = $derived(styleText(ctx.styles.root, style));

  function iconFor(shown: FormValidateStatus): Snippet | undefined {
    const own = typeof hasFeedback === 'object' ? hasFeedback.icons[shown] : undefined;
    return own ?? ctx.feedbackIcons[shown];
  }
</script>

{#snippet feedbackSnippet()}
  <!-- Only handed out while there is a status (`feedbackShown`). -->
  {@const shown = status as FormValidateStatus}
  {@const custom = iconFor(shown)}
  {#if custom}
    {@render custom()}
  {:else}
    <FeedbackIcon status={shown} />
  {/if}
{/snippet}

{#snippet labelContent()}
  {#if typeof label === 'function'}
    {@render label()}
  {:else if label !== null && label !== undefined}
    {label}
  {/if}
{/snippet}

{#snippet textOrSnippet(value: string | Snippet)}
  {#if typeof value === 'function'}
    {@render value()}
  {:else}
    {value}
  {/if}
{/snippet}

<div {...rest} class={rootClasses} style={rootStyle}>
  <Row
    class="ads-form-item-row"
    wrap={rowLayout === 'horizontal'}
    align={rowLayout === 'vertical' ? 'stretch' : undefined}
    style={rowLayout === 'vertical' ? 'flex-direction: column' : undefined}
  >
    {#if hasLabelColumn}
      <Col {...columns.label}>
        <div
          class={classList(
            'ads-form-item-label-box',
            `ads-form-item-label-${effectiveAlign}`,
            effectiveWrap && 'ads-form-item-label-wrap'
          )}
        >
          <label
            id={labelId}
            for={htmlFor === null ? undefined : (htmlFor ?? controlId)}
            class={classList(
              'ads-form-item-label',
              showStar && 'ads-form-item-label-required',
              itemLayout !== 'vertical' && 'ads-form-item-label-after',
              effectiveColon && 'ads-form-item-label-colon',
              ctx.classNames.label
            )}
            style={styleText(ctx.styles.label)}
          >
            {#if markSnippet}
              {@render markSnippet({ label: label as string | Snippet | null, required: isRequired })}
            {:else}
              {#if showStar}<span class="ads-form-item-mark" aria-hidden="true">*</span>{/if}
              {@render labelContent()}
              {#if showOptional}<span class="ads-form-item-optional">(optional)</span>{/if}
            {/if}
            {#if itemLayout !== 'vertical'}
              <span class="ads-form-item-colon" aria-hidden="true">{effectiveColon ? ':' : '\u00a0'}</span>
            {/if}
          </label>
          {#if tooltipConfig}
            {@const { icon, iconLabel, ...tooltipProps } = tooltipConfig}
            <Tooltip {...tooltipProps}>
              <button type="button" class="ads-form-item-tooltip" aria-label={iconLabel ?? 'More information'}>
                {#if typeof icon === 'function'}
                  {@render icon()}
                {:else if typeof icon === 'string'}
                  {icon}
                {:else}
                  <svg viewBox="0 0 16 16" width="1em" height="1em" aria-hidden="true" focusable="false">
                    <circle cx="8" cy="8" r="6.6" fill="none" stroke="currentColor" stroke-width="1.3" />
                    <path d="M6.2 6.3a1.9 1.9 0 1 1 2.7 1.7c-.6.3-.9.7-.9 1.3" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" />
                    <circle cx="8" cy="11.5" r=".8" fill="currentColor" />
                  </svg>
                {/if}
              </button>
            </Tooltip>
          {/if}
        </div>
      </Col>
    {/if}
    <Col {...columns.control}>
      <div
        bind:this={content}
        class={classList('ads-form-item-content', ctx.classNames.content)}
        style={styleText(ctx.styles.content)}
        oncompositionstart={() => (composing = true)}
        oncompositionend={compositionEnd}
        onfocusout={focusOut}
      >
        {@render children?.(field)}
      </div>
      <div class={classList('ads-form-item-additional', (hasMessages || hasExtra) && 'ads-form-item-additional-on')}>
        <div
          id={helpId}
          class={classList('ads-form-item-help', ctx.classNames.help)}
          style={styleText(ctx.styles.help)}
        >
          {#each messages as message (message.key)}
            <div
              class={classList(
                'ads-form-item-help-item',
                `ads-form-item-help-item-${message.kind}`,
                ctx.classNames.helpItem
              )}
              style={styleText(ctx.styles.helpItem)}
            >
              {@render textOrSnippet(message.content)}
            </div>
          {/each}
        </div>
        {#if hasExtra && extra !== undefined}
          <div
            id={extraId}
            class={classList('ads-form-item-extra', ctx.classNames.extra)}
            style={styleText(ctx.styles.extra)}
          >
            {@render textOrSnippet(extra)}
          </div>
        {/if}
      </div>
    </Col>
  </Row>
</div>

<style>
  .ads-form-item {
    --_mb: var(--ads-form-item-margin-bottom);
    box-sizing: border-box;
    margin: 0 0 var(--_mb);
    padding: 0;
    color: var(--ads-color-text);
    font-size: var(--ads-font-size);
    line-height: var(--ads-control-line-height);
    vertical-align: top;
  }

  .ads-form-item-hidden {
    display: none;
  }

  .ads-form-item-inline {
    --_mb: 0px;
    display: flex;
    flex: none;
    margin-inline-end: 16px;
  }

  /* The label column. */
  .ads-form-item-label-box {
    display: flex;
    align-items: center;
    min-height: var(--ads-control-height);
    box-sizing: border-box;
  }

  .ads-form-item-label-end {
    justify-content: flex-end;
    text-align: end;
  }

  .ads-form-item-label-start {
    justify-content: flex-start;
    text-align: start;
  }

  .ads-form-item-label {
    position: relative;
    display: inline-flex;
    align-items: center;
    min-width: 0;
    max-width: 100%;
    min-height: var(--ads-control-height);
    color: var(--ads-form-label-color);
    font-size: var(--ads-form-label-font-size);
    white-space: nowrap;
    overflow: hidden;
  }

  .ads-form-item-label-wrap .ads-form-item-label {
    white-space: normal;
    overflow: visible;
    overflow-wrap: anywhere;
  }

  /*
   * The star and the colon are elements with `aria-hidden`, not generated content: generated content is part of the
   * accessible name of the control, and "star Username colon" is not its name. Without a colon (colon={false}, inline
   * layout) the room after the label is kept with a no-break space, so labels line up either way.
   */
  .ads-form-item-mark {
    display: inline-block;
    flex: none;
    margin-inline-end: 4px;
    color: var(--ads-form-required-mark-color);
    font-size: var(--ads-form-label-font-size);
    line-height: 1;
  }

  .ads-form-item-colon {
    position: relative;
    flex: none;
    margin-block: 0;
    margin-inline: 2px 8px;
  }

  .ads-form-item-optional {
    margin-inline-start: 4px;
    color: var(--ads-form-extra-color);
  }

  .ads-form-item-tooltip {
    display: inline-flex;
    flex: none;
    align-items: center;
    margin: 0;
    margin-inline-start: 4px;
    padding: 0;
    border: 0;
    border-radius: var(--ads-radius-sm);
    background: none;
    color: var(--ads-form-tooltip-icon-color);
    font: inherit;
    cursor: help;
  }

  .ads-form-item-tooltip:focus-visible {
    outline: var(--ads-focus-outline-width) solid var(--ads-color-focus-outline);
    outline-offset: var(--ads-focus-outline-offset);
  }

  /* Vertical layout: the label sits above the control. */
  .ads-form-item-vertical .ads-form-item-label-box {
    min-height: 0;
    padding-block-end: 8px;
  }

  .ads-form-item-vertical .ads-form-item-label {
    min-height: 0;
    white-space: normal;
    overflow: visible;
  }

  /* Below 576 px the horizontal layout stacks the label above the control (see layout.ts for the columns). */
  @media (max-width: 575px) {
    .ads-form-item-horizontal .ads-form-item-label-box {
      justify-content: flex-start;
      min-height: 0;
      padding-block-end: 8px;
      text-align: start;
    }
  }

  .ads-form-item-inline .ads-form-item-label-box {
    padding-inline-end: 0;
  }

  /* The control column. */
  .ads-form-item-content {
    position: relative;
    display: flex;
    align-items: center;
    min-height: var(--ads-control-height);
    min-width: 0;
  }

  /*
   * The messages and the extra hint live in the space of the item's bottom margin: while they are shown, a negative
   * margin takes the margin away, so one line of message changes neither the height of the item nor the position of the
   * items below it (a longer message pushes them down by the extra lines only).
   */
  .ads-form-item-additional-on {
    margin-bottom: calc(-1 * var(--_mb));
  }

  .ads-form-item-help {
    font-size: var(--ads-font-size);
  }

  .ads-form-item-additional-on > .ads-form-item-help:not(:empty) {
    min-height: 24px;
  }

  .ads-form-item-help-item {
    color: var(--ads-form-help-color);
    animation: ads-form-help-in var(--ads-motion-duration-fast) var(--ads-motion-ease);
  }

  .ads-form-item-help-item-error {
    color: var(--ads-form-error-text);
  }

  .ads-form-item-help-item-warning {
    color: var(--ads-form-warning-text);
  }

  .ads-form-item-extra {
    min-height: 24px;
    color: var(--ads-form-extra-color);
  }

  @keyframes ads-form-help-in {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .ads-form-item-help-item {
      animation: none;
    }
  }
</style>
