// Power-ups the player earns in minigames (or buys from the merchant) and spends in lessons.
export type ItemId = 'bulb' | 'torch' | 'potion';

export interface ItemDef {
  id: ItemId;
  name: string;
  sprite: string;
  price: number;        // gold at the merchant
  short: string;        // what it does, in a few words
  desc: string;
}

export const ITEMS: ItemDef[] = [
  { id: 'bulb', name: 'Lightbulb', sprite: 'bulb', price: 15, short: 'A hint',
    desc: 'Lights up a clue: removes wrong answers, places a piece for you, or links one pair. In minigames it reveals an answer.' },
  { id: 'torch', name: 'Torch', sprite: 'torchItem', price: 25, short: 'A second chance',
    desc: 'After a wrong answer, burn a torch to try again. No heart lost. In minigames it adds time.' },
  { id: 'potion', name: 'Potion', sprite: 'potion', price: 40, short: '+1 heart',
    desc: 'Drink it to get one heart back, even in the middle of a lesson.' },
];

export const ITEM_BY_ID = Object.fromEntries(ITEMS.map((i) => [i.id, i])) as Record<ItemId, ItemDef>;

export type Inventory = Record<ItemId, number>;
export const STARTER_ITEMS: Inventory = { bulb: 3, torch: 1, potion: 1 };

/** Items given for each new star in a minigame stop (stars 1, 2 and 3). */
export const STAR_ITEMS: Partial<Inventory>[] = [{ bulb: 1 }, { torch: 1 }, { bulb: 1, potion: 1 }];

export function starsFor(score: number, max: number) {
  if (max <= 0) return 0;
  const r = score / max;
  return r >= 0.9 ? 3 : r >= 0.7 ? 2 : r >= 0.4 ? 1 : 0;
}
