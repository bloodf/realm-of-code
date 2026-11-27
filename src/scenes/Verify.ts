// #/dev/verify: the developer content check (a plain page over the game).
import Phaser from 'phaser';
import { runVerify } from '../dev/verify';

let started = false;

export class Verify extends Phaser.Scene {
  constructor() { super('Verify'); }
  create(data: { course?: string }) {
    if (started) return;
    started = true;
    const root = document.createElement('div');
    document.body.appendChild(root);
    runVerify(root, data.course);
  }
}
