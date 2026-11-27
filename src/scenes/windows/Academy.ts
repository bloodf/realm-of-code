// The Academy: the lesson path as a pixel world map, one section (region) at a time.
// Stops come from the adaptive plan: lessons, review stops, minigames and shortcuts.
import { t, tn, up } from '../../i18n';
import Phaser from 'phaser';
import { WindowScene } from '../base';
import { useGame } from '../../game/store';
import { COURSE_BY_ID, PATH_BY_ID, PATHS, currentIndex, pathNodes, pathProgress, unitDone } from '../../course';
import type { Course, Unit } from '../../course/types';
import { planUnit, stopState, pendingReview, learnerPace, PACE_TEXT, GAME_INFO, type Stop, type StopState, type PlanState } from '../../course/adaptive';
import { ANIMS } from '../../components/anims';
import { NPC_BY_COURSE } from '../../pixel/art';
import { biomeFor, layoutUnit, paintNode, paintUnit } from '../../pixel/scenes';
import { paintedTex, spriteTex } from '../../engine/textures';
import { anim, Button, colorPanel, modal, panel, sprite, text, bar, iconTex, UI, ScrollView, rich } from '../../ui/widgets';
import { richTexture } from '../../ui/rich';
import { C, colorFrame, shade } from '../../ui/theme';
import { drawFrame } from '../../ui/draw';
import { say } from '../kit';
import { emblem, note, box } from '../winkit';
import { go } from '../../lib/route';
import { play } from '../../audio/sound';
import { QUEST_BY_ID } from '../../game/quests';
import { today } from '../../game/progress';

const HERO_KEY = 'roc-hero-at';

export class AcademyWindow extends WindowScene {
  winTitle = 'The Academy';
  winIcon = 'castle';
  wide = true;
  private pop: Phaser.GameObjects.Container | null = null;
  private dbgStops: { id: string; kind: string; state: string }[] = [];
  constructor() { super('W:learn'); }

