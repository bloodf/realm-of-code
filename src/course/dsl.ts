// Tiny helpers so lessons are quick to write and easy to read.
import type { Choice, CodeLang, Exercise, Fill, LessonNode, Match, Order, Teach, TypeIn, Bug, Unit, Sql, Terminal } from './types';
import type { Lesson as CodeLesson } from '../content/types';
import { CODE_LESSONS } from '../content';

export const teach = (title: string, body: string, code?: string, lang?: CodeLang): Teach => ({ t: 'teach', title, body, code, lang });

/** Multiple choice. The first option listed is NOT special: pass the index of the right one. */
export const mc = (q: string, options: string[], answer: number, explain?: string, extra: Partial<Choice> = {}): Choice =>
  ({ t: 'choice', q, options, answer, explain, ...extra });

/** Multiple choice with a code snippet above the options. */
export const mcc = (q: string, code: string, options: string[], answer: number, explain?: string, lang: CodeLang = 'js'): Choice =>
  ({ t: 'choice', q, code, lang, options, answer, explain, codeOptions: options.every((o) => o.length < 40 && /[<>{}()=;.#:/[\]"'`*$]/.test(o)) });

/** "What does this print?" The verifier actually runs the JS to prove the answer. */
export const out = (code: string, options: string[], answer: number, explain?: string): Choice =>
  ({ t: 'choice', q: 'What does this code print?', code, lang: 'js', options, answer, explain, codeOptions: true, run: true });

/** "What does this Python print?" The verifier runs it on real Python. */
export const outPy = (code: string, options: string[], answer: number, explain?: string): Choice =>
  ({ t: 'choice', q: 'What does this code print?', code, lang: 'py', options, answer, explain, codeOptions: true, run: true });
/** "What does this PHP print?" The verifier runs it on real PHP. */
export const outPhp = (code: string, options: string[], answer: number, explain?: string): Choice =>
  ({ t: 'choice', q: 'What does this code print?', code, lang: 'php', options, answer, explain, codeOptions: true, run: true });

export const tf = (statement: string, truth: boolean, explain?: string): Choice =>
  ({ t: 'choice', q: statement, options: ['True', 'False'], answer: truth ? 0 : 1, explain });

export const fill = (q: string, code: string, answers: string[], distractors: string[], explain?: string, lang: CodeLang = 'js'): Fill =>
  ({ t: 'fill', q, code, answers, distractors, explain, lang });

export const order = (q: string, lines: string[], explain?: string, lang: CodeLang = 'js'): Order => ({ t: 'order', q, lines, explain, lang });

export const match = (q: string, pairs: [string, string][], explain?: string): Match => ({ t: 'match', q, pairs, explain });

export const type = (q: string, answers: string[], extra: Partial<TypeIn> = {}): TypeIn => ({ t: 'type', q, answers, ...extra });

export const bug = (q: string, code: string, line: number, explain: string, lang: CodeLang = 'js'): Bug => ({ t: 'bug', q, code, line, explain, lang });

export const sql = (x: Omit<Sql, 't'>): Sql => ({ t: 'sql', ...x });

export const term = (x: Omit<Terminal, 't'>): Terminal => ({ t: 'terminal', ...x });

/** Wrap an existing code challenge (from src/content/lessons) as an exercise. */
export function code(id: string) {
  const lesson = CODE_LESSONS[id];
  if (!lesson) throw new Error('Unknown code lesson ' + id);
  return { t: 'code' as const, lesson };
}

export const codeOf = (lesson: CodeLesson) => ({ t: 'code' as const, lesson });

export const lesson = (id: string, title: string, exercises: Exercise[]): LessonNode => ({ id, title, kind: 'lesson', exercises });

/** A node that is one code challenge. */
export const challenge = (id: string, title?: string): LessonNode => {
  const c = code(id);
  return { id: 'c-' + id, title: title ?? c.lesson.title, kind: c.lesson.boss ? 'project' : 'challenge', exercises: [c] };
};

export const challengeOf = (lessonObj: CodeLesson, kind: 'challenge' | 'project' = 'challenge'): LessonNode =>
  ({ id: 'c-' + lessonObj.id, title: lessonObj.title, kind, exercises: [codeOf(lessonObj)] });

export const node = (id: string, title: string, kind: 'challenge' | 'project', exercises: Exercise[]): LessonNode => ({ id, title, kind, exercises });

export const unit = (id: string, title: string, desc: string, guide: string, lessons: LessonNode[]): Unit => ({ id, title, desc, guide, lessons });
