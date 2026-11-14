import { create } from 'zustand';
import { Language, UI_TEXT } from './utils/i18n';
import { RESOURCE_DEFINITIONS } from './utils/nasaData';

export type GameMusicTrack = 'beethoven_op68' | 'epic' | 'orbital' | 'tactical' | 'none';

export const BASE_BACKPACK_WEIGHT_KG = 40;
export const BASE_BACKPACK_SLOTS = 20;
export const BACKPACK_EXPANSION_WEIGHT_KG = 20;
export const BACKPACK_EXPANSION_SLOTS = 6;
export const MAX_BACKPACK_EXPANSIONS = 3;

export function getResourceMaxStack(itemId: string): number {
  const def = RESOURCE_DEFINITIONS[itemId];
  if (!def) return 10;
  if (def.category === 'tech' || def.rarity === 'legendary') return 5;
  return 10;
}

export const INITIAL_INVENTORY: Record<string, number> = {
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
};

export const livePlayerMotion = {
  action: 'idle',
  isJumping: false,
  inWater: false,
  deepWater: false,
  yaw: 0,
  speed: 0,
  bodyYOffset: 0,
  bodyPitch: 0,
};

export interface PlanetInfo {
  id: string;
  name: string;
  gravity: number;
  type: 'earth' | 'moon' | 'mercury' | 'venus' | 'mars' | 'jupiter' | 'saturn' | 'uranus' | 'neptune' | 'titan' | 'exoplanet';
  color?: string; // For exoplanets
  distance?: number;
  mass?: number;
  radius?: number;
  density?: number;      // g/cm³ from Solar System / NASA Exoplanet API
  insolation?: number;   // Earth flux S⊕
  discoveryMethod?: string;
  discoveryYear?: number;
  temperature?: number;  // Kelvin
  apiSource?: string;
}

