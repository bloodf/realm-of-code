// Rich text for the game: a tiny markdown (paragraphs, **bold**, *italic*, `code`,
// lists, code blocks with highlighting) drawn onto a canvas and used as a Phaser texture.
import { tr } from '../i18n';
import type Phaser from 'phaser';
import type { CodeLang } from '../course/types';
import { tokenLines, TOKEN_COLORS } from '../lib/tokens';

export interface RichOpts {
  width: number;
  size?: number;            // font size in px
  color?: string;
  bold?: boolean;           // whole text bold
  align?: 'left' | 'center';
  lineHeight?: number;      // multiplier
  codeBg?: string;          // background of `inline code`
  codeColor?: string;
  lang?: CodeLang;          // language of ``` blocks
  shrink?: boolean;         // use the widest line as the width
  font?: string;
}

type Style = 'n' | 'b' | 'i' | 'c';
interface Run { text: string; style: Style }
type Block = { t: 'p'; runs: Run[]; bullet?: string } | { t: 'code'; text: string } | { t: 'gap' };

const FONT_BODY = 'Jersey 15';
const FONT_CODE = 'VT323';

function inline(text: string): Run[] {
  const out: Run[] = [];
  const re = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*\s][^*]*\*)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push({ text: text.slice(last, m.index), style: 'n' });
    const t = m[0];
    if (t.startsWith('`')) out.push({ text: t.slice(1, -1), style: 'c' });
    else if (t.startsWith('**')) out.push({ text: t.slice(2, -2), style: 'b' });
    else out.push({ text: t.slice(1, -1), style: 'i' });
    last = m.index + t.length;
  }
  if (last < text.length) out.push({ text: text.slice(last), style: 'n' });
  return out;
}

export function parseMd(md: string): Block[] {
  const blocks: Block[] = [];
  const lines = md.replace(/\r/g, '').split('\n');
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.startsWith('```')) {
      const buf: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) buf.push(lines[i++]);
      i++;
      blocks.push({ t: 'code', text: buf.join('\n') });
      continue;
    }
    const bullet = /^\s*[-*] (.*)$/.exec(line);
    const num = /^\s*(\d+)\. (.*)$/.exec(line);
    if (bullet) { blocks.push({ t: 'p', runs: inline(bullet[1]), bullet: '•' }); i++; continue; }
    if (num) { blocks.push({ t: 'p', runs: inline(num[2]), bullet: num[1] + '.' }); i++; continue; }
    if (!line.trim()) { if (blocks.length && blocks[blocks.length - 1].t !== 'gap') blocks.push({ t: 'gap' }); i++; continue; }
    const para: string[] = [];
    while (i < lines.length && lines[i].trim() && !lines[i].startsWith('```') && !/^\s*([-*]|\d+\.) /.test(lines[i])) para.push(lines[i++]);
    blocks.push({ t: 'p', runs: inline(para.join(' ')) });
  }
  while (blocks.length && blocks[blocks.length - 1].t === 'gap') blocks.pop();
  return blocks;
}

const fontOf = (style: Style, size: number, opts: RichOpts) => {
  const fam = opts.font ?? FONT_BODY;
  if (style === 'c') return `${Math.round(size * 1.2)}px "${FONT_CODE}"`;
  if (style === 'b' || opts.bold) return `bold ${size}px "${fam}"`;
  if (style === 'i') return `italic ${size}px "${fam}"`;
  return `${size}px "${fam}"`;
};

interface Piece { text: string; style: Style; x: number; w: number }
interface Line { pieces: Piece[]; y: number; h: number; w: number; code?: { text: { text: string; cls: string }[]; } }

let measureCtx: CanvasRenderingContext2D | null = null;
function ctxFor() {
  if (!measureCtx) measureCtx = document.createElement('canvas').getContext('2d')!;
  return measureCtx;
}

