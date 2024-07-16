import { promises as fs } from 'fs';
import { SCENES } from '@ootmm/data';

import { CodeGen } from '../lib/combo/util/codegen';
import { decompressGame } from '../lib/combo/decompress';
import { CONFIG } from '../lib/combo/config';
import { mkdir } from 'fs';

const OOT_GENERIC_GROTTOS = [
  0x0c, /* Kokiri Forest */
  0x14, /* Lost Woods */
  0x08, /* Kakariko */
  0x17, /* Death Mountain Trail */
  0x1a, /* Death Mountain Crater */
  0x09, /* Zora River */
  0x02, /* Hyrule Field Southwest */
  0x03, /* Hyrule Field Open */
  0x00, /* Hyrule Field Market */
];

const OOT_FAIRY_FOUNTAINS = [
  0x00,
  0x01,
  0x02,
  0x03,
  0x04,
];

const MM_GENERIC_GROTTOS = [
  0x13, /* Path to Snowhead Grotto,  */
  0x14, /* Ikana Valley Grotto */
  0x15, /* Zora Cape Grotto */
  0x16, /* Road to Ikana Grotto */
  0x17, /* Great Bay Coast Fisherman Grotto, */
  0x18, /* Ikana Graveyard Grotto */
  0x19, /* Twin Islands Ramp Grotto */
  0x1a, /* Termina Field Pillar Grotto */
  0x1b, /* Mountain Village Tunnel Grotto */
  0x1c, /* Woods of Mystery Grotto */
  0x1d, /* Southern Swamp Grotto */
  0x1e, /* Road to Southern Swamp Grotto */
  0x1f, /* Termina Field Tall Grass Grotto */
];

const SLICES = 12;

/* OOT Grass Scatter: 12 */

type Game = 'oot' | 'mq' | 'mm';

function scenesById(game: 'oot' | 'mm') {
  const data: {[k: number]: string} = {};
  for (const [name, id] of Object.entries(SCENES)) {
    if (name.startsWith(`${game.toUpperCase()}_`)) {
      data[id] = name;
    }
  }
  return data;
}

const SCENES_BY_ID = {
  oot: scenesById('oot'),
  mm: scenesById('mm'),
}

const MM_EXTRA_SCENES = {
  0x71: 5,
};

const MM_POTS_SET_DROPS = [
  'NOTHING',
  'RUPEE_GREEN',
  'RUPEE_BLUE',
  'NOTHING',
  'RUPEE_RED',
  'RUPEE_PURPLE',
  'NOTHING',
  'RUPEE_ORANGE',
  '???',
  '???',
  'RECOVERY_HEART',
  'RECOVERY_HEART',
  '???',
  '???',
  'MAGIC_JAR_SMALL',
  'MAGIC_JAR_LARGE',
  'FAIRY',
  'STRAY_FAIRY',
  'NOTHING',
  'NUTS_10',
  'NOTHING',
  'BOMBS_5',
  'NOTHING',
  'NOTHING',
  'NOTHING',
  'STICK',
  'NOTHING',
  'NOTHING',
  'NOTHING',
  'NOTHING',
  'ARROWS_10',
  'ARROWS_20',
];

const MM_POTS_RANDOM_DROPS = [
  'RUPEE_GREEN',
  'MAGIC_JAR_SMALL',
  'RECOVERY_HEART',
  'RUPEE_RED',
  'NOTHING',
  'NOTHING',
  'RECOVERY_HEART',
  'RECOVERY_HEART',
  'RUPEE_GREEN',
  'RUPEE_BLUE',
  'ARROWS_10',
  'BOMBS_5',
  'MAGIC_JAR_SMALL',
  'MAGIC_JAR_LARGE',
  'NUT',
  'STICK',
];

const MM_SCENES_WITH_EXTRA_SETUPS: {[k: number]: number} = {
  0x2036000: 3, /* Ikana Canyon */
  0x2249000: 1, /* Road to Mountain Village */
  0x263b000: 1, /* Goron Shrine */
  0x265e000: 1, /* Zora Hall */
  0x26bf000: 1, /* Great bay coast */
  0x26fc000: 1, /* Zora cape */
  0x2778000: 1, /* Deku Throne room */
  0x2879000: 2, /* Woodfall */
  0x2bfe000: 1, /* Road to Snowhead */
  0x2c09000: 1, /* Snowhead */
  0x2da7000: 1, /* Goron Racetrack */
  0x2e1d000: 1, /* North Clock Town */
};

const ACTORS_OOT = {
  EN_ITEM00: 0x15,
  POT: 0x111,
  FLYING_POT: 0x11d,
  ROCK_BUSH_GROUP: 0x151,
  EN_KUSA: 0x125,
  OBJ_HANA: 0x14f,
  EN_ELF: 0x18,
  BG_SPOT11_OASIS: 0x1C2,
  OBJ_MURE3: 0x1ab,
  SHOT_SUN: 0x183,
  EN_WONDER_ITEM: 0x112,
  OBJ_KIBAKO: 0x110,
  OBJ_KIBAKO2: 0x1a0,
  //DOOR_ANA: 0x9b,
};

const ACTORS_MM = {
  EN_ITEM00: 0x0e,
  POT: 0x82,
  FLYING_POT: 0x8d,
  EN_KUSA: 0x90,
  OBJ_MURE2: 0xb3,
  OBJ_MURE3: 0xe8,
  OBJ_GRASS: 0x10b,
  OBJ_GRASS_UNIT: 0x10d,
  EN_KUSA2: 0x171,
  EN_ELF: 0x10,
  EN_HIT_TAG: 0x265,
  EN_INVISIBLE_RUPPE: 0x2af,
  OBJ_KIBAKO: 0x81,
  OBJ_KIBAKO2: 0xe5,
  //DOOR_ANA: 0x55,
};

const ACTOR_SLICES_OOT = {
  [ACTORS_OOT.ROCK_BUSH_GROUP]: 12,
  [ACTORS_OOT.EN_ELF]: 8,
  [ACTORS_OOT.BG_SPOT11_OASIS]: 8,
  [ACTORS_OOT.OBJ_MURE3]: 7,
}

const ACTOR_SLICES_MM = {
  [ACTORS_MM.OBJ_MURE2]: 12,
  [ACTORS_MM.OBJ_GRASS_UNIT]: 12,
  [ACTORS_MM.EN_KUSA2]: 9,
  [ACTORS_MM.EN_ELF]: 8,
  [ACTORS_MM.OBJ_MURE3]: 7,
  [ACTORS_MM.EN_HIT_TAG]: 3,
}

const INTERESTING_ACTORS_OOT = Object.values(ACTORS_OOT);
const INTERESTING_ACTORS_MM = Object.values(ACTORS_MM);

