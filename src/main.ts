// Realm of Code: the whole game runs in Phaser. This file loads the fonts, creates the
// game, registers every scene, and connects the address bar (#/learn, #/lesson/...) to scenes.
import Phaser from 'phaser';
import './styles/game.css';
import { useGame } from './game/store';
import { configureSound, startMusic } from './audio/sound';
import { parseHash, resolve, show } from './game/director';
import { go } from './lib/route';
import { UI } from './ui/widgets';
import { installDebug } from './debug';
import { SCENES } from './scenes';
import { setLang, detectLang, missingStrings } from './i18n';
import { installTextTranslation } from './i18n/phaser';
import { setTimeOffset } from './game/clock';
import { checkAbsence, startPresence } from './game/away';
import { ensureStarterEgg } from './game/pets';


/** True when WebGL would run in software (no GPU): the Canvas renderer is much faster then. */
function softwareGl(): boolean {
  if (/[?&]webgl\b/.test(location.search)) return false;
  try {
    const gl = document.createElement('canvas').getContext('webgl');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const name = String(ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER));
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /swiftshader|llvmpipe|softpipe|software|basic render/i.test(name);
  } catch { return false; }
}

async function boot() {
  // language and the debug clock come first: everything else reads them
  const s0 = useGame.getState();
  await setLang(s0.settings.lang ?? detectLang());
  installTextTranslation();
  (window as unknown as { __i18n: unknown }).__i18n = { missing: missingStrings };
  if (!s0.profile && !localStorage.getItem('realm-of-code-save')) useGame.getState().updateSettings({ lang: detectLang() });
  if (s0.dev.on || /[?&]debug\b/.test(location.search)) { setTimeOffset(s0.dev.timeOffset ?? 0); if (/[?&]debug\b/.test(location.search)) useGame.setState((st) => ({ dev: { ...st.dev, on: true } })); }
  checkAbsence();
  startPresence();
  ensureStarterEgg();
  // make sure the pixel fonts are ready before any text is drawn
  const warm = document.createElement('div');
  warm.className = 'font-warm';
  warm.innerHTML = '<span>a</span><span>a</span><span>a</span>';
  document.body.appendChild(warm);
  await Promise.all([
    document.fonts.load("22px 'Jersey 15'"), document.fonts.load("bold 22px 'Jersey 15'"),
    document.fonts.load("44px 'Jacquard 12'"), document.fonts.load("24px 'VT323'"),
  ]).catch(() => {});

  const game = new Phaser.Game({
    type: /[?&]canvas\b/.test(location.search) || softwareGl() ? Phaser.CANVAS : Phaser.AUTO,
    parent: 'root',
    pixelArt: true,
    roundPixels: true,
    backgroundColor: '#1c110a',
    scale: { mode: Phaser.Scale.RESIZE, width: '100%', height: '100%' },
    dom: { createContainer: true },
    audio: { noAudio: true },
    banner: false,
    input: { mouse: { preventDefaultWheel: false }, keyboard: { target: window } },
    scene: SCENES,
  });

  // Save battery: when the game window is not focused or nobody has touched it for 45 seconds
  // (for example left open on the desktop), draw only a few frames per second. Full speed as soon
  // as it is used again.
  // (Automated browsers used by the tests always run at full speed.)
  if (!navigator.webdriver) {
    const setLimit = (fps: number) => {
      const l = game.loop as unknown as { fpsLimit: number; hasFpsLimit: boolean; _limitRate: number; sleep: () => void; wake: (s?: boolean) => void; running: boolean };
      if (l.fpsLimit === fps) return;
      l.fpsLimit = fps; l.hasFpsLimit = fps > 0; l._limitRate = fps > 0 ? 1000 / fps : 0;
      if (l.running) { l.sleep(); l.wake(true); }
    };
    let idleTimer = 0;
    const idle = () => setLimit(8);
    const busy = () => { setLimit(0); clearTimeout(idleTimer); idleTimer = window.setTimeout(idle, 45000); };
    addEventListener('blur', idle);
    for (const ev of ['focus', 'pointerdown', 'pointermove', 'keydown', 'wheel', 'touchstart']) addEventListener(ev, busy, { passive: true });
    game.events.once('ready', () => { if (!document.hasFocus()) idle(); else busy(); });
  }

  const s = useGame.getState();
  configureSound({ sfx: s.settings.sfx, music: s.settings.music });
  useGame.subscribe((a, b) => { if (a.settings.sfx !== b.settings.sfx || a.settings.music !== b.settings.music) configureSound({ sfx: a.settings.sfx, music: a.settings.music }); });
  addEventListener('pointerdown', () => startMusic(), { once: true });

  const route = () => {
    const st = useGame.getState();
    st.ensureDaily(); st.refreshHearts();
    const parts = parseHash();
    if (!st.profile && parts[0] && parts[0] !== 'welcome' && parts[0] !== 'dev') { go('welcome'); return; }
    show(game, resolve(parts));
  };
  game.events.once('ready', () => {
    game.scene.start('Toasts');
    game.scene.start('Coach');
    game.scene.start('DevBadge');
    route();
    addEventListener('hashchange', route);
  });
  installDebug(game);
  // offline support and notifications (production builds only)
  if ('serviceWorker' in navigator && import.meta.env.PROD) navigator.serviceWorker.register('./sw.js').catch(() => {});
  (window as unknown as { __game: Phaser.Game }).__game = game;
  void UI;
}

void boot();
