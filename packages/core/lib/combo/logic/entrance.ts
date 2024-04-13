import { mapValues } from 'lodash';
import { ENTRANCES } from '@ootmm/data';

import { Random, sample } from '../random';
import { Settings } from '../settings';
import { DUNGEONS_REGIONS, ExprMap, World, WorldArea, cloneWorld, BOSS_INDEX_BY_DUNGEON } from './world';
import { Pathfinder } from './pathfind';
import { Monitor } from '../monitor';
import { LogicEntranceError, LogicError } from './error';
import { Expr, exprAge, exprAnd, exprFalse, exprTrue } from './expr';
import { Location, makeLocation } from './locations';
import { LogicPassSolver } from './solve';
import { PlayerItems } from '../items';
import { ItemProperties } from './item-properties';
import { optimizeExpr } from './expr-optimizer';

type Entrance = keyof typeof ENTRANCES;

type PlaceOpts = {
  ownGame?: boolean;
};

type EntrancePools = {[k: string]: { pool: string[], opts: PlaceOpts }};
type PoolEntrances = {[k: string]: { src: Set<Entrance>; dst: Set<Entrance>; }};

type EntranceOverrides = {[k in Entrance]?: Entrance | null};

class WorldShuffler {
  private world: World;
  private overrides: EntranceOverrides;
  private backtrackCount: number;

  constructor(
    private random: Random,
    private worldId: number,
    private worlds: World[],
    private settings: Settings,
    private startingItems: PlayerItems,
  ) {
    this.backtrackCount = 0;
    this.world = worlds[worldId];
    this.overrides = {};
  }

  private getExpr(original: Entrance) {
    const eData = ENTRANCES[original];
    const from = this.world.areas[eData.from];
    const expr = from.exits[eData.to];
    if (!expr) {
      throw new Error(`No expr for ${original}`);
    }
    return expr;
  }

  private songOfTime(e: Expr): Expr {
    const subcond = this.world.exprParsers.mm.parse('can_reset_time');
    return exprAnd([e, subcond]);
  }

  private placeSingle(world: World, original: Entrance, replacement: Entrance) {
    const entranceOriginal = ENTRANCES[original];
    const entranceReplacement = ENTRANCES[replacement];

    /* Change the world */
    let expr = this.getExpr(original);
    if ((entranceOriginal.game === 'oot' || entranceOriginal.type === 'one-way-statue') && entranceReplacement.game === 'mm') {
      if (entranceOriginal.game === 'oot' && entranceReplacement.game === 'mm' && ['overworld', 'region'].includes(entranceReplacement.type)) {
        world.areas[entranceOriginal.from].exits['MM GLOBAL'] = expr;
      }
      if (!((entranceReplacement.flags as string[]).includes('no-sot'))) {
        expr = this.songOfTime(expr);
      }
    }
    world.areas[entranceOriginal.from].exits[entranceReplacement.to] = expr;

    /* Mark the override */
    world.entranceOverrides.set(original, replacement);
  }

  private changedWorld(overrides: EntranceOverrides, assumed?: Iterable<Entrance>): World {
    const newWorld = cloneWorld(this.world);

    /* Create the assumed area */
    if (assumed) {
      const areaAssumed: WorldArea = {
        game: 'mm',
        region: 'NONE',
        exits: {},
        locations: {},
        events: {},
        boss: false,
        ageChange: false,
        gossip: {},
        dungeon: null,
        stay: null,
        time: 'flow',
      };
      newWorld.areas['ASSUMED'] = areaAssumed;
      newWorld.areas['OOT SPAWN'].exits['ASSUMED'] = exprTrue();

      for (const a of assumed) {
        const oldE = ENTRANCES[a];
        newWorld.areas['ASSUMED'].exits[oldE.to] = exprTrue();
      }
    }

    /* Remove the entrances */
    for (const oldName of Object.keys(overrides) as Entrance[]) {
      const oldE = ENTRANCES[oldName];
      delete newWorld.areas[oldE.from].exits[oldE.to];
    }

    /* Place the new entrances */
    for (const oldName of Object.keys(overrides) as Entrance[]) {
      const newName = overrides[oldName];
      if (newName) {
        this.placeSingle(newWorld, oldName, newName);
      }
    }

    return newWorld;
  }

