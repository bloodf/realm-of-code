// One Code Farm level: the farm (the FarmStage scene, drawn in a viewport on the left),
// your program on the right (Blockly blocks or a code editor), goals at the bottom.
// Press Run and the farmer acts out your program.
import { t, tn, up } from '../../i18n';
import Phaser from 'phaser';
import { autocompletion, type CompletionContext } from '@codemirror/autocomplete';
import { UIScene } from '../base';
import { useGame } from '../../game/store';
import { LEVELS, LEVEL_BY_ID, CHAPTERS, starsFor, type FarmLevel as Level } from '../../farm/levels';
import { FarmScene } from '../../farm/FarmScene';
import { toBlocklyJson, codeLines, toJs } from '../../farm/program';
import type * as BlocksModule from '../../farm/blocks';
import type { WorkspaceSvg, Events as BlocklyEvents, utils as BlocklyUtils } from 'blockly';

/** Blockly is big, so it loads the first time a block level opens. */
let B: typeof BlocksModule | null = null;
const loadBlocks = () => import('../../farm/blocks').then((m) => { B = m; });
import type { FarmEvent, FarmResult } from '../../farm/sim';
import { runJs } from '../../runners/code';
import { CodeEditor } from '../../ui/codeEditor';
import { ANIMS } from '../../components/anims';
import { NPC_BY_COURSE } from '../../pixel/art';
import { anim, Button, sprite, text, iconTex, modal, bigTitle, UI, woodBg, parchmentBg, bubble } from '../../ui/widgets';
import { richTexture } from '../../ui/rich';
import { C, N, TITLE_FONT } from '../../ui/theme';
import { go } from '../../lib/route';
import { play } from '../../audio/sound';
import { ACHIEVEMENT_BY_ID } from '../../game/achievements';
import { farmUnlocked } from '../windows/Tavern';
import { openHelp, maybeTour, setHelpContext, noteStruggle } from '../help/helpers';

export const COMMAND_DOCS: Record<string, { snippet: string; info: string }> = {
  move: { snippet: 'move("right");', info: 'Walk one tile: "right", "left", "up" or "down"' },
  plant: { snippet: 'plant("wheat");', info: 'Plant "wheat", "carrot" or "pumpkin"' },
  water: { snippet: 'water();', info: 'Water this tile' },
  harvest: { snippet: 'harvest();', info: 'Pick a ripe crop' },
  sleep: { snippet: 'sleep();', info: 'End the day: watered crops grow' },
  till: { snippet: 'till();', info: 'Turn grass into farmland' },
  pullWeed: { snippet: 'pullWeed();', info: 'Pull the weeds here' },
  nextRow: { snippet: 'nextRow();', info: 'Go down one row, back to the left side' },
  refill: { snippet: 'refill();', info: 'Fill the can (next to the pond)' },
  say: { snippet: 'say("Hello!");', info: 'The farmer says something' },
  isDry: { snippet: 'isDry()', info: 'true if this tile is dry farmland' },
  isRipe: { snippet: 'isRipe()', info: 'true if the crop here is ripe' },
  hasCrop: { snippet: 'hasCrop()', info: 'true if something grows here' },
  hasWeed: { snippet: 'hasWeed()', info: 'true if there are weeds here' },
  isGrass: { snippet: 'isGrass()', info: 'true if this tile is grass' },
  isField: { snippet: 'isField()', info: 'true if you stand on farmland' },
  canMove: { snippet: 'canMove("right")', info: 'true if you can walk that way' },
  waterLeft: { snippet: 'waterLeft()', info: 'How much water is in the can' },
};

function completions(tools: string[]) {
  return (ctx: CompletionContext) => {
    const word = ctx.matchBefore(/\w*/);
    if (!word || (word.from === word.to && !ctx.explicit)) return null;
    const extra = ['for (let i = 0; i < 6; i++) {\n  \n}', 'if () {\n  \n}', 'while () {\n  \n}', 'function name() {\n  \n}', 'let count = 0;'];
    return {
      from: word.from,
      options: [
        ...tools.filter((t) => COMMAND_DOCS[t]).map((t) => ({ label: COMMAND_DOCS[t].snippet.replace(/;$/, ''), apply: COMMAND_DOCS[t].snippet.replace(/;$/, ''), detail: COMMAND_DOCS[t].info, type: 'function' })),
        ...extra.map((e) => ({ label: e.split('\n')[0], apply: e, type: 'keyword' })),
      ],
    };
  };
}

type Phase = 'intro' | 'edit' | 'running' | 'done';
interface Outcome { goals: { text: string; ok: boolean }[]; mistakes: number; size: number; stars: number; error: string | null; reward?: { xp: number; gold: number; first: boolean; achievements: string[] } }
interface St {
  phase: Phase; typing: boolean; code: string; genCode: string; blocks: number; speed: number; outcome: Outcome | null;
  hud: { wheat: number; carrot: number; pumpkin: number; water: number; day: number }; hints: number; fails: number; say: string; panel: 'blocks' | 'code'; mtab: 'farm' | 'program';
  __ws?: WorkspaceSvg; __div?: HTMLDivElement; __ed?: CodeEditor; __stop?: boolean; __rt?: number;
}

const SPEEDS = [1, 2, 4, 8];

