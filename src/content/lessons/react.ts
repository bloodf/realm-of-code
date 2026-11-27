// The Summoners' Circle: React 19 with JSX, compiled in the browser.
import type { WebLesson, LessonFile } from '../types';
import { src, txt, sameColor, uses } from '../helpers';

const STYLE = `body { font-family: Georgia, serif; background: #fbf3dd; color: #2b1d12; }
h1, h2 { color: #7d1f1a; }
button { font: inherit; padding: 6px 14px; margin: 2px; border-radius: 6px; border: 2px solid #5a3a22; background: #e8c170; cursor: pointer; }
input { font: inherit; padding: 5px; }
.knight, .quest { background: #fff7e0; border: 2px solid #c9ae78; border-radius: 8px; padding: 8px 12px; margin: 6px 0; }
.done { text-decoration: line-through; opacity: 0.6; }
`;
const css: LessonFile = { name: 'style.css', lang: 'css', code: STYLE, readonly: true };
const jsx = (name: string, code: string, readonly = false): LessonFile => ({ name, lang: 'jsx', code, readonly });

export const reactLessons: WebLesson[] = [
  {
    id: 'react-01', kingdom: 'react', kind: 'web', mode: 'react', region: 'First Summons', xp: 60,
    title: 'Summon Your First Component',
    concepts: ['components', 'JSX', 'export default'],
    story: 'In the Summoners\' Circle, nobody builds pages by hand. They **summon components**: little spells that return pieces of the page.',
    learn: `A React **component** is a function that returns **JSX**: HTML-like code inside JavaScript.

\`\`\`
export default function App() {
  return (
    <div>
      <h1>Hail, Realm!</h1>
      <p>The circle is open.</p>
    </div>
  );
}
\`\`\`

Rules of JSX:
- A component name starts with a **Capital** letter
- Return **one** parent element (wrap siblings in a \`<div>\` or \`<>...</>\`)
- \`export default\` lets the game find your \`App\``,
    task: 'Make `App` return an `<h1>` with the exact text **Hail, Realm!** and a `<p>` with any text.',
    sage: 'React is used by a large share of companies hiring front-end developers. JSX is compiled into normal function calls (`jsx("h1", { children: "Hail" })`), which is why you can mix it freely with JavaScript. The empty `<>...</>` is called a *Fragment*: a wrapper that adds no element to the page.',
    hints: ['Put the `<h1>` and `<p>` inside the existing `<div>`.', '`<h1>Hail, Realm!</h1>` and `<p>The circle is open.</p>`'],
    files: [jsx('App.jsx', 'export default function App() {\n  return (\n    <div>\n      {/* Summon your h1 and p here */}\n    </div>\n  );\n}\n'), css],
    solution: { 'App.jsx': 'export default function App() {\n  return (\n    <div>\n      <h1>Hail, Realm!</h1>\n      <p>The circle is open.</p>\n    </div>\n  );\n}\n' },
    checks: [
      { label: 'An <h1> with "Hail, Realm!"', test: (c) => txt(c.$('h1')) === 'Hail, Realm!' },
      { label: 'A <p> with some text', test: (c) => txt(c.$('p')).length > 0 },
    ],
  },
  {
    id: 'react-02', kingdom: 'react', kind: 'web', mode: 'react', region: 'First Summons', xp: 65,
    title: 'JSX Spells',
    concepts: ['expressions in JSX', 'className', 'style objects'],
    story: 'A summoner\'s scroll should never be copied by hand. Pull the values straight from the hero\'s data!',
    learn: `Curly braces \`{ }\` put **JavaScript** inside JSX:

\`\`\`
<h1>Hero: {hero.name}</h1>
<p>Next level: {hero.level + 1}</p>
\`\`\`

Two JSX differences from HTML:
- \`class\` is written **className**
- \`style\` takes an **object**: \`style={{ color: "darkred", fontSize: 20 }}\` (double braces: one for JavaScript, one for the object)`,
    task: 'Show `Hero: Ada` using `{hero.name}`, a `<p className="gold">` with `Gold: 120` using `{hero.gold}`, and `Next level: 4` using `{hero.level + 1}`. Make the h1 **darkred** with a style object.',
    sage: 'Anything that is an *expression* (gives a value) works in braces: variables, math, function calls, ternaries. Statements like `if` or `for` do not; you will see the JSX ways to do those soon. In real projects, prefer CSS classes to inline styles.',
    hints: ['`<h1 style={{ color: "darkred" }}>Hero: {hero.name}</h1>`', '`<p className="gold">Gold: {hero.gold}</p>` and `<p>Next level: {hero.level + 1}</p>`'],
    files: [jsx('App.jsx', 'const hero = { name: "Ada", gold: 120, level: 3 };\n\nexport default function App() {\n  return (\n    <div>\n      <h1>Hero: ???</h1>\n    </div>\n  );\n}\n'), css],
    solution: { 'App.jsx': 'const hero = { name: "Ada", gold: 120, level: 3 };\n\nexport default function App() {\n  return (\n    <div>\n      <h1 style={{ color: "darkred" }}>Hero: {hero.name}</h1>\n      <p className="gold">Gold: {hero.gold}</p>\n      <p>Next level: {hero.level + 1}</p>\n    </div>\n  );\n}\n' },
    checks: [
      { label: 'The h1 says "Hero: Ada" using {hero.name}', test: (c) => txt(c.$('h1')) === 'Hero: Ada' && /\{\s*hero\.name\s*\}/.test(src(c, 'App.jsx')) },
      { label: 'p.gold says "Gold: 120" using {hero.gold}', test: (c) => txt(c.$('p.gold')) === 'Gold: 120' && /\{\s*hero\.gold\s*\}/.test(src(c, 'App.jsx')) },
      { label: 'Shows "Next level: 4" with {hero.level + 1}', test: (c) => c.$$('p').some((p) => txt(p) === 'Next level: 4') && /hero\.level\s*\+\s*1/.test(src(c, 'App.jsx')) },
      { label: 'The h1 is darkred (style object)', test: (c) => sameColor(c, c.css('h1', 'color'), 'darkred') && /style=\{\{/.test(src(c, 'App.jsx')) },
    ],
  },
  {
    id: 'react-03', kingdom: 'react', kind: 'web', mode: 'react', region: 'First Summons', xp: 70,
    title: 'Props: Gifts for Components',
    concepts: ['props', 'reusable components', 'imports'],
    story: 'One summoning circle, many knights. Each knight arrives with their own gifts: a name and a level.',
    learn: `Components can receive **props** (properties), like HTML attributes:

\`\`\`
<Knight name="Ada" level={3} />
\`\`\`

The component gets them as an object. You can *destructure* it:

\`\`\`
export default function Knight({ name, level }) {
  return <div className="knight"><h2>{name}</h2></div>;
}
\`\`\`

Text props use quotes; numbers and other values use braces. To use a component from another file: \`import Knight from "./Knight.jsx";\``,
    task: 'Finish **Knight.jsx** so it shows the name in an `<h2>` and `Level X` in a `<p>`. In **App.jsx**, summon three knights: **Ada** (level 3), **Bo** (level 5) and **Cy** (level 1).',
    sage: 'Props flow one way: from parent to child. A child must never change its props; if data needs to change, it lives in *state* (next lessons). Splitting a UI into small components with clear props is the core skill of React development.',
    hints: ['Knight: `return <div className="knight"><h2>{name}</h2><p>Level {level}</p></div>;`', 'App: `<Knight name="Bo" level={5} />` and `<Knight name="Cy" level={1} />`'],
    files: [
      jsx('App.jsx', 'import Knight from "./Knight.jsx";\n\nexport default function App() {\n  return (\n    <div>\n      <h1>The Round Table</h1>\n      <Knight name="Ada" level={3} />\n    </div>\n  );\n}\n'),
      jsx('Knight.jsx', 'export default function Knight({ name, level }) {\n  return (\n    <div className="knight">\n      {/* show the name in an h2 and "Level X" in a p */}\n    </div>\n  );\n}\n'),
      css,
    ],
    solution: {
      'App.jsx': 'import Knight from "./Knight.jsx";\n\nexport default function App() {\n  return (\n    <div>\n      <h1>The Round Table</h1>\n      <Knight name="Ada" level={3} />\n      <Knight name="Bo" level={5} />\n      <Knight name="Cy" level={1} />\n    </div>\n  );\n}\n',
      'Knight.jsx': 'export default function Knight({ name, level }) {\n  return (\n    <div className="knight">\n      <h2>{name}</h2>\n      <p>Level {level}</p>\n    </div>\n  );\n}\n',
    },
    checks: [
      { label: 'Three .knight cards', test: (c) => c.$$('.knight').length === 3 },
      { label: 'Names in <h2>: Ada, Bo, Cy', test: (c) => c.$$('.knight h2').map(txt).join(',') === 'Ada,Bo,Cy' },
      { label: 'Levels: Level 3, Level 5, Level 1', test: (c) => c.$$('.knight p').map(txt).join(',') === 'Level 3,Level 5,Level 1' },
      { label: 'Knight uses its props (not hard-coded names)', test: (c) => /\{\s*name\s*\}/.test(src(c, 'Knight.jsx')) && /\{\s*level\s*\}/.test(src(c, 'Knight.jsx')) },
    ],
  },
  {
    id: 'react-04', kingdom: 'react', kind: 'web', mode: 'react', region: 'Lists and State', xp: 70,
    title: 'Lists of Quests',
    concepts: ['map', 'key', 'rendering lists'],
    story: 'The quest board has dozens of notices. Summon one `<li>` for each quest, automatically.',
    learn: `To show a list, \`map\` each item to JSX. Give each element a unique **key**:

\`\`\`
<ul>
  {quests.map((q) => (
    <li key={q.id}>{q.title}</li>
  ))}
</ul>
\`\`\`

The key helps React know which item is which when the list changes.`,
    task: 'Show an `<h2>` with the number of quests (`3 quests`, using `quests.length`) and a `<ul>` with one `<li>` per quest: **Slay the dragon - 500 gold**.',
    sage: 'Use a stable id as the key, not the array index: with index keys, React can mix up items when the list is sorted or filtered, leading to strange bugs (for example, text typed into the wrong input). Forgetting keys shows a warning in the console.',
    hints: ['`<h2>{quests.length} quests</h2>`', '`{quests.map((q) => <li key={q.id}>{q.title} - {q.reward} gold</li>)}`'],
    files: [jsx('App.jsx', 'const quests = [\n  { id: 1, title: "Slay the dragon", reward: 500 },\n  { id: 2, title: "Find the lost goat", reward: 5 },\n  { id: 3, title: "Deliver the royal letter", reward: 50 },\n];\n\nexport default function App() {\n  return (\n    <div>\n      <h1>Quest Board</h1>\n      {/* h2 with the count, then the list */}\n    </div>\n  );\n}\n'), css],
    solution: { 'App.jsx': 'const quests = [\n  { id: 1, title: "Slay the dragon", reward: 500 },\n  { id: 2, title: "Find the lost goat", reward: 5 },\n  { id: 3, title: "Deliver the royal letter", reward: 50 },\n];\n\nexport default function App() {\n  return (\n    <div>\n      <h1>Quest Board</h1>\n      <h2>{quests.length} quests</h2>\n      <ul>\n        {quests.map((q) => (\n          <li key={q.id}>{q.title} - {q.reward} gold</li>\n        ))}\n      </ul>\n    </div>\n  );\n}\n' },
    checks: [
      { label: 'The h2 says "3 quests" using quests.length', test: (c) => txt(c.$('h2')) === '3 quests' && /quests\.length/.test(src(c, 'App.jsx')) },
      { label: 'Three <li> items', test: (c) => c.$$('li').length === 3 },
      { label: 'Each shows "<title> - <reward> gold"', test: (c) => c.$$('li').map(txt).join('|') === 'Slay the dragon - 500 gold|Find the lost goat - 5 gold|Deliver the royal letter - 50 gold' },
      { label: 'Uses map with a key', test: (c) => /\.map\s*\(/.test(src(c, 'App.jsx')) && /key=\{/.test(src(c, 'App.jsx')) },
    ],
  },
  {
    id: 'react-05', kingdom: 'react', kind: 'web', mode: 'react', region: 'Lists and State', xp: 80,
    title: 'State: The Mana Well',
    concepts: ['useState', 'events', 'onClick'],
    story: 'A magic well stores mana. Draw from it, fill it... and the page must always show the truth.',
    learn: `**State** is data that can change. When it changes, React redraws the component:

\`\`\`
import { useState } from "react";

export default function App() {
  const [mana, setMana] = useState(0);   // value + setter
  return (
    <button onClick={() => setMana(mana + 1)}>
      Mana: {mana}
    </button>
  );
}
\`\`\`

Never change state directly (\`mana++\` does nothing on screen). Always call the **setter**.`,
    task: 'Keep `mana` in state (starting at 0). `#fill` adds 1, `#draw` removes 1 but **never below 0**. Show the value in `#mana`.',
    sage: '`useState` is a *hook*. Hooks must be called at the top level of the component, never inside `if` or loops. When the new value depends on the old one, the safest form is `setMana((m) => m + 1)`, because React may batch several updates together.',
    hints: ['`const [mana, setMana] = useState(0);` and `<span id="mana">{mana}</span>`', 'Draw: `onClick={() => setMana(Math.max(0, mana - 1))}`'],
    files: [jsx('App.jsx', 'import { useState } from "react";\n\nexport default function App() {\n  // your state here\n\n  return (\n    <div>\n      <h1>The Mana Well</h1>\n      <p>Mana: <span id="mana">0</span></p>\n      <button id="fill">Fill</button>\n      <button id="draw">Draw</button>\n    </div>\n  );\n}\n'), css],
    solution: { 'App.jsx': 'import { useState } from "react";\n\nexport default function App() {\n  const [mana, setMana] = useState(0);\n\n  return (\n    <div>\n      <h1>The Mana Well</h1>\n      <p>Mana: <span id="mana">{mana}</span></p>\n      <button id="fill" onClick={() => setMana(mana + 1)}>Fill</button>\n      <button id="draw" onClick={() => setMana(Math.max(0, mana - 1))}>Draw</button>\n    </div>\n  );\n}\n' },
    checks: [
      { label: 'Mana starts at 0', test: (c) => c.text('#mana') === '0' },
      { label: 'Fill twice shows 2', test: async (c) => { await c.click('#fill'); await c.click('#fill'); return c.text('#mana') === '2'; } },
      { label: 'Draw once shows 1', test: async (c) => { await c.click('#draw'); return c.text('#mana') === '1'; } },
      { label: 'Mana never goes below 0', test: async (c) => { await c.click('#draw'); await c.click('#draw'); return c.text('#mana') === '0'; } },
      { label: 'Uses useState', test: (c) => /useState\s*\(/.test(src(c, 'App.jsx')) },
    ],
  },
  {
    id: 'react-06', kingdom: 'react', kind: 'web', mode: 'react', region: 'Lists and State', xp: 80,
    title: 'Conditional Charms',
    concepts: ['conditional rendering', '&&', 'ternary'],
    story: 'Behind the dungeon door sleeps a dragon. Open the door... and the dragon appears.',
    learn: `Show things **conditionally** with JavaScript expressions:

\`\`\`
{isOpen ? "The door is open" : "The door is closed"}   // ternary: a or b
{isOpen && <img src="dragon.svg" alt="A dragon!" />}  // only when true
\`\`\`

Toggle a boolean state with \`setIsOpen(!isOpen)\`.`,
    task: 'Make `#toggle` open and close the door. `#status` shows **The door is open** / **The door is closed**. The button says **Close the door** / **Open the door**. When open, show the dragon image (`dragon.svg`, with alt text).',
    sage: 'Careful with `&&` and numbers: `{count && <p>...</p>}` shows a **0** on the page when count is 0. Use `{count > 0 && ...}` instead. For bigger branches, compute the JSX in a variable before the `return`.',
    hints: ['`const [isOpen, setIsOpen] = useState(false);`', '`{isOpen && <img src="dragon.svg" alt="A sleeping dragon" />}`'],
    files: [jsx('App.jsx', 'import { useState } from "react";\n\nexport default function App() {\n  return (\n    <div>\n      <h1>The Dungeon Door</h1>\n      <p id="status">The door is closed</p>\n      <button id="toggle">Open the door</button>\n    </div>\n  );\n}\n'), css],
    solution: { 'App.jsx': 'import { useState } from "react";\n\nexport default function App() {\n  const [isOpen, setIsOpen] = useState(false);\n\n  return (\n    <div>\n      <h1>The Dungeon Door</h1>\n      <p id="status">{isOpen ? "The door is open" : "The door is closed"}</p>\n      <button id="toggle" onClick={() => setIsOpen(!isOpen)}>\n        {isOpen ? "Close the door" : "Open the door"}\n      </button>\n      {isOpen && <img src="dragon.svg" alt="A sleeping dragon" />}\n    </div>\n  );\n}\n' },
    checks: [
      { label: 'Starts closed, with no dragon', test: (c) => c.text('#status') === 'The door is closed' && !c.$('img') },
      { label: 'Click: the door opens and the dragon appears', test: async (c) => { await c.click('#toggle'); const img = c.$('img'); return c.text('#status') === 'The door is open' && !!img && /dragon\.svg$/.test(img.getAttribute('src') ?? '') && !!img.getAttribute('alt'); } },
      { label: 'The button says "Close the door" when open', test: (c) => c.text('#toggle') === 'Close the door' },
      { label: 'Click again: closed, no dragon, "Open the door"', test: async (c) => { await c.click('#toggle'); return c.text('#status') === 'The door is closed' && !c.$('img') && c.text('#toggle') === 'Open the door'; } },
    ],
  },
  {
    id: 'react-07', kingdom: 'react', kind: 'web', mode: 'react', region: 'Forms and Effects', xp: 85,
    title: 'The Guest Book',
    concepts: ['controlled inputs', 'onChange', 'arrays in state'],
    story: 'The castle keeps a guest book. Visitors type their name, the page greets them, and they sign.',
    learn: `A **controlled input** keeps its value in state:

\`\`\`
const [name, setName] = useState("");
<input value={name} onChange={(e) => setName(e.target.value)} />
\`\`\`

To add to an array in state, create a **new** array:

\`\`\`
setGuests([...guests, name]);   // ... copies the old items
\`\`\``,
    task: '`#greeting` shows **Hail, <name>!** while typing in `#name`, or **Hail, stranger!** when empty. `#sign` adds the name to `#guests` (as an `<li>`) and clears the input.',
    sage: 'React state must be treated as *immutable*: `guests.push(name)` changes the old array, so React may not notice. Spread (`[...guests, name]`), `map`, and `filter` always create new arrays. This is the same immutability idea from "The Hero\'s Sheet".',
    hints: ['Greeting: ``{name ? `Hail, ${name}!` : "Hail, stranger!"}``', 'Sign: `onClick={() => { setGuests([...guests, name]); setName(""); }}`'],
    files: [jsx('App.jsx', 'import { useState } from "react";\n\nexport default function App() {\n  return (\n    <div>\n      <h1>The Guest Book</h1>\n      <input id="name" placeholder="Your name" />\n      <button id="sign">Sign</button>\n      <p id="greeting">Hail, stranger!</p>\n      <ul id="guests"></ul>\n    </div>\n  );\n}\n'), css],
    solution: { 'App.jsx': 'import { useState } from "react";\n\nexport default function App() {\n  const [name, setName] = useState("");\n  const [guests, setGuests] = useState([]);\n\n  function sign() {\n    if (!name) return;\n    setGuests([...guests, name]);\n    setName("");\n  }\n\n  return (\n    <div>\n      <h1>The Guest Book</h1>\n      <input id="name" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} />\n      <button id="sign" onClick={sign}>Sign</button>\n      <p id="greeting">{name ? `Hail, ${name}!` : "Hail, stranger!"}</p>\n      <ul id="guests">\n        {guests.map((g, i) => <li key={i}>{g}</li>)}\n      </ul>\n    </div>\n  );\n}\n' },
    checks: [
      { label: 'Empty input: "Hail, stranger!"', test: (c) => c.text('#greeting') === 'Hail, stranger!' },
      { label: 'Typing "Ada" shows "Hail, Ada!"', test: async (c) => { await c.type('#name', 'Ada'); return c.text('#greeting') === 'Hail, Ada!'; } },
      { label: 'Signing adds Ada to the guest list', test: async (c) => { await c.click('#sign'); return c.$$('#guests li').map(txt).join(',') === 'Ada'; } },
      { label: 'The input is cleared after signing', test: (c) => (c.$('#name') as HTMLInputElement).value === '' && c.text('#greeting') === 'Hail, stranger!' },
      { label: 'A second guest is added too', test: async (c) => { await c.type('#name', 'Bo'); await c.click('#sign'); return c.$$('#guests li').map(txt).join(',') === 'Ada,Bo'; } },
    ],
  },
  {
    id: 'react-08', kingdom: 'react', kind: 'web', mode: 'react', region: 'Forms and Effects', xp: 85,
    title: 'Effects Beyond the Circle',
    concepts: ['useEffect', 'side effects', 'dependencies'],
    story: 'The royal treasurer wants the browser tab itself to show the gold count, so he can see it from any window.',
    learn: `Rendering should only *describe* the UI. Things that reach **outside** React (the tab title, timers, fetching data) are **side effects**. Put them in \`useEffect\`:

\`\`\`
import { useEffect, useState } from "react";

useEffect(() => {
  document.title = \`Gold: \${gold}\`;
}, [gold]);   // run again whenever gold changes
\`\`\`

The array at the end lists the **dependencies**.`,
    task: 'Keep `gold` in state (starting at 0). `#earn` adds **10**. Use `useEffect` to set `document.title` to **Gold: <amount>** whenever gold changes.',
    sage: 'An effect can return a *cleanup* function, for example to clear a timer: `return () => clearInterval(id)`. An empty dependency array `[]` runs the effect once, after the first render. Data fetching in real apps is usually done with libraries (TanStack Query) or framework features (Next.js) rather than raw effects.',
    hints: ['`const [gold, setGold] = useState(0);`', '`useEffect(() => { document.title = `Gold: ${gold}`; }, [gold]);`'],
    files: [jsx('App.jsx', 'import { useEffect, useState } from "react";\n\nexport default function App() {\n  return (\n    <div>\n      <h1>The Treasury</h1>\n      <button id="earn">Collect taxes (+10)</button>\n    </div>\n  );\n}\n'), css],
    solution: { 'App.jsx': 'import { useEffect, useState } from "react";\n\nexport default function App() {\n  const [gold, setGold] = useState(0);\n\n  useEffect(() => {\n    document.title = `Gold: ${gold}`;\n  }, [gold]);\n\n  return (\n    <div>\n      <h1>The Treasury</h1>\n      <p>Gold: {gold}</p>\n      <button id="earn" onClick={() => setGold(gold + 10)}>Collect taxes (+10)</button>\n    </div>\n  );\n}\n' },
    checks: [
      { label: 'The tab title starts as "Gold: 0"', test: async (c) => { await c.wait(50); return c.doc.title === 'Gold: 0'; } },
      { label: 'After one click: "Gold: 10"', test: async (c) => { await c.click('#earn'); return c.doc.title === 'Gold: 10'; } },
      { label: 'After two more: "Gold: 30"', test: async (c) => { await c.click('#earn'); await c.click('#earn'); return c.doc.title === 'Gold: 30'; } },
      { label: 'Uses useEffect with [gold]', test: (c) => /useEffect\s*\(/.test(src(c, 'App.jsx')) && /\[\s*gold\s*\]/.test(src(c, 'App.jsx')) },
    ],
  },
  {
    id: 'react-09', kingdom: 'react', kind: 'web', mode: 'react', region: 'The Quest Log', xp: 150, boss: true,
    title: 'The Quest Log',
    concepts: ['everything so far', 'lifting state up', 'callback props'],
    story: 'The Grand Summoner asks for one last spell: a quest log where heroes add quests, tick them off, and always see how many remain.',
    learn: `Boss challenge! One new idea: **lifting state up**. The list lives in \`App\`, and the child gets a **function as a prop** to report clicks:

\`\`\`
// App.jsx
<QuestItem quest={q} onToggle={() => toggle(q.id)} />

// QuestItem.jsx
<input type="checkbox" checked={quest.done} onChange={onToggle} />
\`\`\`

Toggle one item immutably: \`quests.map((q) => q.id === id ? { ...q, done: !q.done } : q)\``,
    task: `Build the quest log:
- \`#quest\` input + \`#add\` button add a quest (not done); the input clears
- each quest is rendered by **QuestItem.jsx** as an \`<li class="quest">\` with a checkbox
- ticking the checkbox marks it done: the \`<li>\` gets the class **done**
- \`#remaining\` shows **Quests left: N** (quests not done yet)`,
    sage: 'This is the classic "todo app", the hello-world of front-end frameworks, and it covers the heart of React: components, props, state, events, lists and immutability. You will build the same thing in Vue and Svelte, which is a great way to compare frameworks.',
    hints: ['State: `const [quests, setQuests] = useState([]);` Add: `setQuests([...quests, { id: Date.now(), title: text, done: false }])`', 'In QuestItem: `<li className={quest.done ? "quest done" : "quest"}>`. Remaining: `quests.filter((q) => !q.done).length`'],
    files: [
      jsx('App.jsx', 'import { useState } from "react";\nimport QuestItem from "./QuestItem.jsx";\n\nexport default function App() {\n  return (\n    <div>\n      <h1>Quest Log</h1>\n      <input id="quest" placeholder="New quest" />\n      <button id="add">Add</button>\n      <p id="remaining">Quests left: 0</p>\n      <ul></ul>\n    </div>\n  );\n}\n'),
      jsx('QuestItem.jsx', 'export default function QuestItem({ quest, onToggle }) {\n  return <li className="quest">{quest.title}</li>;\n}\n'),
      css,
    ],
    solution: {
      'App.jsx': 'import { useState } from "react";\nimport QuestItem from "./QuestItem.jsx";\n\nexport default function App() {\n  const [quests, setQuests] = useState([]);\n  const [text, setText] = useState("");\n\n  function add() {\n    if (!text.trim()) return;\n    setQuests([...quests, { id: Date.now() + Math.random(), title: text, done: false }]);\n    setText("");\n  }\n\n  function toggle(id) {\n    setQuests(quests.map((q) => (q.id === id ? { ...q, done: !q.done } : q)));\n  }\n\n  const left = quests.filter((q) => !q.done).length;\n\n  return (\n    <div>\n      <h1>Quest Log</h1>\n      <input id="quest" placeholder="New quest" value={text} onChange={(e) => setText(e.target.value)} />\n      <button id="add" onClick={add}>Add</button>\n      <p id="remaining">Quests left: {left}</p>\n      <ul>\n        {quests.map((q) => (\n          <QuestItem key={q.id} quest={q} onToggle={() => toggle(q.id)} />\n        ))}\n      </ul>\n    </div>\n  );\n}\n',
      'QuestItem.jsx': 'export default function QuestItem({ quest, onToggle }) {\n  return (\n    <li className={quest.done ? "quest done" : "quest"}>\n      <input type="checkbox" checked={quest.done} onChange={onToggle} /> {quest.title}\n    </li>\n  );\n}\n',
    },
    checks: [
      { label: 'Adding "Slay the dragon" creates a .quest item', test: async (c) => { await c.type('#quest', 'Slay the dragon'); await c.click('#add'); return c.$$('li.quest').length === 1 && txt(c.$('li.quest')).includes('Slay the dragon'); } },
      { label: 'The input clears after adding', test: (c) => (c.$('#quest') as HTMLInputElement).value === '' },
      { label: 'Two quests: "Quests left: 2"', test: async (c) => { await c.type('#quest', 'Find the goat'); await c.click('#add'); return c.$$('li.quest').length === 2 && c.text('#remaining') === 'Quests left: 2'; } },
      { label: 'Ticking the first marks it .done', test: async (c) => { await c.click('li.quest input[type="checkbox"]'); return c.$$('li.quest')[0]?.classList.contains('done') === true && !c.$$('li.quest')[1]?.classList.contains('done'); } },
      { label: 'Then: "Quests left: 1"', test: (c) => c.text('#remaining') === 'Quests left: 1' },
      { label: 'Items are rendered by the QuestItem component', test: (c) => uses(c.files['App.jsx'], /<QuestItem\b/) && uses(c.files['QuestItem.jsx'], /checkbox/) },
    ],
  },
  {
    id: 'react-10', kingdom: 'react', kind: 'web', mode: 'react', region: 'Data', xp: 95,
    title: 'The Royal Roster',
    concepts: ['fetching in useEffect', 'loading state', 'error state'],
    story: 'The roster of knights lives on the server. Load it when the page opens, and tell people it is loading.',
    learn: `Fetch data in an effect that runs once (\`[]\`), and keep three pieces of state: the data, loading, and error.

\`\`\`
const [knights, setKnights] = useState([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  fetch("api/knights.json")
    .then((res) => res.json())
    .then((data) => { setKnights(data); setLoading(false); });
}, []);
\`\`\`

Here the data file is at \`api/knights.json\`.`,
    task: 'Load `api/knights.json` when the component first renders. Show `<p id="loading">Loading...</p>` while loading, then a `<ul>` with one `<li>` per knight: **Ada (Lovelace)**.',
    sage: 'In real React apps, data fetching libraries like **TanStack Query** (or framework features like Next.js server components) handle caching, retries and loading states for you. Knowing the manual way helps you understand what they do.',
    hints: ['Use `useEffect(() => { ... }, [])` so it runs once.', 'Render: `{loading ? <p id="loading">Loading...</p> : <ul>{knights.map((k) => <li key={k.id}>{k.name} ({k.house})</li>)}</ul>}`'],
    files: [jsx('App.jsx', 'import { useEffect, useState } from "react";\n\nexport default function App() {\n  return (\n    <div>\n      <h1>The Royal Roster</h1>\n    </div>\n  );\n}\n'), css],
    solution: { 'App.jsx': 'import { useEffect, useState } from "react";\n\nexport default function App() {\n  const [knights, setKnights] = useState([]);\n  const [loading, setLoading] = useState(true);\n\n  useEffect(() => {\n    fetch("api/knights.json")\n      .then((res) => res.json())\n      .then((data) => {\n        setKnights(data);\n        setLoading(false);\n      });\n  }, []);\n\n  return (\n    <div>\n      <h1>The Royal Roster</h1>\n      {loading ? (\n        <p id="loading">Loading...</p>\n      ) : (\n        <ul>\n          {knights.map((k) => (\n            <li key={k.id}>{k.name} ({k.house})</li>\n          ))}\n        </ul>\n      )}\n    </div>\n  );\n}\n' },
    checks: [
      { label: 'Shows the three knights from api/knights.json', test: async (c) => { for (let i = 0; i < 20 && c.$$('li').length < 3; i++) await c.wait(50); return c.$$('li').map(txt).join('|') === 'Ada (Lovelace)|Bors (Ironhill)|Cyra (Lovelace)'; } },
      { label: 'The loading message is gone after loading', test: (c) => !c.$('#loading') },
      { label: 'Fetches inside useEffect with [] and has a loading state', test: (c) => /useEffect\s*\(/.test(src(c, 'App.jsx')) && /\[\s*\]\s*\)/.test(src(c, 'App.jsx')) && /fetch\(/.test(src(c, 'App.jsx')) && /Loading/.test(src(c, 'App.jsx')) },
    ],
  },
];

