// Source : input/TQ - Tourelles Data.xlsx (Feuille1), valeurs reprises telles quelles.
// fireRate = tirs par minute, portées en cases (hexagones), cf. README pour les interprétations.

export type TowerType = 'physic' | 'magic' | 'neutral';
export type TowerTarget = 'enemy' | 'tower' | 'none';
export type BulletType = 'distance' | 'zone' | 'distance:zone' | 'none';
export type UpgradeTarget = 'damage' | 'effecttime' | 'range' | 'firerate' | 'chargeTime' | 'none';

export interface TowerDef {
  code: string;
  cardCode: string;
  name: string;
  type: TowerType;
  target: TowerTarget;
  manaCost: number;
  coefManaUpgrade: number;
  targetUpgrade: UpgradeTarget;
  coefTargetUpgrade: number;
  rangeMin: number;
  rangeMax: number;
  fireRate: number;
  dgtMin: number;
  dgtMax: number;
  augmentationParLevelHeros: number;
  bulletType: BulletType;
  bulletSpeed: number;
  bulletRange: number;
  chargeMax: number;
  chargeInit: number;
  chargeTime: number;
  chargeValue: number;
  effectSuccess: number;
  effectValueMin: number;
  effectValueMax: number;
  effectTime: number;
  sprite?: number;
  color: string;
  description: string;
}

const base = {
  coefManaUpgrade: 0.2,
  augmentationParLevelHeros: 0.05,
  chargeMax: 0,
  chargeInit: 0,
  chargeTime: 0,
  chargeValue: 0,
  effectSuccess: 0,
  effectValueMin: 0,
  effectValueMax: 0,
  effectTime: 0,
  bulletSpeed: 0,
  bulletRange: 0,
};

