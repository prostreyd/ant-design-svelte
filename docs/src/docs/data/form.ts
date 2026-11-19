// Data of the Form page (Form, FormItem, createForm). The tables are checked against the sources by tests/docs/form-page.test.ts.
// The instance methods are in a table of their own and have no example block of their own (specs/form.md, P17).
import type { ApiRow, DemoMeta, TokenRow } from './button.ts';

const l = (en: string, ru: string, zh: string) => ({ en, ru, zh });

export const demos: DemoMeta[] = [
  {
    slug: 'basic',
    title: l('Basic form', 'Простая форма', '基本用法'),
    description: l(
      'A form with required fields. <code>FormItem</code> hands a <code>field</code> to its snippet: bind <code>field.value</code>, pass <code>field.status</code> and spread <code>field.attrs</code>. A failed submit focuses the first invalid field. The shape of the values is given to <code>createForm</code> as a type: <code>createForm&lt;Login&gt;()</code>.',
      'Форма с обязательными полями. <code>FormItem</code> передаёт в snippet объект <code>field</code>: привяжите <code>field.value</code>, передайте <code>field.status</code> и раскройте <code>field.attrs</code>. Неудачная отправка переводит фокус на первое неверное поле. Форма значений передаётся в <code>createForm</code> как тип: <code>createForm&lt;Login&gt;()</code>.',
      '带必填项的表单。<code>FormItem</code> 会把 <code>field</code> 传给它的 snippet：绑定 <code>field.value</code>，传入 <code>field.status</code> 并展开 <code>field.attrs</code>。提交失败时，焦点会移到第一个无效字段。值的形状作为类型传给 <code>createForm</code>：<code>createForm&lt;Login&gt;()</code>。'
    ),
    wide: true
  },
  {
    slug: 'binding',
    title: l('Binding other controls', 'Привязка других полей', '绑定其他控件'),
    description: l(
      'Bind the prop the control uses: <code>bind:checked</code> for a Switch or Checkbox, <code>bind:value</code> for a group or a Select. A function binding converts the value, here text to a number.',
      'Привязывайте свойство, которое использует поле: <code>bind:checked</code> для Switch и Checkbox, <code>bind:value</code> для группы и Select. Функциональная привязка преобразует значение, здесь текст в число.',
      '绑定控件实际使用的属性：Switch 与 Checkbox 用 <code>bind:checked</code>，分组与 Select 用 <code>bind:value</code>。函数绑定可以转换值，这里是把文本转成数字。'
    ),
    wide: true
  },
  {
    slug: 'layout',
    title: l('Layout', 'Раскладка', '表单布局'),
    description: l(
      '<code>layout</code> is <code>horizontal</code> (label beside the control), <code>vertical</code> (label above it) or <code>inline</code> (items in a row). Below 576 px the horizontal layout stacks the label above the control.',
      '<code>layout</code>: <code>horizontal</code> (подпись рядом с полем), <code>vertical</code> (над полем) или <code>inline</code> (элементы в строку). Уже 576 px горизонтальная раскладка ставит подпись над полем.',
      '<code>layout</code> 可选 <code>horizontal</code>（标签在控件旁）、<code>vertical</code>（标签在控件上方）或 <code>inline</code>（各项排成一行）。屏幕宽度不足 576 px 时，水平布局会把标签叠到控件上方。'
    ),
    wide: true
  },
  {
    slug: 'label-col',
    title: l('Label and control columns', 'Колонки подписи и поля', '标签与控件的栅格'),
    description: l(
      '<code>labelCol</code> and <code>wrapperCol</code> are the props of <code>Col</code>. <code>labelAlign</code> aligns the label text, <code>labelWrap</code> lets a long label wrap, <code>colon</code> draws or hides the colon.',
      '<code>labelCol</code> и <code>wrapperCol</code> — свойства <code>Col</code>. <code>labelAlign</code> выравнивает текст подписи, <code>labelWrap</code> разрешает перенос длинной подписи, <code>colon</code> рисует или прячет двоеточие.',
      '<code>labelCol</code> 与 <code>wrapperCol</code> 就是 <code>Col</code> 的属性。<code>labelAlign</code> 决定标签文字的对齐方式，<code>labelWrap</code> 允许长标签换行，<code>colon</code> 控制是否显示冒号。'
    ),
    wide: true
  },
  {
    slug: 'required-mark',
    title: l('Required mark', 'Отметка обязательности', '必填标记'),
    description: l(
      '<code>requiredMark</code> shows the star (<code>true</code>), hides it, writes <code>(optional)</code> after the labels of the fields that are not required, or takes a snippet that draws the label itself. The mark follows the rules; <code>required</code> on an item overrides it.',
      '<code>requiredMark</code> показывает звёздочку (<code>true</code>), прячет её, пишет <code>(optional)</code> у необязательных полей или принимает snippet, который сам рисует подпись. Отметка следует правилам; <code>required</code> у элемента её переопределяет.',
      '<code>requiredMark</code> 可显示星号（<code>true</code>）、隐藏星号、在非必填项标签后写上 <code>(optional)</code>，或接收一个自行绘制标签的 snippet。标记跟随校验规则；单项的 <code>required</code> 可覆盖它。'
    ),
    wide: true
  },
  {
    slug: 'rules',
    title: l('Validation rules', 'Правила проверки', '校验规则'),
    description: l(
      'Rules are checked by <code>@rc-component/async-validator</code>: <code>required</code>, <code>type</code>, <code>min</code>, <code>max</code>, <code>len</code>, <code>pattern</code>, <code>enum</code>, <code>whitespace</code>, <code>transform</code> and <code>message</code>. A field validates while the user changes it.',
      'Правила проверяет <code>@rc-component/async-validator</code>: <code>required</code>, <code>type</code>, <code>min</code>, <code>max</code>, <code>len</code>, <code>pattern</code>, <code>enum</code>, <code>whitespace</code>, <code>transform</code> и <code>message</code>. Поле проверяется, пока пользователь его меняет.',
      '校验规则由 <code>@rc-component/async-validator</code> 检查：<code>required</code>、<code>type</code>、<code>min</code>、<code>max</code>、<code>len</code>、<code>pattern</code>、<code>enum</code>、<code>whitespace</code>、<code>transform</code> 与 <code>message</code>。用户修改字段时即进行校验。'
    ),
    wide: true
  },
  {
    slug: 'validate-trigger',
    title: l('Validate trigger and debounce', 'Когда проверять и задержка', '校验时机与防抖'),
    description: l(
      '<code>validateTrigger</code> is <code>change</code> (while the user edits), <code>blur</code> (when the control loses focus) or both. <code>validateDebounce</code> waits for a pause in typing before it starts.',
      '<code>validateTrigger</code>: <code>change</code> (пока пользователь правит), <code>blur</code> (когда поле теряет фокус) или оба. <code>validateDebounce</code> ждёт паузы в наборе, прежде чем начать.',
      '<code>validateTrigger</code> 可设为 <code>change</code>（用户编辑时）、<code>blur</code>（控件失去焦点时）或两者。<code>validateDebounce</code> 会等输入停顿后再开始校验。'
    ),
    wide: true
  },
  {
    slug: 'validate-first',
    title: l('Rule order and warnings', 'Порядок правил и предупреждения', '规则顺序与警告'),
    description: l(
      '<code>validateFirst</code> stops at the first failing rule. A rule with <code>warningOnly</code> shows its message as a warning and does not stop the submit.',
      '<code>validateFirst</code> останавливается на первом нарушенном правиле. Правило с <code>warningOnly</code> показывает сообщение как предупреждение и не мешает отправке.',
      '<code>validateFirst</code> 会在第一条失败的规则处停止。带 <code>warningOnly</code> 的规则只以警告形式显示消息，不会阻止提交。'
    ),
    wide: true
  },
  {
    slug: 'feedback',
    title: l('Status icon', 'Иконка статуса', '校验状态图标'),
    description: l(
      '<code>hasFeedback</code> gives the control an icon through <code>field.feedback</code>: place it in the suffix of an <code>Input</code>. The async check shows the validating icon while it runs. <code>validateStatus</code> sets a status by hand.',
      '<code>hasFeedback</code> даёт полю иконку через <code>field.feedback</code>: поставьте её в suffix у <code>Input</code>. Асинхронная проверка показывает иконку ожидания, пока идёт. <code>validateStatus</code> задаёт статус вручную.',
      '<code>hasFeedback</code> 通过 <code>field.feedback</code> 给控件提供状态图标：把它放进 <code>Input</code> 的 suffix。异步校验期间显示“校验中”图标。<code>validateStatus</code> 可手动指定状态。'
    ),
    wide: true
  },
  {
    slug: 'help-extra',
    title: l('Help, extra hint and tooltip', 'Подсказки: help, extra, tooltip', '提示信息'),
    description: l(
      '<code>help</code> replaces the generated messages (<code>false</code> hides them), <code>extra</code> is a hint below the control, <code>tooltip</code> adds a help icon after the label. Each takes text or a snippet.',
      '<code>help</code> заменяет сгенерированные сообщения (<code>false</code> их скрывает), <code>extra</code> — подсказка под полем, <code>tooltip</code> добавляет значок справки после подписи. Каждое принимает текст или snippet.',
      '<code>help</code> 会替换自动生成的消息（<code>false</code> 则隐藏），<code>extra</code> 是控件下方的附加提示，<code>tooltip</code> 会在标签后加一个帮助图标。它们都接受文本或 snippet。'
    ),
    wide: true
  },
  {
    slug: 'initial-hidden',
    title: l('Initial value, hidden and preserve', 'Начальное значение, hidden и preserve', '初始值、隐藏与保留'),
    description: l(
      '<code>initialValue</code> gives a field its value when the form has none. <code>hidden</code> hides an item but the field is still collected and validated. <code>preserve</code> decides whether a field that leaves keeps its value.',
      '<code>initialValue</code> задаёт значение поля, когда его нет в форме. <code>hidden</code> скрывает элемент, но поле по-прежнему собирается и проверяется. <code>preserve</code> решает, сохраняет ли значение поле, которое уходит.',
      '<code>initialValue</code> 在表单没有该值时为字段提供值。<code>hidden</code> 会隐藏该项，但字段仍会被收集和校验。<code>preserve</code> 决定被移除的字段是否保留其值。'
    ),
    wide: true
  },
  {
    slug: 'dependencies',
    title: l('Dependencies', 'Зависимости полей', '依赖字段'),
    description: l(
      '<code>dependencies</code> validates a field again when the user changes another one. The confirmation is checked when the first password changes, but only once the user has touched it.',
      '<code>dependencies</code> проверяет поле заново, когда пользователь меняет другое. Подтверждение проверяется при изменении первого пароля, но только после того, как пользователь его коснулся.',
      '<code>dependencies</code> 会在用户修改另一个字段时重新校验当前字段。确认密码会在第一个密码变化时重新检查，但前提是用户已经操作过它。'
    ),
    wide: true
  },
  {
    slug: 'instance',
    title: l('The form instance', 'Экземпляр формы', '表单实例'),
    description: l(
      '<code>createForm()</code> returns the instance. Set values, reset, validate, and read the values and the messages. Values set from code clear the messages and raise no change callback.',
      '<code>createForm()</code> возвращает экземпляр. Им задают значения, сбрасывают, проверяют и читают значения и сообщения. Значения, заданные из кода, очищают сообщения и не вызывают колбэков изменения.',
      '<code>createForm()</code> 返回表单实例，可用它设置值、重置、校验，以及读取值和消息。由代码设置的值会清除消息，且不会触发变更回调。'
    ),
    wide: true
  },
  {
    slug: 'submit',
    title: l('Submit and the first error', 'Отправка и первая ошибка', '提交与定位到首个错误'),
    description: l(
      '<code>onfinish</code> and <code>onfinishfailed</code> report the result. By default a failed submit scrolls to the first invalid field and focuses it (<code>scrollToFirstError</code>); <code>true</code> only scrolls, <code>false</code> does nothing.',
      '<code>onfinish</code> и <code>onfinishfailed</code> сообщают результат. По умолчанию неудачная отправка прокручивает к первому неверному полю и фокусирует его (<code>scrollToFirstError</code>); <code>true</code> только прокручивает, <code>false</code> ничего не делает.',
      '<code>onfinish</code> 与 <code>onfinishfailed</code> 报告提交结果。默认情况下，提交失败会滚动到第一个无效字段并聚焦它（<code>scrollToFirstError</code>）；<code>true</code> 只滚动，<code>false</code> 什么都不做。'
    ),
    wide: true
  },
  {
    slug: 'size-variant',
    title: l('Disabled, size and variant', 'Disabled, размер и вариант', '禁用、尺寸与形态'),
    description: l(
      '<code>disabled</code>, <code>size</code> and <code>variant</code> of the form are handed to a control by hand through <code>field.disabled</code>, <code>field.size</code> and <code>field.variant</code>. The form never changes a control by itself.',
      '<code>disabled</code>, <code>size</code> и <code>variant</code> формы передаются полю вручную через <code>field.disabled</code>, <code>field.size</code> и <code>field.variant</code>. Сама форма поля не меняет.',
      '表单的 <code>disabled</code>、<code>size</code> 与 <code>variant</code> 需要通过 <code>field.disabled</code>、<code>field.size</code>、<code>field.variant</code> 手动传给控件。表单本身不会改动任何控件。'
    ),
    wide: true
  },
  {
    slug: 'semantic',
    title: l('Styling the parts', 'Стили частей', '自定义语义结构'),
    description: l(
      '<code>classNames</code> and <code>styles</code> of the form reach the six parts of every item: <code>root</code>, <code>label</code>, <code>content</code>, <code>help</code>, <code>helpItem</code> and <code>extra</code>.',
      '<code>classNames</code> и <code>styles</code> формы доходят до шести частей каждого элемента: <code>root</code>, <code>label</code>, <code>content</code>, <code>help</code>, <code>helpItem</code> и <code>extra</code>.',
      '表单上的 <code>classNames</code> 与 <code>styles</code> 会作用于每一项的六个部分：<code>root</code>、<code>label</code>、<code>content</code>、<code>help</code>、<code>helpItem</code> 与 <code>extra</code>。'
    ),
    wide: true
  },
  {
    slug: 'messages',
    title: l('Messages and templates', 'Тексты сообщений и шаблоны', '消息与模板'),
    description: l(
      '<code>validateMessages</code> replaces the generated texts of the form, <code>message</code> of a rule replaces one. Templates use <code>${name}</code>, <code>${min}</code>, <code>${max}</code>, <code>${len}</code> and the variables of <code>messageVariables</code>.',
      '<code>validateMessages</code> заменяет сгенерированные тексты формы, <code>message</code> правила заменяет один. В шаблонах работают <code>${name}</code>, <code>${min}</code>, <code>${max}</code>, <code>${len}</code> и переменные из <code>messageVariables</code>.',
      '<code>validateMessages</code> 可替换表单自动生成的文案，规则的 <code>message</code> 则替换单条。模板支持 <code>${name}</code>、<code>${min}</code>、<code>${max}</code>、<code>${len}</code> 以及 <code>messageVariables</code> 中的变量。'
    ),
    wide: true
  },
  {
    slug: 'dynamic',
    title: l('Dynamic fields', 'Динамические поля', '动态增减字段'),
    description: l(
      'A name can be a path: <code>[\'users\', index, \'name\']</code>. With <code>{#each}</code> and <code>setFieldValue</code> a list of fields grows and shrinks. A field is validated only while it is on the page.',
      'Имя может быть путём: <code>[\'users\', index, \'name\']</code>. С <code>{#each}</code> и <code>setFieldValue</code> список полей растёт и сокращается. Поле проверяется, только пока оно на странице.',
      '字段名可以是路径：<code>[\'users\', index, \'name\']</code>。借助 <code>{#each}</code> 与 <code>setFieldValue</code>，字段列表可以增减。字段只有在页面上时才会被校验。'
    ),
    wide: true
  },
  {
    slug: 'typed',
    title: l('A typed form', 'Форма с типом', '带类型的表单'),
    description: l(
      '<code>createForm&lt;Signup&gt;()</code> gives the instance the shape of the values. <code>onfinish</code>, <code>onvalueschange</code>, <code>getFieldValue</code> and <code>setFieldValue</code> are typed, and a wrong type is an error. The names of the items are not typed: they come through a context.',
      '<code>createForm&lt;Signup&gt;()</code> задаёт экземпляру форму значений. <code>onfinish</code>, <code>onvalueschange</code>, <code>getFieldValue</code> и <code>setFieldValue</code> получают типы, а неверный тип — ошибка. Имена элементов типов не имеют: они приходят через контекст.',
      '<code>createForm&lt;Signup&gt;()</code> 为实例指定值的形状。<code>onfinish</code>、<code>onvalueschange</code>、<code>getFieldValue</code> 与 <code>setFieldValue</code> 都带有类型，类型错误会报错。表单项的名字没有类型：它们经由上下文传入。'
    ),
    wide: true
  },
  {
    slug: 'model',
    title: l('Your own model', 'Своя модель', '自己的数据模型'),
    description: l(
      'Pass your own <code>$state</code> object as <code>model</code> and bind a control to <code>values.username</code>: a change from outside counts as a change by the user, so the field is touched and validated. <code>rules</code> on the form are added to the rules of the items. <code>resetFields</code> writes the model back as it was when the form mounted.',
      'Передайте свой объект <code>$state</code> как <code>model</code> и привяжите элемент к <code>values.username</code>: изменение «снаружи» считается изменением пользователя, поле помечается тронутым и проверяется. <code>rules</code> формы добавляются к правилам элементов. <code>resetFields</code> возвращает модель к состоянию на момент монтирования формы.',
      '把自己的 <code>$state</code> 对象作为 <code>model</code> 传入，并把控件绑定到 <code>values.username</code>：来自外部的修改会被视为用户的修改，字段会被标记并校验。表单上的 <code>rules</code> 会与各项的规则叠加。<code>resetFields</code> 会把模型恢复为表单挂载时的样子。'
    ),
    wide: true
  }
];

