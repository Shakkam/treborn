// Île tuto Tuttho. Dialogues : input/[TQ] dialogues.docx (section "TUTTHO // FINIE").
// Le tracé de l'île est reconstitué (couloir de 2 cases au départ, comme dans campagne.odt).

import type { Biome } from './bestiary';
import { Hex, key, neighbors } from '../engine/hex';
import { makeRng } from '../engine/rng';

export type Speaker = 'P' | 'F' | 'D' | 'N' | 'L' | 'T';

export const SPEAKERS: Record<Speaker, { name: string; color: string }> = {
  P: { name: 'Pairle', color: '#7fd36b' },
  F: { name: 'Félicia', color: '#ff7eb6' },
  D: { name: 'Dumbledargent', color: '#c9c9d6' },
  N: { name: 'Un camarade', color: '#7fb8ff' },
  L: { name: 'Léthale', color: '#5a4a6e' },
  T: { name: 'Toualite', color: '#2a2a33' },
};

export interface Line {
  who: Speaker;
  text: string;
}

export type Reward =
  | { kind: 'tower'; code: string }
  | { kind: 'potion'; potion: 'vie' | 'mana' }
  | { kind: 'slot' }
  | { kind: 'gold'; amount: number }
  | { kind: 'end' };

export interface Etape {
  hex: Hex;
  reward: Reward;
  boss?: string;
  dialogue: Line[];
}

export interface IslandTile {
  hex: Hex;
  biome: Biome;
  difficulty: number;
  nbVagues: number;
  seed: number;
  bestiaire: string[];
  etape?: number;
}

export interface Island {
  id: string;
  name: string;
  start: Hex;
  startTowers: string[];
  startSlots: number;
  intro: Line[];
  etapes: Etape[];
  tiles: Map<string, IslandTile>;
}

const h = (q: number, r: number): Hex => ({ q, r });

const PATH: Hex[] = [
  h(0, 0), h(1, 0), h(2, 0), h(3, 0), h(4, -1), h(5, -1), h(5, 0), h(6, 0), h(7, 0),
  h(7, 1), h(7, 2), h(6, 3), h(5, 3), h(4, 3), h(3, 3), h(2, 3), h(2, 2), h(1, 2),
];

const ETAPES: Etape[] = [
  {
    hex: h(2, 0),
    reward: { kind: 'tower', code: 'raidboule' },
    dialogue: [
      { who: 'P', text: 'Félicitation Félicia ! Tu possèdes désormais l\'invocation "Raidboule" !' },
      { who: 'F', text: 'Ouais ! Cool ! Chouette ! Et ça tape fort ?' },
      { who: 'P', text: 'Oui, équipe-la en consultant ton grimoire avant de commencer une nouvelle bataille.' },
      { who: 'P', text: 'Tu devras arriver à l\'invoquer correctement pour réussir la prochaine épreuve.' },
    ],
  },
  {
    hex: h(5, -1),
    reward: { kind: 'potion', potion: 'vie' },
    dialogue: [
      { who: 'F', text: 'Par Oniris ! Un Onguent à la fleur de l\'Oréliane !' },
      { who: 'P', text: 'NOooN ! Mais enfin ! C\'est une potion de vie !' },
      { who: 'F', text: 'Pairle, tu sais bien que je plaisante...' },
      { who: 'P', text: '…' },
      { who: 'F', text: 'Je sais bien que ce breuvage permet de restaurer ma vie lors d\'un combat...' },
      { who: 'P', text: 'Je l\'ai rangée dans ton sac à dos, que tu trouveras dans ton inventaire.' },
    ],
  },
  {
    hex: h(7, 0),
    reward: { kind: 'tower', code: 'onzerock' },
    dialogue: [
      { who: 'P', text: 'Yeepee ! Encore une brillante victoire ! Oh ! Une super invocation : Onzherock. Tu m\'en diras des nouvelles !' },
      { who: 'F', text: 'Elle tire des cailloux affûtés ou des gros rochers contondants ?' },
      { who: 'P', text: 'Ni l\'un ni l\'autre… Son intérêt n\'est pas offensif, mais purement stratégique tu vois en... Enfin, tu verras bien…' },
      { who: 'P', text: 'Par contre, tu ne peux pas transporter tes 3 invocations en même temps : tu n\'as pas assez de place dans ton deck. Tu trouveras un emplacement supplémentaire à la prochaine étape.' },
    ],
  },
  {
    hex: h(6, 3),
    reward: { kind: 'slot' },
    dialogue: [
      { who: 'P', text: 'Bravo ! Tu viens de trouver un emplacement ! Celui-ci te permet d\'emporter une invocation supplémentaire dans ton deck !' },
      { who: 'F', text: 'J\'y accède depuis mon grimoire ?' },
      { who: 'P', text: 'Oui ! Bravo tu comprends vite !' },
      { who: 'F', text: 'Oui, merci, il faut juste m\'expliquer longtemps !' },
      { who: 'P', text: 'Allons, nous arrivons bientôt à l\'école !' },
    ],
  },
  {
    hex: h(3, 3),
    reward: { kind: 'gold', amount: 100 },
    dialogue: [
      { who: 'F', text: 'Pairle ! J\'ai trouvé des pièces ! Elles sont très lourdes !' },
      { who: 'P', text: 'Ce sont des Golds ! Tu peux les dépenser soit dans la boutique, soit en améthystes (+ de parties).' },
      { who: 'F', text: 'Ah, c\'est vrai, dixit Dumbledargent : "pas d\'améthyste, pas de combat !"' },
      { who: 'P', text: 'Fonçons vers la dernière étape ! Tu pourras gagner l\'invocation ultime, "apocalypse totale". Elle doit être forte avec un nom pareil ! Mais méfie-toi, j\'ai un mauvais pressentiment...' },
    ],
  },
  {
    hex: h(1, 2),
    reward: { kind: 'end' },
    boss: 'guivre',
    dialogue: [
      { who: 'D', text: 'Félicitation à vous tous ! Vous n\'êtes que 3 à avoir réussi l\'épreuve !' },
      { who: 'N', text: 'J\'ai eu beaucoup de chance...' },
      { who: 'L', text: 'Et bien c\'est déjà fini ? Quelle promenade soporifique...' },
      { who: 'F', text: 'Merci à vous pour votre enseignement. Que gagne-t-on au final ?' },
      { who: 'D', text: 'Point d\'impatience ! Il faut mériter l\'invocation ultime, seul l\'un d\'entre vous l\'aura...' },
      { who: 'L', text: 'Et ça sera moi ! Toualite empare-toi de cette tour surpuissante et dominons Onirica ! HAHAHA !' },
      { who: 'T', text: 'Owiiii maîtreeeeesse, vos désiiiirs sont des oooordres ! Allooons vite sur l\'île de la Moooort...' },
      { who: 'L', text: 'Silence idiot ! Envole-toi vite !' },
      { who: 'N', text: 'Arrêtez-la, elle s\'enfuit avec la tour ! Son blob noir peut voler, on ne peut rien faire ?' },
      { who: 'D', text: 'C\'est une catastrophe ! Il faut la rattraper. Je vais tenter de l\'attrap… Envoyer notre armée pour la retrouver et ramener ce qu\'elle a volé.' },
      { who: 'D', text: 'Mes jeunes élèves, vous n\'avez pas encore assez d\'expérience pour combattre avec nous. Allez au port et prenez le bateau.' },
      { who: 'D', text: 'Il y a de nombreuses îles sur Onirica qui recèlent de nombreux pouvoirs. Regroupez ces pouvoirs afin de retrouver Léthale !' },
      { who: 'F', text: 'Enfin, de l\'action ! Léthale n\'a qu\'à profiter de son sursis, nous la retrouverons ! Mes amis, soyez courageux !' },
    ],
  },
];

