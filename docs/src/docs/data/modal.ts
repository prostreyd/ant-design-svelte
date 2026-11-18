// Data of the Modal page. The tables are checked against the source by tests/docs/modal-page.test.ts.
import type { ApiRow, DemoMeta, TokenRow } from './button.ts';

const row = (name: string, type: string, defaultValue: string, en: string, ru: string, zh: string): ApiRow => ({ name, description: { en, ru, zh }, type, default: defaultValue });
const token = (name: string, value: string, en: string, ru: string, zh: string): TokenRow => ({ name, value, description: { en, ru, zh } });

export const demos: DemoMeta[] = [
  {
    slug: "basic",
    title: { en: "Basic", ru: "Базовый пример", zh: "基本用法" },
    description: {
      en: "A Modal written into the markup with <code>bind:open</code>. The close button, Cancel, Escape and a press on the mask close it by themselves; OK does not: it is for you to close the Modal once you have checked or saved, so here <code>onok</code> closes it and says so. The other examples set <code>closeOnOk</code>, so that OK closes them. <code>oncancel</code> is called first.",
      ru: "Modal, записанный в разметке, с <code>bind:open</code>. Кнопка закрытия, Cancel, Escape и нажатие на маску закрывают его сами; OK — нет: закрыть окно после проверки или сохранения нужно вам, поэтому здесь <code>onok</code> закрывает его и сообщает об этом. В остальных примерах задан <code>closeOnOk</code>, и OK закрывает окно. Сначала вызывается <code>oncancel</code>.",
      zh: "写在模板中的对话框，配合 <code>bind:open</code> 使用。关闭按钮、取消、Escape 和点击遮罩都会自动关闭它；确定则不会：校验或保存之后由你来关闭，所以这里由 <code>onok</code> 关闭并给出提示。其余示例设置了 <code>closeOnOk</code>，因此点击确定会关闭对话框。<code>oncancel</code> 会先被调用。"
    }
  },
  {
    slug: "async",
    title: { en: "Asynchronous close", ru: "Асинхронное закрытие", zh: "异步关闭" },
    description: {
      en: "<code>confirmLoading</code> puts the OK button into its loading state while the app saves; the app then sets <code>open = false</code>. With <code>closeOnOk</code> the Modal does it itself: it waits for the Promise that <code>onok</code> returns, closes on a resolve and stays open on a reject.",
      ru: "<code>confirmLoading</code> переводит кнопку OK в состояние загрузки, пока приложение сохраняет данные; затем приложение ставит <code>open = false</code>. С <code>closeOnOk</code> окно делает это само: ждёт Promise, который вернул <code>onok</code>, закрывается при resolve и остаётся открытым при reject.",
      zh: "<code>confirmLoading</code> 让确定按钮在应用保存数据期间处于加载状态；之后应用设置 <code>open = false</code>。使用 <code>closeOnOk</code> 时对话框自己完成这些：等待 <code>onok</code> 返回的 Promise，成功时关闭，失败时保持打开。"
    }
  },
  {
    slug: "footer",
    title: { en: "Footer", ru: "Подвал", zh: "自定义页脚" },
    description: {
      en: "<code>footer</code> is <code>null</code> (no footer), a text, a number, or a snippet that gets <code>origin</code> (both buttons), <code>ok</code> and <code>cancel</code> to place by hand.",
      ru: "<code>footer</code> — это <code>null</code> (без подвала), текст, число или snippet, который получает <code>origin</code> (обе кнопки), <code>ok</code> и <code>cancel</code> для ручной расстановки.",
      zh: "<code>footer</code> 可以是 <code>null</code>（不显示页脚）、文字、数字，或一个 snippet；snippet 会收到 <code>origin</code>（两个按钮）、<code>ok</code> 和 <code>cancel</code>，可以自行摆放。"
    }
  },
  {
    slug: "buttons",
    title: { en: "Texts and props of the buttons", ru: "Тексты и свойства кнопок", zh: "按钮文字与属性" },
    description: {
      en: "<code>okText</code> and <code>cancelText</code> are a text, a number or a snippet (an empty text and <code>0</code> are shown). <code>okType</code> is the type of the OK button, and <code>okButtonProps</code> and <code>cancelButtonProps</code> are the props of <code>Button</code> itself. Their <code>onclick</code> runs first.",
      ru: "<code>okText</code> и <code>cancelText</code> — текст, число или snippet (пустой текст и <code>0</code> показываются). <code>okType</code> — тип кнопки OK, а <code>okButtonProps</code> и <code>cancelButtonProps</code> — это свойства самой <code>Button</code>. Их <code>onclick</code> вызывается первым.",
      zh: "<code>okText</code> 与 <code>cancelText</code> 可以是文字、数字或 snippet（空字符串和 <code>0</code> 都会显示）。<code>okType</code> 是确定按钮的类型，<code>okButtonProps</code> 与 <code>cancelButtonProps</code> 就是 <code>Button</code> 本身的属性。它们的 <code>onclick</code> 会先执行。"
    }
  },
  {
    slug: "mask",
    title: { en: "Mask and keyboard", ru: "Маска и клавиатура", zh: "遮罩与键盘" },
    description: {
      en: "<code>mask</code> is a boolean or <code>{ enabled, closable }</code>. <code>mask: false</code> draws no mask, and the Modal is still modal (the page behind is out of reach), as in Ant Design. A press that starts inside the dialog and ends on the mask (selecting text) never closes it. <code>keyboard: false</code> turns Escape off.",
      ru: "<code>mask</code> — булево значение или <code>{ enabled, closable }</code>. <code>mask: false</code> не рисует маску, а окно остаётся модальным (страница позади недоступна), как в Ant Design. Нажатие, которое началось внутри окна и закончилось на маске (выделение текста), его не закрывает. <code>keyboard: false</code> отключает Escape.",
      zh: "<code>mask</code> 可以是布尔值或 <code>{ enabled, closable }</code>。<code>mask: false</code> 不绘制遮罩，但对话框仍是模态的（背景页面不可操作），与 Ant Design 一致。从对话框内部按下、在遮罩上松开（选中文字）不会关闭它。<code>keyboard: false</code> 会关闭 Escape。"
    }
  },
  {
    slug: "position",
    title: { en: "Position and width", ru: "Положение и ширина", zh: "位置与宽度" },
    description: {
      en: "<code>centered</code> puts the dialog in the middle of the window; by default it is 100px from the top. <code>width</code> is a number (px) or a string, 520 by default, and never wider than the window. <code>style</code> and <code>zIndex</code> adjust the box and the layer (1000, under the popup layers). By default the dialog zooms in and out around its own center; <code>zoomFromClick</code> makes it zoom from the place of the last click, as in Ant Design.",
      ru: "<code>centered</code> ставит окно по центру; по умолчанию оно в 100px от верха. <code>width</code> — число (px) или строка, по умолчанию 520, и никогда не шире окна. <code>style</code> и <code>zIndex</code> настраивают блок и слой (1000, ниже слоёв всплывающих окон). По умолчанию окно увеличивается и уменьшается вокруг своего центра; <code>zoomFromClick</code> включает зум из места последнего клика, как в Ant Design.",
      zh: "<code>centered</code> 使对话框居中；默认距顶部 100px。<code>width</code> 是数字（px）或字符串，默认 520，且不会比窗口更宽。<code>style</code> 与 <code>zIndex</code> 用于调整对话框和浮层（1000，低于弹出层）。 默认对话框围绕自身中心缩放；<code>zoomFromClick</code> 使其从最近一次点击的位置缩放，与 Ant Design 一致。"
    }
  },
  {
    slug: "title",
    title: { en: "Title and close button", ru: "Заголовок и кнопка закрытия", zh: "标题与关闭按钮" },
    description: {
      en: "No title means no header: give the dialog a name with <code>aria-label</code>. <code>title</code> is a string, a number or a snippet. <code>closable</code> is <code>false</code> or an object with <code>closeIcon</code>, <code>disabled</code> and <code>aria-label</code> (the default name is “Close”); <code>closeIcon</code> replaces the cross.",
      ru: "Без заголовка нет и шапки: дайте окну имя через <code>aria-label</code>. <code>title</code> — строка, число или snippet. <code>closable</code> — <code>false</code> или объект с <code>closeIcon</code>, <code>disabled</code> и <code>aria-label</code> (имя по умолчанию — «Close»); <code>closeIcon</code> заменяет крестик.",
      zh: "没有标题就没有页头：请用 <code>aria-label</code> 给对话框命名。<code>title</code> 可以是字符串、数字或 snippet。<code>closable</code> 是 <code>false</code> 或包含 <code>closeIcon</code>、<code>disabled</code>、<code>aria-label</code> 的对象（默认名称为 “Close”）；<code>closeIcon</code> 用于替换叉号。"
    }
  },
  {
    slug: "long",
    title: { en: "Long content and the scroll", ru: "Длинное содержимое и прокрутка", zh: "长内容与滚动" },
    description: {
      en: "A tall dialog scrolls inside the window, not the page. While it is open the page does not scroll and does not jump sideways when its scrollbar goes away; <code>scrollLock: false</code> leaves the page scrolling. iOS Safari before 16 scrolls a locked page under a finger.",
      ru: "Высокое окно прокручивается внутри окна, а не страница. Пока оно открыто, страница не прокручивается и не прыгает в сторону, когда пропадает её полоса прокрутки; <code>scrollLock: false</code> оставляет страницу прокручиваемой. iOS Safari до 16 прокручивает заблокированную страницу под пальцем.",
      zh: "过高的对话框在窗口内滚动，而不是页面滚动。打开期间页面不会滚动，滚动条消失时也不会向侧面跳动；<code>scrollLock: false</code> 会让页面保持可滚动。iOS Safari 16 之前的版本仍会在手指下滚动被锁定的页面。"
    }
  },
  {
    slug: "nested",
    title: { en: "Nested Modals", ru: "Вложенные окна", zh: "多层对话框" },
    description: {
      en: "A Modal opened later is above the first one; Escape and Tab go to the Modal on top, and the first is out of reach until the second is closed. Only the first one dims the page: the second adds no second mask.",
      ru: "Окно, открытое позже, лежит выше первого; Escape и Tab действуют в верхнем окне, а первое недоступно, пока закрыто не второе. Затемняет страницу только первое окно: второе не добавляет второго слоя.",
      zh: "后打开的对话框位于前一个之上；Escape 和 Tab 只作用于最上层的对话框，第二个关闭之前第一个不可操作。只有第一个对话框会遮暗页面，第二个不会再添加遮罩。"
    }
  },
  {
    slug: "destroy",
    title: { en: "Keeping and destroying the content", ru: "Сохранение и удаление содержимого", zh: "保留与销毁内容" },
    description: {
      en: "By default the content stays after a close, so what you typed is still there. <code>destroyOnHidden</code> removes it on every close. <code>forceRender</code> puts the Modal into the page before the first opening. <code>onafteropenchange</code> and <code>onafterclose</code> report the end of the animations.",
      ru: "По умолчанию содержимое остаётся после закрытия, и введённое сохраняется. <code>destroyOnHidden</code> удаляет его при каждом закрытии. <code>forceRender</code> помещает окно на страницу до первого открытия. <code>onafteropenchange</code> и <code>onafterclose</code> сообщают об окончании анимаций.",
      zh: "默认情况下关闭后内容仍然保留，输入的内容还在。<code>destroyOnHidden</code> 会在每次关闭时移除内容。<code>forceRender</code> 会在第一次打开之前就把对话框放入页面。<code>onafteropenchange</code> 与 <code>onafterclose</code> 在动画结束时通知。"
    }
  },
  {
    slug: "container",
    title: { en: "Container", ru: "Контейнер", zh: "挂载节点" },
    description: {
      en: "<code>container</code> is an element, a function that returns one, a selector, or <code>false</code> (leave it where it is written). The layer still covers the whole window. Custom properties set on a subtree reach the Modal only through a container inside that subtree.",
      ru: "<code>container</code> — элемент, функция, возвращающая его, селектор или <code>false</code> (оставить там, где записано). Слой по-прежнему перекрывает всё окно. Пользовательские свойства, заданные на поддереве, доходят до окна только через контейнер внутри этого поддерева.",
      zh: "<code>container</code> 可以是元素、返回元素的函数、选择器，或 <code>false</code>（保持在书写的位置）。浮层仍然覆盖整个窗口。在某个子树上设置的自定义属性，只有通过位于该子树内的容器才能作用到对话框。"
    }
  },
  {
    slug: "styling",
    title: { en: "Classes and styles", ru: "Классы и стили", zh: "自定义类名与样式" },
    description: {
      en: "<code>class</code> and <code>style</code> go on the dialog box and <code>wrapClassName</code> on the scroll area. <code>classNames</code> and <code>styles</code> address the parts: <code>root</code>, <code>mask</code>, <code>wrapper</code>, <code>dialog</code>, <code>content</code>, <code>close</code>, <code>header</code>, <code>title</code>, <code>body</code> and <code>footer</code>. The Modal is drawn in the body, so the rules for these classes have to be global.",
      ru: "<code>class</code> и <code>style</code> применяются к блоку окна, а <code>wrapClassName</code> — к области прокрутки. <code>classNames</code> и <code>styles</code> задают части: <code>root</code>, <code>mask</code>, <code>wrapper</code>, <code>dialog</code>, <code>content</code>, <code>close</code>, <code>header</code>, <code>title</code>, <code>body</code> и <code>footer</code>. Окно рисуется в body, поэтому правила для этих классов должны быть глобальными.",
      zh: "<code>class</code> 与 <code>style</code> 作用于对话框，<code>wrapClassName</code> 作用于滚动区域。<code>classNames</code> 与 <code>styles</code> 作用于各个部分：<code>root</code>、<code>mask</code>、<code>wrapper</code>、<code>dialog</code>、<code>content</code>、<code>close</code>、<code>header</code>、<code>title</code>、<code>body</code> 与 <code>footer</code>。对话框渲染在 body 中，因此这些类名的样式规则必须是全局的。"
    }
  },
  {
    slug: "focusable",
    title: { en: "Focus and the scroll lock", ru: "Фокус и блокировка прокрутки", zh: "焦点与滚动锁定" },
    description: {
      en: "<code>focusable</code> is <code>{ trap, focusTriggerAfterClose, autoFocusButton }</code>. Focus goes to the first element Tab reaches (the close button) and comes back to the button that opened the Modal; <code>trap: false</code> lets Tab leave, <code>focusTriggerAfterClose: false</code> does not give focus back, and <code>autoFocusButton</code> picks <code>'ok'</code> or <code>'cancel'</code>.",
      ru: "<code>focusable</code> — это <code>{ trap, focusTriggerAfterClose, autoFocusButton }</code>. Фокус уходит на первый элемент, до которого доходит Tab (кнопка закрытия), и возвращается на кнопку, открывшую окно; <code>trap: false</code> позволяет Tab выйти, <code>focusTriggerAfterClose: false</code> не возвращает фокус, а <code>autoFocusButton</code> выбирает <code>'ok'</code> или <code>'cancel'</code>.",
      zh: "<code>focusable</code> 为 <code>{ trap, focusTriggerAfterClose, autoFocusButton }</code>。焦点会移到 Tab 能到达的第一个元素（关闭按钮），并在关闭后回到打开它的按钮；<code>trap: false</code> 允许 Tab 离开，<code>focusTriggerAfterClose: false</code> 不归还焦点，<code>autoFocusButton</code> 可选 <code>'ok'</code> 或 <code>'cancel'</code>。"
    }
  },
  {
    slug: "render",
    title: { en: "Custom render", ru: "Свой рендер", zh: "自定义渲染" },
    description: {
      en: "<code>modalRender</code> is a snippet that gets the card as a snippet and may wrap it, for example in a box that can be dragged. The library has no draggable Modal of its own.",
      ru: "<code>modalRender</code> — snippet, который получает карточку как snippet и может её обернуть, например, в перетаскиваемый блок. Своего перетаскиваемого окна в библиотеке нет.",
      zh: "<code>modalRender</code> 是一个 snippet，它会把卡片作为 snippet 传入，可以对其进行包装，例如放入可拖拽的容器。库本身没有可拖拽的对话框。"
    }
  },
  {
    slug: "select",
    title: { en: "A Select inside", ru: "Select внутри", zh: "内部包含 Select" },
    description: {
      en: "The list of a Select opens above the Modal. Escape closes the list first and the Modal on the second press, and the list follows the field when the Modal scrolls.",
      ru: "Список Select открывается выше окна. Escape сначала закрывает список, а окно — вторым нажатием; список следует за полем при прокрутке окна.",
      zh: "Select 的下拉列表会显示在对话框之上。Escape 先关闭下拉列表，第二次按下才关闭对话框；对话框滚动时列表跟随输入框。"
    }
  },
  {
    slug: "static",
    title: { en: "Static dialogs", ru: "Статические диалоги", zh: "静态方法" },
    description: {
      en: "<code>modal.confirm</code>, <code>info</code>, <code>success</code>, <code>warning</code> and <code>error</code> open a ready-made dialog from code: an icon, a title, a text and buttons. No markup and no state. It is an alert dialog, 416px wide, with focus on OK; there is no close button, a press outside does not close it, and Escape does.",
      ru: "<code>modal.confirm</code>, <code>info</code>, <code>success</code>, <code>warning</code> и <code>error</code> открывают готовый диалог из кода: иконка, заголовок, текст и кнопки. Без разметки и без состояния. Это alert dialog шириной 416px с фокусом на OK; кнопки закрытия нет, нажатие снаружи его не закрывает, а Escape закрывает.",
      zh: "<code>modal.confirm</code>、<code>info</code>、<code>success</code>、<code>warning</code> 和 <code>error</code> 可以在代码中打开一个现成的对话框：图标、标题、文字与按钮，无需模板和状态。它是 alert dialog，宽 416px，焦点在确定按钮上；没有关闭按钮，点击外部不会关闭，Escape 会关闭。"
    }
  },
  {
    slug: "await",
    title: { en: "The answer", ru: "Ответ", zh: "获取结果" },
    description: {
      en: "The call returns a handle that can be awaited: <code>true</code> for OK, <code>false</code> for Cancel, Escape and <code>destroy()</code>. Note: <code>await modal.confirm(…)</code> waits until the dialog is closed, and so does returning the handle from an <code>async</code> function.",
      ru: "Вызов возвращает ручку, которую можно ждать через <code>await</code>: <code>true</code> для OK, <code>false</code> для Cancel, Escape и <code>destroy()</code>. Важно: <code>await modal.confirm(…)</code> ждёт, пока диалог закроется, и то же происходит, если вернуть ручку из <code>async</code>-функции.",
      zh: "调用会返回一个可以 await 的句柄：确定为 <code>true</code>，取消、Escape 与 <code>destroy()</code> 为 <code>false</code>。注意：<code>await modal.confirm(…)</code> 会一直等到对话框关闭，在 <code>async</code> 函数中返回该句柄也是如此。"
    }
  },
  {
    slug: "promise",
    title: { en: "OK and Cancel that wait", ru: "OK и Cancel, которые ждут", zh: "异步确定与取消" },
    description: {
      en: "<code>onok</code> and <code>oncancel</code> of a static dialog may return a Promise. The button is loading while it is pending; a resolve closes the dialog, and a reject (or <code>event.preventDefault()</code>) keeps it open. An unanswered dialog has not resolved its handle.",
      ru: "<code>onok</code> и <code>oncancel</code> статического диалога могут вернуть Promise. Пока он выполняется, кнопка в состоянии загрузки; resolve закрывает диалог, а reject (или <code>event.preventDefault()</code>) оставляет его открытым. Пока диалог без ответа, его ручка не завершена.",
      zh: "静态对话框的 <code>onok</code> 与 <code>oncancel</code> 可以返回 Promise。Promise 进行期间按钮处于加载状态；成功时关闭对话框，失败（或 <code>event.preventDefault()</code>）则保持打开。尚未作答的对话框，其句柄也不会完成。"
    }
  },
  {
    slug: "update",
    title: { en: "update, destroy and destroyAll", ru: "update, destroy и destroyAll", zh: "更新与销毁" },
    description: {
      en: "<code>handle.update(patch)</code> changes the dialog in place (an object is merged; a function gets the previous options) and keeps focus. <code>handle.destroy()</code> closes it. <code>modal.destroyAll()</code> closes every static dialog and never a <code>Modal</code> written in the markup, for example on a route change.",
      ru: "<code>handle.update(patch)</code> меняет диалог на месте (объект объединяется с параметрами; функция получает предыдущие) и сохраняет фокус. <code>handle.destroy()</code> закрывает его. <code>modal.destroyAll()</code> закрывает все статические диалоги, но никогда не <code>Modal</code>, записанный в разметке, например при смене маршрута.",
      zh: "<code>handle.update(patch)</code> 会原地更新对话框（对象会被合并；函数会收到之前的选项）并保持焦点。<code>handle.destroy()</code> 会关闭它。<code>modal.destroyAll()</code> 会关闭所有静态对话框，但不会关闭写在模板中的 <code>Modal</code>，例如在路由切换时使用。"
    }
  },
  {
    slug: "host",
    title: { en: "ModalHost", ru: "ModalHost", zh: "ModalHost 宿主" },
    description: {
      en: "With no host the library draws the static dialogs itself, in the body. <code>&lt;ModalHost&gt;</code> draws them where you put it, so they see the context of that place. Only one host is active at a time; one that unmounts hands the open dialogs back.",
      ru: "Без хоста библиотека рисует статические диалоги сама, в body. <code>&lt;ModalHost&gt;</code> рисует их там, где вы его поставили, поэтому они видят контекст этого места. Активен только один хост; хост, который размонтируется, возвращает открытые диалоги.",
      zh: "没有宿主时，库会自己在 body 中渲染静态对话框。<code>&lt;ModalHost&gt;</code> 在你放置它的位置渲染，因此它们能看到该位置的上下文。同一时间只有一个宿主生效；卸载的宿主会把打开的对话框交还。"
    }
  }
];

