import { create } from 'zustand';

export interface PlanetInfo {
  id: string;
  name: string;
  gravity: number;
  type: 'earth' | 'moon' | 'mercury' | 'venus' | 'mars' | 'jupiter' | 'saturn' | 'uranus' | 'neptune' | 'titan' | 'exoplanet';
  color?: string; // For exoplanets
  distance?: number;
  mass?: number;
  radius?: number;
  discoveryMethod?: string;
  discoveryYear?: number;
  temperature?: number;
}

export let PLANETS: PlanetInfo[] = [
  { id: 'earth', name: 'Terra', gravity: 9.8, type: 'earth', color: '#0284c7' },
  { id: 'moon', name: 'Lua', gravity: 1.62, type: 'moon', color: '#94a3b8' },
  { id: 'mercury', name: 'Mercúrio', gravity: 3.70, type: 'mercury', color: '#78716c' },
  { id: 'venus', name: 'Vénus', gravity: 8.87, type: 'venus', color: '#f59e0b' },
  { id: 'mars', name: 'Marte', gravity: 3.72, type: 'mars', color: '#c2410c' },
  { id: 'jupiter', name: 'Júpiter', gravity: 24.79, type: 'jupiter', color: '#d97706' },
  { id: 'saturn', name: 'Saturno', gravity: 10.44, type: 'saturn', color: '#eab308' },
  { id: 'uranus', name: 'Úrano', gravity: 8.69, type: 'uranus', color: '#38bdf8' },
  { id: 'neptune', name: 'Neptuno', gravity: 11.15, type: 'neptune', color: '#2563eb' },
  { id: 'titan', name: 'Titã', gravity: 1.35, type: 'titan', color: '#fbbf24' }
];