  body(root: Phaser.GameObjects.Container, fullW: number, sv: ScrollView) {
    const s = useGame.getState();
    const pathId = s.pathId ?? 'explore';
    const path = PATH_BY_ID[pathId] ?? PATHS[0];
    const nodes = pathNodes(path.id);
    const cur = currentIndex(path.id, s.done);
    const pending = pendingReview(s.reviews);
    const st: PlanState = { done: s.done, reviews: s.reviews, games: s.games, history: s.history };
    const currentStopId = pending ? 'review:' + pending : nodes[cur]?.node.id;
    const courses = path.courses.map((id) => COURSE_BY_ID[id]).filter(Boolean) as Course[];
    const curCourse = nodes[Math.min(cur, nodes.length - 1)]?.course.id ?? courses[0].id;
    const sel = this.p.st as { section?: number };
    if (sel.section === undefined) sel.section = Math.max(0, courses.findIndex((c) => c.id === curCourse));
    const si = Math.min(sel.section, courses.length - 1);
    const course = courses[si];
    const side = fullW >= 980;
    const w = side ? Math.min(660, fullW - 330) : Math.min(660, fullW);
    const x0 = side ? Math.max(0, (fullW - w - 320) / 2) : Math.round((fullW - w) / 2);
    const c = this.add.container(x0, 0);
    root.add(c);
    let y = 0;

    // ---- path chip ----
    const prog = pathProgress(path.id, s.done);
    const chip = this.add.container(0, y);
    const cg = this.add.graphics(); drawFrame(cg, 0, 0, w, 72, colorFrame('#f3e2b8'));
    chip.add(cg);
    chip.add(emblem(this, 14, 12, path.color, path.icon, 44));
    chip.add(text(this, 70, 10, `${path.title} · ${path.subtitle}`, 20, C.ink, { fontStyle: 'bold' }));
    chip.add(bar(this, 70, 40, w - 190, 14, prog.pct / 100, '#5aa6e8'));
    chip.add(text(this, w - 14, 24, 'CHANGE', 17, C.blueDark, { fontStyle: 'bold' }).setOrigin(1, 0));
    const chipZ = this.add.zone(0, 0, w, 72).setOrigin(0, 0).setInteractive({ useHandCursor: true }).on('pointerup', (p: Phaser.Input.Pointer) => { if (sv.contains(p.x, p.y)) go('paths'); });
    chip.add(chipZ);
    UI.reg(this, 'learn.path', chipZ, 'Change your path', () => go('paths'), sv);
    c.add(chip);
    y += 84;

    // ---- pace card ----
    const pace = learnerPace(s.history);
    const reviewCount = Object.keys(s.reviews).length;
    const stars = Object.values(s.games).reduce((a, g) => a + g.stars, 0);
    const paceTitle = pending ? 'A review stop is waiting' : `Your pace: ${PACE_TEXT[pace.pace].title}`;
    const paceText = pending ? 'That last lesson was a tough one, so Lumi added a short review to your path. Finish it to open the next lesson. It never costs hearts.' : PACE_TEXT[pace.pace].text;
    const stats = [pace.n >= 3 ? `Recent accuracy ${pace.avg}%` : '', reviewCount ? tn(reviewCount, '{n} review stop added', '{n} review stops added') : '', tn(stars, '{n} game star', '{n} game stars')].filter(Boolean).join(' · ');
    const pt = richTexture(this, `**${paceTitle}**\n${paceText}`, { width: w - 100 - (pending ? 130 : 0), size: 18 });
    const ph = Math.max(80, pt.h + 44);
    c.add(panel(this, 0, y, w, ph, pending ? 'sel' : 'panel'));
    c.add(anim(this, 12, y + (ph - 56) / 2, pending ? ANIMS.fairy : pace.pace === 'strong' ? ANIMS.fairyCheer : ANIMS.fairy, 4, 56));
    c.add(this.add.image(78, y + 12, pt.key).setOrigin(0, 0));
    c.add(text(this, 78, y + 16 + pt.h, stats, 14, C.muted));
    if (pending) c.add(new Button(this, w - 128, y + (ph - 44) / 2, 'Review', () => go('review-stop/' + pending), { variant: 'purple', size: 18, h: 44, id: 'learn.review', clip: sv }));
    this.dbgStops = [];
    this.game.registry.set('debug:W:learn', () => ({ pending, current: currentStopId, pace: paceTitle, stops: this.dbgStops }));
    const paceZ = this.add.zone(0, y, w, ph).setOrigin(0, 0);
    c.add(paceZ);
    UI.reg(this, 'learn.pace', paceZ, 'Your pace', undefined, sv);
    y += ph + 14;

    // ---- section banner with arrows ----
    const bh = 96;
    c.add(colorPanel(this, 0, y, w, bh, course.color));
    c.add(text(this, w / 2, y + 12, up(t('Section {n} of {total}', { n: si + 1, total: courses.length })) + ' · ' + up(course.realm), 15, '#ffffff', { fontStyle: 'bold', shadow: { offsetX: 2, offsetY: 2, color: 'rgba(0,0,0,.45)', fill: true } }).setOrigin(0.5, 0));
    c.add(this.add.text(w / 2, y + 32, course.title, { fontFamily: "'Jacquard 12', serif", fontSize: w < 500 ? '36px' : '46px', color: '#ffffff', stroke: shade(course.color, -0.5), strokeThickness: 6 }).setOrigin(0.5, 0));
    const goSection = (d: number) => { sel.section = Math.max(0, Math.min(courses.length - 1, si + d)); (this.p.st as { scroll?: number }).scroll = 0; play('page'); this.rebuild(); };
    if (si > 0) c.add(new Button(this, 10, y + 24, '', () => goSection(-1), { variant: 'ghost', icon: 'back', w: 48, h: 48, id: 'learn.prev', clip: sv }));
    if (si < courses.length - 1) c.add(new Button(this, w - 58, y + 24, '', () => goSection(1), { variant: 'ghost', icon: 'next', w: 48, h: 48, id: 'learn.next', clip: sv }));
    y += bh + 10;
    const npc = NPC_BY_COURSE[course.id];
    if (npc) y += say(this, c, 0, y, w, course.id === curCourse ? [...ANIMS.npcTalk(npc.id), ...ANIMS.npcIdle(npc.id)] : ANIMS.npcIdle(npc.id), npc.greet, `${npc.name} · ${npc.title}`, { textSize: 19 }).h + 14;

    // ---- units ----
    const unitOrder = nodes.map((n) => n.unit.id).filter((id, i, a) => a.indexOf(id) === i);
    let globalIndex = 0, stopCounter = 0;
    for (const cc of courses) {
      for (const u of cc.units) {
        const start = globalIndex;
        globalIndex += u.lessons.length;
        const stops = planUnit(path.id, cc, u, cc.units.indexOf(u), start, cur, st, unitOrder[unitOrder.indexOf(u.id) + 1] ?? null);
        const stopStart = stopCounter;
        stopCounter += stops.length;
        if (cc.id !== course.id) continue;
        const ui = cc.units.indexOf(u);
        const locked = start > cur && !unitDone(u, s.done);
        // unit sign
        const dt = richTexture(this, u.desc, { width: w - 210, size: 17, color: '#ffffff' });
        const uh = Math.max(86, dt.h + 56);
        const sign = colorPanel(this, 0, y, w, uh, course.color);
        if (locked) sign.setAlpha(0.7);
        c.add(sign);
        c.add(text(this, 16, y + 10, `UNIT ${ui + 1}`, 14, '#ffffff', { fontStyle: 'bold' }));
        c.add(text(this, 16, y + 26, u.title, 22, '#ffffff', { fontStyle: 'bold', shadow: { offsetX: 2, offsetY: 2, color: 'rgba(0,0,0,.45)', fill: true } }));
        c.add(this.add.image(16, y + 52, dt.key).setOrigin(0, 0));
        c.add(new Button(this, w - 130, y + 10, 'Guide', () => this.showGuide(u), { variant: 'ghost', icon: 'book', size: 16, w: 116, h: 38, id: 'learn.guide.' + u.id, clip: sv }));
        if (locked) c.add(new Button(this, w - 130, y + 54, 'Jump here', () => go('test/' + u.id), { variant: 'gold', icon: 'key', size: 16, w: 116, h: 38, id: 'learn.jump.' + u.id, clip: sv }));
        y += uh - 4;
        y = this.unitMap(c, u, cc, stops, stopStart, cur, st, pending, currentStopId, y, w, sv) + 18;
      }
    }
    // the end of the path
    if (si === courses.length - 1 && cur >= nodes.length) {
      c.add(panel(this, 0, y, w, 200));
      c.add(anim(this, w / 2 - 48, y + 10, ANIMS.fairyCheer, 4, 96));
      c.add(text(this, w / 2, y + 112, path.id === 'explore' ? 'You finished the foundations!' : `Path complete: ${path.role}`, 24, C.ink, { fontStyle: 'bold', align: 'center', wordWrap: { width: w - 40 } }).setOrigin(0.5, 0));
      c.add(new Button(this, w / 2 - 100, y + 146, path.id === 'explore' ? 'Choose my path' : 'Start another path', () => go('paths'), { variant: 'blue', w: 200, size: 18, h: 42, id: 'learn.end', clip: sv }));
      y += 214;
    }
    // next section button at the bottom
    if (si < courses.length - 1) {
      const nb = new Button(this, 0, y, `Next: ${courses[si + 1].title}`, () => goSection(1), { variant: 'ghost', icon: 'next', id: 'learn.next2', clip: sv });
      nb.x = Math.round((w - nb.bw) / 2);
      c.add(nb);
      y += 70;
    }

    // ---- side column ----
    if (side) y = Math.max(y, this.sideColumn(root, x0 + w + 20, 300, sv));

    // scroll to the current stop
    const cs = this.p.st as { scroll?: number; centered?: boolean };
    if (!cs.centered && this.curY !== null) { cs.centered = true; cs.scroll = Math.max(0, this.curY - sv.h / 2); }
    const inPop = (o: Phaser.GameObjects.GameObject) => { for (let q: Phaser.GameObjects.GameObject | null = o; q; q = q.parentContainer) if (q === this.pop || q.getData?.('stop')) return true; return false; };
    this.input.on('pointerdown', (_p: Phaser.Input.Pointer, over: Phaser.GameObjects.GameObject[]) => { if (this.pop && !over.some(inPop)) { this.pop.destroy(); this.pop = null; } });
    if (currentStopId) sessionStorage.setItem(HERO_KEY, currentStopId);
    return y;
  }