  private isValidShuffle(overrides: EntranceOverrides, assumed: Iterable<Entrance>) {
    if (this.settings.logic === 'none') {
      return true;
    }

    /* Build the new world list */
    const newWorld = this.changedWorld(overrides, assumed);
    const worlds = [...this.worlds];
    worlds[this.worldId] = newWorld;

    /* Run the pathfinder */
    const pathfinder = new Pathfinder(worlds, this.settings, this.startingItems);
    const pathfinderState = pathfinder.run(null, { singleWorld: this.worldId, ignoreItems: true, recursive: true });

    if (!pathfinderState.goal) {
      return false;
    }

    if (this.settings.logic === 'allLocations' && pathfinderState.locations.size < newWorld.locations.size) {
      return false;
    }

    return true;
  }

  private reverseEntranceRaw(entrance: Entrance): Entrance | null {
    const e = ENTRANCES[entrance];
    const rr = (e as any).reverse as Entrance | undefined;
    if (!rr) {
      return null;
    }
    return rr;
  }

  private reverseEntrance(entrance: Entrance): Entrance | null {
    if (this.settings.erDecoupled) {
      return null;
    }

    return this.reverseEntranceRaw(entrance);
  }

  private entrances(entrance: Entrance) {
    const entrs: Entrance[] = [entrance];
    if (this.settings.erDecoupled) {
      const rev = this.reverseEntranceRaw(entrance);
      if (rev) {
        entrs.push(rev);
      }
    }
    return entrs;
  }

  private placePoolsRecursive(pools: EntrancePools, entrances: PoolEntrances, overrides: EntranceOverrides, assumed: Set<Entrance>): EntranceOverrides | null {
    if (Object.keys(entrances).length === 0) {
      return overrides;
    }

    /* Select a pool */
    const poolName = sample(this.random, Object.keys(entrances));
    const pool = entrances[poolName];

    /* Select a source */
    const src = sample(this.random, [...pool.src]);

    /* Build the candidates list */
    let dstCandidates = new Set(pool.dst);
    if (pools[poolName].opts?.ownGame) {
      dstCandidates = new Set([...dstCandidates].filter(x => ENTRANCES[x].game === ENTRANCES[src].game));
    }

    /* Try to find a match */
    while (dstCandidates.size > 0) {
      const dst = sample(this.random, [...dstCandidates]);
      dstCandidates.delete(dst);
      const revSrc = this.reverseEntrance(src);
      const revDst = this.reverseEntrance(dst);
      const newOverrides = { ...overrides };
      const newAssumed = new Set(assumed);
      newOverrides[src] = dst;
      newAssumed.delete(dst);
      if (revSrc && revDst) {
        newOverrides[revDst] = revSrc;
        newAssumed.delete(revSrc);
      }
      if (!this.isValidShuffle(newOverrides, newAssumed)) {
        continue;
      }

      /* The match is valid */
      const newEntrances = { ...entrances };
      newEntrances[poolName] = { src: new Set(pool.src), dst: new Set(pool.dst) };
      newEntrances[poolName].src.delete(src);
      newEntrances[poolName].dst.delete(dst);
      if (newEntrances[poolName].src.size === 0) {
        delete newEntrances[poolName];
      }
      const finalOverrides = this.placePoolsRecursive(pools, newEntrances, newOverrides, newAssumed);
      if (finalOverrides) {
        return finalOverrides;
      }
    }

    this.backtrackCount++;
    if (this.backtrackCount > 100) {
      throw new LogicEntranceError('Too many backtracks');
    }
    return null;
  }