interface GameState {
  scene: 'surface' | 'space';
  isLaunching: boolean;
  setLaunching: (val: boolean) => void;
  resources: {
    iron: number;
    titanium: number;
    plasma: number;
  };
  cameraMode: 'first' | 'third';
  planetIndex: number;
  gravity: number;
  health: number;
  maxHealth: number;
  oxygen: number;
  dehydrationSeconds: number;
  deathCount: number;
  lastRespawnAt: number | null;
  respawnTargetPosition: [number, number, number];
  isOxygenChamberOpen: boolean;
  toggleOxygenChamber: () => void;
  isDying: boolean;
  dyingReason: 'oxygen_chamber' | 'hazard' | null;
  startDying: (reason: 'oxygen_chamber' | 'hazard') => void;
  completeDeathRespawn: () => void;
  activeHazard: { type: 'radiation' | 'toxic'; name: string; distance: number } | null;
  setActiveHazard: (hazard: { type: 'radiation' | 'toxic'; name: string; distance: number } | null) => void;
  applyHazardDrain: (healthDelta: number, oxygenDelta: number) => void;
  applyToxicHit: (healthLoss: number, oxygenLoss: number) => void;
  tickLifeSupport: (dt: number) => void;
  respawnInHangar: () => void;
  applyLifeSupportBoost: (healthDelta: number, oxygenDelta: number, raiseMaxHealthTo?: number) => void;
  bases: { id: string; x: number; z: number }[];
  setScene: (scene: 'surface' | 'space') => void;
  setPlanet: (index: number) => void;
  addResource: (type: 'iron' | 'titanium' | 'plasma', amount: number) => void;
  setCameraMode: (mode: 'first' | 'third') => void;
  toggleCameraMode: () => void;
  changePlanet: () => void;
  buildBase: (x: number, z: number) => void;
  craftItem: (item: string) => void;
  loadExoplanets: () => Promise<void>;
  joystick: { x: number; y: number };
  setJoystick: (pos: { x: number; y: number }) => void;
  mobileJump: boolean;
  setMobileJump: (val: boolean) => void;
  mobileSprint: boolean;
  setMobileSprint: (val: boolean) => void;
  characterGender: 'male' | 'female';
  setCharacterGender: (gender: 'male' | 'female') => void;
  visorMode: 'transparent' | 'gold';
  setVisorMode: (mode: 'transparent' | 'gold') => void;
  suitStyle: 'white' | 'orange' | 'carbon';
  setSuitStyle: (style: 'white' | 'orange' | 'carbon') => void;
  isHabitatDoorOpen: boolean;
  setHabitatDoorOpen: (open: boolean) => void;
  toggleHabitatDoor: () => void;
  manualDoorOverride: boolean;
  setManualDoorOverride: (val: boolean) => void;
  isNearVAB: boolean;
  setIsNearVAB: (val: boolean) => void;
  isPlayerInWater: boolean;
  setIsPlayerInWater: (val: boolean) => void;
  assemblyProgress: number;
  setAssemblyProgress: (val: number) => void;
  targetFps: 20 | 30 | 40 | 60;
  setTargetFps: (fps: 20 | 30 | 40 | 60) => void;
  dbSyncStatus: string;
  setDbSyncStatus: (status: string) => void;
  playerPosition: [number, number, number];
  setPlayerPosition: (pos: [number, number, number]) => void;
  playerSpeed: number;
  setPlayerSpeed: (speed: number) => void;
  inventory: Record<string, number>;
  addInventoryItem: (itemId: string, amount?: number) => void;
  removeInventoryItem: (itemId: string, amount?: number) => boolean;
  collectedWorldNodeIds: string[];
  markNodeCollected: (nodeId: string) => void;
  recentCollectedItem: { id: string; name: string; amount: number; timestamp: number } | null;
  clearRecentCollectedItem: () => void;
  spaceFlightData: {
    speed: number;
    target: string;
    distKm: number;
    stagingProgress: number;
    solarHeatPct: number;
    isEvaporating: boolean;
  };
  setSpaceFlightData: (data: Partial<{
    speed: number;
    target: string;
    distKm: number;
    stagingProgress: number;
    solarHeatPct: number;
    isEvaporating: boolean;
  }>) => void;
  hasCompletedInitialStaging: boolean;
  setHasCompletedInitialStaging: (val: boolean) => void;
  rocketFuel: number;
  setRocketFuel: (val: number) => void;
  addRocketFuel: (delta: number) => void;
  launchFailureMsg: string | null;
  setLaunchFailureMsg: (msg: string | null) => void;
  lastRespawnReason: 'hazard' | 'rocket_crash' | 'oxygen_chamber' | null;
  triggerRocketCrashRespawn: () => void;
  launchTelemetry: {
    countdown: number | null;
    fuel: number;
    speed: number;
    altitude: number;
    weightTons: number;
    status: 'idle' | 'countdown' | 'liftoff' | 'flameout' | 'crashed';
  };
  setLaunchTelemetry: (data: Partial<{
    countdown: number | null;
    fuel: number;
    speed: number;
    altitude: number;
    weightTons: number;
    status: 'idle' | 'countdown' | 'liftoff' | 'flameout' | 'crashed';
  }>) => void;
  isWebGLActive: boolean;
  setIsWebGLActive: (active: boolean) => void;
  drivingCarId: string | null;
  setDrivingCarId: (id: string | null) => void;
  nearCarId: string | null;
  setNearCarId: (id: string | null) => void;
  carSpeedKmh: number;
  setCarSpeedKmh: (val: number) => void;
  isNearRocket: boolean;
  setIsNearRocket: (val: boolean) => void;
  isNearComputer: boolean;
  setIsNearComputer: (val: boolean) => void;
  nearComputerTitle: string | null;
  setNearComputerTitle: (title: string | null) => void;
  isComputerLibraryOpen: boolean;
  setComputerLibraryOpen: (open: boolean) => void;
  selectedBookId: string | null;
  setSelectedBookId: (id: string | null) => void;
  toggleDriveCar: () => void;
  carStates: Record<
    string,
    {
      id: string;
      type: 'sedan' | 'supercar' | 'convertible' | 'suv';
      name: string;
      x: number;
      y: number;
      z: number;
      rot: number;
      speed: number;
      steer: number;
      wheelSpin: number;
    }
  >;
}

export const INITIAL_CARS: Record<
  string,
  {
    id: string;
    type: 'sedan' | 'supercar' | 'convertible' | 'suv';
    name: string;
    x: number;
    y: number;
    z: number;
    rot: number;
    speed: number;
    steer: number;
    wheelSpin: number;
  }
