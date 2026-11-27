// The Emerald Vale: Vue 3 single-file components with <script setup>.
import type { WebLesson, LessonFile } from '../types';
import { src, txt, sameColor, uses } from '../helpers';

const STYLE = `body { font-family: Georgia, serif; background: #eef6ef; color: #1f3b2b; }
h1, h2 { color: #2f6b46; }
button { font: inherit; padding: 6px 14px; margin: 2px; border-radius: 6px; border: 2px solid #2f6b46; background: #bfe3c9; cursor: pointer; }
input { font: inherit; padding: 5px; }
.potion { background: white; border: 2px solid #9cc9a9; border-radius: 8px; padding: 8px 12px; margin: 6px 0; }
`;
const css: LessonFile = { name: 'style.css', lang: 'css', code: STYLE, readonly: true };
const vue = (name: string, code: string): LessonFile => ({ name, lang: 'vue', code });

export const vueLessons: WebLesson[] = [
  {
    id: 'vue-01', kingdom: 'vue', kind: 'web', mode: 'vue', region: 'Into the Vale', xp: 60,
    title: 'Your First Vue Spell',
    concepts: ['single-file components', 'template', 'interpolation', 'scoped style'],
    story: 'Emerald streams run through the Vale. The druids here write each component in **one file** with three parts: template, script and style.',
    learn: `A Vue **single-file component** (\`.vue\`) looks like this:

\`\`\`
<script setup>
const name = "Ada";
</script>

<template>
  <h1>Welcome, {{ name }}!</h1>
</template>

<style scoped>
h1 { color: seagreen; }
</style>
\`\`\`

- \`{{ }}\` puts a value into the template (*interpolation*)
- \`scoped\` styles only affect this component`,
    task: 'Make the h1 say **Welcome, Ada!** using `{{ name }}`. Add a `<p>` that says **Your name has 3 letters.** using `{{ name.length }}`. Colour the h1 **seagreen** in a scoped style.',
    sage: 'Vue is known for its gentle learning curve and is very popular in Asia and Europe, with frameworks like Nuxt built on top. `<script setup>` is the modern, concise way to write components (the *Composition API*). Older code uses the *Options API* (`data()`, `methods`), which you will still meet in many companies.',
    hints: ['`<h1>Welcome, {{ name }}!</h1>`', '`<p>Your name has {{ name.length }} letters.</p>` and `<style scoped> h1 { color: seagreen; } </style>`'],
    files: [vue('App.vue', '<script setup>\nconst name = "Ada";\n</script>\n\n<template>\n  <h1>Welcome</h1>\n</template>\n'), css],
    solution: { 'App.vue': '<script setup>\nconst name = "Ada";\n</script>\n\n<template>\n  <h1>Welcome, {{ name }}!</h1>\n  <p>Your name has {{ name.length }} letters.</p>\n</template>\n\n<style scoped>\nh1 {\n  color: seagreen;\n}\n</style>\n' },
    checks: [
      { label: 'The h1 says "Welcome, Ada!" using {{ name }}', test: (c) => txt(c.$('h1')) === 'Welcome, Ada!' && /\{\{\s*name\s*\}\}/.test(src(c, 'App.vue')) },
      { label: 'A <p> with "Your name has 3 letters."', test: (c) => txt(c.$('p')) === 'Your name has 3 letters.' && /name\.length/.test(src(c, 'App.vue')) },
      { label: 'The h1 is seagreen (scoped style)', test: (c) => sameColor(c, c.css('h1', 'color'), 'seagreen') && /<style\s+scoped/.test(c.files['App.vue']) },
    ],
  },
  {
    id: 'vue-02', kingdom: 'vue', kind: 'web', mode: 'vue', region: 'Into the Vale', xp: 65,
    title: 'The Potion Cauldron',
    concepts: ['ref', 'reactivity', '@click'],
    story: 'The druid\'s cauldron brews potions. Each click brews one; drinking one leaves one fewer.',
    learn: `\`ref\` creates **reactive** state. When it changes, the template updates:

\`\`\`
<script setup>
import { ref } from "vue";
const potions = ref(0);
</script>

<template>
  <button @click="potions++">Brew</button>
  <p>Potions: {{ potions }}</p>
</template>
\`\`\`

In the template you write \`potions\`. In the script you must use \`potions.value\`. \`@click\` is short for \`v-on:click\`.`,
    task: 'Keep `potions` in a `ref` (start at 0). `#brew` adds one. `#drink` removes one, but only if there is at least one. Show **Potions: N** in `#count`.',
    sage: 'Vue tracks which reactive values a template uses and re-renders only what depends on them: fine-grained reactivity. Forgetting `.value` inside `<script>` is the most common Vue mistake; the template unwraps refs for you automatically.',
    hints: ['`const potions = ref(0);` and `<p id="count">Potions: {{ potions }}</p>`', '`<button id="drink" @click="potions > 0 && potions--">Drink</button>` or write a function that checks first.'],
    files: [vue('App.vue', '<script setup>\nimport { ref } from "vue";\n</script>\n\n<template>\n  <h1>The Cauldron</h1>\n  <p id="count">Potions: 0</p>\n  <button id="brew">Brew</button>\n  <button id="drink">Drink</button>\n</template>\n'), css],
    solution: { 'App.vue': '<script setup>\nimport { ref } from "vue";\n\nconst potions = ref(0);\n\nfunction drink() {\n  if (potions.value > 0) potions.value--;\n}\n</script>\n\n<template>\n  <h1>The Cauldron</h1>\n  <p id="count">Potions: {{ potions }}</p>\n  <button id="brew" @click="potions++">Brew</button>\n  <button id="drink" @click="drink">Drink</button>\n</template>\n' },
    checks: [
      { label: 'Starts at "Potions: 0"', test: (c) => c.text('#count') === 'Potions: 0' },
      { label: 'Brew 3 times: "Potions: 3"', test: async (c) => { for (let i = 0; i < 3; i++) await c.click('#brew'); return c.text('#count') === 'Potions: 3'; } },
      { label: 'Drink once: "Potions: 2"', test: async (c) => { await c.click('#drink'); return c.text('#count') === 'Potions: 2'; } },
      { label: 'Never below 0', test: async (c) => { for (let i = 0; i < 4; i++) await c.click('#drink'); return c.text('#count') === 'Potions: 0'; } },
      { label: 'Uses ref()', test: (c) => /ref\s*\(/.test(src(c, 'App.vue')) },
    ],
  },
  {
    id: 'vue-03', kingdom: 'vue', kind: 'web', mode: 'vue', region: 'Into the Vale', xp: 70,
    title: 'Dragons of the Vale',
    concepts: ['v-for', ':key', 'v-if', 'v-else'],
    story: 'The druids keep a register of the dragons in the Vale, and whether each one is asleep. (Please let them sleep.)',
    learn: `**Directives** are special attributes that start with \`v-\`:

\`\`\`
<li v-for="d in dragons" :key="d.id">
  {{ d.name }}
  <span v-if="d.asleep">(asleep)</span>
  <span v-else>(awake!)</span>
</li>
\`\`\`

- \`v-for\` repeats an element for each item
- \`:key\` (short for \`v-bind:key\`) gives each one a unique key
- \`v-if\` / \`v-else\` show one thing or the other`,
    task: 'Show every dragon as an `<li>`: **Smaug (asleep)** or **Ember (awake!)**. Below the list, show `<p id="empty">No dragons here.</p>` only when the list is empty. `#release` removes all dragons.',
    sage: '`v-show` is an alternative to `v-if`: it keeps the element in the page and only toggles `display: none`, which is cheaper for things that toggle often. Never put `v-if` and `v-for` on the same element; filter the list in a `computed` instead.',
    hints: ['`<li v-for="d in dragons" :key="d.id">{{ d.name }} <span v-if="d.asleep">(asleep)</span><span v-else>(awake!)</span></li>`', '`<p id="empty" v-if="dragons.length === 0">No dragons here.</p>`'],
    files: [vue('App.vue', '<script setup>\nimport { ref } from "vue";\n\nconst dragons = ref([\n  { id: 1, name: "Smaug", asleep: true },\n  { id: 2, name: "Ember", asleep: false },\n  { id: 3, name: "Moss", asleep: true },\n]);\n</script>\n\n<template>\n  <h1>Dragon Register</h1>\n  <ul>\n    <!-- one li per dragon -->\n  </ul>\n  <button id="release" @click="dragons = []">Release all dragons</button>\n</template>\n'), css],
    solution: { 'App.vue': '<script setup>\nimport { ref } from "vue";\n\nconst dragons = ref([\n  { id: 1, name: "Smaug", asleep: true },\n  { id: 2, name: "Ember", asleep: false },\n  { id: 3, name: "Moss", asleep: true },\n]);\n</script>\n\n<template>\n  <h1>Dragon Register</h1>\n  <ul>\n    <li v-for="d in dragons" :key="d.id">\n      {{ d.name }}\n      <span v-if="d.asleep">(asleep)</span>\n      <span v-else>(awake!)</span>\n    </li>\n  </ul>\n  <p id="empty" v-if="dragons.length === 0">No dragons here.</p>\n  <button id="release" @click="dragons = []">Release all dragons</button>\n</template>\n' },
    checks: [
      { label: 'Three dragons listed', test: (c) => c.$$('li').length === 3 },
      { label: 'Shows "Smaug (asleep)", "Ember (awake!)", "Moss (asleep)"', test: (c) => c.$$('li').map(txt).join('|') === 'Smaug (asleep)|Ember (awake!)|Moss (asleep)' },
      { label: 'No "empty" message while there are dragons', test: (c) => !c.$('#empty') },
      { label: 'After release: no dragons and the empty message', test: async (c) => { await c.click('#release'); return c.$$('li').length === 0 && c.text('#empty') === 'No dragons here.'; } },
      { label: 'Uses v-for with :key and v-if', test: (c) => /v-for=/.test(src(c, 'App.vue')) && /:key=/.test(src(c, 'App.vue')) && /v-if=/.test(src(c, 'App.vue')) },
    ],
  },
  {
    id: 'vue-04', kingdom: 'vue', kind: 'web', mode: 'vue', region: 'Streams of Data', xp: 70,
    title: 'The Echo Stone',
    concepts: ['v-model', 'computed'],
    story: 'Speak to the Echo Stone and it answers... in CAPITALS, and backwards. Druids find this hilarious.',
    learn: `\`v-model\` connects an input to a ref **both ways**:

\`\`\`
<input v-model="word" />
\`\`\`

A **computed** value is calculated from other state and updates by itself:

\`\`\`
import { ref, computed } from "vue";
const word = ref("");
const shout = computed(() => word.value.toUpperCase());
\`\`\`

Reverse text: \`text.split("").reverse().join("")\``,
    task: 'Bind `#spell` with `v-model`. `#echo` shows the spell in CAPITALS and reversed (typing **hello** shows **OLLEH**) using a `computed`. `#length` shows **N letters**.',
    sage: 'Computed values are cached: they recompute only when their dependencies change, unlike a method called in the template. Use `computed` for derived data and `watch` for side effects (like saving to storage when something changes).',
    hints: ['`const spell = ref("");` and `<input id="spell" v-model="spell" />`', '`const echo = computed(() => spell.value.toUpperCase().split("").reverse().join(""));`'],
    files: [vue('App.vue', '<script setup>\nimport { ref, computed } from "vue";\n</script>\n\n<template>\n  <h1>The Echo Stone</h1>\n  <input id="spell" placeholder="Speak..." />\n  <p>The stone says: <b id="echo"></b></p>\n  <p id="length">0 letters</p>\n</template>\n'), css],
    solution: { 'App.vue': '<script setup>\nimport { ref, computed } from "vue";\n\nconst spell = ref("");\nconst echo = computed(() => spell.value.toUpperCase().split("").reverse().join(""));\n</script>\n\n<template>\n  <h1>The Echo Stone</h1>\n  <input id="spell" placeholder="Speak..." v-model="spell" />\n  <p>The stone says: <b id="echo">{{ echo }}</b></p>\n  <p id="length">{{ spell.length }} letters</p>\n</template>\n' },
    checks: [
      { label: 'Typing "hello" shows "OLLEH"', test: async (c) => { await c.type('#spell', 'hello'); return c.text('#echo') === 'OLLEH'; } },
      { label: '#length shows "5 letters"', test: (c) => c.text('#length') === '5 letters' },
      { label: 'It updates again: "Vale" → "ELAV"', test: async (c) => { await c.type('#spell', 'Vale'); return c.text('#echo') === 'ELAV' && c.text('#length') === '4 letters'; } },
      { label: 'Uses v-model and computed', test: (c) => /v-model=/.test(src(c, 'App.vue')) && /computed\s*\(/.test(src(c, 'App.vue')) },
    ],
  },
  {
    id: 'vue-05', kingdom: 'vue', kind: 'web', mode: 'vue', region: 'Streams of Data', xp: 75,
    title: 'Potions on the Shelf',
    concepts: ['child components', 'defineProps', 'v-bind'],
    story: 'The apothecary shelf shows many potions. Each potion label is the same component with different props.',
    learn: `A child component declares its **props** with \`defineProps\`:

\`\`\`
<!-- Potion.vue -->
<script setup>
defineProps({ name: String, price: Number });
</script>
<template>
  <div class="potion">{{ name }}: {{ price }} gold</div>
</template>
\`\`\`

The parent imports it and passes props. Use \`:\` for non-text values:

\`\`\`
<Potion name="Healing" :price="20" />
<Potion v-for="p in potions" :key="p.id" :name="p.name" :price="p.price" />
\`\`\``,
    task: 'Finish **Potion.vue** to show **<name>: <price> gold** inside `.potion`. In **App.vue**, render one `Potion` per item in `potions` with `v-for`.',
    sage: 'Props are one-way: parent to child. To send a message back up, a child *emits events* (next lesson). With TypeScript, `defineProps<{ name: string; price: number }>()` gives you typed props.',
    hints: ['In Potion.vue: `<div class="potion">{{ name }}: {{ price }} gold</div>`', 'In App.vue: `<Potion v-for="p in potions" :key="p.id" :name="p.name" :price="p.price" />`'],
    files: [
      vue('App.vue', '<script setup>\nimport Potion from "./Potion.vue";\n\nconst potions = [\n  { id: 1, name: "Healing", price: 20 },\n  { id: 2, name: "Invisibility", price: 75 },\n  { id: 3, name: "Dragon Breath", price: 120 },\n];\n</script>\n\n<template>\n  <h1>The Apothecary</h1>\n  <!-- one Potion per item -->\n</template>\n'),
      vue('Potion.vue', '<script setup>\ndefineProps({ name: String, price: Number });\n</script>\n\n<template>\n  <div class="potion">?</div>\n</template>\n'),
      css,
    ],
    solution: {
      'App.vue': '<script setup>\nimport Potion from "./Potion.vue";\n\nconst potions = [\n  { id: 1, name: "Healing", price: 20 },\n  { id: 2, name: "Invisibility", price: 75 },\n  { id: 3, name: "Dragon Breath", price: 120 },\n];\n</script>\n\n<template>\n  <h1>The Apothecary</h1>\n  <Potion v-for="p in potions" :key="p.id" :name="p.name" :price="p.price" />\n</template>\n',
      'Potion.vue': '<script setup>\ndefineProps({ name: String, price: Number });\n</script>\n\n<template>\n  <div class="potion">{{ name }}: {{ price }} gold</div>\n</template>\n',
    },
    checks: [
      { label: 'Three .potion labels', test: (c) => c.$$('.potion').length === 3 },
      { label: 'Labels: "Healing: 20 gold", "Invisibility: 75 gold", "Dragon Breath: 120 gold"', test: (c) => c.$$('.potion').map(txt).join('|') === 'Healing: 20 gold|Invisibility: 75 gold|Dragon Breath: 120 gold' },
      { label: 'App uses v-for on <Potion>', test: (c) => /<Potion[^>]*v-for=/.test(src(c, 'App.vue')) },
    ],
  },
  {
    id: 'vue-06', kingdom: 'vue', kind: 'web', mode: 'vue', region: 'Streams of Data', xp: 80,
    title: 'The Merchant\'s Ledger',
    concepts: ['computed totals', 'arrays in refs', 'v-model.number'],
    story: 'A travelling merchant needs a ledger that adds up his wares as he trades.',
    learn: `Refs can hold arrays. Changing them (\`push\`, \`splice\`) updates the page:

\`\`\`
const items = ref([{ name: "Salt", price: 3, qty: 10 }]);
items.value.push({ name: "Silk", price: 40, qty: 1 });
\`\`\`

\`v-model.number\` turns the typed text into a number.

Computed totals: \`computed(() => items.value.reduce((sum, i) => sum + i.price * i.qty, 0))\``,
    task: 'Show `#total` as the sum of **price × qty** for all items (starts at **48**), using `computed`. The `#add` button adds `{ name: "Silk", price: 40, qty: 1 }`. Show `#count` as **N wares**.',
    sage: 'Notice you did not write any code to "update the total": it is derived from the data. Deriving values instead of storing copies is one of the most important ideas in UI programming, in every framework. Stored copies drift out of sync; derived values cannot.',
    hints: ['`const total = computed(() => items.value.reduce((sum, i) => sum + i.price * i.qty, 0));`', '`<p id="count">{{ items.length }} wares</p>` and `<button id="add" @click="items.push({ name: \'Silk\', price: 40, qty: 1 })">`'],
    files: [vue('App.vue', '<script setup>\nimport { ref, computed } from "vue";\n\nconst items = ref([\n  { name: "Salt", price: 3, qty: 10 },\n  { name: "Candles", price: 2, qty: 9 },\n]);\n</script>\n\n<template>\n  <h1>The Merchant\'s Ledger</h1>\n  <ul>\n    <li v-for="i in items" :key="i.name">{{ i.name }}: {{ i.qty }} × {{ i.price }}</li>\n  </ul>\n  <p id="count"></p>\n  <p>Total: <b id="total"></b> gold</p>\n  <button id="add">Buy silk</button>\n</template>\n'), css],
    solution: { 'App.vue': '<script setup>\nimport { ref, computed } from "vue";\n\nconst items = ref([\n  { name: "Salt", price: 3, qty: 10 },\n  { name: "Candles", price: 2, qty: 9 },\n]);\n\nconst total = computed(() => items.value.reduce((sum, i) => sum + i.price * i.qty, 0));\n\nfunction addSilk() {\n  items.value.push({ name: "Silk", price: 40, qty: 1 });\n}\n</script>\n\n<template>\n  <h1>The Merchant\'s Ledger</h1>\n  <ul>\n    <li v-for="i in items" :key="i.name">{{ i.name }}: {{ i.qty }} × {{ i.price }}</li>\n  </ul>\n  <p id="count">{{ items.length }} wares</p>\n  <p>Total: <b id="total">{{ total }}</b> gold</p>\n  <button id="add" @click="addSilk">Buy silk</button>\n</template>\n' },
    checks: [
      { label: 'The total starts at 48', test: (c) => c.text('#total') === '48' },
      { label: '#count shows "2 wares"', test: (c) => c.text('#count') === '2 wares' },
      { label: 'Buying silk: total 88 and "3 wares"', test: async (c) => { await c.click('#add'); return c.text('#total') === '88' && c.text('#count') === '3 wares' && c.$$('li').length === 3; } },
      { label: 'The total is a computed', test: (c) => /computed\s*\(/.test(src(c, 'App.vue')) },
    ],
  },
  {
    id: 'vue-07', kingdom: 'vue', kind: 'web', mode: 'vue', region: 'The Potion Shop', xp: 150, boss: true,
    title: 'The Potion Shop',
    concepts: ['everything so far', 'defineEmits', 'events up'],
    story: 'The Archdruid opens a potion shop and needs a real storefront: a shelf of potions, a basket, and a total that is always right.',
    learn: `Boss challenge! New idea: a child **emits** events to its parent:

\`\`\`
<!-- PotionCard.vue -->
<script setup>
defineProps({ potion: Object });
const emit = defineEmits(["buy"]);
</script>
<template>
  <button @click="emit('buy')">Buy</button>
</template>

<!-- App.vue -->
<PotionCard :potion="p" @buy="addToBasket(p)" />
\`\`\``,
    task: `Build the shop:
- **PotionCard.vue** shows the potion (\`.potion\` with name and price) and a **Buy** button that emits \`buy\`
- **App.vue** renders a PotionCard per potion; buying adds the potion to the basket
- \`#basket-count\` shows **N in basket**, \`#basket-total\` shows the total price
- each basket line (\`#basket li\`) has a **Remove** button
- when the basket is empty, show \`#empty-basket\``,
    sage: 'Props down, events up: this pattern is the same in every component framework (in React you passed `onToggle` functions). For state shared by many distant components, Vue apps use a store like **Pinia**.',
    hints: ['App: `const basket = ref([]);` and `<PotionCard v-for="p in potions" :key="p.id" :potion="p" @buy="basket.push(p)" />`', 'Remove: `<li v-for="(b, i) in basket" :key="i">{{ b.name }} <button @click="basket.splice(i, 1)">Remove</button></li>`'],
    files: [
      vue('App.vue', '<script setup>\nimport { ref, computed } from "vue";\nimport PotionCard from "./PotionCard.vue";\n\nconst potions = [\n  { id: 1, name: "Healing", price: 20 },\n  { id: 2, name: "Invisibility", price: 75 },\n  { id: 3, name: "Dragon Breath", price: 120 },\n];\n</script>\n\n<template>\n  <h1>The Potion Shop</h1>\n  <!-- shelf, basket, totals -->\n</template>\n'),
      vue('PotionCard.vue', '<script setup>\ndefineProps({ potion: Object });\n</script>\n\n<template>\n  <div class="potion">{{ potion.name }}</div>\n</template>\n'),
      css,
    ],
    solution: {
      'App.vue': '<script setup>\nimport { ref, computed } from "vue";\nimport PotionCard from "./PotionCard.vue";\n\nconst potions = [\n  { id: 1, name: "Healing", price: 20 },\n  { id: 2, name: "Invisibility", price: 75 },\n  { id: 3, name: "Dragon Breath", price: 120 },\n];\n\nconst basket = ref([]);\nconst total = computed(() => basket.value.reduce((sum, p) => sum + p.price, 0));\n</script>\n\n<template>\n  <h1>The Potion Shop</h1>\n  <PotionCard v-for="p in potions" :key="p.id" :potion="p" @buy="basket.push(p)" />\n  <h2>Basket</h2>\n  <p id="basket-count">{{ basket.length }} in basket</p>\n  <p>Total: <b id="basket-total">{{ total }}</b> gold</p>\n  <p id="empty-basket" v-if="basket.length === 0">Your basket is empty.</p>\n  <ul id="basket">\n    <li v-for="(b, i) in basket" :key="i">\n      {{ b.name }}\n      <button @click="basket.splice(i, 1)">Remove</button>\n    </li>\n  </ul>\n</template>\n',
      'PotionCard.vue': '<script setup>\ndefineProps({ potion: Object });\nconst emit = defineEmits(["buy"]);\n</script>\n\n<template>\n  <div class="potion">\n    {{ potion.name }}: {{ potion.price }} gold\n    <button @click="emit(\'buy\')">Buy</button>\n  </div>\n</template>\n',
    },
    checks: [
      { label: 'Three potion cards with Buy buttons', test: (c) => c.$$('.potion').length === 3 && c.$$('.potion button').length === 3 },
      { label: 'The empty basket message shows at first', test: (c) => !!c.$('#empty-basket') && c.text('#basket-count') === '0 in basket' },
      { label: 'Buy Healing and Dragon Breath: "2 in basket", total 140', test: async (c) => { const b = c.$$('.potion button'); await c.click(b[0]); await c.click(b[2]); return c.text('#basket-count') === '2 in basket' && c.text('#basket-total') === '140' && !c.$('#empty-basket'); } },
      { label: 'Remove the first: total 120', test: async (c) => { await c.click(c.$$('#basket li button')[0]); return c.$$('#basket li').length === 1 && c.text('#basket-total') === '120'; } },
      { label: 'PotionCard emits "buy"', test: (c) => uses(c.files['PotionCard.vue'], /defineEmits/) && uses(c.files['App.vue'], /@buy=/) },
    ],
  },
];
