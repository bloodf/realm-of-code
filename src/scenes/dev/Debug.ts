// Developer mode: a panel that can do anything, to test every part of the game quickly.
// Open it with the "DEV" button (shown when developer mode is on), the ` key, or #?debug.
// Turn developer mode on in Settings, or open the game with ?debug in the address.
import Phaser from 'phaser';
import { UIScene } from '../base';
import { useGame } from '../../game/store';
import { now, setTimeOffset, timeOffset, DAY, HOUR } from '../../game/clock';
import { checkAbsence, reminderText, showNotification, askNotify, markSeen, lastSeen } from '../../game/away';
import { giveEgg, hatch, spawnPet, SPECIES, RARITIES, tickPets } from '../../game/pets';
import { CROPS, ANIMALS, buyAnimal, growAll, tickHome } from '../../game/home';
import { MOBS, REGIONS, spawnInvaders } from '../../game/battle';
import { ACHIEVEMENTS } from '../../game/achievements';
import { NODE_BY_ID, pathNodes, currentIndex, PATHS } from '../../course';
import { LEVELS } from '../../farm/levels';
import { GAME_INFO } from '../../course/adaptive';
import { pauseUnder, resetTips } from '../help/helpers';
import { Button, ScrollView, text, woodBg, parchmentBg, UI, sprite } from '../../ui/widgets';
import { C } from '../../ui/theme';
import { go } from '../../lib/route';
import { play } from '../../audio/sound';
import { LANGS, setLang, type Lang } from '../../i18n';
import type { Rarity } from '../../game/types07';

type Tab = 'player' | 'progress' | 'time' | 'pets' | 'home' | 'battle' | 'notify' | 'goto' | 'misc';
const TABS: [Tab, string][] = [['player', 'Player'], ['progress', 'Progress'], ['time', 'Time'], ['pets', 'Pets'], ['home', 'Homestead'], ['battle', 'Battles'], ['notify', 'Notifications'], ['goto', 'Go to'], ['misc', 'Misc']];

const done = (ids: string[]) => useGame.setState((s) => ({ done: { ...s.done, ...Object.fromEntries(ids.map((id) => [id, { times: 1, best: 100, at: now() }])) }, stats: { ...s.stats, lessons: s.stats.lessons + ids.filter((id) => !s.done[id]).length } }));

export class Debug extends UIScene {
  constructor() { super('Debug'); }