const CONFIGS = {
  oot: {
    SCENE_TABLE_ADDR: 0xb71440,
    SCENE_TABLE_SIZE: 101,
    INTERESTING_ACTORS: INTERESTING_ACTORS_OOT,
    SLICES: ACTOR_SLICES_OOT,
  },
  mq: {
    SCENE_TABLE_ADDR: 0xba0bb0,
    SCENE_TABLE_SIZE: 101,
    INTERESTING_ACTORS: INTERESTING_ACTORS_OOT,
    SLICES: ACTOR_SLICES_OOT,
  },
  mm: {
    SCENE_TABLE_ADDR: 0x00C5A1E0,
    SCENE_TABLE_SIZE: 113,
    INTERESTING_ACTORS: INTERESTING_ACTORS_MM,
    SLICES: ACTOR_SLICES_MM,
  }
}

const RUPEES = new Set([
  'RUPEE_GREEN',
  'RUPEE_BLUE',
  'RUPEE_RED',
  'RUPEE_PURPLE',
  'RUPEE_HUGE',
]);

const OOT_WONDER_ITEM_DROPS = [
  'NUTS_5',
  '???',
  'MAGIC_JAR_LARGE',
  'MAGIC_JAR_SMALL',
  'RECOVERY_HEART',
  'ARROWS_5',
  'ARROWS_10',
  'ARROWS_30',
  'RUPEE_GREEN',
  'RUPEE_BLUE',
  'RUPEE_RED',
  'FLEXIBLE',
  'RANDOM',
  'RANDOM',
  'RANDOM',
  'RANDOM',
  'RANDOM',
  'RANDOM',
  'RANDOM',
  'RANDOM',
  'RANDOM',
  'RANDOM',
  'RANDOM',
  'RANDOM',
  'RANDOM',
  'RANDOM',
  'RANDOM',
  'RANDOM',
  'RANDOM',
  'RANDOM',
  'RANDOM',
  'RANDOM',
  'RANDOM',
];

const ITEM00_DROPS = [
  'RUPEE_GREEN',
  'RUPEE_BLUE',
  'RUPEE_RED',
  'RECOVERY_HEART',
  'BOMB',
  '???',
  '???',
  '???',
  'ARROWS_5',
  'ARROWS_10',
  'ARROWS_30',
  'BOMBS_5',
  'NUTS_5',
  'STICK',
  'MAGIC_JAR_LARGE',
  'MAGIC_JAR_SMALL',
  'DEKU_SEEDS_5',
  'SMALL_KEY',
  'FLEXIBLE',
  'RUPEE_HUGE',
  'RUPEE_PURPLE',
  'SHIELD_DEKU',
  'SHIELD_HYLIAN',
  'TUNIC_ZORA',
  'TUNIC_GORON',
  'BOMBS_5',
];

const ITEM00_DROPS_MM = [
  'RUPEE_GREEN',
  'RUPEE_BLUE',
  'RUPEE_RED',
  'RECOVERY_HEART',
  'BOMBS_5',
  'ARROWS_10',
  '???',
  '???',
  'ARROWS_20',
  'ARROWS_30',
  'ARROWS_30',
  'BOMBS_5',
  'NUT',
  'STICK',
  'MAGIC_JAR_LARGE',
  'MAGIC_JAR_SMALL',
  '???',
  'SMALL_KEY',
  'FLEXIBLE',
  'RUPEE_HUGE',
  'RUPEE_PURPLE',
  'RECOVERY_HEART',
  '???',
  'NUTS_10',
  '???',
  '???',
  'STRAY_FAIRY',
  '???',
  '???',
  '???',
  '???',
  '???',
];

const MM_ITEM00_DROP_COLLECTIBLE_TABLE = [
  -1, 0, 1, -1,
  0x02, 0x14, -1, 0x13,
  0x1c, 0x1d, 0x3, 0x15,
  0x6, 0x7, 0xf, 0xe,
  0x12, 0x1a, -1, 0x17,
  -1, 0x4, -1, -1,
  -1, 0xd, -1, -1,
  -1, -1, 5, 8,
];

function mmCollectibleDrop(index: number) {
  let index00: number;
  let item: string;

  if (index < 0 || index >= MM_ITEM00_DROP_COLLECTIBLE_TABLE.length) {
    index00 = -1;
  } else {
    index00 = MM_ITEM00_DROP_COLLECTIBLE_TABLE[index];
  }

  if (index00 === -1 || index00 >= ITEM00_DROPS_MM.length) {
    item = 'NOTHING';
  } else {
    item = ITEM00_DROPS_MM[index00];
  }

  return item;
}

const FLYING_POT_DROPS = [
  'RECOVERY_HEART',
  'BOMBS_5',
  'DEKU_SEEDS_5',
  'NUTS_5',
  'DEKU_SEEDS_5',
  'RUPEE_PURPLE',
  'TUNIC_GORON',
];

type RawRoom = {
  sceneId: number;
  roomId: number;
  setupId: number;
  vromBase: number;
  vromHeader: number;
}

type Actor = {
  actorId: number;
  typeId: number;
  pos: [number, number, number];
  rx: number;
  ry: number;
  rz: number;
  params: number;
}

type RoomActors = {
  sceneId: number;
  roomId: number;
  setupId: number;
  actors: Actor[];
}

type AddressingTable = {
  scenesTable: number[];
  setupsTable: number[];
  roomsTable: number[];
  bitCount: number;
}

function sliceOverrideOot(a: Actor) {
  return -1;
}

function sliceOverrideMm(a: Actor) {
  return -1;
}

function sliceOverride(game: Game, a: Actor) {
  return game === 'oot' ? sliceOverrideOot(a) : sliceOverrideMm(a);
}

function sliceSize(game: Game, a: Actor) {
  const conf = CONFIGS[game];
  if (!conf.INTERESTING_ACTORS.includes(a.typeId))
    return 0;
  const override = sliceOverride(game, a);
  if (override !== -1)
    return override;
  return conf.SLICES[a.typeId] || 1;
}

function sortRoomActors(roomActors: RoomActors[]) {
  return roomActors.sort((a, b) => {
    if (a.sceneId !== b.sceneId)
      return a.sceneId - b.sceneId;
    if (a.setupId !== b.setupId)
      return a.setupId - b.setupId;
    if (a.roomId !== b.roomId)
      return a.roomId - b.roomId;
    return 0;
  });
}

function mergeRooms(a: RoomActors, b: RoomActors): RoomActors {
  /* Copy the longest actor list */
  let actors: Actor[] = [];
  if (a.actors.length > b.actors.length) {
    actors = a.actors.map(a => ({...a}));
  } else {
    actors = b.actors.map(a => ({...a}));
  }
  const overlapCount = Math.min(a.actors.length, b.actors.length);
  for (let i = 0; i < overlapCount; i++) {
    const actorA = a.actors[i];
    const actorB = b.actors[i];

    const sliceSizeA = sliceSize('oot', actorA);
    const sliceSizeB = sliceSize('oot', actorB);
    if (sliceSizeA > sliceSizeB) {
      actors[i] = { ...actorA };
    } else {
      actors[i] = { ...actorB };
    }
  }

  return {
    sceneId: a.sceneId,
    roomId: a.roomId,
    setupId: a.setupId,
    actors,
  };
}