export const propRows: ApiRow[] = [
  row("open", "boolean", "false", "Whether the Modal is shown. <code>bind:open</code> works: a way to close sets it to <code>false</code>.", "Показано ли окно. Работает <code>bind:open</code>: способ закрытия ставит <code>false</code>.", "对话框是否显示。支持 <code>bind:open</code>：关闭时会将其设为 <code>false</code>。"),
  row("title", "string | number | Snippet | null", "—", "The title. No title, no header. <code>0</code> is shown.", "Заголовок. Нет заголовка — нет шапки. <code>0</code> показывается.", "标题。没有标题就没有页头。<code>0</code> 会显示。"),
  row("children", "Snippet", "—", "The body.", "Тело окна.", "对话框内容。"),
  row("footer", "string | number | Snippet<[{ origin, ok, cancel }]> | null", "Cancel and OK", "<code>null</code> removes the footer; a text is the footer; a snippet gets <code>origin</code> (both buttons), <code>ok</code> and <code>cancel</code>.", "<code>null</code> убирает подвал; текст становится подвалом; snippet получает <code>origin</code> (обе кнопки), <code>ok</code> и <code>cancel</code>.", "<code>null</code> 表示不显示页脚；文字会作为页脚；snippet 会收到 <code>origin</code>（两个按钮）、<code>ok</code> 与 <code>cancel</code>。"),
  row("okText", "string | number | Snippet", "OK", "Text of the OK button. When it is left out the default is used; an empty string stays empty.", "Текст кнопки OK. Если свойство не задано, берётся значение по умолчанию; пустая строка остаётся пустой.", "确定按钮的文字。未设置时使用默认值；空字符串则保持为空。"),
  row("cancelText", "string | number | Snippet", "Cancel", "Text of the Cancel button.", "Текст кнопки Cancel.", "取消按钮的文字。"),
  row("okType", "ButtonType", "'primary'", "The <code>type</code> of the OK button.", "<code>type</code> кнопки OK.", "确定按钮的 <code>type</code>。"),
  row("okButtonProps", "ComponentProps<typeof Button>", "—", "Props of the OK button. Its <code>onclick</code> runs before <code>onok</code>.", "Свойства кнопки OK. Её <code>onclick</code> вызывается раньше <code>onok</code>.", "确定按钮的属性。它的 <code>onclick</code> 先于 <code>onok</code> 执行。"),
  row("cancelButtonProps", "ComponentProps<typeof Button>", "—", "Props of the Cancel button. Its <code>onclick</code> runs before <code>oncancel</code>.", "Свойства кнопки Cancel. Её <code>onclick</code> вызывается раньше <code>oncancel</code>.", "取消按钮的属性。它的 <code>onclick</code> 先于 <code>oncancel</code> 执行。"),
  row("confirmLoading", "boolean", "false", "The OK button is loading.", "Кнопка OK в состоянии загрузки.", "确定按钮处于加载状态。"),
  row("onok", "(event: MouseEvent) => unknown", "—", "The OK button was pressed. The Modal closes only with <code>closeOnOk</code>.", "Нажата кнопка OK. Окно закрывается только с <code>closeOnOk</code>.", "点击了确定按钮。只有设置了 <code>closeOnOk</code> 才会关闭。"),
  row("closeOnOk", "boolean", "false", "The Modal closes after <code>onok</code>, waiting for a Promise it returned: a resolve closes it, a reject keeps it open; <code>event.preventDefault()</code> keeps it open. Ant Design has no such option on the plain Modal.", "Окно закрывается после <code>onok</code>, дожидаясь Promise, который он вернул: resolve закрывает, reject оставляет открытым; <code>event.preventDefault()</code> оставляет открытым. В обычном Modal Ant Design такой опции нет.", "在 <code>onok</code> 之后关闭对话框，并等待它返回的 Promise：成功关闭，失败保持打开；<code>event.preventDefault()</code> 也会保持打开。Ant Design 的普通 Modal 没有此选项。"),
  row("oncancel", "(event: MouseEvent | KeyboardEvent) => void", "—", "The close button, Cancel, Escape or the mask asked to close. The Modal then closes unless the handler calls <code>event.preventDefault()</code>.", "Кнопка закрытия, Cancel, Escape или маска запросили закрытие. Затем окно закрывается, если обработчик не вызвал <code>event.preventDefault()</code>.", "关闭按钮、取消、Escape 或遮罩请求关闭。之后对话框会关闭，除非处理函数调用了 <code>event.preventDefault()</code>。"),
  row("closable", "boolean | { closeIcon?, disabled?, 'aria-label'? }", "true", "Shows the close button. An object sets its icon, disables it, or names it (default “Close”).", "Показывает кнопку закрытия. Объект задаёт её иконку, отключает её или называет (по умолчанию «Close»).", "显示关闭按钮。对象可设置图标、禁用或命名（默认 “Close”）。"),
  row("closeIcon", "Snippet", "a cross", "Replaces the cross. Hide the button with <code>closable: false</code>.", "Заменяет крестик. Скрыть кнопку можно через <code>closable: false</code>.", "替换叉号。隐藏按钮请使用 <code>closable: false</code>。"),
  row("mask", "boolean | { enabled?, closable? }", "true", "<code>enabled: false</code> (or <code>false</code>) draws no mask: the Modal is modal all the same. <code>closable: false</code> stops a press on the mask from closing it.", "<code>enabled: false</code> (или <code>false</code>) не рисует маску: окно остаётся модальным. <code>closable: false</code> не даёт нажатию на маску закрыть окно.", "<code>enabled: false</code>（或 <code>false</code>）不绘制遮罩，对话框仍是模态的。<code>closable: false</code> 使点击遮罩不再关闭对话框。"),
  row("keyboard", "boolean", "true", "Escape closes.", "Escape закрывает окно.", "按 Escape 关闭。"),
  row("centered", "boolean", "false", "Centers the dialog in the window.", "Центрирует окно.", "使对话框在窗口中居中。"),
  row("width", "string | number", "520", "A number is px. Never wider than the window.", "Число — это px. Не шире окна.", "数字表示 px。不会比窗口更宽。"),
  row("zIndex", "number", "1000", "The z-index of the layer (<code>--ads-modal-z-index</code>), under the popup layers.", "z-index слоя (<code>--ads-modal-z-index</code>), ниже слоёв всплывающих окон.", "浮层的 z-index（<code>--ads-modal-z-index</code>），低于弹出层。"),
  row("container", "HTMLElement | (() => HTMLElement) | string | false", "document.body", "The element the layer is moved into, a function that returns it, a selector, or <code>false</code> to leave it where it is written.", "Элемент, в который переносится слой, функция, возвращающая его, селектор или <code>false</code>, чтобы оставить там, где записано.", "浮层被移入的元素、返回元素的函数、选择器，或 <code>false</code>（保持在书写的位置）。"),
  row("destroyOnHidden", "boolean", "false", "The content is removed on every close.", "Содержимое удаляется при каждом закрытии.", "每次关闭时移除内容。"),
  row("forceRender", "boolean", "false", "The Modal is in the page, hidden, before the first opening.", "Окно находится на странице, скрытым, до первого открытия.", "在第一次打开之前，对话框就已存在于页面中（隐藏）。"),
  row("focusable", "{ trap?, focusTriggerAfterClose?, autoFocusButton? }", "{ trap: true, focusTriggerAfterClose: true }", "<code>trap</code>: Tab stays inside. <code>focusTriggerAfterClose</code>: focus goes back to what had it. <code>autoFocusButton</code>: <code>'ok'</code>, <code>'cancel'</code> or <code>null</code> (the dialog); by default the first element Tab reaches.", "<code>trap</code>: Tab остаётся внутри. <code>focusTriggerAfterClose</code>: фокус возвращается туда, где был. <code>autoFocusButton</code>: <code>'ok'</code>, <code>'cancel'</code> или <code>null</code> (само окно); по умолчанию первый элемент, до которого доходит Tab.", "<code>trap</code>：Tab 保持在内部。<code>focusTriggerAfterClose</code>：焦点回到之前的位置。<code>autoFocusButton</code>：<code>'ok'</code>、<code>'cancel'</code> 或 <code>null</code>（对话框本身）；默认是 Tab 能到达的第一个元素。"),
  row("scrollLock", "boolean", "true", "The page does not scroll while the Modal is open.", "Страница не прокручивается, пока окно открыто.", "对话框打开期间页面不滚动。"),
  row("zoomFromClick", "boolean", "false", "The dialog zooms in and out from the place of the last click, as in Ant Design, instead of around its own center. A keyboard open, or one that comes later than the click, still starts at the center.", "Окно увеличивается и уменьшается из места последнего клика, как в Ant Design, а не вокруг своего центра. Открытие с клавиатуры или позже клика по-прежнему идёт из центра.", "对话框从最近一次点击的位置缩放（与 Ant Design 一致），而不是围绕自身中心。键盘打开或晚于点击的打开仍从中心开始。"),
  row("modalRender", "Snippet<[Snippet]>", "—", "Gets the card as a snippet and may wrap it.", "Получает карточку как snippet и может её обернуть.", "接收卡片 snippet，可以对其进行包装。"),
  row("class", "string", "—", "Extra classes of the dialog box.", "Дополнительные классы блока окна.", "对话框的额外类名。"),
  row("style", "string", "—", "Inline style of the dialog box. The width is kept.", "Инлайн-стиль блока окна. Ширина сохраняется.", "对话框的内联样式。宽度会保留。"),
  row("wrapClassName", "string", "—", "Extra classes of the scroll area (the same part as <code>classNames.wrapper</code>).", "Дополнительные классы области прокрутки (та же часть, что <code>classNames.wrapper</code>).", "滚动区域的额外类名（与 <code>classNames.wrapper</code> 是同一部分）。"),
  row("classNames", "{ root?, mask?, wrapper?, dialog?, content?, close?, header?, title?, body?, footer? }", "—", "Extra classes for the parts of the Modal.", "Дополнительные классы для частей окна.", "各部分的额外类名。"),
  row("styles", "{ root?, mask?, wrapper?, dialog?, content?, close?, header?, title?, body?, footer? }", "—", "Inline styles for the parts: an object of CSS properties (kebab-case or custom properties).", "Инлайн-стили для частей: объект CSS-свойств (kebab-case или пользовательские свойства).", "各部分的内联样式：CSS 属性对象（kebab-case 或自定义属性）。"),
  row("onafteropenchange", "(open: boolean) => void", "—", "The enter or the leave animation has ended.", "Закончилась анимация появления или ухода.", "进入或离开动画已结束。"),
  row("onafterclose", "() => void", "—", "The leave animation has ended and the Modal is gone.", "Анимация ухода закончилась, окно скрыто.", "离开动画结束，对话框已隐藏。")
];