export interface FormSnippet {
  code: string;
  kind: 'svelte';
}

/** The code blocks of the section "Typed values and your own model" at the top of the page. */
export const typedSnippet: FormSnippet = {
  kind: 'svelte',
  code: `<script lang="ts">
  import { Form, FormItem, Input, createForm } from 'svelte-ant-design';

  interface Signup {
    username: string;
    age: number;
  }

  // Give the shape of the values to createForm.
  const form = createForm<Signup>();
</script>

<Form {form} initialValues={{ username: '', age: 18 }} onfinish={(values) => save(values.username, values.age)}>
  <FormItem name="username" label="Username">
    {#snippet children(field)}
      <Input bind:value={field.value} {...field.attrs} />
    {/snippet}
  </FormItem>
</Form>

<!-- form.getFieldValue('age') is a number; form.setFieldValue('age', 'x') is a compile error. -->`
};

export const modelSnippet: FormSnippet = {
  kind: 'svelte',
  code: `<script lang="ts">
  import { Form, FormItem, Input, createForm } from 'svelte-ant-design';

  interface Signup {
    username: string;
  }

  // Your own state holds the values, as in Vue; its interface describes them.
  const values: Signup = $state({ username: '' });
  // Optional: the instance is then only for its methods (reset, validate, ...).
  const form = createForm<Signup>();
</script>

<Form {form} model={values} onfinish={(submitted) => save(submitted)}>
  <FormItem name="username" label="Username" rules={[{ required: true }]}>
    {#snippet children(field)}
      <Input bind:value={values.username} status={field.status} {...field.attrs} />
    {/snippet}
  </FormItem>
</Form>`
};

