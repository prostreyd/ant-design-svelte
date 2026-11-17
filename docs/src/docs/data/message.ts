// Data of the Message page. The tables are checked against the source by tests/docs/message-page.test.ts.
import type { ApiRow, DemoMeta, TokenRow } from './button.ts';

export const demos: DemoMeta[] = [
  {
    slug: 'basic',
    title: { en: 'Basic', ru: 'Базовый пример', zh: '基本用法' },
    description: {
      en: 'A call from anywhere in your code shows a message at the top of the page: no setup and no markup. The library makes a layer on the page by itself and removes it when the last message has gone. Note: the call returns a function that closes the message and is also thenable, so <code>await message.info(…)</code> waits until the message closes.',
      ru: 'Вызов из любого места кода показывает сообщение вверху страницы: без настройки и без разметки. Библиотека сама создаёт слой на странице и убирает его, когда уходит последнее сообщение. Важно: вызов возвращает функцию, которая закрывает сообщение и к тому же thenable, поэтому <code>await message.info(…)</code> ждёт, пока сообщение закроется.',
      zh: '在代码的任何位置调用即可在页面顶部显示消息：无需配置，也无需写标签。库会自己创建一个浮层，并在最后一条消息消失后移除它。注意：调用返回的是一个用于关闭消息的函数，它同时是 thenable，因此 <code>await message.info(…)</code> 会等到消息关闭。'
    }
  },
  {
    slug: 'types',
    title: { en: 'Types', ru: 'Типы', zh: '提示类型' },
    description: {
      en: 'Five kinds: <code>info</code>, <code>success</code>, <code>error</code>, <code>warning</code> and <code>loading</code>. Each has a method, and <code>message.open({ type })</code> takes the kind as an option. A screen reader reads <code>error</code> and <code>warning</code> at once, and the others when it has finished.',
      ru: 'Пять видов: <code>info</code>, <code>success</code>, <code>error</code>, <code>warning</code> и <code>loading</code>. У каждого есть свой метод, а <code>message.open({ type })</code> принимает вид параметром. Скринридер зачитывает <code>error</code> и <code>warning</code> сразу, остальные — когда закончит чтение.',
      zh: '五种类型：<code>info</code>、<code>success</code>、<code>error</code>、<code>warning</code> 和 <code>loading</code>。每种类型有对应的方法，<code>message.open({ type })</code> 也可以通过选项指定类型。屏幕阅读器会立即朗读 <code>error</code> 和 <code>warning</code>，其余类型则等它读完当前内容再朗读。'
    }
  },
  {
    slug: 'duration',
    title: { en: 'Duration', ru: 'Длительность', zh: '自定义时长' },
    description: {
      en: '<code>duration</code> is in seconds (default 3). <code>0</code> keeps the message until it is closed. The function that a call returns closes the message.',
      ru: '<code>duration</code> задаётся в секундах (по умолчанию 3). <code>0</code> оставляет сообщение, пока его не закроют. Функция, которую возвращает вызов, закрывает сообщение.',
      zh: '<code>duration</code> 以秒为单位（默认 3）。<code>0</code> 表示一直显示，直到被关闭。调用返回的函数可以关闭该消息。'
    }
  },
  {
    slug: 'update',
    title: { en: 'Update by key', ru: 'Обновление по ключу', zh: '通过 key 更新内容' },
    description: {
      en: 'A call with the <code>key</code> of an open message updates it in place: here a loading message turns into a success one. The box keeps its place and its height, and a screen reader reads the new text.',
      ru: 'Вызов с <code>key</code> открытого сообщения обновляет его на месте: здесь сообщение о загрузке превращается в сообщение об успехе. Блок остаётся на своём месте и сохраняет высоту, а скринридер зачитывает новый текст.',
      zh: '使用已打开消息的 <code>key</code> 再次调用会原地更新它：这里加载中的消息变成了成功消息。消息框的位置和高度保持不变，屏幕阅读器会朗读新的文字。'
    }
  },
  {
    slug: 'sequence',
    title: { en: 'Sequence', ru: 'Последовательность', zh: '顺序提示' },
    description: {
      en: 'The returned function is thenable: <code>.then</code> runs when the message starts to close, so the next message comes in as the first one goes. For the same reason <code>await message.info(…)</code> waits for the close.',
      ru: 'Возвращаемая функция thenable: <code>.then</code> срабатывает, когда сообщение начинает закрываться, поэтому следующее появляется, пока уходит первое. По той же причине <code>await message.info(…)</code> ждёт закрытия.',
      zh: '返回的函数是 thenable：<code>.then</code> 在消息开始关闭时执行，所以下一条消息会在上一条离开的同时出现。出于同样的原因，<code>await message.info(…)</code> 会等到消息关闭。'
    }
  },
  {
    slug: 'content',
    title: { en: 'Content', ru: 'Содержимое', zh: '内容' },
    description: {
      en: '<code>content</code> is a string, a number (<code>0</code> is shown) or a snippet. A snippet can hold a link or a button. It is drawn in the layer, so it sees the context of the place where the host is, not of the component that wrote it.',
      ru: '<code>content</code> — строка, число (<code>0</code> показывается) или snippet. В snippet можно положить ссылку или кнопку. Он рисуется в слое, поэтому видит контекст того места, где стоит хост, а не компонента, который его написал.',
      zh: '<code>content</code> 可以是字符串、数字（<code>0</code> 会显示）或 snippet。snippet 中可以放链接或按钮。它在浮层中渲染，因此看到的是宿主所在位置的上下文，而不是编写它的组件的上下文。'
    }
  },
  {
    slug: 'icon',
    title: { en: 'Icon', ru: 'Иконка', zh: '自定义图标' },
    description: {
      en: '<code>icon</code> replaces the icon of the type: a string (text or an emoji) or a snippet; <code>false</code> removes it. The icon is decorative: a screen reader never reads it.',
      ru: '<code>icon</code> заменяет иконку вида: строка (текст или эмодзи) или snippet; <code>false</code> убирает её. Иконка декоративна: скринридер её не читает.',
      zh: '<code>icon</code> 替换类型对应的图标：可以是字符串（文字或 emoji）或 snippet；<code>false</code> 表示不显示图标。图标仅作装饰，屏幕阅读器不会朗读它。'
    }
  },
  {
    slug: 'styling',
    title: { en: 'Classes and styles', ru: 'Классы и стили', zh: '自定义类名与样式' },
    description: {
      en: '<code>class</code> and <code>style</code> go on the box. <code>classNames</code> and <code>styles</code> address its parts: <code>root</code>, <code>wrapper</code>, <code>icon</code>, <code>title</code> and <code>close</code>. The message is drawn outside the component that opens it, so a class that styles it has to be global.',
      ru: '<code>class</code> и <code>style</code> применяются к блоку. <code>classNames</code> и <code>styles</code> задают части: <code>root</code>, <code>wrapper</code>, <code>icon</code>, <code>title</code> и <code>close</code>. Сообщение рисуется вне компонента, который его открыл, поэтому класс для его оформления должен быть глобальным.',
      zh: '<code>class</code> 和 <code>style</code> 作用于消息框。<code>classNames</code> 和 <code>styles</code> 作用于各个部分：<code>root</code>、<code>wrapper</code>、<code>icon</code>、<code>title</code> 与 <code>close</code>。消息渲染在打开它的组件之外，因此用于样式的类名必须是全局的。'
    }
  },
  {
    slug: 'pause',
    title: { en: 'Pause on hover and focus', ru: 'Пауза при наведении и фокусе', zh: '悬停与聚焦时暂停' },
    description: {
      en: 'The timer waits while the pointer (a mouse or a pen) is over the box, while focus is inside it, and while the page is hidden; it goes on with the time that was left. <code>pauseOnHover: false</code> turns off the first. A touch never holds it.',
      ru: 'Таймер ждёт, пока курсор (мышь или перо) над блоком, пока фокус внутри него и пока страница скрыта; затем он продолжает с оставшегося времени. <code>pauseOnHover: false</code> отключает первое. Касание таймер не удерживает.',
      zh: '当指针（鼠标或触控笔）在消息框上、焦点在消息框内，或页面被隐藏时，计时器会暂停，之后从剩余时间继续。<code>pauseOnHover: false</code> 会关闭第一种暂停。触摸不会使计时器暂停。'
    }
  },
  {
    slug: 'click',
    title: { en: 'Click and close callbacks', ru: 'Клик и закрытие', zh: '点击与关闭回调' },
    description: {
      en: '<code>onclick</code> is for a mouse or a finger: the box cannot be reached with the keyboard, so put a button in the content for an action. <code>onclose</code> is called once, when the message starts to close, however it was closed.',
      ru: '<code>onclick</code> — для мыши и пальца: до блока нельзя добраться с клавиатуры, поэтому для действия положите кнопку в содержимое. <code>onclose</code> вызывается один раз, когда сообщение начинает закрываться, как бы его ни закрыли.',
      zh: '<code>onclick</code> 只适用于鼠标或手指：键盘无法到达消息框，所以需要操作时请把按钮放进内容中。<code>onclose</code> 在消息开始关闭时调用一次，无论以何种方式关闭。'
    }
  },
  {
    slug: 'closable',
    title: { en: 'Close button', ru: 'Кнопка закрытия', zh: '关闭按钮' },
    description: {
      en: '<code>closable</code> adds a close button (its name is <code>labels.close</code>). <code>Enter</code> and <code>Space</code> press it, and <code>Escape</code> closes the message that has focus inside it. It lets a user dismiss a message that stays (<code>duration: 0</code>). Not in Ant Design.',
      ru: '<code>closable</code> добавляет кнопку закрытия (её имя — <code>labels.close</code>). <code>Enter</code> и <code>Space</code> нажимают её, а <code>Escape</code> закрывает сообщение, в котором стоит фокус. Так пользователь может убрать сообщение, которое не уходит само (<code>duration: 0</code>). В Ant Design этого нет.',
      zh: '<code>closable</code> 会添加一个关闭按钮（其名称为 <code>labels.close</code>）。<code>Enter</code> 和 <code>Space</code> 可按下它，<code>Escape</code> 会关闭焦点所在的消息。用户可以借此关闭不会自动消失的消息（<code>duration: 0</code>）。Ant Design 没有此功能。'
    }
  },
  {
    slug: 'count',
    title: { en: 'Maximum count', ru: 'Максимум сообщений', zh: '最大显示数量' },
    description: {
      en: '<code>maxCount</code> limits the open messages: a new one closes the oldest to make room. It is a setting of <code>message.config()</code>; the switch sets it and takes it back.',
      ru: '<code>maxCount</code> ограничивает число открытых сообщений: новое закрывает самое старое, чтобы освободить место. Это настройка <code>message.config()</code>; переключатель задаёт её и возвращает обратно.',
      zh: '<code>maxCount</code> 限制同时打开的消息数量：新消息会关闭最早的一条以腾出位置。它是 <code>message.config()</code> 的设置；开关用于设置并还原它。'
    }
  },
  {
    slug: 'top',
    title: { en: 'Distance from the top', ru: 'Отступ сверху', zh: '距顶部的距离' },
    description: {
      en: '<code>top</code> is the distance of the first message from the top of the window: a number (pixels) or any CSS length. The default is 8.',
      ru: '<code>top</code> — расстояние от верха окна до первого сообщения: число (пиксели) или любая CSS-длина. По умолчанию 8.',
      zh: '<code>top</code> 是第一条消息距窗口顶部的距离：可以是数字（像素）或任意 CSS 长度。默认值为 8。'
    }
  },
  {
    slug: 'stack',
    title: { en: 'Stack', ru: 'Стопка', zh: '堆叠' },
    description: {
      en: '<code>stack</code> (a setting): the newest message is the first row. After <code>threshold</code> messages (3) the others lie behind it as a pile; the pointer or focus opens the pile, and every timer waits while it is open.',
      ru: '<code>stack</code> (настройка): самое новое сообщение — первая строка. Когда сообщений больше <code>threshold</code> (3), остальные ложатся за ним стопкой; курсор или фокус раскрывает стопку, и все таймеры ждут, пока она открыта.',
      zh: '<code>stack</code>（设置）：最新的消息显示在第一行。消息数量超过 <code>threshold</code>（3）后，其余消息会叠在它后面；指针或焦点会展开这堆消息，展开期间所有计时器都会暂停。'
    }
  },
  {
    slug: 'host',
    title: { en: 'MessageHost', ru: 'MessageHost', zh: 'MessageHost 宿主' },
    description: {
      en: '<code>&lt;MessageHost&gt;</code> draws the messages where you put it. Its props are settings and win over <code>message.config()</code>; without one the library makes its own layer. Only one host is active at a time. <code>labels</code> is where translations of the hidden type word and of the close button go.',
      ru: '<code>&lt;MessageHost&gt;</code> рисует сообщения там, где вы его поставили. Его пропсы — это настройки, они важнее <code>message.config()</code>; без него библиотека создаёт свой слой. Активен только один хост. В <code>labels</code> кладут переводы скрытого слова вида и кнопки закрытия.',
      zh: '<code>&lt;MessageHost&gt;</code> 在你放置它的位置渲染消息。它的 props 就是设置，优先于 <code>message.config()</code>；没有它时库会自己创建浮层。同一时间只有一个宿主生效。<code>labels</code> 用于放置隐藏的类型词和关闭按钮的翻译。'
    }
  },
  {
    slug: 'container',
    title: { en: 'Container', ru: 'Контейнер', zh: '容器' },
    description: {
      en: '<code>container</code> moves the layer into an element. The layer is <code>position: fixed</code>: inside an element with a <code>transform</code> (or <code>filter</code>, or <code>contain: layout</code>) it is fixed to that element, which gives a message region inside a part of the page.',
      ru: '<code>container</code> переносит слой в элемент. Слой — <code>position: fixed</code>: внутри элемента с <code>transform</code> (или <code>filter</code>, или <code>contain: layout</code>) он закрепляется за этим элементом, что даёт область сообщений внутри части страницы.',
      zh: '<code>container</code> 会把浮层移入某个元素。浮层是 <code>position: fixed</code>：在带有 <code>transform</code>（或 <code>filter</code>、<code>contain: layout</code>）的元素内，它会固定在该元素上，从而在页面的一部分中形成消息区域。'
    }
  }
];