export class FarmLevelScene extends UIScene {
  private stage: FarmScene | null = null;
  private stageReady: Promise<void> = Promise.resolve();
  constructor() { super('FarmLevel'); }

  get lv(): Level | undefined { return LEVEL_BY_ID[String(this.p.id)]; }

  get st(): St {
    const s = this.p.st as unknown as St;
    if (s.phase === undefined) {
      const lv = this.lv;
      const draft = useGame.getState().drafts['farm:' + this.p.id];
      Object.assign(s, {
        phase: lv?.learn || lv?.n === 1 ? 'intro' : 'edit', typing: lv?.mode === 'code' || draft?.typing === '1', code: draft?.code ?? lv?.starter ?? '', genCode: '', blocks: 0, speed: 1, outcome: null,
        hud: { wheat: 0, carrot: 0, pumpkin: 0, water: lv?.farm.can ?? 99, day: 1 }, hints: 0, fails: 0, say: lv?.story ?? '', panel: 'blocks', mtab: 'program',
      } satisfies St);
    }
    return s;
  }

  build() {
    const lv = this.lv;
    const st = this.st;
    const { W, H } = this;
    const s = useGame.getState();
    this.game.registry.set('debug:FarmLevel', () => ({ id: lv?.id ?? null, phase: st.phase, stars: st.outcome?.stars ?? null, blocks: st.blocks, ready: !!(st.__ws || st.__ed) && !!this.stage && this.sys.isActive() }));
    (window as unknown as { __farmDebug: unknown }).__farmDebug = this.debug;
    this.events.once('shutdown', () => {
      if (!this.rebuilding) { st.__ws?.dispose(); st.__div?.remove(); st.__ed?.destroy(); this.scene.stop('FarmStage'); }
    });
    if (!lv || !farmUnlocked(lv.id, s.farm)) {
      parchmentBg(this);
      anim(this, W / 2 - 40, H / 2 - 120, ANIMS.npcIdle('farm'), 4, 80);
      text(this, W / 2, H / 2 - 20, !lv ? 'No such field.' : 'Finish the field before this one first.', 26, C.ink, { fontStyle: 'bold' }).setOrigin(0.5, 0);
      new Button(this, W / 2 - 110, H / 2 + 30, 'Back to the farm', () => go('farm'), { variant: 'ghost', w: 220, id: 'farm.back' });
      return;
    }
    const narrow = this.narrow;
    const usesBlocks = lv.mode !== 'code' && !st.typing;
    if (usesBlocks && !B) {
      parchmentBg(this);
      anim(this, W / 2 - 40, H / 2 - 110, ANIMS.npcIdle('farm'), 4, 80);
      text(this, W / 2, H / 2, 'Bess is fetching the blocks...', 24, C.ink, { fontStyle: 'bold' }).setOrigin(0.5, 0);
      void loadBlocks().then(() => this.rebuild());
      return;
    }
    const chapter = CHAPTERS[lv.chapter - 1];
    const best = s.farm[lv.id]?.stars ?? 0;

    // ---- layout ----
    const topH = narrow ? 54 : 64;
    const goalsH = narrow ? 70 : 52;
    const mtabH = narrow ? 58 : 0;
    const mainY = topH, mainH = H - topH - goalsH - mtabH;
    const codeW = narrow ? W : Math.max(380, Math.min(620, Math.floor(W * 0.45)));
    const stageRect = narrow ? { x: 0, y: mainY, w: W, h: mainH } : { x: 0, y: mainY, w: W - codeW - 6, h: mainH };
    const codeRect = narrow ? { x: 0, y: mainY, w: W, h: mainH } : { x: W - codeW, y: mainY, w: codeW, h: mainH };
    const showStage = !narrow || st.mtab === 'farm';
    const showCode = !narrow || st.mtab === 'program';

    // ---- the farm (its own scene, drawn in the stage rectangle) ----
    const view = showStage ? stageRect : { x: -5000, y: 0, w: stageRect.w, h: stageRect.h };
    const sm = this.scene;
    const existing = sm.get('FarmStage') as FarmScene | null;
    if (existing && sm.isActive('FarmStage')) { this.stage = existing; existing.setView(view); }
    else this.stageReady = this.startStage(view);
    sm.sendToBack('FarmStage');

    // ---- top bar ----
    woodBg(this, 0, 0, W, topH);
    this.add.rectangle(0, topH - 6, W, 6, 0x1c110a).setOrigin(0, 0);
    new Button(this, 8, (topH - 46) / 2 - 2, '', () => go('farm'), { variant: 'wood', icon: 'x', w: 46, h: 44, id: 'farm.close' });
    text(this, 66, narrow ? 4 : 6, up(t('Chapter {n}', { n: lv.chapter })) + ' · ' + up(chapter.title), narrow ? 12 : 14, '#ffd66b', { fontStyle: 'bold' });
    this.add.text(66, narrow ? 18 : 22, `${lv.n}. ${lv.title}`, { fontFamily: TITLE_FONT, fontSize: narrow ? '26px' : '34px', color: '#ffd66b', stroke: '#1c110a', strokeThickness: 5 });
    let rx = W - 10;
    new Button(this, rx - 54, (topH - 46) / 2 - 2, '', () => openHelp(this), { variant: 'gold', sprite: 'fairy', w: 54, h: 44, id: 'farm.help' });
    rx -= 64;
    if (!narrow) {
      const mode = text(this, rx, 20, lv.mode === 'blocks' ? 'BLOCKS' : lv.mode === 'hybrid' ? 'BLOCKS + CODE' : 'JAVASCRIPT', 16, C.cream, { fontStyle: 'bold', backgroundColor: '#2b1a12', padding: { x: 8, y: 4 } }).setOrigin(1, 0);
      rx -= mode.width + 12;
      for (let k = 2; k >= 0; k--) { sprite(this, rx - 26, 18, 'starIcon', 24).setAlpha(k < best ? 1 : 0.25); rx -= 26; }
    }

    // ---- stage overlays (HUD, Bess, controls) ----
    if (showStage) {
      const hudItems: [string, string][] = [['wheat3', String(st.hud.wheat)]];
      const rows = lv.farm.rows.join('');
      if (/[kc]/.test(rows) || ['f25', 'f28', 'f30'].includes(lv.id)) hudItems.push(['carrot3', String(st.hud.carrot)]);
      if (/[qp]/.test(rows) || ['f25', 'f30'].includes(lv.id)) hudItems.push(['pumpkin3', String(st.hud.pumpkin)]);
      if (lv.farm.can !== undefined) hudItems.push(['wateringCan', String(st.hud.water)]);
      if (lv.tools.includes('sleep')) hudItems.push(['starIcon', `Day ${st.hud.day}`]);
      let hx = stageRect.x + stageRect.w - 10;
      for (const [spr, v] of hudItems.reverse()) {
        const t = text(this, 0, 0, v, 20, '#fff3d6', { fontStyle: 'bold' });
        const w = t.width + 40;
        hx -= w + 6;
        const g = this.add.graphics(); g.fillStyle(0x1c110a).fillRect(hx - 3, stageRect.y + 7, w + 6, 38); g.fillStyle(0x2b1a12, 0.9).fillRect(hx, stageRect.y + 10, w, 32);
        sprite(this, hx + 4, stageRect.y + 14, spr, 24);
        t.setPosition(hx + 32, stageRect.y + 14);
      }
      const bw = Math.min(460, stageRect.w * 0.62);
      const b = bubble(this, stageRect.x + 80, stageRect.y + 10, bw, st.say, 'Bess', narrow ? 16 : 18);
      UI.area(this, 'farm.say', stageRect.x + 8, stageRect.y + 10, bw + 72, b.h, 'Bess');
      anim(this, stageRect.x + 8, stageRect.y + 10 + b.h - 64, [...ANIMS.npcTalk('farm'), ...ANIMS.npcIdle('farm')], 4, 64);
      if (!narrow) {
        const cy = stageRect.y + stageRect.h - 78;
        let cx = stageRect.x + stageRect.w / 2 - 230;
        if (st.phase === 'running') { const sb = new Button(this, cx, cy, 'Stop', () => this.stop(), { variant: 'red', icon: 'x', w: 170, h: 62, size: 24, id: 'farm.stop' }); cx += sb.bw + 12; }
        else { const rb = new Button(this, cx, cy, 'Run', () => void this.run(), { variant: 'green', icon: 'play', w: 170, h: 62, size: 26, id: 'farm.run' }); cx += rb.bw + 12; }
        const reset = new Button(this, cx, cy + 4, 'Reset', () => void this.reset(), { variant: 'paper', icon: 'reset', h: 56, id: 'farm.reset', disabled: st.phase === 'running' });
        cx += reset.bw + 12;
        new Button(this, cx, cy + 4, `${st.speed}x`, () => { st.speed = SPEEDS[(SPEEDS.indexOf(st.speed) + 1) % SPEEDS.length]; this.rebuild(); }, { variant: 'paper', icon: 'speed', h: 56, id: 'farm.speed' });
      }
    }

    // ---- code panel ----
    if (showCode) this.codePanel(lv, codeRect, usesBlocks);
    else this.hideDom();

    // ---- goals ----
    const gy = H - goalsH - mtabH;
    parchmentBg(this, 0, gy, W, goalsH);
    UI.area(this, 'farm.goals', 0, gy, W, goalsH, 'Goals');
    this.add.rectangle(0, gy, W, 6, 0x1c110a).setOrigin(0, 0);
    let gx = 14, gyy = gy + 16;
    const sizeLabel = usesBlocks ? t('blocks') : t('lines');
    const goalItem = (label: string, ok: boolean | undefined, star: boolean) => {
      const t = text(this, 0, 0, label, narrow ? 14 : 17, star && ok === true ? C.greenDark : C.ink, { fontStyle: 'bold' });
      const w = t.width + 34;
      if (gx + w > W - 10) { gx = 14; gyy += 26; }
      if (star) { const sp = sprite(this, gx, gyy - 2, 'starIcon', 20); if (ok === false) sp.setTint(0x777777).setAlpha(0.6); }
      else {
        const g = this.add.graphics(); g.fillStyle(0x2b1a12).fillRect(gx, gyy - 1, 22, 22); g.fillStyle(ok === true ? N(C.green) : ok === false ? N(C.red) : 0xfff4dc).fillRect(gx + 3, gyy + 2, 16, 16);
        if (ok !== undefined) text(this, gx + 11, gyy, ok ? '✓' : '✗', 14, '#ffffff', { fontStyle: 'bold' }).setOrigin(0.5, 0);
      }
      t.setPosition(gx + 28, gyy);
      gx += w + 16;
    };
    const out = st.outcome;
    lv.goals.forEach((g, i) => goalItem(g.text, out?.goals[i]?.ok, false));
    goalItem('No mistakes', out ? out.mistakes === 0 && !out.error : undefined, true);
    goalItem(`${lv.par} ${sizeLabel} or fewer`, out ? out.size <= lv.par : undefined, true);

    // ---- phone tabs ----
    if (narrow) {
      const ty = H - mtabH;
      woodBg(this, 0, ty, W, mtabH);
      const tw = (W - 24) / 3;
      new Button(this, 6, ty + 6, 'Farm', () => { st.mtab = 'farm'; this.rebuild(); }, { variant: st.mtab === 'farm' ? 'gold' : 'wood', icon: 'map', w: tw, h: 46, size: 17, id: 'farm.tab.farm' });
      new Button(this, 12 + tw, ty + 6, 'Program', () => { st.mtab = 'program'; this.rebuild(); }, { variant: st.mtab === 'program' ? 'gold' : 'wood', icon: 'code', w: tw, h: 46, size: 17, id: 'farm.tab.program' });
      new Button(this, 18 + tw * 2, ty + 6, st.phase === 'running' ? 'Stop' : 'Run', () => (st.phase === 'running' ? this.stop() : void this.run()), { variant: st.phase === 'running' ? 'red' : 'green', icon: st.phase === 'running' ? 'x' : 'play', w: tw, h: 46, size: 17, id: 'farm.run' });
    }

    // ---- modals ----
    if (st.phase === 'intro') this.intro(lv);
    if (st.phase === 'done' && st.outcome && (st.outcome.stars > 0 || st.outcome.error)) this.resultModal(lv);
    this.input.keyboard?.on('keydown-ENTER', (e: KeyboardEvent) => { if (st.phase === 'intro') { st.phase = 'edit'; this.rebuild(); } else if ((e.ctrlKey || e.metaKey) && st.phase !== 'running') void this.run(); });
    const screen = usesBlocks ? 'FarmLevel' : 'FarmLevel:code';
    setHelpContext(this, { screen, item: lv.id, watch: st.phase === 'edit', button: 'farm.help' });
    if (st.phase === 'edit') maybeTour(this, screen);
  }

