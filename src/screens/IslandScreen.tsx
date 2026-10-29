// Carte d'une île (worldMap), d'après la vidéo de 2011 : île illustrée sur l'océan, cases pas encore
// conquises sous une brume gris-bleu, compteurs en haut à gauche, nom de l'île sur un bandeau parchemin.
// L'étape du scénario est signalée par un drapeau (cf. TQ - Interfaces Mode Campagne).

import { memo, useMemo, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Ellipse, G, Path, Polygon, Rect } from 'react-native-svg';
import { BESTIARY } from '../data/bestiary';
import { TOWERS } from '../data/towers';
import { Island, IslandTile, Reward } from '../data/tuttho';
import { Hex, hexPoints, key, neighbors, toPixel } from '../engine/hex';
import { Progress, heroLevel } from '../game/progress';
import { Btn } from '../ui/components';
import { Decor, Felicia, Flag, HitLayer, Lock, TextureDefs } from '../ui/glyphs';
import { SERIF } from '../ui/hud';
import { BIOME_COLORS, BIOME_NAMES, C } from '../ui/theme';

export type TileState = 'conquered' | 'open' | 'locked' | 'closed';

export function tileState(island: Island, p: Progress, t: IslandTile): TileState {
  const conquered = new Set(p.conquered);
  if (conquered.has(key(t.hex))) return 'conquered';
  if (t.etape !== undefined && t.etape > p.etape) return 'locked';
  return neighbors(t.hex).some((n) => conquered.has(key(n))) ? 'open' : 'closed';
}

function rewardText(r: Reward): string {
  switch (r.kind) {
    case 'tower': return `Invocation ${TOWERS[r.code].name}`;
    case 'potion': return `Potion de ${r.potion}`;
    case 'slot': return 'Emplacement de deck';
    case 'gold': return `${r.amount} golds`;
    case 'end': return 'Diplôme TUTO';
  }
}

