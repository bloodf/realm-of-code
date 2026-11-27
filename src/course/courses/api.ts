// Section: HTTP, APIs and JSON.
import type { Course } from '../types';
import { teach, mc, mcc, tf, fill, match, order, bug, lesson, unit, challenge } from '../dsl';

export const api: Course = {
  id: 'api', title: 'APIs and HTTP', realm: 'The Ravens\' Roost', color: '#2f8f83', emblem: 'api',
  desc: 'How apps talk to servers: HTTP, REST APIs, JSON, fetch, status codes and errors.',
  units: [
    unit('api-u1', 'APIs and JSON', 'What APIs are, JSON, REST and HTTP details.', `
**Key ideas**
- An **API** is a way for programs to talk to each other. Web APIs answer HTTP requests with data (usually JSON).
- **REST**: resources are URLs (\`/knights\`, \`/knights/2\`); methods say the action: GET (read), POST (create), PUT/PATCH (update), DELETE (remove).
- Status codes: 200 OK, 201 Created, 204 No Content, 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 500 Server Error.
- **Headers** carry extra info: \`Content-Type: application/json\`, \`Authorization: Bearer <token>\`.
- Query strings filter: \`/knights?house=Lovelace&page=2\`.`, [
      lesson('api-1-1', 'What is an API?', [
        teach('The waiter of the internet', 'An **API** (Application Programming Interface) lets one program ask another for data or actions.\n\nThink of a restaurant: you (the app) do not walk into the kitchen (the database). You ask the **waiter** (the API), who brings back what you ordered.\n\nWeather apps, maps, payments, logins: all use APIs.'),
        mc('In the restaurant story, the API is...', ['The waiter', 'The kitchen', 'The customer', 'The menu price'], 0),
        mc('A weather app shows today\'s forecast. Where does the data most likely come from?', ['A weather API', 'The phone\'s CSS', 'The HTML file', 'The user types it'], 0),
        tf('Most web APIs send data back as JSON.', true),
        match('Match the word', [['API', 'A way for programs to talk'], ['Endpoint', 'One URL of an API'], ['Request', 'What the client sends'], ['Response', 'What the server sends back']]),
      ]),
      lesson('api-1-2', 'JSON up close', [
        teach('JSON rules', '```\n{\n  "name": "Ada",\n  "level": 12,\n  "alive": true,\n  "skills": ["sword", "magic"],\n  "horse": null\n}\n```\nRules: keys in **double quotes**, strings in double quotes, no trailing commas, no comments, no functions.'),
        bug('Which line breaks the JSON?', '{\n  "name": "Ada",\n  \'house\': "Lovelace",\n  "level": 12\n}', 3, 'JSON needs double quotes around keys and strings.', 'json'),
        bug('Which line breaks the JSON?', '{\n  "title": "Slay the dragon",\n  "reward": 500,\n}', 3, 'JSON does not allow a comma after the last item.', 'json'),
        mcc('What is the type of "skills"?', '{ "skills": ["sword", "magic"] }', ['An array', 'A string', 'An object', 'A number'], 0, undefined, 'json'),
        mcc('How do you read Cyra\'s house in JavaScript (the data is in `data`)?', '{ "knights": [\n  { "name": "Ada", "house": "Lovelace" },\n  { "name": "Cyra", "house": "Ironhill" }\n] }', ['data.knights[1].house', 'data.knights.house[1]', 'data[1].house', 'data.Cyra.house'], 0, undefined, 'json'),
      ]),
      lesson('api-1-3', 'REST and status codes', [
        teach('Resources and verbs', 'A **REST** API uses URLs for things (resources) and HTTP methods for actions:\n\n```\nGET    /knights       list knights\nGET    /knights/2     one knight\nPOST   /knights       create a knight\nPATCH  /knights/2     change part of it\nDELETE /knights/2     remove it\n```'),
        match('Match the method with the action', [['GET', 'Read'], ['POST', 'Create'], ['PATCH', 'Update part'], ['DELETE', 'Remove']]),
        mc('Which request gets the quest with id 7?', ['GET /quests/7', 'POST /quests/7', 'GET /quests?delete=7', 'DELETE /quests'], 0, undefined, { codeOptions: true }),
        match('Match the status code', [['201', 'Created'], ['400', 'Bad request (invalid data)'], ['401', 'Not logged in'], ['403', 'Logged in but not allowed']]),
        mc('The server crashed while handling a request. Which status is typical?', ['500', '200', '404', '301'], 0),
        tf('A successful DELETE often answers 204 No Content (an empty body).', true),
      ]),
      lesson('api-1-4', 'Headers, queries and keys', [
        teach('The envelope around the letter', '**Headers** carry information about the request or response:\n- `Content-Type: application/json`: the body is JSON\n- `Authorization: Bearer abc123`: who you are (a token)\n\n**Query strings** add options: `/knights?house=Lovelace&sort=level`\n\nMany APIs need an **API key**. Keep it secret: on the server, never in public front-end code.'),
        mcc('What does this URL ask for?', 'GET /quests?done=false&sort=reward', ['Quests not done, sorted by reward', 'Delete done quests', 'One quest with id "false"', 'All quests unsorted'], 0, undefined, 'text'),
        fill('Tell the server the body is JSON', 'headers: {\n  "Content-Type": "___"\n}', ['application/json'], ['text/json', 'json', 'application/js'], undefined, 'js'),
        tf('It is safe to put a secret API key in front-end JavaScript.', false, 'Anyone can read front-end code in DevTools. Call the API from your server instead.'),
        mc('Which header usually carries a login token?', ['Authorization', 'Content-Type', 'Accept-Language', 'Cache-Control'], 0),
      ]),
    ]),
    unit('api-u2', 'Fetching Data', 'Use fetch to read and send data, and handle errors.', `
**Key ideas**
- \`const res = await fetch(url);\` then \`const data = await res.json();\`
- \`fetch\` only throws on network failure. Check \`res.ok\` (status 200–299) for HTTP errors.
- Send data: \`fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(obj) })\`.
- Wrap in \`try/catch\`. In UIs, show **loading**, **error** and **empty** states.
- **CORS**: browsers block requests to other domains unless the server allows them.`, [
      lesson('api-2-1', 'fetch basics', [
        teach('Asking the server', '```\nasync function loadKnights() {\n  const res = await fetch("https://api.realm.dev/knights");\n  const knights = await res.json();\n  console.log(knights);\n}\n```\nTwo `await`s: one for the response, one for reading its JSON body.'),
        order('Fetch and print the quests', ['async function main() {', '  const res = await fetch("/api/quests");', '  const quests = await res.json();', '  console.log(quests);', '}'], undefined, 'js'),
        fill('Read the JSON body', 'const data = await res.___();', ['json'], ['parse', 'body', 'text()'], undefined, 'js'),
        mc('What does `fetch` return?', ['A Promise of a Response', 'The data directly', 'A JSON string', 'An HTML page'], 0),
      ]),
      challenge('api-01', 'Challenge: Summon the Knights'),
      lesson('api-2-2', 'When things go wrong', [
        teach('Check the status', '```\nconst res = await fetch(`/api/knights/${id}`);\nif (!res.ok) {\n  throw new Error(`Request failed: ${res.status}`);\n}\nconst knight = await res.json();\n```\n`res.ok` is true for status 200–299. `fetch` does **not** throw on 404 or 500, only on network problems.'),
        tf('`fetch` throws an error when the server answers 404.', false, 'A 404 is still a response. Check `res.ok` or `res.status` yourself.'),
        mc('When does `fetch` reject (throw)?', ['On network failure, like being offline', 'On any status that is not 200', 'When JSON is empty', 'Never'], 0),
        bug('Which line lets errors slip through?', 'async function getQuest(id) {\n  const res = await fetch(`/api/quests/${id}`);\n  return res.json();\n}', 3, 'It never checks `res.ok`, so a 404 error page is treated like real data.'),
        mc('Which is best for users when data fails to load?', ['Show a clear message and a "Try again" button', 'Show a blank page', 'Reload the page forever', 'Hide the error in the console only'], 0),
      ]),
      challenge('api-02', 'Challenge: Knight Not Found'),
      lesson('api-2-3', 'Sending data', [
        teach('POST with a body', '```\nconst res = await fetch("/api/quests", {\n  method: "POST",\n  headers: { "Content-Type": "application/json" },\n  body: JSON.stringify({ title: "Guard the bridge" }),\n});\n```'),
        fill('Send a quest as JSON', 'fetch("/api/quests", {\n  method: "___",\n  headers: { "Content-Type": "application/json" },\n  body: JSON.___(quest),\n});', ['POST', 'stringify'], ['GET', 'parse', 'send'], undefined, 'js'),
        mc('Why `JSON.stringify` the body?', ['HTTP bodies are text, so the object must become a JSON string', 'To make it shorter', 'To encrypt it', 'fetch only accepts numbers'], 0),
        mc('Which method usually updates only some fields?', ['PATCH', 'GET', 'POST', 'HEAD'], 0),
      ]),
      challenge('api-03', 'Challenge: Recruit a Knight'),
      lesson('api-2-4', 'Data in real apps', [
        teach('States of a screen', 'Every screen that loads data has several **states**:\n- **loading**: show a spinner or skeleton\n- **error**: explain and offer to retry\n- **empty**: "No quests yet, add one!"\n- **success**: show the data\n\n**CORS**: browsers block requests to another domain unless that server sends permission headers. Fix it on the server, not in the browser.'),
        match('Match the state with what to show', [['Loading', 'A spinner or skeleton'], ['Error', 'A message and a retry button'], ['Empty', 'A friendly "nothing here yet"'], ['Success', 'The data']]),
        mc('You see "blocked by CORS policy" in the console. Where is it fixed?', ['On the server (allowed origins)', 'In the CSS', 'By using http instead of https', 'By clearing the cache'], 0),
        tf('Many APIs limit how many requests you can send per minute (rate limits).', true),
      ]),
    ]),
  ],
};
