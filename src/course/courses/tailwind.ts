// Section: Tailwind CSS.
import type { Course } from '../types';
import { teach, mc, tf, fill, match, lesson, unit, challenge } from '../dsl';

export const tailwind: Course = {
  id: 'tailwind', title: 'Tailwind CSS', realm: "The Tailors' Quarter", color: '#22a6b3', emblem: 'needle',
  desc: 'Style fast with utility classes: colours, spacing, flex, grid, states and responsive design.',
  units: [
    unit('tw-u1', 'Utility Basics', 'Colours, spacing, text and layout with classes.', `
**Key ideas**
- Utility-first: small classes that each do one thing, written in the HTML.
- Colours: \`bg-amber-100\`, \`text-red-800\` (shades 50–950). Spacing: \`p-4\` = 16px (1 step = 4px), \`px-6\`, \`mt-2\`, \`m-auto\`.
- Text: \`text-sm … text-3xl\`, \`font-bold\`, \`text-center\`. Corners: \`rounded-lg\`, \`rounded-full\`. Shadows: \`shadow-lg\`.
- Layout: \`flex\`, \`gap-4\`, \`justify-between\`, \`items-center\`, \`grid grid-cols-3\`, \`w-full\`, \`max-w-sm\`.`, [
      lesson('tw-1-1', 'Thinking in utilities', [
        teach('Classes instead of rules', 'With Tailwind you rarely write CSS files. You add classes:\n\n```\n<button class="bg-red-700 text-white px-6 py-2 rounded-lg">\n  Order a cloak\n</button>\n```\nEach class does one thing. The spacing scale is 4px per step: `p-1` = 4px, `p-4` = 16px, `p-8` = 32px.', undefined, 'html'),
        match('Match the class with its CSS', [['p-4', 'padding: 16px'], ['text-center', 'text-align: center'], ['font-bold', 'font-weight: 700'], ['rounded-full', 'fully rounded corners']]),
        mc('What does `mt-2` do?', ['Adds 8px margin on top', 'Adds 2px margin everywhere', 'Makes text 2× bigger', 'Moves the element 2 columns'], 0),
        mc('Which is a darker shade?', ['bg-blue-800', 'bg-blue-100', 'bg-blue-50', 'bg-blue-200'], 0, undefined, { codeOptions: true }),
        fill('Light amber background with dark red text', '<div class="___ ___">', ['bg-amber-100', 'text-red-800'], ['amber-100', 'color-red-800', 'background-amber'], undefined, 'html'),
        tf('Tailwind only ships the CSS for classes you actually use.', true),
      ]),
      challenge('tw-01', 'Challenge: Threads of Colour'),
      challenge('tw-02', 'Challenge: Sizes and Spacing'),
      lesson('tw-1-2', 'Layout utilities', [
        teach('Flex and grid as classes', '```\n<nav class="flex justify-between items-center gap-4">...</nav>\n<div class="grid grid-cols-3 gap-2">...</div>\n<main class="max-w-3xl mx-auto">...</main>\n```'),
        match('Match the class', [['flex', 'display: flex'], ['justify-between', 'space-between'], ['items-center', 'align-items: center'], ['grid-cols-3', 'three equal columns']]),
        mc('Which centres a block with a max width?', ['max-w-3xl mx-auto', 'text-center', 'justify-center', 'center-block'], 0, undefined, { codeOptions: true }),
        fill('A column of items with 16px gaps', '<div class="flex ___ gap-4">', ['flex-col'], ['flex-row', 'column', 'stack'], undefined, 'html'),
      ]),
      challenge('tw-03', 'Challenge: Flex Rows in a Snap'),
      challenge('tw-04', 'Challenge: The Grid Quarter'),
    ]),
    unit('tw-u2', 'States, Screens and Projects', 'hover:, md:, dark: and Tailwind in real projects.', `
**Key ideas**
- Variants: \`hover:bg-amber-500\`, \`focus:ring-4\`, \`active:scale-95\`, \`disabled:opacity-50\`, \`dark:bg-slate-900\`.
- Responsive (mobile-first): \`sm:\` 640px+, \`md:\` 768px+, \`lg:\` 1024px+. \`grid-cols-1 md:grid-cols-3\`.
- In projects: install with the Vite plugin, customise with \`@theme\`, reuse with components (not long copy-pasted class lists).`, [
      lesson('tw-2-1', 'Variants', [
        teach('States and screens', '```\n<button class="bg-amber-300 hover:bg-amber-500 focus-visible:ring-4 transition">\n<div class="grid grid-cols-1 md:grid-cols-3">\n```\nA prefix applies the class only in that state or from that screen width **up**.'),
        mc('`md:grid-cols-3` applies when the screen is...', ['768px wide or more', 'Smaller than 768px', 'Exactly 768px', 'A tablet in portrait only'], 0),
        mc('Which class turns the background darker only on hover?', ['hover:bg-indigo-700', 'bg-indigo-700:hover', 'on-hover-indigo', 'indigo-700-hover'], 0, undefined, { codeOptions: true }),
        tf('In Tailwind, classes without a prefix apply to all screen sizes.', true),
        match('Match the variant', [['hover:', 'Mouse over'], ['focus-visible:', 'Keyboard focus'], ['dark:', 'Dark mode'], ['lg:', '1024px and up']]),
      ]),
      challenge('tw-05', 'Challenge: Hover Charms'),
      challenge('tw-06', 'Challenge: Robes for Every Size'),
      lesson('tw-2-2', 'Tailwind in real projects', [
        teach('Keeping it tidy', '- Install with the official **Vite plugin** (or PostCSS)\n- Customise colours and fonts with `@theme` in your CSS\n- Avoid copy-pasting long class lists: make a **component** (React, Vue, Svelte) and reuse it\n- Tools like `clsx` help combine classes conditionally\n- Many teams use component kits built on Tailwind, like **shadcn/ui**'),
        mc('The same 12 classes appear on 30 buttons. Best fix?', ['Create a Button component and reuse it', 'Copy them everywhere', 'Switch to inline styles', 'Use !important'], 0),
        tf('You can still write normal CSS in a Tailwind project when you need it.', true),
        mc('What is Tailwind\'s biggest trade-off?', ['Long class lists in the markup', 'It cannot do responsive design', 'It only works with React', 'It makes pages slow'], 0),
      ]),
      challenge('tw-07', 'Project: The Guild Card'),
    ]),
  ],
};
