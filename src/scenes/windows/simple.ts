// Building windows: Guild Hall (quests), Library (skills), Hall of Trophies, Cottage (hero),
// Settings and the Path Board.
import Phaser from 'phaser';
import { WindowScene } from '../base';
import { useGame } from '../../game/store';
import { QUEST_BY_ID } from '../../game/quests';
import { ACHIEVEMENTS, CATEGORIES, TIER_COLOR, TIER_GOLD, careerRank, type Tier } from '../../game/achievements';
import { levelFromXp, today, titleFor } from '../../game/progress';
import { COURSES, COURSE_BY_ID, PATHS, PATH_BY_ID, courseProgress, pathProgress, skillLevel, skillStrength } from '../../course';
import type { Course } from '../../course/types';
import { TUNICS } from '../../grid/sprites';
import { ANIMS } from '../../components/anims';
import { anim, Button, Card, sprite, text, bar, iconTex, UI, ScrollView } from '../../ui/widgets';
import { C, N } from '../../ui/theme';
import { richTexture } from '../../ui/rich';
import { say } from '../kit';
import { h2, note, emblem, pill, box, checkbox, stepper } from '../winkit';
import { go } from '../../lib/route';
import { play, configureSound } from '../../audio/sound';
import { goAndTour, resetTips } from '../help/helpers';
import { askNotify } from '../../game/away';
import { LANGS, setLang, t, getLang } from '../../i18n';

// ---------------- Guild Hall: daily quests ----------------
export class GuildWindow extends WindowScene {
  winTitle = 'Guild Hall';
  winIcon = 'board';
  constructor() { super('W:quests'); }
  body(c: Phaser.GameObjects.Container, w: number, sv: ScrollView) {
    const s = useGame.getState();
    let y = say(this, c, 0, 0, w, ANIMS.npcIdle('career'), 'The guild posts three new quests every day. Finish them and a treasure chest is yours.', 'Aldric · Guildmaster').h + 16;
    y = h2(this, c, y, 'Daily quests');
    const narrow = w < 560;
    const rowH = narrow ? 112 : 92;
    const btnW = narrow ? 92 : 104;
    box(this, c, 0, y, w, rowH * s.daily.quests.length + 16);
    s.daily.quests.forEach((q, i) => {
      const t = QUEST_BY_ID[q.id];
      if (!t) return;
      const ry = y + 12 + i * rowH;
      const ready = q.progress >= t.goal;
      const ix = narrow ? 60 : 84;
      c.add(sprite(this, 12, ry + 10, q.claimed ? 'chestOpen' : 'chest', narrow ? 40 : 56).setAlpha(q.claimed ? 0.5 : 1));
      const tt = text(this, ix, ry + 6, t.text, narrow ? 19 : 22, C.ink, { fontStyle: 'bold', wordWrap: { width: w - ix - btnW - 28 } });
      c.add(tt);
      const by = ry + Math.max(36, tt.height + 12);
      c.add(bar(this, ix, by, w - ix - btnW - 90, 18, q.progress / t.goal));
      c.add(text(this, w - btnW - 24, by - 2, `${q.progress}/${t.goal}`, 18, C.inkSoft).setOrigin(1, 0));
      if (q.claimed) c.add(text(this, w - 20, ry + 30, 'CLAIMED', 20, C.greenDark, { fontStyle: 'bold' }).setOrigin(1, 0));
      else {
        const b = new Button(this, w - btnW - 16, ry + 18, ready ? `Open +${t.gold}` : `+${t.gold}`, () => { s.claimQuest(q.id); play('coin'); this.rebuild(); }, { variant: 'gold', size: 18, w: btnW, h: 44, disabled: !ready, id: 'quest.' + q.id, clip: sv });
        c.add(b);
      }
      if (i < s.daily.quests.length - 1) { const g = this.add.graphics(); g.fillStyle(N('#b8955c')); for (let xx = 16; xx < w - 16; xx += 10) g.fillRect(xx, ry + rowH - 4, 6, 3); c.add(g); }
    });
    y += rowH * s.daily.quests.length + 32;
    y = h2(this, c, y, 'Streak');
    const noteW = narrow ? w - 92 - 16 : w - 92 - 200;
    const nt = richTexture(this, `Finish one lesson every day. Best: ${s.streak.best} days. Streak freezes: ${s.streak.freezes}/2 (a freeze saves your streak if you miss a day).`, { width: noteW, size: 17, color: C.inkSoft });
    const bh = narrow ? 46 + nt.h + 70 : Math.max(110, 46 + nt.h + 12);
    box(this, c, 0, y, w, bh);
    c.add(sprite(this, 16, y + 22, 'flameIcon', 64));
    c.add(text(this, 92, y + 14, `${s.streak.count}-day streak`, 24, C.ink, { fontStyle: 'bold' }));
    c.add(this.add.image(92, y + 46, nt.key).setOrigin(0, 0));
    c.add(new Button(this, narrow ? 92 : w - 180, narrow ? y + 52 + nt.h : y + 30, 'Freeze · 100', () => { if (s.buyFreeze()) { play('coin'); this.rebuild(); } }, { variant: 'blue', size: 18, w: 164, h: 46, icon: 'snow', disabled: s.gold < 100 || s.streak.freezes >= 2, id: 'quest.freeze', clip: sv }));
    y += bh + 10;
    return y;
  }
}

