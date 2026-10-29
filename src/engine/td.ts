// Moteur d'une partie de tower defense (tdMap). Logique pure, sans rendu :
// l'écran appelle step(state, dt) à chaque frame puis redessine l'état.

import { BESTIARY, BeastDef, Biome, beastLife } from '../data/bestiary';
import { MAX_TOWER_LEVEL, TOWERS, TowerDef, upgradeCost, upgradeMult } from '../data/towers';
import {
  GOLD_PER_WIN, HERO_LIFE, HERO_MIN_SPAWN_DIST, NEXT_WAVE_DELAY, OCCULUS_RANGE_BONUS,
  GOLD_PERFECT_BONUS, MAX_MANA, MAX_WAVE_LEVEL, POTION_VALUE, SPAWN_INTERVAL, SPEED_UNIT, START_MANA,
  WAVE_LEVEL_STEP,
} from './config';
import { Hex, distance, fromPixel, key, neighbors, toPixel } from './hex';
import { Rng, makeRng, pick } from './rng';
import { TdMap, generateTdMap } from './tdmap';

export interface DeckSlot {
  code: string;
  qty: number;
}

export interface TdConfig {
  seed: number;
  biome: Biome;
  difficulty: number;
  nbVagues: number;
  bestiaire: string[];
  boss?: string;
  deck: DeckSlot[];
  heroLevel: number;
  potions: { vie: number; mana: number };
}

export interface Tower {
  id: number;
  code: string;
  hex: Hex;
  level: number;
  cooldown: number;
  charge: number;
  reload: number;
  rangeBonus: number;
  fireRateBonus: number;
  flash: number;
}

export interface Enemy {
  id: number;
  code: string;
  level: number;
  x: number;
  y: number;
  next: Hex;
  life: number;
  maxLife: number;
  speed: number;
  slowT: number;
  slow: number;
  enraged: boolean;
  converted: number; // > 0 : purifié, s'enfuit en blanchissant
  dirX: number;
}

export interface Bullet {
  id: number;
  x: number;
  y: number;
  targetId: number;
  tx: number;
  ty: number;
  speed: number;
  damage: number;
  dmgType: TowerDef['type'];
  splash: number;
  color: string;
}

export interface Fx {
  kind: 'ring' | 'text' | 'burst';
  x: number;
  y: number;
  t: number;
  dur: number;
  color: string;
  radius?: number;
  text?: string;
}

export interface Wave {
  code: string;
  count: number;
  level: number;
  boss: boolean;
}

export type Phase = 'hero' | 'setup' | 'running' | 'won' | 'lost';

export interface TdState {
  config: TdConfig;
  map: TdMap;
  rng: Rng;
  phase: Phase;
  time: number;
  mana: number;
  life: number;
  maxLife: number;
  hero: Hex | null;
  towers: Map<string, Tower>;
  deckLeft: number[];
  potions: { vie: number; mana: number };
  potionsUsed: { vie: number; mana: number };
  enemies: Enemy[];
  bullets: Bullet[];
  fx: Fx[];
  waves: Wave[];
  waveIndex: number;
  queue: { code: string; level: number; spawn: number }[];
  spawnTimer: number;
  nextWaveTimer: number;
  dist: Map<string, number>;
  perfect: boolean;
  kills: number;
  gold: number;
  nextId: number;
}

export function createTd(config: TdConfig): TdState {
  const rng = makeRng(config.seed);
  const map = generateTdMap(config.seed, config.biome);
  const waves: Wave[] = [];
  for (let i = 0; i < config.nbVagues; i++) {
    const level = Math.min(MAX_WAVE_LEVEL, config.difficulty + WAVE_LEVEL_STEP * i);
    const last = i === config.nbVagues - 1;
    if (last && config.boss) {
      waves.push({ code: config.boss, count: 1, level, boss: true });
    } else {
      const code = pick(rng, config.bestiaire);
      waves.push({ code, count: BESTIARY[code].quantite, level, boss: false });
    }
  }
  return {
    config, map, rng, phase: 'hero', time: 0,
    mana: START_MANA, life: HERO_LIFE, maxLife: HERO_LIFE, hero: null,
    towers: new Map(), deckLeft: config.deck.map((s) => s.qty),
    potions: { ...config.potions }, potionsUsed: { vie: 0, mana: 0 },
    enemies: [], bullets: [], fx: [], waves, waveIndex: 0, queue: [],
    spawnTimer: 0, nextWaveTimer: 0, dist: new Map(),
    perfect: true, kills: 0, gold: 0, nextId: 1,
  };
}

