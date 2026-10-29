// Écran de chargement du jeu publié (vidéo de 2011) : « CARPE LUDEM / Chargement des données ».

import { StyleSheet, Text, View } from 'react-native';
import { SERIF } from '../ui/hud';

export function LoadingScreen() {
  return (
    <View style={st.root}>
      <Text style={st.studio}>CARPE  LUDEM</Text>
      <Text style={st.sub}>CHARGEMENT  DES  DONNÉES</Text>
    </View>
  );
}

const st = StyleSheet.create({
  root: { ...StyleSheet.absoluteFill, backgroundColor: '#444b57', alignItems: 'center', justifyContent: 'center' },
  studio: { color: '#e8eaee', fontSize: 22, letterSpacing: 6, fontFamily: SERIF },
  sub: { color: '#c9ccd2', fontSize: 9, letterSpacing: 4, marginTop: 4 },
});
