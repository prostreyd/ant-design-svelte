// Data of the Notification page. The tables are checked against the source by tests/docs/notification-page.test.ts.
import type { ApiRow, DemoMeta, TokenRow } from './button.ts';

export const demos: DemoMeta[] = [
  {
    slug: 'basic',
    title: { en: 'Basic', ru: 'Базовый пример', zh: '基本用法' },
    description: {
      en: 'A call from anywhere in your code shows a notification at the top right of the window: no setup and no markup. A notification has a <code>title</code> and an optional <code>description</code>, and goes away after 4.5 seconds. The call returns a function that closes it.',
      ru: 'Вызов из любого места кода показывает уведомление справа вверху окна: без настройки и без разметки. У уведомления есть <code>title</code> и необязательный <code>description</code>, и уходит оно через 4,5 секунды. Вызов возвращает функцию, которая его закрывает.',
      zh: '在代码的任何位置调用即可在窗口右上角显示通知：无需配置，也无需写标签。通知包含 <code>title</code> 和可选的 <code>description</code>，4.5 秒后自动消失。调用会返回一个用于关闭它的函数。'
    }
  },
  {
    slug: 'types',
    title: { en: 'Types', ru: 'Типы', zh: '通知类型' },
    description: {
      en: '<code>success</code>, <code>info</code>, <code>warning</code> and <code>error</code> have an icon of their type; <code>open</code> has none. A screen reader reads <code>error</code> and <code>warning</code> at once, and the others when it has finished, and says the type before the title.',
      ru: '<code>success</code>, <code>info</code>, <code>warning</code> и <code>error</code> показывают иконку своего вида, а у <code>open</code> иконки нет. Скринридер зачитывает <code>error</code> и <code>warning</code> сразу, остальные — когда закончит чтение, и произносит вид перед заголовком.',
      zh: '<code>success</code>、<code>info</code>、<code>warning</code> 和 <code>error</code> 带有各自类型的图标，<code>open</code> 没有图标。屏幕阅读器会立即朗读 <code>error</code> 和 <code>warning</code>，其余类型则等它读完当前内容再朗读，并在标题前读出类型。'
    }
  },
  {
    slug: 'placement',
    title: { en: 'Placement', ru: 'Расположение', zh: '弹出位置' },
    description: {
      en: 'Six places: <code>topLeft</code>, <code>top</code>, <code>topRight</code>, <code>bottomLeft</code>, <code>bottom</code> and <code>bottomRight</code>. Each is its own list. The newest notification stands nearest the window edge, and the older ones are pushed away from it. A notification comes in from the side of its place.',
      ru: 'Шесть мест: <code>topLeft</code>, <code>top</code>, <code>topRight</code>, <code>bottomLeft</code>, <code>bottom</code> и <code>bottomRight</code>. У каждого свой список. Самое новое уведомление стоит ближе всего к краю окна, а старые оттесняются от него. Уведомление выезжает со стороны своего места.',
      zh: '六个位置：<code>topLeft</code>、<code>top</code>、<code>topRight</code>、<code>bottomLeft</code>、<code>bottom</code> 和 <code>bottomRight</code>。每个位置有自己的列表。最新的通知离窗口边缘最近，较早的通知被推离边缘。通知从其所在位置的一侧进入。'
    },
    wide: true
  },
  {
    slug: 'duration',
    title: { en: 'Duration', ru: 'Длительность', zh: '自动关闭的延时' },
    description: {
      en: '<code>duration</code> is in seconds (default 4.5). <code>0</code> or <code>false</code> keeps the notification until it is closed. The function that a call returns closes it.',
      ru: '<code>duration</code> задаётся в секундах (по умолчанию 4,5). <code>0</code> или <code>false</code> оставляет уведомление, пока его не закроют. Функция, которую возвращает вызов, закрывает его.',
      zh: '<code>duration</code> 以秒为单位（默认 4.5）。<code>0</code> 或 <code>false</code> 表示一直显示，直到被关闭。调用返回的函数可以关闭该通知。'
    }
  },
  {
    slug: 'update',
    title: { en: 'Update by key', ru: 'Обновление по ключу', zh: '通过 key 更新内容' },
    description: {
      en: 'A call with the <code>key</code> of an open notification updates it in place: here an upload that is going on turns into a finished one. The box keeps its place, its type changes, and a screen reader reads the new text.',
      ru: 'Вызов с <code>key</code> открытого уведомления обновляет его на месте: здесь идущая загрузка превращается в завершённую. Блок остаётся на своём месте, вид меняется, а скринридер зачитывает новый текст.',
      zh: '使用已打开通知的 <code>key</code> 再次调用会原地更新它：这里进行中的上传变成了已完成。通知框的位置保持不变，类型会变化，屏幕阅读器会朗读新的文字。'
    }
  },
  {
    slug: 'actions',
    title: { en: 'Actions', ru: 'Действия', zh: '自定义按钮' },
    description: {
      en: '<code>actions</code> is content under the text, at the inline end: usually buttons. They are your own elements, so the keyboard reaches them after the text and before the close button.',
      ru: '<code>actions</code> — содержимое под текстом, у конца строки: обычно кнопки. Это ваши собственные элементы, поэтому с клавиатуры до них добираются после текста и перед кнопкой закрытия.',
      zh: '<code>actions</code> 是文字下方、行末位置的内容：通常是按钮。它们是你自己的元素，因此键盘会在文字之后、关闭按钮之前到达它们。'
    }
  },
  {
    slug: 'icon',
    title: { en: 'Icon', ru: 'Иконка', zh: '自定义图标' },
    description: {
      en: '<code>icon</code> replaces the icon of the type: a string (an emoji), a snippet, or <code>false</code> for none. The box keeps its height with or without an icon.',
      ru: '<code>icon</code> заменяет иконку вида: строка (эмодзи), snippet или <code>false</code>, если иконка не нужна. Высота блока одинакова с иконкой и без неё.',
      zh: '<code>icon</code> 会替换类型图标：可以是字符串（如 emoji）、snippet，或用 <code>false</code> 去掉图标。无论有无图标，通知框高度保持一致。'
    }
  },
  {
    slug: 'close',
    title: { en: 'Close button', ru: 'Кнопка закрытия', zh: '关闭按钮' },
    description: {
      en: 'The close button is there by default. <code>closable: false</code> or <code>closeIcon: false</code> removes it; <code>closeIcon</code> replaces the cross with a string or a snippet. Its name for a screen reader is <code>labels.close</code>.',
      ru: 'Кнопка закрытия есть по умолчанию. <code>closable: false</code> или <code>closeIcon: false</code> убирает её; <code>closeIcon</code> заменяет крестик строкой или snippet-ом. Имя для скринридера — <code>labels.close</code>.',
      zh: '关闭按钮默认显示。<code>closable: false</code> 或 <code>closeIcon: false</code> 会移除它；<code>closeIcon</code> 可用字符串或 snippet 替换叉号。它对屏幕阅读器的名称来自 <code>labels.close</code>。'
    }
  },
  {
    slug: 'progress',
    title: { en: 'Progress bar', ru: 'Полоса времени', zh: '进度条' },
    description: {
      en: '<code>showProgress</code> draws a strip that runs down with the time left. It is drawn from the timer that closes the notification, so it stands still whenever the timer does (the pointer, the focus, an open pile, a hidden page). It is decorative and is not announced.',
      ru: '<code>showProgress</code> рисует полосу, которая убывает вместе с оставшимся временем. Она рисуется по тому же таймеру, что закрывает уведомление, поэтому стоит, когда стоит таймер (курсор, фокус, открытая стопка, скрытая страница). Она декоративна и не озвучивается.',
      zh: '<code>showProgress</code> 会绘制一条随剩余时间缩短的进度条。它依据关闭通知的同一个计时器绘制，因此计时器暂停时（指针、焦点、展开的堆叠、页面隐藏）它也会停下。它仅作装饰，不会被朗读。'
    }
  },
  {
    slug: 'pause',
    title: { en: 'Pause', ru: 'Пауза', zh: '悬停暂停' },
    description: {
      en: 'The timer waits while the pointer (a mouse or a pen, not a touch) is over the box, while focus is inside it and while the page is hidden, and then goes on with the time that was left. <code>pauseOnHover: false</code> turns the pointer off.',
      ru: 'Таймер ждёт, пока курсор (мышь или перо, не касание) над блоком, пока фокус внутри и пока страница скрыта, а затем идёт дальше с оставшимся временем. <code>pauseOnHover: false</code> отключает курсор.',
      zh: '指针（鼠标或触控笔，触摸除外）在通知框上、焦点在框内、或页面被隐藏时，计时器会暂停，之后按剩余时间继续。<code>pauseOnHover: false</code> 会关闭指针暂停。'
    }
  },
  {
    slug: 'stack',
    title: { en: 'Stack', ru: 'Стопка', zh: '堆叠' },
    description: {
      en: 'On by default: past 3 notifications in a place (the threshold) the older ones lie behind the newest one, and the pointer or focus opens the pile and holds every timer. <code>stack: false</code> turns it off, <code>{ threshold }</code> changes the number. Each place has its own pile.',
      ru: 'Включена по умолчанию: после 3 уведомлений в одном месте (порог) старые ложатся за самым новым, а курсор или фокус раскрывают стопку и держат все таймеры. <code>stack: false</code> отключает её, <code>{ threshold }</code> меняет число. У каждого места своя стопка.',
      zh: '默认开启：同一位置的通知超过 3 条（阈值）后，较早的通知会叠在最新通知后面，指针或焦点会展开堆叠并暂停所有计时器。<code>stack: false</code> 可关闭，<code>{ threshold }</code> 可更改数量。每个位置都有自己的堆叠。'
    },
    wide: true
  },
  {
    slug: 'count',
    title: { en: 'Maximum count', ru: 'Максимум', zh: '最大显示数量' },
    description: {
      en: "<code>maxCount</code> limits the open notifications of all places together: a new one closes the oldest, and its <code>onclose</code> gets the reason <code>'replaced'</code>.",
      ru: "<code>maxCount</code> ограничивает число открытых уведомлений во всех местах вместе: новое закрывает самое старое, и его <code>onclose</code> получает причину <code>'replaced'</code>.",
      zh: "<code>maxCount</code> 限制所有位置合计的已打开通知数：新通知会关闭最早的一条，其 <code>onclose</code> 会收到原因 <code>'replaced'</code>。"
    }
  },
  {
    slug: 'styling',
    title: { en: 'Styling', ru: 'Оформление', zh: '自定义样式' },
    description: {
      en: '<code>class</code> and <code>style</code> go on the box; <code>classNames</code> and <code>styles</code> address its parts (<code>root</code>, <code>icon</code>, <code>section</code>, <code>title</code>, <code>description</code>, <code>actions</code>, <code>close</code>, <code>progress</code>); <code>props</code> puts <code>data-*</code> and <code>aria-*</code> attributes on it.',
      ru: '<code>class</code> и <code>style</code> ставятся на блок; <code>classNames</code> и <code>styles</code> адресуют его части (<code>root</code>, <code>icon</code>, <code>section</code>, <code>title</code>, <code>description</code>, <code>actions</code>, <code>close</code>, <code>progress</code>); <code>props</code> добавляет ему атрибуты <code>data-*</code> и <code>aria-*</code>.',
      zh: '<code>class</code> 和 <code>style</code> 作用于通知框；<code>classNames</code> 和 <code>styles</code> 针对其各个部分（<code>root</code>、<code>icon</code>、<code>section</code>、<code>title</code>、<code>description</code>、<code>actions</code>、<code>close</code>、<code>progress</code>）；<code>props</code> 会为其添加 <code>data-*</code> 和 <code>aria-*</code> 属性。'
    }
  },
  {
    slug: 'events',
    title: { en: 'Click and close', ru: 'Клик и закрытие', zh: '点击与关闭事件' },
    description: {
      en: "<code>onclick</code> is called with the event when the box is clicked (not when the close button is). <code>onclose</code> is called once, when the notification starts to close, with the reason: <code>'timeout'</code>, <code>'user'</code> (the close button or Escape), <code>'replaced'</code> (the limit) or <code>'destroy'</code> (code).",
      ru: "<code>onclick</code> вызывается с событием при клике по блоку (не по кнопке закрытия). <code>onclose</code> вызывается один раз, когда уведомление начинает закрываться, с причиной: <code>'timeout'</code>, <code>'user'</code> (кнопка закрытия или Escape), <code>'replaced'</code> (лимит) или <code>'destroy'</code> (код).",
      zh: "点击通知框（而非关闭按钮）时会带着事件调用 <code>onclick</code>。通知开始关闭时会调用一次 <code>onclose</code>，并带有原因：<code>'timeout'</code>、<code>'user'</code>（关闭按钮或 Escape）、<code>'replaced'</code>（数量限制）或 <code>'destroy'</code>（代码关闭）。"
    }
  },
  {
    slug: 'content',
    title: { en: 'Content', ru: 'Содержимое', zh: '内容' },
    description: {
      en: '<code>title</code>, <code>description</code> and <code>actions</code> are a string, a number (<code>0</code> is shown) or a snippet. A snippet is drawn in the layer, so it sees the context of the place where the host is, not of the component that wrote it.',
      ru: '<code>title</code>, <code>description</code> и <code>actions</code> — строка, число (<code>0</code> показывается) или snippet. Snippet рисуется в слое, поэтому видит контекст того места, где стоит хост, а не компонента, который его написал.',
      zh: '<code>title</code>、<code>description</code> 和 <code>actions</code> 可以是字符串、数字（<code>0</code> 会显示）或 snippet。snippet 在浮层中渲染，因此看到的是宿主所在位置的上下文，而不是编写它的组件的上下文。'
    }
  },
  {
    slug: 'host',
    title: { en: 'NotificationHost', ru: 'NotificationHost', zh: 'NotificationHost' },
    description: {
      en: '<code>&lt;NotificationHost&gt;</code> draws the notifications where you put it; its props are the settings and win over <code>notification.config()</code>. Without one the library makes a layer on the page by itself. Only one host is active: the one mounted last.',
      ru: '<code>&lt;NotificationHost&gt;</code> рисует уведомления там, где вы его поставили; его пропсы — это настройки, и они важнее <code>notification.config()</code>. Без него библиотека сама создаёт слой на странице. Активен только один хост: смонтированный последним.',
      zh: '<code>&lt;NotificationHost&gt;</code> 会在你放置的位置绘制通知；它的 props 就是设置，优先于 <code>notification.config()</code>。没有它时，库会自己在页面上创建浮层。同一时间只有一个宿主生效：最后挂载的那个。'
    }
  },
  {
    slug: 'destroy',
    title: { en: 'Destroy', ru: 'Закрыть всё', zh: '全部销毁' },
    description: {
      en: "<code>notification.destroy(key)</code> closes one notification, <code>notification.destroy()</code> closes every one. Each runs its normal exit and its <code>onclose</code> with the reason <code>'destroy'</code>.",
      ru: "<code>notification.destroy(key)</code> закрывает одно уведомление, <code>notification.destroy()</code> — все. Каждое проходит обычный уход и вызывает свой <code>onclose</code> с причиной <code>'destroy'</code>.",
      zh: "<code>notification.destroy(key)</code> 关闭一条通知，<code>notification.destroy()</code> 关闭全部。每条通知都会执行正常的离场过程，并以原因 <code>'destroy'</code> 调用其 <code>onclose</code>。"
    }
  },
  {
    slug: 'container',
    title: { en: 'Container', ru: 'Контейнер', zh: '容器' },
    description: {
      en: '<code>container</code> is the element that the layer is put in (the <code>body</code> by default). The layer stays <code>position: fixed</code>, so the notification is still drawn at the window; what changes is where the layer sits in the page. That matters for a native modal <code>&lt;dialog&gt;</code>: it is shown over everything outside of it, so a layer in the body is covered by it, and a layer in the dialog stands above it and can be used. (The library\'s <code>Modal</code> does not need this: the layer stays above it.) The setting belongs to <code>notification.config()</code> or to a <code>NotificationHost</code>, so it applies to every call on the page while it is in force; this example gives it back when the dialog closes.',
      ru: '<code>container</code> — элемент, в который кладётся слой (по умолчанию <code>body</code>). Слой остаётся <code>position: fixed</code>, поэтому уведомление по-прежнему рисуется у окна; меняется место слоя в странице. Это важно для нативного модального <code>&lt;dialog&gt;</code>: он показывается поверх всего, что вне его, поэтому слой в <code>body</code> он закрывает, а слой внутри диалога стоит над ним и доступен. (<code>Modal</code> библиотеки в этом не нуждается: слой остаётся над ним.) Настройка принадлежит <code>notification.config()</code> или <code>NotificationHost</code>, поэтому, пока она действует, касается всех вызовов на странице; этот пример возвращает её, когда диалог закрывается.',
      zh: '<code>container</code> 是放置浮层的元素（默认是 <code>body</code>）。浮层仍是 <code>position: fixed</code>，所以通知仍绘制在窗口处；改变的是浮层在页面中的位置。这对原生模态 <code>&lt;dialog&gt;</code> 很重要：它显示在其外部所有内容之上，因此放在 <code>body</code> 里的浮层会被它盖住，而放在对话框里的浮层则位于其上方并可操作。（库自带的 <code>Modal</code> 不需要这样做：浮层本来就在它上方。）该设置属于 <code>notification.config()</code> 或 <code>NotificationHost</code>，生效期间对页面上的所有调用都有效；本示例会在对话框关闭时恢复它。'
    }
  },
];

