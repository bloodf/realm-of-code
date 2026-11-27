// Fetch challenges against the realm's mock REST API (https://api.realm.dev).
import type { ConsoleLesson } from '../types';
import { uses } from '../helpers';
import { eq } from '../../runners/format';

const API = `The realm has a practice API at \`https://api.realm.dev\`:
- \`GET /knights\` → all knights (\`?house=Lovelace\` filters)
- \`GET /knights/:id\` → one knight, or **404**
- \`POST /knights\` → create a knight (JSON body with \`name\`), answers **201**
- \`GET /quests\` → all quests`;

export const apiLessons: ConsoleLesson[] = [
  {
    id: 'api-01', kingdom: 'js', kind: 'console', lang: 'js', libs: ['fetch'], region: 'Fetching Data', xp: 80,
    title: 'Summon the Knights',
    concepts: ['fetch', 'await', 'res.json()'],
    story: 'The royal archive has an API. Send a raven (a request) and list every knight in the realm.',
    learn: `${API}

\`\`\`
const res = await fetch("https://api.realm.dev/knights");
const knights = await res.json();   // turn the JSON text into objects
\`\`\``,
    task: 'In `main`, fetch all knights and print each knight\'s **name** on its own line.',
    sage: 'Two awaits are needed: the first waits for the response headers, the second (`res.json()`) waits for the body to download and be parsed. In the browser DevTools, the **Network** tab shows every request, its status and its response.',
    hints: ['`const res = await fetch("https://api.realm.dev/knights");`', 'Then `const knights = await res.json(); for (const k of knights) console.log(k.name);`'],
    starter: 'async function main() {\n  // fetch the knights and print their names\n}\n\nmain();\n',
    solution: 'async function main() {\n  const res = await fetch("https://api.realm.dev/knights");\n  const knights = await res.json();\n  for (const k of knights) {\n    console.log(k.name);\n  }\n}\n\nmain();\n',
    checks: [
      { label: 'Fetches https://api.realm.dev/knights', test: (c) => c.logs.some((l) => l.startsWith('🕊 GET https://api.realm.dev/knights')) },
      { label: 'Prints Ada, Bors and Cyra', test: (c) => eq(c.logs.filter((l) => !l.startsWith('🕊')), ['Ada', 'Bors', 'Cyra']) },
      { label: 'Uses await and res.json()', test: (c) => uses(c.code, /await\s+fetch/) && uses(c.code, /\.json\(\)/) },
    ],
  },
  {
    id: 'api-02', kingdom: 'js', kind: 'console', lang: 'js', libs: ['fetch'], region: 'Fetching Data', xp: 85,
    title: 'Knight Not Found',
    concepts: ['res.ok', 'status codes', 'error handling'],
    story: 'Not every knight exists. A careless scribe asked for knight number 99 and the whole archive crashed. Handle it gracefully.',
    learn: `${API}

\`fetch\` does **not** fail on 404 or 500. Check the response yourself:

\`\`\`
const res = await fetch(url);
if (!res.ok) {            // ok is true for status 200-299
  return null;
}
return await res.json();
\`\`\``,
    task: 'Write `async function getKnight(id)` that returns the knight object, or `null` when the API answers with an error status.',
    sage: '`fetch` only rejects (throws) on network failures, like being offline. HTTP errors arrive as normal responses. Many teams wrap fetch in a small helper that throws on `!res.ok`, so errors are never silently ignored.',
    hints: ['``const res = await fetch(`https://api.realm.dev/knights/${id}`);``', '`if (!res.ok) return null; return res.json();`'],
    starter: 'async function getKnight(id) {\n  // fetch one knight, or return null\n}\n\nasync function main() {\n  console.log(await getKnight(2));\n  console.log(await getKnight(99));\n}\n\nmain();\n',
    solution: 'async function getKnight(id) {\n  const res = await fetch(`https://api.realm.dev/knights/${id}`);\n  if (!res.ok) return null;\n  return res.json();\n}\n\nasync function main() {\n  console.log(await getKnight(2));\n  console.log(await getKnight(99));\n}\n\nmain();\n',
    probe: 'const a = await getKnight(2); const b = await getKnight(99); const c = await getKnight(3); return { a, b, c };',
    checks: [
      { label: 'getKnight(2) returns Bors', test: (c) => (c.values.a as { name?: string } | null)?.name === 'Bors' },
      { label: 'getKnight(3) returns Cyra', test: (c) => (c.values.c as { name?: string } | null)?.name === 'Cyra' },
      { label: 'getKnight(99) returns null', test: (c) => c.values.b === null },
      { label: 'Checks res.ok (or res.status)', test: (c) => uses(c.code, /res\.ok|\.status/) },
    ],
  },
  {
    id: 'api-03', kingdom: 'js', kind: 'console', lang: 'js', libs: ['fetch'], region: 'Fetching Data', xp: 90,
    title: 'Recruit a Knight',
    concepts: ['POST', 'request body', 'headers', 'JSON.stringify'],
    story: 'A new squire wants to join. Send the archive a POST request to create their record.',
    learn: `${API}

To send data, pass options to \`fetch\`:

\`\`\`
const res = await fetch("https://api.realm.dev/knights", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ name: "Dax", house: "Ironhill" }),
});
const created = await res.json();   // the new knight, with an id
\`\`\``,
    task: 'Write `async function recruit(name, house)` that POSTs the new knight as JSON and returns the created knight from the response.',
    sage: 'The `Content-Type` header tells the server how to read the body. APIs usually answer a successful creation with **201 Created** and return the new resource, including the id the server generated.',
    hints: ['Use `method: "POST"`, a `headers` object and `body: JSON.stringify({ name, house })`.', 'Finish with `return res.json();`'],
    starter: 'async function recruit(name, house) {\n  // POST the knight and return the created one\n}\n\nrecruit("Dax", "Ironhill").then((k) => console.log(k));\n',
    solution: 'async function recruit(name, house) {\n  const res = await fetch("https://api.realm.dev/knights", {\n    method: "POST",\n    headers: { "Content-Type": "application/json" },\n    body: JSON.stringify({ name, house }),\n  });\n  return res.json();\n}\n\nrecruit("Dax", "Ironhill").then((k) => console.log(k));\n',
    probe: 'const k = await recruit("Eryn", "Lovelace"); return { k };',
    checks: [
      { label: 'Sends a POST request', test: (c) => c.logs.some((l) => l.startsWith('🕊 POST https://api.realm.dev/knights')) },
      { label: 'Returns the created knight (with a new id)', test: (c) => { const k = c.values.k as { id?: number; name?: string; house?: string } | null; return !!k && typeof k.id === 'number' && k.id >= 4 && k.name === 'Eryn' && k.house === 'Lovelace'; } },
      { label: 'Sends JSON with a Content-Type header', test: (c) => uses(c.code, /JSON\.stringify/) && uses(c.code, /Content-Type/i) },
    ],
  },
];