export const apiRows: ApiRow[] = [
  { name: 'form', description: l('The store of the form, from <code>createForm()</code>. Left out: the form makes one, and <code>bind:form</code> returns it. The type of the values, <code>Values</code>, is taken from it.', 'Хранилище формы из <code>createForm()</code>. Если не задано, форма создаёт его сама, а <code>bind:form</code> возвращает его. Тип значений, <code>Values</code>, берётся из него.', '表单的存储对象，由 <code>createForm()</code> 创建。省略时表单会自行创建，并可通过 <code>bind:form</code> 取回。值的类型 <code>Values</code> 取自它。'), type: 'FormInstance<Values>', default: '—' },
  { name: 'model', description: l('Your own <code>$state</code> object that holds the values of the fields: bind a control to <code>values.username</code> or to <code>field.value</code>. A change made to it from outside (a bound control, an assignment in code) counts as a change by the user: the field is touched, <code>onvalueschange</code> runs and the field is validated. The methods of the instance (<code>setFieldValue</code>, <code>resetFields</code>) do not count. Left out: the store keeps the values itself. Pass a <code>$state</code> object, or markup that reads it will not update.', 'Ваш собственный объект <code>$state</code>, в котором лежат значения полей: привяжите элемент управления к <code>values.username</code> или к <code>field.value</code>. Изменение «снаружи» (привязанный элемент, присваивание в коде) считается изменением пользователя: поле помечается тронутым, срабатывает <code>onvalueschange</code> и поле проверяется. Методы экземпляра (<code>setFieldValue</code>, <code>resetFields</code>) не считаются. Если не задано, значения хранит само хранилище. Передавайте объект <code>$state</code>, иначе разметка, которая его читает, не обновится.', '由你自己持有的 <code>$state</code> 对象，字段的值就保存在其中：可以把控件绑定到 <code>values.username</code> 或 <code>field.value</code>。从外部对它做的修改（被绑定的控件、代码中的赋值）会被视为用户的修改：字段被标记为已触碰，触发 <code>onvalueschange</code> 并进行校验。实例的方法（<code>setFieldValue</code>、<code>resetFields</code>）不算。省略时由 store 自己保存值。请传入 <code>$state</code> 对象，否则读取它的模板不会更新。'), type: 'Values', default: '—' },
  { name: 'rules', description: l('The rules by field name: a list per name, or an object for the names below it (<code>{ user: { name: [rule] } }</code>). The rules of the item with that name come after them, and either gives the required mark.', 'Правила по именам полей: список для имени или объект для вложенных имён (<code>{ user: { name: [rule] } }</code>). Правила элемента с этим именем идут после них, и отметку обязательности даёт любое из них.', '按字段名给出的规则：每个名字一个列表，或用对象表示其下的名字（<code>{ user: { name: [rule] } }</code>）。同名表单项自己的规则排在它们之后，任一方的 required 都会显示必填标记。'), type: 'FormRules', default: '—' },
  { name: 'initialValues', description: l('The values the fields start with and <code>resetFields</code> returns to. Not reactive: a later change of the prop is ignored (use <code>setFieldsValue</code>). A field that a control binds needs an initial value. With <code>model</code> it fills only the keys the model lacks.', 'Значения, с которых начинаются поля и к которым возвращает <code>resetFields</code>. Не реактивно: позднее изменение свойства игнорируется (используйте <code>setFieldsValue</code>). Полю, которое привязано к элементу управления, нужно начальное значение. С <code>model</code> заполняет только ключи, которых в модели нет.', '字段的初始值，也是 <code>resetFields</code> 回到的值。不是响应式的：之后修改该属性不会生效（请使用 <code>setFieldsValue</code>）。被控件绑定的字段必须有初始值。设置了 <code>model</code> 时，只补全模型中缺少的键。'), type: 'DeepPartial<Values>', default: '—' },
  { name: 'name', description: l('The prefix of the ids of the controls (<code>signup_username</code>). Left out: a unique id is used, so two forms never share ids.', 'Префикс id полей (<code>signup_username</code>). Если не задано, используется уникальный id, поэтому две формы никогда не делят id.', '控件 id 的前缀（<code>signup_username</code>）。省略时使用唯一 id，因此两个表单不会共用 id。'), type: 'string', default: '—' },
  { name: 'layout', description: l('How an item lays out its label and control.', 'Как элемент раскладывает подпись и поле.', '每一项如何排布标签与控件。'), type: "'horizontal' | 'vertical' | 'inline'", default: "'horizontal'" },
  { name: 'labelCol', description: l('The label column, as the props of <code>Col</code>. An item\'s own value wins. Below 576 px the horizontal layout stacks the label above the control unless this has an <code>xs</code> value.', 'Колонка подписи в виде свойств <code>Col</code>. Собственное значение элемента важнее. Уже 576 px горизонтальная раскладка ставит подпись над полем, если здесь нет значения <code>xs</code>.', '标签列，使用 <code>Col</code> 的属性。单项自己的值优先。宽度不足 576 px 时，水平布局会把标签叠到控件上方，除非这里给出了 <code>xs</code>。'), type: 'ComponentProps<typeof Col>', default: '—' },
  { name: 'wrapperCol', description: l('The control column, as the props of <code>Col</code>. Without a <code>span</code> it takes the room that is left.', 'Колонка поля в виде свойств <code>Col</code>. Без <code>span</code> занимает оставшееся место.', '控件列，使用 <code>Col</code> 的属性。不设 <code>span</code> 时占据剩余空间。'), type: 'ComponentProps<typeof Col>', default: '—' },
  { name: 'labelAlign', description: l('The alignment of the label text. <code>start</code> and <code>end</code> follow the text direction.', 'Выравнивание текста подписи. <code>start</code> и <code>end</code> следуют направлению текста.', '标签文字的对齐方式。<code>start</code> 与 <code>end</code> 跟随文字方向。'), type: "'start' | 'end'", default: "'end'" },
  { name: 'labelWrap', description: l('Whether a long label wraps instead of being cut.', 'Переносится ли длинная подпись вместо обрезки.', '长标签是否换行而不是被截断。'), type: 'boolean', default: 'false' },
  { name: 'colon', description: l('Whether a colon follows the label. Only in the horizontal layout; the room after the label stays without it.', 'Рисуется ли двоеточие после подписи. Только в горизонтальной раскладке; место после подписи остаётся и без него.', '标签后是否显示冒号。仅在水平布局下有效；不显示冒号时，标签后仍保留间距。'), type: 'boolean', default: 'true' },
  { name: 'requiredMark', description: l('The required mark: shown, hidden, the optional mark, or a snippet that draws the label. A form-level setting only.', 'Отметка обязательности: показана, скрыта, отметка необязательности или snippet, рисующий подпись. Только на уровне формы.', '必填标记：显示、隐藏、可选标记，或一个自行绘制标签的 snippet。仅可在表单层面设置。'), type: "boolean | 'optional' | Snippet<[{ label, required }]>", default: 'true' },
  { name: 'validateTrigger', description: l('The events that validate a field: a change by the user, the control losing focus, or both. The default of the items.', 'События, запускающие проверку поля: изменение пользователем, потеря фокуса или оба. Значение по умолчанию для элементов.', '触发字段校验的事件：用户修改、控件失去焦点或两者。是各项的默认值。'), type: "'change' | 'blur' | ('change' | 'blur')[]", default: "'change'" },
  { name: 'validateMessages', description: l('The templates of the generated messages, laid over the English defaults key by key. See the rule table for the variables.', 'Шаблоны сгенерированных сообщений, накладываемые на английские значения по ключам. Переменные — в таблице правил.', '自动生成消息的模板，会逐项覆盖默认的英文文案。变量见规则表。'), type: 'FormValidateMessages', default: '—' },
  { name: 'preserve', description: l('Whether a field keeps its value when its item is destroyed. The default of the items.', 'Сохраняет ли поле значение, когда его элемент уничтожен. Значение по умолчанию для элементов.', '字段对应的表单项被销毁时是否保留其值。是各项的默认值。'), type: 'boolean', default: 'true' },
  { name: 'disabled', description: l('Handed to the controls by hand through <code>field.disabled</code>. The form itself disables nothing.', 'Передаётся полям вручную через <code>field.disabled</code>. Сама форма ничего не отключает.', '需要通过 <code>field.disabled</code> 手动传给控件。表单本身不会禁用任何内容。'), type: 'boolean', default: '—' },
  { name: 'size', description: l('Handed to the controls by hand through <code>field.size</code>.', 'Передаётся полям вручную через <code>field.size</code>.', '需要通过 <code>field.size</code> 手动传给控件。'), type: "'small' | 'medium' | 'large'", default: '—' },
  { name: 'variant', description: l('Handed to the controls by hand through <code>field.variant</code>.', 'Передаётся полям вручную через <code>field.variant</code>.', '需要通过 <code>field.variant</code> 手动传给控件。'), type: "'outlined' | 'borderless' | 'filled' | 'underlined'", default: '—' },
  { name: 'tooltip', description: l('The default props of every label tooltip, and the icon.', 'Свойства по умолчанию для всех подсказок подписей и значок.', '所有标签提示的默认属性，以及图标。'), type: 'FormTooltipConfig', default: '—' },
  { name: 'scrollToFirstError', description: l('After a failed submit: scroll the first invalid control into view and focus it. <code>true</code> only scrolls, an object also takes the native scroll options, <code>false</code> moves nothing.', 'После неудачной отправки: прокрутить к первому неверному полю и сфокусировать его. <code>true</code> только прокручивает, объект принимает и нативные параметры прокрутки, <code>false</code> ничего не двигает.', '提交失败后：把第一个无效控件滚动到可见区域并聚焦。<code>true</code> 只滚动，对象形式还可传入原生滚动选项，<code>false</code> 则什么都不做。'), type: 'boolean | (ScrollIntoViewOptions & { focus?: boolean })', default: '{ focus: true }' },
  { name: 'feedbackIcons', description: l('The icons of the items with <code>hasFeedback</code>, one snippet per status.', 'Иконки элементов с <code>hasFeedback</code>, по snippet на статус.', '带 <code>hasFeedback</code> 的各项所用的图标，每种状态一个 snippet。'), type: 'Partial<Record<FormValidateStatus, Snippet>>', default: '—' },
  { name: 'classNames', description: l('Extra classes for the six parts of every item.', 'Дополнительные классы для шести частей каждого элемента.', '作用于每一项六个部分的额外类名。'), type: 'Partial<Record<root | label | content | help | helpItem | extra, string>>', default: '—' },
  { name: 'styles', description: l('Inline styles for the six parts of every item.', 'Встроенные стили для шести частей каждого элемента.', '作用于每一项六个部分的内联样式。'), type: 'Partial<Record<root | label | content | help | helpItem | extra, Record<string, string | number>>>', default: '—' },
  { name: 'onfinish', description: l('Called after a submit whose validation passed, with the values of the fields. Only the fields that have an item are in it: a field that can be hidden (for example by <code>{#if}</code>) is missing, so declare it optional in <code>Values</code> (<code>age?: number</code>).', 'Вызывается после отправки, прошедшей проверку, со значениями полей. В значениях только поля, у которых есть элемент: поле, которое бывает скрыто (например, через <code>{#if}</code>), отсутствует, поэтому объявите его необязательным в <code>Values</code> (<code>age?: number</code>).', '校验通过的提交之后调用，参数为各字段的值。其中只有带表单项的字段：可能被隐藏的字段（例如被 <code>{#if}</code> 隐藏）不会出现，请在 <code>Values</code> 中将其声明为可选（<code>age?: number</code>）。'), type: '(values: Values) => void', default: '—' },
  { name: 'onfinishfailed', description: l('Called after a submit that failed validation, with <code>{ values, errorFields, outOfDate }</code>.', 'Вызывается после отправки, не прошедшей проверку, с <code>{ values, errorFields, outOfDate }</code>.', '校验失败的提交之后调用，参数为 <code>{ values, errorFields, outOfDate }</code>。'), type: '(info: FormFinishFailedInfo) => void', default: '—' },
  { name: 'onvalueschange', description: l('Called after a change made by the user, with the changed value and all the values. Not called for values set from code.', 'Вызывается после изменения пользователем, с изменённым значением и всеми значениями. Не вызывается для значений, заданных из кода.', '用户修改值之后调用，参数为被修改的值和全部值。由代码设置的值不会触发。'), type: '(changed: DeepPartial<Values>, all: Values) => void', default: '—' },
  { name: 'onfieldschange', description: l('Called when any state of a field changes: value, touched, validating, errors or warnings. A validation reports <code>validating</code> true, then false with the result.', 'Вызывается, когда меняется любое состояние поля: значение, touched, validating, ошибки или предупреждения. Проверка сообщает <code>validating</code> true, затем false с результатом.', '字段的任何状态变化时调用：值、touched、validating、errors 或 warnings。一次校验会先报告 <code>validating</code> 为 true，再以 false 连同结果报告。'), type: '(changed: FormFieldData[], all: FormFieldData[]) => void', default: '—' },
  { name: 'children', description: l('The items of the form.', 'Элементы формы.', '表单中的各项。'), type: 'Snippet', default: '—' },
  { name: 'class', description: l('An additional CSS class.', 'Дополнительный CSS-класс.', '附加的 CSS 类名。'), type: 'string', default: '—' },
  { name: 'style', description: l('Inline style of the <code>&lt;form&gt;</code>.', 'Встроенный стиль элемента <code>&lt;form&gt;</code>.', '<code>&lt;form&gt;</code> 的内联样式。'), type: 'string', default: '—' },
  { name: 'native attributes', description: l('Native <code>&lt;form&gt;</code> attributes except <code>onsubmit</code> (use <code>onfinish</code>). <code>novalidate</code> is set, because the rules validate; pass <code>novalidate={false}</code> to get the native validation back.', 'Нативные атрибуты <code>&lt;form&gt;</code>, кроме <code>onsubmit</code> (используйте <code>onfinish</code>). <code>novalidate</code> задан, потому что проверяют правила; передайте <code>novalidate={false}</code>, чтобы вернуть нативную проверку.', '原生 <code>&lt;form&gt;</code> 属性，但不含 <code>onsubmit</code>（请使用 <code>onfinish</code>）。默认带 <code>novalidate</code>，因为校验由规则完成；传入 <code>novalidate={false}</code> 可恢复原生校验。'), type: 'HTMLFormAttributes', default: '—' }
];

