// Quality challenges: accessibility.
import type { WebLesson } from '../types';
import { txt } from '../helpers';

const broken = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Join the Guild</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <h3>Join the Guild</h3>
  <img src="shield.svg">
  <form>
    <input id="name" placeholder="Your name">
    <input id="email" type="email" placeholder="Email">
    <div class="btn" onclick="alert('Joined!')">Join</div>
  </form>
</body>
</html>
`;

export const qualityLessons: WebLesson[] = [
  {
    id: 'qa-01', kingdom: 'html', kind: 'web', mode: 'html', region: 'Accessibility', xp: 100,
    title: 'Open the Gates for Everyone',
    concepts: ['accessibility audit', 'lang', 'headings', 'alt', 'labels', 'buttons'],
    story: 'A knight who uses a screen reader cannot join the guild: the sign-up page is full of barriers. Fix every one of them.',
    learn: `An **accessibility audit** checks a page for barriers. Common fixes:
- \`<html lang="en">\` so screen readers use the right voice
- start with an \`<h1>\` (headings in order)
- \`alt\` text on meaningful images
- a \`<label for>\` for every input (placeholders are not labels)
- a real \`<button>\` instead of a clickable \`<div>\` (works with keyboard and screen readers)`,
    task: 'Fix the page: add `lang="en"`, make the heading an `<h1>`, give the shield image alt text, add a label for each input, and replace the clickable div with a `<button>`.',
    sage: 'Tools like Lighthouse (in Chrome DevTools) and axe find many problems automatically, but not all. Also try your page with only the keyboard (Tab, Enter, Space) and with a screen reader (VoiceOver on Mac, NVDA on Windows).',
    hints: ['`<html lang="en">`, `<h1>Join the Guild</h1>`, `<img src="shield.svg" alt="The guild shield">`', 'For each input: `<label for="name">Your name</label>`. The button: `<button>Join</button>`.'],
    files: [{ name: 'index.html', lang: 'html', code: broken }, { name: 'style.css', lang: 'css', code: 'body { font-family: system-ui, sans-serif; padding: 16px; }\nlabel, input { display: block; margin: 6px 0; }\n.btn, button { display: inline-block; padding: 6px 14px; background: #4e9f3d; color: white; border: 0; border-radius: 6px; }\nimg { width: 60px; }\n', readonly: true }],
    solution: { 'index.html': broken.replace('<html>', '<html lang="en">').replace('<h3>Join the Guild</h3>', '<h1>Join the Guild</h1>').replace('<img src="shield.svg">', '<img src="shield.svg" alt="The guild shield">').replace('<input id="name" placeholder="Your name">', '<label for="name">Your name</label>\n    <input id="name" placeholder="Your name">').replace('<input id="email" type="email" placeholder="Email">', '<label for="email">Email</label>\n    <input id="email" type="email" placeholder="Email">').replace(`<div class="btn" onclick="alert('Joined!')">Join</div>`, '<button>Join</button>') },
    checks: [
      { label: 'The page has lang="en"', test: (c) => (c.doc.documentElement.getAttribute('lang') ?? '').startsWith('en') },
      { label: 'The main heading is an <h1>', test: (c) => txt(c.$('h1')).length > 0 && !c.$('h3') },
      { label: 'The shield image has alt text', test: (c) => (c.$('img')?.getAttribute('alt') ?? '').trim().length >= 3 },
      { label: 'Both inputs have a connected <label>', test: (c) => ['name', 'email'].every((id) => !!c.doc.querySelector(`label[for="${id}"]`)) },
      { label: 'A real <button> replaces the clickable div', test: (c) => !!c.$('form button') && !c.$('div[onclick]') },
    ],
  },
];
