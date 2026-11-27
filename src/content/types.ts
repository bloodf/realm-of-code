// Content model. Lessons are plain data + small check functions, so new content
// never needs changes to the engine.

export type KingdomId =
  | 'html' | 'css' | 'js' | 'ts' | 'tailwind' | 'react' | 'vue' | 'svelte'
  | 'node' | 'python' | 'php' | 'go' | 'sql' | 'nosql' | 'git' | 'bash';

export type FileLang = 'html' | 'css' | 'js' | 'jsx' | 'ts' | 'vue' | 'svelte' | 'py' | 'php';

export interface LessonFile {
  name: string;        // e.g. "index.html", "App.jsx"
  lang: FileLang;
  code: string;        // starter code
  readonly?: boolean;
}

export interface Check<C> {
  label: string;                                   // shown as a quest objective
  test: (ctx: C) => boolean | Promise<boolean>;
  bonus?: boolean;                                 // optional objective -> 2nd star
  fail?: string;                                   // friendly tip when it fails
}

interface LessonBase {
  id: string;
  kingdom: KingdomId;
  title: string;
  region: string;      // section inside the kingdom, e.g. "First Stones"
  story: string;       // flavour text (mini-markdown)
  learn: string;       // the concept, explained simply (mini-markdown)
  task: string;        // what to do
  sage?: string;       // deeper notes for adults / career switchers
  hints: string[];
  concepts: string[];
  xp: number;
  boss?: boolean;
}

// ---------- Web lessons (HTML, CSS, DOM, Tailwind, React, Vue, Svelte) ----------
export type WebMode = 'html' | 'tailwind' | 'react' | 'vue' | 'svelte';

export interface WebCtx {
  doc: Document;
  win: Window & typeof globalThis;
  $: (sel: string) => Element | null;
  $$: (sel: string) => Element[];
  css: (target: string | Element | null, prop: string) => string;
  text: (sel: string) => string;
  files: Record<string, string>;
  logs: string[];
  errors: string[];
  click: (target: string | Element | null) => Promise<void>;
  type: (target: string | Element | null, value: string) => Promise<void>;
  wait: (ms?: number) => Promise<void>;
}

export interface WebLesson extends LessonBase {
  kind: 'web';
  mode: WebMode;
  files: LessonFile[];
  solution: Record<string, string>;
  checks: Check<WebCtx>[];
  target?: string;     // optional HTML shown as the "goal picture"
}

// ---------- Hero grid lessons (JS / TS code moves a knight) ----------
export interface GridGoals {
  exit?: boolean;
  gems?: 'all' | number;
  goblins?: 'all';
}

export interface GridCtx {
  code: string;
  result: import('../grid/world').SimResult;
  logs: string[];
}

export interface GridLesson extends LessonBase {
  kind: 'grid';
  lang: 'js' | 'ts';
  map: string[];
  starter: string;
  solution: string;
  goals: GridGoals;
  parLines?: number;   // bonus star: solve in at most N lines
  checks?: Check<GridCtx>[];
}

// ---------- Console lessons (JS / TS programs with output + tests) ----------
export interface ConsoleCtx {
  code: string;
  logs: string[];
  values: Record<string, unknown>;  // results of the lesson's probe code
  tsErrors: string[];
  error: string | null;
}

export interface ConsoleLesson extends LessonBase {
  kind: 'console';
  lang: 'js' | 'ts' | 'py' | 'php';
  starter: string;
  solution: string;
  probe?: string;      // JS: body run after the user's code, must `return {...}`. Python: code that sets `__probe = {...}`. PHP: an array expression.
  libs?: ('test' | 'express' | 'fetch')[];   // extra in-browser tools for this lesson
  checks: Check<ConsoleCtx>[];
}

export type Lesson = WebLesson | GridLesson | ConsoleLesson;

export interface Kingdom {
  id: KingdomId;
  name: string;
  lang: string;        // "HTML", "CSS", ...
  tagline: string;
  color: string;
  emblem: string;      // key into Emblem icons
  course: 'frontend' | 'backend';
  available: boolean;
  intro: string;
  trophy: { id: string; name: string; desc: string };
}