export const itemApiRows: ApiRow[] = [
  { name: 'name', description: l('Connects the item to a field: a key, or a path (<code>[\'user\', \'city\']</code>, <code>[\'users\', 0, \'name\']</code>). A number step makes an array. Left out: a row that only lays out its content.', 'Связывает элемент с полем: ключ или путь (<code>[\'user\', \'city\']</code>, <code>[\'users\', 0, \'name\']</code>). Числовой шаг создаёт массив. Если не задано, это просто строка раскладки.', '把表单项与字段关联：一个键，或一条路径（<code>[\'user\', \'city\']</code>、<code>[\'users\', 0, \'name\']</code>）。数字步骤会生成数组。省略时只是一个布局行。'), type: 'string | number | (string | number)[]', default: '—' },
  { name: 'label', description: l('The label: text or a snippet. <code>null</code> keeps the label column and the colon with no text; left out there is no label column.', 'Подпись: текст или snippet. <code>null</code> сохраняет колонку подписи и двоеточие без текста; если не задано, колонки подписи нет.', '标签：文本或 snippet。<code>null</code> 会保留标签列和冒号但不显示文字；省略时则没有标签列。'), type: 'string | Snippet | null', default: '—' },
  { name: 'rules', description: l('The rules of the field. A rule can be a function of the form that returns one, to compare with another field.', 'Правила поля. Правило может быть функцией формы, возвращающей его, чтобы сравнивать с другим полем.', '字段的校验规则。规则也可以是一个接收表单并返回规则的函数，用于与其他字段比较。'), type: 'FormRule[]', default: '—' },
  { name: 'required', description: l('The mark and <code>aria-required</code>. Left out: derived from a <code>required</code> rule; <code>false</code> turns the mark off.', 'Отметка и <code>aria-required</code>. Если не задано, выводится из правила <code>required</code>; <code>false</code> убирает отметку.', '必填标记与 <code>aria-required</code>。省略时由 <code>required</code> 规则推导；<code>false</code> 会关闭标记。'), type: 'boolean', default: '—' },
  { name: 'help', description: l('Replaces the generated messages. Text or a snippet; <code>false</code> shows no message.', 'Заменяет сгенерированные сообщения. Текст или snippet; <code>false</code> не показывает сообщений.', '替换自动生成的消息。文本或 snippet；<code>false</code> 表示不显示任何消息。'), type: 'string | Snippet | false', default: '—' },
  { name: 'extra', description: l('A hint below the control and the messages. Text or a snippet.', 'Подсказка под полем и сообщениями. Текст или snippet.', '控件和消息下方的附加提示。文本或 snippet。'), type: 'string | Snippet', default: '—' },
  { name: 'tooltip', description: l('A help icon after the label that opens a <code>Tooltip</code>: text, a snippet, or the props of <code>Tooltip</code> with <code>icon</code> and <code>iconLabel</code> (the accessible name of the icon, default <code>More information</code>).', 'Значок справки после подписи, открывающий <code>Tooltip</code>: текст, snippet или свойства <code>Tooltip</code> с <code>icon</code> и <code>iconLabel</code> (доступное имя значка, по умолчанию <code>More information</code>).', '标签后的帮助图标，点击或聚焦时打开 <code>Tooltip</code>：文本、snippet，或带 <code>icon</code> 与 <code>iconLabel</code>（图标的可访问名称，默认 <code>More information</code>）的 <code>Tooltip</code> 属性。'), type: 'string | Snippet | FormTooltipConfig', default: '—' },
  { name: 'hasFeedback', description: l('Gives the control a status icon through <code>field.feedback</code>. The object form replaces the icons of this item. Nothing is drawn unless you place <code>field.feedback</code>.', 'Даёт полю иконку статуса через <code>field.feedback</code>. Объектная форма заменяет иконки этого элемента. Ничего не рисуется, пока вы не поставите <code>field.feedback</code>.', '通过 <code>field.feedback</code> 给控件提供状态图标。对象形式可替换本项的图标。除非你放置 <code>field.feedback</code>，否则不会绘制任何内容。'), type: 'boolean | { icons: Partial<Record<FormValidateStatus, Snippet>> }', default: 'false' },
  { name: 'validateStatus', description: l('Sets the status by hand; it wins over the validation. Left out: derived (<code>validating</code>, <code>error</code>, <code>warning</code>, and <code>success</code> with <code>hasFeedback</code>).', 'Задаёт статус вручную; важнее проверки. Если не задано, выводится (<code>validating</code>, <code>error</code>, <code>warning</code> и <code>success</code> при <code>hasFeedback</code>).', '手动指定状态，优先于校验结果。省略时自动推导（<code>validating</code>、<code>error</code>、<code>warning</code>，设置 <code>hasFeedback</code> 时还有 <code>success</code>）。'), type: "'success' | 'warning' | 'error' | 'validating'", default: '—' },
  { name: 'validateFirst', description: l('<code>true</code> stops at the first failing rule. <code>\'parallel\'</code> runs all the rules at once and keeps the messages of the first failing one.', '<code>true</code> останавливается на первом нарушенном правиле. <code>\'parallel\'</code> запускает все правила сразу и оставляет сообщения первого нарушенного.', '<code>true</code> 在第一条失败的规则处停止。<code>\'parallel\'</code> 会同时运行所有规则，只保留第一条失败规则的消息。'), type: "boolean | 'parallel'", default: 'false' },
  { name: 'validateTrigger', description: l('The events that validate this field. A rule\'s own <code>validateTrigger</code> must be a subset of it.', 'События, проверяющие это поле. Собственный <code>validateTrigger</code> правила должен быть его подмножеством.', '触发本字段校验的事件。规则自己的 <code>validateTrigger</code> 必须是它的子集。'), type: "'change' | 'blur' | ('change' | 'blur')[]", default: "the form's" },
  { name: 'validateDebounce', description: l('Milliseconds to wait before a validation starts; a newer change replaces a waiting one.', 'Миллисекунды ожидания перед началом проверки; более новое изменение заменяет ожидающую проверку.', '校验开始前等待的毫秒数；更新的修改会取代正在等待的校验。'), type: 'number', default: '—' },
  { name: 'dependencies', description: l('Fields whose change by the user validates this one again, if it has been touched or validated. A value set from code does not.', 'Поля, изменение которых пользователем заново проверяет это поле, если его касались или проверяли. Значение, заданное из кода, не запускает проверку.', '用户修改这些字段时，会重新校验本字段（前提是它被操作过或已校验过）。由代码设置的值不会触发。'), type: '(string | number | (string | number)[])[]', default: '—' },
  { name: 'initialValue', description: l('The value when the form has none; the <code>initialValues</code> of the form win.', 'Значение, когда в форме его нет; <code>initialValues</code> формы важнее.', '表单没有该值时使用的值；表单的 <code>initialValues</code> 优先。'), type: 'unknown', default: '—' },
  { name: 'hidden', description: l('Hides the item (<code>display: none</code>); the field is still collected and validated.', 'Скрывает элемент (<code>display: none</code>); поле по-прежнему собирается и проверяется.', '隐藏该项（<code>display: none</code>）；字段仍会被收集和校验。'), type: 'boolean', default: 'false' },
  { name: 'preserve', description: l('<code>false</code> removes the value when the item is destroyed.', '<code>false</code> удаляет значение, когда элемент уничтожен.', '<code>false</code> 表示表单项被销毁时移除其值。'), type: 'boolean', default: "the form's" },
  { name: 'messageVariables', description: l('Extra variables for the message templates.', 'Дополнительные переменные для шаблонов сообщений.', '消息模板可使用的额外变量。'), type: 'Record<string, string>', default: '—' },
  { name: 'colon / labelAlign / labelWrap / labelCol / wrapperCol', description: l('The same as on the form; the item\'s value wins.', 'То же, что у формы; значение элемента важнее.', '与表单上的同名属性相同；单项的值优先。'), type: 'as on the form', default: "the form's" },
  { name: 'layout', description: l('The layout of this item. A form of <code>inline</code> layout is a layout of the whole form, so it is not an option here.', 'Раскладка этого элемента. <code>inline</code> — раскладка всей формы, поэтому здесь её нет.', '本项的布局。<code>inline</code> 是整个表单的布局，因此这里不提供。'), type: "'horizontal' | 'vertical'", default: "the form's" },
  { name: 'htmlFor', description: l('The <code>for</code> of the label. <code>null</code> removes it, so a click on the label does not reach the control (the control keeps its name).', '<code>for</code> подписи. <code>null</code> убирает его, и щелчок по подписи не доходит до поля (имя у поля остаётся).', '标签的 <code>for</code>。<code>null</code> 会移除它，点击标签就不会影响控件（控件仍保留其名称）。'), type: 'string | null', default: 'the id of the control' },
  { name: 'children', description: l('The control. It receives the <code>field</code> object. An item with no <code>name</code> may hold any content.', 'Поле ввода. Получает объект <code>field</code>. Элемент без <code>name</code> может содержать любое содержимое.', '控件。它会收到 <code>field</code> 对象。没有 <code>name</code> 的表单项可以放任意内容。'), type: 'Snippet<[FormField]>', default: '—' },
  { name: 'class / style', description: l('Appended to the root.', 'Добавляются к корню.', '附加到根元素。'), type: 'string', default: '—' },
  { name: 'native attributes', description: l('Native <code>&lt;div&gt;</code> attributes go to the root.', 'Нативные атрибуты <code>&lt;div&gt;</code> попадают на корень.', '原生 <code>&lt;div&gt;</code> 属性会传给根元素。'), type: 'HTMLAttributes<HTMLDivElement>', default: '—' }
];