  private placePools(pools: EntrancePools) {
    this.backtrackCount = 0;
    const overrides = { ...this.overrides };
    const poolEntrances: PoolEntrances = {};

    /* Get entrances */
    const poolNames = new Set(Object.keys(pools));
    const entrancesTypes = new Set<string>();
    let entrancesAssumed = new Set<Entrance>();

    for (const name of poolNames) {
      const types = pools[name].pool;
      for (const t of types) {
        entrancesTypes.add(t);
      }
      const entrances = (Object.keys(ENTRANCES) as Entrance[]).filter(x => types.includes(ENTRANCES[x].type)).flatMap(x => this.entrances(x));
      const entrancesReverse = entrances.map(x => this.reverseEntrance(x)).filter(x => x) as Entrance[];
      const entrancesAll = [...entrances, ...entrancesReverse];

      const src = new Set([...entrances]);
      const dst = new Set([...entrances]);
      poolEntrances[name] = { src, dst };

      for (const name of entrancesAll) {
        overrides[name] = null;
        const e = ENTRANCES[name];
        if (!(['dungeon-exit', 'grotto-exit', 'grave-exit'].includes(e.type)) || name === 'OOT_DESERT_COLOSSUS_FROM_TEMPLE_SPIRIT' || this.settings.erDecoupled) {
          entrancesAssumed.add(name);
        }
      }
    }

    /* Remove any empty pools */
    for (const name of poolNames) {
      if (poolEntrances[name].src.size === 0) {
        delete poolEntrances[name];
      }
    }

    const finalOverrides = this.placePoolsRecursive(pools, poolEntrances, overrides, entrancesAssumed);
    if (!finalOverrides) {
      throw new LogicEntranceError('Unable to place pools');
    }
    this.overrides = finalOverrides;
  }

  private shuffledPools(def?: string[]) {
    let pool: string[] = [];

    if (this.settings.erOneWays !== 'none') {
      pool = [...pool, 'one-way', 'one-way-ikana', 'one-way-song', 'one-way-statue', 'one-way-owl'];
    }

    if (this.settings.erDungeons !== 'none') {
      pool = [...pool, 'dungeon'];
    }

    if (this.settings.erBoss !== 'none') {
      pool = [...pool, 'boss'];
    }

    if (this.settings.erGrottos !== 'none') {
      pool = [...pool, 'grotto', 'grave'];
    }

    if (pool.length === 0) {
      return def;
    }

    return pool;
  }

  private placeWallmasters() {
    const pool = this.shuffledPools(['dungeon'])!;

    const entrancesSrc = new Set((Object.keys(ENTRANCES) as Entrance[]).filter(x => ENTRANCES[x].type === 'wallmaster' && this.world.areas.hasOwnProperty(ENTRANCES[x].from)));
    const entrancesDst = new Set((Object.keys(ENTRANCES) as Entrance[]).filter(x => pool.includes(ENTRANCES[x].type)));

    /* Sanity - TODO: base this on real ER settings */
    entrancesDst.delete('MM_CLOCK_TOWER');
    entrancesDst.delete('MM_CLOCK_TOWN_FROM_CLOCK_TOWER');
    entrancesDst.delete('OOT_GANON_CASTLE');
    entrancesDst.delete('OOT_GANON_CASTLE_EXTERIOR_FROM_CASTLE');
    entrancesDst.delete('OOT_GANON_TOWER');
    entrancesDst.delete('OOT_GANON_CASTLE_FROM_TOWER');

    while (entrancesSrc.size > 0) {
      const src = sample(this.random, [...entrancesSrc]);
      let dstCandidates = [...entrancesDst];
      if (this.settings.erWallmasters === 'ownGame') {
        dstCandidates = dstCandidates.filter(x => ENTRANCES[x].game === ENTRANCES[src].game);
      }
      const dst = sample(this.random, dstCandidates);
      this.overrides[src] = dst;
      entrancesSrc.delete(src);
      entrancesDst.delete(dst);
    }
  }

  private poolDungeons() {
    const pool: string[] = [];

    if (this.settings.erMajorDungeons) pool.push('dungeon');
    if (this.settings.erMinorDungeons) pool.push('dungeon-minor');
    if (this.settings.erGanonCastle) pool.push('dungeon-ganon');
    if (this.settings.erGanonTower) pool.push('dungeon-ganon-tower');
    if (this.settings.erSpiderHouses) pool.push('dungeon-sh');
    if (this.settings.erPirateFortress) pool.push('dungeon-pf');
    if (this.settings.erBeneathWell) pool.push('dungeon-btw');
    if (this.settings.erIkanaCastle) pool.push('dungeon-acoi');
    if (this.settings.erSecretShrine) pool.push('dungeon-ss');
    if (this.settings.erMoon) pool.push('dungeon-ctr');

    return { pool, opts: { ownGame: this.settings.erDungeons === 'ownGame' } };
  }