export const funcRows: ApiRow[] = [
  row("title", "string | number | Snippet", "—", "The title.", "Заголовок.", "标题。"),
  row("content", "string | number | Snippet", "—", "The text under the title.", "Текст под заголовком.", "标题下方的文字。"),
  row("icon", "Snippet | string | false", "the icon of the kind", "A snippet or a text replaces the icon of the kind; <code>false</code> removes it.", "Snippet или текст заменяет иконку вида; <code>false</code> убирает её.", "snippet 或文字会替换该类型的图标；<code>false</code> 表示不显示。"),
  row("okCancel", "boolean", "true for confirm", "<code>confirm</code> has Cancel and OK; the others OK only. This changes that.", "У <code>confirm</code> есть Cancel и OK, у остальных только OK. Это меняет умолчание.", "<code>confirm</code> 有取消和确定，其余只有确定。此选项可改变这一点。"),
  row("footer", "string | number | Snippet<[{ origin, ok, cancel }]> | null", "the buttons", "As in <code>Modal</code>.", "Как в <code>Modal</code>.", "与 <code>Modal</code> 相同。"),
  row("okText", "string | number | Snippet", "OK", "Text of the OK button.", "Текст кнопки OK.", "确定按钮的文字。"),
  row("cancelText", "string | number | Snippet", "Cancel", "Text of the Cancel button.", "Текст кнопки Cancel.", "取消按钮的文字。"),
  row("okType", "ButtonType", "'primary'", "The <code>type</code> of the OK button.", "<code>type</code> кнопки OK.", "确定按钮的 <code>type</code>。"),
  row("okButtonProps", "ComponentProps<typeof Button>", "—", "Props of the OK button.", "Свойства кнопки OK.", "确定按钮的属性。"),
  row("cancelButtonProps", "ComponentProps<typeof Button>", "—", "Props of the Cancel button.", "Свойства кнопки Cancel.", "取消按钮的属性。"),
  row("onok", "(event: MouseEvent) => unknown", "—", "OK was pressed. A Promise keeps the button loading: a resolve closes the dialog, a reject keeps it open. A static dialog always closes after <code>onok</code> (<code>closeOnOk</code> is on).", "Нажата OK. Promise держит кнопку в загрузке: resolve закрывает диалог, reject оставляет открытым. Статический диалог всегда закрывается после <code>onok</code> (<code>closeOnOk</code> включён).", "点击了确定。Promise 会使按钮保持加载：成功关闭，失败保持打开。静态对话框总会在 <code>onok</code> 之后关闭（<code>closeOnOk</code> 已开启）。"),
  row("oncancel", "(event: MouseEvent | KeyboardEvent) => unknown", "—", "Cancel, Escape or another way to cancel. A Promise is waited for in the same way; <code>event.preventDefault()</code> keeps the dialog open.", "Cancel, Escape или другой способ отмены. Promise ждётся так же; <code>event.preventDefault()</code> оставляет диалог открытым.", "取消、Escape 或其他取消方式。Promise 同样会被等待；<code>event.preventDefault()</code> 会保持对话框打开。"),
  row("closable", "boolean | { closeIcon?, disabled?, 'aria-label'? }", "false", "Shows the close button (there is none by default).", "Показывает кнопку закрытия (по умолчанию её нет).", "显示关闭按钮（默认没有）。"),
  row("closeIcon", "Snippet", "a cross", "Replaces the cross.", "Заменяет крестик.", "替换叉号。"),
  row("mask", "boolean | { enabled?, closable? }", "{ closable: false }", "A press on the mask does not close a static dialog unless <code>closable</code> is <code>true</code>.", "Нажатие на маску не закрывает статический диалог, если не задано <code>closable: true</code>.", "除非设置 <code>closable: true</code>，否则点击遮罩不会关闭静态对话框。"),
  row("keyboard", "boolean", "true", "Escape closes (it is a cancel).", "Escape закрывает (это отмена).", "按 Escape 关闭（视为取消）。"),
  row("centered", "boolean", "false", "Centers the dialog.", "Центрирует окно.", "使对话框居中。"),
  row("width", "string | number", "416", "A number is px.", "Число — это px.", "数字表示 px。"),
  row("zIndex", "number", "1000", "The z-index of the layer.", "z-index слоя.", "浮层的 z-index。"),
  row("container", "HTMLElement | (() => HTMLElement) | string | false", "document.body", "Where the layer is moved to.", "Куда переносится слой.", "浮层被移入的位置。"),
  row("focusable", "{ trap?, focusTriggerAfterClose?, autoFocusButton? }", "{ autoFocusButton: 'ok' }", "Focus goes to the OK button by default.", "Фокус по умолчанию уходит на кнопку OK.", "焦点默认移到确定按钮。"),
  row("scrollLock", "boolean", "true", "The page does not scroll while the dialog is open.", "Страница не прокручивается, пока диалог открыт.", "对话框打开期间页面不滚动。"),
  row("zoomFromClick", "boolean", "false", "The dialog zooms in and out from the place of the last click instead of around its own center.", "Окно увеличивается и уменьшается из места последнего клика, а не вокруг своего центра.", "对话框从最近一次点击的位置缩放，而不是围绕自身中心。"),
  row("class", "string", "—", "Extra classes of the dialog box.", "Дополнительные классы блока окна.", "对话框的额外类名。"),
  row("style", "string", "—", "Inline style of the dialog box.", "Инлайн-стиль блока окна.", "对话框的内联样式。"),
  row("wrapClassName", "string", "—", "Extra classes of the scroll area.", "Дополнительные классы области прокрутки.", "滚动区域的额外类名。"),
  row("classNames", "{ …the parts of the Modal, confirmBody?, icon?, description? }", "—", "Extra classes for the parts, and for the three parts of a static dialog: <code>confirmBody</code>, <code>icon</code> and <code>description</code>.", "Дополнительные классы для частей, а также для трёх частей статического диалога: <code>confirmBody</code>, <code>icon</code> и <code>description</code>.", "各部分的额外类名，以及静态对话框的三个部分：<code>confirmBody</code>、<code>icon</code> 与 <code>description</code>。"),
  row("styles", "{ …the parts of the Modal, confirmBody?, icon?, description? }", "—", "Inline styles for the same parts.", "Инлайн-стили для тех же частей.", "相同各部分的内联样式。"),
  row("onafteropenchange", "(open: boolean) => void", "—", "The enter or the leave animation has ended.", "Закончилась анимация появления или ухода.", "进入或离开动画已结束。"),
  row("onafterclose", "() => void", "—", "The dialog is gone.", "Диалог закрыт и скрыт.", "对话框已关闭并隐藏。")
];

