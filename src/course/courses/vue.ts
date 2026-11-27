// Section: Vue.
import type { Course } from '../types';
import { teach, mc, tf, fill, match, bug, lesson, unit, challenge } from '../dsl';

export const vue: Course = {
  id: 'vue', title: 'Vue', realm: 'The Emerald Vale', color: '#3aa776', emblem: 'vale',
  desc: 'Single-file components, reactivity, directives, props and emits, and the Vue ecosystem (Router, Pinia, Nuxt).',
  units: [
    unit('vue-u1', 'Vue Basics', 'Single-file components and reactive refs.', `
**Key ideas**
- A \`.vue\` file has \`<script setup>\`, \`<template>\` and \`<style scoped>\`.
- \`{{ expression }}\` shows values in the template.
- \`ref(0)\` creates reactive state; use \`.value\` in the script, not in the template.
- \`@click="..."\` listens to events (short for \`v-on:click\`).`, [
      lesson('vue-1-1', 'Single-file components', [
        teach('Three parts, one file', '```\n<script setup>\nconst name = "Ada";\n</script>\n\n<template>\n  <h1>Welcome, {{ name }}!</h1>\n</template>\n\n<style scoped>\nh1 { color: seagreen; }\n</style>\n```\n`scoped` styles only affect this component.', undefined, 'vue'),
        match('Match the block with its job', [['<template>', 'The HTML'], ['<script setup>', 'The logic'], ['<style scoped>', 'CSS for this component only']]),
        fill('Show the name in the template', '<p>Hello, ___ name ___</p>', ['{{', '}}'], ['{', '}', '${', '%'], undefined, 'vue'),
        tf('Scoped styles can accidentally change other components.', false),
      ]),
      lesson('vue-1-2', 'Reactivity with ref', [
        teach('Reactive state', '```\n<script setup>\nimport { ref } from "vue";\nconst count = ref(0);\nfunction add() {\n  count.value++;      // .value in the script\n}\n</script>\n\n<template>\n  <button @click="add">{{ count }}</button>   <!-- no .value here -->\n</template>\n```'),
        bug('Which line does not update the count?', '<script setup>\nimport { ref } from "vue";\nconst count = ref(0);\nfunction add() { count++; }\n</script>', 4, 'In the script, a ref is changed through `.value`: `count.value++`.', 'vue'),
        mc('In the template, how do you show a ref called `gold`?', ['{{ gold }}', '{{ gold.value }}', '{ gold }', '${gold}'], 0, undefined, { codeOptions: true }),
        mc('`@click` is short for...', ['v-on:click', 'v-bind:click', 'onclick()', 'v-model:click'], 0),
      ]),
      challenge('vue-01', 'Challenge: Your First Vue Spell'),
      challenge('vue-02', 'Challenge: The Potion Cauldron'),
    ]),
    unit('vue-u2', 'Directives and Computed', 'v-if, v-for, v-bind, v-model, computed and watch.', `
**Key ideas**
- \`v-if\` / \`v-else\` conditionally render; \`v-show\` only toggles visibility.
- \`v-for="item in items" :key="item.id"\` repeats elements.
- \`:src="url"\` binds attributes (short for \`v-bind:src\`).
- \`v-model\` = two-way binding for inputs.
- \`computed(() => ...)\` derives cached values; \`watch\` runs side effects when something changes.`, [
      lesson('vue-2-1', 'Directives', [
        teach('Special attributes', '```\n<li v-for="d in dragons" :key="d.id">{{ d.name }}</li>\n<p v-if="dragons.length === 0">No dragons.</p>\n<img :src="d.picture" :alt="d.name" />\n```'),
        match('Match the directive', [['v-if', 'Render only when true'], ['v-for', 'Repeat for each item'], [':src', 'Bind an attribute'], ['@submit', 'Listen to an event']]),
        fill('Repeat one li per knight', '<li ___="k in knights" ___="k.id">{{ k.name }}</li>', ['v-for', ':key'], ['v-if', 'v-each', 'key'], undefined, 'vue'),
        mc('`v-show` differs from `v-if` because it...', ['Keeps the element in the page and toggles display', 'Removes the element completely', 'Only works with lists', 'Runs JavaScript'], 0),
      ]),
      lesson('vue-2-2', 'v-model and computed', [
        teach('Two-way and derived', '```\n<script setup>\nimport { ref, computed } from "vue";\nconst spell = ref("");\nconst loud = computed(() => spell.value.toUpperCase());\n</script>\n<template>\n  <input v-model="spell" />\n  <p>{{ loud }}</p>\n</template>\n```'),
        mc('What does `v-model` do on an input?', ['Keeps the input and the ref in sync both ways', 'Validates the input', 'Styles the input', 'Makes the input read-only'], 0),
        mc('Why use `computed` instead of a method for derived values?', ['It is cached and only recomputes when its dependencies change', 'Methods cannot return values', 'computed runs on the server', 'It is required for v-model'], 0),
        tf('`watch` is the right tool for side effects such as saving to localStorage when data changes.', true),
      ]),
      challenge('vue-03', 'Challenge: Dragons of the Vale'),
      challenge('vue-04', 'Challenge: The Echo Stone'),
    ]),
    unit('vue-u3', 'Components', 'Props down, events up, slots and lifecycle.', `
**Key ideas**
- Child: \`defineProps({ name: String })\`; parent: \`<Potion :price="20" name="Healing" />\`.
- Child emits events: \`const emit = defineEmits(["buy"]); emit("buy")\`; parent listens with \`@buy="..."\`.
- **Slots** (\`<slot />\`) let parents pass content into a child.
- Lifecycle: \`onMounted(() => { ...fetch data... })\`.`, [
      lesson('vue-3-1', 'Props and emits', [
        teach('Talking between components', '```\n<!-- Potion.vue -->\n<script setup>\ndefineProps({ name: String, price: Number });\nconst emit = defineEmits(["buy"]);\n</script>\n<template>\n  <button @click="emit(\'buy\')">Buy {{ name }}</button>\n</template>\n\n<!-- App.vue -->\n<Potion name="Healing" :price="20" @buy="addToCart" />\n```'),
        mc('How does a child send a message to its parent in Vue?', ['It emits an event', 'It changes its props', 'It edits the parent directly', 'With v-model only'], 0),
        mc('Why `:price="20"` and not `price="20"`?', [':price passes the number 20; price="20" passes the string "20"', 'They are identical', 'Colons are required for all props', 'To make it reactive'], 0),
        fill('Declare the props', '___({ title: String, done: Boolean });', ['defineProps'], ['defineEmits', 'props', 'useProps'], undefined, 'vue'),
      ]),
      lesson('vue-3-2', 'Slots and lifecycle', [
        teach('Content and timing', '```\n<!-- Card.vue -->\n<template><div class="card"><slot /></div></template>\n\n<!-- usage -->\n<Card><h2>Any content here</h2></Card>\n```\nRun code when the component appears:\n\n```\nimport { onMounted } from "vue";\nonMounted(async () => {\n  knights.value = await (await fetch("/api/knights")).json();\n});\n```'),
        mc('What is a slot for?', ['Letting the parent put content inside the child', 'Storing state', 'Routing', 'Styling'], 0),
        mc('Where is a good place to fetch initial data?', ['onMounted', 'The <style> block', 'Inside v-for', 'A computed'], 0),
      ]),
      challenge('vue-05', 'Challenge: Potions on the Shelf'),
      challenge('vue-06', "Challenge: The Merchant's Ledger"),
    ]),
    unit('vue-u4', 'The Vue Ecosystem', 'Vue Router, Pinia and Nuxt.', `
**Key ideas**
- **Vue Router**: URLs → components; \`<RouterLink to="/shop">\` and \`<RouterView />\`.
- **Pinia**: the official store for shared state (\`defineStore\`).
- **Nuxt**: the full framework (file-based routing, server rendering), like Next.js for React.
- Create a project: \`npm create vue@latest\` (with Vite).`, [
      lesson('vue-4-1', 'Router, Pinia and Nuxt', [
        teach('Growing apps', '- **Vue Router** maps URLs to components\n- **Pinia** stores state shared by many components (a cart, the user)\n- **Nuxt** adds file-based routing, server rendering and more\n- Start a project with `npm create vue@latest`'),
        match('Match the tool', [['Vue Router', 'Pages and URLs'], ['Pinia', 'Shared state store'], ['Nuxt', 'Full Vue framework'], ['Vite', 'Dev server and build']]),
        mc('Several distant components need the shopping cart. Which tool fits?', ['Pinia', 'A scoped style', 'v-show', 'A slot'], 0),
        tf('Nuxt is to Vue what Next.js is to React.', true),
      ]),
      challenge('vue-07', 'Project: The Potion Shop'),
    ]),
  ],
};