const options = (en: string, ru: string, zh: string) => ({ en, ru, zh });

export const optionRows: ApiRow[] = [
  {
    name: 'type',
    description: options('The kind. Only for <code>message.open</code>; the typed methods fix it.', 'Вид сообщения. Только для <code>message.open</code>; у типизированных методов он задан.', '消息类型。仅用于 <code>message.open</code>；带类型的方法已固定类型。'),
    type: "'info' | 'success' | 'error' | 'warning' | 'loading'",
    default: "'info'"
  },
  {
    name: 'content',
    description: options('The text or the content: a string, a number (<code>0</code> is shown) or a snippet.', 'Текст или содержимое: строка, число (<code>0</code> показывается) или snippet.', '文字或内容：字符串、数字（<code>0</code> 会显示）或 snippet。'),
    type: 'string | number | Snippet',
    default: '—'
  },
  {
    name: 'duration',
    description: options('Seconds before the message goes. <code>0</code> keeps it until it is closed. A negative or not finite value falls back to the default, with a warning while developing.', 'Секунды до ухода сообщения. <code>0</code> оставляет его, пока не закроют. Отрицательное или не конечное значение заменяется значением по умолчанию, при разработке с предупреждением.', '消息消失前的秒数。<code>0</code> 表示一直显示直到被关闭。负数或非有限值会回退到默认值，开发时会给出警告。'),
    type: 'number',
    default: '3'
  },
  {
    name: 'icon',
    description: options('Replaces the icon of the type: a string (shown as text), a snippet, or <code>false</code> for none.', 'Заменяет иконку вида: строка (показывается как текст), snippet или <code>false</code>, чтобы убрать.', '替换类型对应的图标：字符串（按文字显示）、snippet，或 <code>false</code> 表示不显示。'),
    type: 'string | Snippet | false',
    default: 'the icon of the type'
  },
  {
    name: 'key',
    description: options('A call with the key of an open message updates that message in place (new type, content and options, the timer starts again). Without one a key is generated.', 'Вызов с ключом открытого сообщения обновляет его на месте (новые вид, содержимое и параметры, таймер запускается заново). Без ключа он создаётся сам.', '使用已打开消息的 key 调用会原地更新该消息（新的类型、内容和选项，计时器重新开始）。未提供时会自动生成。'),
    type: 'string | number',
    default: 'generated'
  },
  {
    name: 'pauseOnHover',
    description: options('Holds the timer while the pointer (a mouse or a pen) is over the box. Focus inside and a hidden page hold it whatever this says.', 'Удерживает таймер, пока курсор (мышь или перо) над блоком. Фокус внутри и скрытая страница удерживают его независимо от этого значения.', '指针（鼠标或触控笔）在消息框上时暂停计时。焦点在框内或页面被隐藏时，无论此值如何都会暂停。'),
    type: 'boolean',
    default: 'true'
  },
  {
    name: 'closable',
    description: options('Shows a close button. Ant Design has no such option.', 'Показывает кнопку закрытия. В Ant Design такой опции нет.', '显示关闭按钮。Ant Design 没有此选项。'),
    type: 'boolean',
    default: 'false'
  },
  {
    name: 'class',
    description: options('Extra classes of the box.', 'Дополнительные классы блока.', '消息框的额外类名。'),
    type: 'string',
    default: '—'
  },
  {
    name: 'style',
    description: options('Inline style of the box: a string, or an object of CSS properties (kebab-case or custom properties; numbers are written as they are).', 'Инлайн-стиль блока: строка или объект CSS-свойств (kebab-case или custom properties; числа записываются как есть).', '消息框的内联样式：字符串或 CSS 属性对象（kebab-case 或自定义属性；数字按原样写入）。'),
    type: 'string | Record<string, string | number>',
    default: '—'
  },
  {
    name: 'classNames',
    description: options('Extra classes for the parts <code>root</code>, <code>wrapper</code>, <code>icon</code>, <code>title</code> and <code>close</code>. A value here wins over the one of the host and of <code>message.config()</code>.', 'Дополнительные классы для частей <code>root</code>, <code>wrapper</code>, <code>icon</code>, <code>title</code> и <code>close</code>. Значение здесь важнее значения хоста и <code>message.config()</code>.', '为 <code>root</code>、<code>wrapper</code>、<code>icon</code>、<code>title</code> 和 <code>close</code> 部分添加的类名。此处的值优先于宿主和 <code>message.config()</code> 中的值。'),
    type: "{ root?, wrapper?, icon?, title?, close? }",
    default: '—'
  },
  {
    name: 'styles',
    description: options('Inline styles for the same parts, as objects.', 'Инлайн-стили для тех же частей, объектами.', '同样各部分的内联样式，使用对象。'),
    type: "{ root?, wrapper?, icon?, title?, close? }",
    default: '—'
  },
  {
    name: 'onclick',
    description: options('Called with the event when the box is clicked, not when its close button is. The box cannot be reached with the keyboard: put a button in the content for an action.', 'Вызывается с событием при клике по блоку, но не по его кнопке закрытия. До блока нельзя добраться с клавиатуры: для действия положите кнопку в содержимое.', '点击消息框时（而非其关闭按钮时）带事件调用。键盘无法到达消息框：需要操作时请把按钮放进内容。'),
    type: '(event: MouseEvent) => void',
    default: '—'
  },
  {
    name: 'onclose',
    description: options('Called once, when the message starts to close, however it was closed (the timer, the returned function, <code>destroy</code>, <code>maxCount</code>, the close button, Escape).', 'Вызывается один раз, когда сообщение начинает закрываться, как бы его ни закрыли (таймер, возвращённая функция, <code>destroy</code>, <code>maxCount</code>, кнопка закрытия, Escape).', '在消息开始关闭时调用一次，无论以何种方式关闭（计时器、返回的函数、<code>destroy</code>、<code>maxCount</code>、关闭按钮、Escape）。'),
    type: '() => void',
    default: '—'
  }
];