function mergeRoomActors(roomActors: RoomActors[][]): RoomActors[] {
  /* For every unique room, get the longest actor list */
  const merged = new Map<string, RoomActors>();
  for (const roomActor of roomActors.flat()) {
    const key = `${roomActor.sceneId}-${roomActor.setupId}-${roomActor.roomId}`;
    const existing = merged.get(key);
    let room = roomActor;
    if (existing) {
      room = mergeRooms(existing, room);
    }
    merged.set(key, room);
  }
  return sortRoomActors(Array.from(merged.values()));
}

function buildAddressingTable(game: Game, roomActors: RoomActors[]): AddressingTable {
  let sceneId = -1;
  let setupId = -1;
  let roomId = -1;
  let scenesTable: number[] = [];
  let setupsTable: number[] = [];
  let roomsTable: number[] = [];
  let bits = 0;

  for (const roomActor of roomActors) {
    /* If it's a new scene, push the offset to the setups table */
    while (sceneId < roomActor.sceneId) {
      sceneId++;
      scenesTable.push(setupsTable.length);
      setupId = -1;
      roomId = -1;
    }

    /* If it's a new setup, push the offset to the room table */
    while (setupId < roomActor.setupId) {
      setupId++;
      setupsTable.push(roomsTable.length);
      roomId = -1;
    }

    for (let slice = 0; slice < SLICES; ++slice) {
      /* We need bits starting at the first useful actor */
      const pred = (a: Actor) => sliceSize(game, a) > slice;
      let firstBit = roomActor.actors.findIndex(pred);
      if (firstBit === -1) {
        firstBit = 0;
      }
      let lastBit = roomActor.actors.findLastIndex(pred);
      if (lastBit === -1) {
        lastBit = 0;
      } else {
        lastBit += 1;
      }
      const bitCount = lastBit - firstBit;

      /* Push the bit pos */
      while (roomId < roomActor.roomId * SLICES + slice) {
        roomId++;
        roomsTable.push(bits - firstBit);
      }

      /* Allocate bits */
      bits += bitCount;
    }
  }

  return { scenesTable, setupsTable, roomsTable, bitCount: bits };
}

function findHeaderOffset(rom: Buffer, offset: number, wantedOp: number) {
  for (;;) {
    const op = rom.readUInt8(offset);
    if (op === wantedOp) {
      return offset;
    }
    if (op === 0x14) {
      return null;
    }
    offset += 8;
  }
}

function filterActors(actors: Actor[], game: Game): Actor[] {
  /* Filter the unintresting trailing actors */
  let lastInterestingActor = -1;
  for (let i = 0; i < actors.length; i++) {
    if (CONFIGS[game].INTERESTING_ACTORS.includes(actors[i].typeId)) {
      lastInterestingActor = i;
    }
  }
  return actors.slice(0, lastInterestingActor + 1);
}

function parseRoomActors(rom: Buffer, raw: RawRoom, game: Game): RoomActors[] {
  const typeIdMask = (game === 'mm' ? 0xfff : 0xffff);
  let actors: Actor[] = [];
  const actorHeaders = findHeaderOffset(rom, raw.vromHeader, 0x01);
  if (actorHeaders !== null) {
    const actorCount = (rom.readUInt32BE(actorHeaders) >> 16) & 0xff;
    const actorsVrom = raw.vromBase + (rom.readUInt32BE(actorHeaders + 4) & 0xffffff);
    for (let actorId = 0; actorId < actorCount; actorId++) {
      const actorVromBase = 0x10 * actorId + actorsVrom;
      const typeId = rom.readUInt16BE(actorVromBase + 0x00) & typeIdMask;
      const posx = rom.readInt16BE(actorVromBase + 0x02);
      const posy = rom.readInt16BE(actorVromBase + 0x04);
      const posz = rom.readInt16BE(actorVromBase + 0x06);
      const rx = rom.readUInt16BE(actorVromBase + 0x08);
      const ry = rom.readUInt16BE(actorVromBase + 0x0a);
      const rz = rom.readUInt16BE(actorVromBase + 0x0c);
      const params = rom.readUInt16BE(actorVromBase + 0x0e);
      actors.push({ actorId, typeId, pos: [posx, posy, posz], rx, ry, rz, params });
    }
  }
  actors = filterActors(actors, game);
  if (game !== 'mm' && raw.sceneId === 0x3e && raw.roomId === 0x00) {
    /* OoT generic grottos */
    let genericRooms: RoomActors[] = [];
    for (const genericId of OOT_GENERIC_GROTTOS) {
      const genericRoomId = genericId | 0x20;
      const genericActors = actors.map(x => ({...x, roomId: genericRoomId }));
      genericRooms.push({ sceneId: raw.sceneId, setupId: raw.setupId, roomId: genericRoomId, actors: genericActors });
    }
    return genericRooms;
  }

  if (game !== 'mm' && raw.sceneId === 0x3c && raw.roomId === 0x00) {
    /* OoT fairy fountains */
    let genericRooms: RoomActors[] = [];
    for (const genericId of OOT_FAIRY_FOUNTAINS) {
      const genericRoomId = genericId | 0x20;
      const genericActors = actors.map(x => ({...x, roomId: genericRoomId }));
      genericRooms.push({ sceneId: raw.sceneId, setupId: raw.setupId, roomId: genericRoomId, actors: genericActors });
    }
    return genericRooms;
  }

  if (game === 'mm' && raw.sceneId === 0x07 && raw.roomId === 0x04) {
    /* MM generic grottos */
    let genericRooms: RoomActors[] = [];
    for (const genericId of MM_GENERIC_GROTTOS) {
      const genericRoomId = genericId | 0x20;
      const genericActors = actors.map(x => ({...x, roomId: genericRoomId }));
      genericRooms.push({ sceneId: raw.sceneId, setupId: raw.setupId, roomId: genericRoomId, actors: genericActors });
    }
    return genericRooms;
  }

  if (game === 'mm' && raw.sceneId === 0x07 && raw.roomId === 0x0a) {
    /* MM cow grottos */
    let cowRooms: RoomActors[] = [];
    cowRooms.push({ sceneId: raw.sceneId, setupId: raw.setupId, roomId: raw.roomId, actors });
    const altRoomId = 0x0f;
    const altActors = actors.map(x => ({...x, roomId: altRoomId }));
    cowRooms.push({ sceneId: raw.sceneId, setupId: raw.setupId, roomId: altRoomId, actors: altActors });
    return cowRooms;
  }

  return [{ sceneId: raw.sceneId, setupId: raw.setupId, roomId: raw.roomId, actors }];
}

