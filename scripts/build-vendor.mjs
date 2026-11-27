// Builds the framework runtimes that run inside the lesson preview <iframe>.
// Output: public/vendor/** (generated, not committed). Runs before `dev` and `build`.
import { build } from 'esbuild';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'public', 'vendor');
const tmp = path.join(root, 'node_modules', '.vendor-entries');
const require = createRequire(path.join(root, 'package.json'));
const stamp = path.join(out, '.stamp.json');

const versions = {
  react: require('react/package.json').version,
  svelte: require('svelte/package.json').version,
  vue: require('vue/package.json').version,
  tailwind: require('@tailwindcss/browser/package.json').version,
};
// Blockly's icons (zoom, trash can...) are served from our own site, so the game works offline.
const media = path.join(root, 'public', 'blockly-media');
if (!fs.existsSync(media)) fs.cpSync(path.join(root, 'node_modules', 'blockly', 'media'), media, { recursive: true });

// Python (Pyodide) and PHP (php-wasm) run in the browser too: copy only the files we need.
const py = path.join(root, 'public', 'py');
if (!fs.existsSync(path.join(py, 'pyodide.asm.wasm'))) {
  fs.mkdirSync(py, { recursive: true });
  for (const f of ['pyodide.mjs', 'pyodide.asm.js', 'pyodide.asm.wasm', 'python_stdlib.zip', 'pyodide-lock.json']) fs.copyFileSync(path.join(root, 'node_modules', 'pyodide', f), path.join(py, f));
}
const php = path.join(root, 'public', 'php');
const phpSrc = path.join(root, 'node_modules', 'php-wasm');
const phpMain = fs.readFileSync(path.join(phpSrc, 'php8.3-web.mjs'), 'utf8');
const phpWasm = phpMain.match(/[0-9a-f]{40}\.wasm/)[0];
if (!fs.existsSync(path.join(php, phpWasm))) {
  fs.mkdirSync(php, { recursive: true });
  for (const f of fs.readdirSync(phpSrc)) if (f.endsWith('.mjs') && (!/^php\d/.test(f) || f === 'php8.3-web.mjs')) fs.copyFileSync(path.join(phpSrc, f), path.join(php, f));
  fs.copyFileSync(path.join(phpSrc, phpWasm), path.join(php, phpWasm));
}

if (fs.existsSync(stamp) && fs.readFileSync(stamp, 'utf8') === JSON.stringify(versions)) {
  console.log('vendor: up to date');
  process.exit(0);
}
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(tmp, { recursive: true });

// CommonJS packages (React) have no static named exports, so write an entry that lists them.
function cjsEntry(spec, file) {
  const mod = require(spec);
  const names = Object.keys(mod).filter((k) => k !== 'default' && /^[A-Za-z_$][\w$]*$/.test(k));
  const src = `import M from '${spec}';\nexport default M;\nexport const { ${names.join(', ')} } = M;\n`;
  const p = path.join(tmp, file);
  fs.writeFileSync(p, src);
  return p;
}

// React 19: react, react-dom, react-dom/client, react/jsx-runtime share one chunk (one React instance).
process.env.NODE_ENV = 'production';
await build({
  entryPoints: {
    react: cjsEntry('react', 'react.js'),
    'react-dom': cjsEntry('react-dom', 'react-dom.js'),
    'react-dom-client': cjsEntry('react-dom/client', 'react-dom-client.js'),
    'jsx-runtime': cjsEntry('react/jsx-runtime', 'jsx-runtime.js'),
  },
  bundle: true, splitting: true, format: 'esm', minify: true, outdir: path.join(out, 'react'),
  define: { 'process.env.NODE_ENV': '"production"' }, logLevel: 'warning',
});

// Svelte 5 (ESM, browser condition). Every specifier the compiler can emit gets its own entry.
const svelteSpecs = ['svelte', 'svelte/internal/client', 'svelte/internal/disclose-version',
  'svelte/internal/flags/legacy', 'svelte/internal/flags/async', 'svelte/store', 'svelte/transition',
  'svelte/animate', 'svelte/easing', 'svelte/motion', 'svelte/reactivity', 'svelte/events'];
const svelteEntries = {};
for (const s of svelteSpecs) {
  const name = s.replace(/\//g, '_');
  const p = path.join(tmp, `svelte-${name}.js`);
  fs.writeFileSync(p, `export * from '${s}';\n`);
  svelteEntries[name] = p;
}
await build({
  entryPoints: svelteEntries, bundle: true, splitting: true, format: 'esm', minify: true,
  platform: 'browser', conditions: ['browser', 'production'], outdir: path.join(out, 'svelte'),
  define: { 'process.env.NODE_ENV': '"production"' }, logLevel: 'warning',
});
fs.writeFileSync(path.join(out, 'svelte', 'specs.json'), JSON.stringify(svelteSpecs));

// Vue 3 full browser build (includes the template compiler) and Tailwind v4 browser build.
fs.mkdirSync(path.join(out, 'vue'), { recursive: true });
fs.copyFileSync(path.join(root, 'node_modules/vue/dist/vue.esm-browser.prod.js'), path.join(out, 'vue', 'vue.js'));
fs.mkdirSync(path.join(out, 'tailwind'), { recursive: true });
fs.copyFileSync(path.join(root, 'node_modules/@tailwindcss/browser/dist/index.global.js'), path.join(out, 'tailwind', 'tailwind.js'));

fs.writeFileSync(stamp, JSON.stringify(versions));
console.log('vendor: built', versions);
