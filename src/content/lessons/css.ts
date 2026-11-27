// The Heraldry Hall: CSS from zero to responsive layouts.
import type { WebCtx, WebLesson } from '../types';
import { sameColor, src, px } from '../helpers';

const page = (body: string, link = true) =>
  `<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="utf-8">\n  <title>The Heraldry Hall</title>\n${link ? '  <link rel="stylesheet" href="style.css">\n' : ''}</head>\n<body>\n${body}\n</body>\n</html>\n`;

const html = (body: string, readonly = true) => ({ name: 'index.html', lang: 'html' as const, code: page(body), readonly });
const css = (code: string) => ({ name: 'style.css', lang: 'css' as const, code });

/** All CSS rules in the page (including those inside @media). */
function rules(c: WebCtx): CSSRule[] {
  const out: CSSRule[] = [];
  const walk = (list: CSSRuleList) => { for (const r of Array.from(list)) { out.push(r); if ('cssRules' in r && (r as CSSGroupingRule).cssRules) walk((r as CSSGroupingRule).cssRules); } };
  for (const sheet of Array.from(c.doc.styleSheets)) { try { walk(sheet.cssRules); } catch { /* ignore */ } }
  return out;
}
const styleRules = (c: WebCtx) => rules(c).filter((r): r is CSSStyleRule => r.constructor.name === 'CSSStyleRule' || 'selectorText' in r);
const mediaRules = (c: WebCtx) => rules(c).filter((r): r is CSSMediaRule => 'conditionText' in r && 'media' in r);

/** Temporarily resize the preview frame to test responsive CSS. */
async function atWidth<T>(c: WebCtx, width: number, fn: () => T): Promise<T> {
  const frame = c.win.frameElement as HTMLIFrameElement | null;
  if (!frame) return fn();
  const old = frame.style.width;
  frame.style.width = width + 'px';
  await c.wait(120);
  const out = fn();
  frame.style.width = old;
  await c.wait(60);
  return out;
}

const columns = (v: string) => v.split(' ').filter((x) => /px$/.test(x)).length;

