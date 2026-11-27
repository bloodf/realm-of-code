// Duolingo-style content model.
// A Path (career goal) is an ordered list of Courses. A Course has Units, a Unit has
// Lessons, and a Lesson is a short sequence of bite-sized Exercises.
import type { Lesson as CodeLesson } from '../content/types';

export type CodeLang = 'html' | 'css' | 'js' | 'ts' | 'jsx' | 'sql' | 'bash' | 'text' | 'vue' | 'svelte' | 'json' | 'py' | 'php';

interface Base {
  explain?: string;   // shown after answering (mini-markdown)
}

/** A short teaching card (not graded). */
export interface Teach { t: 'teach'; title: string; body: string; code?: string; lang?: CodeLang }

/** Pick one answer. */
export interface Choice extends Base { t: 'choice'; q: string; code?: string; lang?: CodeLang; options: string[]; answer: number; codeOptions?: boolean; run?: boolean }

/** Tap words from a bank to fill the blanks (`___`) in the code. */
export interface Fill extends Base { t: 'fill'; q: string; code: string; lang?: CodeLang; answers: string[]; distractors: string[] }

/** Put the lines in the right order (a "Parsons problem"). */
export interface Order extends Base { t: 'order'; q: string; lines: string[]; lang?: CodeLang }

/** Match the pairs. */
export interface Match extends Base { t: 'match'; q: string; pairs: [string, string][] }

/** Type a short answer. */
export interface TypeIn extends Base { t: 'type'; q: string; code?: string; lang?: CodeLang; answers: string[]; caseSensitive?: boolean; placeholder?: string }

/** Click the line with the bug. */
export interface Bug extends Base { t: 'bug'; q: string; code: string; lang?: CodeLang; line: number }

/** A real coding challenge (uses the code runners). */
export interface Code { t: 'code'; lesson: CodeLesson }

/** A SQL challenge on an in-browser SQLite database. */
export interface Sql {
  t: 'sql'; id: string; title: string; task: string; hint?: string;
  db: string;                   // schema + data
  starter: string;
  solution: string;
  ordered?: boolean;            // compare rows in order
  after?: string;               // for INSERT/UPDATE/DELETE: a query whose result must match
}

/** A simulated terminal: type real commands until the goal is reached. */
export interface Terminal {
  t: 'terminal'; id: string; task: string; hint?: string;
  setup?: Record<string, string>;          // path -> file content ('' for empty file, trailing / for folder)
  cwd?: string;
  check: (sh: import('../runners/shell').Shell) => boolean;
  solution: string[];                      // commands that reach the goal (used by the verifier)
}

export type Exercise = Teach | Choice | Fill | Order | Match | TypeIn | Bug | Code | Sql | Terminal;

export type NodeKind = 'lesson' | 'challenge' | 'project';

export interface LessonNode {
  id: string;
  title: string;
  kind: NodeKind;
  exercises: Exercise[];
}

export interface Unit {
  id: string;
  title: string;
  desc: string;
  guide: string;                 // "Guidebook": key ideas of the unit (mini-markdown)
  lessons: LessonNode[];
}

export interface Course {
  id: string;
  title: string;                 // "JavaScript"
  realm: string;                 // medieval flavour name: "The Forest of Loops"
  color: string;
  emblem: string;                // icon name
  desc: string;
  units: Unit[];
}

export interface Path {
  id: string;
  title: string;
  subtitle: string;
  desc: string;
  icon: string;
  color: string;
  courses: string[];
  role: string;                  // job title this path prepares for
}