const INTRO: Line[] = [
  { who: 'P', text: 'Bonjour Félicia !' },
  { who: 'F', text: 'Par Oniris !! Un blob qui parle !' },
  { who: 'P', text: '£µ=*%* !!' },
  { who: 'F', text: 'Héhé, je plaisante, Bonjour Pairle !' },
  { who: 'P', text: 'Félicia, sois sérieuse ! Les yeux des mages de la Haute Université des Invocateurs de Tours et Révocateurs Élémentaires sont rivés sur toi !' },
  { who: 'P', text: 'Aujourd\'hui tu passes le diplôme des Tours Usagées pour Titre Onirifique, ne les déçois pas cette fois !' },
  { who: 'F', text: 'Hahaha, quel rabat-joie, tu t\'es levé de l\'aile gauche ?' },
  { who: 'P', text: 'Sigh… Ta mission est de rejoindre le premier drapeau, une nouvelle invocation de tour nous y attend, hâtons-nous !' },
];

// Monstres du tuto : "scarabée, taupe, termite (des monstres de merdes)".
const TUTO_BESTIAIRE = ['scarabee', 'taupe', 'termite'];

function buildTiles(): Map<string, IslandTile> {
  const rng = makeRng(2011);
  const tiles = new Map<string, IslandTile>();
  const pathIndex = new Map(PATH.map((p, i) => [key(p), i]));
  const corridor = new Set([key(PATH[0]), key(PATH[1])]);

  const add = (hex: Hex, depth: number) => {
    if (tiles.has(key(hex))) return;
    const etape = ETAPES.findIndex((e) => key(e.hex) === key(hex));
    const difficulty = depth < 10 ? 1 : 2;
    tiles.set(key(hex), {
      hex,
      biome: rng() < 0.3 ? 'forest' : 'plain',
      difficulty,
      nbVagues: Math.min(5, 3 + Math.floor(depth / 7)),
      seed: Math.floor(rng() * 1e9),
      bestiaire: TUTO_BESTIAIRE,
      etape: etape >= 0 ? etape : undefined,
    });
  };

  PATH.forEach((p, i) => add(p, i));
  // Le reste de l'île : cases voisines du parcours, hors couloir de départ.
  PATH.forEach((p, i) => {
    if (corridor.has(key(p)) || i < 2) return;
    for (const n of neighbors(p)) {
      if (pathIndex.has(key(n)) || corridor.has(key(n))) continue;
      if (neighbors(n).some((m) => corridor.has(key(m)))) continue;
      if (rng() < 0.75) add(n, i + 1);
    }
  });
  return tiles;
}

export const TUTTHO: Island = {
  id: 'tuttho',
  name: 'Tuttho',
  start: PATH[0],
  startTowers: ['balisto'],
  startSlots: 2,
  intro: INTRO,
  etapes: ETAPES,
  tiles: buildTiles(),
};
