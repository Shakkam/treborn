// Écran de combat (tdMap), disposition du jeu publié (vidéo de 2011, reference/video-2011-07-11) :
// barre du haut (portrait, vie, mana, sac), carte à gauche, colonne de droite avec le deck en
// emplacements ronds, le compteur de vagues (flèche « Envoyer ») et la fiche de l'ennemi ou de la tour.

import { ReactElement, memo, useEffect, useMemo, useState } from 'react';
import { LayoutChangeEvent, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, G, Path, Polygon, Rect, Text as SvgText } from 'react-native-svg';
import { BESTIARY } from '../data/bestiary';
import { MAX_TOWER_LEVEL, TOWERS, upgradeCost, upgradeMult } from '../data/towers';
import { MAX_MANA } from '../engine/config';
import { Hex, hexPoints, key, toPixel } from '../engine/hex';
import {
  PlaceResult, TdConfig, TdState, abandon, callNextWave, canPlaceHero, createTd, drinkPotion, placeHero, step,
  towerRange, tryPlace, upcomingWave,
} from '../engine/td';
import { TdMap } from '../engine/tdmap';
import { TowerIcon } from '../ui/components';
import { Beast, Decor, Felicia, FeliciaPortrait, HitLayer, Pairle, Shield, TextureDefs, TowerSprite } from '../ui/glyphs';
import { HudBar, HudIcon, InfoWindow, RoundSlot, SERIF, Segments, SilverBtn } from '../ui/hud';
import { BIOME_COLORS, C } from '../ui/theme';

const SIDE_W = 108;
const TOP_H = 40;
const DECK_SLOTS = 4; // la colonne affiche toujours 4 emplacements, vides compris

const PLACE_MESSAGES: Partial<Record<PlaceResult, string>> = {
  mana: 'Pas assez de mana !',
  stock: 'Plus d\'invocation de ce type dans ton deck.',
  blocked: 'Impossible : les ennemis doivent toujours pouvoir atteindre Félicia.',
  occupied: 'Case occupée.',
  max: 'Niveau maximum atteint.',
  invalid: 'Impossible de poser ici.',
};

export interface TdResult {
  won: boolean;
  perfect: boolean;
  gold: number;
  potionsUsed: { vie: number; mana: number };
}

