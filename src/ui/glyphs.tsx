// Petits dessins vectoriels en attendant des graphismes : Félicia, Pairle, monstres, rocher.

import { ReactElement, memo, useLayoutEffect, useRef } from 'react';
import Svg, { Circle, Defs, Ellipse, G, Image as SvgImage, Path, Pattern, Polygon, Rect } from 'react-native-svg';
import { TOWERS } from '../data/towers';
import { Hex, hexPoints, key, toPixel } from '../engine/hex';
import { ORIGINAL_TILES, TILE_TWIPS } from './originalTiles';
import { C } from './theme';

// Textures d'origine extraites des SWF de Bernard (fondGazon de TDRPG-Map, fondOcean de TDRPG-world).
// Dans les SWF une tuile fait 23 px de rayon et la texture est posée à l'échelle 1:1, d'où 500 px / 23.
const TEXTURES = {
  gazon: require('../../assets/textures/gazon.png'),
  ocean: require('../../assets/textures/ocean.png'),
};
const TEXTURE_SIZE = 500 / 23;

/** À placer une fois dans un <Svg> ; on peint ensuite avec fill="url(#gazon)" ou "url(#ocean)". */
export function TextureDefs() {
  return (
    <Defs>
      {(Object.keys(TEXTURES) as (keyof typeof TEXTURES)[]).map((id) => (
        <Pattern key={id} id={id} patternUnits="userSpaceOnUse" width={TEXTURE_SIZE} height={TEXTURE_SIZE}>
          <SvgImage href={TEXTURES[id]} width={TEXTURE_SIZE} height={TEXTURE_SIZE} preserveAspectRatio="none" />
        </Pattern>
      ))}
    </Defs>
  );
}

/** Félicia sur la carte : petite sorcière blonde, robe et grand chapeau rouges (vidéo de 2011). */
export function Felicia({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <G transform={`translate(${x} ${y}) scale(${s})`}>
      <Ellipse cx={0} cy={0.55} rx={0.42} ry={0.13} fill="#000" opacity={0.25} />
      <Path d="M -0.34 0.52 Q -0.3 0.02 0 -0.05 Q 0.3 0.02 0.34 0.52 Z" fill="#d42b20" stroke="#6e0f0a" strokeWidth={0.04} />
      <Path d="M -0.27 -0.12 Q -0.34 0.22 -0.22 0.3 L 0.22 0.3 Q 0.34 0.22 0.27 -0.12 Z" fill="#f6d35a" stroke="#a8801a" strokeWidth={0.03} />
      <Circle cx={0} cy={-0.18} r={0.22} fill="#ffe0c4" stroke="#8a5a3a" strokeWidth={0.03} />
      <Ellipse cx={-0.08} cy={-0.17} rx={0.035} ry={0.05} fill="#2f8a5a" />
      <Ellipse cx={0.08} cy={-0.17} rx={0.035} ry={0.05} fill="#2f8a5a" />
      <Path d="M -0.24 -0.28 Q 0 -0.4 0.24 -0.28 L 0.2 -0.2 Q 0 -0.3 -0.2 -0.2 Z" fill="#f6d35a" />
      <Ellipse cx={0} cy={-0.33} rx={0.5} ry={0.12} fill="#d42b20" stroke="#6e0f0a" strokeWidth={0.04} />
      <Path d="M -0.28 -0.36 Q -0.2 -0.85 0.05 -1.05 Q -0.02 -0.8 0.3 -0.36 Z" fill="#e0372a" stroke="#6e0f0a" strokeWidth={0.04} />
      <Path d="M -0.27 -0.42 Q 0 -0.47 0.28 -0.42 L 0.3 -0.36 Q 0 -0.41 -0.28 -0.36 Z" fill="#f2c230" />
      <Ellipse cx={0.02} cy={-0.58} rx={0.09} ry={0.06} fill="#fff" stroke="#6e0f0a" strokeWidth={0.02} />
      <Circle cx={0.02} cy={-0.58} r={0.035} fill="#e0702a" />
    </G>
  );
}

