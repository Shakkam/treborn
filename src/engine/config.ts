// Constantes du moteur TD. Celles marquées [doc] viennent des documents d'origine,
// celles marquées [reconstitué] sont des choix faute de source (à ajuster en jouant).

/** [doc] Equilibrage Beta-Muxxu : le joueur commence avec 100 de mana. */
export const START_MANA = 100;
/** [vidéo 2011] La jauge de mana affiche « 85/100 » : le mana plafonne à 100. */
export const MAX_MANA = 100;
/** [reconstitué] Bouclier de Gaïa (vie de Félicia). */
export const HERO_LIFE = 100;
/** [reconstitué] Unités monde par seconde pour 1 point de "speed" du bestiaire. */
export const SPEED_UNIT = 0.16;
/** [reconstitué] Délai entre deux monstres d'une même vague (s). */
export const SPAWN_INTERVAL = 0.9;
/** [reconstitué] Délai avant la vague suivante une fois la précédente entièrement lâchée (s). */
export const NEXT_WAVE_DELAY = 18;
/** [vidéo 2011] Les monstres gagnent 1 niveau par vague (Fourchu niv. 1, Termytho niv. 2… Arak niv. 8),
 *  alors que les docs Survival / Equilibrage parlaient de +2. */
export const WAVE_LEVEL_STEP = 1;
/** [vidéo 2011] Les trois dernières vagues de la carte filmée sont toutes au niveau 10. */
export const MAX_WAVE_LEVEL = 10;
/** [reconstitué] Distance minimale (en cases) entre Félicia et un point d'apparition. */
export const HERO_MIN_SPAWN_DIST = 4;
/** [doc] Mode Survival : une partie rapporte 100 golds. */
export const GOLD_PER_WIN = 100;
/** [vidéo 2011] « Perfect ! Tu obtiens 50 golds de plus ! » */
export const GOLD_PERFECT_BONUS = 50;
/** [reconstitué] Effet d'une potion (vie ou mana). */
export const POTION_VALUE = 50;
/** [reconstitué] Bonus de portée (cases) d'Occulus au niveau 1. */
export const OCCULUS_RANGE_BONUS = 1;