const options = (en: string, ru: string, zh: string) => ({ en, ru, zh });

export const optionRows: ApiRow[] = [
  {
    name: 'title',
    description: options('The first line: a string, a number (<code>0</code> is shown) or a snippet. Required. This is the name <code>title</code> that Ant Design React 6 uses (<code>message</code> is deprecated there).', 'Первая строка: строка, число (<code>0</code> показывается) или snippet. Обязателен. Это имя <code>title</code> из Ant Design React 6 (<code>message</code> там устарел).', '第一行：字符串、数字（<code>0</code> 会显示）或 snippet。必填。这是 Ant Design React 6 使用的名称 <code>title</code>（那里的 <code>message</code> 已弃用）。'),
    type: 'NotificationContent',
    default: '—'
  },
  {
    name: 'description',
    description: options('The text under the title. Optional: a title alone is a valid notification.', 'Текст под заголовком. Необязателен: одного заголовка достаточно.', '标题下方的文字。可选：只有标题也是有效的通知。'),
    type: 'NotificationContent',
    default: '—'
  },
  {
    name: 'actions',
    description: options('Content under the text, at the inline end: usually buttons. The elements you put here are the ones the keyboard reaches (React <code>actions</code>, Vue <code>btn</code>).', 'Содержимое под текстом, у конца строки: обычно кнопки. Элементы отсюда — те, до которых добирается клавиатура (<code>actions</code> в React, <code>btn</code> в Vue).', '文字下方、行末位置的内容：通常是按钮。你放在这里的元素就是键盘可以到达的元素（React 的 <code>actions</code>，Vue 的 <code>btn</code>）。'),
    type: 'NotificationContent',
    default: '—'
  },
  {
    name: 'icon',
    description: options('Replaces the icon of the type; <code>false</code> removes it. <code>open</code> has no icon unless one is given.', 'Заменяет иконку вида; <code>false</code> убирает её. У <code>open</code> иконки нет, пока её не передали.', '替换类型图标；<code>false</code> 会移除图标。<code>open</code> 默认没有图标，除非传入一个。'),
    type: 'string | Snippet | false',
    default: 'the icon of the type'
  },
  {
    name: 'duration',
    description: options('Seconds before the notification goes away. <code>0</code> or <code>false</code> keeps it until it is closed. A negative or non-finite value falls back to the default (with a warning while developing). Angular counts in milliseconds; we do not.', 'Секунды до ухода уведомления. <code>0</code> или <code>false</code> оставляет его, пока не закроют. Отрицательное или нечисловое значение заменяется значением по умолчанию (с предупреждением при разработке). Angular считает в миллисекундах; мы нет.', '通知消失前的秒数。<code>0</code> 或 <code>false</code> 表示一直显示，直到被关闭。负数或非有限数值会回退为默认值（开发时会有警告）。Angular 使用毫秒，这里不是。'),
    type: 'number | false',
    default: '4.5'
  },
  {
    name: 'key',
    description: options('A call with the key of an open notification updates that notification in place (new type, texts and options; the timer starts again). Without one a key is generated.', 'Вызов с ключом открытого уведомления обновляет его на месте (новые вид, тексты и параметры; таймер запускается заново). Без ключа он создаётся сам.', '使用已打开通知的 key 调用会原地更新该通知（新的类型、文字和选项，计时器重新开始）。未提供时会自动生成。'),
    type: 'string | number',
    default: 'generated'
  },
  {
    name: 'placement',
    description: options('Where it stands: its own place, or the default of the host and of <code>notification.config()</code>.', 'Где оно стоит: своё место или значение по умолчанию хоста и <code>notification.config()</code>.', '通知所在的位置：它自己的位置，或宿主与 <code>notification.config()</code> 的默认位置。'),
    type: "'top' | 'topLeft' | 'topRight' | 'bottom' | 'bottomLeft' | 'bottomRight'",
    default: "'topRight'"
  },
  {
    name: 'closable',
    description: options('Shows the close button. The default of the host and of <code>notification.config()</code> applies when it is not set.', 'Показывает кнопку закрытия. Если не задано, действует значение по умолчанию хоста и <code>notification.config()</code>.', '显示关闭按钮。未设置时使用宿主和 <code>notification.config()</code> 的默认值。'),
    type: 'boolean',
    default: 'true'
  },
  {
    name: 'closeIcon',
    description: options('Replaces the cross of the close button; <code>false</code> removes the button. The name of the button for a screen reader stays <code>labels.close</code>. The object form of React <code>closable</code> is not taken: it is <code>closeIcon</code> and <code>onclose</code>.', 'Заменяет крестик кнопки закрытия; <code>false</code> убирает кнопку. Имя кнопки для скринридера остаётся <code>labels.close</code>. Объектная форма <code>closable</code> из React не взята: это <code>closeIcon</code> и <code>onclose</code>.', '替换关闭按钮的叉号；<code>false</code> 会移除按钮。按钮对屏幕阅读器的名称仍为 <code>labels.close</code>。未采用 React <code>closable</code> 的对象形式：对应的是 <code>closeIcon</code> 和 <code>onclose</code>。'),
    type: 'string | Snippet | false',
    default: 'the cross'
  },
  {
    name: 'showProgress',
    description: options('Shows a strip at the bottom of the box that runs down with the time left. It stands still while the timer does, and there is none with <code>duration: 0</code>.', 'Показывает полосу внизу блока, которая убывает с оставшимся временем. Она стоит, когда стоит таймер, и её нет при <code>duration: 0</code>.', '在通知框底部显示一条随剩余时间缩短的进度条。计时器暂停时它也停下，<code>duration: 0</code> 时没有进度条。'),
    type: 'boolean',
    default: 'false'
  },
  {
    name: 'pauseOnHover',
    description: options('Holds the timer while the pointer (a mouse or a pen) is over the box. Focus inside, an open pile and a hidden page hold it whatever this says.', 'Удерживает таймер, пока курсор (мышь или перо) над блоком. Фокус внутри, раскрытая стопка и скрытая страница удерживают его независимо от этого значения.', '指针（鼠标或触控笔）在通知框上时暂停计时。焦点在框内、堆叠展开或页面被隐藏时，无论此值如何都会暂停。'),
    type: 'boolean',
    default: 'true'
  },
  {
    name: 'role',
    description: options('Overrides the role. By default <code>error</code> and <code>warning</code> are <code>alert</code> (read out at once) and the others <code>status</code>.', 'Переопределяет роль. По умолчанию у <code>error</code> и <code>warning</code> <code>alert</code> (зачитывается сразу), у остальных <code>status</code>.', '覆盖角色。默认 <code>error</code> 和 <code>warning</code> 为 <code>alert</code>（立即朗读），其余为 <code>status</code>。'),
    type: "'alert' | 'status'",
    default: 'by type'
  },
  {
    name: 'class',
    description: options('Extra classes of the box.', 'Дополнительные классы блока.', '通知框的额外类名。'),
    type: 'string',
    default: '—'
  },
  {
    name: 'style',
    description: options('Inline style of the box: a string, or an object of CSS properties (kebab-case or custom properties; numbers are written as they are).', 'Инлайн-стиль блока: строка или объект CSS-свойств (kebab-case или custom properties; числа записываются как есть).', '通知框的内联样式：字符串或 CSS 属性对象（kebab-case 或自定义属性；数字按原样写入）。'),
    type: 'string | Record<string, string | number>',
    default: '—'
  },
  {
    name: 'classNames',
    description: options('Extra classes for the parts. A value here wins over the one of the host and of <code>notification.config()</code>.', 'Дополнительные классы для частей. Значение здесь важнее значения хоста и <code>notification.config()</code>.', '为各部分添加的类名。此处的值优先于宿主和 <code>notification.config()</code> 中的值。'),
    type: '{ root?, icon?, section?, title?, description?, actions?, close?, progress? }',
    default: '—'
  },
  {
    name: 'styles',
    description: options('The same for inline styles, as objects.', 'То же для инлайн-стилей, объектами.', '内联样式的同样设置，使用对象。'),
    type: '{ root?, icon?, section?, title?, description?, actions?, close?, progress? }',
    default: '—'
  },
  {
    name: 'props',
    description: options('Attributes put on the box (React <code>props</code>): <code>data-*</code> and <code>aria-*</code>.', 'Атрибуты блока (<code>props</code> из React): <code>data-*</code> и <code>aria-*</code>.', '放在通知框上的属性（React 的 <code>props</code>）：<code>data-*</code> 和 <code>aria-*</code>。'),
    type: 'Record<`data-${string}` | `aria-${string}`, string>',
    default: '—'
  },
  {
    name: 'onclick',
    description: options('Called with the event when the box is clicked, not when its close button is. A click does not close the notification.', 'Вызывается с событием при клике по блоку, не по кнопке закрытия. Клик не закрывает уведомление.', '点击通知框（而非其关闭按钮）时带着事件调用。点击不会关闭通知。'),
    type: '(event: MouseEvent) => void',
    default: '—'
  },
  {
    name: 'onclose',
    description: options('Called once, when the notification starts to close, with the reason: the time ran out, the user closed it (the close button or Escape), the limit pushed it out, or code closed it (<code>destroy</code> or the returned function). Angular says only whether the user closed it; React and Vue pass nothing.', 'Вызывается один раз, когда уведомление начинает закрываться, с причиной: вышло время, закрыл пользователь (кнопка или Escape), вытеснил лимит или закрыл код (<code>destroy</code> или возвращённая функция). Angular сообщает лишь, закрыл ли пользователь; React и Vue ничего не передают.', '通知开始关闭时调用一次，并带有原因：时间到、用户关闭（关闭按钮或 Escape）、被数量限制挤出，或由代码关闭（<code>destroy</code> 或返回的函数）。Angular 只告知是否由用户关闭；React 和 Vue 不传任何参数。'),
    type: "(reason: 'timeout' | 'user' | 'replaced' | 'destroy') => void",
    default: '—'
  }
];