// ---------------------------------------------------------------- terrain

export function isPassable(s: TdState, h: Hex): boolean {
  const c = s.map.cells.get(key(h));
  return !!c && !c.obstacle && !s.towers.has(key(h));
}

function computeDist(s: TdState, blocked?: string): Map<string, number> {
  const dist = new Map<string, number>();
  if (!s.hero) return dist;
  dist.set(key(s.hero), 0);
  const queue = [s.hero];
  while (queue.length) {
    const h = queue.shift()!;
    const d = dist.get(key(h))!;
    for (const n of neighbors(h)) {
      const k = key(n);
      if (dist.has(k) || k === blocked || !isPassable(s, n)) continue;
      dist.set(k, d + 1);
      queue.push(n);
    }
  }
  return dist;
}

export function canPlaceHero(s: TdState, h: Hex): boolean {
  const { cells, minDist } = heroZone(s.map);
  if (!isPassable(s, h) || !cells.has(key(h))) return false;
  return spawnDist(s.map, h) >= minDist;
}

const spawnDist = (map: TdMap, h: Hex) => Math.min(...map.spawns.map((sp) => distance(sp, h)));

// Cases libres reliées aux points d'apparition (les cartes à couloirs ont des poches isolées), et
// distance minimale aux points d'apparition, réduite sur les rares cartes trop petites pour HERO_MIN_SPAWN_DIST.
const zoneCache = new WeakMap<TdMap, { cells: Set<string>; minDist: number }>();
function heroZone(map: TdMap): { cells: Set<string>; minDist: number } {
  const cached = zoneCache.get(map);
  if (cached) return cached;
  const seen = new Set(map.spawns.map(key));
  const queue = [...map.spawns];
  while (queue.length) {
    const h = queue.shift()!;
    for (const n of neighbors(h)) {
      const c = map.cells.get(key(n));
      if (c && !c.obstacle && !seen.has(key(n))) {
        seen.add(key(n));
        queue.push(n);
      }
    }
  }
  let best = 0;
  for (const k of seen) best = Math.max(best, spawnDist(map, map.cells.get(k)!.hex));
  const zone = { cells: seen, minDist: Math.min(HERO_MIN_SPAWN_DIST, best) };
  zoneCache.set(map, zone);
  return zone;
}

export function placeHero(s: TdState, h: Hex): boolean {
  if (s.phase !== 'hero' || !canPlaceHero(s, h)) return false;
  s.hero = h;
  s.dist = computeDist(s);
  if (s.map.spawns.some((sp) => !s.dist.has(key(sp)))) {
    s.hero = null;
    return false;
  }
  s.phase = 'setup';
  return true;
}

// ---------------------------------------------------------------- tours

export type PlaceResult = 'placed' | 'upgraded' | 'mana' | 'stock' | 'blocked' | 'occupied' | 'max' | 'invalid';

export function placeCost(s: TdState, slot: number, h: Hex): number {
  const def = TOWERS[s.config.deck[slot].code];
  const existing = s.towers.get(key(h));
  return existing ? upgradeCost(def, existing.level) : def.manaCost;
}

export function tryPlace(s: TdState, slot: number, h: Hex): PlaceResult {
  if (s.phase !== 'setup' && s.phase !== 'running') return 'invalid';
  const code = s.config.deck[slot].code;
  const def = TOWERS[code];
  const k = key(h);
  const existing = s.towers.get(k);
  if (s.deckLeft[slot] <= 0) return 'stock';

  if (existing) {
    // Invoquer un esprit sur un esprit de même type augmente son niveau.
    if (existing.code !== code || def.coefManaUpgrade === 0) return 'occupied';
    if (existing.level >= MAX_TOWER_LEVEL) return 'max';
    const cost = upgradeCost(def, existing.level);
    if (s.mana < cost) return 'mana';
    s.mana -= cost;
    s.deckLeft[slot]--;
    existing.level++;
    existing.flash = 0.5;
    refreshBoosts(s);
    return 'upgraded';
  }

  // [vidéo 2011] Les tours s'invoquent sur le terrain praticable et les monstres les contournent.
  const cell = s.map.cells.get(k);
  if (!cell || cell.obstacle || (s.hero && key(s.hero) === k)) return 'invalid';
  if (s.map.spawns.some((sp) => key(sp) === k)) return 'invalid';
  if (s.mana < def.manaCost) return 'mana';
  if (s.enemies.some((e) => !e.converted && (key(e.next) === k || key(fromPixel(e.x, e.y)) === k))) return 'occupied';

  const dist = computeDist(s, k);
  if (s.map.spawns.some((sp) => !dist.has(key(sp)))) return 'blocked';
  if (s.enemies.some((e) => !e.converted && !dist.has(key(e.next)))) return 'blocked';

  s.mana -= def.manaCost;
  s.deckLeft[slot]--;
  s.towers.set(k, {
    id: s.nextId++, code, hex: h, level: 1, cooldown: 0, charge: def.chargeInit, reload: 0,
    rangeBonus: 0, fireRateBonus: 0, flash: 0.5,
  });
  s.dist = computeDist(s);
  refreshBoosts(s);
  return 'placed';
}