export interface FieldRow { name: string; description: ReturnType<typeof l>; type: string }

export const fieldRows: FieldRow[] = [
  { name: 'value', description: l('The value of the field. The setter is the path of a change made by the user: it stores the value, marks the field touched, validates, and calls <code>onvalueschange</code> and the dependents. Bind it: <code>bind:value={field.value}</code>.', 'Значение поля. Сеттер — путь изменения пользователем: он сохраняет значение, отмечает поле touched, запускает проверку и вызывает <code>onvalueschange</code> и зависимые поля. Привязывайте: <code>bind:value={field.value}</code>.', '字段的值。setter 就是用户修改的路径：它保存值、标记 touched、进行校验，并触发 <code>onvalueschange</code> 与依赖字段。请这样绑定：<code>bind:value={field.value}</code>。'), type: 'any' },
  { name: 'status', description: l('<code>error</code> or <code>warning</code> for the <code>status</code> prop of a control that has one (<code>Input</code>, <code>Select</code>); otherwise undefined.', '<code>error</code> или <code>warning</code> для свойства <code>status</code> поля, у которого оно есть (<code>Input</code>, <code>Select</code>); иначе undefined.', '提供给带 <code>status</code> 属性的控件（<code>Input</code>、<code>Select</code>）：<code>error</code> 或 <code>warning</code>，否则为 undefined。'), type: "'error' | 'warning' | undefined" },
  { name: 'attrs', description: l('<code>id</code>, <code>aria-describedby</code> (the messages and the extra hint, when they exist), <code>aria-invalid</code> (an error), <code>aria-required</code> and <code>aria-labelledby</code> (the label). Spread it on the control: <code>{...field.attrs}</code>.', '<code>id</code>, <code>aria-describedby</code> (сообщения и подсказка extra, когда они есть), <code>aria-invalid</code> (ошибка), <code>aria-required</code> и <code>aria-labelledby</code> (подпись). Раскройте на поле: <code>{...field.attrs}</code>.', '<code>id</code>、<code>aria-describedby</code>（存在消息与附加提示时）、<code>aria-invalid</code>（出错时）、<code>aria-required</code> 与 <code>aria-labelledby</code>（标签）。请展开到控件上：<code>{...field.attrs}</code>。'), type: 'Record<string, string>' },
  { name: 'errors / warnings', description: l('The messages of the field.', 'Сообщения поля.', '字段的消息。'), type: 'string[]' },
  { name: 'validating / touched', description: l('A validation is running; the user changed the field, or it was validated on blur.', 'Идёт проверка; пользователь менял поле или оно проверялось при потере фокуса.', '正在校验；用户修改过该字段，或它在失焦时被校验过。'), type: 'boolean' },
  { name: 'disabled / size / variant', description: l('The values of the form, for the matching props of the control. undefined leaves the control\'s own default.', 'Значения формы для соответствующих свойств поля. undefined оставляет значение поля по умолчанию.', '表单上的对应值，用于控件的同名属性。undefined 表示保留控件自己的默认值。'), type: 'boolean | FormSize | FormVariant | undefined' },
  { name: 'feedback', description: l('The <code>hasFeedback</code> icon as a snippet, for a suffix of the control; undefined when there is none to show.', 'Иконка <code>hasFeedback</code> как snippet, для suffix поля; undefined, когда показывать нечего.', '<code>hasFeedback</code> 的图标，以 snippet 形式提供给控件的 suffix；没有可显示的图标时为 undefined。'), type: 'Snippet | undefined' }
];