export const methodRows: ApiRow[] = [
  {
    name: 'notification.open(options)',
    description: options("Opens a notification with no type icon, or updates the open one with the same <code>key</code>. Returns a function that closes it. It is not thenable (Message's is).", 'Открывает уведомление без иконки вида или обновляет открытое с тем же <code>key</code>. Возвращает функцию, закрывающую его. Она не thenable (у Message — thenable).', '打开一条没有类型图标的通知，或更新具有相同 <code>key</code> 的已打开通知。返回一个用于关闭它的函数。它不是 thenable（Message 的是）。'),
    type: '() => void',
    default: '—'
  },
  {
    name: 'notification.info | success | error | warning(options)',
    description: options('One method for each kind, with the same options. Without a window (on a server) every call does nothing and returns a function that does nothing.', 'По методу на каждый вид, с теми же параметрами. Без окна (на сервере) любой вызов ничего не делает и возвращает функцию, которая ничего не делает.', '每种类型一个方法，选项相同。没有窗口时（服务器端）调用不会有任何效果，并返回一个什么都不做的函数。'),
    type: '() => void',
    default: '—'
  },
  {
    name: 'notification.destroy(key?)',
    description: options("Closes the notification with this key, or every notification. Each one runs its normal exit and its <code>onclose</code> with the reason <code>'destroy'</code>.", "Закрывает уведомление с этим ключом или все уведомления. Каждое проходит обычный уход и вызывает свой <code>onclose</code> с причиной <code>'destroy'</code>.", "关闭该 key 对应的通知，或关闭所有通知。每条通知都会执行正常的离场过程，并以原因 <code>'destroy'</code> 调用其 <code>onclose</code>。"),
    type: 'void',
    default: '—'
  },
  {
    name: 'notification.config(options)',
    description: options('Sets defaults for every notification from now on (the settings table below). A setting given as <code>{ top: undefined }</code> goes back to its default.', 'Задаёт значения по умолчанию для всех уведомлений с этого момента (таблица настроек ниже). Настройка, переданная как <code>{ top: undefined }</code>, возвращается к значению по умолчанию.', '设置此后所有通知的默认值（见下方设置表）。以 <code>{ top: undefined }</code> 传入的设置会还原为默认值。'),
    type: 'void',
    default: '—'
  }
];

