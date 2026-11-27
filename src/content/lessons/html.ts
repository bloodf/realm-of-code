// The Builders' Guild: HTML from zero.
import type { WebLesson } from '../types';
import { src, txt, lower } from '../helpers';

const page = (body: string, title = 'My Castle') =>
  `<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="utf-8">\n  <title>${title}</title>\n  <link rel="stylesheet" href="style.css">\n</head>\n<body>\n${body}\n</body>\n</html>\n`;

const BASE_CSS = `/* Styles are taught in the Heraldry Hall. This just makes things pretty. */
body { font-family: Georgia, serif; background: #fbf3dd; color: #2b1d12; padding: 8px 16px; }
h1, h2, h3 { color: #7d1f1a; }
`;

const css = { name: 'style.css', lang: 'css' as const, code: BASE_CSS, readonly: true };

export const htmlLessons: WebLesson[] = [
  {
    id: 'html-01', kingdom: 'html', kind: 'web', mode: 'html', region: 'First Stones', xp: 40,
    title: 'The First Stone',
    concepts: ['tags', 'h1'],
    story: 'Master Mason Hilda hands you a chisel. "Every castle starts with one stone. Every web page starts with one tag."',
    learn: `Web pages are written in **HTML**. HTML uses *tags* in angle brackets. Most tags come in pairs: an **opening tag** and a **closing tag** with a slash.

\`\`\`
<h1>Castle Blackstone</h1>
\`\`\`

\`<h1>\` means "heading, level 1": the biggest, most important title on the page.`,
    task: 'Inside `<body>`, add an `<h1>` heading with the name of your castle (any name you like).',
    sage: `Browsers read HTML and build the **DOM** (Document Object Model), a tree of elements. Search engines and screen readers use headings to understand a page, so each page should have exactly one \`<h1>\`. Tags are not case-sensitive, but lowercase is the convention everywhere.`,
    hints: ['Write the opening tag `<h1>`, then your text, then the closing tag `</h1>`.', 'Example: `<h1>Castle Blackstone</h1>`. Put it on the empty line inside `<body>`.'],
    files: [{ name: 'index.html', lang: 'html', code: page('  <!-- Write your h1 heading on the next line -->\n\n') }, css],
    solution: { 'index.html': page('  <h1>Castle Blackstone</h1>') },
    checks: [
      { label: 'The page has an <h1> heading', test: (c) => !!c.$('h1'), fail: 'No <h1> found. Check that you wrote <h1> and </h1>.' },
      { label: 'The heading has a name inside it', test: (c) => txt(c.$('h1')).length >= 2 },
      { label: 'The tag is closed with </h1>', test: (c) => /<\/h1>/i.test(src(c, 'index.html')), fail: 'A closing tag needs a slash: </h1>' },
    ],
  },
  {
    id: 'html-02', kingdom: 'html', kind: 'web', mode: 'html', region: 'First Stones', xp: 45,
    title: 'Words on Parchment',
    concepts: ['p', 'h2', 'headings'],
    story: 'The castle needs a sign by the gate that tells travellers about it.',
    learn: `Headings go from \`<h1>\` (biggest) to \`<h6>\` (smallest). Use \`<h2>\` for sections under your \`<h1>\`.

Text goes in **paragraphs** with \`<p>\`:

\`\`\`
<h2>About the castle</h2>
<p>Built by dwarves in the year 812.</p>
<p>Famous for its pies.</p>
\`\`\``,
    task: 'Below the `<h1>`, add an `<h2>` section heading and **at least two** paragraphs (`<p>`) about your castle.',
    sage: 'Do not pick heading levels by size: pick them by meaning (an outline). CSS changes how big they look. Skipping levels (h1 straight to h4) confuses screen-reader users, who often jump through a page by headings.',
    hints: ['Each paragraph is its own pair of tags: `<p>...</p>`.', 'Put the `<h2>` first, then two `<p>` lines under it.'],
    files: [{ name: 'index.html', lang: 'html', code: page('  <h1>Castle Blackstone</h1>\n  <!-- Add an h2 and two paragraphs below -->\n') }, css],
    solution: { 'index.html': page('  <h1>Castle Blackstone</h1>\n  <h2>About the castle</h2>\n  <p>Built by dwarves in the year 812.</p>\n  <p>Famous for its pies.</p>') },
    checks: [
      { label: 'There is an <h2> section heading', test: (c) => txt(c.$('h2')).length > 0 },
      { label: 'There are at least two paragraphs with text', test: (c) => c.$$('p').filter((p) => txt(p).length > 0).length >= 2 },
      { label: 'The <h2> comes after the <h1>', test: (c) => { const h1 = c.$('h1'), h2 = c.$('h2'); return !!h1 && !!h2 && !!(h1.compareDocumentPosition(h2) & 4); } },
    ],
  },
  {
    id: 'html-03', kingdom: 'html', kind: 'web', mode: 'html', region: 'First Stones', xp: 45,
    title: 'Bold Banners',
    concepts: ['strong', 'em', 'nesting'],
    story: 'The town crier wants some words to stand out: warnings must be strong, whispers must be emphasised.',
    learn: `Tags can go **inside** other tags. This is called *nesting*.

- \`<strong>\` marks important text (shown bold)
- \`<em>\` marks emphasis (shown in italics)

\`\`\`
<p>Beware of the <strong>dragon</strong>. It is <em>very</em> grumpy.</p>
\`\`\`

Close the inner tag before the outer one: \`<p><strong>...</strong></p>\`.`,
    task: 'Write a paragraph that contains both a `<strong>` word and an `<em>` word.',
    sage: '`<strong>` and `<em>` carry **meaning** (importance, stress emphasis). `<b>` and `<i>` only change the look. Screen readers can change their voice for emphasis, so prefer the meaningful tags.',
    hints: ['Start with `<p>` and put `<strong>word</strong>` somewhere in the sentence.', 'Example: `<p>Beware of the <strong>dragon</strong>, it is <em>very</em> grumpy.</p>`'],
    files: [{ name: 'index.html', lang: 'html', code: page('  <h1>Town Crier</h1>\n  <!-- Your paragraph with <strong> and <em> -->\n') }, css],
    solution: { 'index.html': page('  <h1>Town Crier</h1>\n  <p>Beware of the <strong>dragon</strong>. It is <em>very</em> grumpy.</p>') },
    checks: [
      { label: 'A <strong> word is inside a paragraph', test: (c) => !!c.$('p strong') && txt(c.$('p strong')).length > 0 },
      { label: 'An <em> word is inside a paragraph', test: (c) => !!c.$('p em') && txt(c.$('p em')).length > 0 },
    ],
  },
  {
    id: 'html-04', kingdom: 'html', kind: 'web', mode: 'html', region: 'First Stones', xp: 55,
    title: 'The Skeleton of a Page',
    concepts: ['doctype', 'head', 'body', 'title'],
    story: 'Hilda shows you the blueprint that every proper page follows. "Skip it and the whole castle leans."',
    learn: `A full HTML page has a fixed skeleton:

\`\`\`
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <title>Shown on the browser tab</title>
  </head>
  <body>
    Everything you see goes here.
  </body>
</html>
\`\`\`

- \`<head>\` holds information *about* the page (like the \`<title>\`)
- \`<body>\` holds what visitors see`,
    task: 'The file is empty. Build the whole skeleton: `<!DOCTYPE html>`, `<html>`, `<head>` with a `<title>`, and a `<body>` containing an `<h1>`.',
    sage: '`<!DOCTYPE html>` tells the browser to use modern *standards mode*. `<meta charset="utf-8">` makes letters like é and emoji display correctly. `lang="en"` helps screen readers pronounce words and helps search engines. Browsers are forgiving and would fix a missing skeleton, but relying on that causes strange bugs.',
    hints: ['Copy the structure from the lesson text, then change the title and add an `<h1>` inside `<body>`.', 'The `<title>` goes inside `<head>`, the `<h1>` inside `<body>`.'],
    files: [{ name: 'index.html', lang: 'html', code: '' }],
    solution: { 'index.html': '<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="utf-8">\n  <title>Castle Blackstone</title>\n</head>\n<body>\n  <h1>Welcome to Castle Blackstone</h1>\n</body>\n</html>\n' },
    checks: [
      { label: 'Starts with <!DOCTYPE html>', test: (c) => /^\s*<!doctype html>/i.test(c.files['index.html']) },
      { label: 'Has <html>, <head> and <body> tags', test: (c) => { const s = lower(src(c, 'index.html')); return s.includes('<html') && s.includes('<head') && s.includes('<body'); } },
      { label: 'The page has a <title>', test: (c) => c.doc.title.trim().length > 0 && /<head[\s\S]*<title>[\s\S]*<\/title>[\s\S]*<\/head>/i.test(src(c, 'index.html')) },
      { label: 'The body has an <h1>', test: (c) => txt(c.$('body > h1')).length > 0 },
      { label: 'The <html> tag has a lang attribute', bonus: true, test: (c) => !!c.doc.documentElement.getAttribute('lang') && /<html[^>]*lang=/i.test(c.files['index.html']) },
    ],
  },
  {
    id: 'html-05', kingdom: 'html', kind: 'web', mode: 'html', region: 'Roads and Windows', xp: 50,
    title: 'Roads Between Castles',
    concepts: ['a', 'href', 'attributes'],
    story: 'A page alone is lonely. Links are the roads that connect all the castles of the web.',
    learn: `A link uses the \`<a>\` tag (a = *anchor*). The address goes in the **href attribute**:

\`\`\`
<a href="https://developer.mozilla.org">The Great Library</a>
\`\`\`

**Attributes** are extra settings written inside the opening tag: \`name="value"\`. The text between the tags is what people click.`,
    task: 'Add a link to `https://developer.mozilla.org` (the best library of web knowledge). The link text should describe where it goes.',
    sage: 'Good link text makes sense on its own: "Read the MDN guide" is better than "click here". Screen-reader users often list all links on a page. To open a link in a new tab, add `target="_blank"`. Modern browsers then protect the opener automatically, but many teams still add `rel="noopener"`.',
    hints: ['The address goes inside quotes after `href=`.', '`<a href="https://developer.mozilla.org">Visit the Great Library</a>`'],
    files: [{ name: 'index.html', lang: 'html', code: page('  <h1>The Crossroads</h1>\n  <p>Where do you want to travel?</p>\n  <!-- Your link here -->\n') }, css],
    solution: { 'index.html': page('  <h1>The Crossroads</h1>\n  <p>Where do you want to travel?</p>\n  <a href="https://developer.mozilla.org">Visit the Great Library of MDN</a>') },
    checks: [
      { label: 'There is a link (<a>) with an href', test: (c) => !!c.$('a[href]') },
      { label: 'It points to https://developer.mozilla.org', test: (c) => c.$$('a[href]').some((a) => /^https:\/\/developer\.mozilla\.org\/?/.test(a.getAttribute('href') ?? '')) },
      { label: 'The link has clickable text', test: (c) => c.$$('a[href]').some((a) => txt(a).length > 0) },
      { label: 'The link text is descriptive (not "click here")', bonus: true, test: (c) => c.$$('a[href]').some((a) => txt(a).length > 6 && !/^(click )?here$/i.test(txt(a))) },
    ],
  },
  {
    id: 'html-06', kingdom: 'html', kind: 'web', mode: 'html', region: 'Roads and Windows', xp: 50,
    title: 'Windows to the World',
    concepts: ['img', 'src', 'alt', 'void elements'],
    story: 'The royal painter delivered a portrait of the castle. Hang it on your page so everyone can see it.',
    learn: `Images use \`<img>\`. It has **no closing tag** (it is a *void element*):

\`\`\`
<img src="castle.svg" alt="A grey castle with red flags">
\`\`\`

- \`src\` is the image file
- \`alt\` describes the picture for people who cannot see it, and shows if the image fails to load

In this lesson these images are ready for you: \`castle.svg\`, \`knight.svg\`, \`dragon.svg\`, \`shield.svg\`, \`potion.svg\`, \`tavern.svg\`.`,
    task: 'Show the image `castle.svg` with a helpful `alt` description.',
    sage: 'Write `alt` text like you would describe the image on the phone. For purely decorative images use an empty `alt=""` so screen readers skip them. Adding `width` and `height` lets the browser reserve space and prevents the layout from jumping while images load.',
    hints: ['`<img>` needs two attributes: `src` and `alt`.', '`<img src="castle.svg" alt="My castle on a green hill">`'],
    files: [{ name: 'index.html', lang: 'html', code: page('  <h1>The Portrait Gallery</h1>\n  <!-- Hang the picture here -->\n') }, css],
    solution: { 'index.html': page('  <h1>The Portrait Gallery</h1>\n  <img src="castle.svg" alt="A grey stone castle with red flags on a green hill">') },
    checks: [
      { label: 'There is an <img> showing castle.svg', test: (c) => c.$$('img').some((i) => /castle\.svg$/.test(i.getAttribute('src') ?? '')) },
      { label: 'The image actually loads (the file name is right)', test: (c) => c.$$('img').some((i) => (i as HTMLImageElement).naturalWidth > 0) },
      { label: 'The image has a helpful alt description', test: (c) => c.$$('img').some((i) => (i.getAttribute('alt') ?? '').trim().length >= 5), fail: 'Add alt="..." with a few words describing the picture.' },
    ],
  },
  {
    id: 'html-07', kingdom: 'html', kind: 'web', mode: 'html', region: 'Roads and Windows', xp: 50,
    title: 'Lists of Supplies',
    concepts: ['ul', 'ol', 'li'],
    story: 'The quartermaster needs two lists: what to pack, and the steps to saddle a horse.',
    learn: `Lists hold items (\`<li>\`). There are two kinds:

- \`<ul>\`: *unordered* list (bullet points), order doesn't matter
- \`<ol>\`: *ordered* list (numbers), for steps

\`\`\`
<ul>
  <li>Rope</li>
  <li>Torch</li>
</ul>
\`\`\``,
    task: 'Make a `<ul>` packing list with **at least 3** items, and an `<ol>` with **at least 3** steps to saddle a horse.',
    sage: 'Navigation menus are usually built as a `<ul>` of links inside a `<nav>`. Lists tell screen readers "list, 5 items", which helps people know what to expect. Lists can be nested: put a new `<ul>` inside an `<li>`.',
    hints: ['Every item is `<li>...</li>` and all items go between `<ul>` and `</ul>`.', 'Do the same with `<ol>` for the steps.'],
    files: [{ name: 'index.html', lang: 'html', code: page('  <h1>The Quartermaster</h1>\n  <h2>Pack for the journey</h2>\n  <!-- ul here -->\n\n  <h2>How to saddle a horse</h2>\n  <!-- ol here -->\n') }, css],
    solution: { 'index.html': page('  <h1>The Quartermaster</h1>\n  <h2>Pack for the journey</h2>\n  <ul>\n    <li>Rope</li>\n    <li>Torch</li>\n    <li>Bread</li>\n  </ul>\n  <h2>How to saddle a horse</h2>\n  <ol>\n    <li>Brush the horse</li>\n    <li>Place the blanket</li>\n    <li>Put on the saddle</li>\n  </ol>') },
    checks: [
      { label: 'A <ul> with at least 3 items', test: (c) => c.$$('ul').some((u) => u.querySelectorAll(':scope > li').length >= 3) },
      { label: 'An <ol> with at least 3 steps', test: (c) => c.$$('ol').some((u) => u.querySelectorAll(':scope > li').length >= 3) },
      { label: 'Every item has text', test: (c) => c.$$('li').length > 0 && c.$$('li').every((l) => txt(l).length > 0) },
    ],
  },
  {
    id: 'html-08', kingdom: 'html', kind: 'web', mode: 'html', region: 'Roads and Windows', xp: 60,
    title: 'The Royal Ledger',
    concepts: ['table', 'tr', 'th', 'td', 'thead', 'tbody'],
    story: 'The treasurer keeps track of who paid their taxes. Rows and columns, as neat as a chessboard.',
    learn: `Tables show data in rows and columns:

\`\`\`
<table>
  <thead>
    <tr><th>Name</th><th>Gold</th></tr>
  </thead>
  <tbody>
    <tr><td>Ada</td><td>120</td></tr>
  </tbody>
</table>
\`\`\`

- \`<tr>\` = table row
- \`<th>\` = header cell, \`<td>\` = data cell
- \`<thead>\` holds the header row, \`<tbody>\` the data rows`,
    task: 'Build a table with a `<thead>` header row (**Name** and **Gold**) and at least **3 data rows** in `<tbody>`.',
    sage: 'Use tables for tabular data only, never for page layout (that is what CSS Grid and Flexbox are for). `<th scope="col">` tells assistive tech that the header labels a column. Add a `<caption>` to give the table a title.',
    hints: ['Start with `<table>`, then `<thead>` containing one `<tr>` with two `<th>`.', 'Then `<tbody>` with three `<tr>`, each with two `<td>`.'],
    files: [{ name: 'index.html', lang: 'html', code: page('  <h1>The Royal Ledger</h1>\n  <!-- Your table here -->\n') }, { ...css, code: BASE_CSS + 'table { border-collapse: collapse; } th, td { border: 1px solid #c9ae78; padding: 4px 10px; }\n' }],
    solution: { 'index.html': page('  <h1>The Royal Ledger</h1>\n  <table>\n    <thead>\n      <tr><th>Name</th><th>Gold</th></tr>\n    </thead>\n    <tbody>\n      <tr><td>Ada</td><td>120</td></tr>\n      <tr><td>Bors</td><td>45</td></tr>\n      <tr><td>Cyra</td><td>300</td></tr>\n    </tbody>\n  </table>') },
    checks: [
      { label: 'There is a <table>', test: (c) => !!c.$('table') },
      { label: 'The header row has "Name" and "Gold" in <th> cells', test: (c) => { const th = c.$$('thead th').map((t) => lower(txt(t))); return th.includes('name') && th.includes('gold'); } },
      { label: 'At least 3 data rows in <tbody>', test: (c) => c.$$('tbody tr').filter((r) => r.querySelectorAll('td').length >= 2).length >= 3 },
    ],
  },
  {
    id: 'html-09', kingdom: 'html', kind: 'web', mode: 'html', region: 'The Gatehouse', xp: 60,
    title: "The Gatekeeper's Questions",
    concepts: ['form', 'label', 'input', 'for/id'],
    story: 'The gatekeeper asks every traveller two questions. Build the form he hands out.',
    learn: `Forms collect answers. Each \`<input>\` should have a \`<label>\`. Connect them with **for** and **id**:

\`\`\`
<form>
  <label for="name">Your name</label>
  <input id="name" type="text">
</form>
\`\`\`

Clicking the label now focuses the input. The \`type\` changes the input: \`text\`, \`email\`, \`number\`, \`password\`...`,
    task: 'Inside the `<form>`, add a text input for the **name** and a number input for the **age**. Each one needs a `<label>` connected with `for`/`id`. Finish with a `<button>`.',
    sage: 'Labels are one of the most important accessibility features: they are read aloud when the input is focused, and they make the click area bigger on phones. A `placeholder` is **not** a replacement for a label (it disappears when you type). Add `name="..."` so the value is sent when the form is submitted.',
    hints: ['`<label for="age">Age</label>` + `<input id="age" type="number">`. The `for` must match the `id` exactly.', 'The button: `<button>Enter</button>`.'],
    files: [{ name: 'index.html', lang: 'html', code: page('  <h1>Halt! Who goes there?</h1>\n  <form>\n    <!-- Name and age inputs with labels, then a button -->\n\n  </form>\n') }, { ...css, code: BASE_CSS + 'label { display: block; margin-top: 8px; } input { padding: 4px; }\n' }],
    solution: { 'index.html': page('  <h1>Halt! Who goes there?</h1>\n  <form>\n    <label for="name">Your name</label>\n    <input id="name" name="name" type="text">\n    <label for="age">Your age</label>\n    <input id="age" name="age" type="number">\n    <button>Enter the castle</button>\n  </form>') },
    checks: [
      { label: 'A text input inside the form', test: (c) => c.$$('form input').some((i) => (i.getAttribute('type') ?? 'text') === 'text') },
      { label: 'A number input inside the form', test: (c) => !!c.$('form input[type="number"]') },
      { label: 'Every input has a label connected with for/id', test: (c) => { const ins = c.$$('form input'); return ins.length >= 2 && ins.every((i) => i.id && c.doc.querySelector(`label[for="${i.id}"]`)); }, fail: 'Each input needs an id, and a label with for="that-id".' },
      { label: 'The form has a button', test: (c) => !!c.$('form button, form input[type="submit"]') },
      { label: 'Inputs have a name attribute', bonus: true, test: (c) => c.$$('form input').every((i) => !!i.getAttribute('name')) },
    ],
  },
  {
    id: 'html-10', kingdom: 'html', kind: 'web', mode: 'html', region: 'The Gatehouse', xp: 65,
    title: 'Choose Your Path',
    concepts: ['select', 'option', 'radio', 'checkbox', 'fieldset'],
    story: 'New recruits must choose a guild, a weapon and whether they can swim.',
    learn: `More ways to answer:

\`\`\`
<label for="guild">Guild</label>
<select id="guild">
  <option>Builders</option>
  <option>Heralds</option>
</select>

<fieldset>
  <legend>Weapon</legend>
  <input type="radio" id="sword" name="weapon"> <label for="sword">Sword</label>
  <input type="radio" id="bow" name="weapon"> <label for="bow">Bow</label>
</fieldset>

<input type="checkbox" id="swim"> <label for="swim">I can swim</label>
\`\`\`

Radio buttons with the **same name** belong together: you can pick only one.`,
    task: 'Add a `<select>` with at least 3 guilds, a group of at least 2 **radio** buttons that share one `name`, and a **checkbox**. Every input needs a label.',
    sage: 'Group related radio buttons in a `<fieldset>` with a `<legend>`: screen readers announce the legend as the question. Use a `<select>` when there are many options, and radios when there are few (2–5) and you want them all visible.',
    hints: ['Radios: give all of them the same `name`, like `name="weapon"`, but different ids.', 'Checkbox: `<input type="checkbox" id="swim"> <label for="swim">I can swim</label>`'],
    files: [{ name: 'index.html', lang: 'html', code: page('  <h1>Recruitment Scroll</h1>\n  <form>\n    <!-- select, radios and a checkbox -->\n\n    <button>Join</button>\n  </form>\n') }, css],
    solution: { 'index.html': page('  <h1>Recruitment Scroll</h1>\n  <form>\n    <label for="guild">Guild</label>\n    <select id="guild" name="guild">\n      <option>Builders</option>\n      <option>Heralds</option>\n      <option>Rangers</option>\n    </select>\n    <fieldset>\n      <legend>Weapon</legend>\n      <input type="radio" id="sword" name="weapon" value="sword"> <label for="sword">Sword</label>\n      <input type="radio" id="bow" name="weapon" value="bow"> <label for="bow">Bow</label>\n    </fieldset>\n    <input type="checkbox" id="swim" name="swim"> <label for="swim">I can swim</label>\n    <button>Join</button>\n  </form>') },
    checks: [
      { label: 'A <select> with at least 3 options', test: (c) => c.$$('select').some((s) => s.querySelectorAll('option').length >= 3) },
      { label: 'At least 2 radio buttons sharing the same name', test: (c) => { const r = c.$$('input[type="radio"]'); const names = r.map((x) => x.getAttribute('name')).filter(Boolean); return r.length >= 2 && names.length === r.length && new Set(names).size < r.length; } },
      { label: 'A checkbox', test: (c) => !!c.$('input[type="checkbox"]') },
      { label: 'Every input and select has a label', test: (c) => c.$$('form input, form select').every((i) => i.id && c.doc.querySelector(`label[for="${i.id}"]`)) },
      { label: 'Radios are grouped in a <fieldset> with a <legend>', bonus: true, test: (c) => !!c.$('fieldset legend') && !!c.$('fieldset input[type="radio"]') },
    ],
  },
  {
    id: 'html-11', kingdom: 'html', kind: 'web', mode: 'html', region: 'The Great Hall', xp: 65,
    title: 'Rooms with Meaning',
    concepts: ['semantic HTML', 'header', 'nav', 'main', 'footer', 'section', 'article'],
    story: 'A castle has a gatehouse, a great hall and a cellar. A page has rooms too, and each room has a purpose.',
    learn: `**Semantic** tags say what a part of the page *is*:

\`\`\`
<header>  top of the page: logo, title
<nav>     the main links
<main>    the main content (only one!)
<section> a themed group of content
<article> a stand-alone piece (a post, a story)
<footer>  bottom: contact, copyright
\`\`\`

They look like plain \`<div>\` boxes, but browsers, search engines and screen readers understand them.`,
    task: 'Turn the page into proper rooms: a `<header>` with the `<h1>`, a `<nav>` with links, a `<main>` containing a `<section>` or `<article>`, and a `<footer>`.',
    sage: 'Screen-reader users can jump straight to `<main>` or `<nav>` ("landmarks"). A `<div>` has no meaning: use it only when no semantic tag fits (for example, just to group things for styling). This is one of the easiest ways to make sites more accessible, and it is often asked about in junior developer interviews.',
    hints: ['Wrap the `<h1>` in `<header>...</header>`, and the links in `<nav>...</nav>`.', 'Put the story in `<main><article>...</article></main>` and the last line in `<footer>`.'],
    files: [{ name: 'index.html', lang: 'html', code: page('  <h1>The Castle Chronicle</h1>\n  <a href="#news">News</a>\n  <a href="#feasts">Feasts</a>\n\n  <h2>Dragon seen over the hills</h2>\n  <p>Farmers report a green dragon circling the hills at dawn.</p>\n\n  <p>Written by the royal scribe.</p>\n') }, css],
    solution: { 'index.html': page('  <header>\n    <h1>The Castle Chronicle</h1>\n  </header>\n  <nav>\n    <a href="#news">News</a>\n    <a href="#feasts">Feasts</a>\n  </nav>\n  <main>\n    <article>\n      <h2>Dragon seen over the hills</h2>\n      <p>Farmers report a green dragon circling the hills at dawn.</p>\n    </article>\n  </main>\n  <footer>\n    <p>Written by the royal scribe.</p>\n  </footer>') },
    checks: [
      { label: 'The <h1> is inside a <header>', test: (c) => !!c.$('header h1') },
      { label: 'The links are inside a <nav>', test: (c) => c.$$('nav a').length >= 2 },
      { label: 'There is one <main> with a <section> or <article> inside', test: (c) => c.$$('main').length === 1 && !!c.$('main section, main article') },
      { label: 'The story (h2 + paragraph) is inside <main>', test: (c) => !!c.$('main h2') && !!c.$('main p') },
      { label: 'There is a <footer>', test: (c) => txt(c.$('footer')).length > 0 },
    ],
  },
  {
    id: 'html-12', kingdom: 'html', kind: 'web', mode: 'html', region: 'The Great Hall', xp: 120, boss: true,
    title: 'The Tavern Menu',
    concepts: ['everything so far'],
    story: 'The innkeeper of *The Prancing Pointer* needs a web page before the harvest festival. Use every stone you have learned to lay. Open the **Goal** tab to see an example.',
    learn: `This is a **boss challenge**: no new tags, just everything together. Plan first:

1. \`<header>\` with the tavern name in \`<h1>\`
2. \`<nav>\` with 3 links
3. \`<main>\` with a picture (\`tavern.svg\`), a menu list and an opening-hours table
4. a small booking \`<form>\`
5. \`<footer>\``,
    task: `Build the tavern's page. It needs:
- a \`<header>\` with an \`<h1>\`
- a \`<nav>\` with **3 links**
- a \`<main>\` with the image \`tavern.svg\` (with alt text)
- a menu: \`<ul>\` with **at least 4 dishes**
- a \`<table>\` with opening hours (at least 2 rows of data)
- a \`<form>\` with a labelled input and a button
- a \`<footer>\``,
    sage: 'Real projects start exactly like this: structure first (HTML), then style (CSS), then behaviour (JavaScript). If the HTML is clean and semantic, the styling and scripting become much easier. Try the **W3C validator** (validator.w3.org) on your real projects.',
    hints: ['Go section by section, using the Goal tab as a guide. Check your objectives often by casting the spell.', 'Remember: every input needs a `<label for>` with a matching `id`.'],
    target: page('<header><h1>The Prancing Pointer</h1></header>\n<nav><a href="#menu">Menu</a> | <a href="#hours">Hours</a> | <a href="#book">Book a table</a></nav>\n<main>\n<img src="tavern.svg" alt="The tavern at night">\n<h2 id="menu">Menu</h2><ul><li>Dragon pepper stew</li><li>Honey bread</li><li>Roast boar</li><li>Apple pie</li></ul>\n<h2 id="hours">Opening hours</h2><table><thead><tr><th>Day</th><th>Hours</th></tr></thead><tbody><tr><td>Mon–Fri</td><td>12–23</td></tr><tr><td>Sat–Sun</td><td>10–02</td></tr></tbody></table>\n<h2 id="book">Book a table</h2><form><label for="guest">Name</label> <input id="guest"> <button>Book</button></form>\n</main>\n<footer><p>The Prancing Pointer, Market Street</p></footer>').replace('<link rel="stylesheet" href="style.css">', `<base href="${typeof location !== 'undefined' ? location.href.split('#')[0].replace(/[^/]*$/, '') : ''}lesson-assets/"><style>${BASE_CSS}</style>`),
    files: [{ name: 'index.html', lang: 'html', code: page('  <!-- Build The Prancing Pointer here -->\n', 'The Prancing Pointer') }, { ...css, code: BASE_CSS + 'nav a { margin-right: 10px; } img { max-width: 100%; }\ntable { border-collapse: collapse; } th, td { border: 1px solid #c9ae78; padding: 4px 10px; }\n' }],
    solution: { 'index.html': page('  <header>\n    <h1>The Prancing Pointer</h1>\n  </header>\n  <nav>\n    <a href="#menu">Menu</a>\n    <a href="#hours">Hours</a>\n    <a href="#book">Book a table</a>\n  </nav>\n  <main>\n    <img src="tavern.svg" alt="The tavern at night with warm windows">\n    <section>\n      <h2 id="menu">Menu</h2>\n      <ul>\n        <li>Dragon pepper stew</li>\n        <li>Honey bread</li>\n        <li>Roast boar</li>\n        <li>Apple pie</li>\n      </ul>\n    </section>\n    <section>\n      <h2 id="hours">Opening hours</h2>\n      <table>\n        <thead><tr><th>Day</th><th>Hours</th></tr></thead>\n        <tbody>\n          <tr><td>Mon-Fri</td><td>12-23</td></tr>\n          <tr><td>Sat-Sun</td><td>10-02</td></tr>\n        </tbody>\n      </table>\n    </section>\n    <section>\n      <h2 id="book">Book a table</h2>\n      <form>\n        <label for="guest">Your name</label>\n        <input id="guest" name="guest">\n        <button>Book</button>\n      </form>\n    </section>\n  </main>\n  <footer>\n    <p>The Prancing Pointer, Market Street</p>\n  </footer>', 'The Prancing Pointer') },
    checks: [
      { label: '<header> with an <h1>', test: (c) => txt(c.$('header h1')).length > 0 },
      { label: '<nav> with 3 links', test: (c) => c.$$('nav a[href]').length >= 3 },
      { label: '<main> shows tavern.svg with alt text', test: (c) => c.$$('main img').some((i) => /tavern\.svg$/.test(i.getAttribute('src') ?? '') && (i.getAttribute('alt') ?? '').trim().length >= 3 && (i as HTMLImageElement).naturalWidth > 0) },
      { label: 'A menu list with at least 4 dishes', test: (c) => c.$$('main ul, main ol').some((u) => u.querySelectorAll('li').length >= 4) },
      { label: 'An opening-hours table with 2+ data rows', test: (c) => c.$$('main table').some((t) => t.querySelectorAll('tbody tr, tr:not(:first-child)').length >= 2 && !!t.querySelector('th')) },
      { label: 'A form with a labelled input and a button', test: (c) => { const f = c.$('form'); if (!f) return false; const i = f.querySelector('input'); return !!i && !!i.id && !!c.doc.querySelector(`label[for="${i.id}"]`) && !!f.querySelector('button, input[type=submit]'); } },
      { label: 'A <footer>', test: (c) => txt(c.$('footer')).length > 0 },
    ],
  },
];