  private startStage(view: { x: number; y: number; w: number; h: number }) {
    const lv = this.lv!;
    const prof = useGame.getState().profile!;
    return new Promise<void>((resolve) => {
      const data = { view, def: lv.farm, seed: lv.id, avatar: prof.avatar, tunic: prof.tunic, onReady: (sc: FarmScene) => { this.stage = sc; resolve(); } };
      const sm = this.scene;
      if (sm.get('FarmStage') && (sm.isActive('FarmStage') || sm.isPaused('FarmStage'))) (sm.get('FarmStage') as FarmScene).scene.restart(data);
      else sm.launch('FarmStage', data);
      sm.sendToBack('FarmStage');
    });
  }

  private hideDom() {
    const st = this.st;
    if (st.__div) st.__div.style.display = 'none';
  }

  // ---------------- code panel ----------------
  private codePanel(lv: Level, r: { x: number; y: number; w: number; h: number }, usesBlocks: boolean) {
    const st = this.st;
    const s = useGame.getState();
    parchmentBg(this, r.x, r.y, r.w, r.h);
    if (!this.narrow) this.add.rectangle(r.x - 6, r.y, 6, r.h, 0x1c110a).setOrigin(0, 0);
    let y = r.y;
    if (lv.mode === 'hybrid' && !st.typing) {
      const g = this.add.graphics(); g.fillStyle(N('#e2c994')).fillRect(r.x, y, r.w, 54); g.fillStyle(0x2b1a12).fillRect(r.x, y + 51, r.w, 3);
      new Button(this, r.x + 8, y + 6, 'Blocks', () => { st.panel = 'blocks'; this.rebuild(); }, { variant: st.panel === 'blocks' ? 'blue' : 'paper', icon: 'board', size: 15, h: 40, id: 'farm.panel.blocks' });
      new Button(this, r.x + 130, y + 6, 'The code', () => { st.panel = 'code'; this.rebuild(); }, { variant: st.panel === 'code' ? 'blue' : 'paper', icon: 'code', size: 15, h: 40, id: 'farm.panel.code' });
      const tb = new Button(this, 0, y + 6, 'Type it instead', () => this.switchToTyping(), { variant: 'purple', size: 15, h: 40, id: 'farm.type' });
      tb.x = r.x + r.w - tb.bw - 8;
      y += 54;
    }
    const footH = 52;
    const areaH = r.y + r.h - y - footH;
    if (usesBlocks) UI.area(this, 'farm.code', r.x, y, r.w, areaH, 'Your program');
    if (usesBlocks) {
      this.blockly(lv, r.x, y, r.w, st.panel === 'code' && lv.mode === 'hybrid' ? Math.round(areaH * 0.55) : areaH);
      if (lv.mode === 'hybrid' && st.panel === 'code') {
        const cy = y + Math.round(areaH * 0.55);
        const g = this.add.graphics(); g.fillStyle(N('#e9d6a8')).fillRect(r.x, cy, r.w, areaH - Math.round(areaH * 0.55)); g.fillStyle(0x2b1a12).fillRect(r.x, cy, r.w, 4);
        text(this, r.x + 12, cy + 10, 'This is the JavaScript your blocks make. It does exactly the same thing.', 15, C.inkSoft, { wordWrap: { width: r.w - 24 } });
        const ct = richTexture(this, '```\n' + (st.genCode || '// drag blocks under "when Run"') + '\n```', { width: r.w - 24, size: 19, lang: 'js' });
        const img = this.add.image(r.x + 12, cy + 36, ct.key).setOrigin(0, 0);
        const maxH = areaH - Math.round(areaH * 0.55) - 46;
        if (ct.h > maxH) img.setCrop(0, 0, ct.w, maxH);
      }
      let tip = st.__div?.querySelector('.blockly-hint') as HTMLDivElement | null;
      if (lv.n <= 2 && st.blocks === 0) {
        if (!tip && st.__div) {
          tip = document.createElement('div');
          tip.className = 'blockly-hint';
          tip.textContent = '◀ Drag a block from the left and drop it under "when ▶ Run"';
          st.__div.appendChild(tip);
        }
      } else tip?.remove();
    } else {
      if (st.__div) st.__div.style.display = 'none';
      // command buttons
      const tools = lv.tools.filter((t) => COMMAND_DOCS[t]);
      const cg = this.add.graphics(); cg.fillStyle(0x2a1d14).fillRect(r.x, y, r.w, 10);
      let cx = r.x + 8, cy = y + 8, rowH = 0;
      const chips: [number, number, string][] = [];
      for (const t of tools) {
        const label = COMMAND_DOCS[t].snippet.replace(/;$/, '');
        const w = label.length * 10 + 24;
        if (cx + w > r.x + r.w - 8) { cx = r.x + 8; cy += 40; }
        chips.push([cx, cy, t]);
        cx += w + 6; rowH = cy + 40 - y;
      }
      cg.fillRect(r.x, y, r.w, rowH + 6);
      UI.area(this, 'farm.cmds', r.x, y, r.w, rowH + 6, 'Commands');
      for (const [x, yy, t] of chips) {
        const label = COMMAND_DOCS[t].snippet.replace(/;$/, '');
        const b = this.add.text(x, yy, label, { fontFamily: "'VT323', monospace", fontSize: '22px', color: '#ffd479', backgroundColor: '#3e2f23', padding: { x: 10, y: 4 } }).setInteractive({ useHandCursor: true });
        b.on('pointerup', () => { st.__ed?.insert(COMMAND_DOCS[t].snippet); play('click'); });
        UI.reg(this, 'cmd.' + t, b, COMMAND_DOCS[t].info);
      }
      y += rowH + 6;
      if (!st.__ed) {
        st.__ed = new CodeEditor([{ name: 'farm.js', lang: 'js', code: st.code }], { 'farm.js': st.code }, s.settings.fontSize, [autocompletion({ override: [completions(lv.tools)], icons: false })]);
        st.__ed.onChange = (_n, v) => {
          st.code = v;
          const sizeT = this.children.getByName('sizeLabel') as Phaser.GameObjects.Text | null;
          sizeT?.setText(`${codeLines(v)} lines · 3rd star at ${lv.par} or fewer`).setColor(codeLines(v) <= lv.par ? C.greenDark : C.inkSoft);
          clearTimeout((st as unknown as { __t?: number }).__t);
          (st as unknown as { __t?: number }).__t = window.setTimeout(() => useGame.getState().saveDraft('farm:' + lv.id, { ...(useGame.getState().drafts['farm:' + lv.id] ?? {}), code: v, typing: st.typing ? '1' : '' }), 400);
        };
        st.__ed.onRun = () => void this.run();
      }
      const ed = st.__ed;
      Object.assign(ed.el.style, { width: `${r.w}px`, height: `${r.y + r.h - y - footH}px` });
      UI.area(this, 'farm.code', r.x, y, r.w, r.y + r.h - y - footH, 'Your code');
      this.add.dom(r.x, y, ed.el).setOrigin(0, 0);
    }
    // footer: size, hints, solution
    const fy = r.y + r.h - footH;
    const g = this.add.graphics(); g.fillStyle(N('#e2c994')).fillRect(r.x, fy, r.w, footH); g.fillStyle(0x2b1a12).fillRect(r.x, fy, r.w, 3);
    const size = usesBlocks ? st.blocks : codeLines(st.code);
    text(this, r.x + 12, fy + 15, `${size} ${usesBlocks ? t('blocks') : t('lines')} · 3rd star at ${lv.par} or fewer`, 16, size <= lv.par ? C.greenDark : C.inkSoft, { fontStyle: 'bold' }).setName('sizeLabel');
    let bx = r.x + r.w - 8;
    const hint = new Button(this, 0, fy + 6, st.hints === 0 ? 'Free hint' : st.hints >= lv.hints.length ? 'No more' : `Hint · ${s.items.bulb}`, () => this.showHint(), { variant: 'paper', sprite: 'bulb', size: 15, h: 42, disabled: st.hints >= lv.hints.length, id: 'farm.hint' });
    bx -= hint.bw; hint.x = bx;
    if (st.fails >= 2) { const sb = new Button(this, 0, fy + 6, 'Solution', () => this.showSolution(), { variant: 'paper', icon: 'eye', size: 15, h: 42, id: 'farm.solution' }); bx -= sb.bw + 8; sb.x = bx; }
  }