export const cssLessons: WebLesson[] = [
  {
    id: 'css-01', kingdom: 'css', kind: 'web', mode: 'html', region: 'Colours of the Realm', xp: 40,
    title: 'The First Paint',
    concepts: ['rules', 'selectors', 'color'],
    story: 'The Royal Herald dips a brush in red paint. "HTML builds the walls. **CSS** paints them."',
    learn: `CSS is written as **rules**. A rule picks elements with a **selector**, then sets **properties**:

\`\`\`
h1 {
  color: crimson;
}
\`\`\`

- \`h1\` is the selector (all \`<h1>\` elements)
- \`color\` is the property (text colour)
- \`crimson\` is the value, and the line ends with \`;\`

Browsers know 140 colour names, like \`crimson\`, \`gold\`, \`navy\` or \`saddlebrown\`.`,
    task: 'In **style.css**, make the `h1` **crimson** and the paragraphs **saddlebrown**.',
    sage: 'Colours can also be written as hex (`#dc143c`), `rgb(220 20 60)` or `hsl(348 83% 47%)`. Design systems usually pick a small palette and reuse it everywhere. Good contrast between text and background matters: the WCAG accessibility guidelines ask for a contrast ratio of at least 4.5:1 for normal text.',
    hints: ['You need two rules: one for `h1` and one for `p`.', '`p { color: saddlebrown; }`'],
    files: [css('/* selector { property: value; } */\nh1 {\n\n}\n'), html('  <h1>The Heraldry Hall</h1>\n  <p>Every banner tells a story.</p>\n  <p>Every colour has a meaning.</p>')],
    solution: { 'style.css': 'h1 {\n  color: crimson;\n}\n\np {\n  color: saddlebrown;\n}\n' },
    checks: [
      { label: 'The h1 is crimson', test: (c) => sameColor(c, c.css('h1', 'color'), 'crimson') },
      { label: 'The paragraphs are saddlebrown', test: (c) => c.$$('p').every((p) => sameColor(c, c.css(p, 'color'), 'saddlebrown')) },
    ],
  },
  {
    id: 'css-02', kingdom: 'css', kind: 'web', mode: 'html', region: 'Colours of the Realm', xp: 45,
    title: 'Linking the Paint Pot',
    concepts: ['link', 'background-color'],
    story: 'An apprentice painted beautiful styles... in a pot that nobody opened. The page still looks plain!',
    learn: `CSS usually lives in its own file. The HTML must **link** to it inside \`<head>\`:

\`\`\`
<link rel="stylesheet" href="style.css">
\`\`\`

\`background-color\` paints the area behind an element:

\`\`\`
body {
  background-color: wheat;
}
\`\`\``,
    task: 'Link **style.css** in the `<head>` of index.html, then give the `body` a **wheat** background in style.css.',
    sage: 'Keeping CSS in separate files means one stylesheet can style a whole website, and the browser caches it. You can also write CSS in a `<style>` tag or in a `style="..."` attribute, but those are harder to reuse and maintain.',
    hints: ['The link goes between `<head>` and `</head>`.', 'In style.css add: `body { background-color: wheat; }`'],
    files: [
      { name: 'index.html', lang: 'html', code: page('  <h1>The Forgotten Pot</h1>\n  <p>Why does this page look so plain?</p>', false) },
      css('h1 {\n  color: darkred;\n}\n'),
    ],
    solution: {
      'index.html': page('  <h1>The Forgotten Pot</h1>\n  <p>Why does this page look so plain?</p>'),
      'style.css': 'h1 {\n  color: darkred;\n}\n\nbody {\n  background-color: wheat;\n}\n',
    },
    checks: [
      { label: 'index.html links style.css', test: (c) => /<link[^>]+href=["']?(\.\/)?style\.css/i.test(src(c, 'index.html')) && /rel=["']?stylesheet/i.test(src(c, 'index.html')) },
      { label: 'The heading turned dark red (the link works)', test: (c) => sameColor(c, c.css('h1', 'color'), 'darkred') },
      { label: 'The body background is wheat', test: (c) => sameColor(c, c.css('body', 'background-color'), 'wheat') },
    ],
  },
  {
    id: 'css-03', kingdom: 'css', kind: 'web', mode: 'html', region: 'Colours of the Realm', xp: 50,
    title: 'Classes and Ids',
    concepts: ['class selector', 'id selector', 'font-size', 'font-weight'],
    story: 'Only the golden knights get golden letters, and only the King gets the giant crown.',
    learn: `In HTML you can name elements:

\`\`\`
<p class="gold">Sir Ada</p>     (many elements can share a class)
<h2 id="king">King Bors</h2>   (an id is unique)
\`\`\`

In CSS, a **class selector** starts with a dot and an **id selector** with a hash:

\`\`\`
.gold { color: goldenrod; }
#king { font-size: 40px; }
\`\`\``,
    task: 'Make every `.gold` element **goldenrod** and **bold** (`font-weight: bold`). Make `#king` **40px** big. The plain knight must stay unchanged.',
    sage: 'In real projects, style mostly with classes. Ids are "stronger" (higher *specificity*) and unique, which makes them hard to override and reuse. Specificity decides which rule wins when two rules style the same element: id > class > tag.',
    hints: ['`.gold { color: goldenrod; font-weight: bold; }`', '`#king { font-size: 40px; }`'],
    files: [css(''), html('  <h2 id="king">King Bors</h2>\n  <p class="gold">Sir Ada the Golden</p>\n  <p>Sir Plain the Ordinary</p>\n  <p class="gold">Dame Cyra the Bright</p>')],
    solution: { 'style.css': '.gold {\n  color: goldenrod;\n  font-weight: bold;\n}\n\n#king {\n  font-size: 40px;\n}\n' },
    checks: [
      { label: 'Both .gold knights are goldenrod', test: (c) => c.$$('.gold').every((e) => sameColor(c, c.css(e, 'color'), 'goldenrod')) },
      { label: 'The .gold knights are bold', test: (c) => c.$$('.gold').every((e) => Number(c.css(e, 'font-weight')) >= 700) },
      { label: 'The king is 40px', test: (c) => c.css('#king', 'font-size') === '40px' },
      { label: 'The plain knight is not gold', test: (c) => !sameColor(c, c.css('p:not(.gold)', 'color'), 'goldenrod') },
    ],
  },
  {
    id: 'css-04', kingdom: 'css', kind: 'web', mode: 'html', region: 'Colours of the Realm', xp: 50,
    title: "The Scribe's Fonts",
    concepts: ['font-family', 'text-align', 'line-height', 'text-transform', 'letter-spacing'],
    story: 'The scribe wants the proclamation to look grand and be easy to read.',
    learn: `Text properties:

\`\`\`
body {
  font-family: Georgia, serif;  /* first choice, then fallback */
}
h1 {
  text-align: center;
  text-transform: uppercase;
  letter-spacing: 4px;
}
p {
  line-height: 1.6;             /* space between lines */
}
\`\`\``,
    task: 'Use **Georgia, serif** for the body. Centre the h1, make it **uppercase** with **4px** letter spacing. Give paragraphs a **line-height of 1.6**.',
    sage: 'A line-height around 1.5–1.7 makes long text much easier to read. Always end a font stack with a generic family (`serif`, `sans-serif`, `monospace`) in case the fonts are missing. Web fonts can be loaded with `@font-face` or services like Google Fonts.',
    hints: ['Three rules: `body`, `h1` and `p`.', '`h1 { text-align: center; text-transform: uppercase; letter-spacing: 4px; }`'],
    files: [css(''), html('  <h1>Royal Proclamation</h1>\n  <p>Hear ye, hear ye! By order of the Queen, every citizen shall learn to code.</p>\n  <p>Lessons begin at dawn in the Builders\' Guild. Bring your own quill.</p>')],
    solution: { 'style.css': 'body {\n  font-family: Georgia, serif;\n}\n\nh1 {\n  text-align: center;\n  text-transform: uppercase;\n  letter-spacing: 4px;\n}\n\np {\n  line-height: 1.6;\n}\n' },
    checks: [
      { label: 'The body uses Georgia', test: (c) => /georgia/i.test(c.css('body', 'font-family')) },
      { label: 'The h1 is centred', test: (c) => c.css('h1', 'text-align') === 'center' },
      { label: 'The h1 is uppercase with 4px letter spacing', test: (c) => c.css('h1', 'text-transform') === 'uppercase' && c.css('h1', 'letter-spacing') === '4px' },
      { label: 'Paragraphs have line-height 1.6', test: (c) => { const p = c.$('p'); return !!p && Math.abs(px(c.css(p, 'line-height')) - 1.6 * px(c.css(p, 'font-size'))) < 0.6; } },
    ],
  },
  {
    id: 'css-05', kingdom: 'css', kind: 'web', mode: 'html', region: 'The Box of Every Shield', xp: 55,
    title: 'The Box Model',
    concepts: ['box model', 'padding', 'border', 'margin', 'width'],
    story: 'The armourer explains: "Every shield is a box. Wood inside, a metal rim around, and space between shields on the wall."',
    learn: `Every element is a **box** made of layers, from the inside out:

1. **content**: the text or image
2. **padding**: space inside the border
3. **border**: the rim
4. **margin**: space outside, pushing other boxes away

\`\`\`
.shield {
  width: 200px;
  padding: 20px;
  border: 4px solid darkred;
  margin: 16px;
}
\`\`\`

\`border\` is a shortcut: width, style, colour.`,
    task: 'Give `.shield` a width of **200px**, **20px** padding, a **4px solid darkred** border and a **16px** margin.',
    sage: 'By default `width` sets only the content box, so padding and border make the element wider than you asked. Most projects add `*, *::before, *::after { box-sizing: border-box; }` so `width` includes padding and border. Open your browser DevTools and hover an element to see its box model drawn in colour.',
    hints: ['All four lines go inside the `.shield { }` rule.', '`border: 4px solid darkred;`'],
    files: [css('.shield {\n  background-color: wheat;\n}\n'), html('  <div class="shield">Shield of House Ada</div>\n  <div class="shield">Shield of House Bors</div>')],
    solution: { 'style.css': '.shield {\n  background-color: wheat;\n  width: 200px;\n  padding: 20px;\n  border: 4px solid darkred;\n  margin: 16px;\n}\n' },
    checks: [
      { label: 'Width is 200px', test: (c) => c.css('.shield', 'width') === '200px' },
      { label: 'Padding is 20px on every side', test: (c) => ['top', 'right', 'bottom', 'left'].every((s) => c.css('.shield', `padding-${s}`) === '20px') },
      { label: 'A 4px solid darkred border', test: (c) => c.css('.shield', 'border-top-width') === '4px' && c.css('.shield', 'border-left-style') === 'solid' && sameColor(c, c.css('.shield', 'border-right-color'), 'darkred') },
      { label: 'Margin is 16px', test: (c) => ['top', 'left'].every((s) => c.css('.shield', `margin-${s}`) === '16px') },
    ],
  },
  {
    id: 'css-06', kingdom: 'css', kind: 'web', mode: 'html', region: 'The Box of Every Shield', xp: 55,
    title: 'Round Coins',
    concepts: ['border-radius', 'height', 'box-shadow'],
    story: 'The mint makes square coins by mistake. The Queen is not amused. Make them round!',
    learn: `\`border-radius\` rounds the corners of a box. With **50%** and equal width and height, a square becomes a **circle**:

\`\`\`
.coin {
  width: 100px;
  height: 100px;
  border-radius: 50%;
}
\`\`\`

\`box-shadow\` adds a shadow: \`box-shadow: 0 4px 8px rgba(0, 0, 0, 0.4);\` (x, y, blur, colour).`,
    task: 'Make `.coin` a **100px × 100px** circle with a **gold** background. **Bonus:** add a `box-shadow`.',
    sage: '`rgba(0, 0, 0, 0.4)` is black with 40% opacity: the last number is *alpha* (transparency). Soft, subtle shadows look more modern than hard dark ones. `border-radius: 8px` for slightly rounded corners is one of the most used lines of CSS on the web.',
    hints: ['Width and height must be the same for a circle.', '`border-radius: 50%; background-color: gold;`'],
    files: [css('.coin {\n  display: inline-block;\n  margin: 10px;\n}\n'), html('  <h1>The Royal Mint</h1>\n  <div class="coin"></div>\n  <div class="coin"></div>\n  <div class="coin"></div>')],
    solution: { 'style.css': '.coin {\n  display: inline-block;\n  margin: 10px;\n  width: 100px;\n  height: 100px;\n  border-radius: 50%;\n  background-color: gold;\n  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.4);\n}\n' },
    checks: [
      { label: 'Coins are 100px wide and tall', test: (c) => c.css('.coin', 'width') === '100px' && c.css('.coin', 'height') === '100px' },
      { label: 'Coins are round (border-radius 50%)', test: (c) => { const r = c.css('.coin', 'border-top-left-radius'); return r === '50%' || px(r) >= 50; } },
      { label: 'Coins are gold', test: (c) => sameColor(c, c.css('.coin', 'background-color'), 'gold') },
      { label: 'Coins have a shadow', bonus: true, test: (c) => c.css('.coin', 'box-shadow') !== 'none' },
    ],
  },
  {
    id: 'css-07', kingdom: 'css', kind: 'web', mode: 'html', region: 'Banners in a Row', xp: 60,
    title: 'Banners in a Row',
    concepts: ['flexbox', 'display: flex', 'gap'],
    story: 'The banners of the great houses hang in a pile. The Herald wants them side by side along the wall.',
    learn: `**Flexbox** lines up children in a row. Put it on the **parent**:

\`\`\`
.banners {
  display: flex;
  gap: 12px;     /* space between the children */
}
\`\`\`

All direct children of \`.banners\` now sit next to each other.`,
    task: 'Make `.banners` a flex row with a **12px** gap.',
    sage: 'Flexbox is one-dimensional: it arranges items in a row *or* a column (`flex-direction: column`). Children can grow to fill space with `flex: 1`. Before flexbox, developers used floats and tables for layout, which was painful. Today flexbox and grid cover almost every layout.',
    hints: ['The rule goes on `.banners`, not on `.banner`.', '`.banners { display: flex; gap: 12px; }`'],
    files: [
      css('.banner {\n  padding: 30px 16px;\n  color: white;\n  font-weight: bold;\n}\n.red { background: darkred; }\n.blue { background: navy; }\n.green { background: darkgreen; }\n\n/* Your rule for .banners here */\n'),
      html('  <h1>The Hall of Houses</h1>\n  <div class="banners">\n    <div class="banner red">House Ada</div>\n    <div class="banner blue">House Bors</div>\n    <div class="banner green">House Cyra</div>\n  </div>'),
    ],
    solution: { 'style.css': '.banner {\n  padding: 30px 16px;\n  color: white;\n  font-weight: bold;\n}\n.red { background: darkred; }\n.blue { background: navy; }\n.green { background: darkgreen; }\n\n.banners {\n  display: flex;\n  gap: 12px;\n}\n' },
    checks: [
      { label: '.banners uses display: flex', test: (c) => c.css('.banners', 'display') === 'flex' },
      { label: 'The gap is 12px', test: (c) => c.css('.banners', 'column-gap') === '12px' },
      { label: 'The banners are side by side', test: (c) => { const t = c.$$('.banner').map((b) => Math.round(b.getBoundingClientRect().top)); return t.length === 3 && new Set(t).size === 1; } },
    ],
  },
  {
    id: 'css-08', kingdom: 'css', kind: 'web', mode: 'html', region: 'Banners in a Row', xp: 60,
    title: 'Aligning the Guard',
    concepts: ['justify-content', 'align-items'],
    story: 'The castle\'s top bar is a mess: the crest is squashed next to the links. Spread the guards out!',
    learn: `Flexbox can align children:

- \`justify-content\` works **along** the row: \`flex-start\`, \`center\`, \`space-between\`...
- \`align-items\` works **across** it (up/down): \`stretch\`, \`center\`, \`flex-end\`...

\`\`\`
.bar {
  display: flex;
  justify-content: space-between;  /* push to both ends */
  align-items: center;             /* middle vertically */
}
\`\`\``,
    task: 'Make `.bar` a flex container that puts the crest on the left and the links on the right (**space-between**), centred vertically.',
    sage: 'This "logo left, links right" bar is one of the most common layouts on the web. To centre anything both ways: `display: flex; justify-content: center; align-items: center;`. Remember the axes flip if you use `flex-direction: column`.',
    hints: ['Three properties on `.bar`: display, justify-content, align-items.', '`justify-content: space-between; align-items: center;`'],
    files: [
      css('.bar {\n  background: #3d2819;\n  padding: 10px 16px;\n}\n.crest { font-size: 32px; color: gold; }\n.links a { color: wheat; margin-left: 12px; }\n'),
      html('  <nav class="bar">\n    <div class="crest">⚜ Castle</div>\n    <div class="links">\n      <a href="#">Hall</a>\n      <a href="#">Armoury</a>\n      <a href="#">Kitchens</a>\n    </div>\n  </nav>'),
    ],
    solution: { 'style.css': '.bar {\n  background: #3d2819;\n  padding: 10px 16px;\n  display: flex;\n  justify-content: space-between;\n  align-items: center;\n}\n.crest { font-size: 32px; color: gold; }\n.links a { color: wheat; margin-left: 12px; }\n' },
    checks: [
      { label: '.bar is a flex container', test: (c) => c.css('.bar', 'display') === 'flex' },
      { label: 'justify-content: space-between', test: (c) => c.css('.bar', 'justify-content') === 'space-between' },
      { label: 'align-items: center', test: (c) => c.css('.bar', 'align-items') === 'center' },
      { label: 'The links sit at the right edge', test: (c) => { const bar = c.$('.bar')!.getBoundingClientRect(); const l = c.$('.links')!.getBoundingClientRect(); return bar.right - l.right < 20; } },
    ],
  },
  {
    id: 'css-09', kingdom: 'css', kind: 'web', mode: 'html', region: 'Banners in a Row', xp: 65,
    title: 'The Castle Grid',
    concepts: ['CSS grid', 'grid-template-columns', 'fr unit'],
    story: 'The architect plans six rooms: three on each floor. Flexbox is for rows; for floors and rooms, use the **grid**.',
    learn: `**CSS Grid** makes rows *and* columns:

\`\`\`
.rooms {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}
\`\`\`

\`1fr\` means "one fraction of the free space", so \`repeat(3, 1fr)\` makes 3 equal columns. Children fill the cells in order and wrap to new rows by themselves.`,
    task: 'Turn `.rooms` into a grid with **3 equal columns** and a **10px** gap.',
    sage: 'Use Grid for two-dimensional layouts (page layouts, card galleries) and Flexbox for one-dimensional ones (toolbars, rows of buttons). `grid-template-columns: repeat(auto-fill, minmax(200px, 1fr))` creates responsive card grids without any media queries.',
    hints: ['`display: grid;` first.', '`grid-template-columns: repeat(3, 1fr); gap: 10px;`'],
    files: [
      css('.room {\n  background: wheat;\n  border: 2px solid saddlebrown;\n  padding: 20px;\n  text-align: center;\n}\n\n.rooms {\n\n}\n'),
      html('  <h1>Castle Floor Plan</h1>\n  <div class="rooms">\n    <div class="room">Hall</div>\n    <div class="room">Kitchen</div>\n    <div class="room">Armoury</div>\n    <div class="room">Library</div>\n    <div class="room">Chapel</div>\n    <div class="room">Treasury</div>\n  </div>'),
    ],
    solution: { 'style.css': '.room {\n  background: wheat;\n  border: 2px solid saddlebrown;\n  padding: 20px;\n  text-align: center;\n}\n\n.rooms {\n  display: grid;\n  grid-template-columns: repeat(3, 1fr);\n  gap: 10px;\n}\n' },
    checks: [
      { label: '.rooms is a grid', test: (c) => c.css('.rooms', 'display') === 'grid' },
      { label: 'It has 3 equal columns', test: (c) => { const cols = c.css('.rooms', 'grid-template-columns').split(' ').map(px); return cols.length === 3 && Math.max(...cols) - Math.min(...cols) < 1; } },
      { label: 'The gap is 10px', test: (c) => c.css('.rooms', 'row-gap') === '10px' && c.css('.rooms', 'column-gap') === '10px' },
      { label: 'Six rooms on two floors', test: (c) => { const t = c.$$('.room').map((r) => Math.round(r.getBoundingClientRect().top)); return new Set(t).size === 2; } },
    ],
  },
  {
    id: 'css-10', kingdom: 'css', kind: 'web', mode: 'html', region: 'Magic of the Hall', xp: 65,
    title: 'Hover Enchantments',
    concepts: [':hover', 'transition', 'transform'],
    story: 'Magic runes should glow when a hand passes over them. Enchant the buttons!',
    learn: `A **pseudo-class** styles an element in a special state. \`:hover\` applies while the mouse is over it:

\`\`\`
.rune:hover {
  background-color: purple;
  transform: scale(1.1);   /* grow by 10% */
}
\`\`\`

\`transition\` animates the change smoothly:

\`\`\`
.rune {
  transition: all 0.3s;
}
\`\`\``,
    task: 'Give `.rune` a **0.3s** transition. On hover, make it **purple** and **scale(1.1)**. Move your mouse over the preview to test it!',
    sage: 'Also style `:focus-visible` the same way, so keyboard users (who press Tab) see the effect too. Animating `transform` and `opacity` is cheap for the browser; animating `width` or `top` can be slow. Respect users who get motion sickness: `@media (prefers-reduced-motion: reduce) { ... }`.',
    hints: ['Two rules: `.rune { transition: all 0.3s; }` and `.rune:hover { ... }`.', '`.rune:hover { background-color: purple; transform: scale(1.1); }`'],
    files: [
      css('.rune {\n  font-size: 24px;\n  padding: 12px 20px;\n  border: 2px solid #2b1d12;\n  border-radius: 10px;\n  background-color: slateblue;\n  color: white;\n  cursor: pointer;\n}\n'),
      html('  <h1>The Rune Wall</h1>\n  <button class="rune">ᚠ Wealth</button>\n  <button class="rune">ᚢ Strength</button>\n  <button class="rune">ᚦ Thorn</button>'),
    ],
    solution: { 'style.css': '.rune {\n  font-size: 24px;\n  padding: 12px 20px;\n  border: 2px solid #2b1d12;\n  border-radius: 10px;\n  background-color: slateblue;\n  color: white;\n  cursor: pointer;\n  transition: all 0.3s;\n}\n\n.rune:hover {\n  background-color: purple;\n  transform: scale(1.1);\n}\n' },
    checks: [
      { label: '.rune has a 0.3s transition', test: (c) => c.css('.rune', 'transition-duration').split(',').some((d) => d.trim() === '0.3s') },
      { label: 'A .rune:hover rule exists', test: (c) => styleRules(c).some((r) => /\.rune:hover/.test(r.selectorText)) },
      { label: 'On hover it turns purple', test: (c) => styleRules(c).some((r) => /\.rune:hover/.test(r.selectorText) && (r.style.backgroundColor === 'purple' || r.style.background.includes('purple'))) },
      { label: 'On hover it scales to 1.1', test: (c) => styleRules(c).some((r) => /\.rune:hover/.test(r.selectorText) && /scale\(1\.1\)/.test(r.style.transform)) },
    ],
  },
  {
    id: 'css-11', kingdom: 'css', kind: 'web', mode: 'html', region: 'Magic of the Hall', xp: 65,
    title: 'The Royal Colour',
    concepts: ['custom properties', 'CSS variables', 'var()'],
    story: 'The Queen changes her favourite colour every season. The painters are exhausted from repainting every banner one by one.',
    learn: `**Custom properties** (CSS variables) store a value once and reuse it:

\`\`\`
:root {
  --royal: #3b2a8f;
}
h1 {
  color: var(--royal);
}
\`\`\`

\`:root\` is the top of the page, so the variable works everywhere. Change it in one place and everything updates.`,
    task: 'Create `--royal` on `:root` with the value **#3b2a8f**. Use `var(--royal)` for the `h1` colour **and** the `.banner` background.',
    sage: 'Design systems and themes (like dark mode) are built on custom properties: switch a few variables and the whole site changes. Unlike variables in preprocessors like Sass, CSS variables live in the browser, so JavaScript can change them at runtime: `document.documentElement.style.setProperty("--royal", "teal")`.',
    hints: ['`:root { --royal: #3b2a8f; }`', '`h1 { color: var(--royal); }` and `.banner { background: var(--royal); }`'],
    files: [
      css(':root {\n  /* your variable here */\n}\n\n.banner {\n  color: white;\n  padding: 16px;\n}\n'),
      html('  <h1>Her Majesty\'s Colours</h1>\n  <div class="banner">Long live the Queen!</div>'),
    ],
    solution: { 'style.css': ':root {\n  --royal: #3b2a8f;\n}\n\nh1 {\n  color: var(--royal);\n}\n\n.banner {\n  color: white;\n  padding: 16px;\n  background: var(--royal);\n}\n' },
    checks: [
      { label: '--royal is #3b2a8f on :root', test: (c) => c.win.getComputedStyle(c.doc.documentElement).getPropertyValue('--royal').trim().toLowerCase() === '#3b2a8f' },
      { label: 'The h1 uses the royal colour', test: (c) => sameColor(c, c.css('h1', 'color'), '#3b2a8f') },
      { label: 'The banner background uses the royal colour', test: (c) => sameColor(c, c.css('.banner', 'background-color'), '#3b2a8f') },
      { label: 'Both use var(--royal)', test: (c) => (src(c, 'style.css').match(/var\(\s*--royal\s*\)/g) ?? []).length >= 2 },
    ],
  },
  {
    id: 'css-12', kingdom: 'css', kind: 'web', mode: 'html', region: 'Magic of the Hall', xp: 75,
    title: 'Shapeshifting Screens',
    concepts: ['responsive design', 'media queries'],
    story: 'Messengers read the castle pages on tiny scrolls (phones). Three columns are far too squeezed there.',
    learn: `A **media query** applies CSS only when a condition is true, such as a small screen:

\`\`\`
@media (max-width: 600px) {
  .rooms {
    grid-template-columns: 1fr;   /* one column on small screens */
  }
}
\`\`\`

Everything inside the braces only applies when the page is **600px wide or less**.`,
    task: 'Keep 3 columns on wide screens, but switch `.rooms` to **one column** when the screen is **600px or narrower**. (The forge will test it by shrinking the preview.)',
    sage: 'Many teams write CSS *mobile-first*: the base styles are for phones, and `@media (min-width: ...)` adds columns for bigger screens. Common breakpoints are around 640px, 768px, 1024px and 1280px, but the best breakpoints are where *your* design starts to look bad. Do not forget `<meta name="viewport" content="width=device-width, initial-scale=1">` in real pages.',
    hints: ['Write `@media (max-width: 600px) { ... }` at the bottom of the file.', 'Inside it: `.rooms { grid-template-columns: 1fr; }`'],
    files: [
      css('.rooms {\n  display: grid;\n  grid-template-columns: repeat(3, 1fr);\n  gap: 10px;\n}\n.room {\n  background: wheat;\n  border: 2px solid saddlebrown;\n  padding: 20px;\n}\n\n/* Your media query here */\n'),
      html('  <h1>Rooms</h1>\n  <div class="rooms">\n    <div class="room">Hall</div>\n    <div class="room">Kitchen</div>\n    <div class="room">Armoury</div>\n  </div>'),
    ],
    solution: { 'style.css': '.rooms {\n  display: grid;\n  grid-template-columns: repeat(3, 1fr);\n  gap: 10px;\n}\n.room {\n  background: wheat;\n  border: 2px solid saddlebrown;\n  padding: 20px;\n}\n\n@media (max-width: 600px) {\n  .rooms {\n    grid-template-columns: 1fr;\n  }\n}\n' },
    checks: [
      { label: 'There is a media query with max-width', test: (c) => mediaRules(c).some((m) => /max-width/.test(m.conditionText)) },
      { label: 'At 900px wide: 3 columns', test: (c) => atWidth(c, 900, () => columns(c.css('.rooms', 'grid-template-columns')) === 3) },
      { label: 'At 400px wide: 1 column', test: (c) => atWidth(c, 400, () => columns(c.css('.rooms', 'grid-template-columns')) === 1) },
    ],
  },
  {
    id: 'css-13', kingdom: 'css', kind: 'web', mode: 'html', region: 'The Royal Heraldry', xp: 140, boss: true,
    title: 'The Royal Heraldry',
    concepts: ['everything so far'],
    story: 'The Queen commissions a **crest card** for her new knight. It must be beautiful, it must glow when touched, and it must look good even on a messenger\'s tiny scroll.',
    learn: `Boss challenge! Combine what you learned. One new trick: gradients are images, so they go in \`background\`:

\`\`\`
background: linear-gradient(135deg, #f6e7c1, #d9b56a);
\`\`\``,
    task: `Style the crest card in **style.css**:
- \`:root\` has a \`--gold\` variable, and the \`.crest h2\` uses it as its colour
- \`.crest\` is a **flex column** with centred items, **24px** padding, rounded corners (**16px**), a **linear-gradient** background and a box-shadow
- \`.tags\` is a flex row with an **8px** gap, and each \`.tag\` has rounded corners
- \`.crest:hover\` uses a \`transform\`
- On screens **500px or narrower**, \`.crest\` padding becomes **12px**`,
    sage: 'Professional CSS is mostly these same building blocks, well organised. Naming conventions like BEM (`.crest__title`, `.crest--large`) help keep big stylesheets tidy. Tools like Tailwind (coming soon in the Tailors\' Quarter) take a different approach.',
    hints: ['`.crest { display: flex; flex-direction: column; align-items: center; ... }`', 'The media query: `@media (max-width: 500px) { .crest { padding: 12px; } }`'],
    files: [
      css('/* The Royal Heraldry */\n\nbody {\n  font-family: Georgia, serif;\n  background: #2b1d12;\n  padding: 20px;\n}\n\n.crest img {\n  width: 90px;\n}\n'),
      html('  <div class="crest">\n    <h2>Sir Ada of Codeshire</h2>\n    <img src="shield.svg" alt="A red shield with a golden cross">\n    <p class="motto">"Loops never tire."</p>\n    <div class="tags">\n      <span class="tag">Brave</span>\n      <span class="tag">Clever</span>\n      <span class="tag">Kind</span>\n    </div>\n  </div>'),
    ],
    solution: { 'style.css': '/* The Royal Heraldry */\n\n:root {\n  --gold: #b8862f;\n}\n\nbody {\n  font-family: Georgia, serif;\n  background: #2b1d12;\n  padding: 20px;\n}\n\n.crest img {\n  width: 90px;\n}\n\n.crest {\n  display: flex;\n  flex-direction: column;\n  align-items: center;\n  padding: 24px;\n  border-radius: 16px;\n  background: linear-gradient(135deg, #f6e7c1, #d9b56a);\n  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.5);\n  transition: transform 0.3s;\n}\n\n.crest:hover {\n  transform: translateY(-4px) scale(1.02);\n}\n\n.crest h2 {\n  color: var(--gold);\n}\n\n.tags {\n  display: flex;\n  gap: 8px;\n}\n\n.tag {\n  background: #7d1f1a;\n  color: white;\n  padding: 4px 10px;\n  border-radius: 12px;\n}\n\n@media (max-width: 500px) {\n  .crest {\n    padding: 12px;\n  }\n}\n' },
    checks: [
      { label: '--gold is defined and used for .crest h2', test: (c) => { const g = c.win.getComputedStyle(c.doc.documentElement).getPropertyValue('--gold').trim(); return !!g && sameColor(c, c.css('.crest h2', 'color'), g) && /var\(\s*--gold\s*\)/.test(src(c, 'style.css')); } },
      { label: '.crest is a centred flex column', test: (c) => c.css('.crest', 'display') === 'flex' && c.css('.crest', 'flex-direction') === 'column' && c.css('.crest', 'align-items') === 'center' },
      { label: '.crest has 24px padding and 16px rounded corners', test: (c) => atWidth(c, 800, () => c.css('.crest', 'padding-top') === '24px' && c.css('.crest', 'border-top-left-radius') === '16px') },
      { label: '.crest has a linear-gradient and a shadow', test: (c) => /linear-gradient/.test(c.css('.crest', 'background-image')) && c.css('.crest', 'box-shadow') !== 'none' },
      { label: '.tags is a flex row with an 8px gap; tags are rounded', test: (c) => c.css('.tags', 'display') === 'flex' && c.css('.tags', 'column-gap') === '8px' && px(c.css('.tag', 'border-top-left-radius')) > 0 },
      { label: '.crest:hover uses a transform', test: (c) => styleRules(c).some((r) => /\.crest:hover/.test(r.selectorText) && !!r.style.transform) },
      { label: 'At 400px wide the padding is 12px', test: (c) => atWidth(c, 400, () => c.css('.crest', 'padding-top') === '12px') },
    ],
  },
];