  private curY: number | null = null;

  private unitMap(c: Phaser.GameObjects.Container, u: Unit, course: Course, stops: Stop[], stopStart: number, cur: number, st: PlanState, pending: string | null, currentStopId: string | undefined, y0: number, w: number, sv: ScrollView) {
    const layout = layoutUnit(stops.length, stopStart);
    const art = paintUnit(`${course.id}:${u.id}:${stopStart}:${stops.length}`, layout, biomeFor(course.id));
    const scale = w / layout.width;
    const map = this.add.image(0, y0, paintedTex(this, art.url)).setOrigin(0, 0).setScale(scale);
    c.add(map);
    const g = this.add.graphics(); g.fillStyle(0x2b1a12).fillRect(0, y0, 6, layout.height * scale).fillRect(w - 6, y0, 6, layout.height * scale);
    c.add(g);
    const P = (x: number, y: number) => ({ x: x * scale, y: y0 + y * scale });
    art.props.forEach((pr, i) => {
      const frames = (ANIMS as unknown as Record<string, string[]>)[pr.anim];
      if (!frames) return;
      const p = P(pr.x + 8, pr.y + 16);
      const a = anim(this, p.x - 24, p.y - 34, frames, pr.anim === 'goblin' ? 2 : 4, 48);
      if (pr.flip) a.setFlipX(true);
      void i;
      c.add(a);
    });
    const profile = useGame.getState().profile!;
    stops.forEach((sp, k) => {
      const state = stopState(sp, cur, st, pending);
      this.dbgStops.push({ id: sp.id, kind: sp.kind, state });
      const p = P(layout.nodes[k].x, layout.nodes[k].y);
      this.stopNode(c, sp, u, course, state, p.x, p.y, scale, sv);
      if (sp.id === currentStopId) this.curY = p.y;
    });
    // the hero stands next to the current stop and walks there from the last one
    const curLocal = stops.findIndex((sp) => sp.id === currentStopId);
    if (curLocal >= 0) {
      const from = sessionStorage.getItem(HERO_KEY);
      const fromLocal = from ? stops.findIndex((sp) => sp.id === from) : -1;
      const at = (k: number) => { const n = layout.nodes[k]; const p = P(n.x + (n.x > layout.width / 2 ? -22 : 22), n.y + 4); return { ...p, left: n.x > layout.width / 2 }; };
      const start = fromLocal >= 0 && fromLocal < curLocal ? at(fromLocal) : at(curLocal);
      const end = at(curLocal);
      const hero = anim(this, start.x - 30, start.y - 54, ANIMS.heroIdle(profile.avatar), 4, 60, profile.tunic);
      hero.setFlipX(!end.left);
      c.add(hero);
      if (start.x !== end.x || start.y !== end.y) {
        const walk = anim(this, 0, 0, ANIMS.heroWalk(profile.avatar), 8, 60, profile.tunic);
        walk.setVisible(false);
        c.add(walk);
        this.time.delayedCall(500, () => {
          hero.setVisible(false); walk.setVisible(true).setPosition(start.x - 30, start.y - 54).setFlipX(!end.left);
          play('step');
          this.tweens.add({ targets: walk, x: end.x - 30, y: end.y - 54, duration: 1200, onComplete: () => { walk.destroy(); hero.setPosition(end.x - 30, end.y - 54).setVisible(true); } });
        });
      }
    }
    return y0 + layout.height * scale;
  }