  private blockly(lv: Level, x: number, y: number, w: number, h: number) {
    const st = this.st;
    const prof = useGame.getState().profile!;
    if (!st.__div) {
      const { setupBlocks, theme, toolboxFor, Blockly } = B!;
      setupBlocks(prof.avatar);
      const div = document.createElement('div');
      div.className = 'blockly-dom';
      Object.assign(div.style, { width: `${w}px`, height: `${h}px` });
      document.body.appendChild(div);
      const ws = Blockly.inject(div, {
        toolbox: toolboxFor(lv.tools) as unknown as BlocklyUtils.toolbox.ToolboxDefinition,
        theme: theme(), renderer: 'zelos', trashcan: true, sounds: false, media: import.meta.env.BASE_URL + 'blockly-media/',
        zoom: { controls: true, wheel: false, startScale: 0.85, maxScale: 1.6, minScale: 0.5 },
        move: { scrollbars: true, drag: true, wheel: true },
        grid: { spacing: 28, length: 3, colour: '#e2cc9c', snap: false },
      });
      const draft = useGame.getState().drafts['farm:' + lv.id];
      try { Blockly.serialization.workspaces.load(draft?.blocks ? JSON.parse(draft.blocks) : toBlocklyJson([]), ws); }
      catch { Blockly.serialization.workspaces.load(toBlocklyJson([]), ws); }
      ws.addChangeListener(Blockly.Events.disableOrphans);
      ws.addChangeListener((e: BlocklyEvents.Abstract) => {
        if (e.isUiEvent) return;
        const before = st.blocks;
        st.genCode = B!.workspaceCode(ws, false);
        st.blocks = B!.blockCountOf(ws);
        useGame.getState().saveDraft('farm:' + lv.id, { ...(useGame.getState().drafts['farm:' + lv.id] ?? {}), blocks: JSON.stringify(Blockly.serialization.workspaces.save(ws)) });
        const label = this.children?.getByName('sizeLabel') as Phaser.GameObjects.Text | null;
        label?.setText(`${st.blocks} blocks · 3rd star at ${lv.par} or fewer`).setColor(st.blocks <= lv.par ? C.greenDark : C.inkSoft);
        if (st.blocks > 0) st.__div?.querySelector('.blockly-hint')?.remove();
        // never rebuild the screen in the middle of a drag (it would drop the block)
        if (lv.mode === 'hybrid' && st.panel === 'code') {
          const again = () => { if (ws.isDragging()) { st.__rt = window.setTimeout(again, 250); return; } if (this.sys.isActive()) this.rebuild(); };
          clearTimeout(st.__rt); st.__rt = window.setTimeout(again, 250);
        }
        void before;
      });
      st.__div = div; st.__ws = ws;
      st.genCode = B!.workspaceCode(ws, false);
      st.blocks = B!.blockCountOf(ws);
    }
    const div = st.__div;
    div.style.display = '';
    Object.assign(div.style, { width: `${w}px`, height: `${h}px` });
    this.add.dom(x, y, div).setOrigin(0, 0);
    setTimeout(() => { if (st.__ws) B!.Blockly.svgResize(st.__ws); }, 0);
  }

