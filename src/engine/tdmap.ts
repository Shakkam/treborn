// Génération d'une carte de TD (tdMap) : portage fidèle de world/MapGenerator.as (Bernard, TDRPG-Map.swf).
// La carte part pleine (1), des chemins (0) y sont creusés depuis les bords jusqu'à un point central,
// puis une partie des cases pleines est convertie en amas d'un 2e et d'un 3e type de décor.
// Coordonnées « doublées » de l'original : colonne x, ligne y = 2 * rangée + x % 2.
// Seul Math.random est remplacé par le RNG seedé ; les tableaux JS se comportent comme ceux d'AS3
// (cases creuses, indices négatifs, length qui s'allonge), on garde donc le code tel quel, quirks compris.

import type { Biome } from '../data/bestiary';
import { Hex, distance, key, neighbors, offsetToAxial } from './hex';
import { Rng, makeRng } from './rng';

export type Obstacle = 'hill' | 'forest' | 'mountain' | 'water' | null;

export interface Cell {
  hex: Hex;
  obstacle: Obstacle;
}

export interface TdMap {
  cols: number;
  rows: number;
  biome: Biome;
  cells: Map<string, Cell>;
  spawns: Hex[];
}

// CreateMap.as : m_lg = 17, m_ht = 15.
export const TD_COLS = 17;
export const TD_ROWS = 15;

// L'original ne connaît que trois biomes (BiomeType) ; les autres biomes d'îles s'y ramènent.
const MAP_BIOME: Record<Biome, 'plain' | 'forest' | 'mountain'> = {
  plain: 'plain', forest: 'forest', jungle: 'forest', swamp: 'forest', mountain: 'mountain', beach: 'plain',
};

// TileType.getBiome : décor associé aux valeurs 1, 2 et 3.
const TILE_TYPES: Record<'plain' | 'forest' | 'mountain', Obstacle[]> = {
  forest: ['forest', 'hill', 'water'],
  mountain: ['mountain', 'forest', 'water'],
  plain: ['hill', 'water', 'forest'],
};

type Tab = number[][];
type Pt = [number, number];

export function generateTdMap(seed: number, biome: Biome): TdMap {
  const rng = makeRng(seed);
  const { tab, spawns: raw } = create(rng, TD_COLS, TD_ROWS);
  generateBiome(rng, tab);

  // tileMap : une tuile pour chaque valeur >= 0 ; 0 = chemin, n > 0 = décor n.
  const types = TILE_TYPES[MAP_BIOME[biome]];
  const cells = new Map<string, Cell>();
  for (let j = 0; j < TD_ROWS; j++) {
    for (let i = 0; i < TD_COLS; i++) {
      const v = tab[i][j * 2 + (i % 2)];
      if (!(v >= 0)) continue;
      const hex = offsetToAxial(i, j);
      cells.set(key(hex), { hex, obstacle: v > 0 ? types[v - 1] : null });
    }
  }

  // [reconstitué] Les points de bord d'où partent les chemins servent de points d'apparition.
  // correctingBorders referme souvent la case de bord elle-même et peut isoler de petites poches :
  // on prend la case la plus proche dans le réseau principal (tous les chemins y convergent).
  const network = largestComponent(cells);
  const spawns: Hex[] = [];
  for (const [x, y] of raw) {
    const edge = offsetToAxial(x, (y - (x % 2)) / 2);
    let best: Hex | null = null;
    for (const h of network) if (!best || distance(h, edge) < distance(best, edge)) best = h;
    if (best && !spawns.some((s) => key(s) === key(best))) spawns.push(best);
  }
  return { cols: TD_COLS, rows: TD_ROWS, biome, cells, spawns };
}

function largestComponent(cells: Map<string, Cell>): Hex[] {
  const seen = new Set<string>();
  let best: Hex[] = [];
  for (const start of cells.values()) {
    if (start.obstacle || seen.has(key(start.hex))) continue;
    const comp = [start.hex];
    seen.add(key(start.hex));
    for (let i = 0; i < comp.length; i++) {
      for (const n of neighbors(comp[i])) {
        const c = cells.get(key(n));
        if (c && !c.obstacle && !seen.has(key(n))) {
          seen.add(key(n));
          comp.push(n);
        }
      }
    }
    if (comp.length > best.length) best = comp;
  }
  return best;
}

// ------------------------------------------------------------------ MapGenerator.as

function create(rng: Rng, long: number, larg: number): { tab: Tab; spawns: Pt[] } {
  const tab = initMap(long, larg);
  const rnd = Math.floor(rng() * 3) + 2;
  const spawns = generateWays(rng, tab, rnd);
  correctingBorders(tab);
  return { tab, spawns };
}

function initMap(long: number, larg: number): Tab {
  const tab: Tab = [];
  for (let i = 0; i < long; i++) {
    tab[i] = [];
    for (let j = 0; j < larg - (i % 2); j++) tab[i][j * 2 + (i % 2)] = 1;
  }
  return tab;
}

function randomInnerPoint(rng: Rng, tab: Tab): Pt {
  const x = Math.floor(rng() * (tab.length - 4)) + 2;
  return [x, Math.floor((rng() * (tab[x].length - 8)) / 2) * 2 + 4 + (x % 2)];
}