function getRawRooms(rom: Buffer, game: 'oot' | 'mq' | 'mm') {
  const rooms: RawRoom[] = [];
  const config = CONFIGS[game];
  for (let sceneId = 0; sceneId < config.SCENE_TABLE_SIZE; sceneId++) {
    const sceneVrom = rom.readUInt32BE(config.SCENE_TABLE_ADDR + sceneId * (game === 'mm' ? 0x10 : 0x14));
    if (sceneVrom === 0)
      continue;
    const roomsHeaderVrom = findHeaderOffset(rom, sceneVrom, 0x04);
    if (roomsHeaderVrom === null)
      continue;
    const roomsCount = (rom.readUInt32BE(roomsHeaderVrom) >> 16) & 0xff;
    const roomsVrom = sceneVrom + (rom.readUInt32BE(roomsHeaderVrom + 4) & 0xffffff);
    for (let roomId = 0; roomId < roomsCount; roomId++) {
      const roomFileVrom = rom.readUint32BE(roomsVrom + roomId * 8);

      /* Push the default setup */
      rooms.push({ sceneId, setupId: 0, roomId, vromBase: roomFileVrom, vromHeader: roomFileVrom });

      /* Look for alternate setups */
      if (game !== 'mm') {
        const altHeaderOffset = findHeaderOffset(rom, roomFileVrom, 0x18);
        if (altHeaderOffset === null)
          continue;
        const altHeaderListVrom = roomFileVrom + (rom.readUInt32BE(altHeaderOffset + 4) & 0xffffff);
        for (let setupId = 1; setupId < 4; ++setupId) {
          const setupAddr = rom.readUInt32BE(altHeaderListVrom + (setupId - 1) * 4);
          if (setupAddr === 0)
            continue;
          const setupVrom = roomFileVrom + (setupAddr & 0xffffff);
          rooms.push({ sceneId, setupId, roomId, vromBase: roomFileVrom, vromHeader: setupVrom });
        }
      } else {
        /* MM setups */
        const extraSetupsCount = MM_SCENES_WITH_EXTRA_SETUPS[sceneVrom];
        if (!extraSetupsCount)
          continue;
        const altHeaderOffset = findHeaderOffset(rom, roomFileVrom, 0x18)!;
        const altHeaderListVrom = roomFileVrom + (rom.readUInt32BE(altHeaderOffset + 4) & 0xffffff);
        for (let i = 0; i < extraSetupsCount; ++i) {
          const setupId = i + 1;
          const setupAddr = rom.readUInt32BE(altHeaderListVrom + i * 4);
          const setupVrom = roomFileVrom + (setupAddr & 0xffffff);
          rooms.push({ sceneId, setupId, roomId, vromBase: roomFileVrom, vromHeader: setupVrom });
        }
      }
    }
  }
  return rooms;
}

async function codegenHeader(roomActorsOotMq: RoomActors[], roomActorsMm: RoomActors[], addrTableOotMq: AddressingTable, addrTableMm: AddressingTable) {
  const byteCountOot = Math.floor((addrTableOotMq.bitCount + 7) / 8);
  const byteCountMm = Math.floor((addrTableMm.bitCount + 7) / 8);
  const cg = new CodeGen(__dirname + '/../include/combo/xflags_data.h', 'XFLAGS_DATA');
  cg.define('XFLAGS_COUNT_OOT', byteCountOot);
  cg.define('XFLAGS_COUNT_MM', byteCountMm);
  return cg.emit();
}

async function codegenSource(roomActorsOotMq: RoomActors[], roomActorsMm: RoomActors[], addrTableOotMq: AddressingTable, addrTableMm: AddressingTable) {
  const cgOot = new CodeGen(__dirname + '/../src/oot/xflags_data.c');
  cgOot.include('combo.h');
  cgOot.table('kXflagsTableScenes', 'u16', addrTableOotMq.scenesTable);
  cgOot.table('kXflagsTableSetups', 'u16', addrTableOotMq.setupsTable);
  cgOot.table('kXflagsTableRooms', 's16', addrTableOotMq.roomsTable);

  const cgMm = new CodeGen(__dirname + '/../src/mm/xflags_data.c');
  cgMm.include('combo.h');
  cgMm.table('kXflagsTableScenes', 'u16', addrTableMm.scenesTable);
  cgMm.table('kXflagsTableSetups', 'u16', addrTableMm.setupsTable);
  cgMm.table('kXflagsTableRooms', 's16', addrTableMm.roomsTable);

  return Promise.all([cgOot.emit(), cgMm.emit()]);
}

function outputPotsPoolOot(roomActors: RoomActors[]) {
  let lastSceneId = -1;
  let lastSetupId = -1;
  for (const room of roomActors) {
    for (const actor of room.actors) {
      if (actor.typeId === ACTORS_OOT.POT) {
        const item00 = (actor.params >> 0) & 0xff;
        let item: string;
        if (item00 >= 0x1a) {
          item = 'NOTHING';
        } else {
          item = ITEM00_DROPS[item00];
        }
        const key = ((room.setupId & 0x3) << 14) | (room.roomId << 8) | actor.actorId;
        if (room.sceneId != lastSceneId || room.setupId != lastSetupId) {
          console.log('');
          lastSceneId = room.sceneId;
          lastSetupId = room.setupId;
        }
        console.log(`Scene ${room.sceneId.toString(16)} Setup ${room.setupId} Room ${room.roomId} Pot ${actor.actorId}, pot,            NONE,                 SCENE_${room.sceneId.toString(16)}, 0x${key.toString(16)}, ${item}`);
      }

      if (actor.typeId === ACTORS_OOT.FLYING_POT) {
        const itemId = (actor.params >> 8) & 0xff;
        let item: string;
        if (itemId >= 0x07) {
          item = 'NOTHING';
        } else {
          item = FLYING_POT_DROPS[itemId];
        }
        const key = ((room.setupId & 0x3) << 14) | (room.roomId << 8) | actor.actorId;
        if (room.sceneId != lastSceneId || room.setupId != lastSetupId) {
          console.log('');
          lastSceneId = room.sceneId;
          lastSetupId = room.setupId;
        }
        console.log(`Scene ${room.sceneId.toString(16)} Setup ${room.setupId} Room ${room.roomId} Flying Pot ${actor.actorId}, pot,            NONE,                 SCENE_${room.sceneId.toString(16)}, 0x${key.toString(16)}, ${item}`);
      }
    }
  }
}

function hexPad(n: number, width: number) {
  const s = n.toString(16);
  return '0x' + '0'.repeat(width - s.length) + s;
}

function decPad(n: number, width: number) {
  const s = n.toString();
  const count = width - s.length;
  return count > 0 ? '0'.repeat(width - s.length) + s : s;
}

/*
function outputGrottosMm(roomActors: RoomActors[]) {
  let lastSceneId = -1;
  let lastSetupId = -1;
  for (const room of roomActors) {
    for (const actor of room.actors) {
      if (actor.typeId === ACTORS_MM.DOOR_ANA) {
        if (room.sceneId != lastSceneId || room.setupId != lastSetupId) {
          console.log('');
          console.log(`### Scene: ${scenesById('mm')[room.sceneId]}`);
          lastSceneId = room.sceneId;
          lastSetupId = room.setupId;
        }

        console.log(`Setup ${room.setupId} Room ${hexPad(room.roomId, 2)} Pos ${actor.pos[0]}, ${actor.pos[1]}, ${actor.pos[2]}`);
      }
    }
  }
}
*/