  build() {
    const st = this.p.st as { tab?: Tab; msg?: string; shiny?: boolean };
    st.tab ??= 'player';
    if (!this.p.__resume) this.p.__resume = pauseUnder(this.game, ['Debug']);
    this.events.once('shutdown', () => { if (!this.rebuilding) (this.p.__resume as () => void)(); });
    const { W, H } = this;
    const pw = Math.min(860, W - 16), ph = H - 24, px = (W - pw) / 2, py = 12;
    this.add.rectangle(0, 0, W, H, 0x0a0610, 0.6).setOrigin(0, 0).setInteractive();
    const g = this.add.graphics(); g.fillStyle(0x1c110a).fillRect(px - 5, py - 5, pw + 10, ph + 10);
    parchmentBg(this, px, py, pw, ph);
    woodBg(this, px, py, pw, 52);
    this.add.text(px + 16, py + 26, 'Developer mode', { fontFamily: "'Jacquard 12', serif", fontSize: '34px', color: '#ffd66b', stroke: '#1c110a', strokeThickness: 5 }).setOrigin(0, 0.5);
    text(this, px + 300, py + 16, `game time ${new Date(now()).toLocaleString()} · offset ${(timeOffset() / DAY).toFixed(2)} days`, 15, '#fff3d6');
    new Button(this, px + pw - 54, py + 6, '', () => this.scene.stop(), { variant: 'red', icon: 'x', w: 44, h: 40, id: 'dev.close' });
    // tabs
    const tw = 130;
    TABS.forEach(([id, label], i) => new Button(this, px + 10, py + 64 + i * 48, label, () => { st.tab = id; st.msg = ''; this.rebuild(); }, { variant: st.tab === id ? 'gold' : 'paper', w: tw, h: 42, size: 15, id: 'dev.tab.' + id, upper: false }));
    if (st.msg) text(this, px + tw + 24, py + ph - 30, st.msg, 16, C.greenDark, { fontStyle: 'bold' });
    const sv = new ScrollView(this, px + tw + 22, py + 64, pw - tw - 36, ph - 104);
    const c = sv.content;
    const w = pw - tw - 50;
    let x = 0, y = 0;
    const say = (m: string) => { st.msg = m; play('coin'); this.rebuild(); };
    const head = (s: string) => { if (x) { x = 0; y += 50; } c.add(text(this, 0, y, s, 20, C.ink, { fontStyle: 'bold' })); y += 30; };
    const btn = (label: string, fn: () => void, id: string, variant: 'blue' | 'green' | 'red' | 'paper' | 'gold' | 'purple' = 'blue') => {
      const b = new Button(this, 0, 0, label, fn, { variant, h: 40, size: 14, id: 'dev.' + id, clip: sv, upper: false });
      if (x + b.bw > w) { x = 0; y += 48; }
      b.setPosition(x, y); c.add(b); x += b.bw + 8;
    };
    const s = useGame.getState();
    switch (st.tab) {
      case 'player':
        head('Resources');
        btn('+100 XP', () => { useGame.getState().gainXp(100); say('+100 XP'); }, 'xp100');
        btn('+1000 XP', () => { useGame.getState().gainXp(1000); say('+1000 XP'); }, 'xp1000');
        btn('+500 gold', () => { useGame.setState({ gold: useGame.getState().gold + 500 }); say('+500 gold'); }, 'gold');
        btn('+5 of every item', () => { useGame.getState().addItems({ bulb: 5, torch: 5, potion: 5 }); say('+5 items'); }, 'items');
        btn('Full hearts', () => { useGame.setState({ hearts: { n: 5, at: now() } }); say('hearts full'); }, 'hearts');
        btn('No hearts', () => { useGame.setState({ hearts: { n: 0, at: now() } }); say('hearts 0'); }, 'hearts0');
        head('Streak');
        btn('Streak +1 day', () => { useGame.setState((x) => ({ streak: { ...x.streak, count: x.streak.count + 1, best: Math.max(x.streak.best, x.streak.count + 1), last: new Date(now()).toISOString().slice(0, 10) } })); say('streak +1'); }, 'streak1');
        btn('Streak = 30', () => { useGame.setState((x) => ({ streak: { ...x.streak, count: 30, best: Math.max(30, x.streak.best) } })); useGame.getState().checkAchievements(); say('streak 30'); }, 'streak30');
        btn('Reach daily goal', () => { useGame.getState().gainXp(useGame.getState().dailyGoal); say('goal reached'); }, 'goal');
        head(`Hero: ${s.profile?.name} · XP ${s.xp} · gold ${s.gold}`);
        btn('Knight', () => useGame.getState().updateProfile({ avatar: 'knight' }), 'knight', 'paper');
        btn('Mage', () => useGame.getState().updateProfile({ avatar: 'mage' }), 'mage', 'paper');
        btn('Ranger', () => useGame.getState().updateProfile({ avatar: 'ranger' }), 'ranger', 'paper');
        break;
      case 'progress': {
        const pid = s.pathId ?? 'explore';
        const nodes = pathNodes(pid);
        const cur = currentIndex(pid, s.done);
        head(`Path ${pid}: ${cur}/${nodes.length} lessons`);
        btn('Finish the next lesson', () => { const n = nodes[cur]; if (n) { done([n.node.id]); say('done ' + n.node.id); } }, 'next');
        btn('Finish the current unit', () => { const n = nodes[cur]; if (n) { done(n.unit.lessons.map((l) => l.id)); say('unit done'); } }, 'unit');
        btn('Finish 25% of the path', () => { done(nodes.slice(0, Math.ceil(nodes.length * 0.25)).map((n) => n.node.id)); say('25%'); }, 'p25');
        btn('Finish 90% of the path', () => { done(nodes.slice(0, Math.ceil(nodes.length * 0.9)).map((n) => n.node.id)); useGame.getState().checkAchievements(); say('90%'); }, 'p90');
        btn('Finish the whole path', () => { done(nodes.map((n) => n.node.id)); useGame.getState().checkAchievements(); say('path done'); }, 'path');
        btn('Finish every lesson', () => { done(Object.keys(NODE_BY_ID)); useGame.getState().checkAchievements(); say('all lessons done'); }, 'all', 'purple');
        btn('Reset lessons', () => { useGame.setState({ done: {}, reviews: {}, history: [], testedOut: {} }); say('lessons reset'); }, 'reset', 'red');
        head('Paths');
        for (const p of PATHS) btn(p.id, () => { useGame.getState().setPath(p.id); say('path ' + p.id); }, 'path.' + p.id, s.pathId === p.id ? 'gold' : 'paper');
        head('Code Farm');
        btn('Open every field', () => { useGame.setState({ farm: Object.fromEntries(LEVELS.map((l) => [l.id, { stars: 1, size: 99, at: now() }])) }); say('farm open'); }, 'farm');
        btn('3 stars everywhere', () => { useGame.setState({ farm: Object.fromEntries(LEVELS.map((l) => [l.id, { stars: 3, size: 1, at: now() }])) }); useGame.getState().checkAchievements(); say('farm 3 stars'); }, 'farm3');
        head(`Achievements: ${Object.keys(s.achievements).length}/${ACHIEVEMENTS.length}`);
        btn('Unlock all achievements', () => { useGame.setState({ achievements: Object.fromEntries(ACHIEVEMENTS.map((a) => [a.id, now()])) }); say('all achievements'); }, 'ach');
        btn('Reset achievements', () => { useGame.setState({ achievements: {} }); say('achievements reset'); }, 'achreset', 'red');
        btn('Check achievements now', () => { const n = useGame.getState().checkAchievements(); say(`${n.length} new`); }, 'achcheck', 'paper');
        btn('Show tours again', () => { resetTips(); say('tours reset'); }, 'tours', 'paper');
        break;
      }
      case 'time':
        head(`Last seen: ${new Date(lastSeen()).toLocaleString()}`);
        c.add(text(this, 0, y, 'Move the game clock forward to test what happens when a player is away: hearts refill, crops grow and wither, pets get hungry, streaks break, monsters invade and the welcome-back screen appears.', 16, C.inkSoft, { wordWrap: { width: w } })); y += 70;
        for (const [label, ms] of [['+1 hour', HOUR], ['+8 hours', 8 * HOUR], ['+1 day', DAY], ['+3 days', 3 * DAY], ['+7 days', 7 * DAY], ['+30 days', 30 * DAY]] as [string, number][]) {
          btn(label, () => this.skip(ms), 'skip.' + label.replace(/\W/g, ''));
        }
        head('Clock');
        btn('Back to real time', () => { setTimeOffset(0); useGame.setState((x) => ({ dev: { ...x.dev, timeOffset: 0 } })); markSeen(); say('real time'); }, 'realtime', 'paper');
        btn('Run the absence check now', () => { const r = checkAbsence(); say(r ? `away ${r.days} days` : 'not away'); }, 'absence', 'paper');
        btn('Clean the village', () => { useGame.setState((x) => ({ decay: 0, battle: { ...x.battle, invaders: [] } })); say('clean'); }, 'clean', 'paper');
        break;
      case 'pets':
        head(`Eggs ${s.pets.eggs.length} · pets ${s.pets.list.length}`);
        for (const r of RARITIES) btn(`${r} egg`, () => { giveEgg(r as Rarity, 'Debug.'); say(r + ' egg'); }, 'egg.' + r);
        btn('Hatch every egg now', () => { for (const e of useGame.getState().pets.eggs) { useGame.setState((x) => ({ pets: { ...x.pets, eggs: x.pets.eggs.map((q) => (q.uid === e.uid ? { ...q, progress: q.need } : q)) } })); hatch(e.uid); } say('hatched'); }, 'hatchall', 'green');
        btn('Make pets hungry', () => { useGame.setState((x) => ({ pets: { ...x.pets, list: x.pets.list.map((p) => ({ ...p, full: 5, joy: 10, tick: now() })) } })); say('hungry'); }, 'hungry', 'red');
        btn('Make pets happy', () => { useGame.setState((x) => ({ pets: { ...x.pets, list: x.pets.list.map((p) => ({ ...p, full: 100, joy: 100, tick: now() })) } })); tickPets(); say('happy'); }, 'happy', 'green');
        btn(st.shiny ? 'Spawning: SHINY' : 'Spawning: normal', () => { st.shiny = !st.shiny; this.rebuild(); }, 'shiny', st.shiny ? 'gold' : 'paper');
        head('Spawn a pet');
        for (const sp of SPECIES) btn(`${sp.name} (${sp.rarity})`, () => { spawnPet(sp.id, !!st.shiny); say(sp.name); }, 'pet.' + sp.id, sp.rarity === 'ultra' ? 'purple' : 'paper');
        break;
      case 'home':
        head(`Plots ${s.home.size}/12 · animals ${s.home.animals.length}`);
        btn('Grow everything', () => { growAll(); say('grown'); }, 'grow', 'green');
        btn('10 seeds of each', () => { useGame.setState((x) => ({ home: { ...x.home, inv: { ...x.home.inv, ...Object.fromEntries(CROPS.map((cr) => ['seed-' + cr.id, (x.home.inv['seed-' + cr.id] ?? 0) + 10])), hay: (x.home.inv.hay ?? 0) + 20 } } })); say('seeds'); }, 'seeds');
        btn('5 of every crop', () => { useGame.setState((x) => ({ home: { ...x.home, inv: { ...x.home.inv, ...Object.fromEntries(CROPS.map((cr) => [cr.id, (x.home.inv[cr.id] ?? 0) + 5])), egg: 5, milk: 5, truffle: 2 } } })); say('crops'); }, 'crops');
        btn('Open all plots', () => { useGame.setState((x) => ({ home: { ...x.home, size: 12 } })); say('12 plots'); }, 'plots');
        btn('Weeds everywhere', () => { useGame.setState((x) => ({ home: { ...x.home, plots: x.home.plots.map((p) => (p.crop ? p : { ...p, weeds: true })) } })); say('weeds'); }, 'weeds', 'red');
        btn('Hungry animals', () => { useGame.setState((x) => ({ home: { ...x.home, animals: x.home.animals.map((a) => ({ ...a, full: 5, tick: now() })) } })); tickHome(); say('hungry'); }, 'hungrya', 'red');
        head('Give an animal');
        for (const a of ANIMALS) btn(a.name, () => { buyAnimal(a.id, true); say(a.name); }, 'animal.' + a.id, 'paper');
        break;
      case 'battle':
        head(`Wins ${s.battle.wins} · invaders ${s.battle.invaders.length}`);
        btn('Spawn 3 invaders', () => { spawnInvaders(useGame.getState().battle.invaders.length + 3); say('invaders'); }, 'invade', 'red');
        btn('Clear invaders', () => { useGame.setState((x) => ({ battle: { ...x.battle, invaders: [] } })); say('cleared'); }, 'clearinv', 'paper');
        btn('The Junior Trial', () => { this.scene.stop(); go('battle/trial'); }, 'trial', 'purple');
        for (const r of REGIONS) {
          head(r.name);
          for (const id of [...r.mobs, r.boss]) btn(MOBS[id].name, () => { this.scene.stop(); go(`battle/${r.id}/${id}`); }, `fight.${r.id}.${id}`, id === r.boss ? 'red' : 'paper');
        }
        break;
      case 'notify':
        head('Messages');
        btn('Ask for browser notifications', () => { void askNotify().then((ok) => say(ok ? 'allowed' : 'denied')); }, 'ask');
        btn('Send a reminder notification', () => { const m = reminderText(); void showNotification(m.title, m.text); useGame.getState().mail({ kind: 'reminder', title: m.title, text: m.text, sprite: 'fairy' }); say('sent'); }, 'remind');
        btn('Add a raven message', () => { useGame.getState().mail({ kind: 'info', title: 'A test raven', text: 'Hello from developer mode!', sprite: 'bird1', to: 'learn' }); say('mail'); }, 'mail');
        btn('Show a toast', () => { useGame.getState().pushToast({ kind: 'info', title: 'Toast', text: 'This is a test toast.', icon: 'star' }); say('toast'); }, 'toast');
        btn('Welcome-back screen', () => { useGame.setState({ away: { days: 5, at: now(), seen: false } }); this.scene.stop(); go('welcome-back'); }, 'wb');
        break;
      case 'goto': {
        head('Screens');
        for (const r of ['', 'welcome', 'world', 'learn', 'practice', 'farm', 'home', 'pets', 'battle', 'quests', 'skills', 'trophies', 'profile', 'settings', 'paths', 'help', 'inbox', 'welcome-back', 'review']) btn('#/' + r, () => { this.scene.stop(); go(r); }, 'go.' + (r || 'title'), 'paper');
        head('Minigames');
        for (const g of Object.keys(GAME_INFO)) btn(GAME_INFO[g as keyof typeof GAME_INFO].name, () => { this.scene.stop(); go('arcade/' + g); }, 'go.game.' + g, 'paper');
        head('Lessons');
        const pid = s.pathId ?? 'explore';
        const nodes = pathNodes(pid);
        const cur = currentIndex(pid, s.done);
        btn('Current lesson', () => { const n = nodes[cur]; if (n) { this.scene.stop(); go('lesson/' + n.node.id); } }, 'go.lesson');
        btn('Content check (#/dev/verify)', () => { this.scene.stop(); go('dev/verify'); }, 'go.verify', 'paper');
        head('Farm fields');
        for (const l of LEVELS) btn(l.id, () => { this.scene.stop(); go('farm/' + l.id); }, 'go.farm.' + l.id, 'paper');
        break;
      }
      case 'misc':
        head('Language');
        for (const l of LANGS) btn(l.name, () => { useGame.getState().updateSettings({ lang: l.id as Lang }); setLang(l.id as Lang); location.reload(); }, 'lang.' + l.id, s.settings.lang === l.id ? 'gold' : 'paper');
        head('Tools');
        btn(this.registry.get('dev:ids') ? 'Hide UI ids' : 'Show UI ids', () => { this.registry.set('dev:ids', !this.registry.get('dev:ids')); this.game.events.emit('dev:ids'); say('ui ids'); }, 'ids', 'paper');
        btn('Copy save to clipboard', () => { void navigator.clipboard?.writeText(localStorage.getItem('realm-of-code-save') ?? ''); say('copied'); }, 'copy', 'paper');
        btn('Turn developer mode off', () => { useGame.setState((x) => ({ dev: { ...x.dev, on: false } })); this.scene.stop(); location.hash = ''; location.reload(); }, 'off', 'red');
        btn('Erase everything', () => { useGame.getState().resetAll(); localStorage.clear(); sessionStorage.clear(); location.hash = ''; location.reload(); }, 'erase', 'red');
        break;
    }
    sv.setContentHeight(y + 70);
    this.input.keyboard?.on('keydown-ESC', () => this.scene.stop());
    this.input.keyboard?.on('keydown-BACKTICK', () => this.scene.stop());
    void sprite; void UI;
  }