  // ---------------- actions ----------------
  private async reset() {
    const st = this.st;
    st.__stop = true;
    st.__ws?.highlightBlock(null);
    st.__ed?.setRunningLine(null);
    const lv = this.lv!;
    st.hud = { wheat: 0, carrot: 0, pumpkin: 0, water: lv.farm.can ?? 99, day: 1 };
    await this.startStageFresh();
    st.__stop = false;
    if (st.phase !== 'intro') st.phase = 'edit';
    this.rebuild();
  }

  private async startStageFresh() {
    const stage = this.stage;
    if (!stage) return this.stageReady;
    const lv = this.lv!;
    const prof = useGame.getState().profile!;
    const view = (stage as unknown as { d: { view: { x: number; y: number; w: number; h: number } } }).d.view;
    return new Promise<void>((resolve) => {
      stage.scene.restart({ view, def: lv.farm, seed: lv.id, avatar: prof.avatar, tunic: prof.tunic, onReady: (sc: FarmScene) => { this.stage = sc; resolve(); } });
    });
  }

  private stop() { const st = this.st; st.__stop = true; void this.reset(); }

  private async run() {
    const lv = this.lv!;
    const st = this.st;
    if (st.phase === 'running') return;
    const usesBlocks = lv.mode !== 'code' && !st.typing;
    const program = usesBlocks && st.__ws ? B!.workspaceCode(st.__ws, true) : st.code;
    const plain = usesBlocks && st.__ws ? B!.workspaceCode(st.__ws, false) : st.code;
    st.outcome = null;
    play('cast');
    await this.stageReady;
    st.hud = { wheat: 0, carrot: 0, pumpkin: 0, water: lv.farm.can ?? 99, day: 1 };
    await this.startStageFresh();
    st.phase = 'running';
    st.mtab = 'farm';
    this.rebuild();
    const res = await runJs({ kind: 'farm', code: program, farm: lv.farm }, 5000);
    const result: FarmResult | undefined = res.farm;
    const events: FarmEvent[] = result?.events ?? [];
    st.__stop = false;
    const basket = { wheat: 0, carrot: 0, pumpkin: 0 };
    await this.stage?.playEvents(events, {
      speed: () => st.speed,
      stopped: () => !!st.__stop,
      onEvent: (_i, e) => {
        if (e.block) st.__ws?.highlightBlock(e.block);
        if (e.line && !usesBlocks) st.__ed?.setRunningLine(e.line);
        let changed = false;
        if (e.t === 'harvest') { basket[e.crop]++; st.hud[e.crop] = basket[e.crop]; changed = true; }
        if (e.t === 'water' || e.t === 'refill') { st.hud.water = e.left; changed = true; }
        if (e.t === 'sleep') { st.hud.day = e.day + 1; changed = true; }
        if (changed && this.sys.isActive()) this.rebuild();
      },
    });
    if (st.__stop) return;
    st.__ws?.highlightBlock(null);
    st.__ed?.setRunningLine(null);
    const error = res.timedOut ? 'Your program ran forever, so the farmer stopped. Does a loop never end?'
      : res.error ? `${res.error.name === 'Exhausted' || res.error.name === 'NotAvailable' ? '' : res.error.name + ': '}${res.error.message}${res.error.line && !usesBlocks ? ` (line ${res.error.line})` : ''}` : null;
    const goals = result ? lv.goals.map((g) => ({ text: g.text, ok: g.check(result, lv, plain) })) : lv.goals.map((g) => ({ text: g.text, ok: false }));
    const size = usesBlocks ? st.blocks : codeLines(st.code);
    const stars = !error && goals.every((g) => g.ok) ? starsFor(lv, true, result?.mistakes ?? 0, size) : 0;
    const out: Outcome = { goals, mistakes: result?.mistakes ?? 0, size, stars, error };
    if (stars > 0) {
      out.reward = useGame.getState().finishFarm(lv.id, stars, size);
      this.stage?.cheer();
      play('victory');
      st.say = stars === 3 ? 'Perfect! Three stars. You farm like a true coder!' : stars === 2 ? `Well done! Can you do it with fewer ${usesBlocks ? t('blocks') : t('lines')} for the third star?` : 'You did it! Try again without mistakes for more stars.';
    } else {
      st.fails++;
      noteStruggle(this, 'farm:' + lv.id);
      play('fail');
      const first = goals.find((g) => !g.ok);
      st.say = error ? 'Something went wrong in the program. Read the message and try again!' : first ? `Not yet: "${first.text}" is not done. Press Reset, change your program and run it again.` : 'Almost!';
    }
    st.outcome = out;
    st.phase = 'done';
    this.rebuild();
  }