export const methodRows: ApiRow[] = [
  {
    name: 'message.open(options)',
    description: options('Opens a message of the kind <code>options.type</code> (default <code>info</code>), or updates the open one with the same <code>key</code>.', 'Открывает сообщение вида <code>options.type</code> (по умолчанию <code>info</code>) или обновляет открытое с тем же <code>key</code>.', '打开 <code>options.type</code> 类型的消息（默认 <code>info</code>），或更新具有相同 <code>key</code> 的已打开消息。'),
    type: 'MessageHandle',
    default: '—'
  },
  {
    name: 'message.info | success | error | warning | loading(content, duration?, onclose?)',
    description: options('One method for each kind. Without a window (on a server) every call does nothing and returns an inert handle.', 'По методу на каждый вид. Без окна (на сервере) любой вызов ничего не делает и возвращает неактивный handle.', '每种类型一个方法。没有窗口时（服务器端）调用不会有任何效果，并返回一个无效的 handle。'),
    type: 'MessageHandle',
    default: '—'
  },
  {
    name: 'message.info | success | error | warning | loading(options)',
    description: options('The same with an object of options (without <code>type</code>).', 'То же с объектом параметров (без <code>type</code>).', '同上，参数为选项对象（不含 <code>type</code>）。'),
    type: 'MessageHandle',
    default: '—'
  },
  {
    name: 'message.destroy(key?)',
    description: options('Closes the message with this key, or every message. Each one runs its normal exit and its <code>onclose</code>.', 'Закрывает сообщение с этим ключом или все сообщения. Каждое проходит обычный уход и вызывает свой <code>onclose</code>.', '关闭该 key 对应的消息，或关闭所有消息。每条消息都会执行正常的离场过程并调用其 <code>onclose</code>。'),
    type: 'void',
    default: '—'
  },
  {
    name: 'message.config(options)',
    description: options('Sets defaults for every message from now on (the settings table below). A setting given as <code>{ top: undefined }</code> goes back to its default.', 'Задаёт значения по умолчанию для всех сообщений с этого момента (таблица настроек ниже). Настройка, переданная как <code>{ top: undefined }</code>, возвращается к значению по умолчанию.', '设置此后所有消息的默认值（见下方设置表）。以 <code>{ top: undefined }</code> 传入的设置会还原为默认值。'),
    type: 'void',
    default: '—'
  },
  {
    name: 'handle()',
    description: options('What a call returns: a function that closes the message. Closing a message that is closing or closed does nothing.', 'Что возвращает вызов: функция, закрывающая сообщение. Закрытие сообщения, которое уже закрывается или закрыто, ничего не делает.', '调用返回的内容：一个用于关闭消息的函数。关闭正在关闭或已关闭的消息不会有任何效果。'),
    type: '() => void',
    default: '—'
  },
  {
    name: 'handle.then(onfulfilled)',
    description: options('The handle is thenable: the promise resolves when the message starts to close. <code>await handle</code> therefore waits for the close.', 'Handle — thenable: промис выполняется, когда сообщение начинает закрываться. Поэтому <code>await handle</code> ждёт закрытия.', 'handle 是 thenable：promise 在消息开始关闭时完成。因此 <code>await handle</code> 会等到消息关闭。'),
    type: 'PromiseLike<void>',
    default: '—'
  }
];