function refreshBoosts(s: TdState) {
  for (const t of s.towers.values()) {
    t.rangeBonus = 0;
    t.fireRateBonus = 0;
  }
  for (const b of s.towers.values()) {
    const def = TOWERS[b.code];
    if (def.target !== 'tower') continue;
    for (const t of s.towers.values()) {
      if (t === b || TOWERS[t.code].target !== 'enemy' || distance(t.hex, b.hex) > def.rangeMax) continue;
      if (def.targetUpgrade === 'range') t.rangeBonus += OCCULUS_RANGE_BONUS * upgradeMult(def, b.level);
      if (def.targetUpgrade === 'firerate') t.fireRateBonus += def.coefTargetUpgrade * b.level;
    }
  }
}

export function towerRange(t: Tower): { min: number; max: number } {
  const def = TOWERS[t.code];
  return { min: def.rangeMin, max: Math.floor(def.rangeMax + t.rangeBonus) };
}

// ---------------------------------------------------------------- vagues

export function start(s: TdState) {
  if (s.phase !== 'setup') return;
  s.phase = 'running';
  launchWave(s);
}

export function callNextWave(s: TdState) {
  if (s.phase === 'setup') return start(s);
  if (s.phase !== 'running' || s.waveIndex >= s.waves.length) return;
  launchWave(s);
}

function launchWave(s: TdState) {
  const w = s.waves[s.waveIndex++];
  const n = s.map.spawns.length;
  for (let i = 0; i < w.count; i++) s.queue.push({ code: w.code, level: w.level, spawn: i % n });
  s.nextWaveTimer = Infinity;
}

export function currentWaveNumber(s: TdState): number {
  return s.waveIndex;
}

function spawnEnemy(s: TdState, code: string, level: number, spawn: number) {
  const def = BESTIARY[code];
  const h = s.map.spawns[spawn];
  const p = toPixel(h);
  const life = beastLife(def, level);
  const speed = code === 'crabe' ? 4 + s.rng() * 6 : def.speed;
  s.enemies.push({
    id: s.nextId++, code, level, x: p.x, y: p.y, next: h, life, maxLife: life,
    speed, slowT: 0, slow: 0, enraged: false, converted: 0, dirX: 1,
  });
}

// ---------------------------------------------------------------- potions

/** Le joueur abandonne la partie (menu Options). */
export function abandon(s: TdState) {
  if (s.phase !== 'won') s.phase = 'lost';
}

export function drinkPotion(s: TdState, kind: 'vie' | 'mana') {
  if (s.potions[kind] <= 0 || (s.phase !== 'running' && s.phase !== 'setup')) return;
  s.potions[kind]--;
  s.potionsUsed[kind]++;
  if (kind === 'vie') s.life = Math.min(s.maxLife, s.life + POTION_VALUE);
  else s.mana = Math.min(MAX_MANA, s.mana + POTION_VALUE);
  if (s.hero) {
    const p = toPixel(s.hero);
    s.fx.push({ kind: 'text', x: p.x, y: p.y - 1, t: 0, dur: 1.2, color: kind === 'vie' ? '#5ee07a' : '#5ab4ff', text: `+${POTION_VALUE}` });
  }
}

// ---------------------------------------------------------------- boucle

