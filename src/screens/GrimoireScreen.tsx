// Grimoire : consultation des tours et construction du deck (cf. [cdcf] Grimoire).

import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { TOWERS, TowerDef } from '../data/towers';
import { Progress } from '../game/progress';
import { Btn, TowerIcon } from '../ui/components';
import { C } from '../ui/theme';

type Filter = 'all' | 'dmg' | 'aoe' | 'buff' | 'debuff' | 'locked';

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'all' }, { id: 'dmg', label: 'dmg' }, { id: 'aoe', label: 'AoE' },
  { id: 'buff', label: 'buff' }, { id: 'debuff', label: 'debuff' }, { id: 'locked', label: 'Locked' },
];

function category(d: TowerDef): Filter {
  if (d.target === 'tower') return 'buff';
  if (d.effectSuccess > 0) return 'debuff';
  if (d.bulletType === 'zone' || d.bulletType === 'distance:zone') return 'aoe';
  return 'dmg';
}

export function GrimoireScreen({ progress, onChange, onClose }: {
  progress: Progress; onChange: (p: Progress) => void; onClose: () => void;
}) {
  const [filter, setFilter] = useState<Filter>('all');
  const owned = new Set(progress.towers);
  const list = Object.values(TOWERS).filter((d) => {
    if (filter === 'locked') return !owned.has(d.code);
    if (!owned.has(d.code)) return false;
    return filter === 'all' || category(d) === filter;
  });

  const addToDeck = (code: string) => {
    const i = progress.deck.indexOf(null);
    if (i < 0) return;
    const deck = [...progress.deck];
    deck[i] = code; // une même invocation peut occuper plusieurs slots ([GamePlay] Deck)
    onChange({ ...progress, deck });
  };
  const removeFromDeck = (i: number) => {
    const deck = [...progress.deck];
    deck[i] = null;
    onChange({ ...progress, deck });
  };

  return (
    <View style={st.root}>
      <View style={{ flex: 1, padding: 10 }}>
        <View style={st.header}>
          <Text style={st.title}>GRIMOIRE</Text>
          {FILTERS.map((f) => (
            <Pressable key={f.id} onPress={() => setFilter(f.id)} style={[st.filter, filter === f.id && st.filterOn]}>
              <Text style={st.filterText}>{f.label}</Text>
            </Pressable>
          ))}
        </View>
        <ScrollView contentContainerStyle={st.grid}>
          {list.map((d) => {
            const locked = !owned.has(d.code);
            return (
              <Pressable key={d.code} onPress={() => !locked && addToDeck(d.code)} style={[st.card, locked && { opacity: 0.45 }]}>
                <Text style={st.cardTitle}>{locked ? '???' : d.name.toUpperCase()}</Text>
                <View style={st.cardBody}>
                  <View style={st.orb}>{!locked && <TowerIcon code={d.code} size={44} />}</View>
                  <View style={{ flex: 1 }}>
                    <Text style={st.stat}>Mana : {d.manaCost}</Text>
                    <Text style={st.stat}>Range : {d.rangeMax ? (d.rangeMin === d.rangeMax ? d.rangeMax : `${d.rangeMin}-${d.rangeMax}`) : '-'}</Text>
                    <Text style={st.stat}>Dmg : {d.dgtMax ? `${d.dgtMin}-${d.dgtMax}` : '-'}</Text>
                    <Text style={st.stat}>Firerate : {d.fireRate || '-'}</Text>
                    <Text style={st.stat} numberOfLines={2}>Special : {locked ? 'à débloquer sur une île' : d.description}</Text>
                  </View>
                </View>
              </Pressable>
            );
          })}
          {!list.length && <Text style={st.empty}>Aucune tour dans cette catégorie.</Text>}
        </ScrollView>
      </View>

      <View style={st.deck}>
        <Text style={st.deckTitle}>Deck 1</Text>
        <Btn label="vider" onPress={() => onChange({ ...progress, deck: progress.deck.map(() => null) })} color={C.cardDark} small />
        <Text style={st.hint}>Touche une tour pour l’ajouter, un slot pour la retirer. Chaque slot = 5 invocations.</Text>
        <View style={st.slots}>
          {progress.deck.map((code, i) => (
            <Pressable key={i} onPress={() => code && removeFromDeck(i)} style={st.slot}>
              {code ? <TowerIcon code={code} size={46} /> : null}
            </Pressable>
          ))}
        </View>
        <View style={{ flex: 1 }} />
        <Btn label="Retour à l'île" onPress={onClose} />
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  root: { flex: 1, flexDirection: 'row', backgroundColor: C.panelDark },
  header: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8, flexWrap: 'wrap' },
  title: { color: C.cream, fontSize: 24, fontWeight: '900', letterSpacing: 2, marginRight: 10 },
  filter: { backgroundColor: '#2f6b4a', borderRadius: 5, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: '#0006' },
  filterOn: { backgroundColor: C.red },
  filterText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  card: { width: 220, backgroundColor: C.card, borderRadius: 6, borderWidth: 2, borderColor: C.cardDark, overflow: 'hidden' },
  cardTitle: { backgroundColor: C.cardTitle, color: C.cream, fontWeight: '800', paddingHorizontal: 6, paddingVertical: 3, fontSize: 13 },
  cardBody: { flexDirection: 'row', padding: 6, alignItems: 'center' },
  orb: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#33465f', borderWidth: 3, borderColor: '#8fa3bd', alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  stat: { color: '#fff', fontSize: 11 },
  empty: { color: C.muted, padding: 10 },
  deck: { width: 200, backgroundColor: C.panel, padding: 10, borderLeftWidth: 2, borderColor: '#000' },
  deckTitle: { color: C.cream, fontWeight: '900', fontSize: 18, marginBottom: 6, textAlign: 'center' },
  hint: { color: C.muted, fontSize: 11, marginVertical: 8 },
  slots: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  slot: { width: 62, height: 62, borderRadius: 31, backgroundColor: '#33465f', borderWidth: 3, borderColor: '#8fa3bd', alignItems: 'center', justifyContent: 'center' },
});
