import { cloneDeep } from 'lodash';
import { Settings } from '../settings';
import { AreaData, Expr, exprDependencies, ExprResult, isDefaultRestrictions, MM_TIME_SLICES } from './expr';

import { addItem, addRawItem, combinedItems, combinedRawItems, Item, itemData, Items } from './items';
import { Location, locationData, makeLocation, makePlayerLocations } from './locations';
import { World } from './world';
import { isLocationLicenseGranting, isLocationRenewable } from './locations';
import { ItemPlacement } from './solve';

export const AGES = ['child', 'adult'] as const;

export type Age = typeof AGES[number];

type PathfinderDependencyList = {
  locations: Set<string>;
  events: Set<string>;
  gossips: Set<string>;
  exits: {
    child: Set<string>;
    adult: Set<string>;
  };
};

type PathfinderDependencySet = Map<string, Map<string, PathfinderDependencyList>>;

type PathfinderDependencies = {
  items: PathfinderDependencySet;
  events: PathfinderDependencySet;
};

type PathfinderQueue = {
  locations: Map<string, Set<string>>;
  events: Map<string, Set<string>>;
  gossips: Map<string, Set<string>>;
  exits: {
    child: Map<string, Set<string>>;
    adult: Map<string, Set<string>>;
  }
};

type PathfinderWorldState = {
  areas: {
    child: Map<string, AreaData>;
    adult: Map<string, AreaData>;
  },
  locations: Set<string>;
  queue: PathfinderQueue;
  dependencies: PathfinderDependencies;
  uncollectedLocations: Set<string>;
  items: {[k: string]: number};
  licenses: {[k: string]: number};
  renewables: {[k: string]: number};
  forbiddenReachableLocations: Set<string>;
  events: Set<string>;
  gossip: Set<string>;
}

export type PathfinderState = {
  items: Items;
  goal: boolean;
  started: boolean;
  newLocations: Set<Location>;
  ws: PathfinderWorldState[];

  /* Output */
  locations: Set<Location>;
}

const emptyDepList = (): PathfinderDependencyList => ({
  locations: new Set(),
  events: new Set(),
  gossips: new Set(),
  exits: {
    child: new Set(),
    adult: new Set(),
  },
});

const defaultWorldState = (settings: Settings): PathfinderWorldState => ({
  areas: {
    child: new Map(),
    adult: new Map(),
  },
  queue: {
    locations: new Map(),
    events: new Map(),
    gossips: new Map(),
    exits: {
      child: new Map(),
      adult: new Map(),
    },
  },
  locations: new Set(),
  dependencies: {
    items: new Map(),
    events: new Map(),
  },
  uncollectedLocations: new Set(),
  items: { ...settings.startingItems },
  licenses: { ...settings.startingItems },
  renewables: {},
  forbiddenReachableLocations: new Set(),
  events: new Set(),
  gossip: new Set(),
});

const defaultWorldStates = (settings: Settings) => {
  const ws: PathfinderWorldState[] = [];

  for (let world = 0; world < settings.players; ++world) {
    ws.push(defaultWorldState(settings));
  }

  return ws;
}

const defaultState = (settings: Settings): PathfinderState => ({
  items: {},
  goal: false,
  started: false,
  ws: defaultWorldStates(settings),
  locations: new Set(),
  newLocations: new Set(),
});

const defaultAreaData = (): AreaData => ({
  oot: {
    day: false,
    night: false,
  },
  mmTime: 0,
  mmTime2: 0,
});

const mergeAreaData = (a: AreaData, b: AreaData): AreaData => ({
  oot: {
    day: a.oot.day || b.oot.day,
    night: a.oot.night || b.oot.night,
  },
  mmTime: (a.mmTime | b.mmTime) >>> 0,
  mmTime2: (a.mmTime2 | b.mmTime2) >>> 0,
});

const compareAreaData = (a: AreaData, b: AreaData): boolean => (
  a.oot.day === b.oot.day &&
  a.oot.night === b.oot.night &&
  a.mmTime === b.mmTime &&
  a.mmTime2 === b.mmTime2
);

const cloneAreaData = (a: AreaData): AreaData => ({
  oot: {
    day: a.oot.day,
    night: a.oot.night,
  },
  mmTime: a.mmTime,
  mmTime2: a.mmTime2,
});

export type EntranceOverrides = {[k: string]: {[k: string]: string | null}};
type PathfinderOptions = {
  assumedItems?: Items;
  items?: ItemPlacement;
  ignoreItems?: boolean;
  recursive?: boolean;
  stopAtGoal?: boolean;
  restrictedLocations?: Set<string>;
  forbiddenLocations?: Set<string>;
  includeForbiddenReachable?: boolean;
};