// ---------------- Library Tower: skills ----------------
const PROCESS = new Set(['web', 'tools', 'api', 'testing', 'quality', 'career']);
export class LibraryWindow extends WindowScene {
  winTitle = 'Library Tower';
  winIcon = 'book';
  constructor() { super('W:skills'); }
  body(c: Phaser.GameObjects.Container, w: number, sv: ScrollView) {
    const s = useGame.getState();
    const pathId = s.pathId ?? 'explore';
    const path = PATH_BY_ID[pathId];
    let y = say(this, c, 0, 0, w, ANIMS.npcIdle('ts'), 'Every lesson sharpens a skill. Keep the freshness bars full by practising, and watch your job readiness grow.', 'Bram · Runesmith').h + 16;
    if (path) {
      const pp = pathProgress(pathId, s.done);
      const rows = path.courses.filter((id) => COURSE_BY_ID[id]);
      const bh = 120 + rows.length * 30;
      box(this, c, 0, y, w, bh);
      c.add(emblem(this, 18, y + 18, path.color, 'briefcase', 52));
      c.add(text(this, 86, y + 14, 'JOB READINESS', 15, C.inkSoft, { fontStyle: 'bold' }));
      c.add(text(this, 86, y + 32, path.role, 24, C.ink, { fontStyle: 'bold', wordWrap: { width: w - 110 } }));
      c.add(bar(this, 86, y + 64, w - 110, 18, pp.pct / 100, '#5aa6e8'));
      c.add(text(this, 86, y + 86, `${pp.pct}% of the path · ${pp.done}/${pp.total} lessons`, 16, C.inkSoft));
      rows.forEach((cid, i) => {
        const co = COURSE_BY_ID[cid];
        const cp = courseProgress(cid, s.done);
        const ry = y + 114 + i * 30;
        c.add(this.add.image(20, ry + 2, iconTex(this, cp.done === cp.total && cp.total ? 'check' : 'target', cp.done === cp.total && cp.total ? C.green : C.muted, 2)).setOrigin(0, 0));
        c.add(text(this, 52, ry, co.title, 18, C.ink, { fontStyle: 'bold' }));
        c.add(bar(this, 230, ry + 4, w - 230 - 70, 14, cp.pct / 100, '#6cc04a'));
        c.add(text(this, w - 20, ry, `${cp.pct}%`, 16, C.inkSoft).setOrigin(1, 0));
      });
      y += bh + 20;
    }
    const inPath = new Set(path?.courses ?? []);
    const ordered = [...COURSES].sort((a, b) => Number(inPath.has(b.id)) - Number(inPath.has(a.id)));
    const section = (title: string, desc: string, list: Course[]) => {
      y = h2(this, c, y, title);
      y += note(this, c, 0, y, w, desc, 17) + 10;
      const cols = w > 620 ? 2 : 1;
      const cw = (w - (cols - 1) * 12) / cols;
      list.forEach((co, i) => {
        const xp = s.skillXp[co.id] ?? 0;
        const lv = skillLevel(xp);
        const cp = courseProgress(co.id, s.done);
        const stren = skillStrength(s.practicedAt[co.id]);
        const cx = (i % cols) * (cw + 12), cy = y + Math.floor(i / cols) * 106;
        box(this, c, cx, cy, cw, 96);
        c.add(emblem(this, cx + 16, cy + 20, co.color, co.emblem, 52));
        c.add(text(this, cx + 84, cy + 14, co.title, 20, C.ink, { fontStyle: 'bold' }));
        pill(this, c, cx + cw - 96, cy + 12, `Level ${lv.level}`, lv.level ? '#fdeec4' : '#e3cf9f', lv.level ? C.goldDark : C.inkSoft, 14);
        c.add(bar(this, cx + 84, cy + 42, cw - 84 - (cp.done ? 70 : 18), 12, lv.max ? 1 : lv.into / lv.need, '#a47ce0'));
        c.add(text(this, cx + 84, cy + 60, `${xp} XP · ${cp.done}/${cp.total} lessons`, 15, C.inkSoft));
        const g = this.add.graphics();
        for (let k = 0; k < 4; k++) { g.fillStyle(k < stren ? N('#e7a72c') : N('#d9c08c')).fillRect(cx + cw - 110 + k * 9, cy + 62, 6, 15); }
        c.add(g);
        if (cp.done > 0) c.add(new Button(this, cx + cw - 60, cy + 26, '', () => go('practice/' + co.id), { variant: 'ghost', icon: 'dumbbell', w: 44, h: 40, id: 'skills.practice.' + co.id, clip: sv }));
      });
      y += Math.ceil(list.length / cols) * 106 + 16;
    };
    section('Technical skills', 'Languages and frameworks. Each lesson gives XP to its skill. The little bars show freshness: practise to keep them full.', ordered.filter((x) => !PROCESS.has(x.id)));
    section('Process skills', 'How developers work: the web, tools, Git, APIs, testing, quality and getting hired.', ordered.filter((x) => PROCESS.has(x.id)));
    return y;
  }
}