/** Creuse `rnd` chemins ; renvoie leurs points de départ sur les bords (non conservés par l'original). */
function generateWays(rng: Rng, tab: Tab, rnd: number): Pt[] {
  const edges: Pt[] = [];
  const center = randomInnerPoint(rng, tab);
  let n = rnd;
  while (n-- > 0) {
    const list: Pt[] = [];
    const edge = defineEdgePoint(rng, tab, Math.floor(rng() * 4) + 1);
    list.push(edge);
    edges.push(edge);
    const steps = Math.floor(rng() * 3) + 6 - rnd;
    for (let i = 0; i < steps; i++) list.push(randomInnerPoint(rng, tab));
    list.push(center);

    let a = list.shift()!;
    while (list.length > 0) {
      const b = list.shift()!;
      let dx = b[0] - a[0];
      let dy = b[1] - (a[1] + (dx % 2));
      tab[b[0]][b[1]] = 0;
      while (dx !== 0 || dy !== 0) {
        const r = Math.abs(dx) > Math.abs(dy) ? Math.floor(rng() * 3) : Math.floor(rng() * 6);
        if (dx !== 0 && r < 2) {
          if (dx < 0) dx++;
          else if (dx > 0) dx--;
        } else if (dy < 0) dy += 2;
        else if (dy > 0) dy -= 2;
        tab[a[0] + dx][a[1] + dy + (dx % 2)] = 0;
      }
      a = b;
    }
  }
  return edges;
}

function correctingBorders(tab: Tab): void {
  const last = tab.length - 1;
  tab[0][0] = 1;
  tab[0][tab[0].length - 1] = 1;
  tab[last][0] = 1;
  tab[last][tab[0].length - 1] = 1;

  let len = tab[0].length;
  for (let y = 2; y < len - 1; y += 2) {
    if (tab[1][y - 1] > 0 && tab[1][y + 1] > 0) tab[0][y] = 1;
  }
  len = tab[last].length;
  for (let y = 2; y < len - 1; y += 2) {
    if (tab[last - 1][y - 1] > 0 && tab[last - 1][y + 1] > 0) tab[last][y] = 1;
  }
  len = tab.length;
  for (let x = 2; x < len - 1; x += 2) {
    if (tab[x][2] > 0 || tab[x - 1][1] === 0 || tab[x + 1][1] === 0) tab[x][0] = 1;
    const l = tab[x].length;
    if (tab[x][l - 3] > 0 || tab[x - 1][l - 2] === 0 || tab[x + 1][l - 2] === 0) tab[x][l - 1] = 1;
  }
  for (let x = 2; x < len - 2; x += 2) {
    if (tab[x][4] > 0 && tab[x - 1][3] > 0 && tab[x + 1][3] > 0) tab[x][2] = 1;
    const l = tab[x].length;
    if (tab[x][l - 5] > 0 && tab[x - 1][l - 4] > 0 && tab[x + 1][l - 4] > 0) tab[x][l - 3] = 1;
  }
  for (let x = 1; x < len - 1; x += 2) {
    if (tab[x][3] > 0 && tab[x - 1][2] > 0 && tab[x + 1][2] > 0) tab[x][1] = 1;
    const l = tab[x].length;
    if (tab[x][l - 3] > 0 && tab[x - 1][l - 2] > 0 && tab[x + 1][l - 2] > 0) tab[x][l - 1] = 1;
  }
}

function defineEdgePoint(rng: Rng, tab: Tab, edge: number): Pt {
  const p: Pt = [0, 0];
  switch (edge) {
    case 1:
      p[0] = 0;
      p[1] = Math.floor((rng() * tab[p[0]].length) / 2) * 2 + (p[0] % 2);
      break;
    case 2:
      p[0] = tab.length - 1;
      p[1] = Math.floor((rng() * tab[p[0]].length) / 2) * 2 + (p[0] % 2);
      break;
    case 3:
      p[0] = Math.floor(rng() * tab.length);
      p[1] = 0 + (p[0] % 2);
      break;
    case 4:
      p[0] = Math.floor(rng() * tab.length);
      p[1] = tab[p[0]].length - 1;
      break;
  }
  return p;
}

/** Convertit des cases pleines en amas de type 2 (20 % des cases), puis de type 3 (10 % du reste). */
function generateBiome(rng: Rng, tab: Tab): void {
  const height = tab[0].length;
  const walls: Pt[] = [];
  for (let x = 0; x < tab.length; x++) {
    for (let y = 0; y < height; y++) if (tab[x][y] > 0) walls.push([x, y]);
  }
  grow(rng, tab, walls, 0.8, 2, () => Math.ceil(rng() * 4) + 1);
  grow(rng, tab, walls, 0.9, 3, () => Math.floor(rng() * 3) + 1);
}

function grow(rng: Rng, tab: Tab, walls: Pt[], keep: number, value: number, size: () => number): void {
  const target = walls.length * keep;
  while (walls.length > target) {
    const i = Math.floor(rng() * walls.length);
    let c = walls[i];
    walls.splice(i, 1);
    tab[c[0]][c[1]] = value;
    let n = size();
    // Comme dans l'original, la liste de voisins n'est pas vidée entre deux pas (indices parfois périmés).
    const near: [Pt, number][] = [];
    while (n-- > 0) {
      for (let k = 0; k < walls.length; k++) {
        const w = walls[k];
        if (
          (c[0] === w[0] && c[1] - 2 === w[1]) ||
          (c[0] === w[0] && c[1] + 2 === w[1]) ||
          (c[0] + 1 === w[0] && c[1] - 1 === w[1]) ||
          (c[0] + 1 === w[0] && c[1] + 1 === w[1]) ||
          (c[0] - 1 === w[0] && c[1] - 1 === w[1]) ||
          (c[0] - 1 === w[0] && c[1] + 1 === w[1])
        ) near.push([w, k]);
      }
      if (near.length === 0) break;
      const j = Math.floor(rng() * near.length);
      c = near[j][0];
      walls.splice(near[j][1], 1);
      near.splice(j, 1);
      tab[c[0]][c[1]] = value;
    }
  }
}