export const settingRows: ApiRow[] = [
  {
    name: 'top',
    description: options('Distance of the first message from the top of the window. A number is pixels. Without it, the token <code>--ads-message-top</code> (8px).', 'Расстояние от верха окна до первого сообщения. Число — пиксели. Без него — токен <code>--ads-message-top</code> (8px).', '第一条消息距窗口顶部的距离。数字表示像素。未设置时使用令牌 <code>--ads-message-top</code>（8px）。'),
    type: 'number | string',
    default: '8'
  },
  {
    name: 'duration',
    description: options('Default <code>duration</code> of every message, in seconds.', '<code>duration</code> по умолчанию для каждого сообщения, в секундах.', '每条消息的默认 <code>duration</code>，单位为秒。'),
    type: 'number',
    default: '3'
  },
  {
    name: 'maxCount',
    description: options('At most this many open messages: the oldest closes to make room. A value below 1 or not finite is ignored.', 'Не больше стольких открытых сообщений: самое старое закрывается, чтобы освободить место. Значение меньше 1 или не конечное игнорируется.', '最多同时打开这么多条消息：最早的一条会被关闭以腾出位置。小于 1 或非有限的值会被忽略。'),
    type: 'number',
    default: '—'
  },
  {
    name: 'container',
    description: options('Where the layer is moved to: an element, or a function that returns one. Default <code>document.body</code>.', 'Куда переносится слой: элемент или функция, которая его возвращает. По умолчанию <code>document.body</code>.', '浮层移入的位置：一个元素，或返回元素的函数。默认 <code>document.body</code>。'),
    type: 'HTMLElement | (() => HTMLElement)',
    default: 'document.body'
  },
  {
    name: 'closable',
    description: options('Default of <code>closable</code> for every message.', 'Значение <code>closable</code> по умолчанию для каждого сообщения.', '每条消息 <code>closable</code> 的默认值。'),
    type: 'boolean',
    default: 'false'
  },
  {
    name: 'labels',
    description: options('The word a screen reader hears before the text (<code>info</code>, <code>success</code>, <code>error</code>, <code>warning</code>, <code>loading</code>: "Error: Upload failed") and the name of the close button (<code>close</code>). Pass a translation; an empty string removes a type word.', 'Слово, которое слышит скринридер перед текстом (<code>info</code>, <code>success</code>, <code>error</code>, <code>warning</code>, <code>loading</code>: «Error: Upload failed») и имя кнопки закрытия (<code>close</code>). Передайте перевод; пустая строка убирает слово вида.', '屏幕阅读器在文字之前听到的词（<code>info</code>、<code>success</code>、<code>error</code>、<code>warning</code>、<code>loading</code>，例如 "Error: Upload failed"）以及关闭按钮的名称（<code>close</code>）。请传入翻译；空字符串会去掉类型词。'),
    type: "Partial<Record<'info' | 'success' | 'error' | 'warning' | 'loading' | 'close', string>>",
    default: "'Info', 'Success', 'Error', 'Warning', 'Loading', 'Close'"
  },
  {
    name: 'classNames',
    description: options('Defaults for the parts of every message, and the two parts of the layer: <code>list</code> (the fixed layer) and <code>listContent</code> (the column of rows).', 'Значения по умолчанию для частей каждого сообщения и две части слоя: <code>list</code> (фиксированный слой) и <code>listContent</code> (колонка строк).', '每条消息各部分的默认类名，以及浮层的两个部分：<code>list</code>（固定浮层）和 <code>listContent</code>（行的列）。'),
    type: "{ root?, wrapper?, icon?, title?, close?, list?, listContent? }",
    default: '—'
  },
  {
    name: 'styles',
    description: options('The same for inline styles, as objects.', 'То же для инлайн-стилей, объектами.', '内联样式的同样设置，使用对象。'),
    type: "{ root?, wrapper?, icon?, title?, close?, list?, listContent? }",
    default: '—'
  },
  {
    name: 'stack',
    description: options('<code>true</code>, or <code>{ threshold }</code>: the newest message is the first row, and past the threshold (3) the others lie behind it as a pile that the pointer or focus opens. React 6.4.0 has it, Vue and Angular do not.', '<code>true</code> или <code>{ threshold }</code>: самое новое сообщение — первая строка, а после порога (3) остальные ложатся за ним стопкой, которую раскрывают курсор или фокус. Есть в React 6.4.0, нет в Vue и Angular.', '<code>true</code> 或 <code>{ threshold }</code>：最新消息显示在第一行，超过阈值（3）后其余消息叠在它后面，指针或焦点会将其展开。React 6.4.0 有此功能，Vue 和 Angular 没有。'),
    type: 'boolean | { threshold?: number }',
    default: 'false'
  }
];