> = {
  // Featured Front-Row Driveable Cars near Parking Lot Entrance & Lab Road
  'car-1': { id: 'car-1', type: 'sedan', name: 'Sedan Aerodinâmico Prateado', x: 222, y: 0.1, z: -117, rot: 0, speed: 0, steer: 0, wheelSpin: 0 },
  'car-2': { id: 'car-2', type: 'supercar', name: 'Supercarro Desportivo Azul', x: 232, y: 0.1, z: -117, rot: 0, speed: 0, steer: 0, wheelSpin: 0 },
  'car-3': { id: 'car-3', type: 'convertible', name: 'Roadster Conversível Amarelo', x: 242, y: 0.1, z: -117, rot: 0, speed: 0, steer: 0, wheelSpin: 0 },
  'car-4': { id: 'car-4', type: 'suv', name: 'SUV Crossover Cinzento', x: 252, y: 0.1, z: -117, rot: 0, speed: 0, steer: 0, wheelSpin: 0 },
  // Additional Driveable Cars in North & South Parking Rows + Lab Front Plaza
  'car-5': { id: 'car-5', type: 'supercar', name: 'Supercarro Desportivo Azul II', x: 262, y: 0.1, z: -117, rot: 0, speed: 0, steer: 0, wheelSpin: 0 },
  'car-6': { id: 'car-6', type: 'sedan', name: 'Sedan Aerodinâmico Prateado II', x: 272, y: 0.1, z: -117, rot: 0, speed: 0, steer: 0, wheelSpin: 0 },
  'car-7': { id: 'car-7', type: 'convertible', name: 'Roadster Conversível Amarelo II', x: 282, y: 0.1, z: -117, rot: 0, speed: 0, steer: 0, wheelSpin: 0 },
  'car-8': { id: 'car-8', type: 'suv', name: 'SUV Crossover Cinzento II', x: 292, y: 0.1, z: -117, rot: 0, speed: 0, steer: 0, wheelSpin: 0 },
  // South Row (Facing North, Z = -153)
  'car-9': { id: 'car-9', type: 'suv', name: 'SUV Crossover Cinzento III', x: 222, y: 0.1, z: -153, rot: Math.PI, speed: 0, steer: 0, wheelSpin: 0 },
  'car-10': { id: 'car-10', type: 'convertible', name: 'Roadster Conversível Amarelo III', x: 232, y: 0.1, z: -153, rot: Math.PI, speed: 0, steer: 0, wheelSpin: 0 },
  'car-11': { id: 'car-11', type: 'supercar', name: 'Supercarro Desportivo Azul III', x: 242, y: 0.1, z: -153, rot: Math.PI, speed: 0, steer: 0, wheelSpin: 0 },
  'car-12': { id: 'car-12', type: 'sedan', name: 'Sedan Aerodinâmico Prateado III', x: 252, y: 0.1, z: -153, rot: Math.PI, speed: 0, steer: 0, wheelSpin: 0 },
  'car-13': { id: 'car-13', type: 'suv', name: 'SUV Crossover Cinzento IV', x: 262, y: 0.1, z: -153, rot: Math.PI, speed: 0, steer: 0, wheelSpin: 0 },
  'car-14': { id: 'car-14', type: 'supercar', name: 'Supercarro Desportivo Azul IV', x: 272, y: 0.1, z: -153, rot: Math.PI, speed: 0, steer: 0, wheelSpin: 0 },
  // Courtesy VIP Vehicles parked right beside the Laboratory West Main Entrance & North Boulevard
  'car-15': { id: 'car-15', type: 'supercar', name: 'Supercarro Azul (Porta Oeste Lab)', x: 193.5, y: 0.1, z: -69.5, rot: 0, speed: 0, steer: 0, wheelSpin: 0 },
  'car-16': { id: 'car-16', type: 'convertible', name: 'Conversível Amarelo (Laboratório)', x: 246, y: 0.1, z: -54.5, rot: -Math.PI / 2, speed: 0, steer: 0, wheelSpin: 0 },
};