export const settingRows: ApiRow[] = [
  {
    name: 'top',
    description: options('Distance of the top places from the top of the window. A number is pixels.', 'Расстояние верхних мест от верха окна. Число — пиксели.', '顶部位置距窗口顶部的距离。数字表示像素。'),
    type: 'number | string',
    default: '24'
  },
  {
    name: 'bottom',
    description: options('Distance of the bottom places from the bottom of the window. A number is pixels.', 'Расстояние нижних мест от низа окна. Число — пиксели.', '底部位置距窗口底部的距离。数字表示像素。'),
    type: 'number | string',
    default: '24'
  },
  {
    name: 'placement',
    description: options('The place of every notification that does not name one.', 'Место каждого уведомления, которое своё не указало.', '未指定位置的通知所在的位置。'),
    type: "'top' | 'topLeft' | 'topRight' | 'bottom' | 'bottomLeft' | 'bottomRight'",
    default: "'topRight'"
  },
  {
    name: 'duration',
    description: options('Default duration in seconds. <code>0</code> and <code>false</code> never close.', 'Длительность по умолчанию в секундах. <code>0</code> и <code>false</code> не закрывают.', '默认时长（秒）。<code>0</code> 和 <code>false</code> 表示不自动关闭。'),
    type: 'number | false',
    default: '4.5'
  },
  {
    name: 'maxCount',
    description: options("At most this many open notifications, in all places together; the oldest is closed to make room (reason <code>'replaced'</code>). Ant Design React and Angular count the same way, Vue counts for each place.", "Не больше стольких открытых уведомлений во всех местах вместе; старейшее закрывается (причина <code>'replaced'</code>). React и Angular считают так же, Vue — отдельно для каждого места.", "最多同时打开这么多条通知（所有位置合计）；会关闭最早的一条（原因 <code>'replaced'</code>）。Ant Design React 和 Angular 的计数方式相同，Vue 则按位置分别计数。"),
    type: 'number',
    default: '—'
  },
  {
    name: 'container',
    description: options('The element that the layer is put in. Only where it sits in the page: the layer stays <code>position: fixed</code>, drawn at the window (Ant Design <code>getContainer</code>). Useful for a native modal <code>&lt;dialog&gt;</code>, which covers everything outside of it.', 'Элемент, в который кладётся слой. Это только место в странице: слой остаётся <code>position: fixed</code> и рисуется у окна (<code>getContainer</code> в Ant Design). Нужен, например, для нативного модального <code>&lt;dialog&gt;</code>, который закрывает всё, что вне его.', '放置浮层的元素。只决定它在页面中的位置：浮层仍为 <code>position: fixed</code>，绘制在窗口处（对应 Ant Design 的 <code>getContainer</code>）。适用于原生模态 <code>&lt;dialog&gt;</code>，它会盖住其外部的所有内容。'),
    type: 'HTMLElement | (() => HTMLElement)',
    default: 'document.body'
  },
  {
    name: 'closable',
    description: options('Default of <code>closable</code>.', 'Значение <code>closable</code> по умолчанию.', '<code>closable</code> 的默认值。'),
    type: 'boolean',
    default: 'true'
  },
  {
    name: 'closeIcon',
    description: options('Default of <code>closeIcon</code>.', 'Значение <code>closeIcon</code> по умолчанию.', '<code>closeIcon</code> 的默认值。'),
    type: 'string | Snippet | false',
    default: 'the cross'
  },
  {
    name: 'showProgress',
    description: options('Default of <code>showProgress</code>.', 'Значение <code>showProgress</code> по умолчанию.', '<code>showProgress</code> 的默认值。'),
    type: 'boolean',
    default: 'false'
  },
  {
    name: 'pauseOnHover',
    description: options('Default of <code>pauseOnHover</code>.', 'Значение <code>pauseOnHover</code> по умолчанию.', '<code>pauseOnHover</code> 的默认值。'),
    type: 'boolean',
    default: 'true'
  },
  {
    name: 'labels',
    description: options('The type word read before the title (an empty word is none, which is the default of <code>open</code>), and the name of the close button. Pass a translation here: the library has no locale system yet.', 'Слово вида, которое читают перед заголовком (пустое слово — без слова, так по умолчанию у <code>open</code>), и имя кнопки закрытия. Переводы передавайте здесь: системы локалей в библиотеке пока нет.', '标题前朗读的类型词（空字符串表示不读，<code>open</code> 默认如此）以及关闭按钮的名称。请在这里传入翻译：库目前还没有语言包系统。'),
    type: '{ open?, info?, success?, error?, warning?, close? }',
    default: '{ info: "Info", success: "Success", error: "Error", warning: "Warning", close: "Close" }'
  },
  {
    name: 'classNames',
    description: options('Defaults for the parts of every notification, and the two parts of a place: <code>list</code> (the scrolling column) and <code>listContent</code> (the rows).', 'Значения по умолчанию для частей каждого уведомления и две части места: <code>list</code> (прокручиваемая колонка) и <code>listContent</code> (строки).', '每条通知各部分的默认类名，以及位置的两个部分：<code>list</code>（可滚动的列）和 <code>listContent</code>（各行）。'),
    type: '{ root?, icon?, section?, title?, description?, actions?, close?, progress?, list?, listContent? }',
    default: '—'
  },
  {
    name: 'styles',
    description: options('The same for inline styles, as objects.', 'То же для инлайн-стилей, объектами.', '内联样式的同样设置，使用对象。'),
    type: '{ root?, icon?, section?, title?, description?, actions?, close?, progress?, list?, listContent? }',
    default: '—'
  },
  {
    name: 'stack',
    description: options('On by default (as in Ant Design React): past the threshold (3) the older notifications of a place lie behind the newest, and the pointer or focus opens the pile. <code>false</code> turns it off, <code>{ threshold }</code> changes the number.', 'Включена по умолчанию (как в Ant Design React): после порога (3) старые уведомления места ложатся за самым новым, а курсор или фокус раскрывают стопку. <code>false</code> отключает, <code>{ threshold }</code> меняет число.', '默认开启（与 Ant Design React 相同）：超过阈值（3）后，该位置较早的通知会叠在最新通知后面，指针或焦点会展开堆叠。<code>false</code> 可关闭，<code>{ threshold }</code> 可更改数量。'),
    type: 'boolean | { threshold?: number }',
    default: 'true'
  }
];

