// Data of the Input page. The API, methods and token tables are checked against the sources by tests/docs.
import type { ApiRow, DemoMeta, L10n, TokenRow } from './button.ts';

const l = (en: string, ru: string, zh: string): L10n => ({ en, ru, zh });
const demo = (slug: string, title: L10n, description: L10n, column = true): DemoMeta => ({ slug, title, description, column });

export const demos: DemoMeta[] = [
  demo('basic', l('Basic', 'Базовый пример', '基本用法'),
    l('<code>bind:value</code> keeps a variable in sync with the field; <code>onchange</code> receives the new text and the native <code>input</code> event on every edit. A field has no label of its own: name it (see Accessible names).',
      '<code>bind:value</code> синхронизирует переменную с полем; <code>onchange</code> получает новый текст и нативное событие <code>input</code> при каждом изменении. У поля нет собственной подписи: дайте ему имя (см. «Доступные имена»).',
      '<code>bind:value</code> 让变量与输入框保持同步；每次编辑时 <code>onchange</code> 会收到新文本和原生 <code>input</code> 事件。输入框自身没有标签，请为其命名（见“可访问名称”）。')),
  demo('sizes', l('Sizes', 'Размеры', '三种大小'),
    l('<code>large</code> is 40px high, <code>medium</code> 32px, <code>small</code> 24px. <code>middle</code> and <code>default</code> are accepted as compatibility aliases of <code>medium</code>.',
      '<code>large</code> — 40px, <code>medium</code> — 32px, <code>small</code> — 24px. <code>middle</code> и <code>default</code> принимаются как совместимые алиасы <code>medium</code>.',
      '<code>large</code> 高 40px，<code>medium</code> 32px，<code>small</code> 24px。<code>middle</code> 与 <code>default</code> 作为 <code>medium</code> 的兼容别名被接受。')),
  demo('variants', l('Variants', 'Варианты', '形态变体'),
    l('Four looks: <code>outlined</code>, <code>filled</code>, <code>borderless</code> and <code>underlined</code>. The borderless field draws a focus outline, because it has no border to change.',
      'Четыре вида: <code>outlined</code>, <code>filled</code>, <code>borderless</code> и <code>underlined</code>. У поля без границы при фокусе рисуется контур, потому что менять нечего.',
      '四种形态：<code>outlined</code>、<code>filled</code>、<code>borderless</code> 与 <code>underlined</code>。无边框形态在聚焦时会绘制轮廓，因为没有边框可变。')),
  demo('status', l('Status', 'Статус', '自定义状态'),
    l('<code>error</code> and <code>warning</code> change the look; <code>error</code> also sets <code>aria-invalid</code>. The statuses combine with every variant.',
      '<code>error</code> и <code>warning</code> меняют вид; <code>error</code> ещё ставит <code>aria-invalid</code>. Статусы сочетаются с любым вариантом.',
      '<code>error</code> 与 <code>warning</code> 会改变外观；<code>error</code> 还会设置 <code>aria-invalid</code>。状态可与任何形态组合。')),
  demo('disabled', l('Disabled and read-only', 'Отключённое и только для чтения', '禁用与只读'),
    l('A disabled field is natively disabled: it is not focusable and is not submitted. A read-only field can be focused and copied but not edited; it has no clear button.',
      'Отключённое поле нативно disabled: не получает фокус и не отправляется. Поле только для чтения получает фокус и копируется, но не редактируется; кнопки очистки у него нет.',
      '禁用的输入框使用原生 disabled：无法聚焦，也不会被提交。只读输入框可聚焦、可复制但不可编辑，且没有清除按钮。')),
  demo('affixes', l('Prefix and suffix', 'Префикс и суффикс', '前缀与后缀'),
    l('<code>prefix</code> and <code>suffix</code> take plain text or a snippet and sit inside the border. The input keeps its place when they appear or disappear.',
      '<code>prefix</code> и <code>suffix</code> принимают текст или snippet и находятся внутри границы. Поле остаётся на месте, когда они появляются или исчезают.',
      '<code>prefix</code> 与 <code>suffix</code> 可传入文本或 snippet，位于边框内部。它们出现或消失时输入框保持原位。')),
  demo('addons', l('Addons', 'Дополнения снаружи', '前置/后置标签'),
    l('<code>addonBefore</code> and <code>addonAfter</code> are cells outside the border, plain text or a snippet. React marks them deprecated in favor of <code>Space.Compact</code>, which this library does not have yet.',
      '<code>addonBefore</code> и <code>addonAfter</code> — ячейки снаружи границы: текст или snippet. В React они помечены как устаревшие в пользу <code>Space.Compact</code>, которого в этой библиотеке пока нет.',
      '<code>addonBefore</code> 与 <code>addonAfter</code> 是边框外的单元格，可为文本或 snippet。React 已将其标为弃用（推荐 <code>Space.Compact</code>），本库暂无该组件。')),
  demo('clear', l('Clear button', 'Кнопка очистки', '可清除'),
    l('<code>allowClear</code> shows a native button while there is text. A press does not take focus from the field, and focus stays in it afterwards. The object form sets the accessible name, the tab index and the icon.',
      '<code>allowClear</code> показывает нативную кнопку, пока есть текст. Нажатие не забирает фокус у поля, и после него фокус остаётся в поле. Объектная форма задаёт доступное имя, tabindex и иконку.',
      '<code>allowClear</code> 在有文本时显示原生按钮。点击不会夺走输入框的焦点，之后焦点仍留在输入框。对象形式可设置可访问名称、tabindex 与图标。')),
  demo('count', l('Character count', 'Счётчик символов', '字数统计'),
    l('<code>showCount</code> shows the length; with <code>maxlength</code> it shows <code>n / max</code> and the browser stops the input at the limit. The object form formats the text. The count is joined to the field by <code>aria-describedby</code>.',
      '<code>showCount</code> показывает длину; с <code>maxlength</code> — <code>n / max</code>, а браузер не даёт ввести больше. Объектная форма форматирует текст. Счётчик связан с полем через <code>aria-describedby</code>.',
      '<code>showCount</code> 显示长度；配合 <code>maxlength</code> 显示 <code>n / max</code>，浏览器会在上限处阻止输入。对象形式可格式化文本。计数通过 <code>aria-describedby</code> 与输入框关联。')),
  demo('count-config', l('Custom count logic', 'Своя логика подсчёта', '自定义计数逻辑'),
    l('<code>count.max</code> is a soft limit: past it the count turns red and <code>aria-invalid</code> is set, the text is kept. <code>strategy</code> replaces the count, <code>show</code> can format it, <code>exceedFormatter</code> cuts the text past the limit.',
      '<code>count.max</code> — мягкий лимит: сверх него счётчик краснеет и ставится <code>aria-invalid</code>, текст сохраняется. <code>strategy</code> заменяет подсчёт, <code>show</code> форматирует его, <code>exceedFormatter</code> обрезает текст сверх лимита.',
      '<code>count.max</code> 是软上限：超出后计数变红并设置 <code>aria-invalid</code>，文本保留。<code>strategy</code> 替换计数方式，<code>show</code> 可格式化，<code>exceedFormatter</code> 会截断超出的文本。')),
  demo('controlled', l('Controlled input and Enter', 'Управление из родителя и Enter', '受控输入与回车'),
    l('A function binding can refuse an edit: the field goes back to the last accepted text. <code>onpressenter</code> runs on Enter, but not on the Enter that confirms an IME candidate.',
      'Функциональная привязка может отклонить правку: поле вернётся к последнему принятому тексту. <code>onpressenter</code> срабатывает на Enter, но не на Enter, которым подтверждается кандидат IME.',
      '函数绑定可以拒绝某次编辑：输入框会回到上一次被接受的文本。<code>onpressenter</code> 在回车时触发，但确认输入法候选词的回车不会触发。')),
  demo('textarea', l('TextArea', 'Многострочное поле', '文本域'),
    l('<code>InputTextArea</code> is a native <code>&lt;textarea&gt;</code> with the same value, clear, count, status, size and variant props. The clear button sits at the top corner and the count has its own row, so neither covers the text.',
      '<code>InputTextArea</code> — нативный <code>&lt;textarea&gt;</code> с теми же value, очисткой, счётчиком, статусом, размером и вариантом. Кнопка очистки в верхнем углу, а у счётчика своя строка: текст они не закрывают.',
      '<code>InputTextArea</code> 是原生 <code>&lt;textarea&gt;</code>，具有相同的 value、清除、计数、状态、大小与形态属性。清除按钮在右上角，计数占独立一行，都不会遮挡文本。')),
  demo('autosize', l('Auto size', 'Автовысота', '自适应高度'),
    l('<code>autoSize</code> sets the height to the content, within <code>minRows</code> and <code>maxRows</code> lines; past <code>maxRows</code> the field scrolls. It is measured again when the text, the width or the font changes.',
      '<code>autoSize</code> подгоняет высоту под содержимое в пределах <code>minRows</code> и <code>maxRows</code> строк; сверх <code>maxRows</code> поле прокручивается. Высота пересчитывается при изменении текста, ширины или шрифта.',
      '<code>autoSize</code> 让高度随内容变化，范围为 <code>minRows</code> 到 <code>maxRows</code> 行；超过 <code>maxRows</code> 后出现滚动。文本、宽度或字体变化时会重新测量。')),
  demo('password', l('Password', 'Пароль', '密码框'),
    l('<code>InputPassword</code> toggles between <code>type="password"</code> and <code>type="text"</code> with a native button named "Show password"; <code>aria-pressed</code> follows <code>visible</code>. Use <code>bind:visible</code>, <code>onvisiblechange</code>, <code>visibilityToggle</code> and <code>iconRender</code> to control it.',
      '<code>InputPassword</code> переключает <code>type="password"</code> и <code>type="text"</code> нативной кнопкой «Show password»; <code>aria-pressed</code> следует за <code>visible</code>. Управляйте через <code>bind:visible</code>, <code>onvisiblechange</code>, <code>visibilityToggle</code> и <code>iconRender</code>.',
      '<code>InputPassword</code> 用名为 “Show password” 的原生按钮在 <code>type="password"</code> 与 <code>type="text"</code> 间切换；<code>aria-pressed</code> 跟随 <code>visible</code>。可通过 <code>bind:visible</code>、<code>onvisiblechange</code>、<code>visibilityToggle</code> 与 <code>iconRender</code> 控制。')),
  demo('search', l('Search', 'Поиск', '搜索框'),
    l('<code>InputSearch</code> calls <code>onsearch(value, event, { source })</code> on a click of the icon or the button, on Enter and on the clear button (<code>source: "clear"</code>). <code>enterButton</code> adds a primary button; <code>loading</code> shows a spinner and ignores the action.',
      '<code>InputSearch</code> вызывает <code>onsearch(value, event, { source })</code> по клику на иконку или кнопку, по Enter и по кнопке очистки (<code>source: "clear"</code>). <code>enterButton</code> добавляет основную кнопку; <code>loading</code> показывает спиннер и игнорирует действие.',
      '点击图标或按钮、按回车、点击清除按钮时，<code>InputSearch</code> 会调用 <code>onsearch(value, event, { source })</code>（清除时 <code>source: "clear"</code>）。<code>enterButton</code> 添加主按钮；<code>loading</code> 显示加载并忽略操作。')),
  demo('otp', l('One-time code', 'Одноразовый код', '一次性验证码'),
    l('<code>InputOTP</code> is a group of single-character inputs. Typing moves focus on, Backspace goes back, the arrow keys move between cells and a pasted code is spread over the cells. <code>onchange</code> fires when every cell is filled, <code>oninput</code> on each change.',
      '<code>InputOTP</code> — группа полей по одному символу. Ввод переводит фокус дальше, Backspace возвращает, стрелки перемещают между ячейками, а вставленный код распределяется по ячейкам. <code>onchange</code> срабатывает, когда заполнены все ячейки, <code>oninput</code> — при каждом изменении.',
      '<code>InputOTP</code> 是由单字符输入框组成的一组。输入后焦点前移，退格后移，方向键在格间移动，粘贴的验证码会分配到各格。全部填满时触发 <code>onchange</code>，每次变化触发 <code>oninput</code>。'), false),
  demo('otp-options', l('One-time code options', 'Параметры кода', '验证码选项'),
    l('<code>mask</code> hides the characters, <code>formatter</code> changes what is shown, <code>separator</code> goes between cells, and <code>size</code>, <code>variant</code>, <code>status</code> and <code>disabled</code> apply to every cell. <code>autocomplete="one-time-code"</code> helps the browser fill a code.',
      '<code>mask</code> скрывает символы, <code>formatter</code> меняет показываемое, <code>separator</code> стоит между ячейками, а <code>size</code>, <code>variant</code>, <code>status</code> и <code>disabled</code> действуют на каждую ячейку. <code>autocomplete="one-time-code"</code> помогает браузеру подставить код.',
      '<code>mask</code> 隐藏字符，<code>formatter</code> 改变显示内容，<code>separator</code> 位于格与格之间，<code>size</code>、<code>variant</code>、<code>status</code> 与 <code>disabled</code> 作用于每一格。<code>autocomplete="one-time-code"</code> 有助于浏览器自动填充验证码。'), false),
  demo('semantic', l('Semantic parts', 'Именованные части', '语义化结构'),
    l('Each component names its parts: <code>classNames</code> adds a class to a part and <code>styles</code> adds inline styles to it. Numbers are written as they are (no automatic <code>px</code>). <code>class</code> and <code>style</code> reach the root.',
      'У каждого компонента есть именованные части: <code>classNames</code> добавляет класс части, <code>styles</code> — инлайн-стили. Числа записываются как есть (без автоматического <code>px</code>). <code>class</code> и <code>style</code> попадают на корень.',
      '每个组件都有命名的结构部分：<code>classNames</code> 为其添加类名，<code>styles</code> 添加内联样式。数字按原样写入（不自动加 <code>px</code>）。<code>class</code> 与 <code>style</code> 作用于根元素。')),
  demo('methods', l('Focus and blur', 'Фокус и blur', '聚焦与失焦'),
    l('<code>focus()</code> accepts <code>preventScroll</code> and <code>cursor</code> (<code>start</code>, <code>end</code> or <code>all</code>, which selects the text); <code>blur()</code> removes focus. They are methods of the component instance, through <code>bind:this</code>.',
      '<code>focus()</code> принимает <code>preventScroll</code> и <code>cursor</code> (<code>start</code>, <code>end</code> или <code>all</code> — выделить текст); <code>blur()</code> снимает фокус. Это методы экземпляра компонента, через <code>bind:this</code>.',
      '<code>focus()</code> 接受 <code>preventScroll</code> 与 <code>cursor</code>（<code>start</code>、<code>end</code> 或选中全部文本的 <code>all</code>）；<code>blur()</code> 让其失焦。它们是组件实例的方法，通过 <code>bind:this</code> 调用。')),
  demo('labels', l('Accessible names', 'Доступные имена', '可访问名称'),
    l('A field has no label of its own. Name it with an external <code>&lt;label for&gt;</code>, <code>aria-label</code> or <code>aria-labelledby</code>; add hints with <code>aria-describedby</code> and a tooltip with <code>title</code>. Every attribute is forwarded to the native field.',
      'У поля нет собственной подписи. Назовите его внешним <code>&lt;label for&gt;</code>, <code>aria-label</code> или <code>aria-labelledby</code>; подсказки — через <code>aria-describedby</code>, всплывающий текст — через <code>title</code>. Все атрибуты передаются нативному полю.',
      '输入框自身没有标签。请使用外部 <code>&lt;label for&gt;</code>、<code>aria-label</code> 或 <code>aria-labelledby</code> 命名；用 <code>aria-describedby</code> 添加提示，用 <code>title</code> 添加气泡提示。所有属性都会转发给原生输入框。')),
  demo('native', l('Forms and native attributes', 'Формы и нативные атрибуты', '表单与原生属性'),
    l('The fields are real inputs, so <code>name</code>, <code>required</code> and <code>type</code> work in a form and the form submits their text. A native reset does not change the state of the components: reset it in <code>onreset</code>.',
      'Поля — настоящие input, поэтому <code>name</code>, <code>required</code> и <code>type</code> работают в форме, и форма отправляет их текст. Нативный сброс не меняет состояние компонентов: сбросьте его в <code>onreset</code>.',
      '这些输入框是真正的 input，因此 <code>name</code>、<code>required</code> 与 <code>type</code> 在表单中有效，表单会提交它们的文本。原生重置不会改变组件状态：请在 <code>onreset</code> 中重置状态。'))
];