export function step(s: TdState, dt: number) {
  for (const f of s.fx) f.t += dt;
  s.fx = s.fx.filter((f) => f.t < f.dur);
  for (const t of s.towers.values()) t.flash = Math.max(0, t.flash - dt);
  if (s.phase !== 'running') return;
  s.time += dt;

  // apparition des monstres
  if (s.queue.length) {
    s.spawnTimer -= dt;
    if (s.spawnTimer <= 0) {
      const q = s.queue.shift()!;
      spawnEnemy(s, q.code, q.level, q.spawn);
      s.spawnTimer = SPAWN_INTERVAL;
      if (!s.queue.length) s.nextWaveTimer = NEXT_WAVE_DELAY;
    }
  } else if (s.waveIndex < s.waves.length) {
    if (!s.enemies.some((e) => !e.converted)) s.nextWaveTimer = Math.min(s.nextWaveTimer, 3);
    s.nextWaveTimer -= dt;
    if (s.nextWaveTimer <= 0) launchWave(s);
  }

  moveEnemies(s, dt);
  fireTowers(s, dt);
  moveBullets(s, dt);

  s.enemies = s.enemies.filter((e) => e.converted === 0 || e.converted < 1);
  for (const e of s.enemies) if (e.converted) e.converted += dt;

  if (s.life <= 0) {
    s.life = 0;
    s.phase = 'lost';
  } else if (s.waveIndex >= s.waves.length && !s.queue.length && !s.enemies.some((e) => !e.converted)) {
    s.phase = 'won';
    s.gold = GOLD_PER_WIN + (s.perfect ? GOLD_PERFECT_BONUS : 0);
  }
}

function moveEnemies(s: TdState, dt: number) {
  const heroK = s.hero ? key(s.hero) : '';
  for (const e of s.enemies) {
    if (e.converted) {
      e.x -= e.dirX * dt * 2.5; // s'enfuit en courant
      continue;
    }
    const def = BESTIARY[e.code];
    if (e.slowT > 0) e.slowT -= dt;
    let speed = e.speed * SPEED_UNIT * (e.slowT > 0 ? 1 - e.slow : 1);
    if (e.enraged) speed *= 2;
    let budget = speed * dt;
    while (budget > 0) {
      const target = toPixel(e.next);
      const dx = target.x - e.x;
      const dy = target.y - e.y;
      const d = Math.hypot(dx, dy);
      if (d > budget) {
        e.x += (dx / d) * budget;
        e.y += (dy / d) * budget;
        if (Math.abs(dx) > 0.01) e.dirX = Math.sign(dx);
        budget = 0;
      } else {
        e.x = target.x;
        e.y = target.y;
        budget -= d;
        if (key(e.next) === heroK) {
          hitHero(s, e, def);
          break;
        }
        e.next = nextStep(s, e.next);
      }
    }
  }
}

function nextStep(s: TdState, from: Hex): Hex {
  const here = s.dist.get(key(from)) ?? Infinity;
  let best = from;
  let bestD = here;
  for (const n of neighbors(from)) {
    const d = s.dist.get(key(n));
    if (d !== undefined && d < bestD) {
      bestD = d;
      best = n;
    }
  }
  return best === from && s.hero ? s.hero : best;
}

function hitHero(s: TdState, e: Enemy, def: BeastDef) {
  // Le bouclier de Gaïa absorbe l'énergie négative : le monstre est purifié, Félicia s'affaiblit.
  s.life -= def.hitDamage;
  s.perfect = false;
  e.converted = 0.001;
  s.fx.push({ kind: 'text', x: e.x, y: e.y - 0.8, t: 0, dur: 1, color: '#ff5a5a', text: `-${def.hitDamage}` });
  s.fx.push({ kind: 'ring', x: e.x, y: e.y, t: 0, dur: 0.4, color: '#ff8080', radius: 1.2 });
}

function enemyHex(e: Enemy): Hex {
  return fromPixel(e.x, e.y);
}

function rollDamage(s: TdState, def: TowerDef, t: Tower): number {
  let dmg = def.dgtMin + s.rng() * (def.dgtMax - def.dgtMin);
  if (def.targetUpgrade === 'damage') dmg *= upgradeMult(def, t.level);
  return dmg * (1 + def.augmentationParLevelHeros * (s.config.heroLevel - 1));
}

