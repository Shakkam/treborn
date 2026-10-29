import { ReactNode, useEffect, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import Svg from 'react-native-svg';
import { TOWERS } from '../data/towers';
import { Line, SPEAKERS } from '../data/tuttho';
import { FeliciaPortrait, Pairle, Rock } from './glyphs';
import { SERIF } from './hud';
import { C } from './theme';

export function Btn({ label, onPress, disabled, color = C.red, style, small }: {
  label: string; onPress: () => void; disabled?: boolean; color?: string; style?: ViewStyle; small?: boolean;
}) {
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      style={({ pressed }) => [
        styles.btn, small && styles.btnSmall, { backgroundColor: color, opacity: disabled ? 0.4 : pressed ? 0.8 : 1 }, style,
      ]}
    >
      <Text style={[styles.btnText, small && { fontSize: 12 }]}>{label}</Text>
    </Pressable>
  );
}

export function Bar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const ratio = Math.max(0, Math.min(1, value / max));
  return (
    <View style={{ marginBottom: 6 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={styles.barLabel}>{label}</Text>
        <Text style={styles.barLabel}>{Math.floor(value)}</Text>
      </View>
      <View style={styles.barBg}>
        <View style={[styles.barFill, { width: `${ratio * 100}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

export function TowerIcon({ code, size = 40 }: { code: string; size?: number }) {
  const def = TOWERS[code];
  if (def.sprite) return <Image source={def.sprite} style={{ width: size * 0.86, height: size }} resizeMode="contain" />;
  return (
    <Svg width={size} height={size} viewBox="-1 -1 2 2">
      {code === 'onzerock' ? <Rock x={0} y={0} /> : null}
    </Svg>
  );
}

export function Panel({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return <View style={[styles.panel, style]}>{children}</View>;
}

function Portrait({ who }: { who: Line['who'] }) {
  const sp = SPEAKERS[who];
  if (who === 'F') return <FeliciaPortrait size={120} />;
  if (who === 'P') return <Svg width={110} height={100} viewBox="-1 -0.95 2 1.7"><Pairle x={0} y={0} /></Svg>;
  return (
    <View style={[styles.portrait, { backgroundColor: sp.color }]}>
      <Text style={styles.portraitLetter}>{sp.name[0]}</Text>
    </View>
  );
}

/**
 * Bulle de dialogue du jeu publié (vidéo de 2011) : grand portrait qui déborde à gauche, nom en doré,
 * texte qui s'écrit lettre par lettre, « SUITE » sous la bulle. Un toucher termine la ligne, le suivant avance.
 */
export function Dialogue({ lines, onDone }: { lines: Line[]; onDone: () => void }) {
  const [i, setI] = useState(0);
  const [shown, setShown] = useState(0);
  const line = lines[i];
  const done = shown >= line.text.length;
  useEffect(() => {
    if (done) return;
    const t = setTimeout(() => setShown((n) => n + 2), 25);
    return () => clearTimeout(t);
  }, [done, shown]);
  const next = () => {
    if (!done) return setShown(line.text.length);
    setShown(0);
    if (i + 1 < lines.length) setI(i + 1);
    else onDone();
  };
  return (
    <Pressable style={styles.dialogueLayer} onPress={next}>
      <View style={styles.dialogueWrap}>
        <View style={styles.dialogueBox}>
          <View style={{ width: 96 }} />
          <View style={{ flex: 1 }}>
            <Text style={styles.dialogueName}>{SPEAKERS[line.who].name}</Text>
            <Text style={styles.dialogueText}>{line.text.slice(0, shown)}</Text>
          </View>
        </View>
        <View style={styles.dialoguePortrait} pointerEvents="none"><Portrait who={line.who} /></View>
        <Text style={styles.dialogueNext}>SUITE</Text>
      </View>
    </Pressable>
  );
}

export const styles = StyleSheet.create({
  btn: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 6, borderWidth: 2, borderColor: 'rgba(0,0,0,0.35)', alignItems: 'center' },
  btnSmall: { paddingHorizontal: 10, paddingVertical: 5 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  barLabel: { color: C.text, fontSize: 11, fontWeight: '700' },
  barBg: { height: 10, backgroundColor: '#111', borderRadius: 3, overflow: 'hidden' },
  barFill: { height: '100%' },
  panel: { backgroundColor: C.panel, borderRadius: 8, borderWidth: 2, borderColor: C.panelDark, padding: 8 },
  portrait: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginRight: 12, borderWidth: 3, borderColor: '#fff' },
  portraitLetter: { fontSize: 28, fontWeight: '800', color: '#fff' },
  dialogueLayer: { ...StyleSheet.absoluteFill, justifyContent: 'center', padding: 12, backgroundColor: 'rgba(0,0,0,0.15)' },
  dialogueWrap: { maxWidth: 680, width: '100%', alignSelf: 'center', paddingTop: 40 },
  dialogueBox: {
    flexDirection: 'row', minHeight: 92, backgroundColor: C.dialogBg, borderWidth: 2, borderColor: C.dialogBorder,
    paddingVertical: 10, paddingRight: 14,
  },
  dialoguePortrait: { position: 'absolute', left: -6, bottom: 0 },
  dialogueName: { color: '#f2b51c', fontWeight: '700', fontSize: 15, fontFamily: SERIF },
  dialogueText: { color: '#fff', fontSize: 15, marginTop: 4 },
  dialogueNext: { color: '#f2c230', fontWeight: '900', fontSize: 13, alignSelf: 'flex-end', marginTop: 4, letterSpacing: 1, textShadowColor: '#000', textShadowRadius: 3 },
});