export class Pathfinder {
  private opts!: PathfinderOptions;
  private state!: PathfinderState;

  constructor(
    private readonly world: World,
    private readonly settings: Settings,
  ) {
  }

  run(state: PathfinderState | null, opts?: PathfinderOptions) {
    this.opts = opts || {};
    this.state = state ? cloneDeep(state) : defaultState(this.settings);

    for (const item of Object.keys(this.opts.assumedItems || {}) as Item[]) {
      const itemD = itemData(item);
      const ws = this.state.ws[itemD.player as number];
      addRawItem(ws.items, itemD.id);
      addRawItem(ws.renewables, itemD.id);
      addRawItem(ws.licenses, itemD.id);
    }

    this.pathfind();
    return this.state;
  }

  private queueLocation(world: number, loc: string, areaFrom: string) {
    const queue = this.state.ws[world].queue.locations;
    if (!queue.has(loc)) {
      queue.set(loc, new Set([areaFrom]));
    } else {
      queue.get(loc)!.add(areaFrom);
    }
  }

  private queueEvent(world: number, event: string, areaFrom: string) {
    const queue = this.state.ws[world].queue.events;
    if (!queue.has(event)) {
      queue.set(event, new Set([areaFrom]));
    } else {
      queue.get(event)!.add(areaFrom);
    }
  }

  private queueExit(world: number, age: Age, exit: string, area: string) {
    const queue = this.state.ws[world].queue.exits[age];
    if (!queue.has(exit)) {
      queue.set(exit, new Set([area]));
    } else {
      queue.get(exit)!.add(area);
    }
  }

  private queueGossip(world: number, gossip: string, area: string) {
    const queue = this.state.ws[world].queue.gossips;
    if (!queue.has(gossip)) {
      queue.set(gossip, new Set([area]));
    } else {
      queue.get(gossip)!.add(area);
    }
  }

  /**
   * Explore an area, adding all locations and events to the queue
   */
  private exploreArea(world: number, age: Age, area: string, sourceAreaData: AreaData, fromArea: string) {
    /* Compute the previous area data and compare it to the old one */
    const ws = this.state.ws[world];
    const previousAreaData = ws.areas[age].get(area);
    const newAreaData = previousAreaData ? mergeAreaData(previousAreaData, sourceAreaData) : sourceAreaData;
    const worldArea = this.world.areas[area];
    if (worldArea.game === 'oot') {
      if (['day', 'flow'].includes(worldArea.time)) {
        newAreaData.oot.day = true;
      }
      if (['night', 'flow'].includes(worldArea.time)) {
        newAreaData.oot.night = true;
      }
    } else {
      /* MM: Expand the time range */
      if (newAreaData.mmTime === 0 && newAreaData.mmTime2 === 0) {
        return;
      }

      /* If we come from OoT, we can song of time to get back to day 1 */
      const fa = this.world.areas[fromArea];
      if (fa.game === 'oot') {
        newAreaData.mmTime = (newAreaData.mmTime | (1 << 0)) >>> 0;
      }

      /* We can wait to reach later time slices */
      let earliest: number;
      if (newAreaData.mmTime) {
        earliest = Math.floor(Math.log2(newAreaData.mmTime));
      } else {
        earliest = Math.floor(Math.log2(newAreaData.mmTime2)) + 32;
      }
      for (let i = earliest; i < MM_TIME_SLICES.length; ++i) {
        if (i < 32) {
          newAreaData.mmTime = (newAreaData.mmTime | (1 << i)) >>> 0;
        } else {
          newAreaData.mmTime2 = (newAreaData.mmTime2 | (1 << (i - 32))) >>> 0;
        }
      }
    }

    if (previousAreaData && compareAreaData(previousAreaData, newAreaData)) {
      return;
    }
    this.state.ws[world].areas[age].set(area, newAreaData);
    const a = this.world.areas[area];
    let locs = Object.keys(a.locations).filter(x => !ws.locations.has(x));
    if (this.opts.restrictedLocations && !this.opts.includeForbiddenReachable) {
      locs = locs.filter(x => this.opts.restrictedLocations!.has(x));
    }
    if (this.opts.forbiddenLocations && !this.opts.includeForbiddenReachable) {
      locs = locs.filter(x => !this.opts.forbiddenLocations!.has(x));
    }
    locs.forEach(x => this.queueLocation(world, x, area));
    Object.keys(a.events).filter(x => !ws.events.has(x)).forEach(x => this.queueEvent(world, x, area));
    const exits = Object.keys(a.exits);
    exits.forEach(x => this.queueExit(world, age, x, area));
    Object.keys(a.gossip).forEach(x => this.queueGossip(world, x, area));
  }