// ---------------- Hall of Trophies ----------------
export class TrophyWindow extends WindowScene {
  winTitle = t('Hall of Trophies');
  winIcon = 'trophy';
  wide = true;
  constructor() { super('W:trophies'); }
  body(c: Phaser.GameObjects.Container, w: number, sv: ScrollView) {
    const s = useGame.getState();
    const st = this.p.st as { cat?: string };
    let y = say(this, c, 0, 0, w, ANIMS.npcIdle('css'), t('Master a whole section to place its trophy on these shelves. Finish a path for a legendary one! Achievements give gold: more for silver, gold and legendary ones.'), t('Herald Percival')).h + 16;
    // career rank
    const rank = careerRank(s);
    box(this, c, 0, y, w, 74, 'sel');
    c.add(emblem(this, 14, y + 11, '#a66be0', 'briefcase', 52));
    c.add(text(this, 80, y + 10, t('Career rank: {r}', { r: t(rank.name) }), 22, C.ink, { fontStyle: 'bold' }));
    c.add(text(this, 80, y + 40, rank.next ? t('Next: {n}', { n: t(rank.next) }) + ` · ${rank.pct}%` : t('You reached the top: you are ready for your first developer job!'), 16, C.inkSoft));
    y += 88;
    // trophy shelves: sections and paths
    const list = [
      ...COURSES.map((co) => ({ id: 'course:' + co.id, name: t(co.title), color: co.color, big: false })),
      ...PATHS.filter((p) => p.id !== 'explore').map((p) => ({ id: 'path:' + p.id, name: t(p.role), color: p.color, big: true })),
    ];
    const cols = w > 900 ? 6 : w > 560 ? 4 : 3;
    const rows = Math.ceil(list.length / cols);
    const shelfH = 130;
    y = h2(this, c, y, t('Trophies') + `  ${list.filter((x) => s.trophies[x.id]).length}/${list.length}`);
    box(this, c, 0, y, w, rows * shelfH + 20, 'wood');
    list.forEach((tr, i) => {
      const col = i % cols, row = Math.floor(i / cols);
      const cx = 12 + (col + 0.5) * ((w - 24) / cols), cy = y + 14 + row * shelfH;
      const has = !!s.trophies[tr.id];
      const size = tr.big ? 80 : 64;
      const img = sprite(this, cx - size / 2, cy + 76 - size, 'trophy', size);
      if (!has) img.setTint(0x3a2a1e).setAlpha(0.5);
      c.add(img);
      if (has) { const glow = this.add.graphics(); glow.fillStyle(N(tr.color), 0.35).fillCircle(cx, cy + 40, size / 2 + 6); c.addAt(glow, c.length - 1); }
      c.add(text(this, cx, cy + 92, tr.name, 14, has ? '#ffd66b' : '#d8c4a0', { align: 'center', wordWrap: { width: (w - 24) / cols - 8 } }).setOrigin(0.5, 0));
      if (col === 0) { const sh = this.add.graphics(); sh.fillStyle(N('#9a6a40')).fillRect(6, cy + 78, w - 12, 10); sh.fillStyle(N('#432a18')).fillRect(6, cy + 88, w - 12, 3); c.add(sh); }
    });
    y += rows * shelfH + 40;
    // achievements, by category
    const got = ACHIEVEMENTS.filter((a) => s.achievements[a.id]).length;
    y = h2(this, c, y, t('Achievements') + `  ${got}/${ACHIEVEMENTS.length}`);
    const tiers = (['bronze', 'silver', 'gold', 'legend'] as Tier[]).map((tr) => `${t(({ bronze: 'Bronze', silver: 'Silver', gold: 'Gold', legend: 'Legendary' } as Record<string, string>)[tr])} ${ACHIEVEMENTS.filter((a) => a.tier === tr && s.achievements[a.id]).length}/${ACHIEVEMENTS.filter((a) => a.tier === tr).length}`);
    let px = 0;
    tiers.forEach((label, i) => { px += pill(this, c, px, y, label, TIER_COLOR[(['bronze', 'silver', 'gold', 'legend'] as Tier[])[i]], '#ffffff', 15) + 8; });
    y += 36;
    // category tabs
    let tx = 0, ty = y;
    for (const cat of [{ id: '', name: 'All', icon: 'star' }, ...CATEGORIES]) {
      const n = ACHIEVEMENTS.filter((a) => !cat.id || a.cat === cat.id);
      const b = new Button(this, 0, 0, `${t(cat.name)} ${n.filter((a) => s.achievements[a.id]).length}/${n.length}`, () => { st.cat = cat.id; (this.p.st as { scroll?: number }).scroll = sv.scrollY; this.rebuild(); }, { variant: (st.cat ?? '') === cat.id ? 'gold' : 'paper', icon: cat.icon, h: 38, size: 13, id: 'ach.cat.' + (cat.id || 'all'), clip: sv, upper: false });
      if (tx + b.bw > w) { tx = 0; ty += 46; }
      b.setPosition(tx, ty); c.add(b); tx += b.bw + 6;
    }
    y = ty + 54;
    const shown = ACHIEVEMENTS.filter((a) => !st.cat || a.cat === st.cat).sort((a, b) => Number(!!s.achievements[b.id]) - Number(!!s.achievements[a.id]));
    const cols2 = w > 620 ? 2 : 1;
    const cw = (w - (cols2 - 1) * 12) / cols2;
    shown.forEach((a, i) => {
      const on = !!s.achievements[a.id];
      const hidden = a.secret && !on;
      const cx = (i % cols2) * (cw + 12), cy = y + Math.floor(i / cols2) * 86;
      box(this, c, cx, cy, cw, 78, on ? 'panel' : 'stone');
      const g = this.add.graphics();
      g.fillStyle(on ? N(TIER_COLOR[a.tier]) : 0xcbbf9f).fillRect(cx + 14, cy + 14, 50, 50).lineStyle(3, on ? 0x2b1a12 : 0x6e6250).strokeRect(cx + 14, cy + 14, 50, 50);
      c.add(g);
      c.add(this.add.image(cx + 39, cy + 39, iconTex(this, hidden ? 'lock' : a.icon, on ? '#ffffff' : '#8a7f6a', 2)));
      c.add(text(this, cx + 76, cy + 10, hidden ? t('Secret achievement') : t(a.name), 19, on ? C.ink : '#6e6250', { fontStyle: 'bold' }));
      if (!hidden) c.add(text(this, cx + cw - 12, cy + 12, `+${TIER_GOLD[a.tier]}`, 14, on ? C.goldDark : '#8a7f6a', { fontStyle: 'bold' }).setOrigin(1, 0));
      note(this, c, cx + 76, cy + 36, cw - 90, hidden ? t('Keep exploring to find it...') : t(a.desc), 15, on ? C.inkSoft : '#8a7f6a');
    });
    return y + Math.ceil(shown.length / cols2) * 86;
  }
}

