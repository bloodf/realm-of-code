// Node.js + Express challenges, run with a mini Express inside the browser.
import type { ConsoleLesson } from '../types';
import { uses } from '../helpers';
import { eq } from '../../runners/format';

interface Res { status: number; body: unknown; headers: Record<string, string> }
const r = (v: unknown) => (v ?? { status: 0, body: null, headers: {} }) as Res;

const EXPRESS = `This realm runs a mini **Express** in your browser. Write the server as usual; the game sends test requests to \`app\` and shows them in the console:

\`\`\`
const express = require("express");
const app = express();

app.get("/hello", (req, res) => {
  res.send("Hail!");
});
\`\`\``;

const KNIGHTS = 'const knights = [\n  { id: 1, name: "Ada", house: "Lovelace" },\n  { id: 2, name: "Bors", house: "Ironhill" },\n  { id: 3, name: "Cyra", house: "Lovelace" },\n];\n';

export const nodeLessons: ConsoleLesson[] = [
  {
    id: 'node-01', kingdom: 'js', kind: 'console', lang: 'js', libs: ['express'], region: 'Express Routes', xp: 80,
    title: 'Hello, Tavern',
    concepts: ['express()', 'app.get', 'res.send', 'res.json'],
    story: 'The Tavern of Couriers opens its doors. Hungry travellers (HTTP requests) are already queuing. Build the server that answers them.',
    learn: `${EXPRESS}

- \`res.send(text)\` answers with text
- \`res.json(data)\` answers with JSON`,
    task: 'Create the app. `GET /` answers with the text **Welcome to the tavern!** and `GET /menu` answers with a JSON **array of at least 3 dishes** (strings).',
    sage: 'In a real project you would finish with `app.listen(3000)` and visit http://localhost:3000. Express is the most used Node.js web framework; newer ones (Fastify, Hono, NestJS) use very similar ideas: routes, handlers, request and response.',
    hints: ['`app.get("/", (req, res) => { res.send("Welcome to the tavern!"); });`', '`app.get("/menu", (req, res) => { res.json(["Stew", "Bread", "Pie"]); });`'],
    starter: 'const express = require("express");\nconst app = express();\n\n// your routes here\n\napp.listen(3000);\n',
    solution: 'const express = require("express");\nconst app = express();\n\napp.get("/", (req, res) => {\n  res.send("Welcome to the tavern!");\n});\n\napp.get("/menu", (req, res) => {\n  res.json(["Dragon pepper stew", "Honey bread", "Apple pie"]);\n});\n\napp.listen(3000);\n',
    probe: 'return { a: await request(app, "GET", "/"), b: await request(app, "GET", "/menu"), c: await request(app, "GET", "/nope") };',
    checks: [
      { label: 'GET / answers "Welcome to the tavern!"', test: (c) => r(c.values.a).status === 200 && r(c.values.a).body === 'Welcome to the tavern!' },
      { label: 'GET /menu answers a JSON array of 3+ dishes', test: (c) => { const b = r(c.values.b); return b.status === 200 && Array.isArray(b.body) && (b.body as unknown[]).length >= 3 && b.headers['content-type'] === 'application/json'; } },
      { label: 'Unknown routes give 404 (Express does this for you)', test: (c) => r(c.values.c).status === 404 },
    ],
  },
  {
    id: 'node-02', kingdom: 'js', kind: 'console', lang: 'js', libs: ['express'], region: 'Express Routes', xp: 85,
    title: 'Route Parameters',
    concepts: ['req.params', 'res.status', '404'],
    story: 'Couriers ask about specific knights by number: "Tell me about knight 2!"',
    learn: `${EXPRESS}

A \`:name\` in the path is a **route parameter**:

\`\`\`
app.get("/knights/:id", (req, res) => {
  const id = Number(req.params.id);   // params are strings!
  ...
  res.status(404).json({ error: "Not found" });
});
\`\`\``,
    task: '`GET /knights/:id` answers with the matching knight as JSON, or status **404** with `{ error: "Knight not found" }`.',
    sage: 'Everything in a URL is text, so `req.params.id` is `"2"`, not `2`. Forgetting `Number()` makes `===` comparisons fail: one of the most common Express bugs.',
    hints: ['`const knight = knights.find((k) => k.id === Number(req.params.id));`', '`if (!knight) return res.status(404).json({ error: "Knight not found" }); res.json(knight);`'],
    starter: 'const express = require("express");\nconst app = express();\n\n' + KNIGHTS + '\n// GET /knights/:id\n',
    solution: 'const express = require("express");\nconst app = express();\n\n' + KNIGHTS + '\napp.get("/knights/:id", (req, res) => {\n  const knight = knights.find((k) => k.id === Number(req.params.id));\n  if (!knight) {\n    return res.status(404).json({ error: "Knight not found" });\n  }\n  res.json(knight);\n});\n',
    probe: 'return { a: await request(app, "GET", "/knights/2"), b: await request(app, "GET", "/knights/9") };',
    checks: [
      { label: 'GET /knights/2 answers Bors', test: (c) => r(c.values.a).status === 200 && (r(c.values.a).body as { name?: string })?.name === 'Bors' },
      { label: 'GET /knights/9 answers 404', test: (c) => r(c.values.b).status === 404 },
      { label: '...with { error: "Knight not found" }', test: (c) => eq(r(c.values.b).body, { error: 'Knight not found' }) },
    ],
  },
  {
    id: 'node-03', kingdom: 'js', kind: 'console', lang: 'js', libs: ['express'], region: 'Express Routes', xp: 85,
    title: 'Query Strings',
    concepts: ['req.query', 'filtering'],
    story: 'Couriers want lists: "All the knights of House Lovelace, please."',
    learn: `${EXPRESS}

Options after \`?\` in the URL are the **query string**: \`/knights?house=Lovelace\`. Read them with \`req.query\`:

\`\`\`
req.query.house   // "Lovelace" (or undefined when not given)
\`\`\``,
    task: '`GET /knights` answers all knights, or only those of the house given in `?house=...`.',
    sage: 'Use route params for **identity** (`/knights/2`) and query strings for **options** like filters, sorting and pagination (`/knights?house=Lovelace&page=2`).',
    hints: ['`const house = req.query.house;`', '`res.json(house ? knights.filter((k) => k.house === house) : knights);`'],
    starter: 'const express = require("express");\nconst app = express();\n\n' + KNIGHTS + '\n// GET /knights (with optional ?house=)\n',
    solution: 'const express = require("express");\nconst app = express();\n\n' + KNIGHTS + '\napp.get("/knights", (req, res) => {\n  const house = req.query.house;\n  res.json(house ? knights.filter((k) => k.house === house) : knights);\n});\n',
    probe: 'return { all: await request(app, "GET", "/knights"), love: await request(app, "GET", "/knights?house=Lovelace"), none: await request(app, "GET", "/knights?house=Nowhere") };',
    checks: [
      { label: 'GET /knights answers all 3 knights', test: (c) => Array.isArray(r(c.values.all).body) && (r(c.values.all).body as unknown[]).length === 3 },
      { label: '?house=Lovelace answers Ada and Cyra', test: (c) => eq((r(c.values.love).body as { name: string }[] | null)?.map?.((k) => k.name), ['Ada', 'Cyra']) },
      { label: 'An unknown house answers an empty array', test: (c) => eq(r(c.values.none).body, []) },
    ],
  },
  {
    id: 'node-04', kingdom: 'js', kind: 'console', lang: 'js', libs: ['express'], region: 'Building REST APIs', xp: 90,
    title: 'Creating Knights',
    concepts: ['POST', 'req.body', 'validation', '201', '400'],
    story: 'New squires arrive with their papers (a JSON body). Register them, but turn away anyone without a name.',
    learn: `${EXPRESS}

\`app.use(express.json())\` reads JSON bodies into \`req.body\`:

\`\`\`
app.use(express.json());
app.post("/knights", (req, res) => {
  const { name, house } = req.body;
  ...
  res.status(201).json(newKnight);
});
\`\`\``,
    task: '`POST /knights` creates a knight from `{ name, house }` with the next id (4, 5, ...), stores it, and answers **201** with it. Without a `name`, answer **400** with `{ error: "name is required" }`.',
    sage: 'Never trust input: always validate on the server, even if the front end validates too. Libraries like **zod** make validation declarative. Status codes matter: 201 for created, 400 for a bad request, 401/403 for auth problems, 404 for missing things.',
    hints: ['`if (!req.body.name) return res.status(400).json({ error: "name is required" });`', '`const knight = { id: knights.length + 1, name, house }; knights.push(knight); res.status(201).json(knight);`'],
    starter: 'const express = require("express");\nconst app = express();\napp.use(express.json());\n\n' + KNIGHTS + '\n// POST /knights\n',
    solution: 'const express = require("express");\nconst app = express();\napp.use(express.json());\n\n' + KNIGHTS + '\napp.post("/knights", (req, res) => {\n  const { name, house } = req.body;\n  if (!name) {\n    return res.status(400).json({ error: "name is required" });\n  }\n  const knight = { id: knights.length + 1, name, house };\n  knights.push(knight);\n  res.status(201).json(knight);\n});\n',
    probe: 'const a = await request(app, "POST", "/knights", { name: "Dax", house: "Ironhill" }); const b = await request(app, "POST", "/knights", { house: "Nowhere" }); const c = await request(app, "POST", "/knights", { name: "Eryn", house: "Lovelace" }); return { a, b, c, count: knights.length };',
    checks: [
      { label: 'Creating Dax answers 201 with id 4', test: (c) => r(c.values.a).status === 201 && eq(r(c.values.a).body, { id: 4, name: 'Dax', house: 'Ironhill' }) },
      { label: 'The next knight gets id 5 and is stored', test: (c) => (r(c.values.c).body as { id?: number })?.id === 5 && c.values.count === 5 },
      { label: 'Missing name answers 400 { error: "name is required" }', test: (c) => r(c.values.b).status === 400 && eq(r(c.values.b).body, { error: 'name is required' }) },
    ],
  },
  {
    id: 'node-06', kingdom: 'js', kind: 'console', lang: 'js', libs: ['express'], region: 'Middleware', xp: 95,
    title: 'Guards at the Treasury',
    concepts: ['middleware', 'next()', 'Authorization header', 'error handlers'],
    story: 'Thieves keep asking for the royal treasury. Post a guard (middleware) that only lets through couriers with the secret token.',
    learn: `${EXPRESS}

**Middleware** runs before route handlers. It can stop the request, or call \`next()\` to let it through:

\`\`\`
function requireToken(req, res, next) {
  if (req.get("Authorization") !== "Bearer dragon-key") {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}
app.get("/treasury", requireToken, (req, res) => { ... });
\`\`\`

An **error handler** has four parameters: \`(err, req, res, next)\`.`,
    task: 'Protect `GET /treasury` (answers `{ gold: 1000 }`) with a middleware: without the header `Authorization: Bearer dragon-key`, answer **401** `{ error: "Unauthorized" }`. Also add an error handler that turns thrown errors into **500** `{ error: err.message }` (the `/explode` route throws).',
    sage: 'Real apps use middleware for logging, authentication (sessions or JWTs), rate limiting, CORS and validation. The order of `app.use` calls matters: middleware runs in the order it was added.',
    hints: ['Pass the middleware before the handler: `app.get("/treasury", requireToken, handler)`.', 'Error handler, added last: `app.use((err, req, res, next) => { res.status(500).json({ error: err.message }); });`'],
    starter: 'const express = require("express");\nconst app = express();\n\nfunction requireToken(req, res, next) {\n  // check the Authorization header\n  next();\n}\n\napp.get("/treasury", (req, res) => {\n  res.json({ gold: 1000 });\n});\n\napp.get("/explode", (req, res) => {\n  throw new Error("The cauldron exploded");\n});\n\n// error handler here\n',
    solution: 'const express = require("express");\nconst app = express();\n\nfunction requireToken(req, res, next) {\n  if (req.get("Authorization") !== "Bearer dragon-key") {\n    return res.status(401).json({ error: "Unauthorized" });\n  }\n  next();\n}\n\napp.get("/treasury", requireToken, (req, res) => {\n  res.json({ gold: 1000 });\n});\n\napp.get("/explode", (req, res) => {\n  throw new Error("The cauldron exploded");\n});\n\napp.use((err, req, res, next) => {\n  res.status(500).json({ error: err.message });\n});\n',
    probe: 'return { no: await request(app, "GET", "/treasury"), bad: await request(app, "GET", "/treasury", undefined, { Authorization: "Bearer goblin" }), yes: await request(app, "GET", "/treasury", undefined, { Authorization: "Bearer dragon-key" }), boom: await request(app, "GET", "/explode") };',
    checks: [
      { label: 'No token: 401 { error: "Unauthorized" }', test: (c) => r(c.values.no).status === 401 && eq(r(c.values.no).body, { error: 'Unauthorized' }) },
      { label: 'Wrong token: 401', test: (c) => r(c.values.bad).status === 401 },
      { label: 'Right token: 200 { gold: 1000 }', test: (c) => r(c.values.yes).status === 200 && eq(r(c.values.yes).body, { gold: 1000 }) },
      { label: 'Errors become 500 { error: "The cauldron exploded" }', test: (c) => r(c.values.boom).status === 500 && eq(r(c.values.boom).body, { error: 'The cauldron exploded' }) },
      { label: 'Uses a 4-parameter error handler', test: (c) => uses(c.code, /\(\s*err\s*,\s*req\s*,\s*res\s*,\s*next\s*\)/) },
    ],
  },
  {
    id: 'node-05', kingdom: 'js', kind: 'console', lang: 'js', libs: ['express'], region: 'The Quest API', xp: 170, boss: true,
    title: 'The Quest API',
    concepts: ['REST', 'CRUD', 'status codes'],
    story: 'The Guild wants a full API for its quest board: list, read, create, update and delete. This is the kind of task junior backend developers get in their first weeks.',
    learn: `${EXPRESS}

A **REST** API maps actions to HTTP methods on one resource:
- list: \`GET /quests\` → 200
- read: \`GET /quests/:id\` → 200 (404 if missing)
- create: \`POST /quests\` → 201
- update: \`PATCH /quests/:id\` → 200
- delete: \`DELETE /quests/:id\` → 204`,
    task: `Build the quest API on the \`quests\` array:
- \`GET /quests\` → all quests
- \`GET /quests/:id\` → one quest, or 404 \`{ error: "Quest not found" }\`
- \`POST /quests\` with \`{ title, reward }\` → 201 and the new quest (\`id\` = next number, \`done: false\`); 400 \`{ error: "title is required" }\` without a title
- \`PATCH /quests/:id\` with e.g. \`{ done: true }\` → 200 and the updated quest (404 if missing)
- \`DELETE /quests/:id\` → 204 (404 if missing)`,
    sage: 'Next steps in a real project: store the data in a database (see the SQL section), add authentication, validate input with a schema, write tests with Supertest, and document the API with OpenAPI/Swagger.',
    hints: ['Write a small helper: `const find = (id) => quests.find((q) => q.id === Number(id));`', 'PATCH: `Object.assign(quest, req.body)`. DELETE: `quests.splice(quests.indexOf(quest), 1); res.sendStatus(204);`'],
    starter: 'const express = require("express");\nconst app = express();\napp.use(express.json());\n\nconst quests = [\n  { id: 1, title: "Slay the dragon", reward: 500, done: false },\n  { id: 2, title: "Find the lost goat", reward: 5, done: true },\n];\nlet nextId = 3;\n\n// your routes\n',
    solution: 'const express = require("express");\nconst app = express();\napp.use(express.json());\n\nconst quests = [\n  { id: 1, title: "Slay the dragon", reward: 500, done: false },\n  { id: 2, title: "Find the lost goat", reward: 5, done: true },\n];\nlet nextId = 3;\n\nconst find = (id) => quests.find((q) => q.id === Number(id));\n\napp.get("/quests", (req, res) => {\n  res.json(quests);\n});\n\napp.get("/quests/:id", (req, res) => {\n  const quest = find(req.params.id);\n  if (!quest) return res.status(404).json({ error: "Quest not found" });\n  res.json(quest);\n});\n\napp.post("/quests", (req, res) => {\n  const { title, reward } = req.body;\n  if (!title) return res.status(400).json({ error: "title is required" });\n  const quest = { id: nextId++, title, reward: reward ?? 0, done: false };\n  quests.push(quest);\n  res.status(201).json(quest);\n});\n\napp.patch("/quests/:id", (req, res) => {\n  const quest = find(req.params.id);\n  if (!quest) return res.status(404).json({ error: "Quest not found" });\n  Object.assign(quest, req.body);\n  res.json(quest);\n});\n\napp.delete("/quests/:id", (req, res) => {\n  const quest = find(req.params.id);\n  if (!quest) return res.status(404).json({ error: "Quest not found" });\n  quests.splice(quests.indexOf(quest), 1);\n  res.sendStatus(204);\n});\n',
    probe: 'const list = await request(app, "GET", "/quests"); const one = await request(app, "GET", "/quests/1"); const miss = await request(app, "GET", "/quests/42"); const made = await request(app, "POST", "/quests", { title: "Guard the bridge", reward: 40 }); const bad = await request(app, "POST", "/quests", { reward: 1 }); const upd = await request(app, "PATCH", "/quests/3", { done: true }); const del = await request(app, "DELETE", "/quests/1"); const gone = await request(app, "GET", "/quests/1"); const delMiss = await request(app, "DELETE", "/quests/99"); const after = await request(app, "GET", "/quests"); return { list, one, miss, made, bad, upd, del, gone, delMiss, after };',
    checks: [
      { label: 'GET /quests lists the 2 quests', test: (c) => Array.isArray(r(c.values.list).body) && (r(c.values.list).body as unknown[]).length === 2 },
      { label: 'GET /quests/1 → the dragon quest; /quests/42 → 404', test: (c) => (r(c.values.one).body as { title?: string })?.title === 'Slay the dragon' && r(c.values.miss).status === 404 && eq(r(c.values.miss).body, { error: 'Quest not found' }) },
      { label: 'POST creates quest 3 (201, done: false)', test: (c) => r(c.values.made).status === 201 && eq(r(c.values.made).body, { id: 3, title: 'Guard the bridge', reward: 40, done: false }) },
      { label: 'POST without a title → 400', test: (c) => r(c.values.bad).status === 400 && eq(r(c.values.bad).body, { error: 'title is required' }) },
      { label: 'PATCH /quests/3 marks it done', test: (c) => r(c.values.upd).status === 200 && (r(c.values.upd).body as { done?: boolean })?.done === true },
      { label: 'DELETE /quests/1 → 204, then it is gone (404); unknown id → 404', test: (c) => r(c.values.del).status === 204 && r(c.values.gone).status === 404 && r(c.values.delMiss).status === 404 && (r(c.values.after).body as unknown[])?.length === 2 },
    ],
  },
];