/** Portrait de Félicia (HUD et dialogues) : chapeau rouge à œil et plume, cheveux blonds, yeux verts. */
export function FeliciaPortrait({ size }: { size: number }) {
  return (
    <Svg width={size} height={size * 1.1} viewBox="0 0 100 110">
      <Path d="M 22 60 Q 18 95 30 104 L 70 104 Q 82 95 78 60 Z" fill="#f2c94a" stroke="#a8801a" strokeWidth={1.5} />
      <Path d="M 30 98 Q 50 92 70 98 L 74 110 L 26 110 Z" fill="#c8261c" stroke="#6e0f0a" strokeWidth={1.5} />
      <Ellipse cx={50} cy={70} rx={21} ry={23} fill="#ffe2c8" stroke="#a46a48" strokeWidth={1.5} />
      <Ellipse cx={41} cy={72} rx={5} ry={6.5} fill="#fff" />
      <Ellipse cx={59} cy={72} rx={5} ry={6.5} fill="#fff" />
      <Ellipse cx={41.5} cy={73} rx={3.6} ry={4.6} fill="#2f9a6a" />
      <Ellipse cx={58.5} cy={73} rx={3.6} ry={4.6} fill="#2f9a6a" />
      <Circle cx={41.5} cy={73.5} r={1.8} fill="#123" />
      <Circle cx={58.5} cy={73.5} r={1.8} fill="#123" />
      <Circle cx={40} cy={71} r={1.2} fill="#fff" />
      <Circle cx={57} cy={71} r={1.2} fill="#fff" />
      <Ellipse cx={36} cy={81} rx={3.5} ry={2} fill="#ff9a8a" opacity={0.6} />
      <Ellipse cx={64} cy={81} rx={3.5} ry={2} fill="#ff9a8a" opacity={0.6} />
      <Path d="M 43 84 Q 50 91 57 84 Q 50 87 43 84 Z" fill="#a8282a" />
      <Path d="M 28 62 Q 34 46 50 48 Q 66 46 72 62 Q 64 56 58 60 Q 54 52 47 58 Q 40 53 36 60 Q 32 58 28 62 Z" fill="#f6d35a" stroke="#a8801a" strokeWidth={1.2} />
      <Path d="M 4 50 Q 50 36 96 50 Q 92 58 70 56 Q 50 52 30 56 Q 8 58 4 50 Z" fill="#d42b20" stroke="#6e0f0a" strokeWidth={1.5} />
      <Path d="M 26 51 Q 30 24 46 10 Q 54 3 64 2 Q 56 10 60 22 Q 66 36 74 50 Q 50 44 26 51 Z" fill="#e0372a" stroke="#6e0f0a" strokeWidth={1.5} />
      <Path d="M 27 47 Q 50 40 73 46 L 74 51 Q 50 45 26 51 Z" fill="#f2c230" stroke="#7a5a10" strokeWidth={1} />
      <Ellipse cx={50} cy={32} rx={10} ry={6.5} fill="#fff" stroke="#6e0f0a" strokeWidth={1.5} />
      <Circle cx={50} cy={32} r={4} fill="#e0702a" />
      <Circle cx={50} cy={32} r={1.8} fill="#111" />
      <Path d="M 40 29 Q 50 22 60 29" fill="none" stroke="#6e0f0a" strokeWidth={2} />
      <Path d="M 30 44 Q 14 34 8 20 Q 22 26 34 40 Z" fill="#fbf3d8" stroke="#b8a878" strokeWidth={1.2} />
    </Svg>
  );
}

/** Bouclier de Gaïa : un arc suggéré plutôt qu'une bulle complète (synecdoque, cf. BG Tower Quest). */
export function Shield({ x, y, ratio }: { x: number; y: number; ratio: number }) {
  return (
    <Path
      d={`M ${x - 0.75} ${y + 0.2} A 0.85 0.85 0 0 1 ${x + 0.75} ${y + 0.2}`}
      stroke="#9be7ff" strokeWidth={0.12} fill="none" opacity={0.25 + 0.6 * ratio}
    />
  );
}