// ---------------- Your Cottage: the hero ----------------
export class CottageWindow extends WindowScene {
  winTitle = 'Your Cottage';
  winIcon = 'helm';
  constructor() { super('W:profile'); }
  body(c: Phaser.GameObjects.Container, w: number, sv: ScrollView) {
    const s = useGame.getState();
    const p = s.profile!;
    const { level, into, need } = levelFromXp(s.xp);
    let y = 0;
    const narrow = w < 600;
    const ps = narrow ? 96 : 150;         // portrait size
    const tx = ps + 36;                     // text column
    const tw = w - tx - 16;
    const swY = narrow ? y + ps + 96 : y + 166;
    const boxH = narrow ? ps + 150 : 230;
    box(this, c, 0, y, w, boxH);
    box(this, c, 16, y + 16, ps, ps, 'wood');
    c.add(anim(this, 16 + ps * 0.14, y + 16 + ps * 0.12, ANIMS.heroWalk(p.avatar), 8, ps * 0.72, p.tunic));
    c.add(this.add.text(tx, y + 10, p.name, { fontFamily: "'Jacquard 12', serif", fontSize: narrow ? '38px' : '48px', color: C.ink }));
    let ty = y + (narrow ? 54 : 64);
    const t1 = text(this, tx, ty, `Level ${level} ${titleFor(level)} · joined ${new Date(p.createdAt).toLocaleDateString()}`, narrow ? 15 : 18, C.inkSoft, { fontStyle: 'bold', wordWrap: { width: tw } });
    c.add(t1); ty += t1.height + 4;
    const path = s.pathId ? PATH_BY_ID[s.pathId] : null;
    if (path) { const t2 = text(this, tx, ty, `Path: ${path.title} · ${path.subtitle}`, narrow ? 15 : 17, C.ink, { wordWrap: { width: tw } }); c.add(t2); ty += t2.height + 6; }
    const barY = narrow ? y + ps + 30 : y + 114;
    const barX = narrow ? 16 : tx;
    c.add(bar(this, barX, barY, w - barX - 16, 16, into / need, '#a47ce0'));
    c.add(text(this, barX, barY + 18, `${into}/${need} XP to level ${level + 1}`, 15, C.inkSoft));
    const classX = narrow ? 16 : tx, classY = narrow ? swY : y + 160;
    (['knight', 'mage', 'ranger'] as const).forEach((a, i) => {
      const cd = new Card(this, classX + i * 62, classY, 54, 56, () => { s.updateProfile({ avatar: a }); play('click'); this.rebuild(); }, { id: 'hero.class.' + a, label: a, clip: sv });
      if (p.avatar === a) cd.setState2('sel');
      cd.add(sprite(this, 9, 8, a, 36, p.tunic));
      c.add(cd);
    });
    Object.entries(TUNICS).forEach(([id, [col]], i) => {
      const g = this.add.graphics();
      const sx = classX + 204 + (i % 5) * 40, sy = classY + 6 + Math.floor(i / 5) * 40;
      if (sx + 30 > w) return;
      g.fillStyle(0x2b1a12).fillRect(sx - 3, sy - 3, 34, 34);
      if (p.tunic === id) g.lineStyle(3, 0xffd66b).strokeRect(sx - 6, sy - 6, 40, 40);
      g.fillStyle(N(col)).fillRect(sx, sy, 28, 28);
      const z = this.add.zone(sx, sy, 28, 28).setOrigin(0, 0).setInteractive({ useHandCursor: true }).on('pointerup', () => { s.updateProfile({ tunic: id }); play('click'); this.rebuild(); });
      c.add([g, z]);
      UI.reg(this, 'hero.tunic.' + id, z, id);
    });
    y += boxH - 230;
    y += 250;
    y = h2(this, c, y, 'Statistics');
    const stats: [string, number | string, string][] = [
      ['Day streak', s.streak.count, 'flame'], ['Total XP', s.xp, 'bolt'], ['Lessons', s.stats.lessons, 'scroll'], ['Challenges solved', s.stats.challenges, 'code'],
      ['Projects built', s.stats.projects, 'dragon'], ['Perfect lessons', s.stats.perfect, 'star'], ['Achievements', Object.keys(s.achievements).length, 'trophy'], ['Farm fields', Object.keys(s.farm).length, 'tree'],
    ];
    const cols = w > 640 ? 4 : 2;
    const cw = (w - (cols - 1) * 10) / cols;
    stats.forEach(([label, v, ic], i) => {
      const cx = (i % cols) * (cw + 10), cy = y + Math.floor(i / cols) * 90;
      box(this, c, cx, cy, cw, 80);
      c.add(this.add.image(cx + 18, cy + 28, iconTex(this, ic, C.goldDark, 2)).setOrigin(0, 0));
      c.add(text(this, cx + 54, cy + 12, String(v), 28, C.ink, { fontStyle: 'bold' }));
      c.add(text(this, cx + 54, cy + 46, label, 16, C.inkSoft));
    });
    y += Math.ceil(stats.length / cols) * 90 + 16;
    y = h2(this, c, y, 'XP this week');
    const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - (6 - i)); return today(d); });
    const max = Math.max(s.dailyGoal, ...days.map((d) => s.xpByDay[d] ?? 0));
    box(this, c, 0, y, w, 200);
    const bw = (w - 60) / 7;
    days.forEach((d, i) => {
      const v = s.xpByDay[d] ?? 0;
      const bh = Math.max(4, (v / max) * 110);
      const bx = 30 + i * bw;
      const g = this.add.graphics();
      g.fillStyle(v >= s.dailyGoal ? N(C.gold) : N('#b8955c')).fillRect(bx + 8, y + 150 - bh, bw - 16, bh);
      c.add(g);
      if (v) c.add(text(this, bx + bw / 2, y + 130 - bh, String(v), 15, C.inkSoft).setOrigin(0.5, 0));
      c.add(text(this, bx + bw / 2, y + 158, new Date(d + 'T12:00').toLocaleDateString(getLang() === 'pt' ? 'pt-BR' : getLang(), { weekday: 'short' }), 15, C.inkSoft).setOrigin(0.5, 0));
    });
    c.add(text(this, 20, y + 178, `Gold bars reached your daily goal of ${s.dailyGoal} XP.`, 14, C.muted));
    y += 216;
    c.add(new Button(this, 0, y, 'Settings', () => go('settings'), { variant: 'ghost', icon: 'gear', id: 'hero.settings', clip: sv }));
    return y + 60;
  }
}

