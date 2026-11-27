// Section: Node.js and Express.
import type { Course } from '../types';
import { teach, mc, mcc, tf, fill, match, order, lesson, unit, challenge } from '../dsl';

export const nodeCourse: Course = {
  id: 'node', title: 'Node.js', realm: 'The Tavern of Couriers', color: '#5c8a3a', emblem: 'server',
  desc: 'JavaScript on the server: modules, Express routes, REST APIs, middleware, authentication and deployment.',
  units: [
    unit('node-u1', 'Node.js Basics', 'JavaScript outside the browser.', `
**Key ideas**
- **Node.js** runs JavaScript on servers and computers (no DOM, no \`window\`).
- Used for web servers, APIs, command-line tools and build tools (npm, Vite are Node programs).
- Modules: CommonJS \`require()\` / \`module.exports\`, or ES modules \`import\` / \`export\` (\`"type": "module"\` in package.json).
- \`process.env\` holds environment variables (secrets, ports). \`.env\` files are loaded in development.
- Run a file: \`node server.js\`; restart on changes: \`node --watch server.js\`.`, [
      lesson('node-1-1', 'What is Node.js?', [
        teach('JavaScript on the server', '**Node.js** takes the JavaScript engine from Chrome (V8) and runs it outside the browser. With Node you can:\n- build web servers and APIs\n- read and write files\n- build command-line tools\n\nThere is no `document` or `window` in Node: there is no page!'),
        mc('What can Node.js NOT do by itself?', ['Use document.querySelector', 'Run a web server', 'Read files', 'Install packages with npm'], 0),
        tf('npm and Vite are themselves programs that run on Node.js.', true),
        match('Browser or Node?', [['document.title', 'Browser only'], ['process.env', 'Node only'], ['console.log', 'Both'], ['fs.readFile', 'Node only (files)']]),
        type_('Which command runs a file called server.js?'),
      ]),
      lesson('node-1-2', 'Modules in Node', [
        teach('Two module systems', '```\n// CommonJS (older, still very common)\nconst express = require("express");\nmodule.exports = { add };\n\n// ES modules (modern) with "type": "module" in package.json\nimport express from "express";\nexport function add(a, b) { return a + b; }\n```'),
        match('Match the syntax with the module system', [['require()', 'CommonJS'], ['import ... from', 'ES modules'], ['module.exports', 'CommonJS export'], ['export default', 'ES module export']]),
        mc('What makes Node treat `.js` files as ES modules?', ['"type": "module" in package.json', 'Naming the file module.js', 'Using Node 1.0', 'Adding "use strict"'], 0),
        fill('Import Express (CommonJS)', 'const express = ___("express");', ['require'], ['import', 'include', 'load'], undefined, 'js'),
      ]),
      lesson('node-1-3', 'Environment and ports', [
        teach('Configuration', 'Servers read settings from **environment variables**:\n\n```\nconst port = process.env.PORT ?? 3000;\nconst dbUrl = process.env.DATABASE_URL;\napp.listen(port);\n```\nIn development they often come from a `.env` file (never committed). Hosting platforms let you set them in a dashboard.'),
        mc('Why read the port from `process.env.PORT`?', ['Hosting platforms choose the port for you', 'Ports must be secret', 'Node requires it', 'It is faster'], 0),
        mcc('What is `port` when PORT is not set?', 'const port = process.env.PORT ?? 3000;', ['3000', 'undefined', '0', 'PORT'], 0, undefined, 'js'),
        tf('The .env file with secrets should be committed so teammates get it.', false, 'Share a `.env.example` without real values instead.'),
      ]),
    ]),
    unit('node-u2', 'Express Routes', 'Build a server that answers requests.', `
**Key ideas**
- \`const app = express();\` then \`app.get(path, (req, res) => ...)\`, \`app.post\`, \`app.patch\`, \`app.delete\`.
- Answer with \`res.send(text)\`, \`res.json(data)\`, \`res.status(404).json(...)\`.
- \`req.params.id\` from \`/knights/:id\` (always a **string**), \`req.query.house\` from \`?house=...\`, \`req.body\` with \`express.json()\`.
- \`app.listen(3000)\` starts the server.`, [
      lesson('node-2-1', 'Your first server', [
        teach('Express in ten lines', '```\nconst express = require("express");\nconst app = express();\n\napp.get("/", (req, res) => {\n  res.send("Welcome!");\n});\n\napp.listen(3000, () => console.log("http://localhost:3000"));\n```\n`req` is the request (what came in); `res` is the response (what you send back).'),
        order('Build a tiny Express server', ['const express = require("express");', 'const app = express();', 'app.get("/", (req, res) => res.send("Hi"));', 'app.listen(3000);'], undefined, 'js'),
        match('Match the code', [['req.params', 'Values from the path (/knights/:id)'], ['req.query', 'Values after ? in the URL'], ['req.body', 'Data sent in the request'], ['res.json()', 'Send JSON back']]),
        mcc('A request for `/knights/7` arrives. What is `req.params.id`?', 'app.get("/knights/:id", (req, res) => { ... });', ['"7" (a string)', '7 (a number)', 'undefined', '":id"'], 0, 'URL parts are always strings. Convert with `Number()`.', 'js'),
        fill('Answer 404 with JSON', 'res.___(404).___({ error: "Not found" });', ['status', 'json'], ['code', 'send404', 'body'], undefined, 'js'),
      ]),
      challenge('node-01', 'Challenge: Hello, Tavern'),
      challenge('node-02', 'Challenge: Route Parameters'),
      challenge('node-03', 'Challenge: Query Strings'),
    ]),
    unit('node-u3', 'Building REST APIs', 'Create, validate and respond with the right status.', `
**Key ideas**
- Design around resources: \`/quests\`, \`/quests/:id\`.
- Validate input and answer **400** with a helpful message; **201** for created; **204** for deleted.
- Keep handlers small: parse input → validate → do the work → respond.
- Real data lives in a database (next section: SQL).`, [
      lesson('node-3-1', 'Designing an API', [
        teach('Good API habits', '- Nouns in URLs, methods for actions: `POST /quests` (not `/createQuest`)\n- Correct status codes\n- Consistent JSON: `{ "error": "title is required" }`\n- Validate every input on the server\n- Version big APIs: `/api/v1/...`'),
        mc('Which route follows REST style for creating a quest?', ['POST /quests', 'GET /createQuest', 'POST /quests/create/new', 'PUT /makeQuest'], 0, undefined, { codeOptions: true }),
        match('Match the situation with the status', [['Created a new quest', '201'], ['Missing title in the body', '400'], ['Quest id does not exist', '404'], ['Deleted successfully, no body', '204']]),
        tf('The server should trust data that the front end already validated.', false),
      ]),
      challenge('node-04', 'Challenge: Creating Knights'),
    ]),
    unit('node-u4', 'Middleware and Production', 'Middleware, auth, databases and deployment.', `
**Key ideas**
- **Middleware** \`(req, res, next)\` runs before routes: logging, auth, parsing, CORS. Order matters.
- Error handlers take four arguments: \`(err, req, res, next)\`.
- **Authentication**: sessions (cookie + server storage) or tokens (JWT in the Authorization header). Hash passwords with bcrypt.
- Deploy: set environment variables, use a managed database, watch the logs. Hosts: Render, Railway, Fly.io, a VPS...`, [
      lesson('node-4-1', 'Middleware', [
        teach('Guards in the corridor', 'Middleware runs in order, before your routes:\n\n```\napp.use(express.json());          // parse JSON bodies\napp.use((req, res, next) => {     // log every request\n  console.log(req.method, req.url);\n  next();                          // let it continue\n});\n```\nIf middleware does not call `next()` and does not answer, the request hangs forever.'),
        mc('What does `next()` do in middleware?', ['Passes the request on to the next middleware or route', 'Sends a 200 response', 'Restarts the server', 'Skips all routes'], 0),
        mc('How does Express recognise an error-handling middleware?', ['It has four parameters (err, req, res, next)', 'Its name starts with error', 'It is added first', 'It returns false'], 0),
        tf('The order of app.use calls matters.', true),
      ]),
      challenge('node-06', 'Challenge: Guards at the Treasury'),
      lesson('node-4-2', 'Authentication', [
        teach('Who are you?', '- **Authentication**: who is this user? (log in)\n- **Authorization**: what may they do? (admin only?)\n\nTwo common approaches:\n- **Sessions**: the server stores the login and gives the browser a cookie\n- **Tokens (JWT)**: the server signs a token; the client sends it in `Authorization: Bearer ...`\n\nNever store plain passwords: hash them with **bcrypt** or **argon2**. Many teams use services like Auth0, Clerk or Supabase Auth.'),
        match('Match the word', [['Authentication', 'Proving who you are'], ['Authorization', 'What you are allowed to do'], ['JWT', 'A signed token'], ['bcrypt', 'Password hashing']]),
        mc('A logged-in user tries to open the admin page and is not an admin. Which status fits?', ['403 Forbidden', '401 Unauthorized', '404 Not Found', '200 OK'], 0),
        tf('It is fine to invent your own encryption for passwords.', false, 'Use proven libraries. Home-made crypto is a classic security mistake.'),
      ]),
      lesson('node-4-3', 'Going live', [
        teach('Deploying a server', 'To put a Node API online:\n1. Push the code to GitHub\n2. Create a service on a host (Render, Railway, Fly.io, a VPS...)\n3. Set environment variables (`DATABASE_URL`, secrets)\n4. Connect a managed database\n5. Watch the **logs** and set up monitoring\n\nCI/CD can deploy automatically when `main` passes its tests.'),
        order('Order the deployment steps', ['Push the code to GitHub', 'Create a service on a hosting platform', 'Set the environment variables', 'Deploy and check the logs'], undefined, 'text'),
        mc('Your app works locally but crashes online with "DATABASE_URL is undefined". Most likely cause?', ['The environment variable is not set on the host', 'Node is too old', 'The CSS is broken', 'Git is not installed'], 0),
      ]),
      challenge('node-05', 'Project: The Quest API'),
    ]),
  ],
};

function type_(q: string) {
  return { t: 'type' as const, q, answers: ['node server.js', 'node server'], placeholder: 'command' };
}