  private evalExpr(world: number, expr: Expr, age: Age, area: string) {
    const ws = this.state.ws[world];
    const areaData = ws.areas[age].get(area)!;
    const result = expr({ areaData, items: ws.items, renewables: ws.renewables, licenses: ws.licenses, age, events: ws.events, ignoreItems: this.opts.ignoreItems || false });
    if (result.result) {
      if (!result.restrictions || isDefaultRestrictions(result.restrictions)) {
        delete result.dependencies;
      }
    }
    return result;
  }

  private dependenciesLookup(set: PathfinderDependencySet, dependency: string, areaFrom: string) {
    let data1 = set.get(dependency);
    if (!data1) {
      data1 = new Map();
      set.set(dependency, data1);
    }

    let data2 = data1.get(areaFrom);
    if (!data2) {
      data2 = emptyDepList();
      data1.set(areaFrom, data2);
    }

    return data2;
  }

  private addExitsDependencies(set: PathfinderDependencySet, age: Age, exit: string, areaFrom: string, dependents: Set<string>) {
    for (const dep of dependents) {
      const data = this.dependenciesLookup(set, dep, areaFrom);
      data.exits[age].add(exit);
    }
  }

  private addEventsDependencies(set: PathfinderDependencySet, event: string, areaFrom: string, dependents: Set<string>) {
    for (const dep of dependents) {
      const data = this.dependenciesLookup(set, dep, areaFrom);
      data.events.add(event);
    }
  }

  private addLocationDependencies(set: PathfinderDependencySet, location: string, areaFrom: string, dependents: Set<string>) {
    for (const dep of dependents) {
      const data = this.dependenciesLookup(set, dep, areaFrom);
      data.locations.add(location);
    }
  }

  private addGossipDependencies(set: PathfinderDependencySet, gossip: string, areaFrom: string, dependents: Set<string>) {
    for (const dep of dependents) {
      const data = this.dependenciesLookup(set, dep, areaFrom);
      data.gossips.add(gossip);
    }
  }

  private requeueItem(world: number, item: string) {
    const ws = this.state.ws[world];
    const deps = ws.dependencies.items.get(item);
    if (deps) {
      ws.dependencies.items.delete(item);
      for (const [area, d] of deps) {
        d.exits.child.forEach(x => this.queueExit(world, 'child', x, area));
        d.exits.adult.forEach(x => this.queueExit(world, 'adult', x, area));
        d.events.forEach(x => this.queueEvent(world, x, area));
        d.locations.forEach(x => this.queueLocation(world, x, area));
        d.gossips.forEach(x => this.queueGossip(world, x, area));
      }
    }
  }

  private addLocationDelayed(world: number, loc: string) {
    const globalLoc = makeLocation(loc, world);
    const ws = this.state.ws[world];
    ws.locations.add(loc);
    this.state.locations.add(globalLoc);
    this.state.newLocations.add(globalLoc);
  }

  private addLocation(world: number, loc: string) {
    const ws = this.state.ws[world];
    const globalLoc = makeLocation(loc, world);
    ws.locations.add(loc);
    this.state.locations.add(globalLoc);
    const globalItem = this.opts.items?.[globalLoc];
    if (globalItem) {
      const itemD = itemData(globalItem);
      const otherWs = this.state.ws[itemD.player as number];
      ws.uncollectedLocations.delete(loc);
      addRawItem(otherWs.items, itemD.id);
      if (isLocationRenewable(this.world, globalLoc))
        addRawItem(otherWs.renewables, itemD.id);
      if (isLocationLicenseGranting(this.world, globalLoc))
        addRawItem(otherWs.licenses, itemD.id);
      this.requeueItem(itemD.player as number, itemD.id);
    } else {
      ws.uncollectedLocations.add(loc);
    }
  }

  private evalExits(world: number, age: Age) {
    /* Extract the queue */
    const ws = this.state.ws[world];
    const queue = ws.queue.exits[age];
    ws.queue.exits[age] = new Map();

    /* Evaluate all the exits */
    for (const [exit, areas] of queue) {
      for (const area of areas) {
        const a = this.world.areas[area];
        const expr = a.exits[exit];
        const exprResult = this.evalExpr(world, expr, age, area);

        /* Track dependencies */
        if (exprResult.dependencies) {
          const d = exprResult.dependencies;
          if (d.items) this.addExitsDependencies(ws.dependencies.items, age, exit, area, d.items);
          if (d.events) this.addExitsDependencies(ws.dependencies.events, age, exit, area, d.events);
        }

        if (exprResult.result) {
          const areaData = cloneAreaData(ws.areas[age].get(area)!);
          const r = exprResult.restrictions;
          if (r) {
            if (r.oot.day) areaData.oot.day = false;
            if (r.oot.night) areaData.oot.night = false;
            if (r.mmTime) {
              areaData.mmTime = (areaData.mmTime & ~(r.mmTime)) >>> 0;
            }
            if (r.mmTime2) {
              areaData.mmTime2 = (areaData.mmTime2 & ~(r.mmTime2)) >>> 0;
            }
          }
          this.exploreArea(world, age, exit, areaData, area);
        }
      }
    }
  }

