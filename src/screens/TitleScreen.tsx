import { StyleSheet, Text, View } from 'react-native';
import Svg from 'react-native-svg';
import { Btn } from '../ui/components';
import { Felicia, Pairle } from '../ui/glyphs';
import { C } from '../ui/theme';

export function TitleScreen({ canContinue, onContinue, onNew }: {
  canContinue: boolean; onContinue: () => void; onNew: () => void;
}) {
  return (
    <View style={st.root}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
        <Svg width={90} height={110} viewBox="-1 -1.3 2 2.2"><Felicia x={0} y={0} /></Svg>
        <View style={{ alignItems: 'center', marginHorizontal: 18 }}>
          <Text style={st.title}>Tower Quest</Text>
          <Text style={st.subtitle}>Les aventures de Félicia à travers Onirica</Text>
        </View>
        <Svg width={80} height={80} viewBox="-1 -1 2 2"><Pairle x={0} y={0.1} /></Svg>
      </View>
      <View style={{ marginTop: 30, gap: 10, width: 240 }}>
        {canContinue && <Btn label="Continuer" onPress={onContinue} />}
        <Btn label={canContinue ? 'Nouvelle partie' : 'Jouer'} onPress={onNew} color={canContinue ? C.cardDark : C.red} />
      </View>
      <Text style={st.footer}>Recréation du jeu Carpeludem (2011)</Text>
    </View>
  );
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.ocean, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 54, fontWeight: '900', color: C.cream, textShadowColor: '#1d2838', textShadowRadius: 8, textShadowOffset: { width: 2, height: 3 } },
  subtitle: { color: '#fff', fontSize: 14, fontWeight: '600', textShadowColor: '#035', textShadowRadius: 3 },
  footer: { position: 'absolute', bottom: 10, color: '#e6f6ff', fontSize: 11 },
});
