// Animation presets (sprite frame names) shared by every scene.
export const ANIMS = {
  heroIdle: (n: string) => [n, n, n, `${n}@bob`],
  heroWalk: (n: string) => [`${n}@walk1`, n, `${n}@walk2`, n],
  // Lumi the fairy, the helper
  fairy: ['fairy', 'fairy@wings', 'fairy', 'fairy@wings', 'fairy@bob', 'fairy@wings', 'fairy@blink', 'fairy@wings'],
  fairyCheer: ['fairyCheer', 'fairy@wings', 'fairyCheer@bob', 'fairy@wings'],
  fairySad: ['fairySad', 'fairySad', 'fairySad', 'fairySad@blink'],
  pet: (n: string) => [n, n, `${n}@bob`, n, n, `${n}@blink`],
  mob: (n: string) => [n, `${n}@bob`],
  npcIdle: (id: string) => [`npc-${id}`, `npc-${id}`, `npc-${id}`, `npc-${id}@blink`, `npc-${id}`, `npc-${id}@bob`],
  npcTalk: (id: string) => [`npc-${id}@talk`, `npc-${id}`],
  torch: ['torch1', 'torch2'],
  torchItem: ['torchItem', 'torchItem2'],
  bulb: ['bulb', 'bulb', 'bulbLit', 'bulbLit'],
  fire: ['fire1', 'fire2'],
  bird: ['bird1', 'bird2'],
  goblin: ['goblin', 'goblin', 'goblin@bob', 'goblin@bob'],
  chest: ['chest', 'chestOpen'],
};
