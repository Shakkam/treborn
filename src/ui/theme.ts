// Palette reprise des maquettes d'époque (grimoire bleu ardoise, archipel océan, titres crème).

export const C = {
  ocean: '#14b4ec',
  oceanLine: '#0f8fc0',
  panel: '#2b3a4f',
  panelDark: '#1d2838',
  card: '#5b7fa6',
  cardDark: '#3e5a7c',
  cardTitle: '#33465f',
  cream: '#ffffcc',
  text: '#eef3fa',
  muted: '#a9b8cc',
  red: '#b3192b',
  gold: '#ffd34d',
  life: '#2fa84f',
  mana: '#2a6cf0',
  sepia: '#b49c74',
  sepiaLine: '#8f7a57',
  grass: '#4fae3c',
  grassLine: '#2f7d25',
  forest: '#3a8a3a',
  highlight: '#fff48a',
  pink: '#ff7eb6',
  // Interface du jeu publié (couleurs relevées sur la vidéo de 2011).
  hudTop: '#416b7b',
  hudPanel: '#3c686c',
  hudPanelDark: '#2e4d54',
  hudFrame: '#51808a',
  hudWave: '#5f9093',
  hudInfo: '#2e494c',
  islandOcean: '#2695cb',
  islandFog: '#47666d',
  dialogBg: '#3f5272',
  dialogBorder: '#c9d3e6',
  parchment: '#f6eed7',
};

// grassTint : biomes posés sur la texture gazon d'origine, teintée de `fill` à cette opacité.
export const BIOME_COLORS: Record<string, { fill: string; line: string; deco: string; grassTint?: number }> = {
  plain: { fill: '#7ccf4d', line: '#5aa63a', deco: '#3f8a2c', grassTint: 0 },
  forest: { fill: '#3f8a2c', line: '#468a2e', deco: '#2d6b22', grassTint: 0.35 },
  mountain: { fill: '#a39a86', line: '#857c6a', deco: '#6b6457' },
  swamp: { fill: '#4f6f4a', line: '#56734a', deco: '#3c6a7a', grassTint: 0.5 },
  jungle: { fill: '#1f6a2a', line: '#2f7a38', deco: '#1f5a28', grassTint: 0.45 },
  beach: { fill: '#f0d98a', line: '#d4bb6a', deco: '#a8916a' },
};

export const BIOME_NAMES: Record<string, string> = {
  plain: 'Plaine', forest: 'Forêt', mountain: 'Montagne', swamp: 'Marais', jungle: 'Jungle', beach: 'Plage',
};
