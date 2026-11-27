// Section: React.
import type { Course } from '../types';
import { teach, mc, mcc, tf, fill, match, order, bug, lesson, unit, challenge } from '../dsl';

export const react: Course = {
  id: 'react', title: 'React', realm: "The Summoners' Circle", color: '#1f9fd0', emblem: 'rune',
  desc: 'Build interfaces from components: JSX, props, state, events, forms, effects, data fetching and the React ecosystem.',
  units: [
    unit('react-u1', 'Components and JSX', 'Functions that return UI.', `
**Key ideas**
- A **component** is a function that returns JSX. Names start with a capital letter: \`function QuestCard()\`.
- JSX rules: one parent element (or \`<>...</>\`), \`className\` instead of \`class\`, close every tag (\`<img />\`), \`{ }\` for JavaScript expressions, camelCase events (\`onClick\`).
- React re-renders components when their data changes and updates only what changed in the DOM.`, [
      lesson('react-1-1', 'What is React?', [
        teach('Summoning interfaces', '**React** is a JavaScript library for building user interfaces out of **components**:\n\n```\nfunction Greeting() {\n  return <h1>Hail, Realm!</h1>;\n}\n```\nYou describe **what** the UI should look like for the current data. React figures out **how** to update the page.', undefined, 'jsx'),
        mc('What is a React component?', ['A function that returns UI (JSX)', 'A CSS file', 'A database table', 'An HTML attribute'], 0),
        mc('Which component name is valid?', ['QuestCard', 'questCard', 'quest-card', 'quest_card'], 0, 'Components must start with a capital letter, or React treats them like HTML tags.'),
        tf('React updates only the parts of the page that changed.', true),
        match('Match the word', [['Component', 'Reusable piece of UI'], ['JSX', 'HTML-like syntax in JS'], ['Render', 'Turning components into UI'], ['Props', 'Inputs of a component']]),
      ]),
      lesson('react-1-2', 'JSX rules', [
        teach('HTML with superpowers', '```\nexport default function Card() {\n  const name = "Ada";\n  return (\n    <div className="card">\n      <img src="ada.png" alt="Ada" />\n      <h2>{name.toUpperCase()}</h2>\n      <button onClick={() => alert("Hi")}>Greet</button>\n    </div>\n  );\n}\n```\n- `className`, not `class`\n- close every tag: `<img />`\n- `{ }` for JavaScript\n- one parent element'),
        bug('Which line is wrong in JSX?', 'function Card() {\n  return (\n    <div class="card">\n      <h2>Ada</h2>\n    </div>\n  );\n}', 3, 'In JSX use `className` (class is a reserved word in JavaScript).', 'jsx'),
        bug('Which line breaks the JSX?', 'function Banner() {\n  return (\n    <h1>Welcome</h1>\n    <p>to the castle</p>\n  );\n}', 3, 'A component must return one parent element. Wrap both in `<>...</>` or a `<div>`.', 'jsx'),
        fill('Show the gold amount', '<p>Gold: ___hero.gold___</p>', ['{', '}'], ['(', ')', '[', ']'], undefined, 'jsx'),
        mc('Which is correct JSX for an image?', ['<img src="a.png" alt="A" />', '<img src="a.png" alt="A">', '<img src="a.png" alt="A"></image>', '<image src="a.png" />'], 0, undefined, { codeOptions: true }),
        mc('How do you write an inline style in JSX?', ['style={{ color: "red" }}', 'style="color: red"', 'style={color: red}', 'css="color: red"'], 0, undefined, { codeOptions: true }),
      ]),
      challenge('react-01', 'Challenge: Summon Your First Component'),
      challenge('react-02', 'Challenge: JSX Spells'),
    ]),
    unit('react-u2', 'Props and Lists', 'Pass data into components and render lists.', `
**Key ideas**
- Props pass data from parent to child: \`<Knight name="Ada" level={3} />\`; read them with \`function Knight({ name, level })\`.
- Props are **read-only**. \`children\` is the content between the tags.
- Lists: \`items.map((item) => <li key={item.id}>{item.title}</li>)\`. Keys must be unique and stable (not the index when the list can change).`, [
      lesson('react-2-1', 'Props', [
        teach('Gifts for components', '```\nfunction Knight({ name, level }) {\n  return <p>{name} (level {level})</p>;\n}\n\n<Knight name="Ada" level={3} />\n<Knight name="Bo" level={5} />\n```\nText props use quotes; numbers, booleans, arrays and objects use `{ }`.'),
        mc('How do you pass the number 3 as a prop?', ['level={3}', 'level="3"', 'level=3', 'level:{3}'], 0, '`"3"` would be the string "3".', { codeOptions: true }),
        tf('A component may change its own props.', false, 'Props are read-only. Data that changes lives in state.'),
        mcc('What does this render?', 'function Badge({ children }) {\n  return <span className="badge">{children}</span>;\n}\n\n<Badge>Archmage</Badge>', ['<span class="badge">Archmage</span>', 'An empty span', 'Archmage without a span', 'An error'], 0, '`children` is whatever you put between the opening and closing tags.', 'jsx'),
        fill('Read the props with destructuring', 'function Potion(___ name, price ___) {\n  return <li>{name}: {price} gold</li>;\n}', ['{', '}'], ['(', ')', '[', ']'], undefined, 'jsx'),
      ]),
      lesson('react-2-2', 'Lists and keys', [
        teach('Many items', '```\n<ul>\n  {quests.map((q) => (\n    <li key={q.id}>{q.title}</li>\n  ))}\n</ul>\n```\nThe `key` helps React track items between renders.'),
        mc('Which key is best?', ['A stable id from the data: key={q.id}', 'The index: key={i}', 'Math.random()', 'No key'], 0),
        bug('Which line will show a warning in the console?', 'function List({ items }) {\n  return (\n    <ul>\n      {items.map((i) => <li>{i.name}</li>)}\n    </ul>\n  );\n}', 4, 'Each list item needs a unique `key` prop.', 'jsx'),
        order('Render a list of names', ['<ul>', '  {names.map((n) => (', '    <li key={n}>{n}</li>', '  ))}', '</ul>'], undefined, 'jsx'),
        mc('How do you show only quests that are not done?', ['quests.filter((q) => !q.done).map(...)', 'quests.map(...).done', 'quests.find(...)', 'quests.sort(...)'], 0, undefined, { codeOptions: true }),
      ]),
      challenge('react-03', 'Challenge: Props, Gifts for Components'),
      challenge('react-04', 'Challenge: Lists of Quests'),
    ]),
    unit('react-u3', 'State and Events', 'Make components interactive.', `
**Key ideas**
- \`const [count, setCount] = useState(0);\` Calling the setter re-renders the component.
- Never change state directly. Use the setter; for updates based on the old value: \`setCount((c) => c + 1)\`.
- Events: \`onClick={() => ...}\`, \`onChange\`, \`onSubmit\` (call \`e.preventDefault()\`).
- Conditional rendering: \`{isOpen && <Dragon />}\`, \`{isOpen ? "Open" : "Closed"}\`.
- Hooks only at the top level of a component (not in ifs or loops).`, [
      lesson('react-3-1', 'useState', [
        teach('Memory for components', '```\nimport { useState } from "react";\n\nfunction ManaWell() {\n  const [mana, setMana] = useState(0);\n  return <button onClick={() => setMana(mana + 1)}>Mana: {mana}</button>;\n}\n```\n`useState` returns the current value and a **setter**. Calling the setter re-renders the component with the new value.'),
        mc('What happens when you call `setMana(5)`?', ['React re-renders the component with mana = 5', 'Nothing on screen changes', 'The page reloads', 'mana becomes a string'], 0),
        bug('Which line does not update the screen?', 'function Counter() {\n  let [count, setCount] = useState(0);\n  return <button onClick={() => count++}>{count}</button>;\n}', 3, 'Changing the variable directly does not tell React. Call `setCount(count + 1)`.', 'jsx'),
        fill('Create state for a name, starting empty', 'const [name, ___] = ___("");', ['setName', 'useState'], ['name', 'useEffect', 'state'], undefined, 'jsx'),
        mc('Why write `setCount((c) => c + 1)`?', ['It always uses the latest value, even with several quick updates', 'It is required syntax', 'It is faster to type', 'It skips re-rendering'], 0),
        tf('Hooks like useState can be called inside an if statement.', false, 'Hooks must be called at the top level of the component, in the same order on every render.'),
      ]),
      lesson('react-3-2', 'Events and conditions', [
        teach('Click, show, hide', '```\nconst [isOpen, setIsOpen] = useState(false);\n\n<button onClick={() => setIsOpen(!isOpen)}>\n  {isOpen ? "Close" : "Open"}\n</button>\n{isOpen && <img src="dragon.png" alt="A dragon" />}\n```'),
        mc('Which shows the dragon only when `isOpen` is true?', ['{isOpen && <Dragon />}', '{isOpen || <Dragon />}', '<Dragon if={isOpen} />', '{if (isOpen) <Dragon />}'], 0, undefined, { codeOptions: true }),
        bug('Which line shows a stray "0" on the page when the list is empty?', 'function Inbox({ messages }) {\n  return (\n    <div>\n      {messages.length && <p>You have mail!</p>}\n    </div>\n  );\n}', 4, '`0 && ...` evaluates to `0`, which React renders. Use `messages.length > 0 && ...`.', 'jsx'),
        bug('Which line calls the function too early?', 'function Bell() {\n  const ring = () => alert("Ding!");\n  return <button onClick={ring()}>Ring</button>;\n}', 3, '`ring()` runs during render. Pass the function: `onClick={ring}`.', 'jsx'),
        match('Match the event prop', [['onClick', 'Button pressed'], ['onChange', 'Input value changed'], ['onSubmit', 'Form sent'], ['onKeyDown', 'Key pressed']]),
      ]),
      challenge('react-05', 'Challenge: State, The Mana Well'),
      challenge('react-06', 'Challenge: Conditional Charms'),
    ]),
    unit('react-u4', 'Forms and Effects', 'Controlled inputs, immutable updates and useEffect.', `
**Key ideas**
- Controlled input: \`<input value={name} onChange={(e) => setName(e.target.value)} />\`.
- Update arrays and objects immutably: \`[...list, item]\`, \`list.filter(...)\`, \`list.map(...)\`, \`{ ...obj, key: value }\`.
- \`useEffect(() => { ... }, [deps])\` runs after render when deps change; \`[]\` = once. Return a cleanup function for timers and subscriptions.
- Effects are for syncing with things outside React (title, timers, network), not for computing values.`, [
      lesson('react-4-1', 'Controlled inputs and immutability', [
        teach('React owns the value', '```\nconst [name, setName] = useState("");\n<input value={name} onChange={(e) => setName(e.target.value)} />\n```\nTo change arrays in state, create **new** arrays:\n\n```\nsetGuests([...guests, name]);                 // add\nsetGuests(guests.filter((g) => g !== name));  // remove\nsetQuests(quests.map((q) => q.id === id ? { ...q, done: true } : q)); // update\n```'),
        bug('Which line fails to re-render?', 'function Guests() {\n  const [list, setList] = useState([]);\n  const add = (n) => { list.push(n); setList(list); };\n  return <p>{list.length}</p>;\n}', 3, '`push` changes the same array, so React sees no new value. Use `setList([...list, n])`.', 'jsx'),
        mc('How do you remove the quest with id 3?', ['setQuests(quests.filter((q) => q.id !== 3))', 'quests.splice(3, 1)', 'delete quests[3]', 'setQuests(quests.pop())'], 0, undefined, { codeOptions: true }),
        fill('Read what was typed', '<input value={text} onChange={(e) => setText(e.___.___)} />', ['target', 'value'], ['input', 'text', 'data'], undefined, 'jsx'),
        tf('`{ ...hero, level: 4 }` creates a new object and keeps the old one unchanged.', true),
      ]),
      lesson('react-4-2', 'useEffect', [
        teach('Side effects', '```\nuseEffect(() => {\n  document.title = `Gold: ${gold}`;\n}, [gold]);       // runs after renders where gold changed\n\nuseEffect(() => {\n  const id = setInterval(tick, 1000);\n  return () => clearInterval(id);   // cleanup\n}, []);            // [] = run once after the first render\n```'),
        match('Match the dependency array', [['[]', 'Run once after the first render'], ['[gold]', 'Run when gold changes'], ['no array', 'Run after every render']]),
        mc('Why return a function from an effect?', ['To clean up (clear timers, unsubscribe) when it re-runs or the component goes away', 'To return JSX', 'To stop the re-render', 'It is required'], 0),
        bug('Which line causes an endless loop of renders?', 'function Counter() {\n  const [n, setN] = useState(0);\n  useEffect(() => {\n    setN(n + 1);\n  });\n  return <p>{n}</p>;\n}', 4, 'With no dependency array the effect runs after every render, and setting state causes another render: forever.', 'jsx'),
        tf('You should use useEffect to calculate values you can compute during render.', false, 'Just compute them in the component body: `const total = items.length;`'),
      ]),
      challenge('react-07', 'Challenge: The Guest Book'),
      challenge('react-08', 'Challenge: Effects Beyond the Circle'),
    ]),
    unit('react-u5', 'Data and Architecture', 'Fetch data, share state, custom hooks.', `
**Key ideas**
- Fetch in an effect with \`[]\`; keep \`data\`, \`loading\` and \`error\` state.
- **Lift state up** to the closest common parent; pass values down and callbacks (\`onToggle\`) down.
- **Context** (\`createContext\`/\`useContext\`) shares values (theme, user) without passing props through every level.
- **Custom hooks** (\`useKnights()\`) reuse stateful logic. Names start with \`use\`.`, [
      lesson('react-5-1', 'Fetching data', [
        teach('Loading from the server', '```\nconst [knights, setKnights] = useState([]);\nconst [loading, setLoading] = useState(true);\nconst [error, setError] = useState(null);\n\nuseEffect(() => {\n  fetch("/api/knights")\n    .then((res) => res.json())\n    .then(setKnights)\n    .catch(setError)\n    .finally(() => setLoading(false));\n}, []);\n```'),
        mc('Why the `[]` dependency array here?', ['So the data is fetched once, not after every render', 'To make fetch faster', 'Because fetch needs an array', 'To cache forever'], 0),
        mc('Which states should a data-loading component handle?', ['loading, error and the data (plus empty)', 'Only the data', 'Only errors', 'None, React handles it'], 0),
        tf('Libraries like TanStack Query handle caching and loading states for you.', true),
      ]),
      challenge('react-10', 'Challenge: The Royal Roster'),
      lesson('react-5-2', 'Sharing state', [
        teach('Lifting state up', 'When two components need the same data, move the state to their **closest common parent**, then pass it down:\n\n```\nfunction App() {\n  const [quests, setQuests] = useState([]);\n  return (\n    <>\n      <QuestForm onAdd={(q) => setQuests([...quests, q])} />\n      <QuestList quests={quests} />\n    </>\n  );\n}\n```\nFor app-wide values (theme, logged-in user), use **Context**.'),
        mc('A form and a list both need the quests. Where should the state live?', ['In their common parent', 'In the form only', 'In a global variable', 'In both, copied'], 0),
        mc('How does a child tell its parent something happened?', ['By calling a function prop like onAdd', 'By changing its props', 'By editing the parent\'s state directly', 'It cannot'], 0),
        match('Match the tool', [['Props', 'Pass data down'], ['Callback prop', 'Send events up'], ['Context', 'Share app-wide values'], ['useState', 'Local component memory']]),
      ]),
      lesson('react-5-3', 'Custom hooks', [
        teach('Reusable logic', 'Extract stateful logic into a function whose name starts with `use`:\n\n```\nfunction useToggle(initial = false) {\n  const [on, setOn] = useState(initial);\n  const toggle = () => setOn((v) => !v);\n  return [on, toggle];\n}\n\nconst [isOpen, toggleOpen] = useToggle();\n```'),
        mc('What must a custom hook\'s name start with?', ['use', 'hook', 'get', 'React'], 0),
        tf('Each component that uses a custom hook gets its own separate state.', true),
      ]),
      challenge('react-09', 'Project: The Quest Log'),
    ]),
    unit('react-u6', 'The React Ecosystem', 'Routing, frameworks, tools and common bugs.', `
**Key ideas**
- **React Router** maps URLs to components in single-page apps (SPAs).
- **Next.js** (and Remix/React Router framework mode) add routing, server rendering and data loading.
- **Vite** is the usual tool for plain React apps. State libraries: Zustand, Redux Toolkit. Data: TanStack Query. Forms: React Hook Form. Tests: Vitest + Testing Library.
- Performance: avoid unnecessary state, use keys correctly, \`memo\`/\`useMemo\` only when measured.`, [
      lesson('react-6-1', 'Routing', [
        teach('Many pages, one app', 'A **single-page app** (SPA) changes the view without reloading the page. **React Router** maps URLs to components:\n\n```\n<Routes>\n  <Route path="/" element={<Home />} />\n  <Route path="/quests/:id" element={<Quest />} />\n</Routes>\n```\nUse `<Link to="/quests/2">` instead of `<a>` for internal links.'),
        mc('What is a single-page app (SPA)?', ['An app that updates the view without full page reloads', 'A website with only one page of content', 'An app without JavaScript', 'A mobile-only app'], 0),
        mc('In `/quests/:id`, what is `:id`?', ['A URL parameter', 'A CSS selector', 'A query string', 'A comment'], 0),
        tf('In React Router you use <Link> for internal navigation.', true),
      ]),
      lesson('react-6-2', 'Frameworks and tools', [
        teach('The wider world', '- **Next.js**: React framework with file-based routing, server rendering and API routes (very popular in job posts)\n- **Vite**: fast dev server and build for React apps\n- **TanStack Query**: fetching and caching server data\n- **Zustand / Redux Toolkit**: shared app state\n- **React Hook Form + zod**: forms and validation\n- **Vitest + Testing Library**: tests'),
        match('Match the tool with its job', [['Next.js', 'Full React framework'], ['TanStack Query', 'Server data and caching'], ['Zustand', 'Shared client state'], ['Testing Library', 'Testing components']]),
        mc('Which is most often asked for in React job posts alongside React itself?', ['TypeScript and Next.js', 'jQuery and Flash', 'COBOL', 'Photoshop'], 0),
        tf('You need to learn every library before applying for junior jobs.', false, 'Solid fundamentals (JS, React, Git, APIs) matter most. Libraries are learned on the job.'),
      ]),
      lesson('react-6-3', 'Common React bugs', [
        teach('Code review time', 'These bugs appear in real code reviews all the time. Find them!'),
        bug('Find the bug', 'function Timer() {\n  const [s, setS] = useState(0);\n  useEffect(() => {\n    const id = setInterval(() => setS((x) => x + 1), 1000);\n  }, []);\n  return <p>{s}</p>;\n}', 4, 'The interval is never cleared. Return `() => clearInterval(id)` from the effect.', 'jsx'),
        bug('Find the bug', 'function Todo({ todos }) {\n  return todos.map((t, i) => (\n    <Item key={Math.random()} todo={t} />\n  ));\n}', 3, 'A random key changes every render, so React recreates every item. Use a stable id.', 'jsx'),
        bug('Find the bug', 'function Profile({ user }) {\n  const [name, setName] = useState(user.name);\n  if (!user) return null;\n  return <p>{name}</p>;\n}', 2, '`user.name` is read before checking `user`, so it crashes when user is missing. Check first (or use `user?.name`).', 'jsx'),
        mc('When should you reach for `useMemo` or `memo`?', ['When you have measured a real performance problem', 'On every component by default', 'Never', 'Only for CSS'], 0),
      ]),
    ]),
  ],
};