function outputShotSunOot(roomActors: RoomActors[]) {
  let lastSceneId = -1;
  let lastSetupId = -1;
  for (const room of roomActors) {
    for (const actor of room.actors) {
      if (actor.typeId === ACTORS_OOT.SHOT_SUN) {
        const params = actor.params & 0xFF;
        var validFairy = params === 0x40 || params === 0x41;
        if (!validFairy) {
          console.log("Fairy not valid: " + JSON.stringify(actor));
          continue;
        }
        const item = 'FAIRY_BIG';
        if (room.sceneId != lastSceneId || room.setupId != lastSetupId) {
          console.log('');
          lastSceneId = room.sceneId;
          lastSetupId = room.setupId;
        }
        const key = ((room.setupId & 0x3) << 14) | (room.roomId << 8) | actor.actorId;
        console.log(`Scene ${room.sceneId.toString(16)} Setup ${room.setupId} Room ${hexPad(room.roomId, 2)} Fairy Spot ${decPad(actor.actorId + 1, 2)},             fairy_spot,            NONE,                 ${SCENES_BY_ID.oot[room.sceneId]}, ${hexPad(key, 5)}, ${item}`);
        console.log(params === 0x40 ? "Suns Song" : "Song of Storms");
      }
    }
  }
}

function outputFairyPoolOot(roomActors: RoomActors[]) {
  let lastSceneId = -1;
  let lastSetupId = -1;
  for (const room of roomActors) {
    for (const actor of room.actors) {
      if (actor.typeId === ACTORS_OOT.EN_ELF || actor.typeId === ACTORS_OOT.BG_SPOT11_OASIS) {
        var validFairy = actor.typeId === ACTORS_OOT.EN_ELF && actor.params === 4
          || actor.typeId === ACTORS_OOT.BG_SPOT11_OASIS;
        const fairyType = actor.params;
        if (!validFairy) {
          console.log("Fairy not valid: " + JSON.stringify(actor));
          continue;
        }
        const item = 'FAIRY';
        if (room.sceneId != lastSceneId || room.setupId != lastSetupId) {
          console.log('');
          lastSceneId = room.sceneId;
          lastSetupId = room.setupId;
        }
        const count = 8;
        for (let i = 0; i < count; ++i) {
          const key = (i << 16) | ((room.setupId & 0x3) << 14) | (room.roomId << 8) | actor.actorId;
          console.log(`Scene ${room.sceneId.toString(16)} Setup ${room.setupId} Room ${hexPad(room.roomId, 2)} Fairy Group ${decPad(actor.actorId + 1, 2)} Fairy ${decPad(i + 1, 2)},             fairy,            NONE,                 SCENE_${room.sceneId.toString(16)}, ${hexPad(key, 5)}, ${item}`);
        }
      }
    }
  }
}


function outputHeartsOot(roomActors: RoomActors[]) {
  let lastSceneId = -1;
  let lastSetupId = -1;
  for (const room of roomActors) {
    for (const actor of room.actors) {
      if (actor.typeId === ACTORS_OOT.EN_ITEM00) {
        const item00arg = (actor.params >> 0) & 0xff;
        const item = ITEM00_DROPS[item00arg];
        if (item !== 'RECOVERY_HEART') continue;
        const key = ((room.setupId & 0x3) << 14) | (room.roomId << 8) | actor.actorId;
        if (room.sceneId != lastSceneId || room.setupId != lastSetupId) {
          console.log('');
          lastSceneId = room.sceneId;
          lastSetupId = room.setupId;
        }
        /* PRINT */
        console.log(`Scene ${room.sceneId.toString(16)} Setup ${room.setupId} Room ${hexPad(room.roomId, 2)} Heart ${decPad(actor.actorId + 1, 2)},        heart,            NONE,                 ${SCENES_BY_ID.oot[room.sceneId]}, ${hexPad(key, 5)}, ${item}`);
      }
    }
  }
}

function outputHeartsMm(roomActors: RoomActors[]) {
  let lastSceneId = -1;
  let lastSetupId = -1;
  for (const room of roomActors) {
    for (const actor of room.actors) {
      if (actor.typeId === ACTORS_MM.EN_ITEM00) {
        const item00arg = (actor.params >> 0) & 0xff;
        const item = ITEM00_DROPS_MM[item00arg];
        if (item !== 'RECOVERY_HEART') continue;
        const key = ((room.setupId & 0x3) << 14) | (room.roomId << 8) | actor.actorId;
        if (room.sceneId != lastSceneId || room.setupId != lastSetupId) {
          console.log('');
          lastSceneId = room.sceneId;
          lastSetupId = room.setupId;
        }
        /* PRINT */
        console.log(`Scene ${room.sceneId.toString(16)} Setup ${room.setupId} Room ${hexPad(room.roomId, 2)} Heart ${decPad(actor.actorId + 1, 2)},        heart,            NONE,                 ${SCENES_BY_ID.mm[room.sceneId]}, ${hexPad(key, 5)}, ${item}`);
      }
    }
  }
}

function outputWonderOot(roomActors: RoomActors[]) {
  let lastSceneId = -1;
  let lastSetupId = -1;
  for (const room of roomActors) {
    for (const actor of room.actors) {
      if (actor.typeId !== ACTORS_OOT.EN_WONDER_ITEM)
        continue;
      const type = (actor.params >>> 11) & 0x1f;
      if (type !== 2 && type !== 3 && type !== 0 && type !== 5)
        continue;
      const itemId = ((actor.params & 0x07c0) >>> 6) & 0x1f;
      const item = OOT_WONDER_ITEM_DROPS[itemId];
      const key = ((room.setupId & 0x3) << 14) | (room.roomId << 8) | actor.actorId;
      if (room.sceneId != lastSceneId || room.setupId != lastSetupId) {
        console.log('');
        console.log(`### Scene: ${scenesById('oot')[room.sceneId]}`);
        lastSceneId = room.sceneId;
        lastSetupId = room.setupId;
      }
      let meta = '';
      if (type === 0) {
        meta = ' TYPE 0';
      }
      if (type === 5) {
        meta = ' TYPE 5';
      }
      console.log(`Scene ${room.sceneId.toString(16)} Setup ${room.setupId} Room ${hexPad(room.roomId, 2)} Wonder Item${meta} ${decPad(actor.actorId + 1, 2)},        wonder,           NONE,                 SCENE_${room.sceneId.toString(16)}, ${hexPad(key, 5)}, ${item}`);
    }
  }
}

