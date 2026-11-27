// Section: TypeScript.
import type { Course } from '../types';
import { teach, mc, mcc, tf, fill, match, bug, lesson, unit, challenge } from '../dsl';

export const ts: Course = {
  id: 'ts', title: 'TypeScript', realm: "The Runesmith's Forge", color: '#3178c6', emblem: 'anvil',
  desc: 'JavaScript with types: catch bugs before your code runs. Used by most professional teams.',
  units: [
    unit('ts-u1', 'Basic Types', 'Why types, annotations and inference.', `
**Key ideas**
- TypeScript = JavaScript + **types**. The compiler (\`tsc\`) checks your code, then outputs plain JavaScript.
- Annotations: \`let gold: number = 5\`, \`name: string\`, \`alive: boolean\`, \`tags: string[]\`.
- **Inference**: \`let gold = 5\` is already a \`number\`. Annotate function parameters and return values.
- \`any\` turns checking off (avoid). \`unknown\` is the safe "anything" (you must check it first).
- Types disappear at runtime: they cost nothing in the browser.`, [
      lesson('ts-1-1', 'Why TypeScript?', [
        teach('Runes that catch bugs', 'TypeScript adds **types** to JavaScript:\n\n```\nfunction heal(hp: number, amount: number): number {\n  return hp + amount;\n}\nheal("ten", 5);   // ✗ error before the code even runs\n```\nThe TypeScript compiler checks your code and then outputs plain JavaScript. Editors use the types for autocomplete.'),
        mc('When does TypeScript catch type errors?', ['Before the code runs (at compile time / in the editor)', 'Only after users find them', 'Never', 'Only on the server'], 0),
        tf('Browsers run TypeScript files directly.', false, 'TypeScript is compiled (or stripped) to JavaScript first. Build tools like Vite do this for you.'),
        mc('Why do companies like TypeScript?', ['Fewer bugs, better autocomplete, safer refactoring', 'It makes apps run much faster', 'It replaces testing', 'It is required by browsers'], 0),
        match('Match the word', [['tsc', 'The TypeScript compiler'], ['.ts', 'A TypeScript file'], ['.tsx', 'TypeScript with JSX'], ['Type error', 'A value of the wrong kind']]),
      ]),
      lesson('ts-1-2', 'Annotations and inference', [
        teach('Writing types', '```\nlet gold: number = 100;\nconst name: string = "Ada";\nlet alive: boolean = true;\nconst tags: string[] = ["brave", "kind"];\n\nlet level = 3;        // inferred: number\nlevel = "high";       // ✗ Type \'string\' is not assignable to type \'number\'\n```'),
        mcc('What type does TypeScript infer for `xp`?', 'let xp = 250;', ['number', 'string', 'any', 'unknown'], 0, undefined, 'ts'),
        bug('Which line has a type error?', 'let name: string = "Ada";\nlet level: number = 3;\nlevel = "three";', 3, '`level` is a number, so a string cannot be assigned to it.', 'ts'),
        fill('An array of strings', 'const skills: ___ = ["sword", "magic"];', ['string[]'], ['string', 'array', '[string]'], undefined, 'ts'),
        mc('Where are type annotations most useful?', ['On function parameters and return values', 'On every single variable', 'Only on numbers', 'In CSS files'], 0),
        mc('Why avoid the `any` type?', ['It switches type checking off', 'It is slower at runtime', 'It only works with numbers', 'It is not valid TypeScript'], 0),
      ]),
      challenge('ts-01', 'Challenge: Runes of Type'),
      challenge('ts-02', 'Challenge: Runes on Functions'),
    ]),
    unit('ts-u2', 'Object Types and Unions', 'Interfaces, unions, literal types and narrowing.', `
**Key ideas**
- Describe objects with \`interface Hero { name: string; level: number; title?: string }\` or \`type Hero = { ... }\`.
- \`?\` = optional property; \`readonly\` = cannot change.
- Union: \`string | number\`. Literal union: \`type Dir = "up" | "down"\`.
- **Narrowing**: check before using: \`if (typeof x === "string")\`, \`if (hero)\`, \`x?.y\`, \`??\`.
- \`strictNullChecks\` forces you to handle \`undefined\`/\`null\`.`, [
      lesson('ts-2-1', 'Interfaces and types', [
        teach('The shape of data', '```\ninterface Knight {\n  name: string;\n  level: number;\n  horse?: string;        // optional\n  readonly id: number;   // cannot be changed\n}\n\ntype Point = { x: number; y: number };\n```'),
        mcc('Is this object a valid `Knight`?', 'interface Knight { name: string; level: number; horse?: string }\nconst k: Knight = { name: "Ada", level: 3 };', ['Yes, horse is optional', 'No, horse is missing', 'No, level must be a string', 'Only with any'], 0, undefined, 'ts'),
        bug('Which line has a type error?', 'interface Quest { title: string; reward: number }\nconst a: Quest = { title: "Slay", reward: 500 };\nconst b: Quest = { title: "Dig", reward: "lots" };', 3, '`reward` must be a number.', 'ts'),
        fill('Make the horse optional', 'interface Knight {\n  name: string;\n  horse___: string;\n}', ['?'], ['!', '*', '|'], undefined, 'ts'),
        tf('`readonly` properties can be changed after the object is created.', false),
      ]),
      lesson('ts-2-2', 'Unions and narrowing', [
        teach('This or that', '```\ntype Dir = "up" | "down" | "left" | "right";\nlet id: string | number;\n\nfunction show(id: string | number) {\n  if (typeof id === "string") {\n    return id.toUpperCase();   // TS knows: string here\n  }\n  return id.toFixed(0);        // TS knows: number here\n}\n```\nChecking the type inside an `if` is called **narrowing**.'),
        mcc('Which value is allowed?', 'type Size = "small" | "large";\nlet s: Size;', ['"small"', '"medium"', '"Small"', '3'], 0, undefined, 'ts'),
        mc('What is narrowing?', ['Checking a value so TypeScript knows its exact type in that branch', 'Making a string shorter', 'Removing properties', 'A CSS trick'], 0),
        mcc('Why does TypeScript complain here?', 'function nameOf(k: Knight | undefined) {\n  return k.name;\n}', ['k might be undefined', 'name is not a string', 'Functions cannot return strings', 'Knight is not defined in JS'], 0, 'Check first: `if (!k) return "nobody";` or use `k?.name`.', 'ts'),
        fill('Accept a string or a number', 'function format(value: string ___ number) { }', ['|'], ['&', 'or', ','], undefined, 'ts'),
      ]),
      challenge('ts-03', 'Challenge: The Shape of a Hero'),
      challenge('ts-04', 'Challenge: The Rune of Directions'),
      challenge('ts-05', 'Challenge: Maybe There, Maybe Not'),
    ]),
    unit('ts-u3', 'Generics and Real Projects', 'Generics, classes, utility types and TypeScript at work.', `
**Key ideas**
- **Generics** are type parameters: \`function first<T>(items: T[]): T | undefined\`. You use them already: \`Array<T>\`, \`Promise<T>\`.
- Classes: \`private\`, \`public\`, \`readonly\`, \`implements\`.
- Utility types: \`Partial<T>\` (all optional), \`Pick<T, "a">\`, \`Omit<T, "a">\`, \`Record<K, V>\`.
- Projects: \`tsconfig.json\` with \`"strict": true\`; type packages \`@types/...\`; in React, type props with an interface.`, [
      lesson('ts-3-1', 'Generics', [
        teach('Types as parameters', '```\nfunction last<T>(items: T[]): T | undefined {\n  return items[items.length - 1];\n}\nlast([1, 2, 3]);        // number\nlast(["a", "b"]);       // string\n\nconst names: Array<string> = [];\nconst p: Promise<number> = Promise.resolve(42);\n```'),
        mcc('What is `T` when you call `last(["gold", "silver"])`?', 'function last<T>(items: T[]): T | undefined', ['string', 'number', 'any', 'T'], 0, undefined, 'ts'),
        mc('`useState<number>(0)` in React uses...', ['A generic', 'An interface', 'A union of literals', 'A decorator'], 0),
        tf('Generics keep type safety while working with many types.', true),
      ]),
      lesson('ts-3-2', 'Utility types', [
        teach('Built-in type helpers', '```\ninterface Knight { id: number; name: string; level: number }\n\ntype KnightUpdate = Partial<Knight>;          // all optional\ntype KnightCard = Pick<Knight, "name" | "level">;\ntype NewKnight = Omit<Knight, "id">;\nconst byHouse: Record<string, Knight[]> = {};\n```'),
        match('Match the utility type', [['Partial<T>', 'Every property optional'], ['Pick<T, K>', 'Keep only some properties'], ['Omit<T, K>', 'Remove some properties'], ['Record<K, V>', 'Object with keys K and values V']]),
        mc('A PATCH request may send only some fields of a Quest. Which type fits the body?', ['Partial<Quest>', 'Quest[]', 'Record<Quest>', 'Omit<Quest>'], 0, undefined, { codeOptions: true }),
        mc('The server creates the `id`. What type fits the data for creating a knight?', ['Omit<Knight, "id">', 'Pick<Knight, "id">', 'Partial<Knight>[]', 'Knight | id'], 0, undefined, { codeOptions: true }),
      ]),
      lesson('ts-3-3', 'TypeScript at work', [
        teach('In real projects', '- `tsconfig.json` configures the compiler. Always turn on `"strict": true`.\n- Libraries ship types, or have them in `@types/...` packages (e.g. `@types/node`).\n- In React, type props:\n\n```\ninterface ButtonProps { label: string; onClick: () => void }\nfunction Button({ label, onClick }: ButtonProps) { ... }\n```\n- Vite, Next.js and others compile TS automatically.'),
        mc('Which tsconfig option catches the most bugs?', ['"strict": true', '"allowJs": true', '"noEmit": false', '"target": "ES5"'], 0, undefined, { codeOptions: true }),
        mc('Where do type definitions for a plain JS library often come from?', ['@types/library-name packages', 'The CSS file', 'The browser', 'You must always write them all'], 0),
        fill('Type the props of a React component', 'interface CardProps {\n  title: ___;\n  onClose: () => ___;\n}', ['string', 'void'], ['String', 'null', 'text'], undefined, 'ts'),
        tf('Types exist only while developing; the browser never sees them.', true),
      ]),
      challenge('ts-06', 'Challenge: Generic Chests'),
      challenge('ts-07', 'Challenge: Classes of the Guild'),
      challenge('ts-08', 'Project: The Rune Inventory'),
    ]),
  ],
};
