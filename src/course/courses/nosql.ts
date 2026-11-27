// Section: NoSQL databases: documents (MongoDB), key-value (Redis), and when to choose what.
import type { Course } from '../types';
import { teach, mc, mcc, tf, fill, match, order, bug, lesson, unit } from '../dsl';

export const nosql: Course = {
  id: 'nosql', title: 'NoSQL Databases', realm: 'The Scroll Vaults', color: '#4f9a3a', emblem: 'database',
  desc: 'Document databases (MongoDB): documents, collections, queries, updates, indexes and aggregation. Key-value stores (Redis), and how to choose between SQL and NoSQL.',
  units: [
    unit('nosql-u1', 'Documents', 'Collections, documents, find and filters.', `
**Key ideas**
- **NoSQL** databases do not use tables. MongoDB stores **documents** (JSON-like objects) in **collections**.
- Documents in one collection can have different fields (flexible schema). Each has an \`_id\`.
- \`db.heroes.find({ level: { $gt: 10 } })\`, operators: \`$gt $gte $lt $in $ne\`, \`$and\`, \`$or\`.
- \`insertOne\`, \`updateOne({...}, { $set: {...} })\`, \`deleteOne\`.`, [
      lesson('nosql-1-1', 'Documents and collections', [
        teach('The Scroll Vaults', 'A **document database** like MongoDB keeps data as documents:\n\n```\n{\n  "_id": 1,\n  "name": "Ada",\n  "level": 12,\n  "skills": ["html", "css"],\n  "house": { "name": "Lovelace", "region": "North" }\n}\n```\nDocuments live in **collections** (like a table, but each document can have its own shape). Arrays and nested objects are normal.', undefined, 'json'),
        match('Match SQL and MongoDB words', [['Table', 'Collection'], ['Row', 'Document'], ['Column', 'Field'], ['Primary key', '_id']]),
        tf('In MongoDB, two documents in the same collection can have different fields.', true),
        mc('Which of these is a document database?', ['MongoDB', 'PostgreSQL', 'MySQL', 'SQLite'], 0),
      ]),
      lesson('nosql-1-2', 'Finding documents', [
        teach('find()', '```\ndb.heroes.find()                              // everything\ndb.heroes.find({ house: "Lovelace" })        // equal\ndb.heroes.find({ level: { $gte: 10 } })      // level >= 10\ndb.heroes.find({ skills: "css" })            // arrays: contains "css"\ndb.heroes.find({ level: { $lt: 5 } }, { name: 1 })  // only the name field\n```', undefined, 'js'),
        mcc('Which heroes does this return?', 'db.heroes.find({ level: { $gt: 10 } })\n\n// Ada 12, Bors 7, Cyra 10, Eryn 15', ['Ada and Eryn', 'Ada, Cyra and Eryn', 'Bors', 'Everyone'], 0, '`$gt` means greater than (not equal). Cyra has exactly 10.'),
        match('Match the operator', [['$gt', 'Greater than'], ['$lte', 'Less than or equal'], ['$in', 'One of a list'], ['$ne', 'Not equal']]),
        fill('Find heroes from the North or East', 'db.heroes.find({ region: { ___: ["North", "East"] } })', ['$in'], ['$or', '$all', 'in'], undefined, 'js'),
        mcc('What does this return?', 'db.heroes.find({ skills: "sql" })', ['Heroes whose skills array contains "sql"', 'Heroes whose skills are exactly "sql"', 'Nothing: arrays cannot be searched', 'An error'], 0, undefined, 'js'),
      ]),
      lesson('nosql-1-3', 'Changing documents', [
        teach('Insert, update, delete', '```\ndb.heroes.insertOne({ name: "Finn", level: 1 })\ndb.heroes.updateOne({ name: "Finn" }, { $set: { level: 2 } })\ndb.heroes.updateMany({}, { $inc: { gold: 10 } })     // everyone +10 gold\ndb.heroes.updateOne({ name: "Finn" }, { $push: { skills: "git" } })\ndb.heroes.deleteOne({ name: "Finn" })\n```', undefined, 'js'),
        bug('Which line replaces the whole document by mistake?', 'db.heroes.updateOne(\n  { name: "Ada" },\n  { level: 13 }\n)', 3, 'Without `$set`, the update would replace the document. Write `{ $set: { level: 13 } }`.', 'js'),
        match('Match the update operator', [['$set', 'Set a field'], ['$inc', 'Add to a number'], ['$push', 'Add to an array'], ['$unset', 'Remove a field']]),
        order('Give Ada 5 gold', ['db.heroes.updateOne(', '  { name: "Ada" },', '  { $inc: { gold: 5 } }', ')'], undefined, 'js'),
      ]),
    ]),
    unit('nosql-u2', 'Design and Scale', 'Indexes, aggregation, Redis, and SQL vs NoSQL.', `
**Key ideas**
- **Indexes** make queries fast: \`db.heroes.createIndex({ name: 1 })\`.
- **Aggregation pipeline**: \`$match\` → \`$group\` → \`$sort\`, like WHERE / GROUP BY / ORDER BY.
- **Embed** data you read together; **reference** data shared by many documents.
- **Redis** is an in-memory key-value store: caches, sessions, counters, queues.
- Choose SQL for strong relations and transactions; NoSQL for flexible shapes, huge scale or speed.`, [
      lesson('nosql-2-1', 'Indexes and aggregation', [
        teach('Fast and smart queries', '```\ndb.heroes.createIndex({ level: -1 })   // fast sorting by level\n\ndb.heroes.aggregate([\n  { $match: { level: { $gte: 5 } } },\n  { $group: { _id: "$house", total: { $sum: "$gold" } } },\n  { $sort: { total: -1 } }\n])\n```\nWithout an index, the database reads **every** document (a collection scan).', undefined, 'js'),
        match('Match aggregation and SQL', [['$match', 'WHERE'], ['$group', 'GROUP BY'], ['$sort', 'ORDER BY'], ['$limit', 'LIMIT']]),
        mc('Why add an index?', ['To make searches on that field fast', 'To save disk space', 'To store passwords', 'To back up the data'], 0),
        tf('Indexes make reading faster but writing a little slower.', true),
      ]),
      lesson('nosql-2-2', 'Embed or reference?', [
        teach('Modelling documents', '**Embed** when the data belongs to one parent and is read together:\n\n```\n{ "name": "Ada", "address": { "city": "Codehaven" } }\n```\n**Reference** when many documents share it or it grows without limit:\n\n```\n{ "name": "Ada", "guildId": 7 }\n```\nA blog post can embed its tags, but should reference its author (shared by many posts).', undefined, 'json'),
        mc('A product has 2 or 3 photos that are always shown with it. Embed or reference?', ['Embed', 'Reference', 'Neither', 'Use a new database'], 0),
        mc('Thousands of orders belong to one customer. How should orders relate to the customer?', ['Orders reference the customer id', 'Embed all orders inside the customer', 'Copy the customer in every order only', 'Put everything in one big document'], 0, 'Unbounded growth does not fit in one document (MongoDB has a 16 MB limit per document).'),
      ]),
      lesson('nosql-2-3', 'Redis and choosing a database', [
        teach('Key-value stores', '**Redis** keeps data in memory, so it is extremely fast:\n\n```\nSET session:42 "ada"\nGET session:42\nINCR page:views\nEXPIRE session:42 3600\n```\nCommon uses: **caches**, **sessions**, counters, rate limits and queues.\n\nOther NoSQL families: **wide-column** (Cassandra), **graph** (Neo4j), **search** (Elasticsearch).', undefined, 'bash'),
        match('Match the database to its job', [['Redis', 'Cache and sessions'], ['MongoDB', 'Flexible documents'], ['PostgreSQL', 'Relational data and transactions'], ['Neo4j', 'Relationships as a graph']]),
        mc('A bank needs transfers that never lose money, with strict rules between tables. Best choice?', ['A relational database like PostgreSQL', 'Redis only', 'A text file', 'Browser localStorage'], 0),
        tf('Many real apps use both: PostgreSQL for core data and Redis as a cache.', true),
      ]),
    ]),
  ],
};