  private showHint() {
    const lv = this.lv!;
    const st = this.st;
    if (st.hints >= lv.hints.length) return;
    if (st.hints >= 1 && !useGame.getState().useItem('bulb')) { st.say = 'You are out of lightbulbs! Win them in minigames, or buy them from the merchant.'; this.rebuild(); return; }
    play('hint');
    st.say = lv.hints[st.hints];
    st.hints++;
    this.rebuild();
  }

  private showSolution() {
    const lv = this.lv!;
    const st = this.st;
    play('page');
    if (typeof lv.solution === 'string' || st.typing) { const code = typeof lv.solution === 'string' ? lv.solution : toJs(lv.solution); st.code = code; st.__ed?.setValues({ 'farm.js': code }); }
    else if (st.__ws) B!.Blockly.serialization.workspaces.load(toBlocklyJson(lv.solution), st.__ws);
    st.say = 'Here is one way to do it. Read it, then run it to see how it works.';
    this.rebuild();
  }

  private switchToTyping() {
    const st = this.st;
    st.code = st.genCode || '// Type your program here\n';
    st.typing = true;
    st.__ed?.destroy(); st.__ed = undefined;
    if (st.__div) st.__div.style.display = 'none';
    play('page');
    st.say = 'Now you are typing real JavaScript! It is the same program your blocks made.';
    this.rebuild();
  }