  private stopNode(c: Phaser.GameObjects.Container, sp: Stop, u: Unit, course: Course, state: StopState, x: number, y: number, scale: number, sv: ScrollView) {
    let img: string, title: string, label: string, body: string | null = null, action: { text: string; to: string; variant: 'green' | 'gold' | 'purple' | 'ghost' } | null = null, bubbleText: string | null = null;
    const locked = state === 'locked';
    let stars = 0;
    switch (sp.kind) {
      case 'lesson': {
        const node = sp.ref.node;
        const big = node.kind === 'project';
        const icon = state === 'done' ? (big ? 'trophy' : 'check') : locked ? 'lock' : big ? 'dragon' : node.kind === 'challenge' ? 'code' : 'star';
        img = paintNode(state === 'done' ? '#e7a72c' : locked ? '#b7ad98' : course.color, icon, big, locked ? '#7a705c' : '#ffffff');
        const lessons = u.lessons.filter((l) => l.kind === 'lesson');
        title = node.title;
        label = node.kind === 'project' ? 'Project' : node.kind === 'challenge' ? 'Coding challenge' : `Lesson ${lessons.indexOf(node) + 1} of ${lessons.length}`;
        const xp = node.kind === 'project' ? 50 : node.kind === 'challenge' ? 20 : 15;
        if (locked) body = 'Complete the stops before this one to unlock it.';
        else action = { text: state === 'done' ? `Practice again +${Math.ceil(xp / 2)} XP` : `Start +${xp} XP`, to: 'lesson/' + node.id, variant: state === 'done' ? 'gold' : 'green' };
        if (state === 'current') bubbleText = sp.ref.lessonIndex === 0 ? 'START' : 'CONTINUE';
        break;
      }
      case 'review':
        img = paintNode(state === 'done' ? '#b58be0' : '#8a56c9', state === 'done' ? 'check' : 'book');
        title = 'Review stop'; label = state === 'done' ? 'Reviewed' : 'Added because that lesson was hard';
        body = 'A short refresher: the key ideas again and the questions you missed. Reviews never cost hearts.';
        if (state !== 'done') action = { text: 'Start review', to: 'review-stop/' + sp.lessonId, variant: 'purple' };
        if (state === 'current') bubbleText = 'REVIEW';
        break;
      case 'game': {
        const info = GAME_INFO[sp.game];
        stars = useGame.getState().games[sp.id]?.stars ?? 0;
        img = paintNode(locked ? '#b7ad98' : state === 'done' ? '#e7a72c' : info.color, locked ? 'lock' : info.icon, false, locked ? '#7a705c' : '#ffffff', 'shield');
        title = info.name; label = 'Minigame · wins lightbulbs, torches and potions';
        body = locked ? 'Finish the lessons before it to unlock this game.' : info.blurb;
        if (!locked) action = { text: state === 'done' ? (stars < 3 ? 'Play again for more stars' : 'Play again') : 'Play!', to: 'game/' + encodeURIComponent(sp.id), variant: 'gold' };
        break;
      }
      case 'fast':
        img = paintNode('#e7a72c', 'bolt');
        title = 'Shortcut'; label = 'You are on a roll!';
        body = 'Pass a short test on the rest of this unit and jump straight to the next one.';
        action = { text: 'Take the test', to: 'test/' + sp.targetUnitId, variant: 'gold' };
        break;
    }
    const node = this.add.image(x, y, paintedTex(this, img)).setScale(scale).setOrigin(0.5);
    c.add(node);
    if (state === 'current') {
      const ring = this.add.ellipse(x, y - 4, 40 * scale, 34 * scale).setStrokeStyle(4, 0xfff6dc, 0.9);
      c.addAt(ring, c.getIndex(node));
      this.tweens.add({ targets: ring, scale: 1.1, duration: 400, yoyo: true, repeat: -1, ease: 'Stepped', easeParams: [2] });
    }
    if (bubbleText) {
      const t = text(this, x, y - node.displayHeight / 2 - 34, bubbleText, 17, shade(sp.kind === 'review' ? '#8a56c9' : course.color, -0.3), { fontStyle: 'bold', backgroundColor: '#fdf6e3', padding: { x: 8, y: 3 } }).setOrigin(0.5, 0);
      c.add(t);
      this.tweens.add({ targets: t, y: t.y - 4, duration: 400, yoyo: true, repeat: -1, ease: 'Stepped', easeParams: [2] });
    }
    if ((sp.kind === 'game' && state === 'open') || sp.kind === 'fast') {
      const b = text(this, x + node.displayWidth / 2 - 10, y - node.displayHeight / 2 - 8, '!', 20, '#ffffff', { fontStyle: 'bold', backgroundColor: '#d2473c', padding: { x: 8, y: 1 } }).setOrigin(0.5);
      c.add(b);
      this.tweens.add({ targets: b, y: b.y - 4, duration: 400, yoyo: true, repeat: -1, ease: 'Stepped', easeParams: [2] });
    }
    if (sp.kind === 'game' && stars > 0) for (let k = 0; k < 3; k++) c.add(sprite(this, x - 30 + k * 20, y + node.displayHeight / 2 - 8, 'starIcon', 20).setAlpha(k < stars ? 1 : 0.25));
    node.setInteractive({ useHandCursor: true });
    node.setData('stop', true);
    const open = () => {
      if (this.pop) { const same = this.pop.getData('id') === sp.id; this.pop.destroy(); this.pop = null; if (same) return; }
      play('click');
      const pw = 290;
      const bt = body ? richTexture(this, body, { width: pw - 36, size: 16, color: locked ? C.inkSoft : '#ffffff' }) : null;
      const ph = 70 + (bt ? bt.h + 8 : 0) + (action || locked ? 56 : 0);
      const px = Math.max(8 - c.x, Math.min(x - pw / 2, this.bodyW - pw - c.x)), py = y + node.displayHeight / 2 + 10;
      const pc = this.add.container(px, py).setDepth(100);
      pc.setData('id', sp.id);
      const frameColor = locked ? 'stone' : state === 'done' ? '#d49a26' : sp.kind === 'review' ? '#8a56c9' : sp.kind === 'game' ? GAME_INFO[sp.game].color : sp.kind === 'fast' ? '#c98a1c' : course.color;
      pc.add(frameColor === 'stone' ? panel(this, 0, 0, pw, ph, 'stone') : colorPanel(this, 0, 0, pw, ph, frameColor));
      const col = locked ? C.inkSoft : '#ffffff';
      pc.add(text(this, 18, 14, title, 20, col, { fontStyle: 'bold', wordWrap: { width: pw - 36 } }));
      pc.add(text(this, 18, 42, label, 15, col));
      let yy = 66;
      if (bt) { pc.add(this.add.image(18, yy, bt.key).setOrigin(0, 0)); yy += bt.h + 8; }
      if (action) { const a = action; pc.add(new Button(this, 14, yy, a.text, () => go(a.to), { variant: a.variant === 'green' ? 'ghost' : a.variant, w: pw - 28, h: 46, size: 17, id: 'stop.go', clip: sv })); }
      else if (locked) pc.add(new Button(this, 14, yy, 'Locked', () => {}, { variant: 'stone', w: pw - 28, h: 46, size: 17, disabled: true }));
      c.add(pc);
      pc.setData('stop', true);
      this.pop = pc;
    };
    node.on('pointerup', (p: Phaser.Input.Pointer) => { if (sv.contains(p.x, p.y)) open(); });
    const id = sp.kind === 'lesson' ? 'node.' + sp.id : sp.id.replace(':', '.');
    UI.reg(this, id, node, title!, open, sv);
    if (state === 'current') UI.reg(this, 'node.current', node, 'Current stop', open, sv);
  }