const row = (name: string, description: L10n, type: string, def = '—'): ApiRow => ({ name, description, type, default: def });
const same = row;
const SAME = l('As in <code>Input</code>.', 'Как у <code>Input</code>.', '与 <code>Input</code> 相同。');
const sameRow = (name: string, type: string, def = '—'): ApiRow => same(name, SAME, type, def);

const SIZE_TYPE = "'large' | 'medium' | 'middle' | 'small' | 'default'";
const VARIANT_TYPE = "'outlined' | 'filled' | 'borderless' | 'underlined'";
const STYLE_TYPE = (parts: string) => `Partial<Record<${parts}, Record<string, string | number>>>`;
const CLASS_TYPE = (parts: string) => `Partial<Record<${parts}, string>>`;
const INPUT_PARTS = "'root' | 'prefix' | 'input' | 'suffix' | 'clear' | 'count'";
const SEARCH_PARTS = "'root' | 'prefix' | 'input' | 'suffix' | 'clear' | 'count' | 'button'";
const AREA_PARTS = "'root' | 'textarea' | 'clear' | 'count'";
const OTP_PARTS = "'root' | 'input' | 'separator'";
const CLEAR_TYPE = 'boolean | { clearIcon?: string | Snippet; label?: string; tabIndex?: number }';
const SHOW_COUNT_TYPE = 'boolean | { formatter: (info: CountInfo) => string }';
const COUNT_TYPE = '{ max?: number; strategy?: (value: string) => number; show?: boolean | ((info: CountInfo) => string); exceedFormatter?: (value: string, config: { max: number }) => string }';