const token = (name: string, value: string, en: string, ru: string, zh: string): TokenRow => ({ name, value, description: { en, ru, zh } });

export const tokenRows: TokenRow[] = [
  token('--ads-message-z-index', '2010', 'Layer of the messages, above every popup (the tooltip is 1070).', 'Слой сообщений, выше любого всплывающего окна (у подсказки 1070).', '消息的层级，高于所有弹出层（文字提示为 1070）。'),
  token('--ads-message-top', '8px', 'Distance of the first message from the top, when <code>top</code> is not set.', 'Расстояние от верха до первого сообщения, если <code>top</code> не задан.', '未设置 <code>top</code> 时，第一条消息距顶部的距离。'),
  token('--ads-message-gap', '16px', 'Gap between two messages.', 'Промежуток между двумя сообщениями.', '两条消息之间的间距。'),
  token('--ads-message-margin-inline', '24px', 'Space kept free at the left and right edge of the window.', 'Свободное место у левого и правого края окна.', '窗口左右边缘保留的空白。'),
  token('--ads-message-bg', '#ffffff', 'Background of the box. In the dark theme <code>#1f1f1f</code>.', 'Фон блока. В тёмной теме <code>#1f1f1f</code>.', '消息框背景。深色主题为 <code>#1f1f1f</code>。'),
  token('--ads-message-color', 'rgba(0, 0, 0, 0.88)', 'Text color. In the dark theme 85% white.', 'Цвет текста. В тёмной теме 85% белого.', '文字颜色。深色主题为 85% 白色。'),
  token('--ads-message-padding', '9px 12px', 'Padding of the box.', 'Внутренние отступы блока.', '消息框内边距。'),
  token('--ads-message-line-height', '22px', 'Height of a line of text, and of the icon, so the box is 40px high with or without an icon.', 'Высота строки текста и иконки, поэтому блок высотой 40px с иконкой и без неё.', '文字行与图标的高度，因此无论有无图标消息框都是 40px 高。'),
  token('--ads-message-radius', '8px', 'Corner radius of the box.', 'Радиус углов блока.', '消息框圆角半径。'),
  token('--ads-message-shadow', '0 6px 16px 0 rgba(0, 0, 0, 0.08), 0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 9px 28px 8px rgba(0, 0, 0, 0.05)', 'Shadow of the box.', 'Тень блока.', '消息框阴影。'),
  token('--ads-message-icon-size', '16px', 'Size of the icon.', 'Размер иконки.', '图标大小。'),
  token('--ads-message-icon-gap', '8px', 'Gap between the icon, the text and the close button.', 'Промежуток между иконкой, текстом и кнопкой закрытия.', '图标、文字与关闭按钮之间的间距。'),
  token('--ads-message-icon-info', '#1677ff', 'Color of the <code>info</code> and <code>loading</code> icons.', 'Цвет иконок <code>info</code> и <code>loading</code>.', '<code>info</code> 与 <code>loading</code> 图标的颜色。'),
  token('--ads-message-icon-success', '#52c41a', 'Color of the <code>success</code> icon. <code>tokens-accessible.css</code> darkens it to #389e0d (3:1 on the white box).', 'Цвет иконки <code>success</code>. <code>tokens-accessible.css</code> затемняет её до #389e0d (3:1 на белом блоке).', '<code>success</code> 图标的颜色。<code>tokens-accessible.css</code> 会将其加深为 #389e0d（在白色消息框上达到 3:1）。'),
  token('--ads-message-icon-error', '#ff4d4f', 'Color of the <code>error</code> icon.', 'Цвет иконки <code>error</code>.', '<code>error</code> 图标的颜色。'),
  token('--ads-message-icon-warning', '#faad14', 'Color of the <code>warning</code> icon. <code>tokens-accessible.css</code> darkens it to #c27c00.', 'Цвет иконки <code>warning</code>. <code>tokens-accessible.css</code> затемняет её до #c27c00.', '<code>warning</code> 图标的颜色。<code>tokens-accessible.css</code> 会将其加深为 #c27c00。'),
  token('--ads-message-close-size', '24px', 'Size of the close button: 24px, the smallest target of WCAG 2.5.8.', 'Размер кнопки закрытия: 24px, минимальная цель по WCAG 2.5.8.', '关闭按钮大小：24px，WCAG 2.5.8 要求的最小目标尺寸。'),
  token('--ads-message-close-color', 'rgba(0, 0, 0, 0.65)', 'Color of the close button (4.5:1 on the box).', 'Цвет кнопки закрытия (4.5:1 на блоке).', '关闭按钮颜色（在消息框上达到 4.5:1）。'),
  token('--ads-message-close-color-hover', 'rgba(0, 0, 0, 0.88)', 'Color of the close button on hover.', 'Цвет кнопки закрытия при наведении.', '关闭按钮悬停时的颜色。'),
  token('--ads-message-close-bg-hover', 'rgba(0, 0, 0, 0.06)', 'Background of the close button on hover.', 'Фон кнопки закрытия при наведении.', '关闭按钮悬停时的背景。'),
  token('--ads-message-motion-offset', '64px', 'How far above its place a message starts to come in and ends to leave.', 'На сколько выше своего места сообщение начинает появляться и заканчивает уходить.', '消息进入时的起始位置与离开时的终止位置距其所在位置的上方距离。'),
  token('--ads-message-stack-offset', '8px', 'Step between the rows of a pile.', 'Шаг между строками стопки.', '堆叠中各行之间的偏移。'),
  token('--ads-message-stack-scale-step', '0.06', 'How much smaller each row of a pile is than the one in front of it.', 'Насколько каждая строка стопки меньше предыдущей.', '堆叠中每一行比前一行缩小的比例。')
];