export function TdScreen({ config, onExit }: {
  config: TdConfig; title: string; onExit: (r: TdResult) => void;
}) {
  const [s] = useState(() => createTd(config));

  const [, setTick] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [slot, setSlot] = useState<number | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [popup, setPopup] = useState<'options' | 'bag' | null>(null);
  const [endStep, setEndStep] = useState<'band' | 'info'>('band');
  const [size, setSize] = useState({ w: 0, h: 0 });

  useEffect(() => {
    let raf = 0;
    let last = Date.now();
    const loop = () => {
      const now = Date.now();
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!popup) for (let i = 0; i < speed; i++) step(s, dt);
      setTick((t) => (t + 1) % 1e6);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [s, speed, popup]);

  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => setMessage(null), 2200);
    return () => clearTimeout(t);
  }, [message]);

  // Cadre de la carte en unités monde.
  const bounds = useMemo(() => {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const c of s.map.cells.values()) {
      const p = toPixel(c.hex);
      minX = Math.min(minX, p.x - 1); maxX = Math.max(maxX, p.x + 1);
      minY = Math.min(minY, p.y - 1); maxY = Math.max(maxY, p.y + 1);
    }
    return { minX, minY, w: maxX - minX, h: maxY - minY };
  }, [s.map]);

  const k = size.w ? Math.min(size.w / bounds.w, size.h / bounds.h) : 1;
  const offX = (size.w - bounds.w * k) / 2;
  const offY = (size.h - bounds.h * k) / 2;

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setSize({ w: width, h: height });
  };

  const cellHexes = useMemo(() => [...s.map.cells.values()].map((c) => c.hex), [s.map]);

  const onMapPress = (h: Hex) => {
    if (s.phase === 'hero') {
      if (!placeHero(s, h)) setMessage('Félicia doit se placer sur une case libre, loin des points d\'apparition.');
      return;
    }
    if (s.phase !== 'setup' && s.phase !== 'running') return;
    if (slot !== null) {
      const r = tryPlace(s, slot, h);
      if (PLACE_MESSAGES[r]) setMessage(PLACE_MESSAGES[r]!);
      if (r === 'placed' || r === 'upgraded') setSelected(key(h));
      return;
    }
    setSelected(s.towers.has(key(h)) ? key(h) : null);
  };

  const won = s.phase === 'won';
  const over = won || s.phase === 'lost';
  const wave = upcomingWave(s);
  const selTower = selected ? s.towers.get(selected) : undefined;
  const placing = s.phase === 'hero' || slot !== null;
  const canSend = s.phase === 'setup' || (s.phase === 'running' && s.waveIndex < s.waves.length);

  const exit = () => onExit({ won, perfect: won && s.perfect, gold: won ? s.gold : 0, potionsUsed: s.potionsUsed });

  return (
    <View style={st.root}>
      <TopBar s={s} onBag={() => setPopup('bag')} onOptions={() => setPopup('options')} />
      <View style={{ flex: 1, flexDirection: 'row' }}>
        <View style={st.mapArea} onLayout={onLayout}>
          {size.w > 0 && (
            <Svg width={size.w} height={size.h}>
              <G transform={`translate(${offX} ${offY}) scale(${k}) translate(${-bounds.minX} ${-bounds.minY})`}>
                <TextureDefs />
                <Rect x={bounds.minX - offX / k} y={bounds.minY - offY / k} width={size.w / k} height={size.h / k} fill="url(#gazon)" />
                <Rect x={bounds.minX - offX / k} y={bounds.minY - offY / k} width={size.w / k} height={size.h / k} fill="#1f3a10" opacity={0.35} />
                <Ground map={s.map} />
                <Overlay s={s} slot={slot} placing={placing} selected={selTower ? selected : null} />
                <Entities s={s} />
                <HitLayer hexes={cellHexes} onPress={onMapPress} />
              </G>
            </Svg>
          )}
          <Hint s={s} slot={slot} message={message} />
        </View>

        <View style={st.side}>
          <View style={st.deck}>
            {Array.from({ length: Math.max(DECK_SLOTS, config.deck.length) }).map((_, i) => {
              const d = config.deck[i];
              if (!d) return <RoundSlot key={i} size={40} />;
              const def = TOWERS[d.code];
              const left = s.deckLeft[i];
              return (
                <RoundSlot
                  key={i} size={40} qty={left} active={slot === i}
                  dim={left <= 0 || s.mana < def.manaCost}
                  onPress={() => { setSlot(slot === i ? null : i); setSelected(null); }}
                >
                  <TowerIcon code={d.code} size={34} />
                </RoundSlot>
              );
            })}
          </View>

          <Pressable style={st.waveBar} onPress={() => callNextWave(s)} disabled={!canSend}>
            <Svg width={26} height={16} viewBox="0 0 26 16" opacity={canSend ? 1 : 0.35}>
              <Path d="M1 8 L10 1 L10 5 L25 5 L25 11 L10 11 L10 15 Z" fill="#f2c230" stroke="#7a5a10" strokeWidth={1} />
            </Svg>
            <Text style={st.waveText}>
              {s.phase === 'setup' ? 'Envoyer' : `${Math.max(1, Math.min(s.waveIndex, s.waves.length))}/${s.waves.length}`}
            </Text>
          </Pressable>

          <View style={st.info}>
            {selTower ? (
              <TowerSheet code={selTower.code} level={selTower.level} />
            ) : slot !== null ? (
              <TowerSheet code={config.deck[slot].code} level={0} />
            ) : wave ? (
              <MonsterSheet code={wave.code} level={wave.level} />
            ) : null}
          </View>
        </View>
      </View>

      {popup === 'options' && (
        <InfoWindow title="Options">
          <View style={st.popRow}>
            {[1, 2, 3].map((v) => (
              <SilverBtn key={v} label={`Vitesse x${v}`} onPress={() => setSpeed(v)} style={speed === v ? st.popOn : undefined} />
            ))}
          </View>
          <View style={st.popRow}>
            <SilverBtn label="Abandonner" onPress={() => { setPopup(null); abandon(s); }} />
            <SilverBtn label="Reprendre" onPress={() => setPopup(null)} />
          </View>
        </InfoWindow>
      )}
      {popup === 'bag' && (
        <InfoWindow title="Sac à dos">
          <View style={st.popRow}>
            <SilverBtn label={`Potion de vie (${s.potions.vie})`} onPress={() => { drinkPotion(s, 'vie'); setPopup(null); }} />
            <SilverBtn label={`Potion de mana (${s.potions.mana})`} onPress={() => { drinkPotion(s, 'mana'); setPopup(null); }} />
          </View>
          <SilverBtn label="Fermer" onPress={() => setPopup(null)} />
        </InfoWindow>
      )}

      {over && endStep === 'band' && (
        <View style={st.endLayer}>
          <View style={st.endBand}>
            <Text style={st.endTitle}>{won ? '- VICTOIRE -' : '- DÉFAITE -'}</Text>
            <SilverBtn label="RETOUR CARTE" onPress={() => (won && s.perfect ? setEndStep('info') : exit())} />
          </View>
        </View>
      )}
      {over && endStep === 'info' && (
        <InfoWindow title="Information !">
          <View style={st.infoBody}>
            <Svg width={90} height={80} viewBox="-1 -0.95 2 1.6"><Pairle x={0} y={0} /></Svg>
            <Text style={st.infoMsg}>Perfect ! Tu obtiens 50 golds de plus !</Text>
          </View>
          <SilverBtn label="OK" onPress={exit} style={{ minWidth: 70 }} />
        </InfoWindow>
      )}
    </View>
  );
}

