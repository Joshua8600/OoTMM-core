import { Settings, DEFAULT_SETTINGS, makeSettings } from './settings';

export type Presets = {[k: string]: Settings};

const PRESET_DEFAULT = DEFAULT_SETTINGS;

const PRESET_BLITZ = makeSettings({
  songs: 'anywhere',
  doorOfTime: 'open',
  shuffleGerudoCard: false,
  shuffleMasterSword: false,
  strayFairyShuffle: 'anywhere',
  skipZelda: true,
  startingItems: {
    OOT_OCARINA: 1,
    OOT_SONG_TP_LIGHT: 1,
    MM_OCARINA: 1,
    MM_SONG_SOARING: 1,
    MM_SWORD: 1,
    MM_SHIELD_HERO: 1,
    SHARED_SONG_TIME: 1,
  },
  junkLocations: [
    'MM Waterfall Rapids Beaver Race 2',
    'MM Deku Playground Reward 2',
    'MM Honey & Darling Reward 2',
    'MM Swamp Archery Reward 2',
    'MM Town Archery Reward 2',
    'MM Pinnacle Rock HP',
    'MM Laboratory Zora Song',
    'MM Goron Race Reward',
    'MM Woodfall Temple SF Entrance',
    'MM Woodfall Temple SF Main Pot',
    'MM Woodfall Temple SF Main Deku Baba',
    'MM Woodfall Temple SF Main Bubble',
    'MM Woodfall Temple SF Maze Skulltula',
    'MM Woodfall Temple SF Maze Beehive',
    'MM Woodfall Temple SF Maze Bubble',
    'MM Woodfall Temple SF Water Room Beehive',
    'MM Woodfall Temple SF Pre-Boss Bottom Right',
    'MM Woodfall Temple SF Pre-Boss Left',
    'MM Woodfall Temple SF Pre-Boss Top Right',
    'MM Woodfall Temple SF Pre-Boss Pillar',
    'MM Snowhead Temple SF Bridge Under Platform',
    'MM Snowhead Temple SF Bridge Pillar',
    'MM Snowhead Temple SF Map Room',
    'MM Snowhead Temple SF Compass Room Crate',
    'MM Snowhead Temple SF Dual Switches',
    'MM Snowhead Temple SF Snow Room',
    'MM Snowhead Temple SF Dinolfos 1',
    'MM Snowhead Temple SF Dinolfos 2',
    'MM Great Bay Temple SF Water Wheel Platform',
    'MM Great Bay Temple SF Water Wheel Skulltula',
    'MM Great Bay Temple SF Central Room Barrel',
    'MM Great Bay Temple SF Central Room Underwater Pot',
    'MM Great Bay Temple SF Map Room Pot',
    'MM Great Bay Temple SF Compass Room Pot',
    'MM Great Bay Temple SF Green Pipe 3 Barrel',
    'MM Great Bay Temple SF Pre-Boss Above Water',
    'MM Great Bay Temple SF Pre-Boss Underwater',
    'MM Ikana Great Fairy',
    'MM Great Bay Great Fairy',
    'MM Snowhead Great Fairy',
    'MM Woodfall Great Fairy',
    'MM Clock Town Great Fairy Alt',
    'MM Clock Town Great Fairy',
    'MM Mountain Village Frog Choir HP',
    'MM Stock Pot Inn Couple\'s Mask',
    'MM Moon Fierce Deity Mask',
  ],
  progressiveGoronLullaby: 'single',
  progressiveShieldsMm: 'separate',
  progressiveShieldsOot: 'separate',
  progressiveSwordsOot: 'goron',
  crossWarpOot: true,
  crossWarpMm: 'full',
  mapCompassShuffle: 'starting',
  sharedHealth: true,
  sharedMasks: true,
  sharedWallets: true,
  sharedSongTime: true,
  sharedSongEpona: true,
  sharedSongStorms: true,
});

const PRESET_ALLSANITY = makeSettings({
  songs: 'anywhere',
  goldSkulltulaTokens: 'all',
  housesSkulltulaTokens: 'all',
  strayFairyShuffle: 'anywhere',
  townFairyShuffle: 'anywhere',
  bossKeyShuffle: 'anywhere',
  smallKeyShuffle: 'anywhere',
  smallKeyShuffleHideout: 'anywhere',
  cowShuffleOot: true,
  cowShuffleMm: true,
  shopShuffleOot: "full",
  shopShuffleMm: "full",
  eggShuffle: true,
  scrubShuffleOot: true,
  childWallets: true,
  colossalWallets: true,
  tingleShuffle: 'anywhere',
  dungeonRewardShuffle: 'anywhere',
  owlShuffle: 'anywhere',
});

export const PRESETS: Presets = {
  "Default": PRESET_DEFAULT,
  "Blitz": PRESET_BLITZ,
  "Allsanity": PRESET_ALLSANITY,
};
