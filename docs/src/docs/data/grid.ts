// Data of the Grid page (Row, Col and Breakpoints). The tables are checked against the sources by tests/docs/grid-page.test.ts.
// There is no method table and no token table: Row and Col have no methods and the grid draws nothing (specs/grid.md).
import type { ApiRow, DemoMeta } from './button.ts';

const l = (en: string, ru: string, zh: string) => ({ en, ru, zh });

export const demos: DemoMeta[] = [
  {
    slug: 'basic',
    title: l('Basic', 'Базовый пример', '基本用法'),
    description: l(
      'Put <code>Col</code> elements in a <code>Row</code>. A column takes <code>span</code> of the 24 columns; the Row is as wide as its parent.',
      'Элементы <code>Col</code> кладут в <code>Row</code>. Колонка занимает <code>span</code> из 24 колонок; Row ровно по ширине родителя.',
      '把 <code>Col</code> 放进 <code>Row</code>。一列占 24 格中的 <code>span</code> 格；Row 与父元素等宽。'
    )
  },
  {
    slug: 'gutter',
    title: l('Gutter', 'Отступы между колонками', '栅格间隔'),
    description: l(
      '<code>gutter</code> is the space between columns: pixels, a CSS length, a value per breakpoint, or <code>[horizontal, vertical]</code>. It is a flex <code>gap</code>, so the Row never grows past its parent and the page does not scroll sideways.',
      '<code>gutter</code> — отступ между колонками: пиксели, CSS-длина, значение для каждого брейкпоинта или <code>[горизонтальный, вертикальный]</code>. Это flex-<code>gap</code>, поэтому Row не выходит за родителя и страница не получает горизонтальный скролл.',
      '<code>gutter</code> 是列之间的间隔：像素值、CSS 长度、按断点给出的值，或 <code>[水平, 垂直]</code>。它基于 flex 的 <code>gap</code>，因此 Row 不会超出父元素，页面也不会出现横向滚动条。'
    )
  },
  {
    slug: 'offset',
    title: l('Offset', 'Сдвиг колонки', '左右偏移'),
    description: l(
      '<code>offset</code> skips that many columns before the column, so <code>offset={4}</code> moves it four columns to the inline end.',
      '<code>offset</code> пропускает столько колонок перед колонкой: <code>offset={4}</code> сдвигает её на четыре колонки к концу строки.',
      '<code>offset</code> 会在该列前空出相应的格数，例如 <code>offset={4}</code> 会让它向行尾方向偏移四格。'
    )
  },
  {
    slug: 'sort',
    title: l('Push and pull', 'Push и pull', '栅格排序'),
    description: l(
      '<code>push</code> and <code>pull</code> move a column visually. The DOM order, the Tab order and the reading order of a screen reader stay as written; with both set, the column moves by the difference.',
      '<code>push</code> и <code>pull</code> сдвигают колонку только визуально. Порядок в DOM, порядок Tab и порядок чтения скринридером остаются как написано; если заданы оба, колонка сдвигается на их разность.',
      '<code>push</code> 与 <code>pull</code> 只在视觉上移动列。DOM 顺序、Tab 顺序和读屏顺序保持不变；两者同时设置时，按差值移动。'
    )
  },
  {
    slug: 'justify',
    title: l('Justify', 'Горизонтальное расположение', '排版'),
    description: l(
      '<code>justify</code> arranges the columns of a line: <code>start</code>, <code>center</code>, <code>end</code>, <code>space-between</code>, <code>space-around</code> and <code>space-evenly</code>.',
      '<code>justify</code> расставляет колонки строки: <code>start</code>, <code>center</code>, <code>end</code>, <code>space-between</code>, <code>space-around</code> и <code>space-evenly</code>.',
      '<code>justify</code> 决定一行中各列的排列方式：<code>start</code>、<code>center</code>、<code>end</code>、<code>space-between</code>、<code>space-around</code> 与 <code>space-evenly</code>。'
    )
  },
  {
    slug: 'align',
    title: l('Align', 'Вертикальное выравнивание', '对齐'),
    description: l(
      '<code>align</code> aligns the columns of a line vertically: <code>top</code> (the default), <code>middle</code>, <code>bottom</code> and <code>stretch</code>.',
      '<code>align</code> выравнивает колонки строки по вертикали: <code>top</code> (по умолчанию), <code>middle</code>, <code>bottom</code> и <code>stretch</code>.',
      '<code>align</code> 决定一行中各列的垂直对齐方式：<code>top</code>（默认）、<code>middle</code>、<code>bottom</code> 与 <code>stretch</code>。'
    )
  },
  {
    slug: 'order',
    title: l('Order', 'Порядок', '排序'),
    description: l(
      '<code>order</code> changes how the columns are drawn. It does not change their place in the DOM: Tab and screen readers keep the written order, so do not use it to fix a reading order.',
      '<code>order</code> меняет порядок отрисовки колонок, но не их место в DOM: Tab и скринридеры сохраняют написанный порядок, поэтому им не исправляют порядок чтения.',
      '<code>order</code> 改变列的绘制顺序，但不改变它们在 DOM 中的位置：Tab 与读屏仍按书写顺序，因此不要用它来调整阅读顺序。'
    )
  },
  {
    slug: 'flex',
    title: l('Flex', 'Flex', 'Flex 填充'),
    description: l(
      '<code>flex</code> takes a number (<code>n n auto</code>), a single length such as <code>100px</code> (a fixed width, <code>0 0 100px</code>), or any CSS <code>flex</code> value as a string.',
      '<code>flex</code> принимает число (<code>n n auto</code>), одну длину вроде <code>100px</code> (фиксированная ширина, <code>0 0 100px</code>) или любое CSS-значение <code>flex</code> строкой.',
      '<code>flex</code> 可以是数字（<code>n n auto</code>）、单个长度如 <code>100px</code>（固定宽度，即 <code>0 0 100px</code>），或字符串形式的任意 CSS <code>flex</code> 值。'
    )
  },
  {
    slug: 'wrap',
    title: l('Wrap', 'Перенос', '换行'),
    description: l(
      'By default a column that does not fit moves to the next line as a whole. With <code>wrap={false}</code> the columns stay on one line, keep their widths and run past the end of the Row, so the parent can scroll.',
      'По умолчанию колонка, которая не помещается, переносится на следующую строку целиком. С <code>wrap={false}</code> колонки остаются в одной строке, сохраняют ширину и выходят за конец Row, поэтому родитель может прокручиваться.',
      '默认情况下，放不下的列会整列换到下一行。设置 <code>wrap={false}</code> 后，列保持在同一行并保留各自宽度，超出 Row 的末端，可由父元素滚动。'
    )
  },
  {
    slug: 'nested',
    title: l('Nesting', 'Вложенные Row', '嵌套'),
    description: l(
      'A <code>Row</code> in a <code>Col</code> fills the content box of that column and has a gutter of its own. An inner Row without a <code>gutter</code> does not take the gutter of the outer one.',
      '<code>Row</code> внутри <code>Col</code> занимает всю область содержимого колонки и имеет собственный gutter. Внутренний Row без <code>gutter</code> не наследует gutter внешнего.',
      '<code>Col</code> 中的 <code>Row</code> 会填满该列的内容区域，并拥有自己的 gutter。没有设置 <code>gutter</code> 的内层 Row 不会继承外层的 gutter。'
    )
  },
  {
    slug: 'hidden',
    title: l('Hide a column', 'Скрыть колонку', '隐藏列'),
    description: l(
      'A <code>span</code> of <code>0</code> is <code>display: none</code>: the column leaves the layout, the Tab order and the screen reader. With a breakpoint, <code>xs={0} md={8}</code> hides a column on small screens.',
      '<code>span</code> равный <code>0</code> — это <code>display: none</code>: колонка исчезает из раскладки, порядка Tab и скринридера. С брейкпоинтом <code>xs={0} md={8}</code> скрывает колонку на малых экранах.',
      '<code>span</code> 为 <code>0</code> 等同于 <code>display: none</code>：该列会从布局、Tab 顺序和读屏中消失。配合断点，<code>xs={0} md={8}</code> 可在小屏幕上隐藏该列。'
    )
  },
  {
    slug: 'responsive',
    title: l('Responsive', 'Адаптивная сетка', '响应式布局'),
    description: l(
      '<code>xs</code>, <code>sm</code>, <code>md</code>, <code>lg</code>, <code>xl</code>, <code>xxl</code> and <code>xxxl</code> take a <code>span</code> from that screen width up (576, 768, 992, 1200, 1600 and 1920 px). <code>xs</code> is the base; a breakpoint that is not given keeps the value of the next smaller one. Resize the window.',
      '<code>xs</code>, <code>sm</code>, <code>md</code>, <code>lg</code>, <code>xl</code>, <code>xxl</code> и <code>xxxl</code> задают <code>span</code> от этой ширины экрана и выше (576, 768, 992, 1200, 1600 и 1920 px). <code>xs</code> — основа; брейкпоинт без значения берёт значение ближайшего меньшего. Меняйте ширину окна.',
      '<code>xs</code>、<code>sm</code>、<code>md</code>、<code>lg</code>、<code>xl</code>、<code>xxl</code> 与 <code>xxxl</code> 从相应的屏幕宽度起生效（576、768、992、1200、1600、1920 px）。<code>xs</code> 是基础值；未设置的断点沿用更小断点的值。请调整窗口宽度查看。'
    ),
    wide: true
  },
  {
    slug: 'responsive-flex',
    title: l('Responsive flex', 'Адаптивный flex', '响应式 Flex'),
    description: l(
      'A breakpoint object can carry <code>flex</code> too, for a share of the line that changes with the screen. Resize the window.',
      'Объект брейкпоинта может содержать и <code>flex</code>: долю строки, которая меняется с размером экрана. Меняйте ширину окна.',
      '断点对象也可以包含 <code>flex</code>，让列占据一行的比例随屏幕变化。请调整窗口宽度查看。'
    )
  },
  {
    slug: 'responsive-more',
    title: l('More responsive', 'Больше адаптивных свойств', '更多响应式属性'),
    description: l(
      '<code>span</code>, <code>offset</code>, <code>push</code>, <code>pull</code>, <code>order</code> and <code>flex</code> go inside a breakpoint object (<code>xs={6}</code> is <code>xs={{ span: 6 }}</code>). Each key cascades on its own: the offset of <code>xs</code> still applies where <code>lg</code> gives only a span.',
      '<code>span</code>, <code>offset</code>, <code>push</code>, <code>pull</code>, <code>order</code> и <code>flex</code> указывают внутри объекта брейкпоинта (<code>xs={6}</code> — это <code>xs={{ span: 6 }}</code>). Каждый ключ наследуется отдельно: offset из <code>xs</code> действует и там, где <code>lg</code> задаёт только span.',
      '<code>span</code>、<code>offset</code>、<code>push</code>、<code>pull</code>、<code>order</code> 与 <code>flex</code> 可写在断点对象中（<code>xs={6}</code> 等同于 <code>xs={{ span: 6 }}</code>）。每个键各自继承：<code>lg</code> 只给出 span 时，<code>xs</code> 的 offset 仍然生效。'
    ),
    wide: true
  },
  {
    slug: 'playground',
    title: l('Playground', 'Песочница', '演示'),
    description: l(
      'Pick the gutters and the number of columns. Every control has its own state.',
      'Выберите отступы и число колонок. У каждого переключателя своё состояние.',
      '选择间隔和每行的列数。每个控件都有各自独立的状态。'
    ),
    wide: true
  },
  {
    slug: 'breakpoints',
    title: l('Breakpoints in code', 'Брейкпоинты в коде', '在代码中读取断点'),
    description: l(
      '<code>new Breakpoints()</code> tells the script which breakpoints the screen matches. The values are right on the first render in a browser; on a server they follow <code>options.fallback</code>. Resize the window.',
      '<code>new Breakpoints()</code> сообщает коду, каким брейкпоинтам соответствует экран. В браузере значения верны уже на первом рендере; на сервере они следуют <code>options.fallback</code>. Меняйте ширину окна.',
      '<code>new Breakpoints()</code> 让脚本知道当前屏幕匹配哪些断点。在浏览器中，首次渲染的值就是正确的；在服务器上则取 <code>options.fallback</code>。请调整窗口宽度查看。'
    )
  }
];