export const methodRows: ApiRow[] = [
  row("modal.confirm(options)", "ModalHandle", "—", "Opens a dialog with Cancel and OK and the warning icon.", "Открывает диалог с Cancel и OK и иконкой предупреждения.", "打开带有取消、确定和警告图标的对话框。"),
  row("modal.info(options) · success · warning · error", "ModalHandle", "—", "Open a dialog with OK only and the icon of the kind.", "Открывают диалог только с OK и иконкой своего вида.", "打开只有确定按钮、带对应类型图标的对话框。"),
  row("modal.destroyAll()", "void", "—", "Closes every static dialog (never a <code>Modal</code> written in the markup).", "Закрывает все статические диалоги (но не <code>Modal</code>, записанный в разметке).", "关闭所有静态对话框（不会关闭写在模板中的 <code>Modal</code>）。"),
  row("handle.destroy()", "void", "—", "Closes the dialog with the leave animation; the handle resolves <code>false</code>. Does nothing once it is closed.", "Закрывает диалог с анимацией ухода; ручка завершается значением <code>false</code>. После закрытия ничего не делает.", "关闭对话框并播放离开动画；句柄以 <code>false</code> 完成。关闭后调用无效果。"),
  row("handle.update(patch)", "void", "—", "Changes the options in place. An object is merged into them; a function gets the previous options and returns the changes. Does nothing after a close.", "Меняет параметры на месте. Объект объединяется с ними; функция получает предыдущие параметры и возвращает изменения. После закрытия ничего не делает.", "原地更改选项。对象会被合并；函数会收到之前的选项并返回变更。关闭后调用无效果。"),
  row("handle.then · await handle", "PromiseLike<boolean>", "—", "Resolves when the dialog starts to close: <code>true</code> for OK, <code>false</code> for everything else. Awaiting a call waits for the close.", "Завершается, когда диалог начинает закрываться: <code>true</code> для OK, <code>false</code> для всего остального. Ожидание вызова ждёт закрытия.", "在对话框开始关闭时完成：确定为 <code>true</code>，其余为 <code>false</code>。await 调用会一直等到关闭。"),
  row("&lt;ModalHost /&gt;", "component", "—", "Optional. Draws the static dialogs where it stands, so they see the context of that place. One host is active; with none, the library makes its own layer in the body.", "Необязателен. Рисует статические диалоги там, где стоит, поэтому они видят контекст этого места. Активен один хост; без него библиотека создаёт свой слой в body.", "可选。在其所在位置渲染静态对话框，因此能看到该位置的上下文。同一时间只有一个宿主生效；没有宿主时库会在 body 中自己创建浮层。")
];

