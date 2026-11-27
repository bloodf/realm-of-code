// A multi-file code editor (CodeMirror 6, no framework) with file tabs, a running-line
// highlight and error markers. It lives in a DOM element placed inside a Phaser scene.
import { basicSetup } from 'codemirror';
import { EditorView, keymap } from '@codemirror/view';
import { EditorState, Compartment, type Extension } from '@codemirror/state';
import { indentWithTab } from '@codemirror/commands';
import { syntaxHighlighting, indentUnit } from '@codemirror/language';
import { setDiagnostics, type Diagnostic } from '@codemirror/lint';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { javascript } from '@codemirror/lang-javascript';
import { sql as sqlLang, SQLite } from '@codemirror/lang-sql';
import { vue } from '@codemirror/lang-vue';
import { svelte } from '@replit/codemirror-lang-svelte';
import { python } from '@codemirror/lang-python';
import { php as phpLang } from '@codemirror/lang-php';
import { inkTheme, inkHighlight, runningField, setRunning, codeSize } from './editorTheme';

export type EdLang = 'html' | 'css' | 'js' | 'jsx' | 'ts' | 'vue' | 'svelte' | 'sql' | 'py' | 'php';
export interface EdFile { name: string; lang: EdLang; code: string; readonly?: boolean }

function langExt(lang: EdLang): Extension {
  switch (lang) {
    case 'html': return html();
    case 'css': return css();
    case 'js': return javascript();
    case 'jsx': return javascript({ jsx: true });
    case 'ts': return javascript({ typescript: true });
    case 'vue': return vue();
    case 'svelte': return svelte();
    case 'sql': return sqlLang({ dialect: SQLite, upperCaseKeywords: true });
    case 'py': return python();
    case 'php': return phpLang({ plain: false });
  }
}

export class CodeEditor {
  el: HTMLDivElement;
  private view: EditorView;
  private states = new Map<string, EditorState>();
  private active: string;
  private tabs: HTMLDivElement;
  private fontComp = new Compartment();
  onChange: (name: string, value: string, all: Record<string, string>) => void = () => {};
  onRun: () => void = () => {};
  values: Record<string, string>;

  constructor(private files: EdFile[], values: Record<string, string>, private fontSize: number, extra: Extension[] = []) {
    this.values = { ...values };
    this.el = document.createElement('div');
    this.el.className = 'dom-panel code-editor';
    this.tabs = document.createElement('div');
    this.tabs.className = 'ed-tabs';
    const host = document.createElement('div');
    host.className = 'ed-host';
    this.el.append(this.tabs, host);
    this.active = files.find((f) => !f.readonly)?.name ?? files[0].name;
    for (const f of files) this.states.set(f.name, this.makeState(f, this.values[f.name] ?? f.code, extra));
    this.view = new EditorView({ state: this.states.get(this.active)!, parent: host });
    this.renderTabs();
  }

  private makeState(f: EdFile, doc: string, extra: Extension[]) {
    return EditorState.create({
      doc,
      extensions: [
        basicSetup,
        keymap.of([{ key: 'Mod-Enter', run: () => { this.onRun(); return true; } }, { key: 'Mod-s', run: () => { this.onRun(); return true; } }, indentWithTab]),
        indentUnit.of('  '), EditorState.tabSize.of(2),
        inkTheme, syntaxHighlighting(inkHighlight), langExt(f.lang), runningField,
        this.fontComp.of(EditorView.theme({ '.cm-content, .cm-gutters': { fontSize: codeSize(this.fontSize) + 'px' } })),
        EditorState.readOnly.of(!!f.readonly), EditorView.lineWrapping,
        EditorView.updateListener.of((u) => { if (u.docChanged) { this.values[f.name] = u.state.doc.toString(); this.onChange(f.name, this.values[f.name], this.values); } }),
        ...extra,
      ],
    });
  }

  private renderTabs() {
    this.tabs.innerHTML = '';
    for (const f of this.files) {
      const b = document.createElement('button');
      b.className = 'ed-tab' + (f.name === this.active ? ' on' : '');
      b.textContent = f.name + (f.readonly ? ' (read-only)' : '');
      b.onclick = () => this.switchTo(f.name);
      this.tabs.appendChild(b);
    }
  }

  switchTo(name: string) {
    if (name === this.active) return;
    this.states.set(this.active, this.view.state);
    const next = this.states.get(name);
    if (!next) return;
    this.view.setState(next);
    this.active = name;
    this.renderTabs();
  }

  get activeFile() { return this.active; }

  /** Replace every file's content (reset / show solution). */
  setValues(values: Record<string, string>) {
    this.values = { ...values };
    for (const f of this.files) {
      const st = this.states.get(f.name)!;
      const doc = values[f.name] ?? f.code;
      const tr = st.update({ changes: { from: 0, to: st.doc.length, insert: doc } });
      this.states.set(f.name, tr.state);
    }
    this.view.setState(this.states.get(this.active)!);
  }

  setRunningLine(line: number | null) {
    this.view.dispatch({ effects: setRunning.of(line) });
    if (line && line <= this.view.state.doc.lines) this.view.dispatch({ effects: EditorView.scrollIntoView(this.view.state.doc.line(line).from, { y: 'nearest' }) });
  }

  setErrors(list: { file: string; line: number; message: string }[]) {
    const diags: Diagnostic[] = [];
    for (const d of list) {
      if (d.file !== this.active || d.line < 1 || d.line > this.view.state.doc.lines) continue;
      const l = this.view.state.doc.line(d.line);
      diags.push({ from: l.from, to: Math.max(l.from, l.to), severity: 'error', message: d.message });
    }
    this.view.dispatch(setDiagnostics(this.view.state, diags));
  }

  /** Insert text at the cursor (command buttons). */
  insert(text: string) {
    const v = this.view;
    const { from, to } = v.state.selection.main;
    const line = v.state.doc.lineAt(from);
    const atStart = !line.text.slice(0, from - line.from).trim();
    const indent = /^\s*/.exec(line.text)?.[0] ?? '';
    const ins = atStart ? text : '\n' + indent + text;
    v.dispatch({ changes: { from, to, insert: ins }, selection: { anchor: from + ins.length } });
    v.focus();
  }

  focus() { this.view.focus(); }
  destroy() { this.view.destroy(); this.el.remove(); }
}