const nativeRow = (element: string, extra: string, extraRu: string, extraZh: string): ApiRow => ({
  name: 'native attributes',
  description: l(
    `Everything else goes to the root <code>&lt;${element}&gt;</code>: <code>id</code>, <code>role</code>, <code>aria-*</code>, <code>data-*</code>, event handlers${extra}.`,
    `Всё остальное попадает на корневой <code>&lt;${element}&gt;</code>: <code>id</code>, <code>role</code>, <code>aria-*</code>, <code>data-*</code>, обработчики событий${extraRu}.`,
    `其余属性都会传给根元素 <code>&lt;${element}&gt;</code>：<code>id</code>、<code>role</code>、<code>aria-*</code>、<code>data-*</code> 与事件处理函数${extraZh}。`
  ),
  type: 'HTMLAttributes<HTMLDivElement>',
  default: '—'
});

const classRow = (target: string): ApiRow => ({
  name: 'class',
  description: l(`Extra class of the ${target}.`, `Дополнительный класс ${target === 'Row' ? 'Row' : 'колонки'}.`, `${target === 'Row' ? 'Row' : 'Col'} 根元素的额外类名。`),
  type: 'string',
  default: '—'
});

const styleRow = (): ApiRow => ({
  name: 'style',
  description: l(
    'Inline style of the root. It is written after the values of the component, so it wins on the same property.',
    'Инлайн-стиль корня. Он записывается после значений компонента, поэтому побеждает на том же свойстве.',
    '根元素的内联样式。它写在组件自身的值之后，因此在同一属性上优先生效。'
  ),
  type: 'string',
  default: '—'
});

