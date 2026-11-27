// A sprite as an image URL (for DOM things like Blockly block icons).
import { spritePixels, TUNICS, type SpriteName } from '../grid/sprites';

const cache = new Map<string, string>();
export function spriteUrl(name: SpriteName, tunic?: string): string {
  const key = name + ':' + (tunic ?? '');
  let url = cache.get(key);
  if (!url) {
    const c = document.createElement('canvas');
    c.width = 16; c.height = 16;
    c.getContext('2d')!.putImageData(new ImageData(spritePixels(name, tunic ? TUNICS[tunic] : undefined) as Uint8ClampedArray<ArrayBuffer>, 16, 16), 0, 0);
    url = c.toDataURL();
    cache.set(key, url);
  }
  return url;
}