/** Pairle : goutte pêche en forme de flamme, petites ailes crème, deux volutes de fumée (vidéo de 2011). */
export function Pairle({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <G transform={`translate(${x} ${y}) scale(${s})`}>
      <Path d="M -0.12 -0.48 Q -0.22 -0.62 -0.12 -0.78 M 0.05 -0.5 Q -0.05 -0.66 0.05 -0.82" stroke="#b9876a" strokeWidth={0.05} fill="none" strokeLinecap="round" />
      <Ellipse cx={-0.5} cy={-0.32} rx={0.26} ry={0.18} fill="#f8f0c0" stroke="#c8b878" strokeWidth={0.04} transform="rotate(-25 -0.5 -0.32)" />
      <Ellipse cx={0.45} cy={-0.38} rx={0.2} ry={0.25} fill="#f8f0c0" stroke="#c8b878" strokeWidth={0.04} transform="rotate(20 0.45 -0.38)" />
      <Path d="M 0 -0.55 Q 0.1 -0.35 0.3 -0.3 Q 0.62 -0.1 0.55 0.2 Q 0.45 0.48 0 0.48 Q -0.5 0.48 -0.58 0.2 Q -0.62 -0.12 -0.25 -0.28 Q -0.08 -0.36 0 -0.55 Z" fill="#f6b08c" stroke="#b9704e" strokeWidth={0.04} />
      <Ellipse cx={-0.3} cy={0.2} rx={0.1} ry={0.12} fill="#f07a3a" opacity={0.85} />
      <Ellipse cx={0.38} cy={0.18} rx={0.08} ry={0.11} fill="#f07a3a" opacity={0.85} />
      <Ellipse cx={-0.05} cy={0.0} rx={0.05} ry={0.07} fill="#111" />
      <Ellipse cx={0.22} cy={-0.02} rx={0.05} ry={0.07} fill="#111" />
      <Ellipse cx={0.12} cy={0.22} rx={0.03} ry={0.05} fill="#5a2a1a" />
    </G>
  );
}

export function Rock({ x, y }: { x: number; y: number }) {
  return (
    <G>
      <Ellipse cx={x} cy={y + 0.35} rx={0.6} ry={0.16} fill="#000" opacity={0.25} />
      <Polygon
        points={`${x - 0.55},${y + 0.35} ${x - 0.4},${y - 0.25} ${x - 0.05},${y - 0.5} ${x + 0.4},${y - 0.3} ${x + 0.58},${y + 0.35}`}
        fill="#8a6a4a" stroke="#4e3a26" strokeWidth={0.05}
      />
      <Path d={`M ${x - 0.2} ${y - 0.2} L ${x + 0.1} ${y + 0.1}`} stroke="#5e4630" strokeWidth={0.05} />
    </G>
  );
}

/**
 * Décor infranchissable dans le style du jeu publié (vidéo de 2011) : des objets illustrés posés
 * sur un sol continu, sans contour d'hexagone. Les types viennent de MapGenerator (colline, forêt, montagne, eau).
 */