export interface MethodRow { name: string; description: ReturnType<typeof l>; type: string }

export const methodRows: MethodRow[] = [
  { name: 'getFieldValue(name)', description: l('The value of a field. It is the live value: copy it before changing it. Reading it in markup, <code>$derived</code> or <code>$effect</code> is tracked.', 'Значение поля. Это живое значение: копируйте его перед изменением. Чтение в разметке, <code>$derived</code> или <code>$effect</code> отслеживается.', '字段的值。它是实时的值：修改前请先复制。在标记、<code>$derived</code> 或 <code>$effect</code> 中读取时会被追踪。'), type: '(name) => unknown' },
  { name: 'getFieldsValue(names?, { filter }?)', description: l('The values as a nested object: the fields that have an item; <code>true</code> for every value in the store; a list of names for those; <code>filter</code> receives <code>{ touched, validating }</code>. Typed: <code>true</code> gives the whole <code>Values</code>, the others a deep partial, so check a field before you use it.', 'Значения вложенным объектом: поля, у которых есть элемент; <code>true</code> — все значения в хранилище; список имён — эти поля; <code>filter</code> получает <code>{ touched, validating }</code>. Тип: <code>true</code> даёт весь <code>Values</code>, остальные формы — глубокий partial, поэтому поле проверяют перед использованием.', '以嵌套对象返回值：默认是有表单项的字段；<code>true</code> 返回存储中的全部值；传名称列表则返回这些字段；<code>filter</code> 接收 <code>{ touched, validating }</code>。类型：<code>true</code> 得到完整的 <code>Values</code>，其余形式得到深度 partial，使用字段前请先检查。'), type: '(names: true) => Values; (names?: name[], options?) => DeepPartial<Values>' },
  { name: 'setFieldValue(name, value)', description: l('Sets a value and clears the messages of the field. It is not a user change: no callback, no validation, no dependencies.', 'Задаёт значение и очищает сообщения поля. Это не изменение пользователем: ни колбэка, ни проверки, ни зависимостей.', '设置值并清除该字段的消息。它不算用户修改：不触发回调、校验或依赖字段。'), type: '(name, value) => void' },
  { name: 'setFieldsValue(values)', description: l('Merges values into the store, deeply, and clears the messages of the fields they reach. Arrays are replaced.', 'Сливает значения в хранилище, рекурсивно, и очищает сообщения затронутых полей. Массивы заменяются.', '把值深度合并进存储，并清除受影响字段的消息。数组会被整体替换。'), type: '(values) => void' },
  { name: 'getFieldError(name) / getFieldWarning(name)', description: l('The error or warning messages of one field.', 'Сообщения об ошибках или предупреждения одного поля.', '单个字段的错误或警告消息。'), type: '(name) => string[]' },
  { name: 'getFieldsError(names?)', description: l('Every field (or the listed ones) as <code>{ name, errors, warnings }</code>.', 'Каждое поле (или перечисленные) как <code>{ name, errors, warnings }</code>.', '每个字段（或指定字段）的 <code>{ name, errors, warnings }</code>。'), type: '(names?) => FormFieldError[]' },
  { name: 'isFieldTouched(name) / isFieldsTouched(names?, allTouched?) / isFieldValidating(name)', description: l('The flags of fields. <code>isFieldsTouched</code> is true when any (with <code>allTouched</code>, every) listed field was touched.', 'Флаги полей. <code>isFieldsTouched</code> истинно, когда любое (с <code>allTouched</code> — каждое) из перечисленных полей затрагивалось.', '字段的状态标志。<code>isFieldsTouched</code> 在任意（设置 <code>allTouched</code> 时为全部）所列字段被操作过时为 true。'), type: '(…) => boolean' },
  { name: 'setFields(fields)', description: l('Sets any of the value, <code>touched</code>, <code>validating</code>, <code>errors</code> and <code>warnings</code> of fields. <code>errors: []</code> clears the messages.', 'Задаёт любое из значения, <code>touched</code>, <code>validating</code>, <code>errors</code> и <code>warnings</code> полей. <code>errors: []</code> очищает сообщения.', '设置字段的值、<code>touched</code>、<code>validating</code>、<code>errors</code> 与 <code>warnings</code> 中的任意项。<code>errors: []</code> 会清除消息。'), type: '(fields: FormFieldData[]) => void' },
  { name: 'validateFields(names?, config?)', description: l('Validates the fields that have an item (or the listed ones) and resolves with their values (only the fields that have an item, as in <code>onfinish</code>); a failure rejects with <code>{ values, errorFields, outOfDate }</code>. Fields with only warnings do not fail. <code>config</code>: <code>validateOnly</code> (show nothing), <code>recursive</code> (the fields below a path), <code>dirty</code> (only the touched or validated).', 'Проверяет поля с элементами (или перечисленные) и возвращает их значения (только полей с элементами, как в <code>onfinish</code>); при ошибке отклоняется с <code>{ values, errorFields, outOfDate }</code>. Поля только с предупреждениями не считаются ошибкой. <code>config</code>: <code>validateOnly</code> (ничего не показывать), <code>recursive</code> (поля под путём), <code>dirty</code> (только затронутые или проверенные).', '校验有表单项的字段（或指定字段），并返回它们的值（只包含带表单项的字段，与 <code>onfinish</code> 相同）；失败时以 <code>{ values, errorFields, outOfDate }</code> 拒绝。只有警告的字段不算失败。<code>config</code>：<code>validateOnly</code>（不显示任何内容）、<code>recursive</code>（路径之下的字段）、<code>dirty</code>（仅被操作或已校验的字段）。'), type: '(names?, config?) => Promise<values>' },
  { name: 'resetFields(names?)', description: l('Back to the initial values (all fields, or the listed ones), with no touched flags and no messages.', 'Возврат к начальным значениям (всех полей или перечисленных), без флагов touched и без сообщений.', '回到初始值（全部字段或指定字段），并清除 touched 标记与消息。'), type: '(names?) => void' },
  { name: 'submit()', description: l('Does what a submit button does: validate, then <code>onfinish</code> or <code>onfinishfailed</code>. Needs a mounted <code>Form</code>.', 'Делает то же, что кнопка отправки: проверяет, затем вызывает <code>onfinish</code> или <code>onfinishfailed</code>. Нужен смонтированный <code>Form</code>.', '等同于点击提交按钮：先校验，再调用 <code>onfinish</code> 或 <code>onfinishfailed</code>。需要已挂载的 <code>Form</code>。'), type: '() => void' },
  { name: 'scrollToField(name, options?)', description: l('Scrolls the control of a field into view (the native options), and focuses it with <code>{ focus: true }</code>.', 'Прокручивает поле к видимой области (нативные параметры) и фокусирует его при <code>{ focus: true }</code>.', '把字段的控件滚动到可见区域（原生选项），传入 <code>{ focus: true }</code> 时还会聚焦。'), type: '(name, options?) => void' }
];