function fireTowers(s: TdState, dt: number) {
  for (const t of s.towers.values()) {
    const def = TOWERS[t.code];
    if (def.target !== 'enemy' || def.fireRate <= 0) continue;

    if (def.chargeMax > 0 && t.charge <= 0) {
      t.reload += dt;
      const per = def.chargeTime * Math.max(0.2, 1 - def.coefTargetUpgrade * (t.level - 1));
      while (t.reload >= per && t.charge < def.chargeMax) {
        t.reload -= per;
        t.charge += def.chargeValue;
      }
      if (t.charge < def.chargeMax) continue;
      t.reload = 0;
    }

    t.cooldown -= dt;
    if (t.cooldown > 0) continue;

    const { min, max } = towerRange(t);
    const inRange = s.enemies.filter((e) => {
      if (e.converted) return false;
      const d = distance(t.hex, enemyHex(e));
      return d >= min && d <= max;
    });
    if (!inRange.length) continue;

    t.cooldown = 60 / (def.fireRate * (1 + t.fireRateBonus));
    if (def.chargeMax > 0) t.charge--;
    const tp = toPixel(t.hex);

    if (def.bulletType === 'zone') {
      s.fx.push({ kind: 'ring', x: tp.x, y: tp.y, t: 0, dur: 0.35, color: def.color, radius: 1.5 * max + 0.5 });
      for (const e of inRange) {
        const dmg = rollDamage(s, def, t);
        if (dmg > 0) damage(s, e, dmg, def.type);
        if (def.effectSuccess > 0 && s.rng() < def.effectSuccess) {
          e.slow = def.effectValueMin;
          const mult = def.targetUpgrade === 'effecttime' ? upgradeMult(def, t.level) : 1;
          e.slowT = Math.max(e.slowT, def.effectTime * mult);
        }
      }
      continue;
    }

    // Cible prioritaire : l'ennemi le plus proche de Félicia.
    const target = inRange.reduce((a, b) =>
      (s.dist.get(key(enemyHex(a))) ?? 99) <= (s.dist.get(key(enemyHex(b))) ?? 99) ? a : b);
    s.bullets.push({
      id: s.nextId++, x: tp.x, y: tp.y - 0.4, targetId: target.id, tx: target.x, ty: target.y,
      speed: def.bulletSpeed * 1.2, damage: rollDamage(s, def, t), dmgType: def.type,
      splash: def.bulletType === 'distance:zone' ? def.bulletRange : 0, color: def.color,
    });
  }
}

function moveBullets(s: TdState, dt: number) {
  const remaining: Bullet[] = [];
  for (const b of s.bullets) {
    const target = s.enemies.find((e) => e.id === b.targetId && !e.converted);
    if (target) {
      b.tx = target.x;
      b.ty = target.y;
    }
    const dx = b.tx - b.x;
    const dy = b.ty - b.y;
    const d = Math.hypot(dx, dy);
    const travel = b.speed * dt;
    if (d > travel) {
      b.x += (dx / d) * travel;
      b.y += (dy / d) * travel;
      remaining.push(b);
      continue;
    }
    if (b.splash > 0) {
      const center = fromPixel(b.tx, b.ty);
      s.fx.push({ kind: 'burst', x: b.tx, y: b.ty, t: 0, dur: 0.35, color: b.color, radius: 1.5 * b.splash + 0.6 });
      for (const e of s.enemies) {
        if (!e.converted && distance(center, enemyHex(e)) <= b.splash) damage(s, e, b.damage, b.dmgType);
      }
    } else if (target) {
      damage(s, target, b.damage, b.dmgType);
    }
  }
  s.bullets = remaining;
}

function damage(s: TdState, e: Enemy, raw: number, type: TowerDef['type']) {
  const def = BESTIARY[e.code];
  let armor = type === 'physic' ? def.physicArmor : type === 'magic' ? def.magicArmor : 0;
  if (e.enraged) armor = 0;
  e.life -= raw * (1 - armor / 100);
  if (e.code === 'bigorneau' && !e.enraged && e.life < e.maxLife / 2) e.enraged = true;
  if (e.life <= 0) {
    e.life = 0;
    e.converted = 0.001;
    s.kills++;
    s.mana = Math.min(MAX_MANA, s.mana + def.manaGain);
    s.fx.push({ kind: 'text', x: e.x, y: e.y - 0.8, t: 0, dur: 0.9, color: '#7fc8ff', text: `+${def.manaGain}` });
  }
}

export function upcomingWave(s: TdState): Wave | null {
  return s.waves[s.waveIndex] ?? null;
}