  /** For automated tests: load the solution, set the speed, run. */
  debug = {
    solve: () => this.showSolution(),
    run: () => void this.run(),
    setSpeed: (n: number) => { this.st.speed = n; },
  };

  // ---------------- modals ----------------
  private intro(lv: Level) {
    const st = this.st;
    const bess = NPC_BY_COURSE.farm;
    modal(this, 700, (c, w) => {
      let y = 18;
      const b = bubble(this, 110, y, w - 130, lv.story, `${bess.name} · ${bess.title}`, 19);
      c.add(b.c);
      c.add(anim(this, 16, y + b.h - 88, [...ANIMS.npcTalk('farm'), ...ANIMS.npcIdle('farm')], 4, 88));
      y += Math.max(b.h, 88) + 14;
      if (lv.learn) {
        const t = richTexture(this, lv.learn.body, { width: w - 76, size: 18 });
        const g = this.add.graphics(); g.fillStyle(0xfdf6e3).fillRect(20, y, w - 40, t.h + 74); g.lineStyle(3, 0x2b1a12).strokeRect(20, y, w - 40, t.h + 74);
        c.add(g);
        c.add(text(this, 38, y + 12, 'NEW IDEA', 14, C.purple, { fontStyle: 'bold' }));
        c.add(text(this, 38, y + 30, lv.learn.title, 24, C.ink, { fontStyle: 'bold' }));
        c.add(this.add.image(38, y + 62, t.key).setOrigin(0, 0));
        y += t.h + 88;
      }
      c.add(new Button(this, w - 220, y, "Let's farm!", () => { st.phase = 'edit'; play('click'); this.rebuild(); }, { variant: 'green', w: 196, h: 56, size: 22, id: 'farm.start' }));
      return y + 76;
    }, { closable: false });
  }