export interface RuleRow { name: string; description: ReturnType<typeof l>; type: string }

export const ruleRows: RuleRow[] = [
  { name: 'required', description: l('The value must exist: undefined, <code>null</code>, an empty string and an empty array fail; <code>0</code>, <code>false</code> and whitespace pass (add <code>whitespace</code>).', 'Значение должно быть: undefined, <code>null</code>, пустая строка и пустой массив не проходят; <code>0</code>, <code>false</code> и пробелы проходят (добавьте <code>whitespace</code>).', '值必须存在：undefined、<code>null</code>、空字符串和空数组不通过；<code>0</code>、<code>false</code> 与纯空白可通过（需要时加 <code>whitespace</code>）。'), type: 'boolean' },
  { name: 'type', description: l('The type of the value, <code>string</code> unless set: <code>string</code>, <code>number</code>, <code>boolean</code>, <code>integer</code>, <code>float</code>, <code>array</code>, <code>object</code>, <code>enum</code>, <code>url</code>, <code>email</code>, <code>tel</code>, <code>date</code>, <code>regexp</code>, <code>hex</code>, <code>method</code>, <code>any</code>.', 'Тип значения, по умолчанию <code>string</code>: <code>string</code>, <code>number</code>, <code>boolean</code>, <code>integer</code>, <code>float</code>, <code>array</code>, <code>object</code>, <code>enum</code>, <code>url</code>, <code>email</code>, <code>tel</code>, <code>date</code>, <code>regexp</code>, <code>hex</code>, <code>method</code>, <code>any</code>.', '值的类型，未设置时为 <code>string</code>：<code>string</code>、<code>number</code>、<code>boolean</code>、<code>integer</code>、<code>float</code>、<code>array</code>、<code>object</code>、<code>enum</code>、<code>url</code>、<code>email</code>、<code>tel</code>、<code>date</code>、<code>regexp</code>、<code>hex</code>、<code>method</code>、<code>any</code>。'), type: 'FormRuleType' },
  { name: 'len / min / max', description: l('The length of a string or array, the value of a number. <code>len</code> wins over a range.', 'Длина строки или массива, значение числа. <code>len</code> важнее диапазона.', '字符串或数组的长度，数字的值。<code>len</code> 优先于范围。'), type: 'number' },
  { name: 'pattern', description: l('The value must match.', 'Значение должно соответствовать.', '值必须匹配该正则。'), type: 'RegExp' },
  { name: 'enum', description: l('With <code>type: \'enum\'</code>: the allowed values.', 'С <code>type: \'enum\'</code>: допустимые значения.', '配合 <code>type: \'enum\'</code>：允许的取值。'), type: 'unknown[]' },
  { name: 'whitespace', description: l('With <code>type: \'string\'</code>: a value of only whitespace fails.', 'С <code>type: \'string\'</code>: значение из одних пробелов не проходит.', '配合 <code>type: \'string\'</code>：只含空白的值不通过。'), type: 'boolean' },
  { name: 'transform', description: l('Changes the value before it is checked.', 'Меняет значение перед проверкой.', '在检查之前转换值。'), type: '(value) => any' },
  { name: 'message', description: l('The text of the error: a string, used as a template. <code>${name}</code> is the label (or the field name), the others are the values of the rule; <code>\\${</code> is kept as text. Left out: the generated message.', 'Текст ошибки: строка, используется как шаблон. <code>${name}</code> — подпись (или имя поля), остальное — значения правила; <code>\\${</code> остаётся текстом. Если не задано, сообщение генерируется.', '错误文案：字符串，按模板处理。<code>${name}</code> 为标签（或字段名），其余为规则中的值；<code>\\${</code> 会保留为文本。省略时使用自动生成的消息。'), type: 'string' },
  { name: 'validator', description: l('A check of your own: return nothing (it passed), or throw, reject, or return <code>false</code>, an error or errors to fail. It runs next to the other keys of the rule.', 'Собственная проверка: ничего не возвращайте (прошла) либо бросьте исключение, отклоните промис или верните <code>false</code>, ошибку или ошибки. Работает вместе с другими ключами правила.', '自定义检查：什么都不返回表示通过；抛出异常、reject，或返回 <code>false</code>、错误对象来表示失败。它与规则的其他键一起运行。'), type: '(rule, value) => void | Promise<void>' },
  { name: 'warningOnly', description: l('A failure is shown as a warning and does not stop the submit.', 'Нарушение показывается как предупреждение и не мешает отправке.', '失败时只显示为警告，不会阻止提交。'), type: 'boolean' },
  { name: 'defaultField / fields', description: l('With <code>type: \'array\'</code> or <code>\'object\'</code>: the rule of every element, or the rules of the keys.', 'С <code>type: \'array\'</code> или <code>\'object\'</code>: правило каждого элемента или правила ключей.', '配合 <code>type: \'array\'</code> 或 <code>\'object\'</code>：每个元素的规则，或各个键的规则。'), type: 'FormRuleConfig | Record<string, FormRuleConfig>' },
  { name: 'validateTrigger', description: l('The events that run this rule: a subset of the trigger of the item.', 'События, запускающие это правило: подмножество триггера элемента.', '运行此规则的事件：是表单项触发时机的子集。'), type: "'change' | 'blur' | ('change' | 'blur')[]" }
];