export function IslandScreen({ island, progress, onMove, onAttack, onGrimoire, onMenu }: {
  island: Island;
  progress: Progress;
  onMove: (h: Hex) => void;
  onAttack: (t: IslandTile) => void;
  onGrimoire: () => void;
  onMenu: () => void;
}) {
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [selected, setSelected] = useState<string | null>(null);

  const bounds = useMemo(() => {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const t of island.tiles.values()) {
      const p = toPixel(t.hex);
      minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x);
      minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y);
    }
    const m = 2.5;
    return { minX: minX - m, minY: minY - m, w: maxX - minX + 2 * m, h: maxY - minY + 2 * m };
  }, [island]);

  const scale = size.w ? Math.min(size.w / bounds.w, size.h / bounds.h) : 1;
  const offX = (size.w - bounds.w * scale) / 2;
  const offY = (size.h - bounds.h * scale) / 2;
  const visible = { minX: bounds.minX - offX / scale, minY: bounds.minY - offY / scale, w: size.w / scale, h: size.h / scale };

  const done = progress.etape >= island.etapes.length;
  const etape = island.etapes[progress.etape];
  const heroP = toPixel(island.tiles.get(progress.hero)!.hex);
  const sel = selected ? island.tiles.get(selected) : undefined;
  const selState = sel ? tileState(island, progress, sel) : null;
  const total = island.tiles.size;

  const tileHexes = useMemo(() => [...island.tiles.values()].map((t) => t.hex), [island]);

  const onPress = (h: Hex) => {
    const t = island.tiles.get(key(h));
    if (!t) return setSelected(null);
    const state = tileState(island, progress, t);
    if (state === 'conquered') {
      onMove(t.hex); // les territoires conquis se traversent instantanément
      setSelected(null);
    } else {
      setSelected(key(t.hex));
    }
  };

  return (
    <View style={st.root}>
      <View style={{ flex: 1 }} onLayout={(e: LayoutChangeEvent) => setSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
        {size.w > 0 && (
            <Svg width={size.w} height={size.h}>
              <G transform={`translate(${offX} ${offY}) scale(${scale}) translate(${-bounds.minX} ${-bounds.minY})`}>
                <TextureDefs />
                <Ocean minX={visible.minX} minY={visible.minY} w={visible.w} h={visible.h} />
                <Terrain island={island} />
                {[...island.tiles.values()].map((t) => {
                  const p = toPixel(t.hex);
                  const state = tileState(island, progress, t);
                  if (state === 'conquered') return null;
                  // Brume des cases pas encore conquises (vidéo de 2011) ; contour jaune = case attaquable.
                  return (
                    <G key={key(t.hex)}>
                      <Polygon points={hexPoints(p.x, p.y, 1)} fill={C.islandFog} fillOpacity={0.93} stroke="#6f9aa0" strokeWidth={0.05} />
                      {state === 'open' && <Polygon points={hexPoints(p.x, p.y, 0.86)} fill="none" stroke={C.highlight} strokeWidth={0.1} />}
                      {state === 'locked' && <Lock x={p.x} y={p.y} />}
                    </G>
                  );
                })}
                {selected && (() => {
                  const p = toPixel(island.tiles.get(selected)!.hex);
                  return <Polygon points={hexPoints(p.x, p.y, 0.92)} fill="#fff" opacity={0.3} />;
                })()}
                {!done && etape && (() => {
                  const p = toPixel(etape.hex);
                  return <Flag x={p.x} y={p.y + 0.3} />;
                })()}
                <Felicia x={heroP.x} y={heroP.y + 0.1} s={0.9} />
                <HitLayer hexes={tileHexes} onPress={onPress} />
              </G>
            </Svg>
        )}
        <View style={st.counters} pointerEvents="none">
          <Text style={st.counter}>⬡ {progress.conquered.length}/{total}</Text>
          <Text style={st.counter}>✦ {Math.min(progress.etape, island.etapes.length)}/{island.etapes.length}</Text>
          <Text style={st.counter}>⚑ {done ? 'Terminée' : 'En cours'}</Text>
        </View>
        <View style={st.banner} pointerEvents="none">
          <Text style={st.bannerText}>{island.name}</Text>
        </View>
      </View>

      <View style={st.panel}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Svg width={44} height={52} viewBox="-1 -1.25 2 2.2"><Felicia x={0} y={0} /></Svg>
          <View style={{ marginLeft: 6 }}>
            <Text style={st.heroName}>Félicia</Text>
            <Text style={st.muted}>niveau {heroLevel(progress)}</Text>
          </View>
        </View>
        <Text style={st.stat}>Golds : <Text style={{ color: C.gold }}>{progress.gold}</Text></Text>
        <Text style={st.stat}>Tuiles : {progress.conquered.length} / {total}</Text>
        <Text style={st.stat}>Perfects : {progress.perfect.length}</Text>
        <Text style={st.stat}>Potions : {progress.potions.vie} vie · {progress.potions.mana} mana</Text>

        <View style={st.info}>
          {sel && selState ? (
            <>
              <Text style={st.infoTitle}>{BIOME_NAMES[sel.biome]}{sel.etape !== undefined ? ` · étape ${sel.etape + 1}` : ''}</Text>
              {selState === 'locked' ? (
                <Text style={st.infoText}>Cette étape du scénario n’est pas encore accessible.</Text>
              ) : (
                <>
                  <Text style={st.infoText}>Difficulté {sel.difficulty} · {sel.nbVagues} vagues</Text>
                  <Text style={st.infoText}>
                    Bestiaire : {sel.bestiaire.map((c) => BESTIARY[c].name).join(', ')}
                    {sel.etape !== undefined && island.etapes[sel.etape].boss ? ` + ${BESTIARY[island.etapes[sel.etape].boss!].name} (boss)` : ''}
                  </Text>
                  {sel.etape !== undefined && (
                    <Text style={[st.infoText, { color: C.gold }]}>Récompense : {rewardText(island.etapes[sel.etape].reward)}</Text>
                  )}
                  {selState === 'open' ? (
                    <Btn label="Combattre" onPress={() => onAttack(sel)} style={{ marginTop: 8 }} />
                  ) : (
                    <Text style={[st.infoText, { marginTop: 4 }]}>Trop loin : conquiers d’abord une case voisine.</Text>
                  )}
                </>
              )}
            </>
          ) : (
            <Text style={st.infoText}>Touche une case entourée de jaune pour l’attaquer, ou une case conquise pour t’y rendre.</Text>
          )}
        </View>

        <View style={{ flex: 1 }} />
        <Btn label="Grimoire" onPress={onGrimoire} color={C.cardDark} style={{ marginBottom: 6 }} />
        <Btn label="Menu" onPress={onMenu} color="#555" />
      </View>
    </View>
  );
}

/** Océan uni du jeu publié, avec la texture fondOcean du prototype en léger voile et quelques vagues. */
const Ocean = memo(function Ocean({ minX, minY, w, h }: { minX: number; minY: number; w: number; h: number }) {
  const waves: { x: number; y: number }[] = [];
  for (let gx = Math.floor(minX / 4) * 4; gx < minX + w; gx += 4) {
    for (let gy = Math.floor(minY / 3) * 3; gy < minY + h; gy += 3) {
      const n = Math.sin(gx * 12.9898 + gy * 78.233) * 43758.5453;
      if (n - Math.floor(n) < 0.35) waves.push({ x: gx + (n % 1.5), y: gy });
    }
  }
  return (
    <G>
      <Rect x={minX} y={minY} width={w} height={h} fill={C.islandOcean} />
      <Rect x={minX} y={minY} width={w} height={h} fill="url(#ocean)" opacity={0.18} />
      {waves.map((v, i) => (
        <Path key={i} d={`M ${v.x} ${v.y} q 0.3 -0.25 0.6 0 t 0.6 0`} stroke="#7fd0f2" strokeWidth={0.07} fill="none" strokeLinecap="round" opacity={0.6} />
      ))}
    </G>
  );
});

