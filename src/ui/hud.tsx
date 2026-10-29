// Éléments d'interface du combat, d'après la vidéo de 2011 (reference/video-2011-07-11) :
// jauges vie / mana à embouts, emplacements ronds du deck, icônes de la fiche, jauges à 10 segments.

import { ReactNode } from 'react';
import { Platform, Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Polygon, Rect, Stop } from 'react-native-svg';
import { C } from './theme';

export const SERIF = Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia, "Times New Roman", serif' });

/** Jauge horizontale « 100/100 » : réservoir gris, remplissage dégradé, embouts dorés. */
export function HudBar({ value, max, color, width }: { value: number; max: number; color: 'life' | 'mana'; width: number }) {
  const ratio = Math.max(0, Math.min(1, value / max));
  const [top, bottom] = color === 'life' ? ['#ff6a5a', '#b3121c'] : ['#7cc0ff', '#1d54c8'];
  const h = 22;
  const inner = width - 12;
  return (
    <View style={{ width, height: h }}>
      <Svg width={width} height={h}>
        <Defs>
          <LinearGradient id={`g${color}`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={top} />
            <Stop offset="1" stopColor={bottom} />
          </LinearGradient>
          <LinearGradient id="gtank" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#e8eef2" />
            <Stop offset="1" stopColor="#8d99a3" />
          </LinearGradient>
        </Defs>
        <Rect x={4} y={3} width={width - 8} height={h - 6} rx={3} fill="url(#gtank)" stroke="#2b3a44" strokeWidth={1} />
        <Rect x={6} y={5} width={inner * ratio} height={h - 10} rx={2} fill={`url(#g${color})`} />
        <Rect x={6} y={5} width={inner * ratio} height={(h - 10) / 2.6} rx={2} fill="#fff" opacity={0.25} />
        {[0, width - 8].map((x) => (
          <Rect key={x} x={x} y={0} width={8} height={h} rx={2} fill="#e9a23b" stroke="#7a4a12" strokeWidth={1} />
        ))}
      </Svg>
      <Text style={st.barText}>{Math.round(value)}/{max}</Text>
    </View>
  );
}

/** Emplacement rond du deck : bague claire, fond sombre, quantité restante à gauche. */
export function RoundSlot({ size, active, dim, qty, children, onPress }: {
  size: number; active?: boolean; dim?: boolean; qty?: number; children?: ReactNode; onPress?: () => void;
}) {
  return (
    <Pressable onPress={onPress} disabled={!onPress} style={{ width: size + 12, height: size + 4, alignItems: 'center', justifyContent: 'center' }}>
      <View
        style={[
          st.ring,
          { width: size, height: size, borderRadius: size / 2 },
          active && { borderColor: C.gold, shadowColor: C.gold, shadowOpacity: 0.9, shadowRadius: 6 },
          dim && { opacity: 0.5 },
        ]}
      >
        {children}
      </View>
      {qty !== undefined && <Text style={st.qty}>{qty}</Text>}
    </Pressable>
  );
}

type IconName = 'heart' | 'sword' | 'star' | 'upstar' | 'bolt' | 'range' | 'speed' | 'physic' | 'magic' | 'up';

/** Petites icônes de la fiche (cœur, épée, étoile, éclair, loupe, boucliers). */
export function HudIcon({ name, size = 16 }: { name: IconName; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20">
      {name === 'heart' && <Path d="M10 17 L3 10 A4 4 0 0 1 10 4.5 A4 4 0 0 1 17 10 Z" fill="#e3222f" stroke="#7a0b12" strokeWidth={1} />}
      {name === 'sword' && (
        <>
          <Path d="M15 2 L18 5 L8 15 L5 12 Z" fill="#cfd8de" stroke="#56636b" strokeWidth={0.8} />
          <Path d="M4 11 L9 16 M6 14 L3 17" stroke="#8a5a2a" strokeWidth={2.4} strokeLinecap="round" />
        </>
      )}
      {(name === 'star' || name === 'upstar') && (
        <Polygon points="11,2 13.4,7.6 19,8 14.6,11.8 16,17.6 11,14.4 6,17.6 7.4,11.8 3,8 8.6,7.6" fill="#2d6fe0" stroke="#e9f1ff" strokeWidth={1} />
      )}
      {name === 'upstar' && <Path d="M4 1 L7 5 L5 5 L5 8 L3 8 L3 5 L1 5 Z" fill="#f2c230" stroke="#7a5a10" strokeWidth={0.5} />}
      {name === 'up' && <Path d="M10 2 L17 10 L13 10 L13 18 L7 18 L7 10 L3 10 Z" fill="#f2c230" stroke="#7a5a10" strokeWidth={1} />}
      {name === 'bolt' && <Path d="M12 1 L4 11 L9 11 L7 19 L16 8 L11 8 Z" fill="#7fd2ff" stroke="#1d5f9a" strokeWidth={1} />}
      {name === 'range' && (
        <>
          <Circle cx={12} cy={8} r={5} fill="#bfe7ff" stroke="#e08a1c" strokeWidth={2} />
          <Path d="M8 12 L3 17" stroke="#e08a1c" strokeWidth={3} strokeLinecap="round" />
        </>
      )}
      {name === 'speed' && (
        <>
          <Path d="M3 15 Q8 4 17 3 Q12 10 6 17 Z" fill="#f2c230" stroke="#7a5a10" strokeWidth={0.8} />
          <Path d="M2 18 L8 12" stroke="#2d6fe0" strokeWidth={2} />
        </>
      )}
      {(name === 'physic' || name === 'magic') && (
        <Path d="M10 2 L17 4.5 Q17 13 10 18.5 Q3 13 3 4.5 Z" fill={name === 'physic' ? '#d8222f' : '#2d74d8'} stroke="#1a1a1a" strokeWidth={0.8} />
      )}
    </Svg>
  );
}

/** Jauge à 10 segments jaunes (vitesse, armures). */
export function Segments({ value }: { value: number }) {
  const n = Math.max(0, Math.min(10, Math.round(value)));
  return (
    <View style={{ flexDirection: 'row', gap: 1.5 }}>
      {Array.from({ length: 10 }).map((_, i) => (
        <View key={i} style={{ width: 5, height: 8, backgroundColor: i < n ? '#f2c230' : '#4d6669', borderRadius: 1 }} />
      ))}
    </View>
  );
}

/** Bouton argenté en petites capitales (« RETOUR CARTE », « OK », « Options »). */
export function SilverBtn({ label, onPress, style }: { label: string; onPress: () => void; style?: ViewStyle }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [st.silver, pressed && { opacity: 0.8 }, style]}>
      <Text style={st.silverText}>{label}</Text>
    </Pressable>
  );
}

