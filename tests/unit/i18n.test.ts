// Translations: the catalogue of English strings, the compiled pt/es dictionaries and the
// runtime translator (tr / t / tn / up / untranslated).
import { afterAll, describe, expect, test } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { hashKey } from '../../src/i18n/hash';
import { setLang, getLang, tr, t, tn, up, untranslated, LANGS } from '../../src/i18n';
import pt from '../../src/i18n/gen/pt.json';
import es from '../../src/i18n/gen/es.json';

const ROOT = path.resolve(__dirname, '../..');
const catalogue = new Map<string, string>();
for (const f of fs.readdirSync(path.join(ROOT, 'i18n/en'))) {
  const txt = fs.readFileSync(path.join(ROOT, 'i18n/en', f), 'utf8').replace(/\r\n/g, '\n');
  const re = /^@@ (\S+)[^\n]*\n([\s\S]*?)(?=^@@ |(?![\s\S]))/gm;
  let m: RegExpExecArray | null;
  while ((m = re.exec(txt))) catalogue.set(m[1], m[2].replace(/\n+$/, ''));
}
const holders = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(',');
const spans = (s: string) => [...s.replace(/```[\s\S]*?```/g, '').matchAll(/`[^`\n]+`/g)].map((m) => m[0]).sort().join('\u0000');

afterAll(() => setLang('en'));

describe('dictionaries', () => {
  test('the catalogue has thousands of strings, keyed by the same hash the game uses', () => {
    expect(catalogue.size).toBeGreaterThan(5000);
    // (the catalogue file drops a final newline, which a few code samples have)
    for (const [k, en] of catalogue) expect([hashKey(en), hashKey(en + '\n')], en.slice(0, 50)).toContain(k);
  });
  for (const [lang, dict] of [['pt', pt], ['es', es]] as const) {
    test(`${lang}: at least 85% translated, no stale keys`, () => {
      const keys = Object.keys(dict);
      expect(keys.length / catalogue.size).toBeGreaterThan(0.85);
      for (const k of keys) expect(catalogue.has(k), `${lang} key ${k} is not in the catalogue`).toBe(true);
    });
    test(`${lang}: translations keep the {placeholders} and \`code\` of the English`, () => {
      for (const [k, v] of Object.entries(dict as Record<string, string>)) {
        const en = catalogue.get(k)!;
        expect(holders(v), `${lang} ${k}: ${en.slice(0, 60)}`).toBe(holders(en));
        expect(spans(v), `${lang} ${k}: ${en.slice(0, 60)}`).toBe(spans(en));
      }
    });
  }
});

describe('the translator', () => {
  test('three languages', () => {
    expect(LANGS.map((l) => l.id)).toEqual(['en', 'pt', 'es']);
  });
  test('English is the identity (with placeholders filled)', async () => {
    await setLang('en');
    expect(tr('Settings')).toBe('Settings');
    expect(t('Score {n}', { n: 5 })).toBe('Score 5');
    expect(tn(1, '{n} lesson', '{n} lessons')).toBe('1 lesson');
    expect(tn(3, '{n} lesson', '{n} lessons')).toBe('3 lessons');
  });
  test('Portuguese', async () => {
    await setLang('pt');
    expect(getLang()).toBe('pt');
    expect(tr('Settings')).toBe('Configurações');
    expect(t('Score {n}', { n: 5 })).toBe('Pontos 5');
    expect(tr('Level 3')).toBe('Nível 3');                    // a template found by pattern
    expect(up('Continue')).toBe('CONTINUAR');
    expect(untranslated(() => tr('Settings'))).toBe('Settings');   // code and names stay as they are
    expect(tr('console.log(x)')).toBe('console.log(x)');
  });
  test('Spanish', async () => {
    await setLang('es');
    expect(tr('Settings')).toBe('Ajustes');
    expect(tr('Hello, Serpent')).toBe('Hola, Serpiente');
  });
  test('unknown text falls back to English', async () => {
    await setLang('pt');
    expect(tr('Zorblax the unknown string')).toBe('Zorblax the unknown string');
  });
});