  private poolRegions() {
    const pool = new Set(['region']);
    if (this.settings.erRegionsExtra) {
      pool.add('region-extra');
    }
    if (this.settings.erRegionsShortcuts) {
      pool.add('region-shortcut');
    }
    return { pool: Array.from(pool), opts: { ownGame: this.settings.erRegions === 'ownGame' } };
  }

  private poolIndoors() {
    const pool = new Set(['indoors']);
    if (!this.settings.erIndoorsMajor) {
      pool.delete('indoors');
    }
    if (this.settings.erIndoorsExtra) {
      pool.add('indoors-extra');
    }
    return { pool: Array.from(pool), opts: { ownGame: this.settings.erIndoors === 'ownGame' } };
  }

  private poolWarps() {
    const pool = new Set(['one-way-song', 'one-way-statue']);

    if (this.settings.erWarps === 'ootOnly') {
      pool.delete('one-way-statue');
    }
    if (this.settings.erWarps === 'mmOnly') {
      pool.delete('one-way-song');
    }

    return { pool: Array.from(pool), opts: { ownGame: this.settings.erWarps === 'ownGame' } };
  }

  private poolOneWays() {
    const pool = new Set(['one-way']);

    if (!this.settings.erOneWaysMajor) {
      pool.delete('one-way');
    }
    if (this.settings.erOneWaysIkana) {
      pool.add('one-way-ikana');
    }
    if (this.settings.erOneWaysSongs) {
      pool.add('one-way-song');
    }
    if (this.settings.erOneWaysStatues) {
      pool.add('one-way-statue');
    }
    if (this.settings.erOneWaysOwls) {
      pool.add('one-way-owl');
    }
    if (this.settings.erOneWaysWoods) {
      pool.add('one-way-woods');
    }

    return { pool: Array.from(pool), opts: { ownGame: this.settings.erOneWays === 'ownGame' } };
  }

  private poolGrottos() {
    const pool = ['grotto', 'grave'];
    return { pool, opts: { ownGame: this.settings.erGrottos === 'ownGame' } };
  }

  private isAssignableLegacy(world: World, original: Entrance, replacement: Entrance, opts?: { ownGame?: boolean, locations?: string[] }) {
    const originalWorld = this.world;
    const originalEntrance = ENTRANCES[original];
    const replacementEntrance = ENTRANCES[replacement];
    const dungeon = originalWorld.areas[replacementEntrance.to].dungeon!;

    /* Reject wrong game */
    if (opts?.ownGame) {
      if (originalEntrance.game !== replacementEntrance.game) {
        return false;
      }
    }

    /* Not all locations */
    if (this.settings.logic !== 'allLocations') {
      return true;
    }

    /* Apply an override */
    world.areas[originalEntrance.from].exits[replacementEntrance.to] = this.getExpr(original);

    /* If the dungeon is ST or IST, we need to allow the other dungeon */
    if (dungeon === 'ST') {
      world.areas['OOT SPAWN'].exits['MM Stone Tower Temple Inverted'] = exprTrue();
    }
    if (dungeon === 'IST') {
      world.areas['OOT SPAWN'].exits['MM Stone Tower Temple'] = exprTrue();
    }

    /* Check if the new world is valid */
    const allWorlds = [...this.worlds];
    allWorlds[this.worldId] = world;
    const pathfinder = new Pathfinder(allWorlds, this.settings, this.startingItems);
    const pathfinderState = pathfinder.run(null, { singleWorld: this.worldId, ignoreItems: true, recursive: true });

    /* Restore the override */
    delete world.areas[originalEntrance.from].exits[replacementEntrance.to]
    delete world.areas['OOT SPAWN'].exits['MM Stone Tower Temple Inverted'];
    delete world.areas['OOT SPAWN'].exits['MM Stone Tower Temple'];

    /* Get the list of required locations */
    let locations: string[];
    if (opts?.locations) {
      locations = opts.locations;
    } else if (['ST', 'IST'].includes(dungeon)) {
      locations = [...world.dungeons['ST'], ...world.dungeons['IST']];
    } else {
      locations = Array.from(world.dungeons[dungeon]);
    }

    /* Turn into locations */
    const worldLocs = locations.map(l => makeLocation(l, this.worldId));

    /* Check if the new world is valid */
    if (!(worldLocs.every(l => pathfinderState.locations.has(l))))
      return false;

    /* Ganon's tower check */
    if (dungeon === 'Tower' && ['ganon', 'both'].includes(this.settings.goal) && !pathfinderState.ws[this.worldId].events.has('OOT_GANON'))
      return false;

    return true;
  }

