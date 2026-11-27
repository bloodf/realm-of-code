// The Ember Falls: Svelte 5 with runes, compiled in the browser.
import type { WebLesson, LessonFile } from '../types';
import { src, txt, sameColor, uses } from '../helpers';

const STYLE = `body { font-family: Georgia, serif; background: #fff3ec; color: #3b1a0e; }
h1, h2 { color: #c2410c; }
button { font: inherit; padding: 6px 14px; margin: 2px; border-radius: 6px; border: 2px solid #9a3412; background: #fdba74; cursor: pointer; }
input { font: inherit; padding: 5px; }
.torch { background: white; border: 2px solid #fdba74; border-radius: 8px; padding: 6px 12px; margin: 6px 0; }
`;
const css: LessonFile = { name: 'style.css', lang: 'css', code: STYLE, readonly: true };
const sv = (name: string, code: string): LessonFile => ({ name, lang: 'svelte', code });

export const svelteLessons: WebLesson[] = [
  {
    id: 'svelte-01', kingdom: 'svelte', kind: 'web', mode: 'svelte', region: 'The First Sparks', xp: 60,
    title: 'First Flame',
    concepts: ['svelte components', 'markup', '{expressions}', 'scoped styles'],
    story: 'At the Ember Falls, the fire-smiths say: "Svelte is not a library that runs in the browser. It is a **compiler** that forges your components into tiny, fast JavaScript."',
    learn: `A Svelte component is a \`.svelte\` file: a script, some markup and styles. Use **single braces** to show values:

\`\`\`
<script>
  let name = "Ada";
</script>

<h1>Hello, {name}!</h1>

<style>
  h1 { color: orangered; }
</style>
\`\`\`

Styles in a component are **scoped** automatically: they only affect this component.`,
    task: 'Make the h1 say **Hello, Ada!** using `{name}`. Add `<p>{name.length} letters</p>`. Colour the h1 **orangered** in the `<style>` block.',
    sage: 'Because Svelte compiles away at build time, apps ship very little framework code. It regularly tops developer-satisfaction surveys. SvelteKit is its full-stack framework, like Next.js for React or Nuxt for Vue.',
    hints: ['`<h1>Hello, {name}!</h1>`', '`<style> h1 { color: orangered; } </style>`'],
    files: [sv('App.svelte', '<script>\n  let name = "Ada";\n</script>\n\n<h1>Hello!</h1>\n'), css],
    solution: { 'App.svelte': '<script>\n  let name = "Ada";\n</script>\n\n<h1>Hello, {name}!</h1>\n<p>{name.length} letters</p>\n\n<style>\n  h1 {\n    color: orangered;\n  }\n</style>\n' },
    checks: [
      { label: 'The h1 says "Hello, Ada!" using {name}', test: (c) => txt(c.$('h1')) === 'Hello, Ada!' && /\{\s*name\s*\}/.test(src(c, 'App.svelte')) },
      { label: 'A <p> with "3 letters"', test: (c) => txt(c.$('p')) === '3 letters' },
      { label: 'The h1 is orangered', test: (c) => sameColor(c, c.css('h1', 'color'), 'orangered') },
    ],
  },
  {
    id: 'svelte-02', kingdom: 'svelte', kind: 'web', mode: 'svelte', region: 'The First Sparks', xp: 65,
    title: 'Living Embers',
    concepts: ['$state', 'onclick', 'reactivity'],
    story: 'Embers glow brighter every time you blow on them, and die down when you pour water.',
    learn: `In Svelte 5, reactive state uses the **\`$state\` rune**:

\`\`\`
<script>
  let embers = $state(0);
</script>

<button onclick={() => embers++}>Blow</button>
<p>Embers: {embers}</p>
\`\`\`

You change it like a normal variable, and the page updates. Events are attributes like \`onclick\`.`,
    task: 'Use `$state` for `embers` (start at 0). `#blow` adds 1; `#water` sets it back to **0**. Show **Embers: N** in `#embers`.',
    sage: 'Runes (`$state`, `$derived`, `$effect`, `$props`) arrived in Svelte 5 (2024). Older Svelte code made every top-level `let` reactive automatically, with `$:` for derived values. You will see both styles in the wild.',
    hints: ['`let embers = $state(0);`', '`<button id="water" onclick={() => embers = 0}>Pour water</button>`'],
    files: [sv('App.svelte', '<script>\n  // your $state here\n</script>\n\n<h1>The Ember Pit</h1>\n<p id="embers">Embers: 0</p>\n<button id="blow">Blow</button>\n<button id="water">Pour water</button>\n'), css],
    solution: { 'App.svelte': '<script>\n  let embers = $state(0);\n</script>\n\n<h1>The Ember Pit</h1>\n<p id="embers">Embers: {embers}</p>\n<button id="blow" onclick={() => embers++}>Blow</button>\n<button id="water" onclick={() => (embers = 0)}>Pour water</button>\n' },
    checks: [
      { label: 'Starts at "Embers: 0"', test: (c) => c.text('#embers') === 'Embers: 0' },
      { label: 'Blow 3 times: "Embers: 3"', test: async (c) => { for (let i = 0; i < 3; i++) await c.click('#blow'); return c.text('#embers') === 'Embers: 3'; } },
      { label: 'Water resets to 0', test: async (c) => { await c.click('#water'); return c.text('#embers') === 'Embers: 0'; } },
      { label: 'Uses the $state rune', test: (c) => /\$state\s*\(/.test(src(c, 'App.svelte')) },
    ],
  },
  {
    id: 'svelte-03', kingdom: 'svelte', kind: 'web', mode: 'svelte', region: 'The First Sparks', xp: 70,
    title: 'Reflections in the Falls',
    concepts: ['$derived', 'computed values'],
    story: 'The falls reflect your training: every 100 experience points, your level rises.',
    learn: `The **\`$derived\` rune** computes a value from other state, and keeps it up to date:

\`\`\`
let xp = $state(0);
let level = $derived(Math.floor(xp / 100) + 1);
\`\`\`

\`Math.floor\` rounds down: \`Math.floor(1.9)\` is \`1\`.`,
    task: '`#train` adds **40** xp. Show `#xp` as **XP: N**, `#level` as **Level N** (level 1 at 0 xp, +1 every 100 xp) using `$derived`, and `#next` as **N xp to next level**.',
    sage: 'Same idea as Vue\'s `computed`: derive, don\'t duplicate. `$derived` is lazy and cached. For side effects (logging, saving, timers) Svelte has `$effect`, similar to React\'s `useEffect` but with automatic dependency tracking.',
    hints: ['`let level = $derived(Math.floor(xp / 100) + 1);`', '`let next = $derived(level * 100 - xp);`'],
    files: [sv('App.svelte', '<script>\n  let xp = $state(0);\n</script>\n\n<h1>Training Grounds</h1>\n<p id="xp">XP: {xp}</p>\n<p id="level">Level ?</p>\n<p id="next">? xp to next level</p>\n<button id="train">Train (+40 xp)</button>\n'), css],
    solution: { 'App.svelte': '<script>\n  let xp = $state(0);\n  let level = $derived(Math.floor(xp / 100) + 1);\n  let next = $derived(level * 100 - xp);\n</script>\n\n<h1>Training Grounds</h1>\n<p id="xp">XP: {xp}</p>\n<p id="level">Level {level}</p>\n<p id="next">{next} xp to next level</p>\n<button id="train" onclick={() => (xp += 40)}>Train (+40 xp)</button>\n' },
    checks: [
      { label: 'Starts at Level 1, 100 xp to next level', test: (c) => c.text('#level') === 'Level 1' && c.text('#next') === '100 xp to next level' },
      { label: 'Train twice: XP 80, still Level 1, 20 to go', test: async (c) => { await c.click('#train'); await c.click('#train'); return c.text('#xp') === 'XP: 80' && c.text('#level') === 'Level 1' && c.text('#next') === '20 xp to next level'; } },
      { label: 'Train again: Level 2 at 120 xp', test: async (c) => { await c.click('#train'); return c.text('#level') === 'Level 2' && c.text('#next') === '80 xp to next level'; } },
      { label: 'Uses $derived', test: (c) => /\$derived\s*\(/.test(src(c, 'App.svelte')) },
    ],
  },
  {
    id: 'svelte-04', kingdom: 'svelte', kind: 'web', mode: 'svelte', region: 'Rivers of Fire', xp: 70,
    title: 'The Torch Wall',
    concepts: ['{#each}', '{#if}', 'updating arrays'],
    story: 'A long wall of torches guards the falls. Light them, snuff them, count them.',
    learn: `Svelte has **blocks** for logic in markup:

\`\`\`
{#each torches as torch (torch.id)}
  <li>{torch.name}</li>
{/each}

{#if count === 0}
  <p>Darkness...</p>
{:else}
  <p>{count} lit</p>
{/if}
\`\`\`

\`(torch.id)\` is the key. With \`$state\`, arrays and objects are deeply reactive: \`torch.lit = !torch.lit\` just works.`,
    task: 'Render each torch as an `<li class="torch">` showing its name and a button that toggles `lit` (button text **Snuff** when lit, **Light** when not). Show `#count` as **N lit**, or `#dark` with **Darkness...** when none are lit.',
    sage: 'Deep reactivity (proxies) is why Svelte 5 and Vue let you mutate objects directly, while React asks you to create new ones. Both approaches work; know which world you are in.',
    hints: ['`{#each torches as torch (torch.id)} <li class="torch">{torch.name} <button onclick={() => (torch.lit = !torch.lit)}>{torch.lit ? "Snuff" : "Light"}</button></li> {/each}`', '`let lit = $derived(torches.filter((t) => t.lit).length);`'],
    files: [sv('App.svelte', '<script>\n  let torches = $state([\n    { id: 1, name: "North torch", lit: true },\n    { id: 2, name: "East torch", lit: false },\n    { id: 3, name: "South torch", lit: true },\n  ]);\n</script>\n\n<h1>The Torch Wall</h1>\n<ul>\n  <!-- each torch -->\n</ul>\n'), css],
    solution: { 'App.svelte': '<script>\n  let torches = $state([\n    { id: 1, name: "North torch", lit: true },\n    { id: 2, name: "East torch", lit: false },\n    { id: 3, name: "South torch", lit: true },\n  ]);\n  let lit = $derived(torches.filter((t) => t.lit).length);\n</script>\n\n<h1>The Torch Wall</h1>\n<ul>\n  {#each torches as torch (torch.id)}\n    <li class="torch">\n      {torch.name}\n      <button onclick={() => (torch.lit = !torch.lit)}>{torch.lit ? "Snuff" : "Light"}</button>\n    </li>\n  {/each}\n</ul>\n\n{#if lit === 0}\n  <p id="dark">Darkness...</p>\n{:else}\n  <p id="count">{lit} lit</p>\n{/if}\n' },
    checks: [
      { label: 'Three torches with buttons', test: (c) => c.$$('li.torch').length === 3 && c.$$('li.torch button').length === 3 },
      { label: 'Buttons say Snuff / Light / Snuff', test: (c) => c.$$('li.torch button').map(txt).join(',') === 'Snuff,Light,Snuff' },
      { label: '#count shows "2 lit"', test: (c) => c.text('#count') === '2 lit' },
      { label: 'Snuff two torches: "Darkness..." appears', test: async (c) => { const b = c.$$('li.torch button'); await c.click(b[0]); await c.click(b[2]); return c.text('#dark') === 'Darkness...' && !c.$('#count'); } },
      { label: 'Light one: "1 lit"', test: async (c) => { await c.click(c.$$('li.torch button')[1]); return c.text('#count') === '1 lit'; } },
    ],
  },
  {
    id: 'svelte-05', kingdom: 'svelte', kind: 'web', mode: 'svelte', region: 'Rivers of Fire', xp: 70,
    title: 'The Bound Scroll',
    concepts: ['bind:value', 'bind:checked'],
    story: 'Magic scrolls that write back: whatever you type appears in the flames at once.',
    learn: `\`bind:\` connects an input to state in **both directions**:

\`\`\`
<script>
  let name = $state("");
  let brave = $state(false);
</script>

<input bind:value={name} />
<input type="checkbox" bind:checked={brave} />
\`\`\``,
    task: 'Bind `#name` to `name` and `#brave` (a checkbox) to `brave`. `#oath` shows **I, <name>, swear to be brave!** when brave is checked, or **I, <name>, swear nothing.** when not.',
    sage: '`bind:` is syntax sugar for "set the value, and update state on input". It is similar to Vue\'s `v-model`. React has no two-way binding on purpose: you write `value` and `onChange` by hand.',
    hints: ['`<input id="name" bind:value={name} />` and `<input id="brave" type="checkbox" bind:checked={brave} />`', '`<p id="oath">I, {name}, swear {brave ? "to be brave!" : "nothing."}</p>`'],
    files: [sv('App.svelte', '<script>\n  let name = $state("");\n  let brave = $state(false);\n</script>\n\n<h1>The Oath</h1>\n<input id="name" placeholder="Your name" />\n<label><input id="brave" type="checkbox" /> Brave</label>\n<p id="oath"></p>\n'), css],
    solution: { 'App.svelte': '<script>\n  let name = $state("");\n  let brave = $state(false);\n</script>\n\n<h1>The Oath</h1>\n<input id="name" placeholder="Your name" bind:value={name} />\n<label><input id="brave" type="checkbox" bind:checked={brave} /> Brave</label>\n<p id="oath">I, {name}, swear {brave ? "to be brave!" : "nothing."}</p>\n' },
    checks: [
      { label: 'Typing "Ada": "I, Ada, swear nothing."', test: async (c) => { await c.type('#name', 'Ada'); return c.text('#oath') === 'I, Ada, swear nothing.'; } },
      { label: 'Checking brave: "I, Ada, swear to be brave!"', test: async (c) => { await c.click('#brave'); return c.text('#oath') === 'I, Ada, swear to be brave!'; } },
      { label: 'Uses bind:value and bind:checked', test: (c) => /bind:value=/.test(src(c, 'App.svelte')) && /bind:checked=/.test(src(c, 'App.svelte')) },
    ],
  },
  {
    id: 'svelte-06', kingdom: 'svelte', kind: 'web', mode: 'svelte', region: 'Rivers of Fire', xp: 75,
    title: 'Passing the Torch',
    concepts: ['child components', '$props', 'default values'],
    story: 'Each torch-bearer carries a torch with a name. Some torches are lit, some wait for a spark.',
    learn: `A child component receives **props** with the \`$props\` rune:

\`\`\`
<!-- Torch.svelte -->
<script>
  let { name, lit = false } = $props();   // lit defaults to false
</script>
<div class="torch">{name}: {lit ? "burning" : "cold"}</div>
\`\`\`

The parent imports and uses it:

\`\`\`
<script>
  import Torch from "./Torch.svelte";
</script>
<Torch name="Old Faithful" lit={true} />
\`\`\``,
    task: 'Finish **Torch.svelte** to show **<name>: burning** or **<name>: cold** in `.torch`. In **App.svelte**, render **Old Faithful** (lit), **Spark** (lit) and **Wick** (no `lit` prop, so it uses the default).',
    sage: 'Default values for props make components easy to use: callers only pass what differs. With TypeScript you can type props: `let { name, lit = false }: { name: string; lit?: boolean } = $props();`.',
    hints: ['In Torch.svelte: `<div class="torch">{name}: {lit ? "burning" : "cold"}</div>`', 'In App.svelte: `<Torch name="Wick" />`'],
    files: [
      sv('App.svelte', '<script>\n  import Torch from "./Torch.svelte";\n</script>\n\n<h1>Torch Bearers</h1>\n<Torch name="Old Faithful" lit={true} />\n'),
      sv('Torch.svelte', '<script>\n  let { name, lit = false } = $props();\n</script>\n\n<div class="torch">?</div>\n'),
      css,
    ],
    solution: {
      'App.svelte': '<script>\n  import Torch from "./Torch.svelte";\n</script>\n\n<h1>Torch Bearers</h1>\n<Torch name="Old Faithful" lit={true} />\n<Torch name="Spark" lit={true} />\n<Torch name="Wick" />\n',
      'Torch.svelte': '<script>\n  let { name, lit = false } = $props();\n</script>\n\n<div class="torch">{name}: {lit ? "burning" : "cold"}</div>\n',
    },
    checks: [
      { label: 'Three torches', test: (c) => c.$$('.torch').length === 3 },
      { label: '"Old Faithful: burning", "Spark: burning", "Wick: cold"', test: (c) => c.$$('.torch').map(txt).join('|') === 'Old Faithful: burning|Spark: burning|Wick: cold' },
      { label: 'Wick uses the default (no lit prop)', test: (c) => /<Torch\s+name="Wick"\s*\/>/.test(src(c, 'App.svelte')) },
    ],
  },
  {
    id: 'svelte-07', kingdom: 'svelte', kind: 'web', mode: 'svelte', region: 'The Forge Queue', xp: 150, boss: true,
    title: 'The Forge Queue',
    concepts: ['everything so far', 'callback props'],
    story: 'The Keeper of the Flame runs the great forge. Orders pile up: swords, shields, horseshoes. Build the queue that keeps the forge in order.',
    learn: `Boss challenge! To let a child talk to its parent, pass a **function as a prop**:

\`\`\`
<!-- OrderItem.svelte -->
<script>
  let { order, onremove } = $props();
</script>
<li>{order.item} <button onclick={onremove}>Done</button></li>

<!-- App.svelte -->
<OrderItem {order} onremove={() => remove(order.id)} />
\`\`\`

\`{order}\` is a shortcut for \`order={order}\`.`,
    task: `Build the forge queue:
- \`#item\` input + \`#add\` button add an order; the input clears; empty input adds nothing
- each order is rendered by **OrderItem.svelte** as an \`<li class="order">\` with a **Done** button that removes it
- \`#queue-count\` shows **N orders** (use \`$derived\`)
- \`#idle\` shows **The forge is idle.** when there are no orders`,
    sage: 'You have now built the same kind of app in React, Vue and Svelte. The concepts transfer: components, props, state, derived values, events, lists. Frameworks change over the years, these ideas stay. You have completed the frontend course. The backend lands await!',
    hints: ['`let orders = $state([]); let item = $state("");` and `function add() { if (!item.trim()) return; orders.push({ id: Date.now() + Math.random(), item }); item = ""; }`', 'Remove: `orders = orders.filter((o) => o.id !== id)`. Count: `let count = $derived(orders.length);`'],
    files: [
      sv('App.svelte', '<script>\n  import OrderItem from "./OrderItem.svelte";\n</script>\n\n<h1>The Forge Queue</h1>\n<input id="item" placeholder="Sword, shield..." />\n<button id="add">Add order</button>\n'),
      sv('OrderItem.svelte', '<script>\n  let { order, onremove } = $props();\n</script>\n\n<li class="order">{order.item}</li>\n'),
      css,
    ],
    solution: {
      'App.svelte': '<script>\n  import OrderItem from "./OrderItem.svelte";\n\n  let orders = $state([]);\n  let item = $state("");\n  let count = $derived(orders.length);\n\n  function add() {\n    if (!item.trim()) return;\n    orders.push({ id: Date.now() + Math.random(), item });\n    item = "";\n  }\n\n  function remove(id) {\n    orders = orders.filter((o) => o.id !== id);\n  }\n</script>\n\n<h1>The Forge Queue</h1>\n<input id="item" placeholder="Sword, shield..." bind:value={item} />\n<button id="add" onclick={add}>Add order</button>\n<p id="queue-count">{count} orders</p>\n\n{#if count === 0}\n  <p id="idle">The forge is idle.</p>\n{/if}\n\n<ul>\n  {#each orders as order (order.id)}\n    <OrderItem {order} onremove={() => remove(order.id)} />\n  {/each}\n</ul>\n',
      'OrderItem.svelte': '<script>\n  let { order, onremove } = $props();\n</script>\n\n<li class="order">{order.item} <button onclick={onremove}>Done</button></li>\n',
    },
    checks: [
      { label: 'Idle at first: "The forge is idle." and "0 orders"', test: (c) => c.text('#idle') === 'The forge is idle.' && c.text('#queue-count') === '0 orders' },
      { label: 'Adding "Sword" and "Shield" makes 2 orders', test: async (c) => { await c.type('#item', 'Sword'); await c.click('#add'); await c.type('#item', 'Shield'); await c.click('#add'); return c.$$('li.order').length === 2 && c.text('#queue-count') === '2 orders' && !c.$('#idle'); } },
      { label: 'The input clears, and empty input adds nothing', test: async (c) => { const cleared = (c.$('#item') as HTMLInputElement).value === ''; await c.click('#add'); return cleared && c.$$('li.order').length === 2; } },
      { label: 'Done removes the order', test: async (c) => { await c.click('li.order button'); return c.$$('li.order').length === 1 && txt(c.$('li.order')).startsWith('Shield'); } },
      { label: 'Uses OrderItem and $derived', test: (c) => uses(c.files['App.svelte'], /<OrderItem\b/) && uses(c.files['App.svelte'], /\$derived\s*\(/) },
    ],
  },
];