function TopBar({ s, onBag, onOptions }: { s: TdState; onBag: () => void; onOptions: () => void }) {
  return (
    <View style={st.top}>
      <View style={st.portrait}>
        <View style={{ marginTop: -14 }}><FeliciaPortrait size={40} /></View>
      </View>
      <HudBar value={s.life} max={s.maxLife} color="life" width={130} />
      <HudBar value={s.mana} max={MAX_MANA} color="mana" width={130} />
      <Pressable onPress={onBag} style={{ marginLeft: 4 }}>
        <Svg width={30} height={26} viewBox="0 0 30 26">
          <Path d="M5 9 Q4 3 13 3 L20 3 Q27 3 26 10 L26 21 Q26 24 22 24 L8 24 Q4 24 4 20 Z" fill="#c9a46a" stroke="#6a4a22" strokeWidth={1.2} />
          <Path d="M4 11 Q15 15 26 11" fill="none" stroke="#6a4a22" strokeWidth={1.2} />
          <Rect x={1} y={9} width={6} height={4} rx={1} fill="#8a6a3a" />
        </Svg>
        {s.potions.vie + s.potions.mana > 0 && <Text style={st.bagCount}>{s.potions.vie + s.potions.mana}</Text>}
      </Pressable>
      <View style={st.itemSlot} />
      <View style={{ flex: 1 }} />
      <View style={{ width: SIDE_W, alignItems: 'center' }}>
        <SilverBtn label="Options" onPress={onOptions} />
      </View>
    </View>
  );
}

function MonsterSheet({ code, level }: { code: string; level: number }) {
  const def = BESTIARY[code];
  return (
    <>
      <Text style={st.sheetName}>{def.name}</Text>
      <View style={st.sheetRow}>
        <HudIcon name="heart" /><Text style={st.sheetVal}>{Math.round(def.life * level)}</Text>
        <Text style={st.lvl}>lvl</Text><Text style={st.sheetVal}>{level}</Text>
      </View>
      <View style={st.sheetRow}>
        <HudIcon name="sword" /><Text style={st.sheetVal}>{def.hitDamage}</Text>
        <HudIcon name="star" /><Text style={st.sheetVal}>{def.manaGain}</Text>
      </View>
      <View style={st.segRow}><HudIcon name="speed" size={14} /><Segments value={def.speed} /></View>
      <View style={st.segRow}><HudIcon name="physic" size={14} /><Segments value={def.physicArmor / 10} /></View>
      <View style={st.segRow}><HudIcon name="magic" size={14} /><Segments value={def.magicArmor / 10} /></View>
    </>
  );
}