  private legacyFixBosses(world: World): World {
    const bossEntrances = (Object.keys(ENTRANCES) as Entrance[]).filter(x => ENTRANCES[x].type === 'boss');
    const bossEntrancesByDungeon = new Map<string, Entrance>();
    const bossEvents = new Map<string, ExprMap>();
    const bossAreas = new Map<string, string[]>();
    const bossLocations = new Map<string, string[]>();

    /* Collect every boss event */
    for (const a in world.areas) {
      const area = world.areas[a];
      const dungeon = area.dungeon!;
      if (area.boss) {
        /* Events */
        if (!bossEvents.has(dungeon)) {
          bossEvents.set(dungeon, {});
        }
        const oldEvents = bossEvents.get(dungeon)!;
        bossEvents.set(dungeon, { ...oldEvents, ...area.events });

        /* Areas */
        if (!bossAreas.has(dungeon)) {
          bossAreas.set(dungeon, []);
        }
        bossAreas.get(dungeon)!.push(a);

        /* Locations */
        if (!bossLocations.has(dungeon)) {
          bossLocations.set(dungeon, []);
        }
        const locs = bossLocations.get(dungeon)!;
        for (const l in area.locations) {
          locs.push(l);
        }

        /* Remove the event */
        area.events = {};
      }
    }

    /* Collect the entrances and delete the original ones */
    for (const eName of bossEntrances) {
      const e = ENTRANCES[eName];
      const areaFrom = world.areas[e.from];
      const areaTo = world.areas[e.to];

      /* We have a boss entrance */
      const dungeon = areaTo.dungeon!;
      bossEntrancesByDungeon.set(dungeon, eName);

      /* Remove the entrance */
      delete areaFrom.exits[e.to];
    }

    /* Actually shuffle bosses */
    const unplacedBosses = new Set(bossEntrancesByDungeon.keys());
    const unplacedLocs = new Set(bossLocations.keys());
    const assigns = new Map<string, Set<string>>();
    while (unplacedBosses.size > 0) {
      /* Refresh the assigns */
      for (const boss of unplacedBosses) {
        if (!assigns.has(boss)) {
          assigns.set(boss, new Set());
        }
        const locs = assigns.get(boss)!;
        for (const loc of unplacedLocs) {
          if (locs.has(loc)) {
            continue;
          }
          if (this.isAssignableLegacy(world, bossEntrancesByDungeon.get(loc)!, bossEntrancesByDungeon.get(boss)!, { ownGame: this.settings.erBoss === 'ownGame', locations: bossLocations.get(boss)! })) {
            locs.add(loc);
          }
        }
      }

      const minSize = Math.min(...Array.from(assigns.values()).map(s => s.size));
      const bosses = Array.from(assigns.entries()).filter(([_, s]) => s.size === minSize).map(([k, _]) => k);
      const boss = sample(this.random, bosses);
      const locs = assigns.get(boss)!;
      if (locs.size === 0) {
        throw new LogicEntranceError(`Nowhere to place boss ${boss}`);
      }
      const loc = sample(this.random, Array.from(locs));

      /* Mark as placed */
      unplacedBosses.delete(boss);
      unplacedLocs.delete(loc);
      assigns.delete(boss);
      for (const l of assigns.values()) {
        l.delete(loc);
      }

      /* Place the boss */
      const src = bossEntrancesByDungeon.get(loc)!;
      const dst = bossEntrancesByDungeon.get(boss)!;
      world.areas[ENTRANCES[src].from].exits[ENTRANCES[dst].to] = this.getExpr(src);
      world.entranceOverrides.set(src, dst);
      world.bossIds[BOSS_INDEX_BY_DUNGEON[boss]] = BOSS_INDEX_BY_DUNGEON[loc];

      /* Add the events */
      const areaNames = bossAreas.get(boss)!;
      const lastAreaName = areaNames[areaNames.length - 1];
      const lastArea = world.areas[lastAreaName];
      lastArea.events = { ...lastArea.events, ...bossEvents.get(loc)! };

      /* Change the associated dungeon */
      for (const a of bossAreas.get(boss)!) {
        const area = world.areas[a];
        area.dungeon = loc;
        area.region = DUNGEONS_REGIONS[loc];

        for (const l in area.locations) {
          world.regions[l] = DUNGEONS_REGIONS[loc];
          world.dungeons[boss].delete(l);
          world.dungeons[loc].add(l);
        }
      }
    }

    return world;
  }