export const tokenRows: TokenRow[] = [
  token("--ads-modal-z-index", "1000", "Layer of the Modal, under the popup layers (the popover is 1030).", "Слой окна, ниже слоёв всплывающих окон (у поповера 1030).", "对话框的层级，低于弹出层（气泡卡片为 1030）。"),
  token("--ads-modal-width", "520px", "Width of a dialog when <code>width</code> is not set.", "Ширина окна, если не задан <code>width</code>.", "未设置 <code>width</code> 时对话框的宽度。"),
  token("--ads-modal-top", "100px", "Distance of the dialog from the top, when it is not centered.", "Расстояние окна от верха, если оно не по центру.", "未居中时对话框距顶部的距离。"),
  token("--ads-modal-mask-bg", "rgba(0, 0, 0, 0.45)", "Color of the mask.", "Цвет маски.", "遮罩颜色。"),
  token("--ads-modal-content-bg", "#ffffff", "Background of the card. In the dark theme <code>#1f1f1f</code>.", "Фон карточки. В тёмной теме <code>#1f1f1f</code>.", "卡片背景。深色主题为 <code>#1f1f1f</code>。"),
  token("--ads-modal-radius", "8px", "Corner radius of the card.", "Радиус углов карточки.", "卡片圆角半径。"),
  token("--ads-modal-shadow", "0 6px 16px 0 rgba(0, 0, 0, 0.08), 0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 9px 28px 8px rgba(0, 0, 0, 0.05)", "Shadow of the card.", "Тень карточки.", "卡片阴影。"),
  token("--ads-modal-padding", "20px 24px", "Padding of the card.", "Внутренние отступы карточки.", "卡片内边距。"),
  token("--ads-modal-title-color", "rgba(0, 0, 0, 0.88)", "Color of the title. In the dark theme 85% white.", "Цвет заголовка. В тёмной теме 85% белого.", "标题颜色。深色主题为 85% 白色。"),
  token("--ads-modal-title-font-size", "16px", "Font size of the title.", "Размер шрифта заголовка.", "标题字号。"),
  token("--ads-modal-title-line-height", "24px", "Line height of the title.", "Высота строки заголовка.", "标题行高。"),
  token("--ads-modal-title-font-weight", "600", "Weight of the title.", "Насыщенность заголовка.", "标题字重。"),
  token("--ads-modal-header-gap", "8px", "Gap between the title and the body (and between the title and the text of a static dialog).", "Промежуток между заголовком и телом (и между заголовком и текстом статического диалога).", "标题与内容之间的间距（静态对话框中为标题与文字之间）。"),
  token("--ads-modal-body-color", "rgba(0, 0, 0, 0.88)", "Color of the body text. In the dark theme 85% white.", "Цвет текста тела. В тёмной теме 85% белого.", "内容文字颜色。深色主题为 85% 白色。"),
  token("--ads-modal-footer-margin-top", "12px", "Gap between the body and the footer.", "Промежуток между телом и подвалом.", "内容与页脚之间的间距。"),
  token("--ads-modal-footer-gap", "8px", "Gap between the buttons of the footer.", "Промежуток между кнопками подвала.", "页脚按钮之间的间距。"),
  token("--ads-modal-close-size", "32px", "Size of the close button (a target of at least 24px, WCAG 2.5.8).", "Размер кнопки закрытия (цель не меньше 24px, WCAG 2.5.8).", "关闭按钮大小（目标尺寸不小于 24px，WCAG 2.5.8）。"),
  token("--ads-modal-close-inset", "12px", "Distance of the close button from the corner.", "Расстояние кнопки закрытия от угла.", "关闭按钮距角落的距离。"),
  token("--ads-modal-close-color", "rgba(0, 0, 0, 0.45)", "Color of the cross (3:1 on the card).", "Цвет крестика (3:1 на карточке).", "叉号颜色（在卡片上达到 3:1）。"),
  token("--ads-modal-close-color-hover", "rgba(0, 0, 0, 0.88)", "Color of the cross on hover.", "Цвет крестика при наведении.", "叉号悬停时的颜色。"),
  token("--ads-modal-close-bg-hover", "rgba(0, 0, 0, 0.06)", "Background of the close button on hover.", "Фон кнопки закрытия при наведении.", "关闭按钮悬停时的背景。"),
  token("--ads-modal-motion-ease", "cubic-bezier(0.08, 0.82, 0.17, 1)", "Easing of the zoom-in.", "Кривая анимации появления.", "进入缩放动画的缓动曲线。"),
  token("--ads-modal-confirm-width", "416px", "Width of a static dialog.", "Ширина статического диалога.", "静态对话框的宽度。"),
  token("--ads-modal-confirm-icon-size", "22px", "Size of the icon of a static dialog.", "Размер иконки статического диалога.", "静态对话框图标大小。"),
  token("--ads-modal-confirm-icon-gap", "12px", "Gap between the icon and the text of a static dialog.", "Промежуток между иконкой и текстом статического диалога.", "静态对话框中图标与文字的间距。"),
  token("--ads-modal-confirm-icon-info", "#1677ff", "Color of the <code>info</code> icon.", "Цвет иконки <code>info</code>.", "<code>info</code> 图标颜色。"),
  token("--ads-modal-confirm-icon-success", "#52c41a", "Color of the <code>success</code> icon. <code>tokens-accessible.css</code> darkens it to #389e0d (3:1 on the white card).", "Цвет иконки <code>success</code>. <code>tokens-accessible.css</code> затемняет его до #389e0d (3:1 на белой карточке).", "<code>success</code> 图标颜色。<code>tokens-accessible.css</code> 会将其加深为 #389e0d（在白色卡片上达到 3:1）。"),
  token("--ads-modal-confirm-icon-warning", "#faad14", "Color of the <code>warning</code> icon and of <code>confirm</code>. <code>tokens-accessible.css</code> darkens it to #c27c00.", "Цвет иконки <code>warning</code> и <code>confirm</code>. <code>tokens-accessible.css</code> затемняет его до #c27c00.", "<code>warning</code> 与 <code>confirm</code> 的图标颜色。<code>tokens-accessible.css</code> 会将其加深为 #c27c00。"),
  token("--ads-modal-confirm-icon-error", "#ff4d4f", "Color of the <code>error</code> icon.", "Цвет иконки <code>error</code>.", "<code>error</code> 图标颜色。")
];