  /** Moves the game clock forward and plays the "away" logic as if the game was closed. */
  private skip(ms: number) {
    const before = lastSeen() || now();
    setTimeOffset(timeOffset() + ms);
    useGame.setState((x) => ({ dev: { ...x.dev, timeOffset: timeOffset() } }));
    markSeen(before);
    useGame.getState().refreshHearts();
    tickPets(); tickHome();
    const r = checkAbsence();
    this.scene.stop();
    if (r && r.days >= 1) go('welcome-back');
    else { const p = this.p.st as { msg?: string }; p.msg = 'time moved'; }
  }
}

/** The little DEV button and the UI-id overlay, shown on top of everything in developer mode. */
export class DevBadge extends Phaser.Scene {
  private overlay?: Phaser.GameObjects.Graphics;
  private labels: Phaser.GameObjects.Text[] = [];
  constructor() { super('DevBadge'); }
  create() {
    const draw = () => {
      this.children.removeAll(true);
      this.labels = [];
      if (!useGame.getState().dev.on) return;
      const b = new Button(this, this.scale.width / 2 - 36, 4, 'DEV', () => openDebug(this.game), { variant: 'purple', h: 34, size: 14, id: 'dev.open' });
      b.setAlpha(0.85);
      this.overlay = this.add.graphics().setDepth(100);
    };
    draw();
    const unsub = useGame.subscribe((a, b) => { if (a.dev.on !== b.dev.on) draw(); });
    this.scale.on('resize', draw);
    const tick = this.time.addEvent({ delay: 500, loop: true, callback: () => this.paintIds() });
    this.input.keyboard?.on('keydown-BACKTICK', () => { if (useGame.getState().dev.on) openDebug(this.game); });
    this.events.once('shutdown', () => { unsub(); tick.remove(); this.scale.off('resize', draw); });
  }
  private paintIds() {
    if (!this.overlay) return;
    this.overlay.clear();
    this.labels.forEach((l) => l.destroy());
    this.labels = [];
    if (!this.registry.get('dev:ids')) return;
    for (const e of UI.list()) {
      if (!e.rect || e.scene === 'DevBadge') continue;
      this.overlay.lineStyle(1, 0xff00ff, 0.8).strokeRect(e.rect.x, e.rect.y, e.rect.w, e.rect.h);
      this.labels.push(this.add.text(e.rect.x, e.rect.y, e.id, { fontFamily: 'monospace', fontSize: '10px', color: '#ffffff', backgroundColor: '#a000a0' }).setDepth(101));
    }
  }
}

export function openDebug(game: Phaser.Game) {
  if (game.scene.isActive('Debug')) return;
  game.scene.run('Debug', {});
  game.scene.bringToTop('Debug');
}