  run(): World {
    this.overrides = {};
    const pools: EntrancePools = {};

    if (this.settings.erWallmasters !== 'none') {
      this.placeWallmasters();
    }

    if (this.settings.erDungeons !== 'none') {
      pools.DUNGEONS = this.poolDungeons();
    }

    if (this.settings.erGrottos !== 'none') {
      pools.GROTTOS = this.poolGrottos();
    }

    if (this.settings.erRegions !== 'none') {
      pools.REGIONS = this.poolRegions();
    }

    if (this.settings.erIndoors !== 'none') {
      pools.INDOORS = this.poolIndoors();
    }

    if (this.settings.erMixed !== 'none') {
      pools.MIXED = { pool: [], opts: { ownGame: this.settings.erMixed === 'ownGame' } };

      if (this.settings.erMixedDungeons) {
        pools.MIXED.pool = [...pools.MIXED.pool, ...pools.DUNGEONS.pool];
        delete pools.DUNGEONS;
      }

      if (this.settings.erMixedGrottos) {
        pools.MIXED.pool = [...pools.MIXED.pool, ...pools.GROTTOS.pool];
        delete pools.GROTTOS;
      }

      if (this.settings.erMixedRegions) {
        pools.MIXED.pool = [...pools.MIXED.pool, ...pools.REGIONS.pool];
        delete pools.REGIONS;
      }

      if (this.settings.erMixedIndoors) {
        pools.MIXED.pool = [...pools.MIXED.pool, ...pools.INDOORS.pool];
        delete pools.INDOORS;
      }
    }

    if (this.settings.erWarps !== 'none') {
      pools.WARPS = this.poolWarps();
    }
    if (this.input.settings.erRegionsShortcuts) {
      pool.add('region-shortcut');
    }
    if (this.input.settings.erRegionsFull) {
      pool.add('region-full')
    }
    /* this.placePools(worldId, Array.from(pool), { ownGame: this.input.settings.erRegions === 'ownGame' } ); */
    return { pool: Array.from(pool), opts: { ownGame: this.input.settings.erRegions === 'ownGame' } };
  }

    if (this.settings.erOneWays !== 'none') {
      pools.ONE_WAYS = this.poolOneWays();
    }

    this.placePools(pools);

    let world = this.changedWorld(this.overrides);
    if (this.settings.erBoss !== 'none') {
      world = this.legacyFixBosses(world);
    }
    if (this.input.settings.erWarps === 'ootOnly') {
      pool.delete('one-way-statue');
    }
    if (this.input.settings.erWarps === 'mmOnly') {
      pool.delete('one-way-song');
    }