export function Decor({ type, x, y, seed }: { type: string; x: number; y: number; seed: number }) {
  const flip = seed % 2 ? -1 : 1;
  if (type === 'water') {
    return (
      <G>
        <Polygon points={hexPoints(x, y, 1.02)} fill="#3d8fc8" />
        <Polygon points={hexPoints(x, y, 0.8)} fill="#56a8dc" />
        <Path d={`M ${x - 0.45} ${y - 0.1} q 0.15 -0.1 0.3 0 t 0.3 0 M ${x - 0.1} ${y + 0.3} q 0.15 -0.1 0.3 0 t 0.3 0`} stroke="#bfe6ff" strokeWidth={0.06} fill="none" strokeLinecap="round" />
      </G>
    );
  }
  if (type === 'hill') {
    return (
      <G>
        <Ellipse cx={x} cy={y + 0.42} rx={0.85} ry={0.2} fill="#1f4a14" opacity={0.3} />
        <Path d={`M ${x - 0.85} ${y + 0.4} Q ${x - 0.6} ${y - 0.55} ${x + 0.05 * flip} ${y - 0.6} Q ${x + 0.7} ${y - 0.5} ${x + 0.85} ${y + 0.4} Z`} fill="#5fae3a" stroke="#2f6a1c" strokeWidth={0.05} />
        <Path d={`M ${x - 0.55} ${y - 0.05} Q ${x - 0.3} ${y - 0.5} ${x + 0.1} ${y - 0.5}`} stroke="#9fdc6a" strokeWidth={0.12} fill="none" strokeLinecap="round" />
        <Path d={`M ${x + 0.2} ${y + 0.15} q 0.1 -0.12 0.2 0`} stroke="#2f6a1c" strokeWidth={0.05} fill="none" />
      </G>
    );
  }
  if (type === 'mountain') {
    return (
      <G>
        <Ellipse cx={x} cy={y + 0.45} rx={0.8} ry={0.18} fill="#000" opacity={0.25} />
        <Path d={`M ${x - 0.8} ${y + 0.45} L ${x - 0.35} ${y - 0.45} L ${x - 0.1} ${y - 0.2} L ${x + 0.2} ${y - 0.75} L ${x + 0.8} ${y + 0.45} Z`} fill="#8a6a72" stroke="#3e2a30" strokeWidth={0.05} />
        <Path d={`M ${x + 0.2} ${y - 0.75} L ${x + 0.8} ${y + 0.45} L ${x + 0.3} ${y + 0.45} L ${x + 0.15} ${y - 0.1} Z`} fill="#5e434b" />
        <Path d={`M ${x - 0.05} ${y - 0.45} L ${x + 0.2} ${y - 0.75} L ${x + 0.42} ${y - 0.3} Q ${x + 0.2} ${y - 0.4} ${x - 0.05} ${y - 0.45} Z`} fill="#f2f6f8" />
      </G>
    );
  }
  // forêt : deux arbres ronds
  const tree = (tx: number, ty: number, r: number) => (
    <G>
      <Rect x={tx - 0.06} y={ty + r * 0.6} width={0.12} height={0.25} fill="#6b4422" />
      <Circle cx={tx} cy={ty} r={r} fill="#2f8a4a" stroke="#174a26" strokeWidth={0.05} />
      <Circle cx={tx - r * 0.3} cy={ty - r * 0.3} r={r * 0.45} fill="#4fb36a" />
    </G>
  );
  return (
    <G>
      <Ellipse cx={x} cy={y + 0.5} rx={0.75} ry={0.16} fill="#000" opacity={0.25} />
      {tree(x - 0.32 * flip, y - 0.05, 0.42)}
      {tree(x + 0.32 * flip, y + 0.12, 0.36)}
    </G>
  );
}

/** Case de décor infranchissable, telle que dessinée dans TDRPG-Map.swf. */
export function OriginalTile({ type, x, y }: { type: string; x: number; y: number }) {
  const t = ORIGINAL_TILES[type];
  return (
    <G>
      <Polygon points={hexPoints(x, y, 0.98)} fill={t.fill} stroke="#00000040" strokeWidth={0.05} />
      {t.picto && <Path d={t.picto} fill="#000" transform={`translate(${x} ${y}) scale(${1 / TILE_TWIPS})`} />}
    </G>
  );
}

/** Tour posée sur la carte : sprite d'origine si on l'a, sinon un socle coloré. */
export function TowerSprite({ code, x, y, size = 1 }: { code: string; x: number; y: number; size?: number }) {
  const def = TOWERS[code];
  if (code === 'onzerock') return <Rock x={x} y={y} />;
  if (def.sprite) {
    const w = 1.55 * size;
    const h = w * (70 / 60);
    return <SvgImage href={def.sprite} x={x - w / 2} y={y - h * 0.68} width={w} height={h} />;
  }
  return (
    <G>
      <Ellipse cx={x} cy={y + 0.3} rx={0.5} ry={0.15} fill="#000" opacity={0.25} />
      <Rect x={x - 0.32} y={y - 0.7} width={0.64} height={1} rx={0.15} fill={def.color} stroke="#222" strokeWidth={0.05} />
      <Circle cx={x} cy={y - 0.7} r={0.28} fill={def.color} stroke="#222" strokeWidth={0.05} />
    </G>
  );
}