  private showGuide(u: Unit) {
    modal(this, 700, (c, w, close) => {
      c.add(text(this, 24, 20, 'GUIDEBOOK', 15, C.inkSoft, { fontStyle: 'bold' }));
      c.add(text(this, 24, 40, u.title, 28, C.ink, { fontStyle: 'bold' }));
      const t = richTexture(this, u.guide.trim(), { width: w - 48, size: 19 });
      const maxH = this.H - 240;
      const img = this.add.image(24, 84, t.key).setOrigin(0, 0);
      if (t.h > maxH) img.setCrop(0, 0, t.w, maxH);
      c.add(img);
      const by = 84 + Math.min(t.h, maxH) + 16;
      c.add(new Button(this, w - 160, by, 'Got it', close, { variant: 'green', w: 136, id: 'guide.close' }));
      return by + 70;
    });
  }

  private sideColumn(root: Phaser.GameObjects.Container, x: number, w: number, sv: ScrollView) {
    const s = useGame.getState();
    const c = this.add.container(x, 0);
    root.add(c);
    let y = 0;
    // daily goal
    const goal = s.dailyGoal, xpToday = s.xpByDay[today()] ?? 0;
    box(this, c, 0, y, w, 120);
    c.add(text(this, 16, 14, 'Daily goal', 22, C.ink, { fontStyle: 'bold' }));
    c.add(text(this, w - 16, 18, `${Math.min(xpToday, goal)}/${goal} XP`, 17, C.inkSoft).setOrigin(1, 0));
    c.add(anim(this, 12, 48, xpToday >= goal ? ANIMS.fairyCheer : ANIMS.fairy, 4, 56));
    c.add(bar(this, 76, 56, w - 96, 16, xpToday / goal));
    note(this, c, 76, 78, w - 96, xpToday >= goal ? 'Goal reached! Lumi is dancing.' : `Earn ${goal - xpToday} more XP today.`, 15);
    y += 132;
    // quests
    const qh = 56 + s.daily.quests.length * 56;
    box(this, c, 0, y, w, qh);
    c.add(text(this, 16, y + 14, 'Daily quests', 22, C.ink, { fontStyle: 'bold' }));
    const vb = text(this, w - 16, y + 18, 'VIEW ALL', 16, C.blueDark, { fontStyle: 'bold' }).setOrigin(1, 0).setInteractive({ useHandCursor: true }).on('pointerup', () => go('quests'));
    c.add(vb);
    s.daily.quests.forEach((q, i) => {
      const t = QUEST_BY_ID[q.id];
      if (!t) return;
      const qy = y + 50 + i * 56;
      c.add(sprite(this, 14, qy, q.claimed ? 'chestOpen' : 'chest', 40).setAlpha(q.claimed ? 0.5 : 1));
      c.add(text(this, 62, qy, t.text, 16, C.ink, { fontStyle: 'bold', wordWrap: { width: w - 80 } }));
      c.add(bar(this, 62, qy + 24, w - 80, 12, q.progress / t.goal));
    });
    y += qh + 12;
    // satchel
    box(this, c, 0, y, w, 74);
    [['bulb', s.items.bulb], ['torchItem', s.items.torch], ['potion', s.items.potion]].forEach(([n, v], i) => {
      c.add(sprite(this, 16 + i * 92, y + 18, n as string, 40));
      c.add(text(this, 60 + i * 92, y + 24, String(v), 24, C.ink, { fontStyle: 'bold' }));
    });
    void sv; void iconTex; void rich; void spriteTex;
    return y + 90;
  }
}