    return { pool: Array.from(pool), opts: { ownGame: this.input.settings.erWarps === 'ownGame' } };
  }

  private poolOneWays(worldId: number) {
    const pool = new Set(['one-way']);

    if (!this.input.settings.erOneWaysMajor) {
      pool.delete('one-way');
    }
    if (this.input.settings.erOneWaysIkana) {
      pool.add('one-way-ikana');
    }
    if (this.input.settings.erOneWaysSongs) {
      pool.add('one-way-song');
    }
    if (this.input.settings.erOneWaysStatues) {
      pool.add('one-way-statue');
    }
    if (this.input.settings.erOneWaysOwls) {
      pool.add('one-way-owl');
    }
    if (this.input.settings.erOneWaysVoids) {
      pool.add('one-way-void');
    }
    if (this.input.settings.erOneWaysWoods) {
      pool.add('one-way-woods');
    }

    return { pool: Array.from(pool), opts: { ownGame: this.input.settings.erOneWays === 'ownGame' } };
  }

  private shuffledPools(def?: string[]) {
    let pool: string[] = [];

    if (this.input.settings.erOneWays !== 'none') {
      pool = [...pool, 'one-way', 'one-way-ikana', 'one-way-song', 'one-way-statue', 'one-way-owl', 'one-way-void'];
    }

    if (this.input.settings.erDungeons !== 'none') {
      pool = [...pool, 'dungeon'];
    }

    if (this.input.settings.erBoss !== 'none') {
      pool = [...pool, 'boss'];
    }

    if (this.input.settings.erRegionsFull) {
      pool = [...pool, 'region-full', 'region']
    }
	
    if (this.input.settings.erGrottos !== 'none') {
      pool = [...pool, 'grotto', 'grave'];
    }

    return world;
  }
};

export class LogicPassEntrances {
  private worlds: World[];

  constructor(
    private readonly input: {
      worlds: World[];
      settings: Settings;
      random: Random;
      monitor: Monitor;
      fixedLocations: Set<Location>,
      pool: PlayerItems;
      renewableJunks: PlayerItems;
      startingItems: PlayerItems;
      itemProperties: ItemProperties;
    },
  ) {
    this.worlds = [];
  }

  private changeRegion(worldId: number, area: string, newRegion: string) {
    const world = this.worlds[worldId];
    world.areas[area].region = newRegion;
    for (const loc of Object.keys(world.areas[area].locations)) {
      if (world.regions[loc] === 'ENTRANCE') {
        world.regions[loc] = newRegion;
      }
    }
  }

  private propagateRegionsStep(worldId: number) {
    const world = this.worlds[worldId];
    let changed = false;
    for (const areaName of Object.keys(world.areas)) {
      const a = world.areas[areaName];
      if (a.region === 'NONE' || a.region === 'ENTRANCE')
        continue;
      /* We need to propagate the region */
      for (const exitName of Object.keys(a.exits)) {
        const exitArea = world.areas[exitName];
        if (exitArea == undefined) {
          throw new LogicEntranceError(`Unknown exit: ${exitName}`);
        }
        if (exitArea.region === 'ENTRANCE') {
          this.changeRegion(worldId, exitName, a.region);
          changed = true;
        }
      }
    }
    return changed;
  }

  private propagateRegions() {
    /* Propagate regions */
    for (let i = 0; i < this.worlds.length; ++i) {
      for (;;) {
        if (!this.propagateRegionsStep(i)) {
          break;
        }
      }
    }

    /* Check for unassigned regions */
    for (let i = 0; i < this.worlds.length; ++i) {
      const world = this.worlds[i];
      for (const areaName of Object.keys(world.areas)) {
        const a = world.areas[areaName];
        if (a.region === 'ENTRANCE') {
          this.changeRegion(i, areaName, 'NAMELESS');
        }
      }
    }
  }

