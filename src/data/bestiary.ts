// Source : input/TQ - Bestiaire Data.xlsx, second tableau (version la plus récente, avec le biome plage).
// Valeurs corrigées d'après les fiches visibles dans la vidéo de 2011 (jeu publié) : Verrior, Arak, Termytho,
// Fourchu, Goborc et Gorkone (vie de base et gain de mana).
// armures en % de réduction, speed en "points" (cf. SPEED_UNIT dans engine/config.ts).

export type Biome = 'plain' | 'forest' | 'mountain' | 'swamp' | 'jungle' | 'beach';

export interface BeastDef {
  code: string;
  name: string;
  biomes: Biome[] | 'all';
  boss: boolean;
  speed: number;
  life: number;
  quantite: number;
  physicArmor: number;
  magicArmor: number;
  hitDamage: number;
  manaGain: number;
  lifeUpgrade: number;
  color: string;
  description: string;
}

const b = (
  code: string, name: string, biomes: BeastDef['biomes'], boss: boolean,
  speed: number, life: number, quantite: number, physicArmor: number, magicArmor: number,
  hitDamage: number, manaGain: number, color: string, description = '',
): BeastDef => ({
  code, name, biomes, boss, speed, life, quantite, physicArmor, magicArmor,
  hitDamage, manaGain, lifeUpgrade: 1, color, description,
});

export const BESTIARY: Record<string, BeastDef> = {
  lombric: b('lombric', 'Verrior', ['swamp', 'jungle'], false, 6, 16, 9, 20, 0, 8, 9, '#d98fa0'),
  spider: b('spider', 'Arak', ['forest', 'swamp', 'beach'], false, 9, 8, 10, 0, 20, 7, 8, '#4a3b52'),
  scaroyal: b('scaroyal', 'Scaroyal', ['swamp', 'beach'], false, 2, 72, 2, 40, 0, 36, 34, '#3d6b4f'),
  blob: b('blob', 'Blob', ['swamp', 'jungle'], false, 5, 18, 5, 0, 40, 14, 12, '#6fbf5a'),
  termite: b('termite', 'Termytho', ['forest', 'plain'], false, 7, 13, 10, 20, 0, 7, 8, '#c98a3c'),
  elfe: b('elfe', 'Elfurieux', ['forest', 'beach'], false, 9, 12, 8, 40, 40, 9, 11, '#5fa04e'),
  ours: b('ours', 'Grizzz', ['mountain', 'plain', 'forest'], false, 3, 58, 3, 50, 0, 23, 28, '#7a5232'),
  snake: b('snake', 'Fourchu', ['plain', 'mountain'], false, 6, 22, 8, 0, 0, 9, 10, '#9bb83a'),
  taupe: b('taupe', 'Taupela', ['plain', 'forest'], false, 5, 26, 6, 0, 0, 11, 11, '#6b5a4e'),
  guerrier: b('guerrier', 'Konserve', ['jungle', 'plain'], false, 4, 37, 4, 50, 0, 17, 20, '#9aa3ad'),
  char: b('char', 'Tadbois', ['plain'], false, 2, 80, 2, 60, 0, 33, 40, '#8a6237'),
  brigand: b('brigand', 'Brimoufle', ['forest', 'mountain', 'jungle', 'plain', 'swamp'], false, 7, 17, 8, 30, 30, 9, 11, '#7d3f3f'),
  scarabee: b('scarabee', 'Scarapace', ['swamp', 'jungle', 'mountain'], false, 6, 14, 9, 30, 10, 8, 8, '#2f5d8a'),
  orc: b('orc', 'Goborc', ['jungle', 'mountain'], false, 5, 36, 4, 30, 0, 17, 18, '#5b7a33'),
  geant: b('geant', 'Grhobbit', ['mountain'], false, 3, 54, 3, 30, 0, 23, 25, '#8c7a6b'),
  salamandre: b('salamandre', 'Salézard', ['jungle', 'beach'], false, 7, 22, 8, 20, 40, 8, 13, '#e2712f'),
  crabe: b('crabe', 'Carapince', ['beach'], false, 7, 19, 7, 15, 0, 10, 10, '#e04b3a', 'vitesse variable : 4 < speed < 10'),
  bigorneau: b('bigorneau', 'Bigornot', ['beach'], false, 4, 38, 5, 60, 60, 15, 23, '#9c8bb0', 'à 50% de vie : armure = 0 et vitesse x2'),
  archimage: b('archimage', 'Magogol', 'all', true, 6, 80, 1, 0, 70, 60, 70, '#5a3fa0'),
  ogre: b('ogre', 'Kaprissadeux', 'all', true, 4, 130, 1, 60, 0, 60, 77, '#6e8a4a'),
  guivre: b('guivre', 'Gorkone', 'all', true, 4, 125, 1, 20, 40, 60, 108, '#3f8a7a'),
  beholder: b('beholder', 'Nakainneuil', 'all', true, 4, 100, 1, 30, 30, 30, 67, '#b04a6a'),
  kraken: b('kraken', 'Krakra Ken', 'all', true, 3, 150, 1, 15, 40, 70, 78, '#c0506a'),
};

/** Vie d'un monstre pour une vague de niveau `level` (lifeUpgrade = 1 → linéaire). */
export function beastLife(def: BeastDef, level: number): number {
  return Math.round(def.life * (1 + def.lifeUpgrade * (level - 1)));
}