export const rowApiRows: ApiRow[] = [
  {
    name: 'align',
    description: l(
      'Vertical alignment of the columns of a line: <code>top</code>, <code>middle</code>, <code>bottom</code> or <code>stretch</code>. An object gives one value per breakpoint.',
      'Вертикальное выравнивание колонок строки: <code>top</code>, <code>middle</code>, <code>bottom</code> или <code>stretch</code>. Объект задаёт значение для каждого брейкпоинта.',
      '一行中各列的垂直对齐方式：<code>top</code>、<code>middle</code>、<code>bottom</code> 或 <code>stretch</code>。对象形式可按断点分别设置。'
    ),
    type: "RowAlign | Partial<Record<Breakpoint, RowAlign>>",
    default: "'top'"
  },
  {
    name: 'justify',
    description: l(
      'Horizontal arrangement of the columns of a line: <code>start</code>, <code>end</code>, <code>center</code>, <code>space-around</code>, <code>space-between</code> or <code>space-evenly</code>. An object gives one value per breakpoint.',
      'Горизонтальное расположение колонок строки: <code>start</code>, <code>end</code>, <code>center</code>, <code>space-around</code>, <code>space-between</code> или <code>space-evenly</code>. Объект задаёт значение для каждого брейкпоинта.',
      '一行中各列的水平排列方式：<code>start</code>、<code>end</code>、<code>center</code>、<code>space-around</code>、<code>space-between</code> 或 <code>space-evenly</code>。对象形式可按断点分别设置。'
    ),
    type: "RowJustify | Partial<Record<Breakpoint, RowJustify>>",
    default: "'start'"
  },
  {
    name: 'gutter',
    description: l(
      'Space between the columns. A number is pixels, a string is a CSS length (<code>2rem</code>, <code>5vw</code>, <code>calc()</code>), an object gives one value per breakpoint, and a pair is <code>[horizontal, vertical]</code> (each can be any of the first three). A string that is not a length is ignored. A negative or non-finite number throws in development.',
      'Отступ между колонками. Число — пиксели, строка — CSS-длина (<code>2rem</code>, <code>5vw</code>, <code>calc()</code>), объект задаёт значение для каждого брейкпоинта, а пара — это <code>[горизонтальный, вертикальный]</code> (каждый может быть любым из первых трёх). Строка, не являющаяся длиной, игнорируется. Отрицательное или нечисловое значение в разработке бросает ошибку.',
      '列之间的间隔。数字为像素，字符串为 CSS 长度（<code>2rem</code>、<code>5vw</code>、<code>calc()</code>），对象可按断点分别设置，数组为 <code>[水平, 垂直]</code>（每一项可以是前三种形式之一）。不是长度的字符串会被忽略；负数或非有限数在开发环境中会抛出错误。'
    ),
    type: 'Gutter | [Gutter, Gutter]',
    default: '0'
  },
  {
    name: 'wrap',
    description: l(
      'Whether columns that do not fit move to the next line. With <code>false</code> they stay on one line, keep their widths and run past the end of the Row.',
      'Переносятся ли колонки, которые не помещаются, на следующую строку. С <code>false</code> они остаются в одной строке, сохраняют ширину и выходят за конец Row.',
      '放不下的列是否换到下一行。为 <code>false</code> 时，列保持在同一行并保留各自宽度，超出 Row 的末端。'
    ),
    type: 'boolean',
    default: 'true'
  },
  {
    name: 'children',
    description: l(
      'The columns (<code>Col</code>). Other children are laid out as plain flex items.',
      'Колонки (<code>Col</code>). Прочие дочерние элементы раскладываются как обычные flex-элементы.',
      '各列（<code>Col</code>）。其他子元素按普通 flex 子项排列。'
    ),
    type: 'Snippet',
    default: '—'
  },
  classRow('Row'),
  styleRow(),
  nativeRow('div', '', '', '')
];