function layout(md: string, o: RichOpts) {
  const size = o.size ?? 22;
  const lh = Math.round(size * (o.lineHeight ?? 1.25));
  const g = ctxFor();
  const lines: Line[] = [];
  let y = 0;
  const codeSize = Math.round(size * 1.15);
  g.font = `${codeSize}px "${FONT_CODE}"`;
  const charW = g.measureText('M').width || codeSize * 0.5;
  const codeLh = Math.round(codeSize * 1.05);
  for (const b of parseMd(md)) {
    if (b.t === 'gap') { y += Math.round(lh * 0.45); continue; }
    if (b.t === 'code') {
      const maxChars = Math.max(8, Math.floor((o.width - 24) / charW));
      y += 4;
      const top = y;
      for (const toks of tokenLines(b.text, o.lang ?? 'js')) {
        // soft-wrap long lines
        let row: { text: string; cls: string }[] = [];
        let n = 0;
        const flush = () => { lines.push({ pieces: [], y, h: codeLh, w: o.width, code: { text: row } }); y += codeLh; row = []; n = 0; };
        for (const t of toks) {
          let rest = t.text;
          while (rest.length) {
            const room = maxChars - n;
            if (room <= 0) { flush(); continue; }
            const part = rest.slice(0, room);
            row.push({ text: part, cls: t.cls });
            n += part.length;
            rest = rest.slice(room);
          }
        }
        flush();
      }
      lines.push({ pieces: [], y: top - 8, h: y - top + 16, w: o.width, code: { text: [{ text: '\u0000box', cls: '' }] } });
      y += 12;
      continue;
    }
    // paragraph / list item: word wrap
    const indent = b.bullet ? Math.round(size * 1.3) : 0;
    let line: Line = { pieces: [], y, h: lh, w: 0 };
    let x = indent;
    if (b.bullet) line.pieces.push({ text: b.bullet, style: 'b', x: 0, w: indent });
    const push = () => { line.w = x; lines.push(line); y += lh; line = { pieces: [], y, h: lh, w: 0 }; x = indent; };
    for (const r of b.runs) {
      g.font = fontOf(r.style, size, o);
      const words = r.text.split(/(\s+)/).filter((w) => w.length);
      for (let word of words) {
        const space = /^\s+$/.test(word);
        if (space) word = ' ';
        let w = g.measureText(word).width + (r.style === 'c' ? 0 : 0);
        if (space && x === indent) continue;
        if (!space && x + w > o.width && x > indent) { push(); }
        // very long words: hard break
        while (!space && w > o.width - indent) {
          let k = word.length;
          while (k > 1 && g.measureText(word.slice(0, k)).width > o.width - indent) k--;
          line.pieces.push({ text: word.slice(0, k), style: r.style, x, w: g.measureText(word.slice(0, k)).width });
          x += g.measureText(word.slice(0, k)).width;
          push();
          word = word.slice(k);
          w = g.measureText(word).width;
        }
        const prev = line.pieces[line.pieces.length - 1];
        if (prev && prev.style === r.style && prev.x + prev.w === x && !b.bullet) { prev.text += word; prev.w += w; }
        else if (prev && prev.style === r.style && prev.x + prev.w === x && prev.text !== b.bullet) { prev.text += word; prev.w += w; }
        else line.pieces.push({ text: word, style: r.style, x, w });
        x += w;
      }
    }
    if (line.pieces.length) push();
  }
  return { lines, height: Math.max(lh, y), size, charW, codeSize };
}

let seq = 0;
const cache = new Map<string, { key: string; w: number; h: number }>();

/** Draws markdown into a texture. Returns its key and size. */
export function richTexture(scene: Phaser.Scene, md: string, o: RichOpts): { key: string; w: number; h: number } {
  md = tr(md);
  const id = JSON.stringify([md, o]);
  const hit = cache.get(id);
  if (hit && scene.textures.exists(hit.key)) return hit;
  const L = layout(md, o);
  const maxW = o.shrink ? Math.ceil(Math.max(1, ...L.lines.map((l) => (l.code ? o.width : l.w)))) : o.width;
  const H = Math.ceil(L.height + 6);
  const cv = document.createElement('canvas');
  cv.width = Math.max(1, maxW + 2); cv.height = Math.max(1, H);
  const g = cv.getContext('2d')!;
  g.textBaseline = 'alphabetic';
  const color = o.color ?? '#2b1a12';
  const off = (lw: number) => (o.align === 'center' ? Math.round((maxW - lw) / 2) : 0);
  // code block boxes first
  for (const l of L.lines) {
    if (l.code && l.code.text[0]?.text === '\u0000box') {
      g.fillStyle = '#120c08'; g.fillRect(0, l.y, maxW, l.h);
      g.fillStyle = '#2a1f18'; g.fillRect(3, l.y + 3, maxW - 6, l.h - 6);
      g.fillStyle = '#3e2f23'; g.fillRect(3, l.y + 3, maxW - 6, 3);
    }
  }
  for (const l of L.lines) {
    if (l.code) {
      if (l.code.text[0]?.text === '\u0000box') continue;
      g.font = `${L.codeSize}px "${FONT_CODE}"`;
      let x = 12;
      for (const t of l.code.text) { g.fillStyle = TOKEN_COLORS[t.cls] ?? '#f3e9d2'; g.fillText(t.text, x, l.y + L.codeSize * 0.8); x += g.measureText(t.text).width; }
      continue;
    }
    const base = l.y + Math.round(L.size * 0.95);
    const ox = off(l.w);
    for (const p of l.pieces) {
      g.font = fontOf(p.style, L.size, o);
      if (p.style === 'c') {
        g.fillStyle = o.codeBg ?? '#e9d3a0';
        g.fillRect(ox + p.x - 2, l.y + 2, p.w + 4, l.h - 2);
        g.fillStyle = o.codeColor ?? color;
      } else g.fillStyle = color;
      g.fillText(p.text, ox + p.x, base);
    }
  }
  const key = `rich:${++seq}`;
  scene.textures.addCanvas(key, cv);
  const out = { key, w: cv.width, h: cv.height };
  cache.set(id, out);
  return out;
}

/** Adds rich text as an image at (x, y) (top-left). */
export function addRich(scene: Phaser.Scene, x: number, y: number, md: string, o: RichOpts) {
  const t = richTexture(scene, md, o);
  return scene.add.image(Math.round(x), Math.round(y), t.key).setOrigin(0, 0);
}

/** Monospace code box texture (exact size). */
export function codeTexture(scene: Phaser.Scene, code: string, lang: CodeLang, width: number, size = 24) {
  return richTexture(scene, '```\n' + code + '\n```', { width, size: Math.round(size / 1.15), lang });
}
