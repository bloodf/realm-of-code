// Hooks the translator into Phaser: every Text object translates the string it is given.
import Phaser from 'phaser';
import { tr } from './index';

let done = false;
export function installTextTranslation() {
  if (done) return;
  done = true;
  const proto = Phaser.GameObjects.Text.prototype as unknown as { setText: (v: unknown) => unknown };
  const orig = proto.setText;
  proto.setText = function (this: { style?: { fontFamily?: string } }, v: unknown) {
    // code is drawn in the code font: never translate it
    if (this.style?.fontFamily?.includes('VT323')) return orig.call(this, v);
    if (typeof v === 'string') v = tr(v);
    else if (Array.isArray(v)) v = v.map((x) => (typeof x === 'string' ? tr(x) : x));
    return orig.call(this, v);
  };
}