const nativeRow = (element: string, extra: L10n): ApiRow =>
  row('native attributes', extra, element, '—');

const sizeRow = row('size', l('Size of the field: 40px, 32px or 24px high. <code>middle</code> and <code>default</code> are compatibility aliases of <code>medium</code>.', 'Размер поля: высота 40px, 32px или 24px. <code>middle</code> и <code>default</code> — совместимые алиасы <code>medium</code>.', '输入框大小：高度 40px、32px 或 24px。<code>middle</code> 与 <code>default</code> 为 <code>medium</code> 的兼容别名。'), SIZE_TYPE, "'medium'");
const variantRow = row('variant', l('Visual variant. The borderless field draws a focus outline.', 'Визуальный вариант. У поля без границы при фокусе рисуется контур.', '视觉形态。无边框形态聚焦时会绘制轮廓。'), VARIANT_TYPE, "'outlined'");
const statusRow = row('status', l('Validation look. <code>error</code> also sets <code>aria-invalid="true"</code>; <code>warning</code> changes only the look.', 'Вид проверки. <code>error</code> ещё ставит <code>aria-invalid="true"</code>; <code>warning</code> меняет только вид.', '校验外观。<code>error</code> 还会设置 <code>aria-invalid="true"</code>；<code>warning</code> 仅改变外观。'), "'error' | 'warning'");

