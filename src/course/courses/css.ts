// Section: CSS.
import type { Course } from '../types';
import { teach, mc, mcc, tf, fill, match, order, type, bug, lesson, unit, challenge } from '../dsl';

export const css: Course = {
  id: 'css', title: 'CSS', realm: 'The Heraldry Hall', color: '#8a5cc7', emblem: 'banner',
  desc: 'Colours, fonts, the box model, Flexbox, Grid, positioning, animations and responsive design.',
  units: [
    unit('css-u1', 'Selectors and Colours', 'Rules, selectors, colours and linking a stylesheet.', `
**Key ideas**
- A **rule**: \`selector { property: value; }\` e.g. \`h1 { color: crimson; }\`
- Selectors: tag \`p\`, class \`.gold\`, id \`#king\`, descendant \`nav a\`, group \`h1, h2\`.
- Colours: names (\`crimson\`), hex (\`#dc143c\`), \`rgb(220 20 60)\`, with transparency \`rgb(0 0 0 / 0.5)\`.
- \`color\` = text colour, \`background-color\` = background.
- Link CSS with \`<link rel="stylesheet" href="style.css">\` in \`<head>\`.`, [
      lesson('css-1-1', 'Rules and selectors', [
        teach('Painting with rules', 'CSS is a list of **rules**. Each rule picks elements with a **selector** and sets **properties**:\n\n```\nh1 {\n  color: crimson;\n  font-size: 40px;\n}\n```\nProperty and value are separated by `:`, and each line ends with `;`.', undefined),
        mcc('In this rule, what is the selector?', 'p {\n  color: navy;\n}', ['p', 'color', 'navy', '{ }'], 0, undefined, 'css'),
        mcc('And what is `color`?', 'p {\n  color: navy;\n}', ['The property', 'The selector', 'The value', 'A tag'], 0, undefined, 'css'),
        fill('Make every paragraph green', 'p ___\n  color___ green;\n}', ['{', ':'], ['(', '=', ';', '['], undefined, 'css'),
        bug('Which line has a mistake?', 'h1 {\n  color: gold\n  font-size: 32px;\n}', 2, 'A `;` is missing after `gold`, so the browser reads `gold font-size: 32px` as one broken value.', 'css'),
        order('Write a rule that makes h2 purple', ['h2 {', '  color: purple;', '}'], undefined, 'css'),
        tf('One CSS rule can set many properties.', true),
      ]),
      lesson('css-1-2', 'Colours', [
        teach('Many ways to say "red"', '```\ncolor: red;                  /* a name */\ncolor: #ff0000;              /* hex: red, green, blue */\ncolor: rgb(255 0 0);         /* numbers 0-255 */\ncolor: rgb(255 0 0 / 0.5);   /* 50% see-through */\n```\n`color` changes the **text**. `background-color` changes the **background**.'),
        mc('Which property changes the colour of the text?', ['color', 'background-color', 'font-color', 'text-color'], 0),
        mc('Which property paints behind an element?', ['background-color', 'color', 'border', 'fill'], 0),
        match('Match the colour value to its format', [['gold', 'Colour name'], ['#ffd700', 'Hex code'], ['rgb(255 215 0)', 'RGB numbers'], ['rgb(0 0 0 / 0.5)', 'With transparency']]),
        mc('What does `#000000` look like?', ['Black', 'White', 'Red', 'See-through'], 0, 'All three channels (red, green, blue) are 0: no light = black.'),
        mc('What does `#ffffff` look like?', ['White', 'Black', 'Yellow', 'Grey'], 0),
        fill('Make the background wheat and the text dark red', 'body {\n  ___: wheat;\n  ___: darkred;\n}', ['background-color', 'color'], ['font', 'text-color', 'paint'], undefined, 'css'),
        tf('Light grey text on a white background is easy for everyone to read.', false, 'Low contrast is hard to read, especially for people with low vision. Aim for strong contrast.'),
      ]),
      lesson('css-1-3', 'Classes and ids', [
        teach('Picking the right elements', '```\n<p class="gold">Sir Ada</p>\n<h2 id="king">King Bors</h2>\n```\n```\n.gold { color: goldenrod; }   /* class: a dot */\n#king { font-size: 40px; }    /* id: a hash */\n```\nMany elements can share a **class**. An **id** must be unique on the page.'),
        mc('Which selector matches `<p class="note">`?', ['.note', '#note', 'note', '*note'], 0, undefined, { codeOptions: true }),
        mc('Which selector matches `<div id="map">`?', ['#map', '.map', 'map', '@map'], 0, undefined, { codeOptions: true }),
        tf('Two elements on the same page can share the same class.', true),
        tf('Two elements on the same page should share the same id.', false, 'Ids must be unique. Use a class for groups.'),
        mcc('Which elements turn red?', '<p class="warn">A</p>\n<p>B</p>\n<span class="warn">C</span>\n\n.warn { color: red; }', ['A and C', 'Only A', 'A and B', 'All three'], 0, undefined, 'html'),
        teach('Combining selectors', '```\nnav a { }        /* <a> inside <nav> (descendant) */\nh1, h2 { }       /* h1 AND h2 (group) */\np.intro { }      /* <p> with class intro */\n.card .title { } /* .title inside .card */\n```'),
        match('Match the selector with what it picks', [['nav a', 'Links inside nav'], ['h1, h2', 'All h1 and h2'], ['p.intro', 'Paragraphs with class intro'], ['*', 'Every element']]),
        type('Write the selector for elements with the class `hero`', ['.hero']),
      ]),
      lesson('css-1-4', 'Where CSS lives', [
        teach('Three places for CSS', '1. An external file (best): `<link rel="stylesheet" href="style.css">` in `<head>`\n2. A `<style>` tag in `<head>`\n3. Inline: `<p style="color: red">` (hard to maintain)\n\nOne stylesheet can style a whole website.'),
        fill('Link the stylesheet', '<link ___="stylesheet" ___="style.css">', ['rel', 'href'], ['src', 'type', 'link'], undefined, 'html'),
        mc('Where does the `<link>` tag go?', ['Inside <head>', 'At the end of <body>', 'Inside <title>', 'In the CSS file'], 0),
        mc('Why are external CSS files usually best?', ['One file can style many pages, and browsers cache it', 'They are the only kind browsers understand', 'They run faster than HTML', 'They hide the code from users'], 0),
        bug('Why is this page unstyled?', '<head>\n  <title>Castle</title>\n  <link rel="stylesheet" src="style.css">\n</head>', 3, '`<link>` uses `href`, not `src`.', 'html'),
        tf('CSS comments are written like `/* this */`.', true),
      ]),
      challenge('css-01', 'Challenge: The First Paint'),
      challenge('css-02', 'Challenge: Linking the Paint Pot'),
      challenge('css-03', 'Challenge: Classes and Ids'),
    ]),
    unit('css-u2', 'Text and Fonts', 'Fonts, sizes, units and text styling.', `
**Key ideas**
- \`font-family: Georgia, serif;\`: list fallbacks, end with a generic family.
- \`font-size\`, \`font-weight\` (400 normal, 700 bold), \`font-style: italic\`.
- Units: \`px\` (fixed), \`rem\` (relative to the root font size, usually 16px), \`em\` (relative to the parent), \`%\`.
- \`text-align\`, \`line-height\` (1.5–1.7 for reading), \`text-transform\`, \`letter-spacing\`, \`text-decoration\`.`, [
      lesson('css-2-1', 'Fonts', [
        teach('Choosing a font', '```\nbody {\n  font-family: "Open Sans", Arial, sans-serif;\n}\n```\nThe browser uses the first font it has. Always end with a **generic family**: `serif`, `sans-serif` or `monospace`. Font names with spaces need quotes.'),
        mc('Why end a font list with `sans-serif`?', ['As a fallback if the other fonts are missing', 'To make the text bold', 'It is required to load fonts', 'To make text load faster'], 0),
        match('Match the generic family with its look', [['serif', 'Little feet on letters (like books)'], ['sans-serif', 'Clean, no feet (like most apps)'], ['monospace', 'Every letter the same width (code)']]),
        mc('Which value makes text bold?', ['font-weight: 700', 'font-size: bold', 'font-style: bold', 'text-weight: 700'], 0, undefined, { codeOptions: true }),
        mc('Which makes text italic?', ['font-style: italic', 'font-weight: italic', 'text-style: italic', 'font: slanted'], 0, undefined, { codeOptions: true }),
        fill('Use Georgia, with serif as the fallback', 'p {\n  font-family: ___, ___;\n}', ['Georgia', 'serif'], ['bold', 'italic', 'font'], undefined, 'css'),
        tf('Web fonts (like Google Fonts) let you use fonts that visitors do not have installed.', true),
      ]),
      lesson('css-2-2', 'Sizes and units', [
        teach('px, rem and em', '- `px`: fixed pixels. `font-size: 16px`\n- `rem`: relative to the **root** font size (usually 16px). `2rem` = 32px\n- `em`: relative to the **parent** font size\n- `%`: percentage of the parent\n\n`rem` respects the reader\'s browser settings, so it is great for accessibility.'),
        mc('The root font size is 16px. What is `2rem`?', ['32px', '16px', '2px', '18px'], 0),
        mc('The root font size is 16px. What is `1.5rem`?', ['24px', '15px', '1.5px', '30px'], 0),
        mc('Which unit changes if the user sets a bigger default font in their browser?', ['rem', 'px', 'Neither', 'Both never change'], 0),
        match('Match the unit to what it is relative to', [['px', 'Nothing (fixed)'], ['rem', 'The root font size'], ['em', 'The parent font size'], ['%', 'The parent size']]),
        tf('`width: 50%` makes an element half as wide as its parent.', true),
      ]),
      lesson('css-2-3', 'Styling text', [
        teach('Text tools', '```\nh1 {\n  text-align: center;\n  text-transform: uppercase;\n  letter-spacing: 2px;\n}\np {\n  line-height: 1.6;\n}\na {\n  text-decoration: none;   /* remove underline */\n}\n```'),
        match('Match the property with what it does', [['text-align', 'Left, centre or right'], ['line-height', 'Space between lines'], ['text-transform', 'UPPERCASE or lowercase'], ['text-decoration', 'Underlines']]),
        mc('Which centres text?', ['text-align: center', 'align: center', 'text-center: true', 'font-align: middle'], 0, undefined, { codeOptions: true }),
        mc('Which `line-height` is most comfortable for long paragraphs?', ['1.6', '0.8', '5', '1'], 0),
        fill('Remove the underline from links', 'a {\n  ___: none;\n}', ['text-decoration'], ['underline', 'text-style', 'decoration-line-off'], undefined, 'css'),
        tf('`text-transform: uppercase` changes the letters in the HTML file.', false, 'It only changes how text *looks*. The HTML stays the same.'),
      ]),
      challenge('css-04', "Challenge: The Scribe's Fonts"),
    ]),
    unit('css-u3', 'The Box Model', 'Padding, borders, margins, sizes and display types.', `
**Key ideas**
- Every element is a box: **content → padding → border → margin** (inside to outside).
- \`padding\` = space inside, \`margin\` = space outside. Shorthand: \`padding: 10px 20px\` (top/bottom, left/right).
- \`box-sizing: border-box\` makes \`width\` include padding and border (use it everywhere).
- \`display: block\` (full width, new line), \`inline\` (flows in text, no width/height), \`inline-block\`, \`none\` (hidden).
- \`border-radius\` rounds corners; \`box-shadow\` adds shadows.`, [
      lesson('css-3-1', 'Content, padding, border, margin', [
        teach('Every element is a box', 'From the inside out:\n1. **content**: text or image\n2. **padding**: space inside the border\n3. **border**: the edge\n4. **margin**: space outside, pushing other boxes away'),
        order('Order the layers from the inside out', ['content', 'padding', 'border', 'margin'], undefined, 'text'),
        mc('You want more space between the text and the border of a button. Which property?', ['padding', 'margin', 'border-width', 'gap'], 0),
        mc('You want more space between two cards. Which property?', ['margin', 'padding', 'border', 'line-height'], 0),
        mcc('What does this padding mean?', '.card {\n  padding: 10px 20px;\n}', ['10px top and bottom, 20px left and right', '10px left, 20px right', '10px everywhere, then 20px more', '10px top, 20px bottom'], 0, undefined, 'css'),
        fill('A 3px solid gold border', '.shield {\n  border: ___ ___ gold;\n}', ['3px', 'solid'], ['dotted', '3', 'bold'], undefined, 'css'),
        tf('Margin is inside the border.', false),
      ]),
      lesson('css-3-2', 'Width and box-sizing', [
        teach('The box-sizing surprise', 'By default, `width` sets only the **content**. Padding and border are added on top:\n\n```\n.box { width: 200px; padding: 20px; border: 5px solid; }\n/* real width: 200 + 40 + 10 = 250px */\n```\nWith `box-sizing: border-box`, `width` includes padding and border. Most projects set it for everything:\n\n```\n*, *::before, *::after { box-sizing: border-box; }\n```'),
        mc('Default box-sizing: `width: 100px; padding: 10px; border: 0;`. How wide is the box?', ['120px', '100px', '110px', '80px'], 0),
        mc('Same box with `box-sizing: border-box`. How wide is it?', ['100px', '120px', '140px', '80px'], 0),
        tf('`max-width: 600px` lets an element shrink on small screens but never grow wider than 600px.', true),
        mc('Which centres a block element that has a width?', ['margin: 0 auto', 'text-align: center', 'padding: auto', 'align: center'], 0, undefined, { codeOptions: true }),
      ]),
      lesson('css-3-3', 'Display types', [
        teach('Block and inline', '- **block** elements (`<div>`, `<p>`, `<h1>`) start on a new line and take the full width\n- **inline** elements (`<span>`, `<a>`, `<strong>`) flow inside text; width and height do not apply\n- `inline-block`: flows like text, but accepts width and height\n- `display: none` hides the element completely'),
        match('Block or inline by default?', [['<p>', 'Block'], ['<span>', 'Inline'], ['<div>', 'Block (full width)'], ['<a>', 'Inline (in the text)']]),
        mc('Which hides an element and removes its space?', ['display: none', 'visibility: visible', 'opacity: 1', 'display: block'], 0, undefined, { codeOptions: true }),
        mc('You set `width: 200px` on a `<span>` but nothing changes. Why?', ['Inline elements ignore width', 'Spans cannot be styled', 'Width needs !important', 'The value must be in rem'], 0),
        fill('Let the links sit side by side but accept padding and width', '.nav a {\n  display: ___;\n}', ['inline-block'], ['none', 'hidden', 'table'], undefined, 'css'),
      ]),
      lesson('css-3-4', 'Corners and shadows', [
        teach('Rounded and raised', '```\n.card {\n  border-radius: 12px;                      /* rounded corners */\n  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3); /* x y blur colour */\n}\n.avatar {\n  border-radius: 50%;  /* a square becomes a circle */\n}\n```'),
        mc('How do you turn a square image into a circle?', ['border-radius: 50%', 'shape: circle', 'border: round', 'radius: 100px'], 0, undefined, { codeOptions: true }),
        mcc('In this shadow, what is 8px?', 'box-shadow: 0 4px 8px rgba(0,0,0,0.3);', ['The blur', 'The x offset', 'The y offset', 'The colour'], 0, undefined, 'css'),
        tf('`opacity: 0.5` makes an element half see-through.', true),
        mc('Which makes only the top corners rounded?', ['border-radius: 10px 10px 0 0', 'border-top: round', 'border-radius: top 10px', 'radius-top: 10px'], 0, undefined, { codeOptions: true }),
      ]),
      challenge('css-05', 'Challenge: The Box Model'),
      challenge('css-06', 'Challenge: Round Coins'),
    ]),
    unit('css-u4', 'Flexbox', 'Line things up in rows and columns.', `
**Key ideas**
- \`display: flex\` on the **parent** lines up its children in a row.
- \`flex-direction: row | column\`, \`flex-wrap: wrap\`, \`gap: 12px\`.
- \`justify-content\` = along the main axis (start, center, space-between...).
- \`align-items\` = across it (stretch, center, flex-start...).
- On children: \`flex: 1\` (grow to fill), \`flex-shrink\`, \`order\`.
- Centre anything: \`display: flex; justify-content: center; align-items: center;\``, [
      lesson('css-4-1', 'Flex containers', [
        teach('Lining up children', 'Put `display: flex` on a **parent**, and its children line up in a row:\n\n```\n.toolbar {\n  display: flex;\n  gap: 10px;\n}\n```\nChange the direction with `flex-direction: column`.'),
        mc('Where does `display: flex` go?', ['On the parent (container)', 'On every child', 'On the <body> only', 'In the HTML'], 0),
        mc('What does `gap` do in a flex container?', ['Adds space between the children', 'Adds space outside the container', 'Makes children smaller', 'Hides empty children'], 0),
        mc('Which stacks the children vertically?', ['flex-direction: column', 'flex-direction: row', 'flex-wrap: wrap', 'display: block-flex'], 0, undefined, { codeOptions: true }),
        fill('Make the menu a row with 16px between items', '.menu {\n  display: ___;\n  ___: 16px;\n}', ['flex', 'gap'], ['block', 'margin', 'grid-gap-all'], undefined, 'css'),
        tf('Only direct children of a flex container become flex items.', true),
      ]),
      lesson('css-4-2', 'Justify and align', [
        teach('Two axes', '- `justify-content`: along the **main** axis (a row: left ↔ right)\n- `align-items`: across it (a row: top ↕ bottom)\n\nValues: `flex-start`, `center`, `flex-end`, `space-between`, `space-around`, `stretch`...'),
        mc('Logo on the left, links on the right. Which value?', ['justify-content: space-between', 'align-items: space-between', 'justify-content: center', 'align-items: stretch'], 0, undefined, { codeOptions: true }),
        mc('In a row, which centres items vertically?', ['align-items: center', 'justify-content: center', 'vertical-align: center', 'text-align: center'], 0, undefined, { codeOptions: true }),
        fill('Centre a box perfectly inside its parent', '.parent {\n  display: ___;\n  justify-content: ___;\n  align-items: ___;\n}', ['flex', 'center', 'center'], ['block', 'space-between', 'stretch'], undefined, 'css'),
        tf('With `flex-direction: column`, `justify-content` works vertically.', true, 'The main axis follows the direction, so it becomes top ↔ bottom.'),
        match('Match the value with the layout', [['flex-start', 'Packed at the start'], ['center', 'Packed in the middle'], ['space-between', 'First and last at the edges'], ['flex-end', 'Packed at the end']]),
      ]),
      lesson('css-4-3', 'Growing and wrapping', [
        teach('Flexible children', '```\n.sidebar { width: 200px; }\n.content { flex: 1; }   /* take all the remaining space */\n\n.gallery {\n  display: flex;\n  flex-wrap: wrap;       /* move to a new line when full */\n}\n```'),
        mc('Which makes a child fill the leftover space?', ['flex: 1', 'width: auto', 'flex-wrap: wrap', 'grow: yes'], 0, undefined, { codeOptions: true }),
        mc('Your cards overflow off the screen in a single row. Which helps?', ['flex-wrap: wrap', 'flex-direction: row', 'justify-content: center', 'align-items: stretch'], 0, undefined, { codeOptions: true }),
        tf('`order: -1` on a flex child moves it to the front visually.', true, 'Careful: screen readers and keyboards still follow the HTML order.'),
        mcc('Two children: `flex: 1` and `flex: 2`. What happens?', '.a { flex: 1; }\n.b { flex: 2; }', ['.b gets twice as much space as .a', 'They are equal', '.a is twice as big', '.b is hidden'], 0, undefined, 'css'),
      ]),
      challenge('css-07', 'Challenge: Banners in a Row'),
      challenge('css-08', 'Challenge: Aligning the Guard'),
    ]),
    unit('css-u5', 'CSS Grid', 'Rows and columns for whole layouts.', `
**Key ideas**
- \`display: grid\` + \`grid-template-columns: repeat(3, 1fr)\` = 3 equal columns.
- \`fr\` = a fraction of the free space. \`gap\` = space between cells.
- Children fill cells in order. \`grid-column: span 2\` makes one span two columns.
- Responsive cards without media queries: \`repeat(auto-fill, minmax(200px, 1fr))\`.
- \`grid-template-areas\` names parts of a layout (header, sidebar, main, footer).
- Grid = 2D (rows and columns). Flexbox = 1D (a row or a column).`, [
      lesson('css-5-1', 'Grid basics', [
        teach('Rows and columns', '```\n.gallery {\n  display: grid;\n  grid-template-columns: repeat(3, 1fr);\n  gap: 10px;\n}\n```\n`1fr` means "one share of the free space". `repeat(3, 1fr)` is the same as `1fr 1fr 1fr`.'),
        mc('How many columns does `grid-template-columns: 1fr 1fr 1fr 1fr` make?', ['4', '1', '3', '0'], 0),
        mc('`grid-template-columns: 200px 1fr`. What happens?', ['A fixed 200px column, and one column that takes the rest', 'Two equal columns', 'One column 201px wide', 'An error'], 0),
        mcc('Which column is the widest?', 'grid-template-columns: 1fr 2fr 1fr;', ['The middle one', 'The first one', 'The last one', 'All equal'], 0, undefined, 'css'),
        fill('3 equal columns', '.board {\n  display: grid;\n  grid-template-columns: ___(3, ___);\n}', ['repeat', '1fr'], ['times', '3fr', 'auto-flex'], undefined, 'css'),
        match('Match the word with its meaning', [['Grid', 'Rows and columns (2D)'], ['Flexbox', 'One row or one column (1D)'], ['fr', 'A share of the free space'], ['gap', 'Space between cells']]),
      ]),
      lesson('css-5-2', 'Spanning and areas', [
        teach('Bigger cells', '```\n.featured { grid-column: span 2; }   /* two columns wide */\n```\nName areas for a full layout:\n\n```\n.page {\n  display: grid;\n  grid-template-columns: 200px 1fr;\n  grid-template-areas:\n    "header header"\n    "side   main";\n}\nheader { grid-area: header; }\n```'),
        mc('Which makes an item two columns wide?', ['grid-column: span 2', 'width: 2fr', 'columns: 2', 'grid-row: span 2'], 0, undefined, { codeOptions: true }),
        tf('`grid-template-areas` lets you draw the layout with names.', true),
        mc('`repeat(auto-fill, minmax(200px, 1fr))` creates...', ['As many columns as fit, each at least 200px wide', 'Exactly 200 columns', 'One column of 200px', 'Rows instead of columns'], 0),
        mc('In `grid-template-areas: "header header" "side main";`, how many columns are there?', ['2', '1', '3', '4'], 0),
      ]),
      challenge('css-09', 'Challenge: The Castle Grid'),
    ]),
    unit('css-u6', 'Cascade, States and Animation', 'Which rule wins, hover effects, transitions and variables.', `
**Key ideas**
- **Cascade**: when rules conflict, the more **specific** selector wins (inline > id > class > tag); if equal, the **later** rule wins.
- Some properties are **inherited** by children (color, font); others are not (border, padding).
- Pseudo-classes: \`:hover\`, \`:focus-visible\`, \`:first-child\`, \`:nth-child(2)\`, \`:not(.x)\`.
- Pseudo-elements: \`::before\`, \`::after\` (with \`content\`), \`::placeholder\`.
- \`transition: all 0.3s\` animates changes; \`transform: scale(1.1) rotate(5deg) translateY(-4px)\`.
- Custom properties: \`:root { --gold: #e8a92b; }\` then \`color: var(--gold);\``, [
      lesson('css-6-1', 'Which rule wins?', [
        teach('The cascade', 'When two rules style the same element:\n1. The more **specific** selector wins: id `#x` > class `.x` > tag `p`\n2. If they are equally specific, the **last** one wins\n\n```\np { color: blue; }\n.note { color: green; }   /* wins for <p class="note"> */\n```'),
        mcc('What colour is `<p class="note">`?', 'p { color: blue; }\n.note { color: green; }', ['green', 'blue', 'black', 'a mix'], 0, 'A class is more specific than a tag.', 'css'),
        mcc('What colour is `<h1>`?', 'h1 { color: red; }\nh1 { color: gold; }', ['gold', 'red', 'black', 'orange'], 0, 'Same specificity, so the later rule wins.', 'css'),
        mcc('What colour is `<p id="intro" class="note">`?', '#intro { color: purple; }\n.note { color: green; }', ['purple', 'green', 'black', 'blue'], 0, 'An id beats a class, even though the class rule comes later.', 'css'),
        teach('Inheritance', 'Some properties pass down from parent to children: `color`, `font-family`, `font-size`, `line-height`...\n\nOthers do not: `border`, `padding`, `margin`, `background`.\n\n```\nbody { font-family: Georgia; }   /* every element inside uses Georgia */\n```'),
        tf('Setting `color` on `body` changes the text colour of paragraphs inside it.', true),
        tf('Setting `border` on a `<div>` also gives all its children a border.', false),
        mc('Why should you avoid `!important`?', ['It overrides the cascade and makes styles hard to change later', 'It is not valid CSS', 'It slows down the page a lot', 'Browsers ignore it'], 0),
      ]),
      lesson('css-6-2', 'Pseudo-classes and pseudo-elements', [
        teach('Special states', '```\na:hover { color: gold; }            /* mouse over */\nbutton:focus-visible { outline: 3px solid; }  /* keyboard focus */\nli:first-child { font-weight: bold; }\nli:nth-child(2) { color: red; }      /* the second one */\ntr:nth-child(even) { background: #eee; }\n```\nPseudo-**elements** add content:\n\n```\n.new::before { content: "★ "; }\n```'),
        match('Match the selector with when it applies', [[':hover', 'Mouse over it'], [':focus-visible', 'Keyboard focus'], [':first-child', 'First in its parent'], [':nth-child(3)', 'Third in its parent']]),
        mc('Which styles every other table row (zebra stripes)?', ['tr:nth-child(even)', 'tr:hover', 'tr::before', 'tr.even-child'], 0, undefined, { codeOptions: true }),
        mc('What does `::before` need to show anything?', ['A content property', 'A class', 'JavaScript', 'An id'], 0),
        fill('Make links gold when the mouse is over them', 'a___ {\n  color: gold;\n}', [':hover'], ['::hover', '.hover', '#hover'], undefined, 'css'),
        tf('You should style `:focus-visible` so keyboard users can see where they are.', true),
      ]),
      lesson('css-6-3', 'Transitions and transforms', [
        teach('Smooth magic', '```\n.rune {\n  transition: transform 0.3s, background-color 0.3s;\n}\n.rune:hover {\n  transform: scale(1.1);\n  background-color: purple;\n}\n```\n`transform` can `scale()`, `rotate()` and `translate()` (move) elements without affecting the layout.'),
        match('Match the transform with its effect', [['scale(1.2)', '20% bigger'], ['rotate(45deg)', 'Turned'], ['translateY(-5px)', 'Moved up 5px'], ['scale(0.5)', 'Half size']]),
        mc('Where should the `transition` property go?', ['On the normal state (.rune), so it animates both ways', 'Only on :hover', 'On the <body>', 'In the HTML'], 0),
        mc('Which is cheapest for the browser to animate?', ['transform and opacity', 'width and height', 'margin and padding', 'font-size'], 0),
        tf('`@keyframes` lets you create animations with many steps.', true),
        mc('How should you respect users who get motion sick?', ['Use @media (prefers-reduced-motion: reduce) to tone down animation', 'Make animations faster', 'Add more animations', 'Only animate colours'], 0),
      ]),
      lesson('css-6-4', 'Custom properties', [
        teach('Variables in CSS', '```\n:root {\n  --royal: #3b2a8f;\n  --radius: 12px;\n}\n.button {\n  background: var(--royal);\n  border-radius: var(--radius);\n}\n```\nChange the variable once and every use updates. Great for themes like dark mode.'),
        fill('Use the --gold variable', 'h1 {\n  color: ___(--gold);\n}', ['var'], ['use', 'get', '$'], undefined, 'css'),
        mc('Where are global custom properties usually defined?', [':root', 'body::before', '#variables', '*::var'], 0, undefined, { codeOptions: true }),
        tf('Custom property names start with two dashes.', true),
        mc('What is a big advantage of custom properties?', ['Change a value in one place and everything updates', 'They make CSS files smaller than 1KB', 'They replace HTML', 'They only work in one browser'], 0),
      ]),
      challenge('css-10', 'Challenge: Hover Enchantments'),
      challenge('css-11', 'Challenge: The Royal Colour'),
    ]),
    unit('css-u7', 'Positioning and Layers', 'Relative, absolute, fixed, sticky and z-index.', `
**Key ideas**
- \`position: static\` is the default.
- \`relative\`: moves from its normal place with \`top/left\`; also becomes the anchor for absolute children.
- \`absolute\`: removed from the flow, placed relative to the nearest positioned ancestor.
- \`fixed\`: stuck to the screen (stays when scrolling). \`sticky\`: normal until it reaches an edge, then sticks.
- \`z-index\` controls which positioned element is on top (bigger = closer to you).`, [
      lesson('css-7-1', 'Relative and absolute', [
        teach('Placing things exactly', '```\n.card { position: relative; }\n.badge {\n  position: absolute;\n  top: 8px;\n  right: 8px;   /* top-right corner of .card */\n}\n```\n`absolute` elements are placed relative to the nearest ancestor that has a `position` other than `static`.'),
        mc('A badge should sit in the top-right corner of a card. What does the card need?', ['position: relative', 'display: none', 'position: fixed', 'z-index: -1'], 0, undefined, { codeOptions: true }),
        tf('An `absolute` element still takes up space in the normal flow.', false, 'It is removed from the flow; other elements act as if it is not there.'),
        mc('`position: relative; top: 10px;` does what?', ['Moves the element 10px down from its normal place', 'Moves it to the top of the page', 'Sticks it to the screen', 'Nothing'], 0),
        fill('Put the badge 8px from the top and right of its card', '.badge {\n  position: ___;\n  top: 8px;\n  ___: 8px;\n}', ['absolute', 'right'], ['static', 'left-edge', 'center'], undefined, 'css'),
      ]),
      lesson('css-7-2', 'Fixed, sticky and layers', [
        teach('Stay on screen', '- `fixed`: always at the same place on the screen, even when scrolling (chat buttons, cookie banners)\n- `sticky` with `top: 0`: scrolls normally, then sticks at the top (table headers, nav bars)\n- `z-index`: which positioned element is on top (higher = in front)'),
        match('Match the position with its use', [['fixed', 'Chat button in the corner'], ['sticky', 'Header that sticks when you scroll'], ['absolute', 'Badge on a card'], ['static', 'The default']]),
        mcc('Which box is in front?', '.a { position: absolute; z-index: 5; }\n.b { position: absolute; z-index: 50; }', ['.b', '.a', 'Whichever comes first in HTML', 'Neither'], 0, undefined, 'css'),
        tf('`z-index` only works on elements that are positioned (or flex/grid children).', true),
        mc('A sticky header also needs...', ['top: 0 (where to stick)', 'z-index: -1', 'display: inline', 'position: static'], 0),
      ]),
    ]),
    unit('css-u8', 'Responsive Design', 'Pages that look great on phones, tablets and desktops.', `
**Key ideas**
- Always include \`<meta name="viewport" content="width=device-width, initial-scale=1">\`.
- Media queries: \`@media (max-width: 600px) { ... }\` applies styles on small screens.
- **Mobile-first**: write base styles for phones, then add \`@media (min-width: 768px)\` for bigger screens.
- Fluid sizes: \`%\`, \`vw\`, \`max-width: 100%\` on images, \`clamp(1rem, 4vw, 2rem)\`.
- Test with the DevTools device toolbar.`, [
      lesson('css-8-1', 'Media queries', [
        teach('CSS that adapts', '```\n.rooms { grid-template-columns: repeat(3, 1fr); }\n\n@media (max-width: 600px) {\n  .rooms { grid-template-columns: 1fr; }\n}\n```\nInside the media query, rules only apply when the screen is **600px wide or less**.'),
        mc('`@media (max-width: 600px)` applies when the screen is...', ['600px wide or narrower', 'Wider than 600px', 'Exactly 600px', 'Printed'], 0),
        mc('`@media (min-width: 768px)` applies when the screen is...', ['768px wide or wider', 'Narrower than 768px', 'A phone', 'In portrait mode only'], 0),
        teach('Mobile-first', 'Most visits come from phones. A common approach: write styles for **small screens first**, then add `min-width` media queries for bigger screens:\n\n```\n.grid { display: grid; grid-template-columns: 1fr; }\n@media (min-width: 768px) {\n  .grid { grid-template-columns: 1fr 1fr 1fr; }\n}\n```'),
        tf('In mobile-first CSS, the styles outside any media query are for small screens.', true),
        fill('Switch to one column on screens 500px or narrower', '___ (max-width: ___) {\n  .cards { grid-template-columns: 1fr; }\n}', ['@media', '500px'], ['@screen', '500', '@if'], undefined, 'css'),
        mc('Your page looks zoomed out on phones even with media queries. What is missing?', ['The viewport meta tag', 'A CSS reset', 'JavaScript', 'A bigger font'], 0),
      ]),
      lesson('css-8-2', 'Fluid layouts', [
        teach('Sizes that flow', '```\nimg { max-width: 100%; height: auto; }   /* never wider than its box */\n.hero { height: 60vh; }                  /* 60% of the screen height */\nh1 { font-size: clamp(1.5rem, 5vw, 3rem); } /* min, preferred, max */\n```'),
        match('Match the unit', [['vw', '1% of the screen width'], ['vh', '1% of the screen height'], ['%', 'Part of the parent'], ['fr', 'Share of free grid space']]),
        mc('Which stops images from overflowing small screens?', ['img { max-width: 100%; }', 'img { width: 2000px; }', 'img { display: inline; }', 'img { float: left; }'], 0, undefined, { codeOptions: true }),
        mcc('What does clamp do here?', 'font-size: clamp(1rem, 4vw, 2rem);', ['Grows with the screen, but stays between 1rem and 2rem', 'Always 4vw', 'Always 2rem', 'Picks a random size'], 0, undefined, 'css'),
        tf('You can test many screen sizes with the DevTools device toolbar.', true),
      ]),
      challenge('css-12', 'Challenge: Shapeshifting Screens'),
      challenge('css-13', 'Project: The Royal Heraldry'),
    ]),
  ],
};
