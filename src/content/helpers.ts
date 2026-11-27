// Small helpers that make lesson checks short and readable.
import type { WebCtx } from './types';
import { stripComments } from '../runners/engine';

/** Normalises any CSS colour ("gold", "#ffd700") to the browser's rgb() form. */
export function color(c: WebCtx, value: string) {
  const probe = c.doc.createElement('span');
  probe.style.color = value;
  c.doc.body.appendChild(probe);
  const out = c.win.getComputedStyle(probe).color;
  probe.remove();
  return out;
}

export const sameColor = (c: WebCtx, actual: string, expected: string) => color(c, actual) === color(c, expected);

/** Source of a file with comments removed. */
export const src = (c: WebCtx, file: string) => stripComments(c.files[file] ?? '');

export const px = (v: string) => parseFloat(v) || 0;

/** Text of an element, trimmed, with whitespace collapsed. */
export const txt = (el: Element | null | undefined) => (el?.textContent ?? '').replace(/\s+/g, ' ').trim();

export const lower = (s: string) => s.toLowerCase();

/** True when the code (comments removed) matches the pattern. */
export const uses = (code: string, re: RegExp) => re.test(stripComments(code));