export const apiRows: ApiRow[] = [
  row('value', l('The text. Use <code>bind:value</code> for two-way binding; a plain value is the initial text. A function binding can refuse an edit; <code>null</code> counts as empty.', 'Текст. <code>bind:value</code> — двусторонняя привязка; обычное значение — начальный текст. Функциональная привязка может отклонить правку; <code>null</code> считается пустым.', '文本。使用 <code>bind:value</code> 双向绑定；普通值为初始文本。函数绑定可拒绝某次编辑；<code>null</code> 视为空。'), 'string', "''"),
  row('type', l('Native <code>type</code>. Text-like types are supported (<code>text</code>, <code>search</code>, <code>email</code>, <code>tel</code>, <code>url</code>, <code>number</code>). For a password use <code>InputPassword</code>.', 'Нативный <code>type</code>. Поддерживаются текстовые типы (<code>text</code>, <code>search</code>, <code>email</code>, <code>tel</code>, <code>url</code>, <code>number</code>). Для пароля используйте <code>InputPassword</code>.', '原生 <code>type</code>。支持文本类类型（<code>text</code>、<code>search</code>、<code>email</code>、<code>tel</code>、<code>url</code>、<code>number</code>）。密码请使用 <code>InputPassword</code>。'), 'string', "'text'"),
  row('disabled', l('Native <code>disabled</code>: not focusable, not editable, not submitted.', 'Нативный <code>disabled</code>: нет фокуса, правки и отправки.', '原生 <code>disabled</code>：不可聚焦、不可编辑、不被提交。'), 'boolean', 'false'),
  row('readonly', l('Native <code>readonly</code>: focusable and copyable, not editable. The clear button is not shown.', 'Нативный <code>readonly</code>: получает фокус и копируется, но не редактируется. Кнопка очистки не показывается.', '原生 <code>readonly</code>：可聚焦、可复制但不可编辑，不显示清除按钮。'), 'boolean', 'false'),
  sizeRow,
  variantRow,
  statusRow,
  row('prefix', l('Content before the text, inside the border: plain text or a snippet.', 'Содержимое перед текстом, внутри границы: текст или snippet.', '文本前的内容，位于边框内：文本或 snippet。'), 'string | Snippet'),
  row('suffix', l('Content after the text, inside the border, after the clear button and the count: plain text or a snippet.', 'Содержимое после текста, внутри границы, после кнопки очистки и счётчика: текст или snippet.', '文本后的内容，位于边框内、清除按钮与计数之后：文本或 snippet。'), 'string | Snippet'),
  row('addonBefore', l('A cell before the field, outside the border: plain text or a snippet. While an addon is set, the field sits in a group element; adding the first addon or removing the last one creates the input again (it loses focus).', 'Ячейка перед полем, снаружи границы: текст или snippet. Пока задан addon, поле лежит в элементе-группе; добавление первого addon или удаление последнего пересоздаёт input (он теряет фокус).', '位于输入框前、边框外的单元格：文本或 snippet。设置了标签时输入框位于分组元素内；添加第一个或移除最后一个标签会重新创建 input（失去焦点）。'), 'string | Snippet'),
  row('addonAfter', l('A cell after the field, outside the border: plain text or a snippet.', 'Ячейка после поля, снаружи границы: текст или snippet.', '位于输入框后、边框外的单元格：文本或 snippet。'), 'string | Snippet'),
  row('allowClear', l('Shows a native clear button while there is text (not while disabled or read-only). A press keeps focus in the field and calls <code>onchange("")</code> then <code>onclear</code>. The object form sets the icon, the accessible name (default <code>Clear</code>) and the tab index.', 'Показывает нативную кнопку очистки, пока есть текст (но не при disabled и readonly). Нажатие оставляет фокус в поле и вызывает <code>onchange("")</code>, затем <code>onclear</code>. Объектная форма задаёт иконку, доступное имя (по умолчанию <code>Clear</code>) и tabindex.', '有文本时显示原生清除按钮（禁用或只读时不显示）。点击后焦点留在输入框，并依次调用 <code>onchange("")</code> 与 <code>onclear</code>。对象形式可设置图标、可访问名称（默认 <code>Clear</code>）与 tabindex。'), CLEAR_TYPE, 'false'),
  row('showCount', l('Shows the length of the text. With <code>maxlength</code> it shows <code>n / max</code>. The object form formats the text; the result is a string.', 'Показывает длину текста. С <code>maxlength</code> — <code>n / max</code>. Объектная форма форматирует текст; результат — строка.', '显示文本长度。配合 <code>maxlength</code> 显示 <code>n / max</code>。对象形式可格式化文本，结果为字符串。'), SHOW_COUNT_TYPE, 'false'),
  row('count', l('Character counting: a soft limit <code>max</code> (past it the count is red and the field is invalid, the text is kept), a <code>strategy</code> that replaces the count (the default counts code points), <code>show</code> (as <code>showCount</code>, and it wins over it) and an <code>exceedFormatter</code> that cuts the text.', 'Подсчёт символов: мягкий лимит <code>max</code> (сверх него счётчик красный, поле невалидно, текст сохраняется), <code>strategy</code> заменяет подсчёт (по умолчанию считаются code points), <code>show</code> (как <code>showCount</code>, и он главнее) и <code>exceedFormatter</code>, обрезающий текст.', '字符计数：软上限 <code>max</code>（超出后计数变红、输入框无效，文本保留）、替换计数方式的 <code>strategy</code>（默认按 code point 计数）、<code>show</code>（同 <code>showCount</code>，且优先于它）以及截断文本的 <code>exceedFormatter</code>。'), COUNT_TYPE),
  row('maxlength', l('Native <code>maxlength</code>: the browser stops the input at the limit. For a limit that only warns use <code>count.max</code>.', 'Нативный <code>maxlength</code>: браузер не даёт ввести больше. Для лимита, который лишь предупреждает, используйте <code>count.max</code>.', '原生 <code>maxlength</code>：浏览器会在上限处阻止输入。仅做提醒的上限请使用 <code>count.max</code>。'), 'number'),
  row('onchange', l('Called once per user edit with the new text and the native <code>input</code> event, as <code>onChange</code> in React. Not called when the parent changes <code>value</code>, nor while disabled. The native <code>oninput</code> is forwarded as well and runs first.', 'Вызывается один раз на каждую правку с новым текстом и нативным событием <code>input</code>, как <code>onChange</code> в React. Не вызывается при изменении <code>value</code> родителем и при disabled. Нативный <code>oninput</code> тоже пробрасывается и срабатывает первым.', '每次用户编辑调用一次，参数为新文本和原生 <code>input</code> 事件，等同 React 的 <code>onChange</code>。父组件修改 <code>value</code> 或禁用时不会调用。原生 <code>oninput</code> 也会转发，且先执行。'), '(value: string, event: Event) => void'),
  row('onpressenter', l('Called on Enter, but not on the Enter that confirms an IME candidate.', 'Вызывается по Enter, но не по Enter, подтверждающему кандидат IME.', '按回车时调用；确认输入法候选词的回车不会触发。'), '(event: KeyboardEvent) => void'),
  row('onclear', l('Called after the clear button emptied the text.', 'Вызывается после того, как кнопка очистки опустошила текст.', '清除按钮清空文本后调用。'), '(event: MouseEvent) => void'),
  row('classNames', l('Extra classes for the parts, appended to the component\'s own.', 'Дополнительные классы частей, добавляются к собственным.', '各部分的额外类名，追加在组件自身类名之后。'), CLASS_TYPE(INPUT_PARTS)),
  row('styles', l('Inline styles for the parts. Property names are kebab-case or custom properties, numbers are written as they are (no automatic <code>px</code>). They win over the component\'s styles.', 'Инлайн-стили частей. Имена свойств — kebab-case или custom properties, числа записываются как есть (без автоматического <code>px</code>). Они сильнее стилей компонента.', '各部分的内联样式。属性名为 kebab-case 或自定义属性，数字按原样写入（不自动加 <code>px</code>），优先于组件自身样式。'), STYLE_TYPE(INPUT_PARTS)),
  row('class', l('An additional CSS class for the root.', 'Дополнительный CSS-класс корня.', '根元素附加的 CSS 类名。'), 'string'),
  row('style', l('Inline style of the root; <code>styles.root</code> is written after it.', 'Инлайн-стиль корня; <code>styles.root</code> записывается после него.', '根元素的内联样式；<code>styles.root</code> 写在其后。'), 'string'),
  nativeRow('HTMLInputAttributes', l('Native attributes of the input (<code>id</code>, <code>name</code>, <code>placeholder</code>, <code>required</code>, <code>autocomplete</code>, <code>inputmode</code>, <code>title</code>, <code>aria-*</code>, <code>data-*</code>, <code>onfocus</code>, <code>onblur</code>, <code>onkeydown</code>, <code>oncompositionstart</code> and others) are forwarded to the <code>&lt;input&gt;</code>. The component owns <code>value</code>, <code>disabled</code>, <code>readonly</code>, <code>maxlength</code> and <code>onchange</code>.', 'Нативные атрибуты input (<code>id</code>, <code>name</code>, <code>placeholder</code>, <code>required</code>, <code>autocomplete</code>, <code>inputmode</code>, <code>title</code>, <code>aria-*</code>, <code>data-*</code>, <code>onfocus</code>, <code>onblur</code>, <code>onkeydown</code>, <code>oncompositionstart</code> и другие) передаются в <code>&lt;input&gt;</code>. Компонент управляет <code>value</code>, <code>disabled</code>, <code>readonly</code>, <code>maxlength</code> и <code>onchange</code>.', 'input 的原生属性（<code>id</code>、<code>name</code>、<code>placeholder</code>、<code>required</code>、<code>autocomplete</code>、<code>inputmode</code>、<code>title</code>、<code>aria-*</code>、<code>data-*</code>、<code>onfocus</code>、<code>onblur</code>、<code>onkeydown</code>、<code>oncompositionstart</code> 等）会转发到 <code>&lt;input&gt;</code>。组件自身管理 <code>value</code>、<code>disabled</code>、<code>readonly</code>、<code>maxlength</code> 与 <code>onchange</code>。'))
];

