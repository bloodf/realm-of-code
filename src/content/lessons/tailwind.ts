// The Tailors' Quarter: Tailwind CSS (v4, running live in the preview).
import type { WebCtx, WebLesson } from '../types';
import { px } from '../helpers';

const page = (body: string) =>
  `<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="utf-8">\n  <title>The Tailors' Quarter</title>\n</head>\n<body class="bg-stone-100 p-6">\n${body}\n</body>\n</html>\n`;

const file = (body: string) => ({ name: 'index.html', lang: 'html' as const, code: page(body) });

/** The class list of the first element matching `sel`. */
const cls = (c: WebCtx, sel: string) => Array.from(c.$(sel)?.classList ?? []);
const has = (c: WebCtx, sel: string, re: RegExp) => cls(c, sel).some((x) => re.test(x));
const transparent = (v: string) => v === 'rgba(0, 0, 0, 0)' || v === 'transparent';

const TW = `This quarter uses **Tailwind CSS**. Instead of writing CSS rules, you add small **utility classes** to your HTML. Each class does one thing:

\`\`\`
<p class="text-red-700 font-bold p-4">
\`\`\``;

export const tailwindLessons: WebLesson[] = [
  {
    id: 'tw-01', kingdom: 'tailwind', kind: 'web', mode: 'tailwind', region: 'Threads and Colours', xp: 50,
    title: 'Threads of Colour',
    concepts: ['utility classes', 'colors', 'padding', 'border'],
    story: 'Tailor Wendeline never writes CSS files. "Why sew a whole robe," she asks, "when you can stitch on exactly the threads you need?"',
    learn: `${TW}

Colours have a **name** and a **shade** from 50 (lightest) to 950 (darkest):

- \`bg-amber-100\`: light amber background
- \`text-red-800\`: dark red text
- \`p-4\`: padding on all sides (4 × 4px = 16px)
- \`border-4 border-amber-700\`: a 4px amber border`,
    task: 'Give the card `#card` a light amber background (`bg-amber-100`), dark red text (`text-red-800`), padding `p-4` and a 4px amber border (`border-4 border-amber-700`).',
    sage: 'Utility-first CSS keeps styles right next to the markup, so you never hunt through files or invent class names. Tailwind only generates the classes you actually use, which keeps the CSS small. The default spacing scale is 0.25rem (4px) per step: `p-1` = 4px, `p-4` = 16px, `p-8` = 32px.',
    hints: ['Put all the classes inside the `class="..."` attribute of the card, separated by spaces.', '`class="bg-amber-100 text-red-800 p-4 border-4 border-amber-700"`'],
    files: [file('  <div id="card" class="">\n    <h1>The Tailor\'s Sign</h1>\n    <p>Fine robes, cloaks and banners since 1066.</p>\n  </div>')],
    solution: { 'index.html': page('  <div id="card" class="bg-amber-100 text-red-800 p-4 border-4 border-amber-700">\n    <h1>The Tailor\'s Sign</h1>\n    <p>Fine robes, cloaks and banners since 1066.</p>\n  </div>') },
    checks: [
      { label: 'bg-amber-100 colours the background', test: (c) => has(c, '#card', /^bg-amber-100$/) && !transparent(c.css('#card', 'background-color')) },
      { label: 'text-red-800 colours the text', test: (c) => has(c, '#card', /^text-red-800$/) && c.css('#card', 'color') !== c.css('body', 'color') },
      { label: 'p-4 gives 16px of padding', test: (c) => c.css('#card', 'padding-top') === '16px' && c.css('#card', 'padding-left') === '16px' },
      { label: 'A 4px amber border', test: (c) => c.css('#card', 'border-top-width') === '4px' && has(c, '#card', /^border-amber-700$/) },
    ],
  },
  {
    id: 'tw-02', kingdom: 'tailwind', kind: 'web', mode: 'tailwind', region: 'Threads and Colours', xp: 55,
    title: 'Sizes and Spacing',
    concepts: ['typography', 'margin', 'rounded', 'px/py'],
    story: 'A noble customer wants a big bold sign and a fancy button to order a cloak.',
    learn: `More threads:

- Text size: \`text-sm\`, \`text-xl\`, \`text-3xl\`... Weight: \`font-bold\`
- Spacing: \`m-4\` (margin), \`px-6\` (left and right padding), \`py-2\` (top and bottom), \`mt-8\` (margin-top)
- Corners: \`rounded\`, \`rounded-lg\`, \`rounded-full\`
- Colours for a button: \`bg-red-700 text-white\``,
    task: 'Make the `h1` **text-3xl** and **font-bold**. Style the button with **px-6 py-2**, **rounded-lg**, **bg-red-700** and **text-white**.',
    sage: 'Tailwind sizes are multiples of 4px, which keeps spacing consistent across a whole product. That consistency is a big part of why designs made with Tailwind often "look right". You can still use exact values when needed: `p-[13px]`.',
    hints: ['h1: `class="text-3xl font-bold"`', 'button: `class="px-6 py-2 rounded-lg bg-red-700 text-white"`'],
    files: [file('  <h1>Cloaks for Nobles</h1>\n  <p class="my-4">Velvet, wool or dragon silk.</p>\n  <button>Order a cloak</button>')],
    solution: { 'index.html': page('  <h1 class="text-3xl font-bold">Cloaks for Nobles</h1>\n  <p class="my-4">Velvet, wool or dragon silk.</p>\n  <button class="px-6 py-2 rounded-lg bg-red-700 text-white">Order a cloak</button>') },
    checks: [
      { label: 'The h1 is text-3xl (30px)', test: (c) => c.css('h1', 'font-size') === '30px' },
      { label: 'The h1 is bold', test: (c) => Number(c.css('h1', 'font-weight')) >= 700 },
      { label: 'The button has px-6 and py-2', test: (c) => c.css('button', 'padding-left') === '24px' && c.css('button', 'padding-top') === '8px' },
      { label: 'The button is rounded-lg', test: (c) => c.css('button', 'border-top-left-radius') === '8px' },
      { label: 'The button is red with white text', test: (c) => has(c, 'button', /^bg-red-700$/) && has(c, 'button', /^text-white$/) && !transparent(c.css('button', 'background-color')) },
    ],
  },
  {
    id: 'tw-03', kingdom: 'tailwind', kind: 'web', mode: 'tailwind', region: 'Rows and Grids', xp: 60,
    title: 'Flex Rows in a Snap',
    concepts: ['flex', 'gap', 'justify', 'items'],
    story: 'The shop sign needs the name on the left and the opening hours on the right.',
    learn: `All of Flexbox, as classes:

- \`flex\`: display: flex
- \`gap-4\`: 16px gap
- \`justify-between\`: space-between
- \`items-center\`: align-items: center
- \`flex-col\`: a column instead of a row`,
    task: 'Turn `#bar` into a flex row: **justify-between**, **items-center**, **gap-4**.',
    sage: 'Compare this with the CSS lesson "Aligning the Guard": same result, but in one line of markup. The trade-off: long class lists. Teams handle that with components (React, Vue, Svelte) so the classes are written once and reused.',
    hints: ['Add the classes to the `nav` with id `bar`.', '`class="flex justify-between items-center gap-4 ..."` (keep the existing classes)'],
    files: [file('  <nav id="bar" class="bg-stone-800 text-amber-200 p-4 rounded-lg">\n    <span class="text-2xl font-bold">✂ Wendeline\'s</span>\n    <span>Open daily 8–18</span>\n  </nav>')],
    solution: { 'index.html': page('  <nav id="bar" class="bg-stone-800 text-amber-200 p-4 rounded-lg flex justify-between items-center gap-4">\n    <span class="text-2xl font-bold">✂ Wendeline\'s</span>\n    <span>Open daily 8–18</span>\n  </nav>') },
    checks: [
      { label: '#bar is flex', test: (c) => c.css('#bar', 'display') === 'flex' },
      { label: 'justify-between', test: (c) => c.css('#bar', 'justify-content') === 'space-between' },
      { label: 'items-center', test: (c) => c.css('#bar', 'align-items') === 'center' },
      { label: 'gap-4 (16px)', test: (c) => c.css('#bar', 'column-gap') === '16px' },
    ],
  },
  {
    id: 'tw-04', kingdom: 'tailwind', kind: 'web', mode: 'tailwind', region: 'Rows and Grids', xp: 60,
    title: 'The Grid Quarter',
    concepts: ['grid', 'grid-cols', 'gap'],
    story: 'Six fabric samples must hang on the wall in neat rows of three.',
    learn: `Grid classes:

- \`grid\`: display: grid
- \`grid-cols-3\`: three equal columns
- \`gap-2\`: 8px gap (\`gap-x-4\`, \`gap-y-2\` for one direction)
- \`col-span-2\`: a child that spans two columns`,
    task: 'Make `#samples` a **grid** with **3 columns** and **gap-2**.',
    sage: 'Under the hood `grid-cols-3` is just `grid-template-columns: repeat(3, minmax(0, 1fr))`. Knowing the real CSS behind each utility makes you productive in any styling system, which is why the Heraldry Hall came first.',
    hints: ['Three classes on `#samples`.', '`class="grid grid-cols-3 gap-2"`'],
    files: [file('  <h1 class="text-2xl font-bold mb-4">Fabric Samples</h1>\n  <div id="samples">\n    <div class="bg-red-700 h-16 rounded"></div>\n    <div class="bg-blue-700 h-16 rounded"></div>\n    <div class="bg-green-700 h-16 rounded"></div>\n    <div class="bg-amber-500 h-16 rounded"></div>\n    <div class="bg-purple-700 h-16 rounded"></div>\n    <div class="bg-stone-700 h-16 rounded"></div>\n  </div>')],
    solution: { 'index.html': page('  <h1 class="text-2xl font-bold mb-4">Fabric Samples</h1>\n  <div id="samples" class="grid grid-cols-3 gap-2">\n    <div class="bg-red-700 h-16 rounded"></div>\n    <div class="bg-blue-700 h-16 rounded"></div>\n    <div class="bg-green-700 h-16 rounded"></div>\n    <div class="bg-amber-500 h-16 rounded"></div>\n    <div class="bg-purple-700 h-16 rounded"></div>\n    <div class="bg-stone-700 h-16 rounded"></div>\n  </div>') },
    checks: [
      { label: '#samples is a grid', test: (c) => c.css('#samples', 'display') === 'grid' },
      { label: 'With 3 columns', test: (c) => c.css('#samples', 'grid-template-columns').split(' ').length === 3 },
      { label: 'gap-2 (8px)', test: (c) => c.css('#samples', 'row-gap') === '8px' },
      { label: 'Two rows of three', test: (c) => new Set(c.$$('#samples > div').map((d) => Math.round(d.getBoundingClientRect().top))).size === 2 },
    ],
  },
  {
    id: 'tw-05', kingdom: 'tailwind', kind: 'web', mode: 'tailwind', region: 'Charms and Seasons', xp: 65,
    title: 'Hover Charms',
    concepts: ['hover:', 'transition', 'shadow', 'variants'],
    story: 'Buttons in this quarter shimmer when you touch them. Learn the charm words.',
    learn: `Put a **variant** in front of a class to apply it only in a state:

- \`hover:bg-amber-500\`: only while hovered
- \`focus:ring-4\`: only when focused (keyboard)
- \`active:scale-95\`: while being pressed

Also useful: \`transition\` (smooth changes) and \`shadow-lg\` (a big soft shadow).`,
    task: 'Style the button with **bg-amber-300**, **hover:bg-amber-500**, **transition**, **shadow-lg** and **rounded-full px-6 py-3**. Hover over it in the preview!',
    sage: 'Variants can stack: `md:hover:bg-red-500`. There are also `dark:` (dark mode), `disabled:`, `group-hover:` (style a child when its parent is hovered) and many more. Always add a visible `focus-visible:` style so keyboard users can see where they are.',
    hints: ['Add all the classes to the button.', '`class="bg-amber-300 hover:bg-amber-500 transition shadow-lg rounded-full px-6 py-3"`'],
    files: [file('  <button>✨ Enchant my cloak</button>')],
    solution: { 'index.html': page('  <button class="bg-amber-300 hover:bg-amber-500 transition shadow-lg rounded-full px-6 py-3">✨ Enchant my cloak</button>') },
    checks: [
      { label: 'bg-amber-300 base colour', test: (c) => has(c, 'button', /^bg-amber-300$/) && !transparent(c.css('button', 'background-color')) },
      { label: 'hover:bg-amber-500 on hover', test: (c) => has(c, 'button', /^hover:bg-amber-500$/) },
      { label: 'A transition', test: (c) => has(c, 'button', /^transition/) && c.css('button', 'transition-duration') !== '0s' },
      { label: 'shadow-lg', test: (c) => c.css('button', 'box-shadow') !== 'none' },
      { label: 'rounded-full with px-6 py-3', test: (c) => px(c.css('button', 'border-top-left-radius')) > 100 && c.css('button', 'padding-left') === '24px' && c.css('button', 'padding-top') === '12px' },
    ],
  },
  {
    id: 'tw-06', kingdom: 'tailwind', kind: 'web', mode: 'tailwind', region: 'Charms and Seasons', xp: 65,
    title: 'Robes for Every Size',
    concepts: ['responsive variants', 'mobile-first', 'md:', 'lg:'],
    story: 'Customers visit from tiny scrolls and from grand tapestries. The gallery must fit both.',
    learn: `Tailwind is **mobile-first**. A class without a prefix applies everywhere; a prefix applies from that width **and up**:

- \`sm:\` 640px+, \`md:\` 768px+, \`lg:\` 1024px+

\`\`\`
<div class="grid grid-cols-1 md:grid-cols-3">
\`\`\`

One column on phones, three columns from 768px.`,
    task: 'Make `#gallery` a grid with **1 column** on small screens and **3 columns** from **md** up, with **gap-4**. Make the heading **text-2xl**, and **md:text-4xl** on bigger screens.',
    sage: 'Start with the small layout, then add prefixes for bigger screens. This mirrors how most traffic arrives today: on phones. Use your browser DevTools "device toolbar" to test many screen sizes quickly.',
    hints: ['Gallery: `class="grid grid-cols-1 md:grid-cols-3 gap-4"`', 'Heading: `class="text-2xl md:text-4xl font-bold"`'],
    files: [file('  <h1>The Gallery of Robes</h1>\n  <div id="gallery">\n    <div class="bg-white p-4 rounded shadow">Royal robe</div>\n    <div class="bg-white p-4 rounded shadow">Ranger cloak</div>\n    <div class="bg-white p-4 rounded shadow">Mage gown</div>\n  </div>')],
    solution: { 'index.html': page('  <h1 class="text-2xl md:text-4xl font-bold">The Gallery of Robes</h1>\n  <div id="gallery" class="grid grid-cols-1 md:grid-cols-3 gap-4">\n    <div class="bg-white p-4 rounded shadow">Royal robe</div>\n    <div class="bg-white p-4 rounded shadow">Ranger cloak</div>\n    <div class="bg-white p-4 rounded shadow">Mage gown</div>\n  </div>') },
    checks: [
      { label: '#gallery is a grid with gap-4', test: (c) => c.css('#gallery', 'display') === 'grid' && c.css('#gallery', 'row-gap') === '16px' },
      { label: 'grid-cols-1 for small screens', test: (c) => has(c, '#gallery', /^grid-cols-1$/) },
      { label: 'md:grid-cols-3 for bigger screens', test: (c) => has(c, '#gallery', /^md:grid-cols-3$/) },
      { label: 'The heading grows: text-2xl md:text-4xl', test: (c) => has(c, 'h1', /^text-2xl$/) && has(c, 'h1', /^md:text-4xl$/) },
    ],
  },
  {
    id: 'tw-07', kingdom: 'tailwind', kind: 'web', mode: 'tailwind', region: 'The Guild Card', xp: 130, boss: true,
    title: 'The Guild Card',
    concepts: ['everything so far'],
    story: 'The Guild of Wizards orders membership cards for every member. Wendeline trusts you with the pattern.',
    learn: 'Boss challenge! Build the whole card with utility classes only. Look at each objective, find the matching classes, and stitch them on one by one.',
    task: `Style the card:
- \`article\`: **max-w-sm**, **bg-white**, **p-6**, **rounded-xl**, **shadow-lg**
- \`img\`: **w-24 h-24 rounded-full mx-auto**
- \`h2\`: **text-xl font-bold text-center**
- the badge \`span\`: **bg-emerald-100 text-emerald-800 rounded-full px-3 py-1 text-sm**
- \`button\`: **w-full mt-4 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg**`,
    sage: 'In a real project this card would become a component (React, Vue or Svelte) so the class lists live in one place. You are about to learn exactly that in the next kingdoms.',
    hints: ['Go element by element: article, img, h2, span, button.', 'For centring the badge, you can wrap it: `<p class="text-center">`.'],
    files: [file('  <article>\n    <img src="knight.svg" alt="Portrait of Sir Ada">\n    <h2>Sir Ada</h2>\n    <p class="text-center my-2"><span>Archmage</span></p>\n    <p class="text-stone-600 text-center">Member since the Age of Loops.</p>\n    <button>View spellbook</button>\n  </article>')],
    solution: { 'index.html': page('  <article class="max-w-sm bg-white p-6 rounded-xl shadow-lg">\n    <img class="w-24 h-24 rounded-full mx-auto" src="knight.svg" alt="Portrait of Sir Ada">\n    <h2 class="text-xl font-bold text-center">Sir Ada</h2>\n    <p class="text-center my-2"><span class="bg-emerald-100 text-emerald-800 rounded-full px-3 py-1 text-sm">Archmage</span></p>\n    <p class="text-stone-600 text-center">Member since the Age of Loops.</p>\n    <button class="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg">View spellbook</button>\n  </article>') },
    checks: [
      { label: 'article: max-w-sm, bg-white, p-6, rounded-xl, shadow-lg', test: (c) => c.css('article', 'max-width') === '384px' && c.css('article', 'padding-top') === '24px' && c.css('article', 'border-top-left-radius') === '12px' && c.css('article', 'box-shadow') !== 'none' && has(c, 'article', /^bg-white$/) },
      { label: 'img: w-24 h-24 rounded-full mx-auto', test: (c) => c.css('img', 'width') === '96px' && c.css('img', 'height') === '96px' && px(c.css('img', 'border-top-left-radius')) > 40 && has(c, 'img', /^mx-auto$/) },
      { label: 'h2: text-xl font-bold text-center', test: (c) => c.css('h2', 'font-size') === '20px' && Number(c.css('h2', 'font-weight')) >= 700 && c.css('h2', 'text-align') === 'center' },
      { label: 'badge: emerald colours, rounded-full, px-3 py-1 text-sm', test: (c) => has(c, 'article span', /^bg-emerald-100$/) && has(c, 'article span', /^text-emerald-800$/) && c.css('article span', 'padding-left') === '12px' && c.css('article span', 'font-size') === '14px' },
      { label: 'button: w-full mt-4, indigo with hover, white text, py-2 rounded-lg', test: (c) => has(c, 'button', /^w-full$/) && c.css('button', 'margin-top') === '16px' && has(c, 'button', /^bg-indigo-600$/) && has(c, 'button', /^hover:bg-indigo-700$/) && has(c, 'button', /^text-white$/) && c.css('button', 'padding-top') === '8px' && c.css('button', 'border-top-left-radius') === '8px' },
    ],
  },
];