// ---------------- Settings ----------------
export class SettingsWindow extends WindowScene {
  winTitle = 'Settings';
  winIcon = 'gear';
  constructor() { super('W:settings'); }
  body(c: Phaser.GameObjects.Container, w: number, sv: ScrollView) {
    const s = useGame.getState();
    const set = s.settings;
    let y = say(this, c, 0, 0, w, ANIMS.npcIdle('tools'), 'Tune the workshop to your liking: sounds, hearts, fonts and more.', 'Gwyn · Artificer').h + 16;
    const rows: { label: string; desc?: string; kind: 'toggle' | 'step'; value: boolean | number; values?: { label: string; v: number }[]; set: (v: boolean | number) => void; id: string }[] = [
      { id: 'set.sfx', label: 'Sound effects', kind: 'toggle', value: set.sfx, set: (v) => { s.updateSettings({ sfx: !!v }); configureSound({ sfx: !!v }); } },
      { id: 'set.music', label: 'Music', desc: 'A calm lute tune, made in code.', kind: 'toggle', value: set.music, set: (v) => { s.updateSettings({ music: !!v }); configureSound({ music: !!v }); } },
      { id: 'set.hearts', label: 'Hearts', desc: 'Turn off for Relaxed mode: mistakes never stop a lesson. Good for kids and beginners.', kind: 'toggle', value: set.hearts, set: (v) => s.updateSettings({ hearts: !!v }) },
      { id: 'set.sage', label: "Sage's notes", desc: 'Real-world details in coding challenges (for adults and career switchers).', kind: 'toggle', value: set.sageNotes, set: (v) => s.updateSettings({ sageNotes: !!v }) },
      { id: 'set.tips', label: 'Tips for new screens', desc: 'Lumi shows a short guided tour the first time you open a screen.', kind: 'toggle', value: set.tips !== false, set: (v) => s.updateSettings({ tips: !!v }) },
      { id: 'set.goal', label: 'Daily goal', desc: 'XP to earn each day', kind: 'step', value: s.dailyGoal, values: [10, 20, 30, 50].map((n) => ({ label: `${n} XP`, v: n })), set: (v) => s.setDailyGoal(Number(v)) },
      { id: 'set.classic', label: 'Classic code font', desc: 'A standard font for code instead of the pixel one (easier to read for long code).', kind: 'toggle', value: set.classicCode, set: (v) => s.updateSettings({ classicCode: !!v }) },
      { id: 'set.font', label: 'Editor text size', kind: 'step', value: set.fontSize, values: [13, 14, 15, 16, 18, 20, 22].map((n) => ({ label: `${n}px`, v: n })), set: (v) => s.updateSettings({ fontSize: Number(v) }) },
      { id: 'set.speed', label: 'Hero map speed', kind: 'step', value: set.speed, values: [{ label: 'Slow', v: 0.5 }, { label: 'Normal', v: 1 }, { label: 'Fast', v: 2 }, { label: 'Very fast', v: 4 }], set: (v) => s.updateSettings({ speed: Number(v) }) },
      { id: 'set.notify', label: 'Reminders', desc: 'Browser notifications when your streak is in danger or your pet is hungry (also in the raven inbox).', kind: 'toggle', value: set.notify, set: (v) => { if (v) void askNotify().then(() => this.rebuild()); else s.updateSettings({ notify: false }); } },
      { id: 'set.remind', label: 'Reminder time', kind: 'step', value: set.remindHour, values: [-1, 8, 12, 17, 19, 21].map((h) => ({ label: h < 0 ? 'Off' : `${h}:00`, v: h })), set: (v) => s.updateSettings({ remindHour: Number(v) }) },
      { id: 'set.dev', label: 'Developer mode', desc: 'A DEV button (and the ` key) opens a panel to test everything: XP, time travel, pets, battles...', kind: 'toggle', value: s.dev.on, set: (v) => useGame.setState((x) => ({ dev: { ...x.dev, on: !!v } })) },
    ];
    // language: three flags at the top
    c.add(text(this, 0, y, t('Language'), 22, C.ink, { fontStyle: 'bold' }));
    let lx = 120;
    for (const l of LANGS) {
      const b = new Button(this, lx, y - 6, l.name, () => { if (l.id === set.lang) return; s.updateSettings({ lang: l.id }); setLang(l.id); location.reload(); }, { variant: set.lang === l.id ? 'gold' : 'paper', h: 40, size: 16, id: 'set.lang.' + l.id, clip: sv, upper: false });
      c.add(b); lx += b.bw + 8;
    }
    y += 52;
    const rowH = 84;
    box(this, c, 0, y, w, rows.length * rowH + 20);
    rows.forEach((r, i) => {
      const ry = y + 14 + i * rowH;
      const ctrlW = r.kind === 'toggle' ? 40 : 190;
      c.add(text(this, 18, ry + 6, r.label, 21, C.ink, { fontStyle: 'bold' }));
      if (r.desc) note(this, c, 18, ry + 32, w - ctrlW - 56, r.desc, 16);
      if (r.kind === 'toggle') c.add(checkbox(this, w - 60, ry + 16, !!r.value, (v) => r.set(v), r.id, sv));
      else {
        const idx = Math.max(0, r.values!.findIndex((o) => o.v === r.value));
        c.add(stepper(this, w - ctrlW - 20, ry + 12, ctrlW, r.values!.map((o) => o.label), idx, (k) => r.set(r.values![k].v), r.id, sv));
      }
      if (i < rows.length - 1) { const g = this.add.graphics(); g.fillStyle(N('#b8955c')); for (let xx = 16; xx < w - 16; xx += 10) g.fillRect(xx, ry + rowH - 8, 6, 3); c.add(g); }
    });
    y += rows.length * rowH + 36;
    y = h2(this, c, y, 'Help');
    const hb = [
      new Button(this, 0, y, 'Replay the welcome tour', () => goAndTour(this.game, 'world', 'World'), { variant: 'blue', icon: 'map', id: 'set.tour', clip: sv, size: 18 }),
      new Button(this, 0, y, 'Help & FAQ', () => go('help'), { variant: 'ghost', icon: 'hint', id: 'set.faq', clip: sv, size: 18 }),
      new Button(this, 0, y, 'Show screen tips again', () => { resetTips(); play('unlock'); }, { variant: 'ghost', icon: 'reset', id: 'set.tips.reset', clip: sv, size: 18 }),
    ];
    y += flowButtons(c, hb, w, y);
    y = h2(this, c, y, 'Your save');
    y += note(this, c, 0, y, w, 'Progress is saved in this browser. To play on another computer, back it up to a file and load it there.', 18) + 10;
    const sb = [
      new Button(this, 0, y, 'Back up my progress', () => downloadSave(), { variant: 'green', icon: 'chest', id: 'set.export', clip: sv, size: 18 }),
      new Button(this, 0, y, 'Load a backup', () => loadSave((msg) => { this.p.st!.saveMsg = msg; this.rebuild(); }), { variant: 'ghost', icon: 'book', id: 'set.import', clip: sv, size: 18 }),
    ];
    y += flowButtons(c, sb, w, y);
    if (this.p.st!.saveMsg) { c.add(text(this, 0, y - 6, String(this.p.st!.saveMsg), 18, C.redDark, { fontStyle: 'bold' })); y += 30; }
    const confirm = this.p.st!.confirm === true;
    if (!confirm) c.add(new Button(this, 0, y, 'Start over (erase progress)', () => { this.p.st!.confirm = true; this.rebuild(); }, { variant: 'red', id: 'set.reset', clip: sv }));
    else {
      c.add(text(this, 0, y + 12, 'Are you sure? This cannot be undone.', 20, C.redDark, { fontStyle: 'bold' }));
      c.add(new Button(this, 0, y + 44, 'Yes, erase', () => { s.resetAll(); sessionStorage.clear(); go(''); }, { variant: 'red', id: 'set.reset.yes', clip: sv }));
      c.add(new Button(this, 190, y + 44, 'Cancel', () => { this.p.st!.confirm = false; this.rebuild(); }, { variant: 'ghost', id: 'set.reset.no', clip: sv }));
      y += 44;
    }
    return y + 70;
  }
}

