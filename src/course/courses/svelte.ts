// Section: Svelte.
import type { Course } from '../types';
import { teach, mc, tf, fill, match, bug, lesson, unit, challenge } from '../dsl';

export const svelte: Course = {
  id: 'svelte', title: 'Svelte', realm: 'The Ember Falls', color: '#e4572e', emblem: 'flame',
  desc: 'The compiler framework: runes ($state, $derived, $props, $effect), blocks, bindings and SvelteKit.',
  units: [
    unit('svelte-u1', 'Svelte Basics', 'Components, {expressions} and $state.', `
**Key ideas**
- A \`.svelte\` file: \`<script>\`, markup, \`<style>\` (scoped automatically).
- Show values with single braces: \`{name}\`.
- Reactive state with the rune \`let count = $state(0)\`; change it like a normal variable.
- Events are attributes: \`onclick={() => count++}\`.
- Svelte **compiles** components to small, fast JavaScript.`, [
      lesson('svelte-1-1', 'What makes Svelte different', [
        teach('A compiler, not a library', 'React and Vue run a library in the browser. **Svelte** is a **compiler**: it turns your components into plain, efficient JavaScript at build time.\n\n```\n<script>\n  let name = "Ada";\n</script>\n\n<h1>Hello, {name}!</h1>\n\n<style>\n  h1 { color: orangered; }\n</style>\n```', undefined, 'svelte'),
        mc('What is special about Svelte?', ['It compiles components into small JavaScript at build time', 'It has no components', 'It only works on servers', 'It replaces HTML'], 0),
        fill('Show the name', '<p>Hi, ___name___!</p>', ['{', '}'], ['{{', '}}', '$'], undefined, 'svelte'),
        tf('Styles in a Svelte component are scoped to that component by default.', true),
      ]),
      lesson('svelte-1-2', 'Runes and state', [
        teach('$state', '```\n<script>\n  let embers = $state(0);\n</script>\n\n<button onclick={() => embers++}>Embers: {embers}</button>\n```\n`$state` is a **rune**: a special compiler instruction. You change the value like a normal variable.'),
        mc('How do you create reactive state in Svelte 5?', ['let count = $state(0)', 'const [count, setCount] = useState(0)', 'const count = ref(0)', 'state count = 0'], 0, undefined, { codeOptions: true }),
        bug('Which line uses old event syntax from Svelte 4?', '<script>\n  let n = $state(0);\n</script>\n<button on:click={() => n++}>{n}</button>', 4, 'In Svelte 5, events are normal attributes: `onclick={...}`.', 'svelte'),
        match('Match the framework with its state', [['React', 'useState'], ['Vue', 'ref'], ['Svelte', '$state']]),
      ]),
      challenge('svelte-01', 'Challenge: First Flame'),
      challenge('svelte-02', 'Challenge: Living Embers'),
    ]),
    unit('svelte-u2', 'Derived Values, Blocks and Bindings', '$derived, {#each}, {#if} and bind:.', `
**Key ideas**
- \`let double = $derived(count * 2)\` stays in sync automatically.
- \`{#if cond}...{:else}...{/if}\`, \`{#each items as item (item.id)}...{/each}\`.
- \`bind:value={name}\`, \`bind:checked={brave}\` for two-way binding.
- \`$effect(() => { ... })\` for side effects (re-runs when what it reads changes).`, [
      lesson('svelte-2-1', '$derived and blocks', [
        teach('Derive, repeat, decide', '```\n<script>\n  let xp = $state(0);\n  let level = $derived(Math.floor(xp / 100) + 1);\n  let torches = $state([{ id: 1, name: "North", lit: true }]);\n</script>\n\n{#each torches as torch (torch.id)}\n  <p>{torch.name}</p>\n{/each}\n\n{#if level > 1}\n  <p>Level up!</p>\n{:else}\n  <p>Keep training</p>\n{/if}\n```'),
        fill('Keep "double" in sync with count', 'let double = ___(count * 2);', ['$derived'], ['$state', '$effect', 'computed'], undefined, 'svelte'),
        fill('Loop over the orders', '___ orders as order (order.id)}\n  <li>{order.item}</li>\n{/each}', ['{#each'], ['{#for', '{each', '{#if'], undefined, 'svelte'),
        mc('`(torch.id)` in an each block is...', ['The key for each item', 'A function call', 'A filter', 'A comment'], 0),
      ]),
      lesson('svelte-2-2', 'Bindings and effects', [
        teach('Two-way binding', '```\n<input bind:value={name} />\n<input type="checkbox" bind:checked={brave} />\n\n$effect(() => {\n  localStorage.setItem("name", name);   // runs when name changes\n});\n```'),
        mc('What does `bind:value` do?', ['Keeps the input and variable in sync both ways', 'Validates the input', 'Clears the input', 'Binds CSS'], 0),
        match('Match the rune', [['$state', 'Reactive value'], ['$derived', 'Value computed from others'], ['$effect', 'Side effect when things change'], ['$props', 'Component inputs']]),
        tf('`$effect` is a good place to compute a value you show in the markup.', false, 'Use `$derived` for values. `$effect` is for side effects like saving or logging.'),
      ]),
      challenge('svelte-03', 'Challenge: Reflections in the Falls'),
      challenge('svelte-04', 'Challenge: The Torch Wall'),
      challenge('svelte-05', 'Challenge: The Bound Scroll'),
    ]),
    unit('svelte-u3', 'Components and SvelteKit', '$props, callback props and the SvelteKit framework.', `
**Key ideas**
- Props: \`let { name, lit = false } = $props();\` (with defaults).
- Child → parent: pass a function prop (\`onremove\`) and call it.
- \`{order}\` is shorthand for \`order={order}\`.
- **SvelteKit**: the full framework (file-based routes in \`src/routes\`, \`+page.svelte\`, server load functions).`, [
      lesson('svelte-3-1', 'Props and callbacks', [
        teach('Passing the torch', '```\n<!-- Torch.svelte -->\n<script>\n  let { name, lit = false, onsnuff } = $props();\n</script>\n<button onclick={onsnuff}>{name}: {lit ? "burning" : "cold"}</button>\n\n<!-- App.svelte -->\n<Torch name="Spark" lit={true} onsnuff={() => console.log("out")} />\n```'),
        fill('Read the props with a default', 'let { title, done = ___ } = ___();', ['false', '$props'], ['true()', '$state', 'props'], undefined, 'svelte'),
        mc('How does a child tell the parent something happened in Svelte 5?', ['By calling a function passed as a prop', 'By changing its props', 'With createEventDispatcher only', 'It cannot'], 0),
        mc('`<OrderItem {order} />` is short for...', ['<OrderItem order={order} />', '<OrderItem {...order} />', '<OrderItem order="order" />', '<OrderItem>{order}</OrderItem>'], 0, undefined, { codeOptions: true }),
      ]),
      lesson('svelte-3-2', 'SvelteKit', [
        teach('The full kit', '**SvelteKit** is the framework for real Svelte apps:\n- routes are folders in `src/routes` (`src/routes/about/+page.svelte` → `/about`)\n- `+page.js` / `+page.server.js` load data\n- server rendering, forms and API endpoints built in\n- start with `npx sv create my-app`'),
        mc('Which file creates the page at `/shop`?', ['src/routes/shop/+page.svelte', 'src/shop.svelte', 'pages/shop.html', 'src/routes/+shop.svelte'], 0, undefined, { codeOptions: true }),
        match('Match the framework', [['SvelteKit', 'Svelte'], ['Next.js', 'React'], ['Nuxt', 'Vue']]),
        tf('Every framework teaches the same core ideas: components, props, state and events.', true),
      ]),
      challenge('svelte-06', 'Challenge: Passing the Torch'),
      challenge('svelte-07', 'Project: The Forge Queue'),
    ]),
  ],
};