const breakpointType = "number | ColSize";

const breakpointRow = (name: string, from: string, fromRu: string, fromZh: string): ApiRow => ({
  name,
  description: l(
    `${from} A number is a <code>span</code>; an object takes the props of <code>ColSize</code>.`,
    `${fromRu} Число — это <code>span</code>; объект принимает свойства <code>ColSize</code>.`,
    `${fromZh}数字表示 <code>span</code>；对象可使用 <code>ColSize</code> 的属性。`
  ),
  type: breakpointType,
  default: '—'
});

export const colApiRows: ApiRow[] = [
  {
    name: 'span',
    description: l(
      'How many of the 24 columns to take. <code>0</code> is <code>display: none</code>. Without it the column keeps its content width. A negative or non-finite number throws in development.',
      'Сколько из 24 колонок занять. <code>0</code> — это <code>display: none</code>. Без него колонка сохраняет ширину содержимого. Отрицательное или нечисловое значение в разработке бросает ошибку.',
      '占 24 格中的多少格。<code>0</code> 等同于 <code>display: none</code>。不设置时，列保持内容宽度。负数或非有限数在开发环境中会抛出错误。'
    ),
    type: 'number',
    default: '—'
  },
  {
    name: 'offset',
    description: l(
      'Empty columns before this one.',
      'Пустые колонки перед этой.',
      '该列左侧空出的格数。'
    ),
    type: 'number',
    default: '0'
  },
  {
    name: 'push',
    description: l(
      'Moves the column that many columns towards the inline end, visually only. The DOM order does not change.',
      'Сдвигает колонку на столько колонок к концу строки, только визуально. Порядок в DOM не меняется.',
      '让该列向行尾方向移动相应格数，仅影响视觉效果，不改变 DOM 顺序。'
    ),
    type: 'number',
    default: '0'
  },
  {
    name: 'pull',
    description: l(
      'Moves the column that many columns towards the inline start, visually only. With both <code>push</code> and <code>pull</code> the column moves by the difference.',
      'Сдвигает колонку на столько колонок к началу строки, только визуально. Если заданы <code>push</code> и <code>pull</code>, колонка сдвигается на разность.',
      '让该列向行首方向移动相应格数，仅影响视觉效果。同时设置 <code>push</code> 与 <code>pull</code> 时，按差值移动。'
    ),
    type: 'number',
    default: '0'
  },
  {
    name: 'order',
    description: l(
      'The flex <code>order</code>: how the column is drawn, not where it is in the DOM. An integer, negative allowed.',
      'Flex-<code>order</code>: как рисуется колонка, а не её место в DOM. Целое число, допустимы отрицательные.',
      'flex 的 <code>order</code>：决定列的绘制顺序，而不是它在 DOM 中的位置。整数，可为负。'
    ),
    type: 'number',
    default: '0'
  },
  {
    name: 'flex',
    description: l(
      'A number <code>n</code> is <code>flex: n n auto</code> (<code>0</code> counts); a string of digits is <code>n 1 0px</code>; a single length or percentage (<code>100px</code>, <code>30%</code>) is a fixed width, <code>0 0 &lt;length&gt;</code>; any other string is used as written. It wins over the width of <code>span</code>.',
      'Число <code>n</code> — это <code>flex: n n auto</code> (<code>0</code> тоже значение); строка из цифр — <code>n 1 0px</code>; одна длина или процент (<code>100px</code>, <code>30%</code>) — фиксированная ширина, <code>0 0 &lt;длина&gt;</code>; любая другая строка используется как есть. Побеждает ширину от <code>span</code>.',
      '数字 <code>n</code> 即 <code>flex: n n auto</code>（<code>0</code> 也是有效值）；纯数字字符串为 <code>n 1 0px</code>；单个长度或百分比（<code>100px</code>、<code>30%</code>）为固定宽度，即 <code>0 0 &lt;长度&gt;</code>；其他字符串按原样使用。它优先于 <code>span</code> 的宽度。'
    ),
    type: 'string | number',
    default: '—'
  },
  breakpointRow('xs', 'From 0 px up: the base of every width.', 'От 0 px и выше: основа для любой ширины.', '从 0 px 起：所有宽度的基础值。'),
  breakpointRow('sm', 'From 576 px up.', 'От 576 px и выше.', '从 576 px 起。'),
  breakpointRow('md', 'From 768 px up.', 'От 768 px и выше.', '从 768 px 起。'),
  breakpointRow('lg', 'From 992 px up.', 'От 992 px и выше.', '从 992 px 起。'),
  breakpointRow('xl', 'From 1200 px up.', 'От 1200 px и выше.', '从 1200 px 起。'),
  breakpointRow('xxl', 'From 1600 px up.', 'От 1600 px и выше.', '从 1600 px 起。'),
  breakpointRow('xxxl', 'From 1920 px up.', 'От 1920 px и выше.', '从 1920 px 起。'),
  {
    name: 'children',
    description: l('The content of the column.', 'Содержимое колонки.', '列的内容。'),
    type: 'Snippet',
    default: '—'
  },
  classRow('Col'),
  styleRow(),
  nativeRow('div', '', '', '')
];