export const TOWERS: Record<string, TowerDef> = {
  balisto: {
    ...base,
    code: 'balisto', cardCode: 'S01C001', name: 'Balisto', type: 'physic', target: 'enemy',
    manaCost: 15, targetUpgrade: 'damage', coefTargetUpgrade: 1.4,
    rangeMin: 1, rangeMax: 2, fireRate: 60, dgtMin: 5, dgtMax: 8,
    bulletType: 'distance', bulletSpeed: 8,
    sprite: require('../../assets/towers/balisto.png'), color: '#c8a26b',
    description: 'Tire des carreaux sur un ennemi unique. Dégâts physiques.',
  },
  hadoken: {
    ...base,
    code: 'hadoken', cardCode: 'S01C002', name: 'Hadoken', type: 'magic', target: 'enemy',
    manaCost: 19, targetUpgrade: 'damage', coefTargetUpgrade: 1.4,
    rangeMin: 1, rangeMax: 2, fireRate: 30, dgtMin: 11, dgtMax: 18,
    bulletType: 'distance', bulletSpeed: 5,
    sprite: require('../../assets/towers/hadoken.png'), color: '#7fd3a8',
    description: 'Boule d\'énergie magique lente mais puissante.',
  },
  biafeen: {
    ...base,
    code: 'biafeen', cardCode: 'S01C003', name: 'Biafeen', type: 'physic', target: 'enemy',
    manaCost: 22, targetUpgrade: 'damage', coefTargetUpgrade: 1.4,
    rangeMin: 1, rangeMax: 1, fireRate: 60, dgtMin: 4, dgtMax: 11,
    bulletType: 'zone',
    sprite: require('../../assets/towers/biafeen.png'), color: '#e0602c',
    description: 'Embrase toutes les cases adjacentes.',
  },
  berta: {
    ...base,
    code: 'berta', cardCode: 'S01C004', name: 'Berta', type: 'physic', target: 'enemy',
    manaCost: 26, targetUpgrade: 'damage', coefTargetUpgrade: 1.4,
    rangeMin: 2, rangeMax: 3, fireRate: 30, dgtMin: 13, dgtMax: 16,
    bulletType: 'distance:zone', bulletSpeed: 6, bulletRange: 1,
    sprite: require('../../assets/towers/berta.png'), color: '#8b8f99',
    description: 'Mortier longue portée : explosion de zone à l\'impact. Ne peut pas tirer au contact.',
  },
  onzerock: {
    ...base,
    code: 'onzerock', cardCode: 'S01C005', name: 'Onzerock', type: 'physic', target: 'none',
    manaCost: 4, coefManaUpgrade: 0, targetUpgrade: 'none', coefTargetUpgrade: 0,
    rangeMin: 0, rangeMax: 0, fireRate: 0, dgtMin: 0, dgtMax: 0,
    bulletType: 'none', color: '#8a6a4a',
    description: 'Un rocher. Aucun intérêt offensif, purement stratégique : il bloque le passage.',
  },
  friskett: {
    ...base,
    code: 'friskett', cardCode: 'S01C006', name: 'Friskett', type: 'magic', target: 'enemy',
    manaCost: 34, targetUpgrade: 'effecttime', coefTargetUpgrade: 1,
    rangeMin: 1, rangeMax: 1, fireRate: 30, dgtMin: 0, dgtMax: 0,
    bulletType: 'zone', effectSuccess: 0.7, effectValueMin: 0.3, effectTime: 1,
    sprite: require('../../assets/towers/friskett.png'), color: '#a8dcf0',
    description: 'Souffle glacé : ralentit les ennemis adjacents.',
  },
  occulus: {
    ...base,
    code: 'occulus', cardCode: 'S01C007', name: 'Occulus', type: 'magic', target: 'tower',
    manaCost: 30, targetUpgrade: 'range', coefTargetUpgrade: 0.3,
    rangeMin: 1, rangeMax: 1, fireRate: 0, dgtMin: 0, dgtMax: 0,
    bulletType: 'zone',
    sprite: require('../../assets/towers/occulus.png'), color: '#9b6bc4',
    description: 'Augmente la portée des tours adjacentes.',
  },
  gonzales: {
    ...base,
    code: 'gonzales', cardCode: 'S01C008', name: 'Gonzales', type: 'physic', target: 'tower',
    manaCost: 30, targetUpgrade: 'firerate', coefTargetUpgrade: 0.2,
    rangeMin: 1, rangeMax: 1, fireRate: 0, dgtMin: 0, dgtMax: 0,
    bulletType: 'zone', color: '#e3c14b',
    description: 'Augmente la cadence de tir des tours adjacentes.',
  },
  raidboule: {
    ...base,
    code: 'raidboule', cardCode: 'S01C009', name: 'Raidboule', type: 'magic', target: 'enemy',
    // [vidéo 2011] coût 15 et portée 1-2 (le tableur indiquait 26 et 2-3).
    manaCost: 15, targetUpgrade: 'damage', coefTargetUpgrade: 1.4,
    rangeMin: 1, rangeMax: 2, fireRate: 40, dgtMin: 8, dgtMax: 13,
    bulletType: 'distance', bulletSpeed: 8,
    sprite: require('../../assets/towers/raidboule.png'), color: '#d8334a',
    description: 'Projectile magique.',
  },
  sulfath: {
    ...base,
    code: 'sulfath', cardCode: 'S01C010', name: 'Sulfath', type: 'physic', target: 'enemy',
    manaCost: 34, targetUpgrade: 'chargeTime', coefTargetUpgrade: 0.05,
    rangeMin: 1, rangeMax: 2, fireRate: 360, dgtMin: 2, dgtMax: 3,
    bulletType: 'distance', bulletSpeed: 10,
    chargeMax: 16, chargeInit: 16, chargeTime: 0.3, chargeValue: 1,
    color: '#6d7a3a',
    description: 'Sulfateuse : rafale de 16 tirs puis rechargement.',
  },
  triphaz: {
    ...base,
    code: 'triphaz', cardCode: 'S01C011', name: 'Triphaz', type: 'neutral', target: 'enemy',
    manaCost: 24, targetUpgrade: 'damage', coefTargetUpgrade: 1.4,
    rangeMin: 1, rangeMax: 1, fireRate: 600, dgtMin: 6, dgtMax: 9,
    bulletType: 'zone', color: '#4b6cd8',
    description: 'Décharge neutre continue sur les cases adjacentes (ignore les armures).',
  },
};

export const MAX_TOWER_LEVEL = 10;

/** Coût pour passer du niveau `level` au niveau `level + 1` (Feuille2 : 20, 24, 28…). */
export function upgradeCost(def: TowerDef, level: number): number {
  return Math.round(def.manaCost * (1 + def.coefManaUpgrade * level));
}

/** Multiplicateur appliqué à la stat ciblée par l'upgrade (Feuille2 : dps 5, 12, 19…). */
export function upgradeMult(def: TowerDef, level: number): number {
  return 1 + def.coefTargetUpgrade * (level - 1);
}