/** Illustration de l'île : halo d'eau claire, plage, puis terrain du biome avec arbres, rochers et villages. */
const Terrain = memo(function Terrain({ island }: { island: Island }) {
  const tiles = [...island.tiles.values()].sort((a, b) => toPixel(a.hex).y - toPixel(b.hex).y);
  return (
    <G>
      {tiles.map((t) => {
        const p = toPixel(t.hex);
        return <Circle key={`s${key(t.hex)}`} cx={p.x} cy={p.y} r={1.75} fill="#5cc6ea" />;
      })}
      {tiles.map((t) => {
        const p = toPixel(t.hex);
        return <Circle key={`b${key(t.hex)}`} cx={p.x} cy={p.y} r={1.3} fill="#f3e2a6" />;
      })}
      {tiles.map((t) => {
        const p = toPixel(t.hex);
        const col = BIOME_COLORS[t.biome];
        return (
          <G key={key(t.hex)}>
            <Polygon points={hexPoints(p.x, p.y, 1.02)} fill={col.grassTint !== undefined ? 'url(#gazon)' : col.fill} />
            {col.grassTint ? <Polygon points={hexPoints(p.x, p.y, 1.02)} fill={col.fill} fillOpacity={col.grassTint} /> : null}
          </G>
        );
      })}
      {tiles.map((t) => {
        const p = toPixel(t.hex);
        const v = t.seed % 10;
        const type = t.biome === 'forest' || v < 3 ? 'forest' : t.biome === 'mountain' || v === 3 ? 'mountain' : v === 4 ? 'hut' : null;
        if (!type) return null;
        return (
          <G key={`d${key(t.hex)}`} transform={`translate(${p.x} ${p.y}) scale(0.8)`}>
            {type === 'hut' ? <Hut x={0} y={0} /> : <Decor type={type} x={0} y={0} seed={t.seed} />}
          </G>
        );
      })}
    </G>
  );
});

/** Hutte de village (toit de paille arrondi), comme sur l'île de la vidéo. */
function Hut({ x, y }: { x: number; y: number }) {
  return (
    <G>
      <Ellipse cx={x} cy={y + 0.42} rx={0.5} ry={0.12} fill="#000" opacity={0.25} />
      <Rect x={x - 0.3} y={y} width={0.6} height={0.42} fill="#c9905a" stroke="#5a3a1a" strokeWidth={0.04} />
      <Rect x={x - 0.08} y={y + 0.15} width={0.16} height={0.27} fill="#5a3a1a" />
      <Path d={`M ${x - 0.45} ${y + 0.05} Q ${x - 0.4} ${y - 0.55} ${x} ${y - 0.6} Q ${x + 0.4} ${y - 0.55} ${x + 0.45} ${y + 0.05} Z`} fill="#e8a838" stroke="#7a5212" strokeWidth={0.04} />
    </G>
  );
}

const st = StyleSheet.create({
  root: { flex: 1, flexDirection: 'row', backgroundColor: C.islandOcean },
  panel: { width: 200, backgroundColor: C.hudPanel, padding: 10, borderLeftWidth: 3, borderColor: C.hudFrame },
  heroName: { color: C.cream, fontWeight: '800', fontSize: 16 },
  muted: { color: '#cfe0e2', fontSize: 11 },
  stat: { color: '#fff', fontSize: 12, marginTop: 3 },
  info: { marginTop: 10, backgroundColor: C.hudInfo, borderRadius: 4, padding: 8 },
  infoTitle: { color: C.cream, fontWeight: '800', fontSize: 13, marginBottom: 3 },
  infoText: { color: '#fff', fontSize: 12, marginBottom: 2 },
  counters: { position: 'absolute', left: 10, top: 8, flexDirection: 'row', gap: 14 },
  counter: { color: '#fff', fontSize: 12, fontWeight: '700', textShadowColor: '#035', textShadowRadius: 3 },
  banner: {
    position: 'absolute', right: 14, top: 8, backgroundColor: C.parchment, paddingHorizontal: 22, paddingVertical: 5,
    borderRadius: 3, borderWidth: 1, borderColor: '#c9b98a', transform: [{ rotate: '-1deg' }],
  },
  bannerText: { color: '#3a3326', fontSize: 16, fontFamily: SERIF, fontVariant: ['small-caps'], letterSpacing: 1 },
});