function outputWonderMm(roomActors: RoomActors[]) {
  let lastSceneId = -1;
  let lastSetupId = -1;
  for (const room of roomActors) {
    for (const actor of room.actors) {
      let count: number;
      let item: string;
      switch (actor.typeId) {
      case ACTORS_MM.EN_HIT_TAG:
        count = 3;
        item = 'RUPEE_GREEN';
        break;
      case ACTORS_MM.EN_INVISIBLE_RUPPE:
        count = 1;
        item = ['RUPEE_GREEN', 'RUPEE_BLUE', 'RUPEE_RED', '???'][actor.params & 3];
        break;
      default:
        count = 0;
        item = '???';
        break;
      }
      if (count === 0)
        continue;
      const keyBase = ((room.setupId & 0x3) << 14) | (room.roomId << 8) | actor.actorId;
      if (room.sceneId != lastSceneId || room.setupId != lastSetupId) {
        console.log('');
        console.log(`### Scene: ${scenesById('mm')[room.sceneId]}`);
        lastSceneId = room.sceneId;
        lastSetupId = room.setupId;
      }
      for (let i = 0; i < count; ++i) {
        const key = keyBase | (i << 16);
        let post = count === 1 ? '' : ` Num ${i + 1}`;
        console.log(`Scene ${room.sceneId.toString(16)} Setup ${room.setupId} Room ${hexPad(room.roomId, 2)} Wonder Item ${decPad(actor.actorId + 1, 2)}${post},        wonder,           NONE,                 SCENE_${room.sceneId.toString(16)}, ${hexPad(key, 5)}, ${item}`);
      }
    }
  }
}

function outputGrassPoolOot(roomActors: RoomActors[]) {
  let lastSceneId = -1;
  let lastSetupId = -1;
  let altGrassAcc = 0;
  for (const room of roomActors) {
    for (const actor of room.actors) {
      if (actor.typeId === ACTORS_OOT.EN_KUSA) {
        const grassType = (actor.params) & 3;
        if (grassType == 3) {
          console.log("Grass type 3????");
        }
        let item: string;
        if (grassType == 0 || grassType == 2) {
          item = 'RANDOM';
        } else {
          item = (altGrassAcc & 1) ? 'RECOVERY_HEART' : 'DEKU_SEEDS_5/ARROWS_5';
          altGrassAcc++;
        }
        const key = ((room.setupId & 0x3) << 14) | (room.roomId << 8) | actor.actorId;
        if (room.sceneId != lastSceneId || room.setupId != lastSetupId) {
          console.log('');
          lastSceneId = room.sceneId;
          lastSetupId = room.setupId;
        }
        console.log(`Scene ${room.sceneId.toString(16)} Setup ${room.setupId} Room ${hexPad(room.roomId, 2)} Grass ${decPad(actor.actorId + 1, 2)},        grass,            NONE,                 SCENE_${room.sceneId.toString(16)}, ${hexPad(key, 5)}, ${item}`);
      }

      if (actor.typeId === ACTORS_OOT.ROCK_BUSH_GROUP) {
        const type = (actor.params) & 3;
        let count: number;
        if (type > 1) {
          continue;
        }
        if (type == 0) {
          count = 9;
        } else {
          count = 12;
        }
        const item = 'RANDOM';
        if (room.sceneId != lastSceneId || room.setupId != lastSetupId) {
          console.log('');
          lastSceneId = room.sceneId;
          lastSetupId = room.setupId;
        }
        for (let i = 0; i < count; ++i) {
          const key = (i << 16) | ((room.setupId & 0x3) << 14) | (room.roomId << 8) | actor.actorId;
          console.log(`Scene ${room.sceneId.toString(16)} Setup ${room.setupId} Room ${hexPad(room.roomId, 2)} Grass Pack ${decPad(actor.actorId + 1, 2)} Grass ${decPad(i + 1, 2)},             grass,            NONE,                 SCENE_${room.sceneId.toString(16)}, ${hexPad(key, 5)}, ${item}`);
        }
      }
    }
  }
}

function outputGrassPoolMm(roomActors: RoomActors[]) {
  let lastSceneId = -1;
  let lastSetupId = -1;
  let altGrassAcc = 0;
  for (const room of roomActors) {
    for (const actor of room.actors) {
      if (actor.typeId === ACTORS_MM.EN_KUSA) {
        const grassType = (actor.params) & 3;
        let item: string;
        if (grassType == 0 || grassType == 2) {
          item = 'RANDOM';
        } else if (grassType === 3) {
          const item00value = (actor.params & 0xfc) >> 2;
          if (item00value >= ITEM00_DROPS_MM.length) {
            item = 'NOTHING';
          } else {
            item = ITEM00_DROPS_MM[item00value];
          }
        } else {

          item = (altGrassAcc & 1) ? 'RECOVERY_HEART' : 'ARROWS_5';
          altGrassAcc++;
        }
        const key = ((room.setupId & 0x3) << 14) | (room.roomId << 8) | actor.actorId;
        if (room.sceneId != lastSceneId || room.setupId != lastSetupId) {
          console.log('');
          lastSceneId = room.sceneId;
          lastSetupId = room.setupId;
        }
        item = 'RANDOM';
        console.log(`Scene ${room.sceneId.toString(16)} Setup ${room.setupId} Room ${hexPad(room.roomId, 2)} Grass ${decPad(actor.actorId + 1, 2)},        grass,            NONE,                 SCENE_${room.sceneId.toString(16)}, ${hexPad(key, 5)}, ${item}`);
      }

      if (actor.typeId === ACTORS_MM.OBJ_MURE2) {
        const type = (actor.params) & 3;
        let count: number;
        if (type > 1) {
          continue;
        }
        if (type == 0) {
          count = 9;
        } else {
          count = 12;
        }
        const item = 'RANDOM';
        if (room.sceneId != lastSceneId || room.setupId != lastSetupId) {
          console.log('');
          lastSceneId = room.sceneId;
          lastSetupId = room.setupId;
        }
        for (let i = 0; i < count; ++i) {
          const key = (i << 16) | ((room.setupId & 0x3) << 14) | (room.roomId << 8) | actor.actorId;
          console.log(`Scene ${room.sceneId.toString(16)} Setup ${room.setupId} Room ${hexPad(room.roomId, 2)} Grass Pack ${decPad(actor.actorId + 1, 2)} Grass ${decPad(i + 1, 2)},             grass,            NONE,                 SCENE_${room.sceneId.toString(16)}, ${hexPad(key, 5)}, ${item}`);
        }
      }

      if (actor.typeId === ACTORS_MM.OBJ_GRASS_UNIT) {
        const count = (actor.params & 1) ? 12 : 9;
        const item = 'RANDOM';
        if (room.sceneId != lastSceneId || room.setupId != lastSetupId) {
          console.log('');
          lastSceneId = room.sceneId;
          lastSetupId = room.setupId;
        }
        for (let i = 0; i < count; ++i) {
          const key = (i << 16) | ((room.setupId & 0x3) << 14) | (room.roomId << 8) | actor.actorId;
          console.log(`Scene ${room.sceneId.toString(16)} Setup ${room.setupId} Room ${hexPad(room.roomId, 2)} Grass UNIT Pack ${decPad(actor.actorId + 1, 2)} Grass ${decPad(i + 1, 2)},             grass,            NONE,                 SCENE_${room.sceneId.toString(16)}, ${hexPad(key, 5)}, ${item}`);
        }
      }
    }
  }
}

