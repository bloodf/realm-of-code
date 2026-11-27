// Section: SQL and databases. Queries run on a real SQLite database in the browser.
import type { Course } from '../types';
import { teach, mc, mcc, tf, fill, match, order, bug, lesson, unit, sql } from '../dsl';

export const REALM_DB = `
CREATE TABLE houses (id INTEGER PRIMARY KEY, name TEXT NOT NULL, region TEXT);
INSERT INTO houses VALUES (1, 'Lovelace', 'North'), (2, 'Ironhill', 'East'), (3, 'Oakheart', 'West');
CREATE TABLE knights (id INTEGER PRIMARY KEY, name TEXT NOT NULL, house_id INTEGER REFERENCES houses(id), level INTEGER, gold INTEGER);
INSERT INTO knights VALUES
  (1, 'Ada', 1, 12, 340), (2, 'Bors', 2, 7, 120), (3, 'Cyra', 1, 9, 560),
  (4, 'Dax', 2, 3, 45), (5, 'Eryn', 3, 15, 890), (6, 'Finn', NULL, 1, 5);
CREATE TABLE quests (id INTEGER PRIMARY KEY, title TEXT NOT NULL, reward INTEGER, knight_id INTEGER REFERENCES knights(id), done INTEGER DEFAULT 0);
INSERT INTO quests VALUES
  (1, 'Slay the dragon', 500, 1, 0), (2, 'Find the lost goat', 5, 2, 1), (3, 'Deliver the royal letter', 50, 3, 1),
  (4, 'Guard the bridge', 40, 2, 0), (5, 'Map the swamp', 120, NULL, 0), (6, 'Tame the griffin', 300, 5, 0);
`;

const q = (id: string, title: string, task: string, solution: string, extra: { hint?: string; ordered?: boolean; after?: string } = {}) =>
  sql({ id, title, task, solution, db: REALM_DB, starter: '-- Write your query here\n', ...extra });