/** Fiche de tour ; level = 0 pour une carte du deck pas encore posée. */
function TowerSheet({ code, level }: { code: string; level: number }) {
  const def = TOWERS[code];
  const dmg = (l: number) => {
    const m = def.targetUpgrade === 'damage' ? upgradeMult(def, l) : 1;
    return `${Math.floor(def.dgtMin * m)}-${Math.floor(def.dgtMax * m)}`;
  };
  const range = def.rangeMax ? `${def.rangeMin}-${def.rangeMax}` : '-';
  const canUp = level > 0 && def.coefManaUpgrade > 0 && level < MAX_TOWER_LEVEL;
  return (
    <>
      <Text style={st.sheetName}>{def.name}</Text>
      <View style={st.sheetRow}>
        {level > 0 && <><Text style={st.lvl}>lvl</Text><Text style={st.sheetVal}>{level}</Text></>}
        <HudIcon name={level > 0 ? 'upstar' : 'star'} />
        <Text style={st.sheetVal}>{level > 0 ? (canUp ? upgradeCost(def, level) : '-') : def.manaCost}</Text>
      </View>
      {def.dgtMax > 0 && (
        <View style={st.sheetRow}>
          <HudIcon name="sword" />
          <View>
            <Text style={st.sheetVal}>{dmg(Math.max(1, level))}</Text>
            {canUp && def.targetUpgrade === 'damage' && <Text style={st.nextVal}>↑{dmg(level + 1)}</Text>}
          </View>
        </View>
      )}
      {def.fireRate > 0 && (
        <View style={st.sheetRow}><HudIcon name="bolt" /><Text style={st.sheetVal}>{def.fireRate}/min</Text></View>
      )}
      <View style={st.sheetRow}><HudIcon name="range" /><Text style={st.sheetVal}>{range}</Text></View>
      {!def.dgtMax && <Text style={st.sheetDesc}>{def.description}</Text>}
    </>
  );
}

const Ground = memo(function Ground({ map }: { map: TdMap }) {
  const col = BIOME_COLORS[map.biome];
  const cells = [...map.cells.values()];
  const free = cells.filter((c) => !c.obstacle);
  // Le décor est dessiné de haut en bas pour que les objets du bas recouvrent ceux du haut.
  const decor = cells.filter((c) => c.obstacle).sort((a, b) => toPixel(a.hex).y - toPixel(b.hex).y);
  return (
    <G>
      {cells.map((c) => {
        const p = toPixel(c.hex);
        return <Polygon key={key(c.hex)} points={hexPoints(p.x, p.y, 1.03)} fill={col.grassTint !== undefined ? 'url(#gazon)' : col.fill} />;
      })}
      {col.grassTint ? free.map((c) => {
        const p = toPixel(c.hex);
        return <Polygon key={`t${key(c.hex)}`} points={hexPoints(p.x, p.y, 1.03)} fill={col.fill} fillOpacity={col.grassTint} />;
      }) : null}
      {decor.map((c) => {
        const p = toPixel(c.hex);
        return <Decor key={`d${key(c.hex)}`} type={c.obstacle!} x={p.x} y={p.y} seed={c.hex.q * 7 + c.hex.r * 13} />;
      })}
      {map.spawns.map((sp) => {
        const p = toPixel(sp);
        return (
          <G key={key(sp)}>
            <Circle cx={p.x} cy={p.y} r={0.62} fill="#3a1d3a" opacity={0.45} />
            <Circle cx={p.x} cy={p.y} r={0.42} fill="#1a0a1a" opacity={0.55} />
          </G>
        );
      })}
    </G>
  );
});