function outputKeatonGrassPoolMm(roomActors: RoomActors[]) {
  let lastSceneId = -1;
  let lastSetupId = -1;
  for (const room of roomActors) {
    for (const actor of room.actors) {
      if (actor.typeId === ACTORS_MM.EN_KUSA2) {
        const key = ((room.setupId & 0x3) << 14) | (room.roomId << 8) | actor.actorId;
        if (room.sceneId != lastSceneId || room.setupId != lastSetupId) {
          console.log('');
          lastSceneId = room.sceneId;
          lastSetupId = room.setupId;
        }

        for (let i = 0; i < 9; ++i) {
          const item = (i == 8) ? 'RUPEE_RED' : 'RUPEE_GREEN';
          console.log(`Scene ${room.sceneId.toString(16)} Setup ${room.setupId} Room ${hexPad(room.roomId, 2)} Keaton Grass ${decPad(actor.actorId + 1, 2)} Reward ${i + 1},        grass,            NONE,                 SCENE_${room.sceneId.toString(16)}, ${hexPad(key, 5)}, ${item}`);
        }
      }
    }
  }
}

function outputCratesPoolOot(roomActors: RoomActors[]) {
  let lastSceneId = -1;
  let lastSetupId = -1;
  for (const room of roomActors) {
    for (const actor of room.actors) {
      const key = ((room.setupId & 0x3) << 14) | (room.roomId << 8) | actor.actorId;
      if (actor.typeId === ACTORS_OOT.OBJ_KIBAKO || actor.typeId === ACTORS_OOT.OBJ_KIBAKO2) {
        if (room.sceneId != lastSceneId || room.setupId != lastSetupId) {
          console.log('');
          console.log(`### Scene: ${scenesById('oot')[room.sceneId]}`);
          lastSceneId = room.sceneId;
          lastSetupId = room.setupId;
        }

        /* Large crate */
        if (actor.typeId === ACTORS_OOT.OBJ_KIBAKO2) {
          if (actor.params !== 0xffff)
            continue;
          const itemId = actor.rx & 0xff;
          let item: string;
          if (itemId >= ITEM00_DROPS.length) {
            item = 'NOTHING';
          } else {
            item = ITEM00_DROPS[actor.rx & 0xff];
          }
          console.log(`Scene ${room.sceneId.toString(16)} Setup ${room.setupId} Room ${hexPad(room.roomId, 2)} Large Crate ${decPad(actor.actorId + 1, 2)},        crate,            NONE,                 SCENE_${room.sceneId.toString(16)}, ${hexPad(key, 5)}, ${item}`);
        }

        /* Small crate */
        if (actor.typeId === ACTORS_OOT.OBJ_KIBAKO) {
          let item: string;
          if (actor.params === 0xffff) {
            item = 'NOTHING';
          } else {
            const itemId = actor.params & 0xff;
            if (itemId >= ITEM00_DROPS.length) {
              item = 'NOTHING';
            } else {
              item = ITEM00_DROPS[actor.params & 0xff];
            }
          }
          console.log(`Scene ${room.sceneId.toString(16)} Setup ${room.setupId} Room ${hexPad(room.roomId, 2)} Small Crate ${decPad(actor.actorId + 1, 2)},        crate,            NONE,                 SCENE_${room.sceneId.toString(16)}, ${hexPad(key, 5)}, ${item}`);
        }
      }
    }
  }
}

function outputCratesPoolMm(roomActors: RoomActors[]) {
  let lastSceneId = -1;
  let lastSetupId = -1;
  for (const room of roomActors) {
    for (const actor of room.actors) {
      const key = ((room.setupId & 0x3) << 14) | (room.roomId << 8) | actor.actorId;
      if (actor.typeId === ACTORS_MM.OBJ_KIBAKO || actor.typeId === ACTORS_MM.OBJ_KIBAKO2) {
        if (room.sceneId != lastSceneId || room.setupId != lastSetupId) {
          console.log('');
          console.log(`### Scene: ${scenesById('mm')[room.sceneId]}`);
          lastSceneId = room.sceneId;
          lastSetupId = room.setupId;
        }

        /* Large crate */
        if (actor.typeId === ACTORS_MM.OBJ_KIBAKO2) {
          if (actor.params & 0x8000) continue;
          const item = mmCollectibleDrop(actor.params & 0x3f);
          if (item === 'STRAY_FAIRY') continue;
          console.log(`Scene ${room.sceneId.toString(16)} Setup ${room.setupId} Room ${hexPad(room.roomId, 2)} Large Crate ${decPad(actor.actorId + 1, 2)},        crate,            NONE,                 SCENE_${room.sceneId.toString(16)}, ${hexPad(key, 5)}, ${item}`);
        }

        /* Small crate */
        if (actor.typeId === ACTORS_MM.OBJ_KIBAKO) {
          const item = mmCollectibleDrop(actor.params & 0x3f);
          console.log(`Scene ${room.sceneId.toString(16)} Setup ${room.setupId} Room ${hexPad(room.roomId, 2)} Small Crate ${decPad(actor.actorId + 1, 2)},        crate,            NONE,                 SCENE_${room.sceneId.toString(16)}, ${hexPad(key, 5)}, ${item}`);
        }
      }
    }
  }
}

function outputGrassWeirdPoolOot(roomActors: RoomActors[]) {
  let lastSceneId = -1;
  let lastSetupId = -1;
  let altGrassAcc = 0;
  for (const room of roomActors) {
    for (const actor of room.actors) {
      if (actor.typeId === ACTORS_OOT.OBJ_HANA) {
        const type = (actor.params) & 3;
        if (type !== 2)
          continue;
        const item = 'NOTHING';
        const key = ((room.setupId & 0x3) << 14) | (room.roomId << 8) | actor.actorId;
        if (room.sceneId != lastSceneId || room.setupId != lastSetupId) {
          console.log('');
          lastSceneId = room.sceneId;
          lastSetupId = room.setupId;
        }
        console.log(`Scene ${room.sceneId.toString(16)} Setup ${room.setupId} Room ${hexPad(room.roomId, 2)} Grass Weird ${decPad(actor.actorId + 1, 2)},        grass,            NONE,                 SCENE_${room.sceneId.toString(16)}, ${hexPad(key, 5)}, ${item}`);
      }
    }
  }
}

