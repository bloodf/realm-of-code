// Builds the live preview document for web lessons. Everything is compiled in
// the browser: JSX with Sucrase, .vue with @vue/compiler-sfc, .svelte with the
// Svelte compiler. Framework runtimes are served from /vendor (see scripts/build-vendor.mjs).
import { transform } from 'sucrase';
import type { WebMode } from '../content/types';

export interface BuildError { file: string; line: number; message: string }
export interface BuiltPreview { html: string; errors: BuildError[]; cleanup: () => void }

const abs = (p: string) => new URL(p, document.baseURI).href;

function importMap(extra: Record<string, string>) {
  const v = (p: string) => abs('vendor/' + p);
  const imports: Record<string, string> = {
    react: v('react/react.js'),
    'react-dom': v('react/react-dom.js'),
    'react-dom/client': v('react/react-dom-client.js'),
    'react/jsx-runtime': v('react/jsx-runtime.js'),
    'react/jsx-dev-runtime': v('react/jsx-runtime.js'),
    vue: v('vue/vue.js'),
    ...extra,
  };
  for (const s of SVELTE_SPECS) imports[s] = v('svelte/' + s.replace(/\//g, '_') + '.js');
  return `<script type="importmap">${JSON.stringify({ imports })}</script>`;
}

const SVELTE_SPECS = ['svelte', 'svelte/internal/client', 'svelte/internal/disclose-version',
  'svelte/internal/flags/legacy', 'svelte/internal/flags/async', 'svelte/store', 'svelte/transition',
  'svelte/animate', 'svelte/easing', 'svelte/motion', 'svelte/reactivity', 'svelte/events'];

// Injected first into every preview: captures console output and errors, and keeps
// links/forms from navigating the frame away.
const PRELUDE = `<script>(function(){
var rc = window.__rc = { logs: [], errors: [], ready: false };
// Sandboxed localStorage: lesson code must never touch the game's own save.
try { var real = window.localStorage, P = 'rc-sandbox:';
  var fake = { getItem: function(k){ return real.getItem(P + k); }, setItem: function(k, v){ real.setItem(P + k, String(v)); },
    removeItem: function(k){ real.removeItem(P + k); }, clear: function(){ Object.keys(real).forEach(function(k){ if (k.indexOf(P) === 0) real.removeItem(k); }); },
    key: function(i){ return Object.keys(real).filter(function(k){ return k.indexOf(P) === 0; }).map(function(k){ return k.slice(P.length); })[i] || null; } };
  Object.defineProperty(fake, 'length', { get: function(){ return Object.keys(real).filter(function(k){ return k.indexOf(P) === 0; }).length; } });
  Object.defineProperty(window, 'localStorage', { value: fake, configurable: true });
  Object.defineProperty(window, 'sessionStorage', { value: fake, configurable: true });
} catch (e) {}
function fmt(v){ try { if (typeof v === 'string') return v; if (v instanceof Element) return '<' + v.tagName.toLowerCase() + '>'; return JSON.stringify(v); } catch(e) { return String(v); } }
function send(m){ try { parent.postMessage(Object.assign({ __rc: true }, m), '*'); } catch(e){} }
['log','info','warn','error'].forEach(function(l){ var o = console[l]; console[l] = function(){ var t = Array.prototype.map.call(arguments, fmt).join(' '); rc.logs.push(t); send({ type: 'console', level: l, text: t }); o.apply(console, arguments); }; });
function err(msg, file, line){ rc.errors.push(msg); send({ type: 'error', message: msg, file: file || '', line: line || 0 }); }
window.__rcError = err;
addEventListener('error', function(e){ if (e.message) err(e.message, e.filename, e.lineno); }, true);
addEventListener('unhandledrejection', function(e){ err(String(e.reason && e.reason.message || e.reason)); });
document.addEventListener('click', function(e){ var a = e.target && e.target.closest && e.target.closest('a[href]'); if (a) { var h = a.getAttribute('href') || ''; if (h.charAt(0) !== '#') { e.preventDefault(); send({ type: 'nav', href: h }); } } }, true);
document.addEventListener('submit', function(e){ if (!e.defaultPrevented) { e.preventDefault(); send({ type: 'submit' }); } });
})();</script>`;

function blobUrl(code: string, type: string, urls: string[]) {
  const u = URL.createObjectURL(new Blob([code], { type }));
  urls.push(u);
  return u;
}

function lineFromMessage(msg: string): number {
  const m = /\((\d+):(\d+)\)/.exec(msg) || /line (\d+)/i.exec(msg);
  return m ? Number(m[1]) : 0;
}

// Replace relative imports ("./Button.jsx") with "@app/Button.jsx", mapped by the import map.
function rewriteImports(code: string, names: string[]) {
  const resolve = (spec: string) => {
    const base = spec.replace(/^\.\//, '');
    const hit = names.find((n) => n === base || n.replace(/\.(jsx?|tsx?|vue|svelte)$/, '') === base);
    return hit ? '@app/' + hit : spec;
  };
  return code.replace(/(\bfrom\s*|\bimport\s*\(?\s*)(['"])(\.\/[^'"]+)\2/g, (_m, pre, q, spec) => pre + q + resolve(spec) + q);
}

function escapeScript(s: string) {
  return s.replace(/<\/script/gi, '<\\/script');
}

export async function buildPreview(mode: WebMode, files: Record<string, string>): Promise<BuiltPreview> {
  const urls: string[] = [];
  const cleanup = () => urls.forEach((u) => URL.revokeObjectURL(u));
  const base = `<base href="${abs('lesson-assets/')}">`;
  try {
    if (mode === 'html' || mode === 'tailwind') return { ...buildHtml(mode, files, urls, base), cleanup };
    const { modules, css, errors } = await compileModules(mode, files);
    if (errors.length) return { html: errorPage(errors), errors, cleanup };
    const map: Record<string, string> = {};
    for (const [name, code] of Object.entries(modules)) map['@app/' + name] = blobUrl(code, 'text/javascript', urls);
    const entryName = mode === 'react' ? Object.keys(modules).find((n) => /^App\.(jsx|tsx|js)$/.test(n)) : mode === 'vue' ? 'App.vue' : 'App.svelte';
    const rootId = mode === 'react' ? 'root' : 'app';
    const entry = mode === 'react'
      ? `import { createElement } from 'react'; import { flushSync } from 'react-dom'; import { createRoot } from 'react-dom/client'; import App from '@app/${entryName}';
         const root = createRoot(document.getElementById('root'));
         try { flushSync(() => root.render(createElement(App))); } catch (e) { __rcError(e.message); }
         window.__rc.ready = true;`
      : mode === 'vue'
        ? `import { createApp } from 'vue'; import App from '@app/App.vue';
           const app = createApp(App); app.config.errorHandler = (e) => __rcError(e.message); app.config.warnHandler = (m) => console.warn('[Vue] ' + m);
           app.mount('#app'); window.__rc.ready = true;`
        : `import { mount, flushSync } from 'svelte'; import App from '@app/App.svelte';
           try { mount(App, { target: document.getElementById('app') }); flushSync(); } catch (e) { __rcError(e.message); }
           window.__rc.ready = true;`;
    const userCss = Object.entries(files).filter(([n]) => n.endsWith('.css')).map(([, c]) => c).join('\n') + '\n' + css;
    const html = `<!doctype html><html><head><meta charset="utf-8">${base}${PRELUDE}${importMap(map)}
<style>body{font-family:system-ui,sans-serif;margin:12px}</style>
<link rel="stylesheet" href="${blobUrl(userCss, 'text/css', urls)}">
</head><body><div id="${rootId}"></div>
<script type="module">${escapeScript(entry)}</script>
<script type="module">setTimeout(function(){ if (!window.__rc.ready && !window.__rc.errors.length) window.__rcError('The app did not start. Check that your component is exported with "export default".'); }, 4000);</script>
</body></html>`;
    return { html, errors: [], cleanup };
  } catch (e) {
    const errors = [{ file: '', line: 0, message: (e as Error).message }];
    return { html: errorPage(errors), errors, cleanup };
  }
}

function buildHtml(mode: WebMode, files: Record<string, string>, urls: string[], base: string) {
  const htmlName = Object.keys(files).find((n) => n.endsWith('.html')) ?? 'index.html';
  let html = files[htmlName] ?? '';
  // Linked files behave like real external files: only applied if the player links them.
  for (const [name, code] of Object.entries(files)) {
    if (name.endsWith('.css')) {
      const u = blobUrl(code, 'text/css', urls);
      html = html.replace(new RegExp(`(<link\\b[^>]*\\bhref\\s*=\\s*["']?)(?:\\./)?${name.replace('.', '\\.')}(["']?)`, 'gi'), `$1${u}$2`);
    }
    if (name.endsWith('.js')) {
      const u = blobUrl(code + `\n//# sourceURL=${name}`, 'text/javascript', urls);
      html = html.replace(new RegExp(`(<script\\b[^>]*\\bsrc\\s*=\\s*["']?)(?:\\./)?${name.replace('.', '\\.')}(["']?)`, 'gi'), `$1${u}$2`);
    }
  }
  const head = base + PRELUDE + (mode === 'tailwind' ? `<script src="${abs('vendor/tailwind/tailwind.js')}"></script>` : '');
  const ready = `<script>addEventListener('load', function(){ requestAnimationFrame(function(){ requestAnimationFrame(function(){ setTimeout(function(){ window.__rc.ready = true; }, ${mode === 'tailwind' ? 120 : 0}); }); }); });</script>`;
  if (/<head[^>]*>/i.test(html)) html = html.replace(/<head[^>]*>/i, (m) => m + head);
  else if (/<html[^>]*>/i.test(html)) html = html.replace(/<html[^>]*>/i, (m) => m + head);
  else html = head + html;
  html += ready;
  return { html, errors: [] as BuildError[] };
}

async function compileModules(mode: WebMode, files: Record<string, string>) {
  const names = Object.keys(files).filter((n) => /\.(jsx?|tsx?|vue|svelte)$/.test(n));
  const modules: Record<string, string> = {};
  const errors: BuildError[] = [];
  let css = '';
  for (const name of names) {
    const src = files[name];
    try {
      let code: string;
      if (name.endsWith('.vue')) {
        const out = await compileVue(name, src);
        code = out.code; css += out.css;
      } else if (name.endsWith('.svelte')) {
        const { compile } = await import('svelte/compiler');
        const out = compile(src, { filename: name, generate: 'client', css: 'injected', dev: false });
        code = out.js.code;
      } else {
        const transforms: ('jsx' | 'typescript')[] = [];
        if (/\.(jsx|tsx|js)$/.test(name)) transforms.push('jsx');
        if (/\.tsx?$/.test(name)) transforms.push('typescript');
        code = transform(src, { transforms, jsxRuntime: 'automatic', production: true, filePath: name }).code;
      }
      modules[name] = rewriteImports(code, names) + `\n//# sourceURL=${name}`;
    } catch (e) {
      const ex = e as Error & { start?: { line: number }; loc?: { line: number } };
      const msg = ex.message.split('\n')[0];
      errors.push({ file: name, line: ex.start?.line ?? ex.loc?.line ?? lineFromMessage(msg), message: msg.replace(/^.*?:\s*(?=\w)/, (m) => (/^(https?|file):/.test(m) ? '' : m)) });
    }
  }
  void mode;
  return { modules, css, errors };
}

let vueId = 0;
async function compileVue(filename: string, src: string) {
  const sfc = await import('@vue/compiler-sfc/dist/compiler-sfc.esm-browser.js');
  const { descriptor, errors } = sfc.parse(src, { filename });
  if (errors.length) throw Object.assign(new Error(errors[0].message), { loc: (errors[0] as { loc?: { start: { line: number } } }).loc?.start });
  const id = 'rc' + (++vueId).toString(36);
  const scoped = descriptor.styles.some((s) => s.scoped);
  let code = '';
  if (descriptor.script || descriptor.scriptSetup) {
    const script = sfc.compileScript(descriptor, { id, inlineTemplate: true, genDefaultAs: '__sfc__', templateOptions: { compilerOptions: { scopeId: scoped ? `data-v-${id}` : undefined } } });
    code = script.content;
  } else {
    code = 'const __sfc__ = {};\n';
  }
  if (!descriptor.scriptSetup && descriptor.template) {
    const t = sfc.compileTemplate({ source: descriptor.template.content, filename, id, scoped, compilerOptions: { scopeId: scoped ? `data-v-${id}` : undefined } });
    if (t.errors.length) {
      const e0 = t.errors[0] as string | { message: string; loc?: { start: { line: number } } };
      throw Object.assign(new Error(typeof e0 === 'string' ? e0 : e0.message), { loc: typeof e0 === 'string' ? undefined : e0.loc?.start });
    }
    code += '\n' + t.code.replace(/\nexport (function|const) render/, '\n$1 render') + '\n__sfc__.render = render;';
  }
  if (scoped) code += `\n__sfc__.__scopeId = "data-v-${id}";`;
  code += `\n__sfc__.__file = ${JSON.stringify(filename)};\nexport default __sfc__;`;
  let css = '';
  for (const s of descriptor.styles) {
    const out = sfc.compileStyle({ source: s.content, filename, id: `data-v-${id}`, scoped: s.scoped });
    css += out.code + '\n';
  }
  return { code, css };
}

function errorPage(errors: BuildError[]) {
  const esc = (s: string) => s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]!));
  return `<!doctype html><html><body style="font-family:Georgia,serif;background:#2a1d14;color:#f4ead5;padding:16px">
<h3 style="color:#ff9a7a;margin-top:0">The spell could not be compiled</h3>
${errors.map((e) => `<pre style="white-space:pre-wrap;background:#1a120c;padding:10px;border-left:4px solid #c0392b">${esc(e.file)}${e.line ? ' line ' + e.line : ''}\n${esc(e.message)}</pre>`).join('')}
<script>window.__rc = { logs: [], errors: ${JSON.stringify(errors.map((e) => e.message))}, ready: true };</script></body></html>`;
}