function Overlay({ s, slot, placing, selected }: { s: TdState; slot: number | null; placing: boolean; selected: string | null }) {
  const marks: ReactElement[] = [];
  // La grille n'apparaît que pendant la pose (Félicia ou une invocation).
  if (placing) {
    for (const c of s.map.cells.values()) {
      if (c.obstacle) continue;
      const p = toPixel(c.hex);
      const ok = s.phase === 'hero' && canPlaceHero(s, c.hex);
      marks.push(
        <Polygon key={key(c.hex)} points={hexPoints(p.x, p.y, 1)} fill={ok ? C.pink : 'none'} fillOpacity={0.25} stroke="#fff" strokeOpacity={0.55} strokeWidth={0.04} />,
      );
    }
  }
  const t = selected ? s.towers.get(selected) : undefined;
  if (t && TOWERS[t.code].target !== 'none') {
    const { max } = towerRange(t);
    const p = toPixel(t.hex);
    marks.push(<Circle key="range" cx={p.x} cy={p.y} r={max * 1.75 + 0.8} fill="#f08a6a" opacity={0.35} />);
  }
  if (slot !== null && (s.phase === 'setup' || s.phase === 'running')) {
    const code = s.config.deck[slot].code;
    for (const tw of s.towers.values()) {
      if (tw.code !== code || tw.level >= MAX_TOWER_LEVEL || code === 'onzerock') continue;
      const p = toPixel(tw.hex);
      marks.push(<Polygon key={`u${key(tw.hex)}`} points={hexPoints(p.x, p.y, 0.9)} fill="none" stroke={C.gold} strokeWidth={0.08} />);
    }
  }
  return <G>{marks}</G>;
}

function Entities({ s }: { s: TdState }) {
  const towers = [...s.towers.values()].sort((a, b) => toPixel(a.hex).y - toPixel(b.hex).y);
  const heroP = s.hero ? toPixel(s.hero) : null;
  return (
    <G>
      {towers.map((t) => {
        const p = toPixel(t.hex);
        return (
          <G key={t.id}>
            {t.flash > 0 && <Circle cx={p.x} cy={p.y} r={0.9} fill="#fff" opacity={t.flash} />}
            <TowerSprite code={t.code} x={p.x} y={p.y} />
            {/* Niveau en chiffres dorés, comme dans le jeu publié. */}
            <SvgText x={p.x} y={p.y + 0.3} fontSize={0.85} fontWeight="900" fill="#ffc21c" stroke="#5a3200" strokeWidth={0.06} textAnchor="middle">
              {t.level}
            </SvgText>
            <SvgText x={p.x} y={p.y + 0.62} fontSize={0.34} fontWeight="900" fill="#ffc21c" stroke="#5a3200" strokeWidth={0.03} textAnchor="middle">
              lvl
            </SvgText>
          </G>
        );
      })}
      {heroP && (
        <G>
          <Felicia x={heroP.x} y={heroP.y} s={1.1} />
          <Shield x={heroP.x} y={heroP.y - 0.4} ratio={s.life / s.maxLife} />
        </G>
      )}
      {s.enemies.map((e) => {
        const def = BESTIARY[e.code];
        const r = def.boss ? 0.62 : 0.36;
        return (
          <G key={e.id}>
            <Beast code={e.code} x={e.x} y={e.y - 0.15} color={def.color} boss={def.boss} converted={e.converted} dir={e.dirX} />
            {!e.converted && (
              <Rect x={e.x - 0.4} y={e.y - r - 0.42} width={0.8 * (e.life / e.maxLife)} height={0.09} fill={e.slowT > 0 ? '#8fd8ff' : '#3fe05a'} />
            )}
          </G>
        );
      })}
      {s.bullets.map((b) => (
        <Circle key={b.id} cx={b.x} cy={b.y} r={0.13} fill={b.color} stroke="#fff" strokeWidth={0.04} />
      ))}
      {s.fx.map((f, i) => {
        const kk = f.t / f.dur;
        if (f.kind === 'text') {
          return (
            <SvgText key={i} x={f.x} y={f.y - kk * 0.6} fontSize={0.5} fontWeight="bold" fill={f.color} opacity={1 - kk} textAnchor="middle" stroke="#000" strokeWidth={0.02}>
              {f.text}
            </SvgText>
          );
        }
        return (
          <Circle key={i} cx={f.x} cy={f.y} r={(f.radius ?? 1) * (0.4 + 0.6 * kk)} fill={f.kind === 'burst' ? f.color : 'none'}
            stroke={f.color} strokeWidth={0.1} opacity={(1 - kk) * (f.kind === 'burst' ? 0.5 : 0.8)} />
        );
      })}
    </G>
  );
}