const token = (name: string, value: string, en: string, ru: string, zh: string): TokenRow => ({ name, value, description: { en, ru, zh } });

export const tokenRows: TokenRow[] = [
  token('--ads-notification-z-index', '2050', 'Layer of the notifications, above the messages (2010) and every popup (the tooltip is 1070).', 'Слой уведомлений, выше сообщений (2010) и любого всплывающего окна (у подсказки 1070).', '通知的层级，高于消息（2010）和所有弹出层（文字提示为 1070）。'),
  token('--ads-notification-width', '384px', 'Width of the box. It is never wider than the window.', 'Ширина блока. Он никогда не шире окна.', '通知框宽度。不会超过窗口宽度。'),
  token('--ads-notification-top', '24px', 'Distance of the top places from the top of the window, when <code>top</code> is not set.', 'Расстояние верхних мест от верха окна, если <code>top</code> не задан.', '未设置 <code>top</code> 时，顶部位置距窗口顶部的距离。'),
  token('--ads-notification-bottom', '24px', 'Distance of the bottom places from the bottom of the window, when <code>bottom</code> is not set.', 'Расстояние нижних мест от низа окна, если <code>bottom</code> не задан.', '未设置 <code>bottom</code> 时，底部位置距窗口底部的距离。'),
  token('--ads-notification-margin', '24px', 'Space kept free at the sides of the window, and at the far end of a place (it also leaves room for the shadow).', 'Свободное место по бокам окна и на дальнем конце места (оставляет также место для тени).', '窗口两侧以及位置远端保留的空白（同时为阴影留出空间）。'),
  token('--ads-notification-gap', '16px', 'Gap between two notifications.', 'Промежуток между двумя уведомлениями.', '两条通知之间的间距。'),
  token('--ads-notification-bg', '#ffffff', 'Background of the box. In the dark theme <code>#1f1f1f</code>.', 'Фон блока. В тёмной теме <code>#1f1f1f</code>.', '通知框背景。深色主题为 <code>#1f1f1f</code>。'),
  token('--ads-notification-color', 'rgba(0, 0, 0, 0.88)', 'Text color. In the dark theme 85% white.', 'Цвет текста. В тёмной теме 85% белого.', '文字颜色。深色主题为 85% 白色。'),
  token('--ads-notification-padding-block', '20px', 'Padding of the box above and below.', 'Внутренний отступ блока сверху и снизу.', '通知框上下内边距。'),
  token('--ads-notification-padding-inline', '24px', 'Padding of the box at the sides. The close button stands at this distance from the edge.', 'Внутренний отступ блока по бокам. На этом расстоянии от края стоит кнопка закрытия.', '通知框左右内边距。关闭按钮距边缘的距离也是它。'),
  token('--ads-notification-padding', 'var(--ads-notification-padding-block) var(--ads-notification-padding-inline)', 'Padding of the box (the two above).', 'Внутренние отступы блока (два предыдущих).', '通知框内边距（即上面两个）。'),
  token('--ads-notification-line-height', '22px', 'Height of a line of the description.', 'Высота строки описания.', '描述文字的行高。'),
  token('--ads-notification-radius', '8px', 'Corner radius of the box.', 'Радиус углов блока.', '通知框圆角半径。'),
  token('--ads-notification-shadow', '0 6px 16px 0 rgba(0, 0, 0, 0.08), 0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 9px 28px 8px rgba(0, 0, 0, 0.05)', 'Shadow of the box.', 'Тень блока.', '通知框阴影。'),
  token('--ads-notification-title-size', '16px', 'Font size of the title.', 'Размер шрифта заголовка.', '标题字号。'),
  token('--ads-notification-title-line-height', '24px', 'Height of a line of the title; the icon and the close button are centred on it.', 'Высота строки заголовка; иконка и кнопка закрытия центрируются по ней.', '标题的行高；图标与关闭按钮以它为中心对齐。'),
  token('--ads-notification-description-gap', '8px', 'Gap between the title and the description.', 'Промежуток между заголовком и описанием.', '标题与描述之间的间距。'),
  token('--ads-notification-actions-gap', '12px', 'Gap between the text and the actions.', 'Промежуток между текстом и действиями.', '文字与操作区之间的间距。'),
  token('--ads-notification-icon-size', '24px', 'Size of the icon.', 'Размер иконки.', '图标大小。'),
  token('--ads-notification-icon-gap', '12px', 'Gap between the icon and the text.', 'Промежуток между иконкой и текстом.', '图标与文字之间的间距。'),
  token('--ads-notification-icon-info', '#1677ff', 'Color of the <code>info</code> icon.', 'Цвет иконки <code>info</code>.', '<code>info</code> 图标的颜色。'),
  token('--ads-notification-icon-success', '#52c41a', 'Color of the <code>success</code> icon. <code>tokens-accessible.css</code> darkens it to #389e0d (3:1 on the white box).', 'Цвет иконки <code>success</code>. <code>tokens-accessible.css</code> затемняет её до #389e0d (3:1 на белом блоке).', '<code>success</code> 图标的颜色。<code>tokens-accessible.css</code> 会将其加深为 #389e0d（在白色通知框上达到 3:1）。'),
  token('--ads-notification-icon-error', '#ff4d4f', 'Color of the <code>error</code> icon.', 'Цвет иконки <code>error</code>.', '<code>error</code> 图标的颜色。'),
  token('--ads-notification-icon-warning', '#faad14', 'Color of the <code>warning</code> icon. <code>tokens-accessible.css</code> darkens it to #c27c00.', 'Цвет иконки <code>warning</code>. <code>tokens-accessible.css</code> затемняет её до #c27c00.', '<code>warning</code> 图标的颜色。<code>tokens-accessible.css</code> 会将其加深为 #c27c00。'),
  token('--ads-notification-close-size', '24px', 'Size of the close button: 24px, the smallest target of WCAG 2.5.8 (Ant Design has 22px).', 'Размер кнопки закрытия: 24px, минимальная цель по WCAG 2.5.8 (в Ant Design 22px).', '关闭按钮大小：24px，WCAG 2.5.8 要求的最小目标尺寸（Ant Design 为 22px）。'),
  token('--ads-notification-close-icon-size', '14px', 'Size of the cross in the close button.', 'Размер крестика в кнопке закрытия.', '关闭按钮中叉号的大小。'),
  token('--ads-notification-close-room', '26px', 'Space kept free at the end of the first line of the title, for the close button.', 'Место, которое остаётся свободным в конце первой строки заголовка под кнопку закрытия.', '标题第一行末尾为关闭按钮预留的空白。'),
  token('--ads-notification-close-padding', '4px', 'Air at both ends of a close button that holds more than the cross, a word for example; the cross stays a 24 px square.', 'Отступ с обоих концов кнопки закрытия, в которой больше, чем крестик (например, слово); крестик остаётся квадратом 24 px.', '关闭按钮内容多于叉号（例如一个词）时两端的留白；叉号仍是 24 px 的方块。'),
  token('--ads-notification-close-color', 'rgba(0, 0, 0, 0.45)', 'Color of the close button. <code>tokens-accessible.css</code> makes it <code>rgba(0, 0, 0, 0.65)</code> (4.5:1 on the box).', 'Цвет кнопки закрытия. <code>tokens-accessible.css</code> делает его <code>rgba(0, 0, 0, 0.65)</code> (4.5:1 на блоке).', '关闭按钮颜色。<code>tokens-accessible.css</code> 会把它改为 <code>rgba(0, 0, 0, 0.65)</code>（在通知框上达到 4.5:1）。'),
  token('--ads-notification-close-color-hover', 'rgba(0, 0, 0, 0.88)', 'Color of the close button on hover.', 'Цвет кнопки закрытия при наведении.', '关闭按钮悬停时的颜色。'),
  token('--ads-notification-close-bg', 'transparent', 'Background of the close button at rest.', 'Фон кнопки закрытия в покое.', '关闭按钮平时的背景。'),
  token('--ads-notification-close-bg-hover', 'rgba(0, 0, 0, 0.06)', 'Background of the close button on hover.', 'Фон кнопки закрытия при наведении.', '关闭按钮悬停时的背景。'),
  token('--ads-notification-progress-bg', 'linear-gradient(90deg, #69b1ff, #1677ff)', 'Fill of the progress strip.', 'Заливка полосы времени.', '进度条的填充。'),
  token('--ads-notification-progress-track', 'rgba(0, 0, 0, 0.04)', 'Track of the progress strip.', 'Дорожка полосы времени.', '进度条的轨道。'),
  token('--ads-notification-progress-height', '2px', 'Height of the progress strip.', 'Высота полосы времени.', '进度条高度。'),
  token('--ads-notification-progress-inset', '8px', 'Distance of the progress strip from the sides of the box.', 'Расстояние полосы времени от боков блока.', '进度条距通知框两侧的距离。'),
  token('--ads-notification-progress-radius', '8px', 'Corner radius of the progress strip.', 'Радиус углов полосы времени.', '进度条圆角半径。'),
  token('--ads-notification-motion-offset', '64px', 'How far from its place a notification starts to come in and ends to leave (from its side: the right places from the right, <code>top</code> from above).', 'На сколько от своего места уведомление начинает появляться и заканчивает уходить (со своей стороны: правые места справа, <code>top</code> сверху).', '通知进入时的起始位置与离开时的终止位置距其所在位置的距离（从各自一侧：右侧位置从右边，<code>top</code> 从上方）。'),
  token('--ads-notification-stack-offset', '8px', 'Step between the rows of a pile.', 'Шаг между строками стопки.', '堆叠中各行之间的偏移。'),
  token('--ads-notification-stack-scale-step', '0.06', 'How much smaller each row of a pile is than the one in front of it (the scale stops at the second step).', 'Насколько каждая строка стопки меньше предыдущей (масштаб останавливается на втором шаге).', '堆叠中每一行比前一行缩小的比例（缩放在第二级停止）。')
];
