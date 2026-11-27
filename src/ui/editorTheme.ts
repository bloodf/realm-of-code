// The "ink" theme for code editors: parchment-dark colours, the pixel code font, and a
// highlight for the line that is running.
import { EditorView, Decoration, type DecorationSet } from '@codemirror/view';
import { StateEffect, StateField } from '@codemirror/state';
import { HighlightStyle } from '@codemirror/language';
import { tags as t } from '@lezer/highlight';

/** The pixel code font (VT323) is small for its size, so scale it up. */
export const codeSize = (n: number) => (document.documentElement.dataset.code === 'classic' ? n : Math.round(n * 1.6));

export interface EditorDiag { file: string; line: number; message: string; severity?: 'error' | 'warning' }

export const inkTheme = EditorView.theme({
  '&': { color: '#f1e4c3', backgroundColor: 'rgba(29, 20, 13, 0.98)', height: '100%' },
  '.cm-content': { fontFamily: 'var(--font-code)', caretColor: '#e8c170', padding: '10px 0' },
  '.cm-cursor': { borderLeftColor: '#e8c170', borderLeftWidth: '2px' },
  '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, ::selection': { backgroundColor: 'rgba(232,193,112,0.25) !important' },
  '.cm-gutters': { backgroundColor: 'rgba(23, 15, 9, 0.98)', color: '#7a6248', border: 'none', borderRight: '1px solid #3d2819' },
  '.cm-activeLine': { backgroundColor: 'rgba(232,193,112,0.05)' },
  '.cm-activeLineGutter': { backgroundColor: 'rgba(232,193,112,0.1)', color: '#e8c170' },
  '.cm-matchingBracket': { backgroundColor: 'rgba(143,209,79,0.25)', outline: 'none' },
  '.cm-tooltip': { backgroundColor: '#2a1d14', border: '1px solid #5a3a22', color: '#f1e4c3' },
  '.cm-tooltip-autocomplete > ul > li[aria-selected]': { backgroundColor: '#5a3a22', color: '#fff4dc' },
  '.cm-running-line': { backgroundColor: 'rgba(143, 209, 79, 0.22)', boxShadow: 'inset 3px 0 0 #8fd14f' },
  '.cm-lintRange-error': { backgroundImage: 'none', textDecoration: 'underline wavy #ff6b5a' },
  '.cm-diagnostic-error': { borderLeftColor: '#ff6b5a' },
  '.cm-foldPlaceholder': { backgroundColor: '#3d2819', border: 'none', color: '#e8c170' },
}, { dark: true });

export const inkHighlight = HighlightStyle.define([
  { tag: t.keyword, color: '#f29e6d', fontWeight: 'bold' },
  { tag: [t.name, t.deleted, t.character, t.macroName], color: '#f1e4c3' },
  { tag: [t.propertyName], color: '#9fd3e8' },
  { tag: [t.function(t.variableName), t.function(t.propertyName), t.labelName], color: '#ffd479' },
  { tag: [t.color, t.constant(t.name), t.standard(t.name)], color: '#e6a3ff' },
  { tag: [t.definition(t.name), t.separator], color: '#f1e4c3' },
  { tag: [t.typeName, t.className, t.namespace], color: '#7fd6b0' },
  { tag: [t.number, t.bool, t.null, t.atom], color: '#e6a3ff' },
  { tag: [t.operator, t.operatorKeyword, t.url, t.escape, t.regexp, t.special(t.string)], color: '#f29e6d' },
  { tag: [t.string], color: '#a8d66f' },
  { tag: [t.meta, t.comment], color: '#8c7a62', fontStyle: 'italic' },
  { tag: t.tagName, color: '#f29e6d' },
  { tag: t.attributeName, color: '#ffd479' },
  { tag: t.attributeValue, color: '#a8d66f' },
  { tag: t.heading, fontWeight: 'bold', color: '#e8c170' },
  { tag: t.invalid, color: '#ff6b5a' },
]);

export const setRunning = StateEffect.define<number | null>();
export const runningField = StateField.define<DecorationSet>({
  create: () => Decoration.none,
  update(deco, tr) {
    for (const e of tr.effects) {
      if (e.is(setRunning)) {
        if (e.value == null || e.value < 1 || e.value > tr.state.doc.lines) return Decoration.none;
        const line = tr.state.doc.line(e.value);
        return Decoration.set([Decoration.line({ class: 'cm-running-line' }).range(line.from)]);
      }
    }
    return deco.map(tr.changes);
  },
  provide: (f) => EditorView.decorations.from(f),
});