export const textAreaApiRows: ApiRow[] = [
  sameRow('value', 'string', "''"),
  sameRow('disabled', 'boolean', 'false'),
  sameRow('readonly', 'boolean', 'false'),
  sameRow('size', SIZE_TYPE, "'medium'"),
  sameRow('variant', VARIANT_TYPE, "'outlined'"),
  sameRow('status', "'error' | 'warning'"),
  same('allowClear', l('As in <code>Input</code>; the button sits at the top corner of the box.', 'Как у <code>Input</code>; кнопка стоит в верхнем углу поля.', '与 <code>Input</code> 相同；按钮位于输入框右上角。'), CLEAR_TYPE, 'false'),
  same('showCount', l('As in <code>Input</code>; the count has its own row at the bottom of the box.', 'Как у <code>Input</code>; у счётчика своя строка внизу поля.', '与 <code>Input</code> 相同；计数在输入框底部独占一行。'), SHOW_COUNT_TYPE, 'false'),
  sameRow('count', COUNT_TYPE),
  sameRow('maxlength', 'number'),
  row('autoSize', l('The height follows the content, within <code>minRows</code> and <code>maxRows</code> lines of the line height (a minimum of one line); past <code>maxRows</code> the field scrolls. It is measured again when the text, the width or the font changes. The manual resize handle is hidden while it is on.', 'Высота следует за содержимым в пределах <code>minRows</code> и <code>maxRows</code> строк (минимум одна строка); сверх <code>maxRows</code> поле прокручивается. Пересчитывается при изменении текста, ширины или шрифта. Ручное изменение размера при этом скрыто.', '高度跟随内容，范围为 <code>minRows</code> 到 <code>maxRows</code> 行（至少一行）；超过 <code>maxRows</code> 后滚动。文本、宽度或字体变化时重新测量。开启时隐藏手动调整手柄。'), 'boolean | { minRows?: number; maxRows?: number }', 'false'),
  sameRow('onchange', '(value: string, event: Event) => void'),
  sameRow('onpressenter', '(event: KeyboardEvent) => void'),
  sameRow('onclear', '(event: MouseEvent) => void'),
  same('classNames', l('Extra classes for the parts, appended to the component\'s own.', 'Дополнительные классы частей, добавляются к собственным.', '各部分的额外类名，追加在组件自身类名之后。'), CLASS_TYPE(AREA_PARTS)),
  same('styles', l('Inline styles for the parts; they win over the component\'s styles.', 'Инлайн-стили частей; они сильнее стилей компонента.', '各部分的内联样式，优先于组件自身样式。'), STYLE_TYPE(AREA_PARTS)),
  sameRow('class', 'string'),
  sameRow('style', 'string'),
  nativeRow('HTMLTextareaAttributes', l('Native attributes of the textarea (<code>rows</code>, <code>cols</code>, <code>placeholder</code>, <code>name</code>, <code>id</code>, <code>required</code>, <code>aria-*</code>, <code>data-*</code>, <code>onfocus</code> and others) are forwarded to the <code>&lt;textarea&gt;</code>.', 'Нативные атрибуты textarea (<code>rows</code>, <code>cols</code>, <code>placeholder</code>, <code>name</code>, <code>id</code>, <code>required</code>, <code>aria-*</code>, <code>data-*</code>, <code>onfocus</code> и другие) передаются в <code>&lt;textarea&gt;</code>.', 'textarea 的原生属性（<code>rows</code>、<code>cols</code>、<code>placeholder</code>、<code>name</code>、<code>id</code>、<code>required</code>、<code>aria-*</code>、<code>data-*</code>、<code>onfocus</code> 等）会转发到 <code>&lt;textarea&gt;</code>。'))
];

export const passwordApiRows: ApiRow[] = [
  row('visible', l('Whether the text is shown. Use <code>bind:visible</code> for two-way binding; a plain value is the initial state.', 'Показан ли текст. <code>bind:visible</code> — двусторонняя привязка; обычное значение — начальное состояние.', '文本是否可见。使用 <code>bind:visible</code> 双向绑定；普通值为初始状态。'), 'boolean', 'false'),
  row('visibilityToggle', l('Shows the toggle button. <code>false</code> hides it, so <code>visible</code> is the only control. The object form sets the accessible name (default <code>Show password</code>; the button has <code>aria-pressed</code>, so the name does not change) and the tab index.', 'Показывает кнопку переключения. <code>false</code> скрывает её, и управлять можно только через <code>visible</code>. Объектная форма задаёт доступное имя (по умолчанию <code>Show password</code>; у кнопки есть <code>aria-pressed</code>, поэтому имя не меняется) и tabindex.', '显示切换按钮。<code>false</code> 隐藏按钮，此时只能通过 <code>visible</code> 控制。对象形式可设置可访问名称（默认 <code>Show password</code>；按钮带有 <code>aria-pressed</code>，名称不变）与 tabindex。'), 'boolean | { tabIndex?: number; label?: string }', 'true'),
  row('onvisiblechange', l('Called once per user toggle with the new visibility; not when the parent changes <code>visible</code>.', 'Вызывается один раз на каждое переключение пользователем с новым состоянием; не вызывается, когда родитель меняет <code>visible</code>.', '用户每次切换时调用一次，参数为新的可见状态；父组件修改 <code>visible</code> 时不调用。'), '(visible: boolean) => void'),
  row('iconRender', l('Custom content of the toggle button; it receives the current visibility.', 'Своё содержимое кнопки переключения; получает текущую видимость.', '自定义切换按钮的内容；接收当前的可见状态。'), 'Snippet<[visible: boolean]>')
];

