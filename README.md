# Tower Quest — reborn

Recréation en React Native (Expo) de **Tower Quest** (aka TD-RPG), le tower defense / deck building
de Carpeludem publié sur Muxxu en 2011. On suit la **version publiée (alpha/beta Muxxu)** :
archipel d'Onirica, îles à scénario, grimoire et deck, invocations en quantité limitée, potions.

## Lancer

```bash
npm install
npx expo start          # puis "w" pour le web, ou Expo Go / build de dev sur mobile
```

Le jeu est en paysage. La progression est sauvegardée en local (AsyncStorage).

## Contenu actuel : l'île tuto Tuttho

- Écran titre, île Tuttho (45 cases), 6 étapes de scénario avec les dialogues d'origine (Pairle, Félicia, Dumbledargent, Léthale…).
- Récompenses d'étape d'origine : Raidboule, potion de vie, Onzerock, emplacement de deck, 100 golds, fin du diplôme.
- Combat (tdMap) : placement de Félicia, invocation des tours au mana, upgrade en posant la même carte sur une tour (étoiles bronze / argent / or), vagues, boss, perfect, potions, vitesse x1/x2/x3.
- Grimoire : filtres, deck à slots (une même tour peut occuper plusieurs slots), tours verrouillées.

## D'où viennent les règles

| Élément | Source (`../input/`) |
|---|---|
| Stats des 11 tours | `TQ - Tourelles Data.xlsx` (repris tel quel) |
| Coût / effet des upgrades | `TQ - Tourelles Data.xlsx`, Feuille2 (20, 24, 28… / dps 5, 12, 19…) |
| Bestiaire (18 monstres, 5 boss) | `TQ - Bestiaire Data.xlsx`, second tableau |
| Mana de départ 100, ~70 de mana par vague, vagues à +2 niveaux | `TQ - Equilibrage [Beta-Muxxu].docx` |
| Monstres purifiés, bouclier de Gaïa, étoiles de niveau | `BG Tower Quest.docx` |
| Île, cases sépia / conquises, drapeau d'étape | `TQ - Interfaces Mode Campagne.docx` |
| Deck : 5 invocations par slot, plusieurs slots par tour | `[GamePlay] Deck.docx` |
| Grimoire | `[cdcf] Grimoire.docx` |
| Dialogues Tuttho | `[TQ] dialogues.docx` (section « TUTTHO // FINIE ») |
| Sprites de 7 tours | `Document sans titre.docx` |
| Textures gazon (carte de combat) et océan (île), à l'échelle d'origine | `TDRPG-Map.swf` (`fondGazon`) et `TDRPG-world.swf` (`fondOcean`) |

| Génération de la carte de combat (17 × 15, chemins creusés, amas de décor) et tuiles de décor | `TDRPG-Map.swf` : `world/MapGenerator.as`, `TileType`, `BiomeType`, symbole `tuileMap` (bytecode AS3 désassemblé et porté dans `src/engine/tdmap.ts`) |

| Interface (combat, île, dialogues, victoire, perfect, chargement), look de Félicia et de Pairle, pose des tours sur le terrain praticable, mana plafonné à 100, +1 niveau de monstre par vague (max 10), +50 golds pour un perfect, Raidboule (coût 15, portée 1-2), vie et gain de mana de 6 monstres | Vidéo YouTube de 2011, copie dans `../reference/video-2011-07-11/` (seule trace visuelle du jeu publié) |

Tous les dessins (Félicia, Pairle, monstres, décor, île) sont **redessinés en vectoriel d'après la vidéo** : elle est en
570×480, trop floue pour en découper les sprites. Seuls les 7 sprites de tours et les textures gazon / océan sont d'origine.
La vidéo confirme les formules d'upgrade (coûts 18, 21, 24… pour Balisto, dégâts +1,4 × base par niveau) et le bonus de
5 % de dégâts par niveau de Félicia (le joueur filmé avait Félicia niveau 11, d'où des dégâts × 1,5).

Les deux SWF sont les prototypes de génération de carte de Bernard (`CreateMap` / `CreateWorld`).
`menu TD.fla` est une scène vide.

## Ce qui est reconstitué (pas de source)

Le code Flash du moteur n'a pas été retrouvé (rien sur la Wayback Machine). Ces choix sont
regroupés dans `src/engine/config.ts` et `src/data/tuttho.ts` pour être ajustés :

- `fireRate` lu en **tirs par minute** : c'est la seule lecture cohérente avec les coûts en mana (Balisto 60, Hadoken 30).
- `rangeMin` / `rangeMax` lus comme une **portée minimale et maximale** en cases (Berta et Raidboule ne tirent pas au contact).
- Les tours bloquent le passage (confirmé par la vidéo : les monstres contournent les tours posées sur la neige) ;
  on ne peut pas couper tout chemin vers Félicia.
- Vitesse des monstres, délai entre vagues, vie du bouclier (100), effet des potions (50).
- Tracé de l'île Tuttho, difficulté des cases, boss final (Gorkone).
- Carte de combat : le générateur d'origine ne dit pas où apparaissent les monstres. On les fait partir des points de bord
  d'où il creuse ses chemins (la case du réseau principal la plus proche). Les biomes d'îles sont ramenés aux trois
  biomes de l'original (plaine, forêt, montagne).
- Correspondance sprite ↔ tour devinée d'après le dessin (l'ordre du doc ne correspond pas) ; Onzerock, Gonzales, Sulfath et Triphaz n'ont pas de sprite.

## Structure

```
src/data/      tours, bestiaire, île Tuttho (données d'origine)
src/engine/    moteur TD pur (hexagones, génération de carte, simulation)
src/game/      progression du joueur et sauvegarde
src/screens/   titre, île, grimoire, combat
src/ui/        thème, composants, dessins vectoriels provisoires
```

Le moteur (`src/engine/`) ne dépend pas de React : on peut le simuler en Node pour tester l'équilibrage.
