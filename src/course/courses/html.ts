// Section: HTML.
import type { Course } from '../types';
import { teach, mc, mcc, tf, fill, match, order, type, bug, lesson, unit, challenge } from '../dsl';

export const html: Course = {
  id: 'html', title: 'HTML', realm: "The Builders' Guild", color: '#d9822b', emblem: 'hammer',
  desc: 'The structure of every web page: tags, links, images, lists, tables, forms and semantic, accessible markup.',
  units: [
    unit('html-u1', 'First Tags', 'Elements, headings, paragraphs and nesting.', `
**Key ideas**
- HTML is made of **elements**. Most have an opening and a closing **tag**: \`<p>Hello</p>\`.
- Headings go from \`<h1>\` (most important) to \`<h6>\`. Use one \`<h1>\` per page.
- \`<p>\` is a paragraph. \`<br>\` is a line break (no closing tag).
- \`<strong>\` = important (bold), \`<em>\` = emphasis (italic).
- Elements can be **nested**: close the inner one first. \`<p><em>Hi</em></p>\`
- Comments: \`<!-- a note for humans -->\``, [
      lesson('html-1-1', 'Tags and elements', [
        teach('Your first tag', 'HTML describes the parts of a page with **tags**. Most tags come in pairs:\n\n```\n<p>Hello, traveller!</p>\n```\n- `<p>` is the **opening tag**\n- `</p>` is the **closing tag** (note the `/`)\n- together with the text they make an **element**', '<p>Hello, traveller!</p>', 'html'),
        mcc('Which part is the closing tag?', '<p>Hello</p>', ['</p>', '<p>', 'Hello', '<p>Hello'], 0, undefined, 'html'),
        mc('What makes a closing tag different from an opening tag?', ['A slash: </p>', 'Capital letters: <P>', 'Two brackets: <<p>>', 'A dot: <.p>'], 0),
        fill('Complete the paragraph', '<p>The castle is open.___', ['</p>'], ['<p>', '<p/>', '/p'], undefined, 'html'),
        tf('`<p>` stands for paragraph.', true),
        bug('Which line has a mistake?', '<p>Welcome!</p>\n<p>Mind the dragon.<p>\n<p>Enjoy your stay.</p>', 2, 'Line 2 uses `<p>` instead of `</p>` to close the paragraph.', 'html'),
        type('Type the closing tag for `<h1>`', ['</h1>'], { placeholder: '</...>' }),
      ]),
      lesson('html-1-2', 'Headings', [
        teach('Six sizes of titles', 'HTML has six heading levels:\n\n```\n<h1>Castle Blackstone</h1>\n<h2>The Armoury</h2>\n<h3>Swords</h3>\n```\n`<h1>` is the most important (usually the page title). Use **one** `<h1>` per page, then `<h2>` for sections, `<h3>` inside those, and so on.', undefined),
        mc('Which heading is the most important?', ['<h1>', '<h6>', '<head>', '<title>'], 0, undefined, { codeOptions: true }),
        mc('How many heading levels does HTML have?', ['6', '3', '10', 'As many as you want'], 0),
        order('Order these headings from most to least important', ['<h1>The Realm</h1>', '<h2>The Castle</h2>', '<h3>The Kitchen</h3>'], undefined, 'html'),
        tf('You should pick a heading level because of its size.', false, 'Pick headings by *meaning* (an outline). CSS can change the size later.'),
        fill('Make a section heading under the page title', '<h1>The Realm</h1>\n___Villages</h2>', ['<h2>'], ['<h1>', '</h2>', '<head>'], undefined, 'html'),
        mc('A page has a title and three sections. Which is best?', ['One <h1>, then three <h2>', 'Four <h1>', 'Only <h3> headings', 'No headings, just bold text'], 0),
      ]),
      lesson('html-1-3', 'Text that matters', [
        teach('Strong and emphasis', 'Inside text you can mark words:\n- `<strong>` = **important** (shown bold)\n- `<em>` = *emphasis* (shown italic)\n- `<br>` = a line break. It has no closing tag.\n\n```\n<p>Beware the <strong>dragon</strong>.<br>It is <em>very</em> grumpy.</p>\n```'),
        mc('Which tag marks important text?', ['<strong>', '<em>', '<br>', '<important>'], 0, undefined, { codeOptions: true }),
        mc('How does `<em>` text usually look?', ['Italic', 'Bold', 'Underlined', 'Red'], 0),
        tf('`<br>` needs a closing tag `</br>`.', false, '`<br>` is a *void* element: it has no content and no closing tag.'),
        fill('Make "never" emphasised', '<p>Dragons ___never___ sleep.</p>', ['<em>', '</em>'], ['<br>', '<strong/>', '</br>'], undefined, 'html'),
        match('Match the tag to what it does', [['<p>', 'Paragraph'], ['<strong>', 'Important text'], ['<em>', 'Emphasis'], ['<br>', 'Line break']]),
        mcc('What does this show?', '<p>Gold: <strong>500</strong></p>', ['"Gold: 500" with 500 in bold', '"Gold: 500" all in italics', 'Only "500"', 'An error'], 0, undefined, 'html'),
      ]),
      lesson('html-1-4', 'Nesting and comments', [
        teach('Boxes inside boxes', 'Elements can go **inside** other elements. This is called **nesting**. Always close the inner element first:\n\n```\n<p>A <strong>brave</strong> knight</p>   ✓\n<p>A <strong>brave</p></strong> knight  ✗\n```\nComments are notes for humans. The browser ignores them:\n\n```\n<!-- TODO: add the map here -->\n```'),
        bug('Which line is nested wrongly?', '<p>Welcome to the <strong>castle</strong>.</p>\n<p>Please <em>wipe your boots</p></em>\n<p>Thank you!</p>', 2, 'The `<em>` opens inside the `<p>`, so it must close before the `</p>`.', 'html'),
        order('Build this paragraph: The **dragon** sleeps. ("dragon" is strong)', ['<p>', 'The', '<strong>', 'dragon', '</strong>', 'sleeps.', '</p>'], undefined, 'html'),
        mc('Which is a correct HTML comment?', ['<!-- secret note -->', '// secret note', '# secret note', '<comment>secret</comment>'], 0, undefined, { codeOptions: true }),
        tf('Comments are shown on the page in grey.', false, 'Comments are invisible on the page. Anyone can still read them with "View source", so never put passwords there.'),
        fill('Finish the nesting', '<p>I love <em>___</em>___', ['pies', '</p>'], ['</em>', '<p>', '<br>'], undefined, 'html'),
      ]),
      challenge('html-01', 'Challenge: The First Stone'),
      challenge('html-02', 'Challenge: Words on Parchment'),
      challenge('html-03', 'Challenge: Bold Banners'),
    ]),
    unit('html-u2', 'The Page Skeleton', 'DOCTYPE, head, body, meta tags and attributes.', `
**Key ideas**
- Every page starts with \`<!DOCTYPE html>\`, then \`<html lang="en">\`.
- \`<head>\` holds information *about* the page: \`<title>\`, \`<meta charset="utf-8">\`, the viewport meta tag and links to CSS.
- \`<body>\` holds everything visitors see.
- **Attributes** add settings to tags: \`<html lang="en">\`, \`<a href="...">\`. Format: \`name="value"\`.
- \`<meta name="viewport" content="width=device-width, initial-scale=1">\` makes pages work on phones.`, [
      lesson('html-2-1', 'Head and body', [
        teach('The skeleton', 'Every HTML page has the same skeleton:\n\n```\n<!DOCTYPE html>\n<html lang="en">\n  <head>\n    <title>Tab title</title>\n  </head>\n  <body>\n    Visible content\n  </body>\n</html>\n```\n- `<head>`: information *about* the page\n- `<body>`: what visitors see'),
        order('Put the skeleton in order', ['<!DOCTYPE html>', '<html lang="en">', '<head>', '<title>My Castle</title>', '</head>', '<body>', '<h1>Welcome</h1>', '</body>', '</html>'], undefined, 'html'),
        mc('Where does the `<title>` go?', ['Inside <head>', 'Inside <body>', 'Before <!DOCTYPE html>', 'After </html>'], 0),
        mc('Where is the `<title>` text shown?', ['On the browser tab', 'As the biggest heading', 'At the bottom of the page', 'Nowhere'], 0),
        mc('Where do headings and paragraphs go?', ['Inside <body>', 'Inside <head>', 'Inside <title>', 'Outside <html>'], 0),
        tf('`<!DOCTYPE html>` tells the browser this is a modern HTML page.', true),
        bug('Which line is in the wrong place?', '<!DOCTYPE html>\n<html lang="en">\n<head>\n  <h1>Welcome</h1>\n  <title>Castle</title>\n</head>\n<body>\n</body>\n</html>', 4, 'Headings are visible content, so the `<h1>` belongs in `<body>`.', 'html'),
      ]),
      lesson('html-2-2', 'Attributes', [
        teach('Extra settings', '**Attributes** add information to an opening tag. They look like `name="value"`:\n\n```\n<html lang="en">\n<a href="https://developer.mozilla.org">MDN</a>\n<img src="castle.png" alt="A castle">\n```\nAn element can have many attributes, separated by spaces.'),
        mcc('In this tag, what is `lang`?', '<html lang="en">', ['An attribute name', 'The tag name', 'The attribute value', 'A comment'], 0, undefined, 'html'),
        mcc('And what is `en`?', '<html lang="en">', ['The attribute value', 'The attribute name', 'The tag name', 'A closing tag'], 0, undefined, 'html'),
        fill('Set the page language to English', '<html ___="___">', ['lang', 'en'], ['title', 'english', 'href'], undefined, 'html'),
        mc('Where are attributes written?', ['In the opening tag', 'In the closing tag', 'Between the tags', 'In a separate file'], 0),
        tf('Attribute values should be written in quotes.', true, 'Quotes are optional in some cases, but always using them avoids bugs.'),
        bug('Which line has a broken attribute?', '<img src="knight.png" alt="A knight">\n<a href="about.html>About us</a>\n<html lang="en">', 2, 'The `href` value is missing its closing quote.', 'html'),
      ]),
      lesson('html-2-3', 'Meta tags', [
        teach('Information for machines', '`<meta>` tags go in `<head>` and give information to browsers and search engines:\n\n```\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n<meta name="description" content="The best pies in the realm">\n```\n- **charset**: lets letters like é and emoji display correctly\n- **viewport**: makes the page fit phone screens\n- **description**: the text search engines show under your link'),
        match('Match the meta tag with its job', [['charset="utf-8"', 'Shows all letters and emoji'], ['name="viewport"', 'Fits phone screens'], ['name="description"', 'Summary for search engines']]),
        mc('Your page looks tiny and zoomed-out on phones. Which tag is probably missing?', ['<meta name="viewport" ...>', '<meta charset="utf-8">', '<title>', '<!DOCTYPE html>'], 0, undefined, { codeOptions: true }),
        tf('`<meta>` tags are shown inside the page content.', false),
        fill('Complete the character set', '<meta ___="utf-8">', ['charset'], ['lang', 'content', 'type'], undefined, 'html'),
        mc('`<meta>` has no closing tag. Elements like this are called...', ['void elements', 'empty pages', 'broken tags', 'comments'], 0),
      ]),
      challenge('html-04', 'Challenge: The Skeleton of a Page'),
    ]),
    unit('html-u3', 'Links and Images', 'Anchors, paths and pictures with good alt text.', `
**Key ideas**
- Links: \`<a href="https://example.com">Text</a>\`. The text should describe where the link goes.
- **Absolute** URL: the full address (\`https://...\`). **Relative** path: from the current file (\`about.html\`, \`images/cat.png\`, \`../index.html\`).
- \`target="_blank"\` opens a new tab. \`href="#section-id"\` jumps within the page.
- Images: \`<img src="castle.png" alt="A grey castle on a hill">\`. **Always** write alt text (empty \`alt=""\` for decoration).
- \`<figure>\` + \`<figcaption>\` group an image with its caption.`, [
      lesson('html-3-1', 'Links', [
        teach('Roads between pages', 'Links use the `<a>` tag (*anchor*). The address goes in `href`:\n\n```\n<a href="https://developer.mozilla.org">Read the MDN guide</a>\n```\nThe text between the tags is what people click.'),
        fill('Make a link to the map page', '<___ href="map.html">Open the map</a>', ['a'], ['link', 'href', 'p'], undefined, 'html'),
        mc('Which attribute holds the link address?', ['href', 'src', 'link', 'url'], 0),
        mc('Which link text is best?', ['"Read the pie recipe"', '"Click here"', '"Link"', '"Here"'], 0, 'Descriptive link text helps everyone, especially screen-reader users who jump from link to link.'),
        mc('What does `target="_blank"` do?', ['Opens the link in a new tab', 'Makes the link invisible', 'Removes the link', 'Downloads the page'], 0),
        teach('Jump links', 'A link can also jump to a part of the same page. Give the target an `id`, then link to `#` plus that id:\n\n```\n<a href="#menu">See the menu</a>\n...\n<h2 id="menu">Menu</h2>\n```'),
        fill('Link to the element with id="contact"', '<a href="___">Contact us</a>', ['#contact'], ['contact', '.contact', '/contact'], undefined, 'html'),
        bug('Which link is broken?', '<a href="https://realm.dev">Home</a>\n<a src="about.html">About</a>\n<a href="#faq">FAQ</a>', 2, 'Links use `href`, not `src`.', 'html'),
      ]),
      lesson('html-3-2', 'Paths: where files live', [
        teach('Absolute and relative', 'An **absolute URL** is the full address: `https://realm.dev/about.html`\n\nA **relative path** starts from the current file:\n- `about.html`: a file in the same folder\n- `images/cat.png`: inside the `images` folder\n- `../index.html`: one folder **up**'),
        mc('Which is an absolute URL?', ['https://realm.dev/shop.html', 'shop.html', '../shop.html', 'pages/shop.html'], 0, undefined, { codeOptions: true }),
        mc('`index.html` wants to show `photo.png` from its `images` folder. Which path?', ['images/photo.png', '../photo.png', 'photo.png/images', '/images.photo.png'], 0, undefined, { codeOptions: true }),
        mc('What does `..` mean in a path?', ['Go up one folder', 'The current folder', 'The home page', 'Any file'], 0),
        tf('Relative paths keep working when you move the whole site to another domain.', true, 'That is why sites use relative paths for their own files.'),
        match('Match the path with its meaning', [['about.html', 'Same folder'], ['img/logo.png', 'Inside the img folder'], ['../index.html', 'One folder up'], ['https://mdn.dev', 'Another website']]),
      ]),
      lesson('html-3-3', 'Images', [
        teach('Pictures with words', 'Images use `<img>`, a void element (no closing tag):\n\n```\n<img src="castle.png" alt="A grey castle with red flags">\n```\n- `src`: the image file\n- `alt`: a description for people who cannot see the image (and for when it fails to load)'),
        fill('Complete the image', '<img ___="dragon.png" ___="A green dragon asleep on gold">', ['src', 'alt'], ['href', 'title', 'link'], undefined, 'html'),
        mc('Who relies most on the `alt` text?', ['People using screen readers', 'People with fast internet', 'Only search engines', 'Nobody'], 0, 'Screen readers read the alt text aloud. Search engines use it too.'),
        mc('Which alt text is best for a photo of a knight on a horse?', ['"Sir Ada riding a white horse"', '"image"', '"photo.jpg"', '"click"'], 0),
        mc('An image is only decoration (a swirl). What should its alt be?', ['An empty alt: alt=""', 'No alt attribute at all', '"decoration image"', '"swirl.png"'], 0, '`alt=""` tells screen readers to skip it. A missing alt makes some readers read the file name.'),
        teach('Figures', 'Group an image with a caption using `<figure>` and `<figcaption>`:\n\n```\n<figure>\n  <img src="map.png" alt="Map of the realm">\n  <figcaption>The realm in the year 812</figcaption>\n</figure>\n```'),
        order('Build a figure with the caption **below** the image', ['<figure>', '<img src="map.png" alt="Map of the realm">', '<figcaption>The realm in 812</figcaption>', '</figure>'], undefined, 'html'),
        tf('Adding `width` and `height` to images stops the page from jumping while they load.', true),
      ]),
      challenge('html-05', 'Challenge: Roads Between Castles'),
      challenge('html-06', 'Challenge: Windows to the World'),
    ]),
    unit('html-u4', 'Lists and Tables', 'Bullet lists, numbered steps and tables of data.', `
**Key ideas**
- \`<ul>\` = bullet list (order does not matter), \`<ol>\` = numbered list (steps). Items are \`<li>\`.
- Lists can be nested: put a new \`<ul>\` inside an \`<li>\`.
- Tables: \`<table>\` → \`<thead>\`/\`<tbody>\` → rows \`<tr>\` → cells \`<th>\` (header) or \`<td>\` (data).
- Use tables for data, **never** for page layout. Add a \`<caption>\` and \`scope="col"\` on headers.`, [
      lesson('html-4-1', 'Lists', [
        teach('Bullets and numbers', '```\n<ul>\n  <li>Rope</li>\n  <li>Torch</li>\n</ul>\n```\n- `<ul>`: **unordered** list (bullets)\n- `<ol>`: **ordered** list (numbers)\n- `<li>`: a list item'),
        mc('Steps of a recipe should use...', ['<ol>', '<ul>', '<li> alone', '<table>'], 0, undefined, { codeOptions: true }),
        mc('A shopping list where order does not matter should use...', ['<ul>', '<ol>', '<p>', '<br>'], 0, undefined, { codeOptions: true }),
        order('Build a bullet list: **Sword** first, then **Shield**', ['<ul>', '<li>Sword</li>', '<li>Shield</li>', '</ul>'], undefined, 'html'),
        fill('Complete the list item', '<ol>\n  ___Saddle the horse___\n</ol>', ['<li>', '</li>'], ['<ul>', '<ol>', '<item>'], undefined, 'html'),
        tf('A `<li>` must always be inside a `<ul>` or `<ol>`.', true),
        mc('Navigation menus are usually built as...', ['A <ul> of links inside <nav>', 'A table', 'Many <br> tags', 'One big <h1>'], 0),
      ]),
      lesson('html-4-2', 'Tables', [
        teach('Rows and columns', '```\n<table>\n  <thead>\n    <tr><th>Name</th><th>Gold</th></tr>\n  </thead>\n  <tbody>\n    <tr><td>Ada</td><td>120</td></tr>\n  </tbody>\n</table>\n```\n- `<tr>`: a row\n- `<th>`: a header cell\n- `<td>`: a data cell'),
        match('Match the table tag', [['<tr>', 'Table row'], ['<td>', 'Data cell'], ['<th>', 'Header cell'], ['<thead>', 'Group of header rows']]),
        mc('Which tag makes a new row?', ['<tr>', '<td>', '<row>', '<th>'], 0, undefined, { codeOptions: true }),
        order('Build a row: the name **Bors**, then the gold **45**', ['<tr>', '<td>Bors</td>', '<td>45</td>', '</tr>'], undefined, 'html'),
        tf('Tables are a good way to lay out a whole web page.', false, 'Tables are for data. Use CSS Flexbox and Grid for layout.'),
        fill('Add a header cell', '<tr>\n  ___Name</th>\n</tr>', ['<th>'], ['<td>', '<tr>', '<thead>'], undefined, 'html'),
        mc('Which element gives a table a title?', ['<caption>', '<title>', '<h7>', '<label>'], 0, undefined, { codeOptions: true }),
      ]),
      challenge('html-07', 'Challenge: Lists of Supplies'),
      challenge('html-08', 'Challenge: The Royal Ledger'),
    ]),
    unit('html-u5', 'Forms', 'Inputs, labels, choices, buttons and validation.', `
**Key ideas**
- \`<form>\` wraps inputs. Every input needs a \`<label>\`: connect them with \`for\` and \`id\`.
- Input types: \`text\`, \`email\`, \`password\`, \`number\`, \`date\`, \`checkbox\`, \`radio\`...
- \`name\` is the key used when the form is sent. Radios with the same \`name\` form one group.
- \`<select>\` + \`<option>\` = dropdown. \`<textarea>\` = multi-line text.
- Built-in validation: \`required\`, \`minlength\`, \`max\`, \`type="email"\`.
- A \`<button>\` inside a form submits it.`, [
      lesson('html-5-1', 'Inputs and labels', [
        teach('Asking questions', '```\n<form>\n  <label for="name">Your name</label>\n  <input id="name" name="name" type="text">\n  <button>Send</button>\n</form>\n```\nThe label\'s `for` must match the input\'s `id`. Then clicking the label focuses the input, and screen readers read the label.'),
        fill('Connect the label to the input', '<label ___="email">Email</label>\n<input ___="email" type="email">', ['for', 'id'], ['name', 'class', 'href'], undefined, 'html'),
        mc('Why does every input need a label?', ['So everyone (including screen-reader users) knows what to type', 'Because inputs are invisible without one', 'To make the form send faster', 'It is only decoration'], 0),
        tf('A placeholder can replace a label.', false, 'Placeholders disappear when you type and are often low contrast. Always use a real label.'),
        mc('What does the `name` attribute do?', ['Names the value when the form is sent', 'Shows text inside the input', 'Makes the input bigger', 'Connects to the label'], 0),
        bug('Which line breaks the label connection?', '<label for="age">Age</label>\n<input id="years" type="number">\n<button>Go</button>', 2, 'The label says `for="age"` but the input has `id="years"`. They must match.', 'html'),
      ]),
      lesson('html-5-2', 'Input types', [
        teach('The right input for the job', 'The `type` attribute changes the input:\n- `text`, `email`, `password`, `number`, `date`, `tel`, `url`\n- `checkbox` (yes/no), `radio` (pick one)\n\nOn phones, `email` and `tel` even show a better keyboard!'),
        match('Match the data with the input type', [['user@mail.com', 'email'], ['Secret123', 'password'], ['42', 'number'], ['2025-06-01', 'date']]),
        mc('Which input hides the characters you type?', ['type="password"', 'type="hidden"', 'type="secret"', 'type="text"'], 0, undefined, { codeOptions: true }),
        teach('Built-in checks', 'HTML can check answers before a form is sent:\n\n```\n<input type="email" required>\n<input type="password" minlength="8">\n<input type="number" min="1" max="10">\n```'),
        mc('Which attribute makes a field mandatory?', ['required', 'needed', 'must', 'important'], 0),
        fill('Passwords must be at least 8 characters', '<input type="password" ___="8">', ['minlength'], ['maxlength', 'min', 'size'], undefined, 'html'),
        tf('HTML validation in the browser is enough to keep a website secure.', false, 'Users can bypass the browser. The server must always check data again.'),
      ]),
      lesson('html-5-3', 'Choices and buttons', [
        teach('Pick one, pick many', '```\n<select id="guild">\n  <option>Builders</option>\n  <option>Heralds</option>\n</select>\n\n<input type="radio" name="weapon" id="sword">\n<input type="radio" name="weapon" id="bow">\n\n<input type="checkbox" id="swim">\n<textarea id="story"></textarea>\n```'),
        mc('Radio buttons belong to the same group when they share the same...', ['name', 'id', 'label', 'value'], 0),
        match('Match the element with its use', [['<select>', 'Dropdown list'], ['radio', 'Pick exactly one'], ['checkbox', 'Yes or no'], ['<textarea>', 'Long text']]),
        mc('Which element groups related inputs with a title?', ['<fieldset> with <legend>', '<div> with <h1>', '<group> with <title>', '<form> with <caption>'], 0, undefined, { codeOptions: true }),
        order('Build a dropdown: **Small** first, then **Large**', ['<select id="size">', '<option>Small</option>', '<option>Large</option>', '</select>'], undefined, 'html'),
        tf('A `<button>` inside a `<form>` submits the form by default.', true, 'Use `type="button"` for buttons that should not submit.'),
      ]),
      challenge('html-09', "Challenge: The Gatekeeper's Questions"),
      challenge('html-10', 'Challenge: Choose Your Path'),
    ]),
    unit('html-u6', 'Semantic HTML and Accessibility', 'Tags with meaning, landmarks and pages everyone can use.', `
**Key ideas**
- Semantic tags describe meaning: \`<header>\`, \`<nav>\`, \`<main>\` (one per page), \`<section>\`, \`<article>\`, \`<aside>\`, \`<footer>\`.
- \`<div>\` and \`<span>\` have no meaning; use them only for styling groups.
- **Accessibility** (a11y): everyone can use your site, including people using screen readers, keyboards or zoom.
- Basics: real \`<button>\`s for actions, labels on inputs, alt text, logical headings, good contrast, \`lang\` on \`<html>\`.
- ARIA attributes (\`aria-label\`...) help only when no native HTML element fits.`, [
      lesson('html-6-1', 'Tags with meaning', [
        teach('Rooms in a castle', '```\n<header>   top: logo, title\n<nav>      main links\n<main>     the main content (one per page)\n<article>  a stand-alone piece (post, story)\n<section>  a themed group with a heading\n<aside>    side content\n<footer>   bottom: contact, copyright\n```'),
        match('Match the tag with its purpose', [['<nav>', 'Main links'], ['<main>', 'Main content'], ['<footer>', 'Bottom of the page'], ['<article>', 'Stand-alone story']]),
        mc('How many `<main>` elements should a page have?', ['One', 'None', 'One per section', 'As many as you like'], 0),
        mc('A blog post that makes sense on its own belongs in...', ['<article>', '<aside>', '<nav>', '<span>'], 0, undefined, { codeOptions: true }),
        tf('`<div>` tells the browser that its content is the main navigation.', false, '`<div>` has no meaning. Use `<nav>` for navigation.'),
        order('Order a typical page layout from top to bottom', ['<header>', '<nav>', '<main>', '<footer>'], undefined, 'html'),
        mc('Why use semantic tags instead of only `<div>`s?', ['Screen readers, search engines and developers understand the page better', 'They make the page load 10× faster', 'Browsers refuse to show pages without them', 'They add colours automatically'], 0),
      ]),
      lesson('html-6-2', 'Accessibility basics', [
        teach('A site for everyone', '**Accessibility** (often written **a11y**) means everyone can use your site: people who are blind and use **screen readers**, people who only use a **keyboard**, people who zoom, people with colour blindness...\n\nIn many countries it is also the law for public and business websites.'),
        mc('Which is the best element for something you click to do an action?', ['<button>', '<div onclick="...">', '<span>', '<p>'], 0, 'Buttons work with the keyboard (Tab + Enter) and screen readers out of the box. A clickable `<div>` does not.', { codeOptions: true }),
        mc('Someone cannot use a mouse. How do they move between links and buttons?', ['With the Tab key', 'They cannot use websites', 'With the Delete key', 'By reloading the page'], 0),
        tf('Using only colour (red = error) is enough to show an error.', false, 'Colour-blind users might not see it. Add text or an icon too.'),
        match('Match the problem with the fix', [['Image with no description', 'Add alt text'], ['Input with no name shown', 'Add a <label>'], ['Grey text on grey background', 'Increase contrast'], ['Clickable <div>', 'Use a <button>']]),
        mc('What does `aria-label` do?', ['Gives an element a name for screen readers', 'Changes the colour', 'Adds a tooltip image', 'Makes the element invisible'], 0, 'Example: `<button aria-label="Close">✕</button>`. Use it when there is no visible text.'),
        mc('The first rule of ARIA is...', ['Use a native HTML element instead if you can', 'Add ARIA to every element', 'Never use buttons', 'ARIA replaces alt text'], 0),
      ]),
      challenge('html-11', 'Challenge: Rooms with Meaning'),
      challenge('html-12', 'Project: The Tavern Menu'),
    ]),
  ],
};