export const sqlCourse: Course = {
  id: 'sql', title: 'SQL and Databases', realm: 'The Royal Archives', color: '#a8813a', emblem: 'database',
  desc: 'Store and query data with SQL: SELECT, WHERE, ORDER BY, aggregates, JOINs, changing data, table design, and NoSQL.',
  units: [
    unit('sql-u1', 'Reading Data', 'Tables, SELECT and WHERE.', `
**Key ideas**
- A relational database stores data in **tables** (rows and columns). **SQL** is the language to ask questions.
- \`SELECT name, level FROM knights;\` picks columns. \`SELECT *\` picks all.
- \`WHERE\` filters rows: \`=\`, \`<>\`, \`>\`, \`<=\`, \`AND\`, \`OR\`, \`NOT\`, \`IN (...)\`, \`LIKE 'A%'\`, \`IS NULL\`.
- Text uses single quotes: \`WHERE name = 'Ada'\`.
- Popular databases: PostgreSQL, MySQL, SQLite, SQL Server.`, [
      lesson('sql-1-1', 'Tables and databases', [
        teach('The Royal Archives', 'A **database** stores an app\'s data: users, orders, messages... **Relational** databases keep data in **tables**:\n\n```\nknights\nid | name | level | gold\n1  | Ada  | 12    | 340\n2  | Bors | 7     | 120\n```\nEach **row** is one record; each **column** is one field. **SQL** (Structured Query Language) is how you ask the database questions.', undefined, 'text'),
        match('Match the word', [['Table', 'A grid of related data'], ['Row', 'One record (one knight)'], ['Column', 'One field (like level)'], ['SQL', 'The language to query it']]),
        mc('Which of these is a relational database?', ['PostgreSQL', 'React', 'Express', 'Tailwind'], 0),
        tf('SQL is used by backend developers, data analysts and many others.', true),
      ]),
      lesson('sql-1-2', 'SELECT', [
        teach('Asking for columns', '```\nSELECT * FROM knights;             -- every column\nSELECT name, level FROM knights;   -- only some columns\n```\nSQL keywords are usually written in CAPITALS (not required). Statements end with `;`.', undefined, 'sql'),
        fill('Get the name and gold of every knight', '___ name, gold ___ knights;', ['SELECT', 'FROM'], ['GET', 'WHERE', 'TABLE'], undefined, 'sql'),
        mc('What does `*` mean in `SELECT *`?', ['All columns', 'All tables', 'Multiply', 'Nothing'], 0),
        q('sql-q1', 'The whole roster', 'Show **every column** of every knight in the `knights` table.', 'SELECT * FROM knights;', { hint: '`SELECT * FROM table_name;`' }),
        q('sql-q2', 'Names and levels', 'Show only the `name` and `level` of every knight.', 'SELECT name, level FROM knights;', { hint: 'List the columns after SELECT, separated by a comma.' }),
      ]),
      lesson('sql-1-3', 'WHERE', [
        teach('Filtering rows', '```\nSELECT name FROM knights WHERE level >= 10;\nSELECT * FROM quests WHERE done = 0 AND reward > 100;\nSELECT name FROM knights WHERE name LIKE \'A%\';   -- starts with A\nSELECT name FROM knights WHERE house_id IS NULL;\n```\nText values use **single quotes**.', undefined, 'sql'),
        mcc('Which knights does this return?', "SELECT name FROM knights WHERE gold < 100;\n\n-- Ada 340, Bors 120, Dax 45, Finn 5", ['Dax and Finn', 'Ada and Bors', 'Everyone', 'Nobody'], 0, undefined, 'sql'),
        bug('Which line has a mistake?', 'SELECT name\nFROM knights\nWHERE name = "Ada";', 3, 'In standard SQL, text values use single quotes: `\'Ada\'`. Double quotes are for column names.', 'sql'),
        match('Match the condition', [["name LIKE 'C%'", 'Starts with C'], ['house_id IS NULL', 'Has no house'], ['level IN (1, 2, 3)', 'Level 1, 2 or 3'], ['gold <> 0', 'Gold is not 0']]),
        q('sql-q3', 'House Lovelace', 'Show the `name` of every knight in house **1** (Lovelace). The house is stored in the `house_id` column.', 'SELECT name FROM knights WHERE house_id = 1;'),
        q('sql-q4', 'The veterans', 'Show the `name` and `level` of knights with a level of **9 or more**.', 'SELECT name, level FROM knights WHERE level >= 9;'),
        q('sql-q5', 'Quests worth the trouble', 'Show the `title` and `reward` of quests that are **not done** (`done = 0`) and pay **more than 100**.', 'SELECT title, reward FROM quests WHERE done = 0 AND reward > 100;', { hint: 'Combine two conditions with AND.' }),
      ]),
    ]),
    unit('sql-u2', 'Sorting and Summaries', 'ORDER BY, LIMIT, COUNT, SUM, AVG, GROUP BY.', `
**Key ideas**
- \`ORDER BY gold DESC\` sorts (ASC is the default). \`LIMIT 3\` keeps the first rows.
- Aggregates: \`COUNT(*)\`, \`SUM(gold)\`, \`AVG(level)\`, \`MIN\`, \`MAX\`. Rename with \`AS\`.
- \`GROUP BY house_id\` makes one result row per group; \`HAVING\` filters groups (WHERE filters rows).
- Query order: SELECT → FROM → WHERE → GROUP BY → HAVING → ORDER BY → LIMIT.`, [
      lesson('sql-2-1', 'ORDER BY and LIMIT', [
        teach('Top of the list', '```\nSELECT name, gold FROM knights ORDER BY gold DESC;   -- richest first\nSELECT name FROM knights ORDER BY name;              -- A to Z\nSELECT name FROM knights ORDER BY level DESC LIMIT 1;  -- the highest level\n```', undefined, 'sql'),
        mc('Which sorts from the highest to the lowest level?', ['ORDER BY level DESC', 'ORDER BY level ASC', 'SORT level DOWN', 'ORDER level BY DESC'], 0, undefined, { codeOptions: true }),
        order('Put the clauses in the right order', ['SELECT name, gold', 'FROM knights', 'WHERE level > 5', 'ORDER BY gold DESC', 'LIMIT 3;'], undefined, 'sql'),
        q('sql-q7', 'The three richest', 'Show the `name` and `gold` of the **3 richest** knights, richest first.', 'SELECT name, gold FROM knights ORDER BY gold DESC LIMIT 3;', { ordered: true, hint: 'ORDER BY gold DESC, then LIMIT 3.' }),
      ]),
      lesson('sql-2-2', 'Counting and adding up', [
        teach('Aggregates', '```\nSELECT COUNT(*) FROM knights;               -- how many rows\nSELECT SUM(gold) AS total FROM knights;     -- add them up\nSELECT AVG(level), MAX(level) FROM knights;\n```\n`AS` gives the result column a name.', undefined, 'sql'),
        match('Match the function', [['COUNT(*)', 'Number of rows'], ['SUM(x)', 'Total'], ['AVG(x)', 'Average'], ['MAX(x)', 'Biggest value']]),
        q('sql-q8', 'Count the knights', 'How many knights are there? Return a single number with `COUNT(*)`.', 'SELECT COUNT(*) FROM knights;'),
        q('sql-q9', 'The treasury', 'What is the **total gold** of all knights? Return one value named `total_gold`.', 'SELECT SUM(gold) AS total_gold FROM knights;'),
      ]),
      lesson('sql-2-3', 'GROUP BY and HAVING', [
        teach('One row per group', '```\nSELECT house_id, COUNT(*) AS knights\nFROM knights\nGROUP BY house_id;\n\nSELECT house_id FROM knights\nGROUP BY house_id\nHAVING COUNT(*) >= 2;      -- only groups with 2+ knights\n```\n`WHERE` filters rows **before** grouping; `HAVING` filters **groups**.', undefined, 'sql'),
        mc('What is the difference between WHERE and HAVING?', ['WHERE filters rows, HAVING filters groups', 'They are the same', 'HAVING is for text only', 'WHERE only works with GROUP BY'], 0),
        q('sql-q10', 'Knights per house', 'For each `house_id`, show the house id and **how many knights** it has (knights without a house form their own group).', 'SELECT house_id, COUNT(*) AS knights FROM knights GROUP BY house_id;', { hint: 'GROUP BY house_id and COUNT(*).' }),
        q('sql-q11', 'Crowded houses', 'Show the `house_id` of houses that have **at least 2** knights.', 'SELECT house_id FROM knights GROUP BY house_id HAVING COUNT(*) >= 2;', { hint: 'GROUP BY, then HAVING COUNT(*) >= 2.' }),
      ]),
    ]),
    unit('sql-u3', 'Joining Tables', 'Keys, relationships, INNER JOIN and LEFT JOIN.', `
**Key ideas**
- A **primary key** (\`id\`) identifies each row. A **foreign key** (\`house_id\`) points to a row in another table.
- One house has many knights (**one-to-many**). Many-to-many needs a join table (e.g. \`knight_skills\`).
- \`JOIN ... ON a.x = b.y\` (INNER) keeps only rows that match in both tables.
- \`LEFT JOIN\` keeps every row from the left table; missing matches become \`NULL\`.
- Short names: \`FROM knights k JOIN houses h ON k.house_id = h.id\`.`, [
      lesson('sql-3-1', 'Keys and relationships', [
        teach('Connecting tables', 'Instead of writing the house name in every knight row, we store it once in `houses` and point to it:\n\n```\nhouses:  id | name\n         1  | Lovelace\nknights: id | name | house_id\n         1  | Ada  | 1        ← foreign key to houses.id\n```\nThis avoids duplicated data (**normalisation**).', undefined, 'text'),
        match('Match the word', [['Primary key', 'Unique id of each row'], ['Foreign key', 'Points to a row in another table'], ['One-to-many', 'One house, many knights'], ['Normalisation', 'Storing each fact once']]),
        mc('Knights can learn many skills, and a skill can be learned by many knights. What do you need?', ['A join table like knight_skills (knight_id, skill_id)', 'A skills column with a comma list', 'One table per knight', 'Nothing special'], 0),
        tf('Foreign keys help keep data consistent (no quests for knights that do not exist).', true),
      ]),
      lesson('sql-3-2', 'INNER JOIN', [
        teach('Combining rows', '```\nSELECT quests.title, knights.name\nFROM quests\nJOIN knights ON quests.knight_id = knights.id;\n```\nAn (inner) JOIN keeps only rows with a match on both sides. Quests without a knight disappear.', undefined, 'sql'),
        fill('Join knights to their houses', 'SELECT k.name, h.name\nFROM knights k\n___ houses h ___ k.house_id = h.id;', ['JOIN', 'ON'], ['WHERE', 'WITH', 'USING'], undefined, 'sql'),
        q('sql-q12', 'Quests and their heroes', 'Show each quest `title` with the `name` of the knight who took it. (Quests without a knight are left out.)', 'SELECT quests.title, knights.name FROM quests JOIN knights ON quests.knight_id = knights.id;', { hint: 'JOIN knights ON quests.knight_id = knights.id' }),
        q('sql-q13', 'Knights and their houses', 'Show each knight\'s `name` with their **house name**.', 'SELECT k.name, h.name FROM knights k JOIN houses h ON k.house_id = h.id;'),
      ]),
      lesson('sql-3-3', 'LEFT JOIN', [
        teach('Keep everything on the left', '```\nSELECT quests.title, knights.name\nFROM quests\nLEFT JOIN knights ON quests.knight_id = knights.id;\n```\nEvery quest is kept. If no knight matches, `knights.name` is `NULL`.\n\nCount including zeros:\n\n```\nSELECT knights.name, COUNT(quests.id)\nFROM knights LEFT JOIN quests ON quests.knight_id = knights.id\nGROUP BY knights.id;\n```', undefined, 'sql'),
        mc('You want ALL knights, even those without a house. Which join?', ['knights LEFT JOIN houses', 'knights JOIN houses', 'houses JOIN knights', 'No join'], 0, undefined, { codeOptions: true }),
        q('sql-q14', 'Every quest, claimed or not', 'Show **every** quest `title` with the knight `name` (or NULL if nobody took it).', 'SELECT quests.title, knights.name FROM quests LEFT JOIN knights ON quests.knight_id = knights.id;'),
        q('sql-q15', 'Busy knights', 'Show every knight\'s `name` and **how many quests** they took, including knights with **0** quests.', 'SELECT knights.name, COUNT(quests.id) FROM knights LEFT JOIN quests ON quests.knight_id = knights.id GROUP BY knights.id;', { hint: 'LEFT JOIN quests, GROUP BY knights.id, and COUNT(quests.id) (not COUNT(*), which would count 1 for knights without quests).' }),
      ]),
    ]),
    unit('sql-u4', 'Changing Data and Design', 'INSERT, UPDATE, DELETE, CREATE TABLE, SQL in apps and NoSQL.', `
**Key ideas**
- \`INSERT INTO t (a, b) VALUES (1, 'x');\` \`UPDATE t SET a = 2 WHERE id = 1;\` \`DELETE FROM t WHERE ...;\`
- **Always** use WHERE with UPDATE and DELETE, or every row changes!
- \`CREATE TABLE\` with types (INTEGER, TEXT, REAL) and constraints (PRIMARY KEY, NOT NULL, UNIQUE, REFERENCES, DEFAULT). Indexes speed up lookups.
- In apps: parameterised queries (never string concatenation), ORMs (Prisma, Drizzle), transactions, migrations.
- **NoSQL** databases (MongoDB, Redis...) store documents or key-value pairs; great for flexible or very fast data.`, [
      lesson('sql-4-1', 'INSERT, UPDATE, DELETE', [
        teach('Writing to the archive', '```\nINSERT INTO knights (name, house_id, level, gold) VALUES (\'Gwen\', 3, 1, 10);\nUPDATE knights SET gold = gold + 50 WHERE name = \'Ada\';\nDELETE FROM quests WHERE done = 1;\n```\n⚠ An UPDATE or DELETE **without WHERE** changes **every** row.', undefined, 'sql'),
        bug('Which line would be a disaster?', "UPDATE knights SET gold = 0 WHERE id = 4;\nDELETE FROM quests;\nINSERT INTO houses (name) VALUES ('Stonewall');", 2, 'DELETE without WHERE removes every quest.', 'sql'),
        q('sql-q16', 'Welcome, Gwen', 'A new knight joins: **Gwen**, house **3**, level **1**, **10** gold. Insert her into `knights` (the id is created automatically).', "INSERT INTO knights (name, house_id, level, gold) VALUES ('Gwen', 3, 1, 10);", { after: "SELECT name, house_id, level, gold FROM knights WHERE name = 'Gwen';", hint: "INSERT INTO knights (name, house_id, level, gold) VALUES (...);" }),
        q('sql-q17', 'Ada levels up', 'Increase **Ada\'s** level by **1** (and nobody else\'s).', "UPDATE knights SET level = level + 1 WHERE name = 'Ada';", { after: 'SELECT name, level FROM knights ORDER BY id;', ordered: true }),
        q('sql-q18', 'Clear the finished quests', 'Delete all quests that are **done** (`done = 1`).', 'DELETE FROM quests WHERE done = 1;', { after: 'SELECT id, title FROM quests ORDER BY id;', ordered: true }),
      ]),
      lesson('sql-4-2', 'Designing tables', [
        teach('CREATE TABLE', '```\nCREATE TABLE horses (\n  id INTEGER PRIMARY KEY,\n  name TEXT NOT NULL,\n  knight_id INTEGER REFERENCES knights(id)\n);\nCREATE INDEX idx_horses_knight ON horses(knight_id);\n```\nConstraints protect your data: `NOT NULL`, `UNIQUE`, `PRIMARY KEY`, `REFERENCES` (foreign key), `DEFAULT`.', undefined, 'sql'),
        match('Match the constraint', [['PRIMARY KEY', 'Unique id for each row'], ['NOT NULL', 'Value is required'], ['UNIQUE', 'No duplicates allowed'], ['REFERENCES', 'Must exist in another table']]),
        mc('Why add an index on a column?', ['To make lookups on that column much faster', 'To make the column required', 'To sort the table forever', 'To hide the column'], 0),
        q('sql-q19', 'Stables for horses', 'Create a table `horses` with: `id` (INTEGER PRIMARY KEY), `name` (TEXT, required) and `knight_id` (INTEGER referencing `knights(id)`). The archive will then add a horse to test it.', 'CREATE TABLE horses (id INTEGER PRIMARY KEY, name TEXT NOT NULL, knight_id INTEGER REFERENCES knights(id));', { after: "INSERT INTO horses (name, knight_id) VALUES ('Thunder', 1); SELECT id, name, knight_id FROM horses;" }),
      ]),
      lesson('sql-4-3', 'SQL in real apps', [
        teach('From Node to the database', '```\n// ✓ parameterised query (safe)\nconst rows = await db.query("SELECT * FROM knights WHERE id = $1", [req.params.id]);\n```\n- Never glue user input into SQL (SQL injection!)\n- **ORMs** and query builders (Prisma, Drizzle, Sequelize) generate SQL from code\n- **Migrations** version your table changes like Git versions code\n- **Transactions** make several changes all-or-nothing (e.g. move gold between knights)', undefined, 'js'),
        mc('Why use a transaction to move gold from Ada to Bors?', ['So both updates happen, or neither does', 'To make it faster', 'Because UPDATE needs it', 'To hide it from other users forever'], 0),
        match('Match the tool', [['Prisma', 'ORM for Node/TypeScript'], ['Migration', 'A versioned change to the schema'], ['Transaction', 'All-or-nothing group of changes'], ['Parameterised query', 'Safe way to pass user input']]),
        tf('`"SELECT * FROM users WHERE name = \'" + name + "\'"` is a safe way to build a query.', false),
      ]),
      lesson('sql-4-4', 'NoSQL databases', [
        teach('Not only tables', '**NoSQL** databases store data in other shapes:\n- **Document** (MongoDB, Firestore): JSON-like documents\n- **Key-value** (Redis): super fast lookups, caches, sessions\n- **Graph** (Neo4j): relationships like social networks\n\n```\n// a MongoDB document\n{ "_id": "...", "name": "Ada", "skills": ["sword", "magic"], "horse": { "name": "Thunder" } }\n// a MongoDB query\ndb.knights.find({ level: { $gte: 10 } })\n```', undefined, 'js'),
        match('Match the database with its type', [['PostgreSQL', 'Relational (SQL)'], ['MongoDB', 'Document'], ['Redis', 'Key-value'], ['Neo4j', 'Graph']]),
        mc('What is Redis often used for?', ['Caching and sessions (very fast key-value lookups)', 'Designing web pages', 'Replacing Git', 'Image editing'], 0),
        mcc('What does this MongoDB query find?', 'db.knights.find({ level: { $gte: 10 } })', ['Knights with level 10 or more', 'The first 10 knights', 'Knights named level', 'Nothing'], 0, undefined, 'js'),
        tf('Relational databases (like PostgreSQL) are still the most common choice for typical web apps.', true),
      ]),
    ]),
  ],
};