/** The keys of a breakpoint object (<code>xs={{ ... }}</code>). */
export const sizeRows: ApiRow[] = [
  ['span', 'number', 'How many of the 24 columns to take; <code>0</code> hides the column at this breakpoint.', 'Сколько из 24 колонок занять; <code>0</code> скрывает колонку на этом брейкпоинте.', '占 24 格中的多少格；<code>0</code> 会在该断点隐藏此列。'],
  ['offset', 'number', 'Empty columns before this one.', 'Пустые колонки перед этой.', '该列左侧空出的格数。'],
  ['push', 'number', 'Visual shift towards the inline end, in columns.', 'Визуальный сдвиг к концу строки, в колонках.', '向行尾方向的视觉偏移，单位为格。'],
  ['pull', 'number', 'Visual shift towards the inline start, in columns.', 'Визуальный сдвиг к началу строки, в колонках.', '向行首方向的视觉偏移，单位为格。'],
  ['order', 'number', 'The flex <code>order</code>.', 'Flex-<code>order</code>.', 'flex 的 <code>order</code>。'],
  ['flex', 'string | number', 'A raw flex value, as for the <code>flex</code> prop.', 'Сырое значение flex, как у свойства <code>flex</code>.', '原始 flex 值，规则与 <code>flex</code> 属性相同。']
].map(([name, type, en, ru, zh]) => ({ name, description: l(en, ru, zh), type, default: '—' }));