  private validateAgeTemple() {
    const newWorlds = this.worlds.map(w => cloneWorld(w));
    for (const w of newWorlds) {
      const a = w.areas['OOT SPAWN'];
      if (this.input.settings.startingAge === 'child') {
        a.exits['OOT SPAWN ADULT'] = exprAge('adult');
        a.exits['OOT SPAWN CHILD'] = exprFalse();
      } else {
        a.exits['OOT SPAWN ADULT'] = exprFalse();
        a.exits['OOT SPAWN CHILD'] = exprAge('child');
      }
    }

    const agePathfinder = new Pathfinder(newWorlds, this.input.settings, this.input.startingItems);
    const pathfinderState = agePathfinder.run(null, { recursive: true });
    const target = 'OOT Temple of Time';
    if (pathfinderState.ws.some(x => !(x.areas.adult.has(target) || x.areas.child.has(target)))) {
      throw new LogicEntranceError('Temple of Time is unreachable from the non-starting age');
    }
  }

  private validate() {
    if (this.input.settings.logic === 'none')
      return;
    this.validateAgeTemple();
    const pathfinder = new Pathfinder(this.worlds, this.input.settings, this.input.startingItems);
    const pathfinderState = pathfinder.run(null, { ignoreItems: true, recursive: true });

    /* We want to make sure everything that needs to is reachable */
    if (!pathfinderState.goal) {
      throw new LogicEntranceError('Goal is not reachable');
    }

    if (this.input.settings.logic === 'allLocations') {
      const allLocsCount = this.worlds.map(x => x.locations.size).reduce((a, b) => a + b, 0);
      if (pathfinderState.locations.size < allLocsCount) {
        const allLocations = this.worlds.map((x, i) => [...x.locations].map(y => makeLocation(y, i))).flat();
        const unreachableLocs = allLocations.filter(x => !pathfinderState.locations.has(x));
        throw new LogicEntranceError(`Unreachable locations: ${unreachableLocs.join(', ')}`);
      }
    }

    /* Validate using the solver */
    const solver = new LogicPassSolver({ ...this.input, worlds: this.worlds });
    solver.validate();
  }

  private runAttempt() {
    this.worlds = [];

    if (this.input.settings.distinctWorlds) {
      /* Distinct worlds */
      for (let i = 0; i < this.input.worlds.length; ++i) {
        const shuffler = new WorldShuffler(this.input.random, i, this.input.worlds, this.input.settings, this.input.startingItems);
        const newWorld = shuffler.run();
        this.worlds.push(newWorld);
      }
    for (let i = 0; i < worldsCount; ++i) {
      const pools: EntrancePools = {};

      if (this.input.settings.erWallmasters !== 'none') {
        anyEr = true;
        this.placeWallmasters(i);
      }

      if (this.input.settings.erRegions !== 'none' || this.input.settings.erRegionsFull) {
        anyEr = true;
        pools.REGIONS = this.poolRegions(i);
        /* this.placeRegions(i); */
      }
	  
      if (this.input.settings.erGrottos !== 'none') {
        anyEr = true;
        pools.GROTTOS = this.poolGrottos()
        /* this.placeGrottos(i); */
      }

      if (this.input.settings.erIndoors !== 'none') {
        anyEr = true;
        pools.INDOORS = this.poolIndoors(i);
      }
    } else {
      /* Shared world */
      const shuffler = new WorldShuffler(this.input.random, 0, this.input.worlds, this.input.settings, this.input.startingItems);
      const newWorld = shuffler.run();
      for (let i = 0; i < this.input.worlds.length; ++i) {
        this.worlds.push(cloneWorld(newWorld));
      }
    }

    /* Validate */
    if (this.worlds[0].entranceOverrides.size) {
      this.validate();
    }
    this.propagateRegions();

    return { worlds: this.worlds };
  }

  run() {
    let attempts = 1;

    /* TODO: Do this somewhere else */
    for (const world of this.input.worlds) {
      for (const area of Object.values(world.areas)) {
        area.exits = mapValues(area.exits, e => optimizeExpr(e));
        area.events = mapValues(area.events, e => optimizeExpr(e));
        area.locations = mapValues(area.locations, e => optimizeExpr(e));
      }
    }

    for (;;) {
      try {
        this.input.monitor.log(`Logic: Entrances (attempt ${attempts})`);
        return this.runAttempt();
      } catch (e) {
        if (!(e instanceof LogicError) || attempts >= 1000)
          throw e;
        if (e.stack) {
          this.input.monitor.debug(e.stack);
        }
        attempts++;
      }
    }
  }
};