  private resultModal(lv: Level) {
    const st = this.st;
    const out = st.outcome!;
    const sizeLabel = lv.mode !== 'code' && !st.typing ? t('blocks') : t('lines');
    const next = LEVELS[LEVELS.indexOf(lv) + 1];
    modal(this, 580, (c, w, close) => {
      if (out.stars > 0) {
        for (let k = 0; k < 3; k++) {
          const sp = sprite(this, w / 2 - 110 + k * 76, 16, 'starIcon', 64);
          if (k >= out.stars) sp.setTint(0x666666).setAlpha(0.5);
          else { sp.setScale(1); this.tweens.add({ targets: sp, scale: 4, duration: 350, delay: 200 + k * 300, ease: 'Back.easeOut', onStart: () => play('coin') }); }
          c.add(sp);
        }
        c.add(bigTitle(this, w / 2, 90, out.stars === 3 ? 'Perfect harvest!' : 'Field complete!', 44));
        const lines: [boolean, string][] = [[true, 'All goals done'], [out.mistakes === 0, out.mistakes === 0 ? 'No mistakes' : `${tn(out.mistakes, '{n} mistake', '{n} mistakes')} (bumps, wasted water, unripe harvests...)`], [out.size <= lv.par, `${out.size} ${sizeLabel} ${out.size <= lv.par ? `(par ${lv.par})` : `: try ${lv.par} or fewer`}`]];
        let y = 156;
        for (const [ok, l] of lines) { const sp = sprite(this, 40, y, 'starIcon', 22); if (!ok) sp.setTint(0x777777).setAlpha(0.5); c.add([sp, text(this, 70, y, l, 18, ok ? C.ink : C.muted, { wordWrap: { width: w - 100 } })]); y += 30; }
        if (out.reward && (out.reward.xp || out.reward.gold)) {
          c.add([sprite(this, w / 2 - 140, y + 6, 'starIcon', 36), text(this, w / 2 - 98, y + 12, `+${out.reward.xp} XP`, 22, C.ink, { fontStyle: 'bold' }), sprite(this, w / 2 + 20, y + 6, 'coin', 36), text(this, w / 2 + 62, y + 12, `+${out.reward.gold} gold`, 22, C.ink, { fontStyle: 'bold' })]);
          y += 56;
        }
        for (const a of out.reward?.achievements ?? []) { c.add(text(this, 40, y, `${ACHIEVEMENT_BY_ID[a]?.name}: ${ACHIEVEMENT_BY_ID[a]?.desc}`, 16, C.goldDark, { fontStyle: 'bold', wordWrap: { width: w - 80 } })); y += 28; }
        y += 10;
        const again = new Button(this, 20, y, 'Play again', () => { close(); void this.reset(); }, { variant: 'ghost', size: 18, h: 50, id: 'farm.again' });
        const map = new Button(this, 20 + again.bw + 8, y, 'Farm map', () => go('farm'), { variant: 'ghost', size: 18, h: 50, id: 'farm.map' });
        c.add([again, map]);
        if (next) c.add(new Button(this, w - 190, y, 'Next field', () => go('farm/' + next.id), { variant: 'green', w: 170, h: 50, size: 20, id: 'farm.next' }));
        return y + 70;
      }
      c.add(anim(this, w / 2 - 40, 14, ANIMS.fairySad, 4, 80));
      c.add(text(this, w / 2, 100, 'The program stopped', 26, C.ink, { fontStyle: 'bold' }).setOrigin(0.5, 0));
      const t = richTexture(this, out.error ?? '', { width: w - 60, size: 17, color: '#3f2470' });
      const g = this.add.graphics(); g.fillStyle(N('#efe3ff')).fillRect(20, 140, w - 40, t.h + 20); g.lineStyle(3, N(C.purple)).strokeRect(20, 140, w - 40, t.h + 20);
      c.add([g, this.add.image(30, 150, t.key).setOrigin(0, 0)]);
      c.add(new Button(this, w / 2 - 90, 170 + t.h, 'Fix it', () => { close(); void this.reset(); }, { variant: 'green', w: 180, id: 'farm.fix' }));
      return 240 + t.h;
    });
  }
}

void iconTex;