function Hint({ s, slot, message }: { s: TdState; slot: number | null; message: string | null }) {
  let text = message;
  if (!text) {
    if (s.phase === 'hero') text = 'Choisis la case où Félicia va se placer.';
    else if (s.phase === 'setup' && slot === null) text = 'Choisis une invocation à droite, puis touche une case pour la poser. Flèche « Envoyer » pour lancer la première vague.';
    else if (s.phase === 'setup') text = 'Touche une case libre pour invoquer. Poser la même invocation sur une tour existante augmente son niveau.';
  }
  if (!text) return null;
  return (
    <View style={st.hint} pointerEvents="none">
      <Text style={st.hintText}>{text}</Text>
    </View>
  );
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.hudPanelDark },
  top: {
    height: TOP_H, flexDirection: 'row', alignItems: 'center', gap: 6, paddingLeft: 6,
    backgroundColor: C.hudTop, borderBottomWidth: 2, borderColor: C.hudPanelDark,
  },
  portrait: { width: 32, height: 32, borderRadius: 3, overflow: 'hidden', borderWidth: 1.5, borderColor: '#d8a24a', backgroundColor: '#e8b45a', alignItems: 'center' },
  bagCount: { position: 'absolute', right: -2, bottom: -2, color: '#fff', fontWeight: '900', fontSize: 11, textShadowColor: '#000', textShadowRadius: 2 },
  itemSlot: { width: 26, height: 26, backgroundColor: '#24323b', borderWidth: 1.5, borderColor: '#5d7a86', borderRadius: 2 },
  mapArea: { flex: 1, backgroundColor: '#3e7a2a', overflow: 'hidden' },
  side: { width: SIDE_W, backgroundColor: C.hudPanel, borderLeftWidth: 3, borderColor: C.hudFrame },
  deck: { alignItems: 'center', paddingTop: 4, gap: 2 },
  waveBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 6, paddingVertical: 3,
    backgroundColor: C.hudWave, borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#2a4447',
  },
  waveText: { color: '#fff', fontWeight: '800', fontSize: 13, textShadowColor: '#000', textShadowRadius: 2 },
  info: { flex: 1, backgroundColor: C.hudInfo, padding: 6, gap: 4 },
  sheetName: { color: '#fff', textAlign: 'center', fontSize: 12, marginBottom: 2 },
  sheetRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  sheetVal: { color: '#fff', fontSize: 12, minWidth: 18 },
  nextVal: { color: '#f2c230', fontSize: 11 },
  sheetDesc: { color: '#cfe0e2', fontSize: 10 },
  lvl: { color: '#ffb21c', fontWeight: '900', fontSize: 11, backgroundColor: '#8a3a10', paddingHorizontal: 2, borderRadius: 2 },
  segRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  hint: {
    position: 'absolute', top: 6, left: 8, right: 8, alignSelf: 'center', backgroundColor: 'rgba(20,40,48,0.8)',
    borderRadius: 6, paddingHorizontal: 10, paddingVertical: 5,
  },
  hintText: { color: '#fff', fontSize: 12, textAlign: 'center' },
  popRow: { flexDirection: 'row', gap: 8, marginBottom: 10, flexWrap: 'wrap', justifyContent: 'center' },
  popOn: { backgroundColor: '#f2c230' },
  endLayer: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(10,20,40,0.45)', justifyContent: 'center' },
  endBand: { backgroundColor: 'rgba(30,60,110,0.75)', paddingVertical: 14, alignItems: 'center', gap: 8 },
  endTitle: { color: '#f2b51c', fontSize: 22, fontFamily: SERIF, letterSpacing: 2, textShadowColor: '#000', textShadowRadius: 3 },
  infoBody: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, marginBottom: 12 },
  infoMsg: { color: '#eee', fontSize: 13, flexShrink: 1 },
});