/** Fenêtre sombre à bandeau de titre doré (« Information ! »). */
export function InfoWindow({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={st.infoLayer}>
      <View style={st.infoWin}>
        <View style={st.infoHead}>
          <Text style={st.infoTitle}>{title}</Text>
        </View>
        {children}
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  barText: {
    ...StyleSheet.absoluteFill, textAlign: 'center', color: '#fff', fontWeight: '700', fontSize: 11, lineHeight: 22,
    textShadowColor: '#000', textShadowRadius: 2, textShadowOffset: { width: 0, height: 1 },
  },
  ring: { backgroundColor: '#2c4448', borderWidth: 3, borderColor: '#9ec3c6', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  qty: {
    position: 'absolute', left: 0, bottom: 2, color: '#fff', fontWeight: '900', fontSize: 15,
    textShadowColor: '#000', textShadowRadius: 3,
  },
  silver: {
    backgroundColor: '#c9d3dc', borderRadius: 3, borderWidth: 1, borderColor: '#5c6a76', paddingHorizontal: 12, paddingVertical: 4,
    alignItems: 'center',
  },
  silverText: { color: '#2b3a4a', fontWeight: '800', fontSize: 11, letterSpacing: 1, fontFamily: SERIF },
  infoLayer: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center' },
  infoWin: {
    width: '80%', maxWidth: 520, backgroundColor: '#262626', borderTopWidth: 2, borderBottomWidth: 2, borderColor: '#111',
    paddingBottom: 14, alignItems: 'center',
  },
  infoHead: { alignSelf: 'stretch', margin: 12, borderWidth: 1, borderColor: '#c8c8c8', backgroundColor: '#2e2e2e', paddingVertical: 2 },
  infoTitle: { color: '#f2b51c', fontWeight: '800', textAlign: 'center', fontSize: 13 },
});