  private evalEvents(world: number) {
    /* Extract the queue */
    const ws = this.state.ws[world];
    const queue = ws.queue.events;
    ws.queue.events = new Map();

    /* Evaluate all the events */
    for (const [event, areas] of queue) {
      for (const area of areas) {
        if (ws.events.has(event)) {
          continue;
        }

        /* Evaluate the event */
        const expr = this.world.areas[area].events[event];
        if (!expr) {
          throw new Error(`Event ${event} not found in area ${area}`);
        }
        const results: ExprResult[] = [];
        if (ws.areas.child.has(area)) {
          results.push(this.evalExpr(world, expr, 'child', area));
        }
        if (ws.areas.adult.has(area)) {
          results.push(this.evalExpr(world, expr, 'adult', area));
        }

        /* If any of the results are true, add the event to the state and queue up everything */
        /* Otherwise, track dependencies */
        if (results.some(x => x.result)) {
          ws.events.add(event);
          const deps = ws.dependencies.events.get(event);
          if (deps) {
            ws.dependencies.events.delete(event);
            for (const [area, d] of deps) {
              d.exits.child.forEach(x => this.queueExit(world, 'child', x, area));
              d.exits.adult.forEach(x => this.queueExit(world, 'adult', x, area));
              d.events.forEach(x => this.queueEvent(world, x, area));
              d.locations.forEach(x => this.queueLocation(world, x, area));
              d.gossips.forEach(x => this.queueGossip(world, x, area));
            }
          }
        } else {
          /* Track dependencies */
          const d = exprDependencies(results);
          if (d.items) this.addEventsDependencies(ws.dependencies.items, event, area, d.items);
          if (d.events) this.addEventsDependencies(ws.dependencies.events, event, area, d.events);
        }
      }
    }
  }

  private evalLocations(world: number) {
    /* Extract the queue */
    const ws = this.state.ws[world];
    const queue = ws.queue.locations;
    ws.queue.locations = new Map();

    /* Evaluate all the locations */
    for (const [location, areas] of queue) {
      let isAllowed = true;
      if (this.opts.includeForbiddenReachable) {
        if (this.opts.restrictedLocations && !this.opts.restrictedLocations.has(location)) {
          isAllowed = false;
        } else if (this.opts.forbiddenLocations && this.opts.forbiddenLocations.has(location)) {
          isAllowed = false;
        }
      }

      for (const area of areas) {
        if (ws.locations.has(location)) {
          continue;
        }

        /* Evaluate the location */
        const expr = this.world.areas[area].locations[location];
        const results: ExprResult[] = [];
        if (ws.areas.child.has(area)) {
          results.push(this.evalExpr(world, expr, 'child', area));
        }
        if (ws.areas.adult.has(area)) {
          results.push(this.evalExpr(world, expr, 'adult', area));
        }

        /* If any of the results are true, add the location to the state and queue up everything */
        /* Otherwise, track dependencies */
        if (results.some(x => x.result)) {
          if (isAllowed) {
            this.addLocationDelayed(world, location);
          } else {
            ws.forbiddenReachableLocations.add(location);
          }
        } else {
          /* Track dependencies */
          const d = exprDependencies(results);
          if (d.items) this.addLocationDependencies(ws.dependencies.items, location, area, d.items);
          if (d.events) this.addLocationDependencies(ws.dependencies.events, location, area, d.events);
        }
      }
    }
  }

  private evalGossips(world: number) {
    /* Extract the queue */
    const ws = this.state.ws[world];
    const queue = ws.queue.gossips;
    ws.queue.gossips = new Map();

    /* Evaluate all the gossips */
    for (const [gossip, areas] of queue) {
      for (const area of areas) {
        if (ws.gossip.has(gossip)) {
          continue;
        }

        /* Evaluate the location */
        const expr = this.world.areas[area].gossip[gossip];
        const results: ExprResult[] = [];
        if (ws.areas.child.has(area)) {
          results.push(this.evalExpr(world, expr, 'child', area));
        }
        if (ws.areas.adult.has(area)) {
          results.push(this.evalExpr(world, expr, 'adult', area));
        }

        /* If any of the results are true, add the location to the state and queue up everything */
        /* Otherwise, track dependencies */
        if (results.some(x => x.result)) {
          ws.gossip.add(gossip);
        } else {
          /* Track dependencies */
          const d = exprDependencies(results);
          if (d.items) this.addGossipDependencies(ws.dependencies.items, gossip, area, d.items);
          if (d.events) this.addGossipDependencies(ws.dependencies.events, gossip, area, d.events);
        }
      }
    }
  }