export let PLANETS: PlanetInfo[] = [
  { id: 'earth', name: 'Terra', gravity: 9.8, type: 'earth', color: '#0284c7', density: 5.51, temperature: 288, radius: 1.0, mass: 1.0, apiSource: 'NASA Fact Sheet' },
  { id: 'moon', name: 'Lua', gravity: 1.62, type: 'moon', color: '#94a3b8', density: 3.34, temperature: 220, radius: 0.273, mass: 0.0123, apiSource: 'NASA Fact Sheet' },
  { id: 'mercury', name: 'Mercúrio', gravity: 3.70, type: 'mercury', color: '#78716c', density: 5.43, temperature: 440, radius: 0.383, mass: 0.055, apiSource: 'NASA Fact Sheet' },
  { id: 'venus', name: 'Vénus', gravity: 8.87, type: 'venus', color: '#f59e0b', density: 5.24, temperature: 737, radius: 0.949, mass: 0.815, apiSource: 'NASA Fact Sheet' },
  { id: 'mars', name: 'Marte', gravity: 3.72, type: 'mars', color: '#c2410c', density: 3.93, temperature: 210, radius: 0.532, mass: 0.107, apiSource: 'NASA Fact Sheet' },
  { id: 'jupiter', name: 'Júpiter', gravity: 24.79, type: 'jupiter', color: '#d97706', density: 1.33, temperature: 165, radius: 11.21, mass: 317.8, apiSource: 'NASA Fact Sheet' },
  { id: 'saturn', name: 'Saturno', gravity: 10.44, type: 'saturn', color: '#eab308', density: 0.69, temperature: 134, radius: 9.45, mass: 95.16, apiSource: 'NASA Fact Sheet' },
  { id: 'uranus', name: 'Úrano', gravity: 8.69, type: 'uranus', color: '#38bdf8', density: 1.27, temperature: 76, radius: 4.01, mass: 14.54, apiSource: 'NASA Fact Sheet' },
  { id: 'neptune', name: 'Neptuno', gravity: 11.15, type: 'neptune', color: '#2563eb', density: 1.64, temperature: 72, radius: 3.88, mass: 17.15, apiSource: 'NASA Fact Sheet' },
  { id: 'titan', name: 'Titã', gravity: 1.35, type: 'titan', color: '#fbbf24', density: 1.88, temperature: 94, radius: 0.404, mass: 0.0225, apiSource: 'NASA Fact Sheet' }
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
  planetaryApiVersion: number;
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
  language: Language;
  setLanguage: (lang: Language) => void;
  menuMusicTrack: GameMusicTrack;
  setMenuMusicTrack: (track: GameMusicTrack) => void;
  gameMusicTrack: GameMusicTrack;
  setGameMusicTrack: (track: GameMusicTrack) => void;
  musicVolume: number;
  setMusicVolume: (vol: number) => void;
  sfxVolume: number;
  setSfxVolume: (vol: number) => void;
  appStage: 'mode_select' | 'story_video' | 'playing';
  gameMode: 'exploration' | 'story';
  lastSessionMode: 'exploration' | 'story' | null;
  explorationWithCompanion: boolean;
  setExplorationWithCompanion: (val: boolean) => void;
  storyStep: 'hangar_suit_up' | 'walk_to_rocket' | 'autopilot_to_moon' | 'moon_exit_flag' | 'mission_complete';
  hasSpacesuit: boolean;
  isNearSuitTable: boolean;
  setIsNearSuitTable: (val: boolean) => void;
  isNearFlagSpot: boolean;
  setIsNearFlagSpot: (val: boolean) => void;
  isFlagPlantedOnMoon: boolean;
  showMissionCompleteBanner: boolean;
  dismissMissionCompleteBanner: () => void;
  activeMissionTip: string | null;
  setActiveMissionTip: (tip: string | null) => void;
  startExplorationMode: () => void;
  startStoryVideo: (gender: 'male' | 'female') => void;
  finishStoryVideo: () => void;
  equipSpacesuitsAtTable: () => void;
  plantAngolaFlagOnMoon: () => void;
  returnToModeSelect: () => void;
  dbSyncStatus: string;
  setDbSyncStatus: (status: string) => void;
  playerPosition: [number, number, number];
  setPlayerPosition: (pos: [number, number, number]) => void;
  playerSpeed: number;
  setPlayerSpeed: (speed: number) => void;
  inventory: Record<string, number>;
  backpackExpansions: number;
  expandBackpack: () => boolean;
  backpackLimitAlert: { reason: 'weight' | 'slots' | 'stack' | 'expanded'; itemId: string; timestamp: number } | null;
  clearBackpackLimitAlert: () => void;
  addInventoryItem: (itemId: string, amount?: number) => boolean;
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
    shipPos: [number, number, number];
    shipYaw: number;
  };
  setSpaceFlightData: (data: Partial<{
    speed: number;
    target: string;
    distKm: number;
    stagingProgress: number;
    solarHeatPct: number;
    isEvaporating: boolean;
    shipPos: [number, number, number];
    shipYaw: number;
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
  planetaryApiVersion: 0,
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
      rocketFuel: state.gameMode === 'story' && !isOffEarth && state.storyStep === 'walk_to_rocket' ? 100 : 0,
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
        fuel: state.gameMode === 'story' && !isOffEarth && state.storyStep === 'walk_to_rocket' ? 100 : 0,
        speed: 0,
        altitude: 0,
        weightTons: state.gameMode === 'story' && !isOffEarth && state.storyStep === 'walk_to_rocket' ? 2970 : 420,
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
    launchFailureMsg: UI_TEXT[state.language].seaCrashRespawnMsg,
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
    shipPos: [13800, 0, 0],
    shipYaw: 0,
  },
  setSpaceFlightData: (data) => set((state) => ({
    spaceFlightData: { ...state.spaceFlightData, ...data },
  })),
  targetFps: 20,
  setTargetFps: (fps) => set({ targetFps: fps }),
  language: 'pt',
  setLanguage: (lang) => set({ language: lang }),
  menuMusicTrack: 'beethoven_op68',
  setMenuMusicTrack: (track) => set({ menuMusicTrack: track }),
  gameMusicTrack: 'epic',
  setGameMusicTrack: (track) => set({ gameMusicTrack: track }),
  musicVolume: 0.85,
  setMusicVolume: (vol) => set({ musicVolume: Math.max(0, Math.min(1, vol)) }),
  sfxVolume: 0.05,
  setSfxVolume: (vol) => set({ sfxVolume: Math.max(0, Math.min(1, vol)) }),
  appStage: 'mode_select',
  gameMode: 'exploration',
  lastSessionMode: null,
  explorationWithCompanion: true,
  setExplorationWithCompanion: (val) => set({ explorationWithCompanion: val }),
  storyStep: 'hangar_suit_up',
  hasSpacesuit: true,
  isNearSuitTable: false,
  setIsNearSuitTable: (val) => set((state) => (state.isNearSuitTable === val ? state : { isNearSuitTable: val })),
  isNearFlagSpot: false,
  setIsNearFlagSpot: (val) => set((state) => (state.isNearFlagSpot === val ? state : { isNearFlagSpot: val })),
  isFlagPlantedOnMoon: false,
  showMissionCompleteBanner: false,
  dismissMissionCompleteBanner: () => set({ showMissionCompleteBanner: false }),
  activeMissionTip: null,
  setActiveMissionTip: (tip) => set({ activeMissionTip: tip }),
  startExplorationMode: () => set((state) => {
    const switchedMode = state.lastSessionMode !== null && state.lastSessionMode !== 'exploration';
    return {
      appStage: 'playing',
      gameMode: 'exploration',
      lastSessionMode: 'exploration',
      storyStep: 'mission_complete',
      hasSpacesuit: true,
      isNearSuitTable: false,
      isNearFlagSpot: false,
      isFlagPlantedOnMoon: false,
      showMissionCompleteBanner: false,
      activeMissionTip: null,
      planetIndex: 0,
      gravity: PLANETS[0].gravity,
      scene: 'surface',
      isDying: false,
      dyingReason: null,
      isLaunching: false,
      rocketFuel: 0,
      launchFailureMsg: null,
      drivingCarId: null,
      nearCarId: null,
      isNearRocket: false,
      health: 100,
      maxHealth: 100,
      oxygen: 100,
      dehydrationSeconds: 0,
      isOxygenChamberOpen: true,
      hasCompletedInitialStaging: false,
      playerPosition: [255, 1.2, 5],
      respawnTargetPosition: [255, 1.2, 5],
      launchTelemetry: {
        countdown: null,
        fuel: 0,
        speed: 0,
        altitude: 0,
        weightTons: 420,
        status: 'idle',
      },
      ...(switchedMode
        ? {
            inventory: { ...INITIAL_INVENTORY },
            collectedWorldNodeIds: [],
            resources: { iron: 0, titanium: 0, plasma: 0 },
            backpackExpansions: 0,
            recentCollectedItem: null,
            backpackLimitAlert: null,
          }
        : {}),
    };
  }),
  startStoryVideo: (gender) => set((state) => {
    const switchedMode = state.lastSessionMode !== null && state.lastSessionMode !== 'story';
    return {
      characterGender: gender,
      gameMode: 'story',
      lastSessionMode: 'story',
      appStage: 'story_video',
      ...(switchedMode
        ? {
            inventory: { ...INITIAL_INVENTORY },
            collectedWorldNodeIds: [],
            resources: { iron: 0, titanium: 0, plasma: 0 },
            backpackExpansions: 0,
            recentCollectedItem: null,
            backpackLimitAlert: null,
          }
        : {}),
    };
  }),
  finishStoryVideo: () => set({
    appStage: 'playing',
    gameMode: 'story',
    storyStep: 'hangar_suit_up',
    hasSpacesuit: false,
    isNearSuitTable: false,
    isNearFlagSpot: false,
    isFlagPlantedOnMoon: false,
    showMissionCompleteBanner: false,
    activeMissionTip: null,
    planetIndex: 0,
    gravity: PLANETS[0].gravity,
    scene: 'surface',
    isDying: false,
    dyingReason: null,
    isLaunching: false,
    rocketFuel: 100,
    launchFailureMsg: null,
    drivingCarId: null,
    nearCarId: null,
    isNearRocket: false,
    health: 100,
    maxHealth: 100,
    oxygen: 100,
    dehydrationSeconds: 0,
    isOxygenChamberOpen: true,
    hasCompletedInitialStaging: false,
    playerPosition: [255, 1.2, 5],
    respawnTargetPosition: [255, 1.2, 5],
    launchTelemetry: {
      countdown: null,
      fuel: 100,
      speed: 0,
      altitude: 0,
      weightTons: 2970,
      status: 'idle',
    },
  }),
  equipSpacesuitsAtTable: () => set((state) => ({
    hasSpacesuit: true,
    isNearSuitTable: false,
    storyStep: state.gameMode === 'story' && state.storyStep === 'hangar_suit_up' ? 'walk_to_rocket' : state.storyStep,
  })),
  plantAngolaFlagOnMoon: () => set((state) => ({
    isFlagPlantedOnMoon: true,
    isNearFlagSpot: false,
    storyStep: state.gameMode === 'story' ? 'mission_complete' : state.storyStep,
    showMissionCompleteBanner: true,
  })),
  returnToModeSelect: () => set({
    appStage: 'mode_select',
    isLaunching: false,
    drivingCarId: null,
    nearCarId: null,
    isNearRocket: false,
    isNearSuitTable: false,
    isNearFlagSpot: false,
    activeMissionTip: null,
  }),
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
  inventory: { ...INITIAL_INVENTORY },
  backpackExpansions: 0,
  expandBackpack: () => {
    const state = get();
    if (state.backpackExpansions >= MAX_BACKPACK_EXPANSIONS) return false;
    const count = state.inventory.orbital_cargo_expander || 0;
    if (count < 1) return false;
    set({
      inventory: { ...state.inventory, orbital_cargo_expander: count - 1 },
      backpackExpansions: state.backpackExpansions + 1,
      backpackLimitAlert: {
        reason: 'expanded',
        itemId: 'orbital_cargo_expander',
        timestamp: Date.now(),
      },
    });
    return true;
  },
  backpackLimitAlert: null,
  clearBackpackLimitAlert: () => set({ backpackLimitAlert: null }),
  collectedWorldNodeIds: [],
  markNodeCollected: (nodeId: string) => set((state) => ({
    collectedWorldNodeIds: state.collectedWorldNodeIds.includes(nodeId)
      ? state.collectedWorldNodeIds
      : [...state.collectedWorldNodeIds, nodeId],
  })),
  recentCollectedItem: null,
  clearRecentCollectedItem: () => set({ recentCollectedItem: null }),
  addInventoryItem: (itemId: string, amount = 1) => {
    const state = get();
    const current = state.inventory[itemId] || 0;
    const maxStack = getResourceMaxStack(itemId);
    if (current >= maxStack) {
      set({ backpackLimitAlert: { reason: 'stack', itemId, timestamp: Date.now() } });
      return false;
    }

    let totalWeight = 0;
    let occupiedSlots = 0;
    Object.entries(state.inventory).forEach(([id, count]) => {
      if (count > 0) {
        const def = RESOURCE_DEFINITIONS[id];
        if (def) {
          totalWeight += def.weightPerUnit * count;
          occupiedSlots += 1;
        }
      }
    });

    const maxSlots = BASE_BACKPACK_SLOTS + state.backpackExpansions * BACKPACK_EXPANSION_SLOTS;
    if (current === 0 && occupiedSlots + 1 > maxSlots) {
      set({ backpackLimitAlert: { reason: 'slots', itemId, timestamp: Date.now() } });
      return false;
    }

    const maxWeight = BASE_BACKPACK_WEIGHT_KG + state.backpackExpansions * BACKPACK_EXPANSION_WEIGHT_KG;
    const unitWeight = RESOURCE_DEFINITIONS[itemId]?.weightPerUnit ?? 1.0;
    const remainingWeight = Math.max(0, maxWeight - totalWeight);
    const maxByWeight = unitWeight > 0 ? Math.floor((remainingWeight + 1e-6) / unitWeight) : amount;
    const accepted = Math.min(amount, maxStack - current, maxByWeight);

    if (accepted <= 0) {
      set({ backpackLimitAlert: { reason: 'weight', itemId, timestamp: Date.now() } });
      return false;
    }

    const newCount = current + accepted;
    const updatedResources = { ...state.resources };
    if (itemId === 'iron_ore') updatedResources.iron += accepted;
    if (itemId === 'titanium_alloy') updatedResources.titanium += accepted;
    if (itemId === 'plasma_core') updatedResources.plasma += accepted;

    set({
      inventory: { ...state.inventory, [itemId]: newCount },
      resources: updatedResources,
      backpackLimitAlert: null,
      recentCollectedItem: {
        id: itemId,
        name: itemId,
        amount: accepted,
        timestamp: Date.now(),
      },
    });
    return true;
  },
  removeInventoryItem: (itemId: string, amount = 1) => {
    const state = get();
    const current = state.inventory[itemId] || 0;
    if (current < amount) return false;
    const updatedResources = { ...state.resources };
    if (itemId === 'iron_ore') updatedResources.iron = Math.max(0, updatedResources.iron - amount);
    if (itemId === 'titanium_alloy') updatedResources.titanium = Math.max(0, updatedResources.titanium - amount);
    if (itemId === 'plasma_core') updatedResources.plasma = Math.max(0, updatedResources.plasma - amount);
    set({
      inventory: { ...state.inventory, [itemId]: current - amount },
      resources: updatedResources,
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
  
  setPlanet: (index) => set((state) => ({ 
    planetIndex: index, 
    gravity: PLANETS[index].gravity, 
    scene: 'surface',
    storyStep: state.gameMode === 'story' && index === 1 && state.storyStep === 'autopilot_to_moon'
      ? 'moon_exit_flag'
      : state.storyStep,
    isDying: false,
    dyingReason: null,
    isLaunching: false,
    rocketFuel: state.gameMode === 'story' && index === 0 && state.storyStep !== 'mission_complete' ? 100 : 0,
    launchFailureMsg: null,
    drivingCarId: null,
    nearCarId: null,
    isNearRocket: false,
    isNearSuitTable: false,
    isNearFlagSpot: false,
    activeHazard: null,
    dehydrationSeconds: 0,
    isOxygenChamberOpen: true,
    lastRespawnReason: null,
    playerPosition: index === 0 ? [255, 1.2, 5] : [0, 1.2, 9.5],
    respawnTargetPosition: index === 0 ? [255, 1.2, 5] : [0, 1.2, 9.5],
    bases: [],
    launchTelemetry: {
      countdown: null,
      fuel: state.gameMode === 'story' && index === 0 && state.storyStep !== 'mission_complete' ? 100 : 0,
      speed: 0,
      altitude: 0,
      weightTons: state.gameMode === 'story' && index === 0 && state.storyStep !== 'mission_complete' ? 2970 : 420,
      status: 'idle',
    },
  })),

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
    const nextStoryStep =
      state.gameMode === 'story' && state.planetIndex === 0 && state.storyStep === 'walk_to_rocket'
        ? 'autopilot_to_moon'
        : state.storyStep;
    return {
      scene: 'space',
      storyStep: nextStoryStep,
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
  
  loadExoplanets: (() => {
    let inflightOrDone: Promise<void> | null = null;
    return async () => {
      if (inflightOrDone) return inflightOrDone;
      inflightOrDone = (async () => {
        try {
      // 1. Live Solar System OpenData API enrichment (density, gravity, radius, avgTemp) with safe fallback
      try {
        const controller = new AbortController();
        const timer = window.setTimeout(() => controller.abort(), 4500);
        const solarRes = await fetch(
          'https://api.le-systeme-solaire.net/rest/bodies?data=id,englishName,gravity,density,meanRadius,avgTemp',
          { signal: controller.signal }
        );
        window.clearTimeout(timer);
        if (solarRes.ok) {
          const solarJson = await solarRes.json();
          const bodies: Array<{ id?: string; englishName?: string; gravity?: number; density?: number; meanRadius?: number; avgTemp?: number }> =
            Array.isArray(solarJson?.bodies) ? solarJson.bodies : [];
          const bodyMap = new Map<string, (typeof bodies)[number]>();
          for (const b of bodies) {
            if (b.englishName) bodyMap.set(b.englishName.toLowerCase(), b);
            if (b.id) bodyMap.set(b.id.toLowerCase(), b);
          }
          const solarMapping: Record<string, string> = {
            earth: 'earth',
            moon: 'moon',
            mercury: 'mercury',
            venus: 'venus',
            mars: 'mars',
            jupiter: 'jupiter',
            saturn: 'saturn',
            uranus: 'uranus',
            neptune: 'neptune',
            titan: 'titan',
          };
          for (const planet of PLANETS) {
            const key = solarMapping[planet.id];
            if (!key) continue;
            const apiBody = bodyMap.get(key);
            if (apiBody) {
              if (typeof apiBody.gravity === 'number' && apiBody.gravity > 0) planet.gravity = parseFloat(apiBody.gravity.toFixed(2));
              if (typeof apiBody.density === 'number' && apiBody.density > 0) planet.density = parseFloat(apiBody.density.toFixed(2));
              if (typeof apiBody.avgTemp === 'number' && apiBody.avgTemp > 0) planet.temperature = apiBody.avgTemp;
              if (typeof apiBody.meanRadius === 'number' && apiBody.meanRadius > 0) {
                planet.radius = parseFloat((apiBody.meanRadius / 6371).toFixed(3));
              }
              planet.apiSource = 'Solar System OpenData';
            }
          }
        }
      } catch {
        // Keep bundled NASA Fact Sheet physical telemetry silently if Solar System API requires key/network
      }

      // 2. Live NASA Exoplanet Archive TAP API (Caltech) with density, insolation, temperature, mass & radius
      let data;
      try {
        const query =
          "select pl_name,pl_rade,pl_bmasse,pl_dens,pl_insol,sy_dist,st_teff,discoverymethod,disc_year,pl_eqt from ps where default_flag=1 and pl_name in ('TRAPPIST-1 d','TRAPPIST-1 e','TRAPPIST-1 f','Kepler-186 f','Proxima Cen b','K2-18 b','Kepler-452 b','Kepler-22 b','LHS 1140 b','WASP-12 b')&format=json";
        const url = 'https://exoplanetarchive.ipac.caltech.edu/TAP/sync?query=' + encodeURIComponent(query).replace(/%20/g, '+');
        const controller = new AbortController();
        const timer = window.setTimeout(() => controller.abort(), 5000);
        const response = await fetch('https://api.allorigins.win/raw?url=' + encodeURIComponent(url), {
          signal: controller.signal,
        });
        window.clearTimeout(timer);
        if (!response.ok) throw new Error('Fetch failed');
        data = await response.json();
      } catch {
        data = [
          { pl_name: 'TRAPPIST-1 d', pl_rade: 0.788, pl_bmasse: 0.388, pl_dens: 4.35, pl_insol: 1.11, sy_dist: 12.1, st_teff: 2566, discoverymethod: 'Transit', disc_year: 2016, pl_eqt: 288 },
          { pl_name: 'TRAPPIST-1 e', pl_rade: 0.92, pl_bmasse: 0.692, pl_dens: 4.9, pl_insol: 0.65, sy_dist: 12.1, st_teff: 2566, discoverymethod: 'Transit', disc_year: 2017, pl_eqt: 251 },
          { pl_name: 'TRAPPIST-1 f', pl_rade: 1.045, pl_bmasse: 1.039, pl_dens: 5.02, pl_insol: 0.37, sy_dist: 12.1, st_teff: 2566, discoverymethod: 'Transit', disc_year: 2017, pl_eqt: 219 },
          { pl_name: 'K2-18 b', pl_rade: 2.37, pl_bmasse: 8.92, pl_dens: 2.67, pl_insol: 1.05, sy_dist: 38.0, st_teff: 3457, discoverymethod: 'Transit', disc_year: 2015, pl_eqt: 284 },
          { pl_name: 'LHS 1140 b', pl_rade: 1.73, pl_bmasse: 5.6, pl_dens: 5.9, pl_insol: 0.43, sy_dist: 14.9, st_teff: 3096, discoverymethod: 'Transit', disc_year: 2017, pl_eqt: 226 },
          { pl_name: 'WASP-12 b', pl_rade: 22.0, pl_bmasse: 450, pl_dens: 0.26, pl_insol: 4500, sy_dist: 427.2, st_teff: 6265, discoverymethod: 'Transit', disc_year: 2008, pl_eqt: 2580 },
          { pl_name: 'Kepler-186 f', pl_rade: 1.17, pl_bmasse: 1.71, pl_dens: 5.1, pl_insol: 0.29, sy_dist: 177.5, st_teff: 3755, discoverymethod: 'Transit', disc_year: 2014, pl_eqt: 188 },
          { pl_name: 'Proxima Cen b', pl_rade: 1.07, pl_bmasse: 1.055, pl_dens: 4.8, pl_insol: 0.65, sy_dist: 1.3, st_teff: 2900, discoverymethod: 'Radial Velocity', disc_year: 2016, pl_eqt: 234 },
          { pl_name: 'Kepler-452 b', pl_rade: 1.63, pl_bmasse: 5.0, pl_dens: 6.3, pl_insol: 1.1, sy_dist: 551.7, st_teff: 5757, discoverymethod: 'Transit', disc_year: 2015, pl_eqt: 265 },
          { pl_name: 'Kepler-22 b', pl_rade: 2.1, pl_bmasse: 9.1, pl_dens: 4.9, pl_insol: 1.09, sy_dist: 194.6, st_teff: 5596, discoverymethod: 'Transit', disc_year: 2011, pl_eqt: 279 },
        ];
      }

      const newPlanets: PlanetInfo[] = [];
      const colors = ['#2b6cb0', '#805ad5', '#c53030', '#d69e2e', '#38a169', '#319795', '#d53f8c', '#e53e3e', '#718096', '#ecc94b'];

      for (let i = 0; i < data.length; i++) {
        const item = data[i];
        const radius = item.pl_rade || 1;
        const mass = item.pl_bmasse || radius * radius * radius;
        const gravity = Math.max(1, Math.min(25, 9.8 * (mass / (radius * radius))));
        const computedDensity = item.pl_dens || (5.51 * mass) / Math.max(0.2, radius * radius * radius);

        newPlanets.push({
          id: `exo_${i}`,
          name: item.pl_name,
          gravity: parseFloat(gravity.toFixed(2)),
          type: 'exoplanet',
          color: colors[i % colors.length],
          distance: item.sy_dist,
          mass: item.pl_bmasse,
          radius: item.pl_rade,
          density: parseFloat(Number(computedDensity).toFixed(2)),
          insolation: item.pl_insol,
          discoveryMethod: item.discoverymethod,
          discoveryYear: item.disc_year,
          temperature: item.pl_eqt || (item.st_teff ? item.st_teff * 0.1 : 260),
          apiSource: 'NASA Exoplanet Archive',
        });
      }

      const existingIds = new Set(PLANETS.map((p) => p.name));
      const additions = newPlanets.filter((p) => !existingIds.has(p.name));
      if (additions.length > 0) {
        PLANETS.push(...additions);
      }
      set((state) => ({
        planetIndex: state.planetIndex,
        planetaryApiVersion: state.planetaryApiVersion + 1,
      }));
    } catch (e) {
      console.error('Failed to load planetary API telemetry', e);
    }
      })();
      return inflightOrDone;
    };
  })(),
}));