export const searchApiRows: ApiRow[] = [
  row('enterButton', l('A button after the field: <code>true</code> is a primary button with the search icon, a string or a snippet is its content. <code>false</code> leaves only the icon button inside the field. It conflicts with <code>addonAfter</code>: outside production using both throws, in production the button wins.', 'Кнопка после поля: <code>true</code> — основная кнопка с иконкой поиска, строка или snippet — её содержимое. <code>false</code> оставляет только кнопку-иконку внутри поля. Конфликтует с <code>addonAfter</code>: вне production их совместное использование бросает ошибку, в production побеждает кнопка.', '输入框后的按钮：<code>true</code> 为带搜索图标的主按钮，字符串或 snippet 为其内容。<code>false</code> 仅保留框内的图标按钮。与 <code>addonAfter</code> 冲突：非生产环境同时使用会抛错，生产环境以按钮为准。'), 'boolean | string | Snippet', 'false'),
  row('loading', l('Shows a spinner in place of the search icon; the search action (click and Enter) is ignored meanwhile.', 'Показывает спиннер вместо иконки поиска; действие поиска (клик и Enter) игнорируется.', '用加载图标替换搜索图标；加载期间忽略搜索操作（点击与回车）。'), 'boolean', 'false'),
  row('onsearch', l('Called on a click of the icon or the button, on Enter (not while composing) and on the clear button. <code>source</code> is <code>"clear"</code> for the clear button and <code>"input"</code> otherwise; for the clear button the text is empty.', 'Вызывается по клику на иконку или кнопку, по Enter (не во время композиции) и по кнопке очистки. <code>source</code> равен <code>"clear"</code> для кнопки очистки и <code>"input"</code> иначе; для очистки текст пустой.', '点击图标或按钮、按回车（输入法组合期间除外）以及点击清除按钮时调用。清除按钮的 <code>source</code> 为 <code>"clear"</code>，其余为 <code>"input"</code>；清除时文本为空。'), '(value: string, event: Event, info: { source: \'input\' | \'clear\' }) => void'),
  row('searchIcon', l('A custom search icon: plain text or a snippet.', 'Своя иконка поиска: текст или snippet.', '自定义搜索图标：文本或 snippet。'), 'string | Snippet'),
  row('classNames', l('The parts of <code>Input</code> and the search <code>button</code>.', 'Части <code>Input</code> и кнопка поиска <code>button</code>.', '<code>Input</code> 的各部分，以及搜索按钮 <code>button</code>。'), CLASS_TYPE(SEARCH_PARTS)),
  row('styles', l('Inline styles for the same parts.', 'Инлайн-стили тех же частей.', '同样各部分的内联样式。'), STYLE_TYPE(SEARCH_PARTS)),
  row('class / style', l('The root, which wraps the field and the button. <code>type</code> is <code>search</code> unless you set another.', 'Корень, в который входят поле и кнопка. <code>type</code> равен <code>search</code>, если не задан другой.', '根元素，包含输入框与按钮。除非另行设置，<code>type</code> 为 <code>search</code>。'), 'string')
];

export const otpApiRows: ApiRow[] = [
  row('value', l('The characters entered so far, without gaps. Use <code>bind:value</code> for two-way binding; a plain value is the initial text. Cell <code>i</code> shows the <code>i</code>-th character.', 'Введённые символы, без пропусков. <code>bind:value</code> — двусторонняя привязка; обычное значение — начальный текст. Ячейка <code>i</code> показывает <code>i</code>-й символ.', '已输入的字符，无空位。使用 <code>bind:value</code> 双向绑定；普通值为初始文本。第 <code>i</code> 格显示第 <code>i</code> 个字符。'), 'string', "''"),
  row('length', l('Number of cells. A value that is not a positive integer throws outside production and means 6 in production.', 'Число ячеек. Значение, не являющееся положительным целым, вне production бросает ошибку, а в production означает 6.', '格数。非正整数在非生产环境抛错，生产环境按 6 处理。'), 'number', '6'),
  row('mask', l('Hides the characters: <code>true</code> shows a bullet, a string is the single character shown instead. The value is not changed.', 'Скрывает символы: <code>true</code> показывает точку, строка — единственный символ, показываемый вместо. Значение не меняется.', '隐藏字符：<code>true</code> 显示圆点，字符串为替代显示的单个字符。值本身不变。'), 'boolean | string', 'false'),
  row('formatter', l('Maps the whole text to the displayed text; the cell at index <code>i</code> shows the <code>i</code>-th character of the result. The mask wins over it.', 'Преобразует весь текст в отображаемый; ячейка с индексом <code>i</code> показывает <code>i</code>-й символ результата. Маска главнее.', '把整段文本映射为显示文本；第 <code>i</code> 格显示结果的第 <code>i</code> 个字符。mask 优先于它。'), '(value: string) => string'),
  row('separator', l('Rendered after the cell at the given index (not after the last one): plain text, or a snippet that receives the index.', 'Выводится после ячейки с данным индексом (после последней — нет): текст или snippet, получающий индекс.', '渲染在指定索引的格之后（最后一格之后不渲染）：文本，或接收索引的 snippet。'), 'string | Snippet<[index: number]>'),
  row('disabled', l('Disables every cell.', 'Отключает каждую ячейку.', '禁用每个格子。'), 'boolean', 'false'),
  row('size', l('Size of the cells; a cell is as wide as the field is high. <code>middle</code> and <code>default</code> are aliases of <code>medium</code>.', 'Размер ячеек; ячейка так же широка, как поле высоко. <code>middle</code> и <code>default</code> — алиасы <code>medium</code>.', '格子大小；格子宽度等于输入框高度。<code>middle</code> 与 <code>default</code> 为 <code>medium</code> 的别名。'), SIZE_TYPE, "'medium'"),
  row('variant', l('Visual variant of the cells.', 'Визуальный вариант ячеек.', '格子的视觉形态。'), VARIANT_TYPE, "'outlined'"),
  row('status', l('Validation look of the cells; <code>error</code> sets <code>aria-invalid</code> on each.', 'Вид проверки ячеек; <code>error</code> ставит <code>aria-invalid</code> каждой.', '格子的校验外观；<code>error</code> 会给每格设置 <code>aria-invalid</code>。'), "'error' | 'warning'"),
  row('autocomplete', l('Native <code>autocomplete</code> of every cell; <code>one-time-code</code> enables autofill of a code.', 'Нативный <code>autocomplete</code> каждой ячейки; <code>one-time-code</code> включает автозаполнение кода.', '每格的原生 <code>autocomplete</code>；<code>one-time-code</code> 可启用验证码自动填充。'), 'HTMLInputAttributes[\'autocomplete\']'),
  row('onchange', l('Called when every cell is filled, with the whole text; not for a change of <code>value</code> made by the parent.', 'Вызывается, когда заполнены все ячейки, с полным текстом; не вызывается при изменении <code>value</code> родителем.', '所有格子填满时调用，参数为完整文本；父组件修改 <code>value</code> 时不调用。'), '(value: string) => void'),
  row('oninput', l('Called on each change, with one entry per cell (<code>""</code> for an empty one).', 'Вызывается при каждом изменении, по одной записи на ячейку (<code>""</code> для пустой).', '每次变化时调用，每格一项（空格为 <code>""</code>）。'), '(values: string[]) => void'),
  row('classNames', l('Extra classes for the root, the cells (<code>input</code>) and the separator.', 'Дополнительные классы корня, ячеек (<code>input</code>) и разделителя.', '根元素、格子（<code>input</code>）与分隔符的额外类名。'), CLASS_TYPE(OTP_PARTS)),
  row('styles', l('Inline styles for the same parts.', 'Инлайн-стили тех же частей.', '同样各部分的内联样式。'), STYLE_TYPE(OTP_PARTS)),
  row('class', l('An additional CSS class for the root.', 'Дополнительный CSS-класс корня.', '根元素附加的 CSS 类名。'), 'string'),
  row('style', l('Inline style of the root; <code>styles.root</code> is written after it.', 'Инлайн-стиль корня; <code>styles.root</code> записывается после него.', '根元素的内联样式；<code>styles.root</code> 写在其后。'), 'string'),
  nativeRow('HTMLAttributes<HTMLDivElement>', l('Native attributes of the group (<code>id</code>, <code>aria-label</code>, <code>aria-labelledby</code>, <code>aria-describedby</code>, <code>data-*</code>, handlers) are forwarded to the <code>&lt;div&gt;</code>, which keeps <code>role="group"</code>. Each cell is named <code>Character i of n</code> (English; a locale mechanism is planned).', 'Нативные атрибуты группы (<code>id</code>, <code>aria-label</code>, <code>aria-labelledby</code>, <code>aria-describedby</code>, <code>data-*</code>, обработчики) передаются в <code>&lt;div&gt;</code>, у которого остаётся <code>role="group"</code>. Каждая ячейка названа <code>Character i of n</code> (по-английски; механизм локализации запланирован).', '分组的原生属性（<code>id</code>、<code>aria-label</code>、<code>aria-labelledby</code>、<code>aria-describedby</code>、<code>data-*</code>、事件处理器）会转发到 <code>&lt;div&gt;</code>，它保留 <code>role="group"</code>。每格的名称为 <code>Character i of n</code>（英文；本地化机制已列入计划）。'))
];