  private pathfindStep() {
    /* Clear new locations */
    this.state.newLocations = new Set();

    for (let world = 0; world < this.settings.players; ++world) {
      for (;;) {
        /* Expand as much as possible */
        const ws = this.state.ws[world];

        this.evalExits(world, 'child');
        this.evalExits(world, 'adult');
        this.evalEvents(world);

        const { queue } = ws;
        if (!queue.events.size && !queue.exits.child.size && !queue.exits.adult.size) {
          break;
        }
      }

      /* Get locations */
      this.evalLocations(world);
    }

    /* Add delayed locations */
    for (const globalLoc of this.state.newLocations) {
      const locD = locationData(globalLoc);
      this.addLocation(locD.world as number, locD.id);
    }

    /* Return true if there is more to do */
    for (let world = 0; world < this.settings.players; ++world) {
      const ws = this.state.ws[world];
      const { queue } = ws;
      if (queue.events.size || queue.exits.child.size || queue.exits.adult.size || queue.locations.size)
        return true;
    }

    return false;
  }

  private isGoalReached() {
    const { settings } = this;

    for (let world = 0; world < settings.players; ++world) {
      const ws = this.state.ws[world];
      const ganon = ws.events.has('OOT_GANON');
      const majora = ws.events.has('MM_MAJORA');
      let worldGoal = false;

      switch (settings.goal) {
      case 'any': worldGoal = ganon || majora; break;
      case 'ganon': worldGoal = ganon; break;
      case 'majora': worldGoal = majora; break;
      case 'both': worldGoal = ganon && majora; break;
      case 'triforce': worldGoal = ws.items['SHARED_TRIFORCE'] >= settings.triforceGoal; break;
      }

      if (!worldGoal) {
        return false;
      }
    }

    return true;
  }

  private pathfind() {
    /* Handle initial state */
    if (!this.state.started) {
      this.state.started = true;
      const initAreaData = defaultAreaData();
      initAreaData.mmTime = 1;

      for (let world = 0; world < this.settings.players; ++world) {
        this.exploreArea(world, 'child', 'OOT SPAWN', initAreaData, 'OOT SPAWN');
        this.exploreArea(world, 'adult', 'OOT SPAWN', initAreaData, 'OOT SPAWN');
      }
    }

    /* Requeue assumed items */
    if (this.opts.assumedItems) {
      for (const item of Object.keys(this.opts.assumedItems) as Item[]) {
        const itemD = itemData(item);
        this.requeueItem(itemD.player as number, itemD.id);
      }
    }

    /* Handle no logic */
    if (this.settings.logic === 'none') {
      this.state.goal = true;
      this.state.locations = new Set(makePlayerLocations(this.settings, Object.keys(this.world.checks)));
      //this.state.gossip = new Set(Object.values(this.world.areas).map(x => Object.keys(x.gossip || {})).flat());
      return;
    }

    for (let world = 0; world < this.settings.players; ++world) {
      const ws = this.state.ws[world];

      /* Collect previous locations */
      for (const loc of ws.uncollectedLocations) {
        this.addLocation(world, loc);
      }

      /* Collect previously forbidden locations */
      for (const loc of ws.forbiddenReachableLocations) {
        let isAllowed = true;
        if (this.opts.restrictedLocations && !this.opts.restrictedLocations.has(loc)) {
          isAllowed = false;
        } else if (this.opts.forbiddenLocations && this.opts.forbiddenLocations.has(loc)) {
          isAllowed = false;
        }
        if (isAllowed) {
          this.addLocation(world, loc);
          ws.forbiddenReachableLocations.delete(loc);
        }
      }
    }

    /* Pathfind */
    for (;;) {
      const changed = this.pathfindStep();
      if (this.isGoalReached()) {
        this.state.goal = true;
        if (this.opts.stopAtGoal) {
          break;
        }
      }
      if (!changed || !this.opts.recursive) {
        break;
      }
    }

    /* Check for gossips */
    for (let world = 0; world < this.settings.players; ++world) {
      this.evalGossips(world);
    }
  }
}
