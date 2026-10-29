import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { TUTTHO, IslandTile, Line } from './src/data/tuttho';
import { TdConfig } from './src/engine/td';
import { key } from './src/engine/hex';
import {
  Progress, QTY_PER_SLOT, applyReward, heroLevel, loadProgress, newProgress, saveProgress,
} from './src/game/progress';
import { GrimoireScreen } from './src/screens/GrimoireScreen';
import { LoadingScreen } from './src/screens/LoadingScreen';
import { IslandScreen } from './src/screens/IslandScreen';
import { TdResult, TdScreen } from './src/screens/TdScreen';
import { TitleScreen } from './src/screens/TitleScreen';
import { Dialogue } from './src/ui/components';

type Scene =
  | { id: 'loading' }
  | { id: 'title' }
  | { id: 'island' }
  | { id: 'grimoire' }
  | { id: 'td'; tile: IslandTile; config: TdConfig };

const island = TUTTHO;

export default function App() {
  const [scene, setScene] = useState<Scene>({ id: 'loading' });
  const [progress, setProgressState] = useState<Progress | null>(null);
  const [dialogue, setDialogue] = useState<Line[] | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const minDelay = new Promise((res) => setTimeout(res, 900));
    Promise.all([loadProgress(), minDelay]).then(([p]) => {
      setProgressState(p);
      setScene({ id: 'title' });
    });
  }, []);

  // Comme dans le jeu publié, l'écran « Carpe Ludem » s'intercale à l'entrée et à la sortie d'un combat.
  const transition = (then: () => void) => {
    setLoading(true);
    setTimeout(() => {
      then();
      setLoading(false);
    }, 700);
  };

  const setProgress = (p: Progress) => {
    setProgressState(p);
    saveProgress(p);
  };

  const newGame = () => {
    const p = { ...newProgress(island), introSeen: true };
    setProgress(p);
    setScene({ id: 'island' });
    setDialogue(island.intro);
  };

  const attack = (tile: IslandTile) => {
    if (!progress) return;
    const deck = progress.deck.filter((c): c is string => !!c).map((code) => ({ code, qty: QTY_PER_SLOT }));
    if (!deck.length) {
      setDialogue([{ who: 'P', text: 'Ton deck est vide ! Passe par le grimoire pour y placer tes invocations.' }]);
      return;
    }
    const etape = tile.etape !== undefined ? island.etapes[tile.etape] : undefined;
    transition(() => setScene({
      id: 'td',
      tile,
      config: {
        seed: tile.seed,
        biome: tile.biome,
        difficulty: tile.difficulty,
        nbVagues: tile.nbVagues,
        bestiaire: tile.bestiaire,
        boss: etape?.boss,
        deck,
        heroLevel: heroLevel(progress),
        potions: progress.potions,
      },
    }));
  };

  const endTd = (tile: IslandTile, r: TdResult) => {
    if (!progress) return;
    let p: Progress = {
      ...progress,
      potions: { vie: progress.potions.vie - r.potionsUsed.vie, mana: progress.potions.mana - r.potionsUsed.mana },
    };
    let lines: Line[] | null = null;
    if (r.won) {
      const k = key(tile.hex);
      p = {
        ...p,
        gold: p.gold + r.gold,
        hero: k,
        conquered: p.conquered.includes(k) ? p.conquered : [...p.conquered, k],
        perfect: r.perfect && !p.perfect.includes(k) ? [...p.perfect, k] : p.perfect,
      };
      if (tile.etape !== undefined && tile.etape === p.etape) {
        const etape = island.etapes[tile.etape];
        p = { ...applyReward(p, etape.reward), etape: p.etape + 1 };
        lines = etape.dialogue;
      }
    }
    setProgress(p);
    transition(() => {
      setScene({ id: 'island' });
      if (lines) setDialogue(lines);
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <StatusBar hidden />
      {scene.id === 'title' && (
        <TitleScreen canContinue={!!progress} onContinue={() => setScene({ id: 'island' })} onNew={newGame} />
      )}
      {scene.id === 'island' && progress && (
        <IslandScreen
          island={island}
          progress={progress}
          onMove={(h) => setProgress({ ...progress, hero: key(h) })}
          onAttack={attack}
          onGrimoire={() => setScene({ id: 'grimoire' })}
          onMenu={() => setScene({ id: 'title' })}
        />
      )}
      {scene.id === 'grimoire' && progress && (
        <GrimoireScreen progress={progress} onChange={setProgress} onClose={() => setScene({ id: 'island' })} />
      )}
      {scene.id === 'td' && (
        <TdScreen
          key={key(scene.tile.hex)}
          config={scene.config}
          title={scene.tile.etape !== undefined ? `Étape ${scene.tile.etape + 1}` : 'Territoire'}
          onExit={(r) => endTd(scene.tile, r)}
        />
      )}
      {(scene.id === 'loading' || loading) && <LoadingScreen />}
      {dialogue && !loading && <Dialogue key={dialogue[0].text} lines={dialogue} onDone={() => setDialogue(null)} />}
    </View>
  );
}
