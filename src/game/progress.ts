// Progression du joueur (équivalent des données serveur de l'époque), sauvegardée en local.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Island, Reward } from '../data/tuttho';
import { key } from '../engine/hex';

/** [doc] [GamePlay] Deck : "tour x 5 en entrant dans l'île". */
export const QTY_PER_SLOT = 5;
/** [reconstitué] Félicia gagne un niveau toutes les 20 tuiles conquises (Equilibrage, solution 2). */
export const TILES_PER_LEVEL = 20;

export interface Progress {
  islandId: string;
  gold: number;
  towers: string[];
  slots: number;
  deck: (string | null)[];
  conquered: string[];
  perfect: string[];
  hero: string;
  etape: number;
  potions: { vie: number; mana: number };
  introSeen: boolean;
}

const STORAGE_KEY = 'towerquest.progress.v1';

export function newProgress(island: Island): Progress {
  const deck: (string | null)[] = Array(island.startSlots).fill(null);
  island.startTowers.forEach((t, i) => (deck[i] = t));
  return {
    islandId: island.id,
    gold: 0,
    towers: [...island.startTowers],
    slots: island.startSlots,
    deck,
    conquered: [key(island.start)],
    perfect: [],
    hero: key(island.start),
    etape: 0,
    potions: { vie: 0, mana: 0 },
    introSeen: false,
  };
}

export function heroLevel(p: Progress): number {
  return 1 + Math.floor((p.conquered.length - 1) / TILES_PER_LEVEL);
}

export function applyReward(p: Progress, r: Reward): Progress {
  switch (r.kind) {
    case 'tower':
      return p.towers.includes(r.code) ? p : { ...p, towers: [...p.towers, r.code] };
    case 'potion':
      return { ...p, potions: { ...p.potions, [r.potion]: p.potions[r.potion] + 1 } };
    case 'slot':
      return { ...p, slots: p.slots + 1, deck: [...p.deck, null] };
    case 'gold':
      return { ...p, gold: p.gold + r.amount };
    case 'end':
      return p;
  }
}

export async function loadProgress(): Promise<Progress | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Progress) : null;
  } catch {
    return null;
  }
}

export async function saveProgress(p: Progress | null) {
  try {
    if (p) await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(p));
    else await AsyncStorage.removeItem(STORAGE_KEY);
  } catch {
    // la sauvegarde est un confort : on continue sans
  }
}