export interface MethodRow { name: string; description: L10n; type: string }
export const methodRows: MethodRow[] = [
  { name: 'focus', description: l('Moves focus to the field (to the first empty cell of <code>InputOTP</code>). <code>cursor</code> puts the caret at the start or the end, or selects all the text; a type with no selection (<code>email</code>, <code>number</code>) ignores it.', 'Переводит фокус на поле (в <code>InputOTP</code> — на первую пустую ячейку). <code>cursor</code> ставит курсор в начало или конец либо выделяет весь текст; тип без выделения (<code>email</code>, <code>number</code>) его игнорирует.', '让输入框获得焦点（<code>InputOTP</code> 为第一个空格）。<code>cursor</code> 可将光标置于开头或末尾，或选中全部文本；不支持选区的类型（<code>email</code>、<code>number</code>）会忽略它。'), type: "(options?: { preventScroll?: boolean; cursor?: 'start' | 'end' | 'all' }) => void" },
  { name: 'blur', description: l('Removes focus from the field.', 'Снимает фокус с поля.', '让输入框失去焦点。'), type: '() => void' }
];

const t = (name: string, value: string, en: string, ru: string, zh: string): TokenRow => ({ name, value, description: l(en, ru, zh) });
export const tokenRows: TokenRow[] = [
  t('--ads-input-font-size', '14px', 'Font size of a medium field.', 'Размер шрифта поля medium.', '中号输入框字号。'),
  t('--ads-input-font-size-lg', '16px', 'Font size of a large field.', 'Размер шрифта поля large.', '大号输入框字号。'),
  t('--ads-input-font-size-sm', '14px', 'Font size of a small field.', 'Размер шрифта поля small.', '小号输入框字号。'),
  t('--ads-input-padding-block', '4px', 'Vertical padding of a medium field; with the line height and the border it gives the 32px height.', 'Вертикальный отступ поля medium; вместе со строкой и границей даёт высоту 32px.', '中号输入框的垂直内边距；与行高、边框共同得到 32px 的高度。'),
  t('--ads-input-padding-block-lg', '7px', 'Vertical padding of a large field (40px high).', 'Вертикальный отступ поля large (высота 40px).', '大号输入框的垂直内边距（高 40px）。'),
  t('--ads-input-padding-block-sm', '0px', 'Vertical padding of a small field (24px high).', 'Вертикальный отступ поля small (высота 24px).', '小号输入框的垂直内边距（高 24px）。'),
  t('--ads-input-padding-inline', '11px', 'Horizontal padding of a medium field.', 'Горизонтальный отступ поля medium.', '中号输入框的水平内边距。'),
  t('--ads-input-padding-inline-lg', '11px', 'Horizontal padding of a large field.', 'Горизонтальный отступ поля large.', '大号输入框的水平内边距。'),
  t('--ads-input-padding-inline-sm', '7px', 'Horizontal padding of a small field.', 'Горизонтальный отступ поля small.', '小号输入框的水平内边距。'),
  t('--ads-input-radius', '6px', 'Corner radius of a medium field.', 'Радиус скругления поля medium.', '中号输入框圆角半径。'),
  t('--ads-input-radius-lg', '8px', 'Corner radius of a large field.', 'Радиус скругления поля large.', '大号输入框圆角半径。'),
  t('--ads-input-radius-sm', '4px', 'Corner radius of a small field.', 'Радиус скругления поля small.', '小号输入框圆角半径。'),
  t('--ads-input-border-width', '1px', 'Thickness of the border.', 'Толщина границы.', '边框粗细。'),
  t('--ads-input-line-height', '1.5714285714285714', 'Line height of a medium and a small field.', 'Высота строки полей medium и small.', '中号与小号输入框的行高。'),
  t('--ads-input-line-height-lg', '1.5', 'Line height of a large field.', 'Высота строки поля large.', '大号输入框的行高。'),
  t('--ads-input-gap', '4px', 'Space between the text and the prefix, the clear button, the count and the suffix.', 'Отступ между текстом и префиксом, кнопкой очистки, счётчиком и суффиксом.', '文本与前缀、清除按钮、计数、后缀之间的间距。'),
  t('--ads-input-icon-size', '14px', 'Size of the clear, toggle and search icons.', 'Размер иконок очистки, переключения и поиска.', '清除、切换与搜索图标的大小。'),
  t('--ads-input-addon-padding-inline', '11px', 'Horizontal padding of an addon cell.', 'Горизонтальный отступ ячейки addon.', '前置/后置标签单元格的水平内边距。'),
  t('--ads-input-otp-gap', '8px', 'Space between the cells of <code>InputOTP</code>.', 'Отступ между ячейками <code>InputOTP</code>.', '<code>InputOTP</code> 各格之间的间距。'),
  t('--ads-input-bg', '#ffffff', 'Background of the field.', 'Фон поля.', '输入框背景。'),
  t('--ads-input-bg-hover', '#ffffff', 'Background on hover.', 'Фон при наведении.', '悬停时的背景。'),
  t('--ads-input-bg-active', '#ffffff', 'Background while focused.', 'Фон в фокусе.', '聚焦时的背景。'),
  t('--ads-input-border', '#d9d9d9', 'Border (the boundary of the field). <code>tokens-accessible.css</code> darkens it to #737373 to keep 3:1 against the page.', 'Граница (контур поля). <code>tokens-accessible.css</code> затемняет её до #737373, чтобы сохранить 3:1 к фону страницы.', '边框（输入框的边界）。<code>tokens-accessible.css</code> 将其加深为 #737373，以与页面保持 3:1。'),
  t('--ads-input-border-hover', '#4096ff', 'Border on hover. <code>tokens-accessible.css</code> darkens it to #0958d9 (#4096ff is 2.99:1).', 'Граница при наведении. <code>tokens-accessible.css</code> затемняет её до #0958d9 (#4096ff даёт 2.99:1).', '悬停时的边框。<code>tokens-accessible.css</code> 将其加深为 #0958d9（#4096ff 为 2.99:1）。'),
  t('--ads-input-border-active', '#1677ff', 'Border while focused. <code>tokens-accessible.css</code> darkens it to #1668dc.', 'Граница в фокусе. <code>tokens-accessible.css</code> затемняет её до #1668dc.', '聚焦时的边框。<code>tokens-accessible.css</code> 将其加深为 #1668dc。'),
  t('--ads-input-shadow-active', '0 0 0 2px rgba(5, 145, 255, 0.1)', 'Shadow ring while focused.', 'Кольцо-тень в фокусе.', '聚焦时的阴影光圈。'),
  t('--ads-input-placeholder', 'rgba(0, 0, 0, 0.25)', 'Colour of the placeholder (ours: the documentation lists none). <code>tokens-accessible.css</code> uses #6b6b6b for 4.5:1.', 'Цвет плейсхолдера (наш: в документации его нет). <code>tokens-accessible.css</code> берёт #6b6b6b ради 4.5:1.', '占位符颜色（自定：文档未给出）。<code>tokens-accessible.css</code> 使用 #6b6b6b 以达到 4.5:1。'),
  t('--ads-input-icon-color', 'rgba(0, 0, 0, 0.45)', 'Colour of the clear, toggle and search icons. <code>tokens-accessible.css</code> uses #737373.', 'Цвет иконок очистки, переключения и поиска. <code>tokens-accessible.css</code> берёт #737373.', '清除、切换与搜索图标的颜色。<code>tokens-accessible.css</code> 使用 #737373。'),
  t('--ads-input-icon-color-hover', 'rgba(0, 0, 0, 0.65)', 'Colour of those icons on hover.', 'Цвет этих иконок при наведении.', '这些图标悬停时的颜色。'),
  t('--ads-input-count-color', 'rgba(0, 0, 0, 0.45)', 'Colour of the count. <code>tokens-accessible.css</code> uses #666666 for 4.5:1. Past a soft limit it is <code>--ads-color-danger-text</code>.', 'Цвет счётчика. <code>tokens-accessible.css</code> берёт #666666 ради 4.5:1. Сверх мягкого лимита — <code>--ads-color-danger-text</code>.', '计数颜色。<code>tokens-accessible.css</code> 使用 #666666 以达到 4.5:1。超出软上限时为 <code>--ads-color-danger-text</code>。'),
  t('--ads-input-addon-bg', 'rgba(0, 0, 0, 0.02)', 'Background of an addon cell.', 'Фон ячейки addon.', '前置/后置标签单元格背景。'),
  t('--ads-input-filled-bg', 'rgba(0, 0, 0, 0.04)', 'Background of the <code>filled</code> variant.', 'Фон варианта <code>filled</code>.', '<code>filled</code> 形态的背景。'),
  t('--ads-input-filled-bg-hover', 'rgba(0, 0, 0, 0.06)', 'Background of the <code>filled</code> variant on hover (ours).', 'Фон варианта <code>filled</code> при наведении (наш).', '<code>filled</code> 形态悬停时的背景（自定）。'),
  t('--ads-input-disabled-bg', 'rgba(0, 0, 0, 0.04)', 'Background of a disabled field.', 'Фон отключённого поля.', '禁用输入框的背景。'),
  t('--ads-input-disabled-border', '#d9d9d9', 'Border of a disabled field.', 'Граница отключённого поля.', '禁用输入框的边框。'),
  t('--ads-input-error', '#ff4d4f', 'Border of the <code>error</code> status.', 'Граница статуса <code>error</code>.', '<code>error</code> 状态的边框。'),
  t('--ads-input-error-hover', '#ff7875', 'Border of the <code>error</code> status on hover. <code>tokens-accessible.css</code> darkens it to #d9363e.', 'Граница статуса <code>error</code> при наведении. <code>tokens-accessible.css</code> затемняет её до #d9363e.', '<code>error</code> 状态悬停时的边框。<code>tokens-accessible.css</code> 将其加深为 #d9363e。'),
  t('--ads-input-error-shadow', '0 0 0 2px rgba(255, 38, 5, 0.06)', 'Shadow ring of the <code>error</code> status while focused.', 'Кольцо-тень статуса <code>error</code> в фокусе.', '<code>error</code> 状态聚焦时的阴影光圈。'),
  t('--ads-input-error-bg', '#fff2f0', 'Background of the <code>filled</code> variant with the <code>error</code> status.', 'Фон варианта <code>filled</code> со статусом <code>error</code>.', '<code>filled</code> 形态在 <code>error</code> 状态下的背景。'),
  t('--ads-input-warning', '#faad14', 'Border of the <code>warning</code> status. <code>tokens-accessible.css</code> darkens it to #ad6800 (1.9:1 otherwise).', 'Граница статуса <code>warning</code>. <code>tokens-accessible.css</code> затемняет её до #ad6800 (иначе 1.9:1).', '<code>warning</code> 状态的边框。<code>tokens-accessible.css</code> 将其加深为 #ad6800（否则为 1.9:1）。'),
  t('--ads-input-warning-hover', '#ffc53d', 'Border of the <code>warning</code> status on hover (ours). <code>tokens-accessible.css</code> uses #d46b08.', 'Граница статуса <code>warning</code> при наведении (наш). <code>tokens-accessible.css</code> берёт #d46b08.', '<code>warning</code> 状态悬停时的边框（自定）。<code>tokens-accessible.css</code> 使用 #d46b08。'),
  t('--ads-input-warning-shadow', '0 0 0 2px rgba(255, 215, 5, 0.1)', 'Shadow ring of the <code>warning</code> status while focused.', 'Кольцо-тень статуса <code>warning</code> в фокусе.', '<code>warning</code> 状态聚焦时的阴影光圈。'),
  t('--ads-input-warning-bg', '#fffbe6', 'Background of the <code>filled</code> variant with the <code>warning</code> status.', 'Фон варианта <code>filled</code> со статусом <code>warning</code>.', '<code>filled</code> 形态在 <code>warning</code> 状态下的背景。')
];