export interface HelperRow { name: string; description: ReturnType<typeof l>; type: string }

export const helperRows: HelperRow[] = [
  { name: 'createForm()', description: l('Makes the store of a form: its values and the state of its fields. Pass it to <code>&lt;Form {form}&gt;</code> and call its methods from anywhere. Give it the shape of the values, <code>createForm&lt;Signup&gt;()</code>, and <code>getFieldValue</code>, <code>setFieldValue</code>, <code>setFieldsValue</code>, <code>validateFields</code> and the callbacks of the form are typed. It takes no argument: the initial values are a prop of the form.', 'Создаёт хранилище формы: её значения и состояние полей. Передайте его в <code>&lt;Form {form}&gt;</code> и вызывайте его методы откуда угодно. Передайте форму значений, <code>createForm&lt;Signup&gt;()</code>, и <code>getFieldValue</code>, <code>setFieldValue</code>, <code>setFieldsValue</code>, <code>validateFields</code> и колбэки формы получат типы. Аргументов нет: начальные значения — свойство формы.', '创建表单的存储对象：它保存各字段的值与状态。把它传给 <code>&lt;Form {form}&gt;</code>，即可在任何地方调用其方法。传入值的形状 <code>createForm&lt;Signup&gt;()</code>，<code>getFieldValue</code>、<code>setFieldValue</code>、<code>setFieldsValue</code>、<code>validateFields</code> 以及表单的回调就都有了类型。它不接收参数：初始值是 Form 的属性。'), type: '<Values extends object>() => FormInstance<Values>' },
  { name: 'getFormInstance()', description: l('The instance of the nearest <code>Form</code>, for a component inside it (a custom control, a reset button). Call it while the component initializes; outside a <code>Form</code> it throws.', 'Экземпляр ближайшей <code>Form</code> для компонента внутри неё (своё поле, кнопка сброса). Вызывайте при инициализации компонента; вне <code>Form</code> бросает исключение.', '返回最近的 <code>Form</code> 的实例，供其内部组件（自定义控件、重置按钮等）使用。请在组件初始化时调用；在 <code>Form</code> 之外调用会抛出异常。'), type: '<Values extends object>() => FormInstance<Values>' }
];

export const tokenRows: TokenRow[] = [
  { name: '--ads-form-item-margin-bottom', description: l('The space after an item. A message of one line fits into it, so showing it moves nothing.', 'Отступ после элемента. Сообщение в одну строку помещается в него, поэтому его появление ничего не сдвигает.', '每一项之后的间距。一行消息正好放进其中，因此显示消息不会让任何内容移动。'), value: '24px' },
  { name: '--ads-form-label-color', description: l('Colour of the label.', 'Цвет подписи.', '标签颜色。'), value: 'var(--ads-color-text)' },
  { name: '--ads-form-label-font-size', description: l('Font size of the label and the star.', 'Размер шрифта подписи и звёздочки.', '标签与星号的字号。'), value: 'var(--ads-font-size)' },
  { name: '--ads-form-required-mark-color', description: l('Colour of the star.', 'Цвет звёздочки.', '星号颜色。'), value: 'var(--ads-color-danger-text)' },
  { name: '--ads-form-help-color', description: l('Colour of a neutral message. <code>tokens-accessible.css</code> darkens it to #666666.', 'Цвет нейтрального сообщения. <code>tokens-accessible.css</code> затемняет его до #666666.', '中性消息的颜色。<code>tokens-accessible.css</code> 会将其加深为 #666666。'), value: 'var(--ads-color-text-tertiary)' },
  { name: '--ads-form-extra-color', description: l('Colour of the extra hint and of <code>(optional)</code>. <code>tokens-accessible.css</code> darkens it to #666666.', 'Цвет подсказки extra и <code>(optional)</code>. <code>tokens-accessible.css</code> затемняет его до #666666.', 'extra 提示与 <code>(optional)</code> 的颜色。<code>tokens-accessible.css</code> 会将其加深为 #666666。'), value: 'var(--ads-color-text-tertiary)' },
  { name: '--ads-form-error-text', description: l('Colour of an error message.', 'Цвет сообщения об ошибке.', '错误消息的颜色。'), value: 'var(--ads-color-danger-text)' },
  { name: '--ads-form-warning-text', description: l('Colour of a warning message. <code>tokens-accessible.css</code> darkens it to #874d00.', 'Цвет предупреждения. <code>tokens-accessible.css</code> затемняет его до #874d00.', '警告消息的颜色。<code>tokens-accessible.css</code> 会将其加深为 #874d00。'), value: '#faad14' },
  { name: '--ads-form-success-icon', description: l('Colour of the success icon. <code>tokens-accessible.css</code> darkens it to #389e0d.', 'Цвет иконки успеха. <code>tokens-accessible.css</code> затемняет его до #389e0d.', '成功图标的颜色。<code>tokens-accessible.css</code> 会将其加深为 #389e0d。'), value: '#52c41a' },
  { name: '--ads-form-warning-icon', description: l('Colour of the warning icon. <code>tokens-accessible.css</code> darkens it to #ad6800.', 'Цвет иконки предупреждения. <code>tokens-accessible.css</code> затемняет его до #ad6800.', '警告图标的颜色。<code>tokens-accessible.css</code> 会将其加深为 #ad6800。'), value: '#faad14' },
  { name: '--ads-form-error-icon', description: l('Colour of the error icon.', 'Цвет иконки ошибки.', '错误图标的颜色。'), value: '#ff4d4f' },
  { name: '--ads-form-tooltip-icon-color', description: l('Colour of the help icon of a label. <code>tokens-accessible.css</code> darkens it to #737373.', 'Цвет значка справки у подписи. <code>tokens-accessible.css</code> затемняет его до #737373.', '标签帮助图标的颜色。<code>tokens-accessible.css</code> 会将其加深为 #737373。'), value: 'var(--ads-color-text-tertiary)' }
];