/** Lays buttons out left to right, wrapping. Returns the height used. */
function flowButtons(c: Phaser.GameObjects.Container, list: Button[], w: number, y: number) {
  let x = 0, yy = y;
  for (const b of list) { if (x > 0 && x + b.bw > w) { x = 0; yy += b.bh + 12; } b.setPosition(x, yy); c.add(b); x += b.bw + 12; }
  return yy - y + (list[0]?.bh ?? 0) + 22;
}

const SAVE_KEY = 'realm-of-code-save';
function downloadSave() {
  const data = localStorage.getItem(SAVE_KEY) ?? '{}';
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([data], { type: 'application/json' }));
  a.download = `realm-of-code-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  play('coin');
}
function loadSave(fail: (msg: string) => void) {
  const inp = document.createElement('input');
  inp.type = 'file'; inp.accept = '.json,application/json';
  inp.onchange = async () => {
    const f = inp.files?.[0];
    if (!f) return;
    try {
      const j = JSON.parse(await f.text());
      if (!j?.state?.profile) throw new Error('no hero');
      localStorage.setItem(SAVE_KEY, JSON.stringify(j));
      location.hash = '#/world';
      location.reload();
    } catch { fail('That file is not a Realm of Code backup.'); }
  };
  inp.click();
}

// ---------------- The Path Board ----------------
export class PathBoardWindow extends WindowScene {
  winTitle = 'The Path Board';
  winIcon = 'map';
  constructor() { super('W:paths'); }
  body(c: Phaser.GameObjects.Container, w: number, sv: ScrollView) {
    const s = useGame.getState();
    let y = say(this, c, 0, 0, w, ANIMS.npcIdle('web'), 'Every road leads somewhere good. Switch whenever you like: lessons you finished count on every path that includes them.', 'Elder Tomas').h + 16;
    for (const p of PATHS) {
      const pr = pathProgress(p.id, s.done);
      const active = p.id === s.pathId;
      const desc = this.add.text(0, 0, p.desc, { fontFamily: "'Jersey 15'", fontSize: '18px', color: C.ink, wordWrap: { width: w - 110 } });
      // course tags
      const tags: [string, string][] = p.courses.filter((id) => COURSE_BY_ID[id]).map((id) => [COURSE_BY_ID[id].title, COURSE_BY_ID[id].color]);
      let tx = 0, tRows = 1;
      for (const [t] of tags) { const tw = t.length * 8 + 26; if (tx + tw > w - 110) { tx = 0; tRows++; } tx += tw + 6; }
      const narrow = w < 600;
      const h = 96 + desc.height + tRows * 30 + 50 + (narrow ? 56 : 0);
      box(this, c, 0, y, w, h, active ? 'sel' : 'panel');
      c.add(emblem(this, 18, y + 18, p.color, p.icon, 52));
      c.add(text(this, 86, y + 12, p.title, 26, C.ink, { fontStyle: 'bold' }));
      c.add(text(this, 86, y + 44, p.subtitle, 18, C.inkSoft, { fontStyle: 'bold' }));
      const ay = narrow ? y + h - 56 : y + 14;
      if (active) pill(this, c, narrow ? 86 : w - 140, ay + 2, 'Current path', '#3f8fd6', '#ffffff');
      else c.add(new Button(this, narrow ? 86 : w - 190, ay, 'Follow this path', () => { s.setPath(p.id); play('unlock'); go('learn'); }, { variant: 'blue', size: 17, h: 42, id: 'path.' + p.id, clip: sv }));
      desc.setPosition(86, y + 74);
      c.add(desc);
      let ty = y + 80 + desc.height;
      tx = 0;
      for (const [t, col] of tags) {
        const tw = t.length * 8 + 26;
        if (tx + tw > w - 110) { tx = 0; ty += 30; }
        pill(this, c, 86 + tx, ty, t, col, '#ffffff', 14);
        tx += tw + 6;
      }
      ty += 36;
      c.add(bar(this, 86, ty, w - 110, 14, pr.pct / 100, '#5aa6e8'));
      c.add(text(this, 86, ty + 18, `${pr.done}/${pr.total} lessons done · Goal: ${p.role}`, 15, C.inkSoft, { wordWrap: { width: w - 100 } }));
      y += h + 14;
    }
    return y;
  }
}