export const breakpointsRows: ApiRow[] = [
  {
    name: 'new Breakpoints(options?)',
    description: l(
      'Creates the reader. The values are taken from the screen at once, so they are right on the first render in a browser. The listeners exist only while something reactive reads them.',
      'Создаёт читателя. Значения берутся с экрана сразу, поэтому в браузере верны уже на первом рендере. Слушатели существуют, только пока значения читает что-то реактивное.',
      '创建读取器。数值立即从屏幕读取，因此在浏览器中首次渲染就是正确的。只有在响应式代码读取时才会存在监听器。'
    ),
    type: '(options?: BreakpointsOptions) => Breakpoints',
    default: '—'
  },
  {
    name: 'options.fallback',
    description: l(
      'The breakpoint to report where there is no screen (on a server): the flags are those of a screen exactly as wide as this breakpoint starts. An unknown value throws in development.',
      'Брейкпоинт, который сообщается там, где экрана нет (на сервере): флаги такие, как у экрана ровно той ширины, с которой начинается этот брейкпоинт. Неизвестное значение в разработке бросает ошибку.',
      '在没有屏幕的环境（服务器）中所报告的断点：各标志与恰好等于该断点起始宽度的屏幕一致。未知值在开发环境中会抛出错误。'
    ),
    type: 'Breakpoint',
    default: "'xs'"
  },
  {
    name: 'xs',
    description: l('True below 576 px.', 'Истинно, пока ширина меньше 576 px.', '宽度小于 576 px 时为 true。'),
    type: 'boolean',
    default: '—'
  },
  ...(
    [
      ['sm', 576],
      ['md', 768],
      ['lg', 992],
      ['xl', 1200],
      ['xxl', 1600],
      ['xxxl', 1920]
    ] as const
  ).map(
    ([name, width]): ApiRow => ({
      name,
      description: l(`True from ${width} px up.`, `Истинно от ${width} px и выше.`, `宽度达到 ${width} px 及以上时为 true。`),
      type: 'boolean',
      default: '—'
    })
  ),
  {
    name: 'current',
    description: l(
      'The largest breakpoint that matches (<code>xs</code> below 576 px).',
      'Наибольший подходящий брейкпоинт (<code>xs</code> при ширине меньше 576 px).',
      '匹配的最大断点（宽度小于 576 px 时为 <code>xs</code>）。'
    ),
    type: 'Breakpoint',
    default: '—'
  }
];

/** `BREAKPOINTS`: the minimum width of each breakpoint, in pixels. Compared with constants.ts by the page test. */
export const constantRows = [
  { name: 'xs', value: '0' },
  { name: 'sm', value: '576' },
  { name: 'md', value: '768' },
  { name: 'lg', value: '992' },
  { name: 'xl', value: '1200' },
  { name: 'xxl', value: '1600' },
  { name: 'xxxl', value: '1920' }
];