type Family = 'beetle' | 'spider' | 'snake' | 'worm' | 'mole' | 'brute' | 'blob' | 'eye' | 'dragon';
const FAMILY: Record<string, Family> = {
  scarabee: 'beetle', scaroyal: 'beetle', termite: 'beetle', bigorneau: 'beetle', crabe: 'beetle',
  spider: 'spider', snake: 'snake', lombric: 'worm', taupe: 'mole',
  orc: 'brute', guerrier: 'brute', brigand: 'brute', elfe: 'brute', geant: 'brute', ours: 'brute', char: 'brute',
  blob: 'blob', salamandre: 'snake', archimage: 'brute', ogre: 'brute', beholder: 'eye', kraken: 'blob', guivre: 'dragon',
};

/** Monstre : silhouette par famille, à la couleur du bestiaire ; devient blanc et s'efface quand il est purifié. */
export function Beast({ code, x, y, color, boss, converted, dir }: {
  code: string; x: number; y: number; color: string; boss: boolean; converted: number; dir: number;
}) {
  const fam = FAMILY[code] ?? 'blob';
  const r = boss ? 0.6 : 0.34;
  const fill = converted ? '#ffffff' : color;
  const line = converted ? '#cccccc' : '#1a1a1a';
  const sw = 0.045;
  const eye = (ex: number, ey: number, er: number) => (
    <G>
      <Circle cx={ex} cy={ey} r={er} fill="#fff" stroke={line} strokeWidth={0.02} />
      <Circle cx={ex + dir * er * 0.35} cy={ey} r={er * 0.5} fill={converted ? '#6ad' : '#111'} />
    </G>
  );
  let body: ReactElement;
  switch (fam) {
    case 'beetle':
      body = (
        <G>
          {[-0.5, 0, 0.5].map((k) => (
            <Path key={k} d={`M ${k * r} 0 l ${-0.25 * r} ${0.75 * r} M ${k * r} 0 l ${0.25 * r} ${0.75 * r}`} stroke={line} strokeWidth={sw} />
          ))}
          <Ellipse cx={0} cy={0} rx={r} ry={r * 0.8} fill={fill} stroke={line} strokeWidth={sw} />
          <Path d={`M 0 ${-r * 0.8} L 0 ${r * 0.8}`} stroke={line} strokeWidth={sw * 0.7} />
          <Ellipse cx={-r * 0.35} cy={-r * 0.3} rx={r * 0.25} ry={r * 0.15} fill="#fff" opacity={0.35} />
          <Circle cx={dir * r * 0.95} cy={-r * 0.1} r={r * 0.4} fill={fill} stroke={line} strokeWidth={sw} />
          {eye(dir * r * 1.05, -r * 0.2, r * 0.14)}
        </G>
      );
      break;
    case 'spider':
      body = (
        <G>
          {[-1, -0.35, 0.35, 1].map((k) => (
            <Path key={k} d={`M 0 0 Q ${k * r * 1.2} ${-r * 0.7} ${k * r * 1.5} ${r * 0.7}`} stroke={line} strokeWidth={sw * 1.4} fill="none" />
          ))}
          <Circle cx={-dir * r * 0.3} cy={0} r={r * 0.7} fill={fill} stroke={line} strokeWidth={sw} />
          <Circle cx={dir * r * 0.45} cy={-r * 0.05} r={r * 0.42} fill={fill} stroke={line} strokeWidth={sw} />
          {eye(dir * r * 0.4, -r * 0.15, r * 0.12)}
          {eye(dir * r * 0.65, -r * 0.15, r * 0.12)}
        </G>
      );
      break;
    case 'snake':
    case 'worm': {
      const d = `M ${-dir * r * 1.2} ${r * 0.5} Q ${-dir * r * 0.6} ${-r * 0.3} 0 ${r * 0.35} Q ${dir * r * 0.5} ${r * 0.8} ${dir * r * 0.6} ${-r * 0.2}`;
      body = (
        <G>
          <Path d={d} stroke={line} strokeWidth={r * 0.62} fill="none" strokeLinecap="round" />
          <Path d={d} stroke={fill} strokeWidth={r * 0.5} fill="none" strokeLinecap="round" />
          <Circle cx={dir * r * 0.65} cy={-r * 0.35} r={r * 0.42} fill={fill} stroke={line} strokeWidth={sw} />
          {fam === 'snake' && !converted && (
            <Path d={`M ${dir * r * 1.05} ${-r * 0.25} l ${dir * r * 0.3} 0 l ${dir * r * 0.12} ${-r * 0.1} M ${dir * r * 1.35} ${-r * 0.25} l ${dir * r * 0.12} ${r * 0.1}`} stroke="#d0202a" strokeWidth={0.03} />
          )}
          {eye(dir * r * 0.75, -r * 0.45, r * 0.15)}
        </G>
      );
      break;
    }
    case 'mole':
      body = (
        <G>
          <Ellipse cx={0} cy={0} rx={r * 1.05} ry={r * 0.85} fill={fill} stroke={line} strokeWidth={sw} />
          <Ellipse cx={dir * r * 0.95} cy={r * 0.05} rx={r * 0.32} ry={r * 0.22} fill="#f2a0a8" stroke={line} strokeWidth={sw * 0.7} />
          <Path d={`M ${-r * 0.5} ${r * 0.75} l ${-r * 0.15} ${r * 0.2} M ${r * 0.4} ${r * 0.78} l ${r * 0.15} ${r * 0.2}`} stroke="#f2a0a8" strokeWidth={sw * 2} strokeLinecap="round" />
          <Circle cx={dir * r * 0.45} cy={-r * 0.3} r={r * 0.08} fill="#111" />
        </G>
      );
      break;
    case 'brute':
      body = (
        <G>
          <Path d={`M ${-r * 0.75} ${r} L ${-r * 0.85} ${-r * 0.1} Q 0 ${-r * 0.6} ${r * 0.85} ${-r * 0.1} L ${r * 0.75} ${r} Z`} fill={fill} stroke={line} strokeWidth={sw} />
          <Circle cx={0} cy={-r * 0.65} r={r * 0.5} fill={fill} stroke={line} strokeWidth={sw} />
          <Path d={`M ${-r * 0.3} ${-r * 0.35} l 0 ${-r * 0.12} M ${r * 0.3} ${-r * 0.35} l 0 ${-r * 0.12}`} stroke="#fff" strokeWidth={sw * 1.4} />
          {eye(dir * r * 0.18 - r * 0.15, -r * 0.75, r * 0.12)}
          {eye(dir * r * 0.18 + r * 0.15, -r * 0.75, r * 0.12)}
          <Path d={`M ${dir * r * 0.9} ${r * 0.1} l ${dir * r * 0.35} ${-r * 0.7}`} stroke="#7a5a3a" strokeWidth={sw * 2.2} strokeLinecap="round" />
        </G>
      );
      break;
    case 'eye':
      body = (
        <G>
          <Circle cx={0} cy={0} r={r} fill={fill} stroke={line} strokeWidth={sw} />
          {[-0.6, 0, 0.6].map((k) => (
            <Path key={k} d={`M ${k * r} ${-r * 0.9} q ${k * 0.2} ${-r * 0.4} ${k * 0.4 + 0.05} ${-r * 0.5}`} stroke={line} strokeWidth={sw} fill="none" />
          ))}
          {eye(dir * r * 0.15, -r * 0.05, r * 0.5)}
        </G>
      );
      break;
    case 'dragon':
      body = (
        <G>
          <Path d={`M ${-dir * r * 0.1} ${-r * 0.2} L ${-dir * r * 1.2} ${-r * 1.0} L ${-dir * r * 0.9} ${-r * 0.2} L ${-dir * r * 1.3} ${-r * 0.3} Z`} fill={fill} stroke={line} strokeWidth={sw} opacity={0.85} />
          <Ellipse cx={0} cy={r * 0.15} rx={r * 0.85} ry={r * 0.6} fill={fill} stroke={line} strokeWidth={sw} />
          <Path d={`M ${-dir * r * 0.8} ${r * 0.3} Q ${-dir * r * 1.4} ${r * 0.6} ${-dir * r * 1.5} ${r * 0.1}`} stroke={fill} strokeWidth={r * 0.25} fill="none" strokeLinecap="round" />
          <Circle cx={dir * r * 0.75} cy={-r * 0.45} r={r * 0.42} fill={fill} stroke={line} strokeWidth={sw} />
          <Path d={`M ${dir * r * 0.6} ${-r * 0.8} l ${-dir * r * 0.15} ${-r * 0.35} M ${dir * r * 0.9} ${-r * 0.8} l ${dir * r * 0.05} ${-r * 0.35}`} stroke={converted ? '#ddd' : '#f2e6c0'} strokeWidth={sw * 1.6} strokeLinecap="round" />
          {eye(dir * r * 0.9, -r * 0.5, r * 0.13)}
        </G>
      );
      break;
    default:
      body = (
        <G>
          <Path d={`M ${-r} ${r * 0.6} Q ${-r * 1.05} ${-r * 0.9} 0 ${-r * 0.95} Q ${r * 1.05} ${-r * 0.9} ${r} ${r * 0.6} Z`} fill={fill} stroke={line} strokeWidth={sw} />
          <Ellipse cx={-r * 0.4} cy={-r * 0.5} rx={r * 0.25} ry={r * 0.15} fill="#fff" opacity={0.4} />
          {eye(dir * r * 0.1 - r * 0.22, -r * 0.2, r * 0.17)}
          {eye(dir * r * 0.1 + r * 0.22, -r * 0.2, r * 0.17)}
        </G>
      );
  }
  return (
    <G opacity={converted ? Math.max(0, 1 - converted) : 1}>
      <Ellipse cx={x} cy={y + r * 0.95} rx={r} ry={r * 0.28} fill="#000" opacity={0.2} />
      <G transform={`translate(${x} ${y})`}>{body}</G>
      {boss && !converted && (
        <Path d={`M ${x - r * 0.4} ${y - r * 1.15} L ${x - r * 0.25} ${y - r * 1.5} L ${x} ${y - r * 1.25} L ${x + r * 0.25} ${y - r * 1.5} L ${x + r * 0.4} ${y - r * 1.15} Z`} fill={C.gold} stroke="#8a6a00" strokeWidth={0.04} />
      )}
    </G>
  );
}