function outputPotsPoolMm(roomActors: RoomActors[]) {
  let lastSceneId = -1;
  let lastSetupId = -1;
  for (const room of roomActors) {
    for (const actor of room.actors) {
      if (actor.typeId === ACTORS_MM.POT) {
        let item: string;
        const potType = (actor.params >> 7) & 3;
        const potEnemy = (actor.rz >> 7) & 3;
        if (potEnemy)
          continue;
        switch (potType) {
        case 0:
        case 2:
          /* Set item */
          item = MM_POTS_SET_DROPS[actor.params & 0x1f];
          break;
        case 1:
          /* Magic Pot */
          item = 'MAGIC_JAR_LARGE';
          break;
        case 3:
          /* Random item */
          if (actor.params & 0x10) {
            item = 'NOTHING';
          } else {
            item = MM_POTS_RANDOM_DROPS[actor.params & 0x1f];
          }
          break;
        default:
          item = 'DUMMY';
          break;
        }
        if (item === 'STRAY_FAIRY') {
          continue;
        }
        const key = ((room.setupId & 0x3) << 14) | (room.roomId << 8) | actor.actorId;
        if (room.sceneId != lastSceneId || room.setupId != lastSetupId) {
          console.log('');
          lastSceneId = room.sceneId;
          lastSetupId = room.setupId;
        }
        console.log(`Scene ${room.sceneId.toString(16)} Setup ${room.setupId} Room ${room.roomId} Pot ${actor.actorId}, pot,            NONE,                 SCENE_${room.sceneId.toString(16)}, 0x${key.toString(16)}, ${item}`);
      }

      /*
      if (actor.typeId === ACTORS_MM.FLYING_POT) {
        const key = ((room.setupId & 0x3) << 14) | (room.roomId << 8) | actor.actorId;
        const item = '???';
        console.log(`Scene ${room.sceneId.toString(16)} Setup ${room.setupId} Room ${room.roomId} FLYING Pot ${actor.actorId}, pot,            NONE,                 SCENE_${room.sceneId.toString(16)}, 0x${key.toString(16)}, ${item}`);
      }
      */
    }
  }
}

async function writeAddressingTable(game: Game, addressingTable: AddressingTable) {
  const base = `${__dirname}/../data/static`;
  const scenesTableFilename = `${base}/xflag_table_${game}_scenes.bin`;
  const setupsTableFilename = `${base}/xflag_table_${game}_setups.bin`;
  const roomsTableFilename = `${base}/xflag_table_${game}_rooms.bin`;

  const scenesTableData = Buffer.alloc(addressingTable.scenesTable.length * 2);
  const setupsTableData = Buffer.alloc(addressingTable.setupsTable.length * 2);
  const roomsTableData = Buffer.alloc(addressingTable.roomsTable.length * 2);

  for (let i = 0; i < addressingTable.scenesTable.length; ++i) {
    scenesTableData.writeUInt16BE(addressingTable.scenesTable[i], i * 2);
  }

  for (let i = 0; i < addressingTable.setupsTable.length; ++i) {
    setupsTableData.writeUInt16BE(addressingTable.setupsTable[i], i * 2);
  }

  for (let i = 0; i < addressingTable.roomsTable.length; ++i) {
    roomsTableData.writeInt16BE(addressingTable.roomsTable[i], i * 2);
  }

  return Promise.all([
    fs.writeFile(scenesTableFilename, scenesTableData),
    fs.writeFile(setupsTableFilename, setupsTableData),
    fs.writeFile(roomsTableFilename, roomsTableData),
  ]);
}

function roomActorsFromRaw(rom: Buffer, raw: RawRoom[], game: Game): RoomActors[] {
  const actorsRooms = raw.map(r => parseRoomActors(rom, r, game)).flat();

  /* Inject extra fake rooms */
  if (game === 'mm') {
    actorsRooms.push({
      sceneId: 0x71,
      roomId: 0x00,
      setupId: 0x00,
      actors: [
        { actorId: 0, typeId: ACTORS_MM.POT, pos: [0, 0, 0], params: 0x00, rx: 0, ry: 0, rz: 0x0000, },
        { actorId: 1, typeId: ACTORS_MM.POT, pos: [0, 0, 0], params: 0x00, rx: 0, ry: 0, rz: 0x0000, },
        { actorId: 2, typeId: ACTORS_MM.POT, pos: [0, 0, 0], params: 0x00, rx: 0, ry: 0, rz: 0x0000, },
        { actorId: 3, typeId: ACTORS_MM.POT, pos: [0, 0, 0], params: 0x00, rx: 0, ry: 0, rz: 0x0000, },
        { actorId: 4, typeId: ACTORS_MM.POT, pos: [0, 0, 0], params: 0x00, rx: 0, ry: 0, rz: 0x0000, },
      ]
    });
  }

  return sortRoomActors(actorsRooms);
}

function getGameRoomActor(rom: Buffer, game: Game) {
  const rawRooms = getRawRooms(rom, game);
  const actorRooms = roomActorsFromRaw(rom, rawRooms, game);
  return actorRooms;
}

async function run() {
  /* Get OoT ROM */
  const ootRomCompressed = await fs.readFile(__dirname + '/../../../roms/oot.z64');
  const ootDecompressed = await decompressGame('oot', ootRomCompressed);
  const ootRom = ootDecompressed.rom;

  /* Get MM ROM */
  const mmRomCompressed = await fs.readFile(__dirname + '/../../../roms/mm.z64');
  const mmDecompressed = await decompressGame('mm', mmRomCompressed);
  const mmRom = mmDecompressed.rom;

  /* Get MM Rooms */
  const mmRooms = getGameRoomActor(mmRom, 'mm');

  /* Get MQ ROM */
  const mqRom = await fs.readFile(__dirname + '/../../../roms/mq.z64');

  /* Get OoT Rooms */
  const ootRooms = getGameRoomActor(ootRom, 'oot');

  /* Get MQ Rooms */
  const mqRooms = getGameRoomActor(mqRom, 'mq');

  /* Get the merged list */
  const ootMqRooms = mergeRoomActors([ootRooms, mqRooms]);

  /* Build the addr tables */
  const addrTableOotMq = buildAddressingTable('oot', ootMqRooms);
  const addrTableMm = buildAddressingTable('mm', mmRooms);

  /* Codegen */
  await Promise.all([
    codegenHeader(ootMqRooms, mmRooms, addrTableOotMq, addrTableMm),
  ]);

  /* Gen the xflags files */
  await writeAddressingTable('oot', addrTableOotMq);
  await writeAddressingTable('mm', addrTableMm);

  //outputPotsPoolMm(mmRooms);

  /* Output */
  //outputWonderOot(ootRooms);
  //outputWonderMm(mmRooms);
  //outputPotsPoolOot(mqRooms);
  //outputGrassWeirdPoolOot(ootRooms);
  //outputGrassPoolMm(mmRooms);
  //outputKeatonGrassPoolMm(mmRooms);
  //outputGrassPoolOot(mqRooms);
  //outputFairyPoolOot(ootRooms);
  //outputRupeesMm(mmRooms);
  //outputHeartsMm(mmRooms);
  //outputShotSunOot(ootRooms);
  //outputShotSunOot(mqRooms);
  //outputGrottosMm(mmRooms);
  //outputCratesPoolOot(ootRooms);
  outputCratesPoolMm(mmRooms);
}

run().catch(e => {
  console.error(e);
  process.exit(1);
});
