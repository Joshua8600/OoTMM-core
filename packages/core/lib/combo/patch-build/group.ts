export const PATCH_GROUPS = [
  'OOT_HOOKSHOT_ANYWHERE',
  'OOT_CLIMB_ANYWHERE',
  'MM_FD_ANYWHERE',
  'MM_HOOKSHOT_ANYWHERE',
  'MM_BLAST_MASK_DELAY_INSTANT',
  'MM_BLAST_MASK_DELAY_VERYSHORT',
  'MM_BLAST_MASK_DELAY_SHORT',
  'MM_BLAST_MASK_DELAY_LONG',
  'MM_BLAST_MASK_DELAY_VERYLONG',
  'MM_CLOCK_SPEED_VERYSLOW',
  'MM_CLOCK_SPEED_SLOW',
  'MM_CLOCK_SPEED_FAST',
  'MM_CLOCK_SPEED_VERYFAST',
  'MM_CLOCK_SPEED_SUPERFAST',
  'MM_BOSS_WARP_PADS_BEATEN',
  'OOT_ADULT_DEKU_TREE',
  'OOT_FIRE_TEMPLE_CHILD',
  'OOT_FAST_BUNNY_HOOD',
  'OOT_AGELESS_SWORDS',
  'OOT_AGELESS_SHIELDS',
  'OOT_AGELESS_TUNICS',
  'OOT_AGELESS_BOOTS',
  'OOT_AGELESS_STICKS',
  'OOT_AGELESS_BOOMERANG',
  'OOT_AGELESS_HAMMER',
  'OOT_AGELESS_CHILD_TRADE',
  'OOT_AGELESS_HOOKSHOT',
  'OOT_BLUE_FIRE_ARROWS',
  'OOT_SUNLIGHT_ARROWS',
  'ER',
  'DEFAULT_HOLD',
  'OOT_SILVER_RUPEE_SHUFFLE',
  'OOT_FREE_SCARECROW',
  'OOT_SHUFFLE_GRASS',
  'MM_SHUFFLE_GRASS',
  'MM_LENIENT_SPIKES',
  'OOT_CHEST_GAME_SHUFFLE',
  'MM_CLIMB_MOST_SURFACES',
  'NO_BROKEN_ACTORS',
  'OOT_FISHING_POND_SHUFFLE',
  'OOT_NOT_FISHING_POND_SHUFFLE',
  'MM_BOMBCHU_BAG',
  'ER_WALLMASTERS',
  'OOT_SHUFFLE_FREE_RUPEES',
  'MM_SHUFFLE_FREE_RUPEES',
  'MM_OPEN_STT',
  'CRIT_WIGGLE_DISABLE'
] as const;

export type PatchGroup = typeof PATCH_GROUPS[number];

export const PATCH_GROUP_VALUES: {[k: string]: number} = {};

for (let i = 0; i < PATCH_GROUPS.length; i++) {
  const k = PATCH_GROUPS[i];
  PATCH_GROUP_VALUES[k] = i + 1;
};