export const useGameStore = create<GameState>((set, get) => ({
  isWebGLActive: true,
  setIsWebGLActive: (active) => set({ isWebGLActive: active }),
  drivingCarId: null,
  setDrivingCarId: (id) => set({ drivingCarId: id, carSpeedKmh: 0 }),
  nearCarId: null,
  setNearCarId: (id) => set((state) => (state.nearCarId === id ? state : { nearCarId: id })),
  carSpeedKmh: 0,
  setCarSpeedKmh: (val) => set((state) => (state.carSpeedKmh === val ? state : { carSpeedKmh: val })),
  isNearRocket: false,
  setIsNearRocket: (val) => set((state) => (state.isNearRocket === val ? state : { isNearRocket: val })),
  isNearComputer: false,
  setIsNearComputer: (val) => set((state) => (state.isNearComputer === val ? state : { isNearComputer: val })),
  nearComputerTitle: null,
  setNearComputerTitle: (title) => set((state) => (state.nearComputerTitle === title ? state : { nearComputerTitle: title })),
  isComputerLibraryOpen: false,
  setComputerLibraryOpen: (open) => set({ isComputerLibraryOpen: open }),
  selectedBookId: null,
  setSelectedBookId: (id) => set({ selectedBookId: id }),
  toggleDriveCar: () =>
    set((state) => {
      if (state.drivingCarId) {
        return { drivingCarId: null, carSpeedKmh: 0 };
      }
      if (state.nearCarId) {
        return { drivingCarId: state.nearCarId, carSpeedKmh: 0 };
      }
      return state;
    }),
  carStates: INITIAL_CARS,
  hasCompletedInitialStaging: false,
  setHasCompletedInitialStaging: (val) => set({ hasCompletedInitialStaging: val }),
  rocketFuel: 0,
  setRocketFuel: (val) => set((state) => {
    const clamped = Math.max(0, Math.min(100, Math.round(val * 10) / 10));
    const weightTons = Math.round(420 + clamped * 25.5);
    return {
      rocketFuel: clamped,
      launchTelemetry: state.launchTelemetry.status === 'idle'
        ? { ...state.launchTelemetry, fuel: Math.round(clamped), weightTons }
        : state.launchTelemetry,
    };
  }),
  addRocketFuel: (delta) => set((state) => {
    const clamped = Math.max(0, Math.min(100, Math.round((state.rocketFuel + delta) * 10) / 10));
    const weightTons = Math.round(420 + clamped * 25.5);
    return {
      rocketFuel: clamped,
      launchTelemetry: state.launchTelemetry.status === 'idle'
        ? { ...state.launchTelemetry, fuel: Math.round(clamped), weightTons }
        : state.launchTelemetry,
    };
  }),
  launchFailureMsg: null,
  setLaunchFailureMsg: (msg) => set({ launchFailureMsg: msg }),
  lastRespawnReason: null,
  respawnTargetPosition: [255, 1.2, 5],
  isOxygenChamberOpen: true,
  isDying: false,
  dyingReason: null,
  toggleOxygenChamber: () => set((state) => {
    if (state.isDying) return state;
    return { isOxygenChamberOpen: !state.isOxygenChamberOpen };
  }),
  startDying: (reason) => set((state) => {
    if (state.isDying) return state;
    return {
      isDying: true,
      dyingReason: reason,
      drivingCarId: null,
      carSpeedKmh: 0,
      isLaunching: false,
    };
  }),
  completeDeathRespawn: () => set((state) => {
    const isOffEarth = state.planetIndex !== 0;
    const targetPos: [number, number, number] = isOffEarth
      ? [state.playerPosition[0], Math.max(1.2, state.playerPosition[1]), state.playerPosition[2]]
      : [255, 1.2, 5];

    return {
      isDying: false,
      dyingReason: null,
      isLaunching: false,
      rocketFuel: 0,
      drivingCarId: null,
      carSpeedKmh: 0,
      activeHazard: null,
      isPlayerInWater: false,
      maxHealth: 100,
      health: 100,
      oxygen: 100,
      dehydrationSeconds: 0,
      isOxygenChamberOpen: true,
      deathCount: state.deathCount + 1,
      lastRespawnAt: Date.now(),
      lastRespawnReason: state.dyingReason || 'hazard',
      respawnTargetPosition: targetPos,
      playerPosition: targetPos,
      launchTelemetry: {
        countdown: null,
        fuel: 0,
        speed: 0,
        altitude: 0,
        weightTons: 420,
        status: 'idle',
      },
    };
  }),
  triggerRocketCrashRespawn: () => set((state) => ({
    isDying: false,
    dyingReason: null,
    isLaunching: false,
    rocketFuel: 0,
    drivingCarId: null,
    carSpeedKmh: 0,
    activeHazard: null,
    isPlayerInWater: false,
    maxHealth: 100,
    health: 100,
    oxygen: 100,
    dehydrationSeconds: 0,
    isOxygenChamberOpen: true,
    deathCount: state.deathCount + 1,
    lastRespawnAt: Date.now(),
    lastRespawnReason: 'rocket_crash',
    launchFailureMsg: 'O foguete caiu no mar por falta de combustível! O astronauta morreu e reiniciou no Hangar.',
    respawnTargetPosition: [255, 1.2, 5],
    playerPosition: [255, 1.2, 5],
    launchTelemetry: {
      countdown: null,
      fuel: 0,
      speed: 0,
      altitude: 0,
      weightTons: 420,
      status: 'idle',
    },
  })),
  launchTelemetry: {
    countdown: null,
    fuel: 0,
    speed: 0,
    altitude: 0,
    weightTons: 420,
    status: 'idle',
  },
  setLaunchTelemetry: (data) => set((state) => ({
    launchTelemetry: { ...state.launchTelemetry, ...data },
  })),
  spaceFlightData: {
    speed: 0,
    target: 'Lua',
    distKm: 384,
    stagingProgress: 0,
    solarHeatPct: 0,
    isEvaporating: false,
  },
  setSpaceFlightData: (data) => set((state) => ({
    spaceFlightData: { ...state.spaceFlightData, ...data },
  })),
  targetFps: 60,
  setTargetFps: (fps) => set({ targetFps: fps }),
  dbSyncStatus: 'IndexedDB Ativo',
  setDbSyncStatus: (status) => set({ dbSyncStatus: status }),
  characterGender: 'male',
  setCharacterGender: (gender) => set({ characterGender: gender }),
  visorMode: 'transparent',
  setVisorMode: (mode) => set({ visorMode: mode }),
  suitStyle: 'white',
  setSuitStyle: (style) => set({ suitStyle: style }),
  isHabitatDoorOpen: false,
  manualDoorOverride: false,
  setManualDoorOverride: (val) => set({ manualDoorOverride: val }),
  setHabitatDoorOpen: (open) => set({ isHabitatDoorOpen: open }),
  toggleHabitatDoor: () => set((state) => ({ 
    isHabitatDoorOpen: !state.isHabitatDoorOpen,
    manualDoorOverride: true 
  })),
  isNearVAB: false,
  setIsNearVAB: (val) => set((state) => (state.isNearVAB === val ? state : { isNearVAB: val })),
  isPlayerInWater: false,
  setIsPlayerInWater: (val) => set((state) => (state.isPlayerInWater === val ? state : { isPlayerInWater: val })),
  assemblyProgress: 0,
  setAssemblyProgress: (val) => set({ assemblyProgress: val }),
  playerPosition: [0, 4, 10],
  setPlayerPosition: (pos) => set({ playerPosition: pos }),
  playerSpeed: 0,
  setPlayerSpeed: (speed) => set({ playerSpeed: speed }),
  setLaunching: (val) => set({ isLaunching: val }),
  scene: 'surface',
  isLaunching: false,
  joystick: { x: 0, y: 0 },
  setJoystick: (pos) => set({ joystick: pos }),
  mobileJump: false,
  setMobileJump: (val) => set({ mobileJump: val }),
  mobileSprint: false,
  setMobileSprint: (val) => set({ mobileSprint: val }),
  resources: {
    iron: 0,
    titanium: 0,
    plasma: 0,
  },
  inventory: {
    quartz: 2,
    iron_ore: 1,
    pure_water: 3,
    silicon: 0,
    lithium: 0,
    oxygen_canister: 1,
    hydrogen_fuel: 0,
    titanium_alloy: 0,
    ggpen_composite: 0,
    plasma_core: 0,
    meteorite_shard: 0,
    suit_nanopolymer: 0,
    uranium_ore: 0,
    toxic_sulfur: 0,
  },
  collectedWorldNodeIds: [],
  markNodeCollected: (nodeId: string) => set((state) => ({
    collectedWorldNodeIds: state.collectedWorldNodeIds.includes(nodeId)
      ? state.collectedWorldNodeIds
      : [...state.collectedWorldNodeIds, nodeId],
  })),
  recentCollectedItem: null,
  clearRecentCollectedItem: () => set({ recentCollectedItem: null }),
  addInventoryItem: (itemId: string, amount = 1) => set((state) => {
    const current = state.inventory[itemId] || 0;
    const newCount = current + amount;
    
    // Also mirror to legacy resources if applicable for base building/crafting compatibility
    const updatedResources = { ...state.resources };
    if (itemId === 'iron_ore') updatedResources.iron += amount;
    if (itemId === 'titanium_alloy') updatedResources.titanium += amount;
    if (itemId === 'plasma_core') updatedResources.plasma += amount;

    return {
      inventory: { ...state.inventory, [itemId]: newCount },
      resources: updatedResources,
      recentCollectedItem: {
        id: itemId,
        name: itemId,
        amount,
        timestamp: Date.now(),
      },
    };
  }),
  removeInventoryItem: (itemId: string, amount = 1) => {
    const state = get();
    const current = state.inventory[itemId] || 0;
    if (current < amount) return false;
    set({
      inventory: { ...state.inventory, [itemId]: current - amount },
    });
    return true;
  },
  cameraMode: 'third',
  planetIndex: 0,
  gravity: 9.8,
  health: 100,
  maxHealth: 100,
  oxygen: 100,
  dehydrationSeconds: 0,
  deathCount: 0,
  lastRespawnAt: null,
  activeHazard: null,
  setActiveHazard: (hazard) => set({ activeHazard: hazard }),
  applyHazardDrain: (healthDelta, oxygenDelta) => set((state) => ({
    health: Math.max(0, state.health - Math.max(0, healthDelta)),
    oxygen: Math.max(0, state.oxygen - Math.max(0, oxygenDelta)),
  })),
  applyToxicHit: (healthLoss, oxygenLoss) => set((state) => ({
    health: Math.max(0, state.health - Math.max(0, healthLoss)),
    oxygen: Math.max(0, state.oxygen - Math.max(0, oxygenLoss)),
  })),
  tickLifeSupport: (dt) => set((state) => {
    if (state.scene !== 'surface' || state.isDying || state.health <= 0) return state;

    const currentPlanet = PLANETS[state.planetIndex];
    const isNearSunPlanet =
      currentPlanet && (currentPlanet.type === 'mercury' || currentPlanet.type === 'venus');
    const isChamberClosedOffEarth = state.planetIndex !== 0 && !state.isOxygenChamberOpen;

    // 1. Solar proximity drain (Mercury & Venus: -2% Water & O2 every 3 minutes)
    const solarOxygenDrain = isNearSunPlanet ? (2 / 180) * dt : 0;

    // 2. Closed Oxygen Chamber outside Earth: drains 10% every 3 seconds continuously until reopened or depleted
    const chamberOxygenDrain = isChamberClosedOffEarth ? (10 / 3) * dt : 0;
    const chamberHealthDrain = isChamberClosedOffEarth ? ((state.maxHealth * 0.10) / 3) * dt : 0;

    const nextOxygen = Math.max(0, state.oxygen - solarOxygenDrain - chamberOxygenDrain);
    let nextHealth = Math.max(0, state.health - chamberHealthDrain);
    let nextDehydration = state.dehydrationSeconds;

    if (nextOxygen <= 0) {
      nextDehydration = state.dehydrationSeconds + dt;
      // After 20 seconds at 0% Water/O2 without hydrating, begin draining suit protection (health)
      if (nextDehydration >= 20) {
        nextHealth = Math.max(0, nextHealth - dt * 5.0);
      }
    } else {
      nextDehydration = 0;
    }

    if (
      nextOxygen === state.oxygen &&
      nextDehydration === state.dehydrationSeconds &&
      nextHealth === state.health
    ) {
      return state;
    }

    return {
      oxygen: nextOxygen,
      dehydrationSeconds: nextDehydration,
      health: nextHealth,
    };
  }),
  respawnInHangar: () => set((state) => {
    const isOffEarth = state.planetIndex !== 0;
    const targetPos: [number, number, number] = isOffEarth
      ? [state.playerPosition[0], Math.max(1.2, state.playerPosition[1]), state.playerPosition[2]]
      : [255, 1.2, 5];

    return {
      isDying: false,
      dyingReason: null,
      isLaunching: false,
      rocketFuel: 0,
      drivingCarId: null,
      carSpeedKmh: 0,
      activeHazard: null,
      isPlayerInWater: false,
      maxHealth: 100,
      health: 100,
      oxygen: 100,
      dehydrationSeconds: 0,
      isOxygenChamberOpen: true,
      deathCount: state.deathCount + 1,
      lastRespawnAt: Date.now(),
      lastRespawnReason: 'hazard',
      respawnTargetPosition: targetPos,
      playerPosition: targetPos,
      launchTelemetry: {
        countdown: null,
        fuel: 0,
        speed: 0,
        altitude: 0,
        weightTons: 420,
        status: 'idle',
      },
    };
  }),
  applyLifeSupportBoost: (healthDelta, oxygenDelta, raiseMaxHealthTo) => set((state) => {
    const nextMax = raiseMaxHealthTo ? Math.max(state.maxHealth, raiseMaxHealthTo) : state.maxHealth;
    const nextOxygen = Math.min(100, Math.max(0, state.oxygen + oxygenDelta));
    return {
      maxHealth: nextMax,
      health: Math.min(nextMax, Math.max(0, state.health + healthDelta)),
      oxygen: nextOxygen,
      dehydrationSeconds: nextOxygen > 0 ? 0 : state.dehydrationSeconds,
    };
  }),
  bases: [],
  
  setScene: (scene) => set({ scene }),
  
  setPlanet: (index) => set({ 
    planetIndex: index, 
    gravity: PLANETS[index].gravity, 
    scene: 'surface',
    isDying: false,
    dyingReason: null,
    isLaunching: false,
    rocketFuel: 0,
    launchFailureMsg: null,
    drivingCarId: null,
    nearCarId: null,
    isNearRocket: false,
    activeHazard: null,
    dehydrationSeconds: 0,
    isOxygenChamberOpen: true,
    lastRespawnReason: null,
    playerPosition: index === 0 ? [255, 1.2, 5] : [0, 1.2, 9.5],
    respawnTargetPosition: index === 0 ? [255, 1.2, 5] : [0, 1.2, 9.5],
    bases: [],
    launchTelemetry: {
      countdown: null,
      fuel: 0,
      speed: 0,
      altitude: 0,
      weightTons: 420,
      status: 'idle',
    },
  }),

  addResource: (type, amount) => set((state) => ({
    resources: { ...state.resources, [type]: state.resources[type] + amount }
  })),

  setCameraMode: (mode) => set({ cameraMode: mode }),
  
  toggleCameraMode: () => set((state) => ({
    cameraMode: state.cameraMode === 'first' ? 'third' : 'first'
  })),

  changePlanet: () => set((state) => {
    // Enter space when launched from surface; if departing from any non-Earth planet, initial staging is already done
    const alreadyStaged = state.hasCompletedInitialStaging || state.planetIndex !== 0;
    return {
      scene: 'space',
      isDying: false,
      dyingReason: null,
      isLaunching: false,
      rocketFuel: 0,
      launchFailureMsg: null,
      drivingCarId: null,
      nearCarId: null,
      hasCompletedInitialStaging: alreadyStaged,
      launchTelemetry: {
        countdown: null,
        fuel: 0,
        speed: 0,
        altitude: 0,
        weightTons: 420,
        status: 'idle',
      },
      spaceFlightData: {
        ...state.spaceFlightData,
        stagingProgress: alreadyStaged ? 1.0 : 0.0,
        solarHeatPct: 0,
        isEvaporating: false,
      },
    };
  }),

  buildBase: (x, z) => set((state) => {
    if (state.resources.iron >= 10 && state.resources.titanium >= 5) {
      return {
        resources: {
          ...state.resources,
          iron: state.resources.iron - 10,
          titanium: state.resources.titanium - 5,
        },
        bases: [...state.bases, { id: Math.random().toString(), x, z }]
      };
    }
    return state;
  }),

  craftItem: (item) => set((state) => {
    if (item === 'advanced_suit' && state.resources.plasma >= 10) {
      return {
        resources: { ...state.resources, plasma: state.resources.plasma - 10 },
        maxHealth: 200,
        health: 200,
      };
    }
    return state;
  }),
  
  loadExoplanets: async () => {
try {
let data;
      try {
        const query = "select pl_name,pl_rade,pl_bmasse,sy_dist,st_teff,discoverymethod,disc_year,pl_eqt from ps where default_flag=1 and pl_name in ('TRAPPIST-1 d','TRAPPIST-1 e','TRAPPIST-1 f','Kepler-186 f','Proxima Cen b','K2-18 b','Kepler-452 b','Kepler-22 b','LHS 1140 b','WASP-12 b')&format=json";
        const url = "https://exoplanetarchive.ipac.caltech.edu/TAP/sync?query=" + encodeURIComponent(query).replace(/%20/g, '+');
        // Try with corsproxy to avoid CORS issues
        const response = await fetch("https://api.allorigins.win/raw?url=" + encodeURIComponent(url));
        if (!response.ok) throw new Error("Fetch failed");
        data = await response.json();
      } catch (err) {
        console.warn("Failed to fetch from NASA via proxy, using fallback static data.", err);
        // Fallback static dataset in case of CORS or network error
        data = [
          {"pl_name": "TRAPPIST-1 d","pl_rade": 0.788,"pl_bmasse": 0.388,"sy_dist": 12.1,"st_teff": 2566,"discoverymethod": "Transit","disc_year": 2016},
          {"pl_name": "TRAPPIST-1 e","pl_rade": 0.920,"pl_bmasse": 0.692,"sy_dist": 12.1,"st_teff": 2566,"discoverymethod": "Transit","disc_year": 2017},
          {"pl_name": "TRAPPIST-1 f","pl_rade": 1.045,"pl_bmasse": 1.039,"sy_dist": 12.1,"st_teff": 2566,"discoverymethod": "Transit","disc_year": 2017},
          {"pl_name": "K2-18 b","pl_rade": 2.370,"pl_bmasse": 8.920,"sy_dist": 38.0,"st_teff": 3457,"discoverymethod": "Transit","disc_year": 2015},
          {"pl_name": "LHS 1140 b","pl_rade": 1.730,"pl_bmasse": 5.600,"sy_dist": 14.9,"st_teff": 3096,"discoverymethod": "Transit","disc_year": 2017},
          {"pl_name": "WASP-12 b","pl_rade": 22.0,"pl_bmasse": 450,"sy_dist": 427.2,"st_teff": 6265,"discoverymethod": "Transit","disc_year": 2008},
          {"pl_name": "Kepler-186 f","pl_rade": 1.170,"pl_bmasse": null,"sy_dist": 177.5,"st_teff": 3755,"discoverymethod": "Transit","disc_year": 2014},
          {"pl_name": "Proxima Cen b","pl_rade": null,"pl_bmasse": 1.055,"sy_dist": 1.3,"st_teff": 2900,"discoverymethod": "Radial Velocity","disc_year": 2016},
          {"pl_name": "Kepler-452 b","pl_rade": 1.630,"pl_bmasse": null,"sy_dist": 551.7,"st_teff": 5757,"discoverymethod": "Transit","disc_year": 2015},
          {"pl_name": "Kepler-22 b","pl_rade": 2.100,"pl_bmasse": 9.100,"sy_dist": 194.6,"st_teff": 5596,"discoverymethod": "Transit","disc_year": 2011}
        ];
      }
      
      const newPlanets: PlanetInfo[] = [];
      const colors = ['#2b6cb0', '#805ad5', '#c53030', '#d69e2e', '#38a169', '#319795', '#d53f8c', '#e53e3e', '#718096', '#ecc94b'];
      
      for(let i = 0; i < data.length; i++) {
        const item = data[i];
        const radius = item.pl_rade || 1;
        const mass = item.pl_bmasse || (radius * radius * radius); // rough estimate if missing
        const gravity = Math.max(1, Math.min(25, 9.8 * (mass / (radius * radius))));
        
        newPlanets.push({
          id: `exo_${i}`,
          name: item.pl_name,
          gravity: parseFloat(gravity.toFixed(2)),
          type: 'exoplanet',
          color: colors[i % colors.length],
          distance: item.sy_dist,
          mass: item.pl_bmasse,
          radius: item.pl_rade,
          discoveryMethod: item.discoverymethod,
          discoveryYear: item.disc_year,
          temperature: item.pl_eqt || (item.st_teff ? item.st_teff * 0.1 : null) // rough estimate if pl_eqt missing
        });
      }
      
      const existingIds = new Set(PLANETS.map(p => p.name));
      const additions = newPlanets.filter(p => !existingIds.has(p.name));
      if (additions.length > 0) {
        PLANETS.push(...additions);
        // Force a state update to trigger re-renders by incrementing a generic counter or resetting a state variable
        set((state) => ({ planetIndex: state.planetIndex }));
      }
    } catch (e) {
      console.error("Failed to load NASA exoplanets", e);
    }
  }
}));
