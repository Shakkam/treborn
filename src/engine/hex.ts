// Hexagones "flat-top" en coordonnées axiales (q, r). Taille d'un hexagone = 1 en unités monde.

export interface Hex {
  q: number;
  r: number;
}

export const SQRT3 = Math.sqrt(3);

export const DIRS: Hex[] = [
  { q: 1, r: 0 }, { q: 1, r: -1 }, { q: 0, r: -1 },
  { q: -1, r: 0 }, { q: -1, r: 1 }, { q: 0, r: 1 },
];

export const key = (h: Hex) => `${h.q},${h.r}`;

export function parseKey(k: string): Hex {
  const [q, r] = k.split(',').map(Number);
  return { q, r };
}

export const neighbors = (h: Hex): Hex[] => DIRS.map((d) => ({ q: h.q + d.q, r: h.r + d.r }));

export function distance(a: Hex, b: Hex): number {
  const dq = a.q - b.q;
  const dr = a.r - b.r;
  return (Math.abs(dq) + Math.abs(dr) + Math.abs(dq + dr)) / 2;
}

export function toPixel(h: Hex): { x: number; y: number } {
  return { x: 1.5 * h.q, y: SQRT3 * (h.r + h.q / 2) };
}

export function fromPixel(x: number, y: number): Hex {
  const q = (2 / 3) * x;
  const r = (-1 / 3) * x + (SQRT3 / 3) * y;
  return round(q, r);
}

function round(fq: number, fr: number): Hex {
  const fs = -fq - fr;
  let q = Math.round(fq);
  let r = Math.round(fr);
  const s = Math.round(fs);
  const dq = Math.abs(q - fq);
  const dr = Math.abs(r - fr);
  const ds = Math.abs(s - fs);
  if (dq > dr && dq > ds) q = -r - s;
  else if (dr > ds) r = -q - s;
  return { q, r };
}

/** Carte rectangulaire en "odd-q" : colonne/ligne → axial. */
export function offsetToAxial(col: number, row: number): Hex {
  return { q: col, r: row - (col - (col & 1)) / 2 };
}

export function axialToOffset(h: Hex): { col: number; row: number } {
  return { col: h.q, row: h.r + (h.q - (h.q & 1)) / 2 };
}

/** Points du contour d'un hexagone de rayon `size`, centré en (cx, cy). */
export function hexPoints(cx: number, cy: number, size: number): string {
  let s = '';
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 180) * (60 * i);
    s += `${(cx + size * Math.cos(a)).toFixed(2)},${(cy + size * Math.sin(a)).toFixed(2)} `;
  }
  return s.trim();
}
