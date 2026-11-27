// Section: Quality: accessibility, performance and security.
import type { Course } from '../types';
import { teach, mc, tf, match, order, bug, lesson, unit, challenge } from '../dsl';

export const quality: Course = {
  id: 'quality', title: 'Quality', realm: 'The Watchtower', color: '#6a7d3a', emblem: 'accessibility',
  desc: 'Build things that work for everyone, load fast and stay secure: accessibility, performance and security.',
  units: [
    unit('quality-u1', 'Accessibility', 'WCAG, keyboard users, screen readers and ARIA.', `
**Key ideas**
- **WCAG** guidelines: content must be Perceivable, Operable, Understandable, Robust (POUR).
- Semantic HTML first: real buttons, links, headings, labels, landmarks.
- Everything works with the **keyboard** (Tab, Enter, Space, Esc) and focus is visible.
- Text contrast at least 4.5:1; do not use colour alone to convey meaning.
- ARIA only when HTML cannot express it (\`aria-label\`, \`aria-expanded\`, \`aria-live\`).
- Test with Lighthouse/axe, the keyboard, and a screen reader.`, [
      lesson('quality-1-1', 'WCAG and POUR', [
        teach('Four principles', 'The Web Content Accessibility Guidelines (**WCAG**) are the worldwide standard. Content must be:\n- **Perceivable**: alt text, captions, contrast\n- **Operable**: keyboard access, no traps, enough time\n- **Understandable**: clear labels and errors\n- **Robust**: works with assistive tech (valid, semantic HTML)'),
        match('Match the fix to the principle', [['Alt text on images', 'Perceivable'], ['Works with the keyboard', 'Operable'], ['Clear error messages', 'Understandable'], ['Semantic, valid HTML', 'Robust']]),
        mc('Roughly how many people live with some disability?', ['About 1 in 6 people worldwide', 'Almost nobody', '1 in 1000', 'Only elderly people'], 0, 'The WHO estimates about 1.3 billion people, around 16% of the world.'),
        tf('Accessibility also helps people with temporary problems, like a broken arm or a bright screen in the sun.', true),
      ]),
      lesson('quality-1-2', 'Keyboard and focus', [
        teach('No mouse needed', 'Many people navigate with a keyboard only. Make sure:\n- all controls are reachable with **Tab**, in a logical order\n- the focused element is clearly visible (`:focus-visible` styles, never `outline: none` without a replacement)\n- modals trap focus inside and close with **Esc**\n- custom widgets use real `<button>`s or the right ARIA and key handling'),
        bug('Which line hurts keyboard users?', 'button {\n  background: gold;\n  outline: none;\n}', 3, 'Removing the focus outline hides where keyboard users are. Style `:focus-visible` instead.', 'css'),
        mc('Which element is reachable with Tab and works with Enter by default?', ['<button>', '<div>', '<span>', '<p>'], 0, undefined, { codeOptions: true }),
        tf('A "skip to main content" link helps keyboard users jump past the navigation.', true),
      ]),
      lesson('quality-1-3', 'Screen readers and ARIA', [
        teach('Helping assistive tech', 'Screen readers read the page aloud using its structure: headings, landmarks, labels, roles.\n\nARIA can fill gaps:\n\n```\n<button aria-label="Close">✕</button>\n<button aria-expanded="false">Menu</button>\n<div aria-live="polite">3 items added</div>\n```\nBut **no ARIA is better than bad ARIA**: prefer native elements.'),
        match('Match the attribute', [['aria-label', 'A name when there is no visible text'], ['aria-expanded', 'Whether a menu is open'], ['aria-live', 'Announce updates'], ['alt', 'Describe an image']]),
        mc('An icon-only button "🗑" deletes an item. What does it need?', ['aria-label="Delete item"', 'A bigger icon', 'role="img"', 'Nothing'], 0),
      ]),
      challenge('qa-01', 'Challenge: Open the Gates for Everyone'),
    ]),
    unit('quality-u2', 'Performance', 'Fast pages: Core Web Vitals, images, bundles and caching.', `
**Key ideas**
- Speed matters: slow pages lose users and rank lower in search.
- **Core Web Vitals**: LCP (main content loads fast), INP (responds to input fast), CLS (layout does not jump).
- Images: right size, modern formats (WebP/AVIF), \`loading="lazy"\`, width/height set.
- JavaScript: ship less, split code, lazy-load routes; minify; avoid huge libraries for small jobs.
- Caching and CDNs serve files close to users. Measure with **Lighthouse**.`, [
      lesson('quality-2-1', 'Why speed matters', [
        teach('Every second counts', 'Users leave slow sites, and search engines rank fast sites higher. Google measures **Core Web Vitals**:\n- **LCP** (Largest Contentful Paint): how fast the main content appears\n- **INP** (Interaction to Next Paint): how fast the page reacts to clicks\n- **CLS** (Cumulative Layout Shift): how much things jump around\n\nMeasure with **Lighthouse** in Chrome DevTools.'),
        match('Match the metric', [['LCP', 'Main content loads'], ['INP', 'Reacts to input'], ['CLS', 'Layout jumps'], ['Lighthouse', 'Tool that measures them']]),
        mc('Text jumps down while an image loads. Which metric suffers?', ['CLS', 'LCP', 'INP', 'DNS'], 0),
        mc('How do you prevent that jump?', ['Set width and height on images', 'Use more JavaScript', 'Remove CSS', 'Use a bigger font'], 0),
      ]),
      lesson('quality-2-2', 'Making pages faster', [
        teach('Quick wins', '- Resize and compress images; use **WebP/AVIF**; add `loading="lazy"` for images below the fold\n- Ship less JavaScript: **code splitting**, lazy-load pages, drop unused libraries\n- Let the build tool **minify** and bundle\n- Serve through a **CDN** with caching headers\n- Avoid blocking the main thread with heavy work'),
        mc('Which image setting delays loading images that are off-screen?', ['loading="lazy"', 'alt="lazy"', 'decoding="never"', 'src="later"'], 0, undefined, { codeOptions: true }),
        mc('A 4000px-wide photo is shown at 400px. What should you do?', ['Serve a smaller version of the image', 'Nothing, browsers handle it', 'Make it a PNG', 'Set opacity to 0.5'], 0),
        tf('Adding a huge library to format one date can slow down your whole app.', true),
        order('Order a performance fix the professional way', ['Measure with Lighthouse', 'Find the biggest problem', 'Fix it', 'Measure again'], undefined, 'text'),
      ]),
    ]),
    unit('quality-u3', 'Security', 'XSS, secrets, HTTPS, CORS, SQL injection and passwords.', `
**Key ideas**
- **XSS**: never insert user input as HTML (\`innerHTML\`); use \`textContent\` / framework escaping.
- **Secrets** (API keys, passwords) never go in front-end code or Git; use environment variables on the server.
- Always **HTTPS**. Validate every input on the **server**.
- **SQL injection**: never build SQL by gluing strings; use parameterised queries.
- Store passwords with a slow hash (**bcrypt**/argon2), never in plain text.
- OWASP Top 10 lists the most common web security risks.`, [
      lesson('quality-3-1', 'XSS and safe output', [
        teach('Never trust user input', '**Cross-site scripting (XSS)**: an attacker gets their script to run on your page, for example by writing it into a comment:\n\n```\ncomment.innerHTML = userText;   // ✗ runs <script> or onerror=...\ncomment.textContent = userText; // ✓ shown as plain text\n```\nReact, Vue and Svelte escape text by default. Be careful with `dangerouslySetInnerHTML`, `v-html` and `{@html}`.'),
        bug('Which line is vulnerable to XSS?', 'const name = new URLSearchParams(location.search).get("name");\nconst title = document.querySelector("h1");\ntitle.innerHTML = "Hail, " + name;', 3, 'The name comes from the URL, so anyone can craft a link with HTML/JS in it. Use `textContent`.'),
        mc('Which is safe for showing a user\'s comment?', ['element.textContent = comment', 'element.innerHTML = comment', 'document.write(comment)', 'eval(comment)'], 0, undefined, { codeOptions: true }),
        tf('Validating input in the browser is enough to stop attacks.', false, 'Attackers can skip the browser entirely. The server must validate too.'),
      ]),
      lesson('quality-3-2', 'Secrets, HTTPS and CORS', [
        teach('Guarding the keys', '- Secrets live in **environment variables** on the server (`process.env.API_KEY`), loaded from a `.env` file that is in `.gitignore`\n- Anything in front-end code is public\n- **HTTPS** encrypts traffic; browsers mark HTTP pages "Not secure"\n- **CORS** is a browser rule: a page can only read responses from another origin if that server allows it'),
        mc('Where should a payment API secret key live?', ['In an environment variable on the server', 'In a React component', 'In localStorage', 'In the HTML comments'], 0),
        mc('You accidentally pushed an API key to GitHub. What do you do?', ['Revoke/rotate the key immediately, then remove it from the code', 'Delete the commit and hope', 'Make the repo private and forget it', 'Nothing, nobody will notice'], 0, 'Bots find leaked keys within minutes. A leaked key must be treated as compromised.'),
        tf('CORS protects servers from all attacks.', false, 'CORS is a browser rule about reading responses. Servers still need authentication and validation.'),
      ]),
      lesson('quality-3-3', 'Injection and passwords', [
        teach('Two classic disasters', '**SQL injection**: building SQL from user input lets attackers change the query:\n\n```\n// ✗ dangerous\ndb.query("SELECT * FROM users WHERE name = \'" + name + "\'");\n// ✓ parameterised\ndb.query("SELECT * FROM users WHERE name = ?", [name]);\n```\n**Passwords** must be stored as slow, salted hashes (**bcrypt**, **argon2**), never in plain text.'),
        bug('Which line allows SQL injection?', 'app.get("/user", async (req, res) => {\n  const sql = "SELECT * FROM users WHERE id = " + req.query.id;\n  res.json(await db.query(sql));\n});', 2, 'The id from the URL is glued into the SQL. Use a parameter: `db.query("... WHERE id = ?", [req.query.id])`.'),
        mc('How should passwords be stored?', ['As slow salted hashes (bcrypt or argon2)', 'In plain text', 'Encrypted with a key in the code', 'In localStorage'], 0),
        match('Match the attack with its defence', [['XSS', 'Escape output (textContent)'], ['SQL injection', 'Parameterised queries'], ['Stolen password database', 'Hash passwords with bcrypt'], ['Leaked API key', 'Keep secrets in env variables']]),
        tf('The OWASP Top 10 is a well-known list of the most common web security risks.', true),
      ]),
    ]),
  ],
};