/**
 * Zones tactiles invisibles posées au-dessus de chaque case : plus fiable que de
 * recalculer la case à partir des coordonnées du toucher (react-native-web n'expose pas locationX).
 */
export function HitLayer({ hexes, onPress }: { hexes: Hex[]; onPress: (h: Hex) => void }) {
  const ref = useRef(onPress);
  useLayoutEffect(() => {
    ref.current = onPress;
  });
  return <HitPolygons hexes={hexes} handler={ref} />;
}

const HitPolygons = memo(function HitPolygons({ hexes, handler }: {
  hexes: Hex[]; handler: { current: (h: Hex) => void };
}) {
  return (
    <G>
      {hexes.map((h) => {
        const p = toPixel(h);
        return <Polygon key={key(h)} points={hexPoints(p.x, p.y, 1)} fill="#000" fillOpacity={0.001} onPress={() => handler.current(h)} />;
      })}
    </G>
  );
});

export function Flag({ x, y }: { x: number; y: number }) {
  return (
    <G>
      <Rect x={x - 0.04} y={y - 1} width={0.08} height={1.1} fill="#5a3a1a" />
      <Path d={`M ${x + 0.04} ${y - 1} L ${x + 0.6} ${y - 0.8} L ${x + 0.04} ${y - 0.58} Z`} fill={C.red} stroke="#600" strokeWidth={0.03} />
    </G>
  );
}

export function Lock({ x, y }: { x: number; y: number }) {
  return (
    <G opacity={0.75}>
      <Path d={`M ${x - 0.15} ${y - 0.05} L ${x - 0.15} ${y - 0.22} A 0.15 0.15 0 0 1 ${x + 0.15} ${y - 0.22} L ${x + 0.15} ${y - 0.05}`} stroke="#333" strokeWidth={0.06} fill="none" />
      <Rect x={x - 0.22} y={y - 0.05} width={0.44} height={0.32} rx={0.05} fill="#555" />
    </G>
  );
}
