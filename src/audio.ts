import { useGameStore } from './store';

// ============================================================================
// PROCEDURAL AUDIO ENGINE - ZERO EXTERNAL MP3 DEPENDENCY
// 100% Web Audio API Synthesis:
// - Sons da Natureza (Vento costeiro, brisa ambiente)
// - Sons do Mar (Ondas quebrando, refluxo na areia, modulação espacial)
// - Máquinas a Trabalhar (Geradores industriais, compressores hidráulicos no VAB)
// - Caminhada / Movimentação (Passos na areia, relva, metal e água + saltos)
// ============================================================================

let audioCtx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let isAudioEnabled = true;

// Continuous Ambient Nodes
let natureGain: GainNode | null = null;
let oceanGain: GainNode | null = null;
let machineGain: GainNode | null = null;
let spaceGain: GainNode | null = null;
let ambientStarted = false;

// Continuous Vehicle Engine, Tire Roll & Brake Nodes
let carEngineGain: GainNode | null = null;
let carEngineSubOsc: OscillatorNode | null = null;
let carEngineOsc1: OscillatorNode | null = null;
let carEngineOsc2: OscillatorNode | null = null;
let carEngineFilter: BiquadFilterNode | null = null;
let carTireGain: GainNode | null = null;
let carTireFilter: BiquadFilterNode | null = null;
let carBrakeGain: GainNode | null = null;
let carBrakeFilter: BiquadFilterNode | null = null;

// Track active environment so audio adapts immediately on scene/planet changes (starts silent until playing)
let currentEnvScene: 'surface' | 'space' | 'silent' = 'silent';
let currentEnvPlanetIndex = 0;

// Procedural Music Engine (Menu Suspense + In-Game Selectable Tracks)
export type MusicMode = 'silent' | 'menu_suspense' | 'epic' | 'orbital' | 'tactical';
let musicGain: GainNode | null = null;
let currentMusicMode: MusicMode = 'silent';
let musicTimerId: number | null = null;
let musicStepIndex = 0;
let activeDroneNodes: { stop: () => void }[] = [];

// Footstep cadence timing & alternating left/right stride pitch variation
let lastFootstepTime = 0;
let footstepAlternate = false;

export function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

// ----------------------------------------------------------------------------
// 1. PROCEDURAL CONTINUOUS AMBIENT & VEHICLE AUDIO GENERATORS
// ----------------------------------------------------------------------------
function startProceduralAmbience(ctx: AudioContext) {
  if (ambientStarted) return;
  ambientStarted = true;
  const now = ctx.currentTime;

  // Master Gain
  masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(isAudioEnabled ? 1.0 : 0.0, now);
  masterGain.connect(ctx.destination);

  // Dedicated Music Bus Gain (connects through masterGain so global mute respects music)
  musicGain = ctx.createGain();
  musicGain.gain.setValueAtTime(currentMusicMode === 'silent' ? 0.0 : 0.34, now);
  musicGain.connect(masterGain);

  // Buffer with pink-filtered noise for natural organic wind, waves & brake friction (4 seconds loop)
  const bufferSec = 4;
  const bufferSize = ctx.sampleRate * bufferSec;
  const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = noiseBuffer.getChannelData(0);
  let b0 = 0, b1 = 0, b2 = 0;
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    b0 = 0.99886 * b0 + white * 0.0555179;
    b1 = 0.99332 * b1 + white * 0.0750759;
    b2 = 0.96900 * b2 + white * 0.1538520;
    data[i] = (b0 + b1 + b2) * 0.25;
  }

  const isSilent = currentEnvScene === 'silent';
  const isEarthSurface = !isSilent && currentEnvScene === 'surface' && currentEnvPlanetIndex === 0;
  const isSpace = !isSilent && currentEnvScene === 'space';

  // --- A. NATURE SOUND (Brisa Costeira & Atmosfera) ---
  const natureSource = ctx.createBufferSource();
  natureSource.buffer = noiseBuffer;
  natureSource.loop = true;

  const natureFilter = ctx.createBiquadFilter();
  natureFilter.type = 'lowpass';
  natureFilter.frequency.setValueAtTime(450, now);

  const windLFO = ctx.createOscillator();
  windLFO.frequency.setValueAtTime(0.18, now);
  const windLFOGain = ctx.createGain();
  windLFOGain.gain.setValueAtTime(180, now);
  windLFO.connect(windLFOGain);
  windLFOGain.connect(natureFilter.frequency);
  windLFO.start();

  natureGain = ctx.createGain();
  natureGain.gain.setValueAtTime(isSilent ? 0.0 : isEarthSurface ? 0.24 : isSpace ? 0.0 : 0.10, now);

  natureSource.connect(natureFilter);
  natureFilter.connect(natureGain);
  natureGain.connect(masterGain);
  natureSource.start();

  // --- B. OCEAN SURF SOUND (Ondas do Mar - Strictly Terra Only!) ---
  const oceanSource = ctx.createBufferSource();
  oceanSource.buffer = noiseBuffer;
  oceanSource.loop = true;

  const oceanFilter = ctx.createBiquadFilter();
  oceanFilter.type = 'bandpass';
  oceanFilter.frequency.setValueAtTime(320, now);
  oceanFilter.Q.setValueAtTime(1.2, now);

  const waveLFO = ctx.createOscillator();
  waveLFO.frequency.setValueAtTime(0.28, now);
  const waveLFOGain = ctx.createGain();
  waveLFOGain.gain.setValueAtTime(260, now);
  waveLFO.connect(waveLFOGain);
  waveLFOGain.connect(oceanFilter.frequency);
  waveLFO.start();

  const subSwellOsc = ctx.createOscillator();
  subSwellOsc.type = 'sine';
  subSwellOsc.frequency.setValueAtTime(48, now);
  const subSwellGain = ctx.createGain();
  subSwellGain.gain.setValueAtTime(0.12, now);
  subSwellOsc.connect(subSwellGain);
  subSwellOsc.start();

  oceanGain = ctx.createGain();
  oceanGain.gain.setValueAtTime(isEarthSurface ? 0.35 : 0.0, now);

  oceanSource.connect(oceanFilter);
  oceanFilter.connect(oceanGain);
  subSwellGain.connect(oceanGain);
  oceanGain.connect(masterGain);
  oceanSource.start();

  // --- C. WORKING MACHINERY SOUND (Máquinas VAB & Launchpad - Terra Only!) ---
  const osc1 = ctx.createOscillator();
  osc1.type = 'sawtooth';
  osc1.frequency.setValueAtTime(58.5, now);

  const osc2 = ctx.createOscillator();
  osc2.type = 'triangle';
  osc2.frequency.setValueAtTime(117, now);

  const machFilter = ctx.createBiquadFilter();
  machFilter.type = 'lowpass';
  machFilter.frequency.setValueAtTime(380, now);

  const compressorLFO = ctx.createOscillator();
  compressorLFO.frequency.setValueAtTime(1.15, now);
  const compressorGain = ctx.createGain();
  compressorGain.gain.setValueAtTime(0.08, now);
  compressorLFO.connect(compressorGain);
  compressorLFO.start();

  machineGain = ctx.createGain();
  machineGain.gain.setValueAtTime(isEarthSurface ? 0.15 : 0.0, now);

  osc1.connect(machFilter);
  osc2.connect(machFilter);
  machFilter.connect(machineGain);
  compressorGain.connect(machineGain);
  machineGain.connect(masterGain);
  osc1.start();
  osc2.start();

  // --- D. DEEP SPACE COSMIC AMBIENCE (Som do Espaço Sideral) ---
  const spaceSubOsc = ctx.createOscillator();
  spaceSubOsc.type = 'sine';
  spaceSubOsc.frequency.setValueAtTime(42, now);

  const spacePadOsc1 = ctx.createOscillator();
  spacePadOsc1.type = 'triangle';
  spacePadOsc1.frequency.setValueAtTime(84, now);

  const spacePadOsc2 = ctx.createOscillator();
  spacePadOsc2.type = 'sine';
  spacePadOsc2.frequency.setValueAtTime(126.5, now);

  const spaceFilter = ctx.createBiquadFilter();
  spaceFilter.type = 'lowpass';
  spaceFilter.frequency.setValueAtTime(190, now);

  const spaceLFO = ctx.createOscillator();
  spaceLFO.frequency.setValueAtTime(0.09, now);
  const spaceLFOGain = ctx.createGain();
  spaceLFOGain.gain.setValueAtTime(75, now);
  spaceLFO.connect(spaceLFOGain);
  spaceLFOGain.connect(spaceFilter.frequency);
  spaceLFO.start();

  const spaceWindSrc = ctx.createBufferSource();
  spaceWindSrc.buffer = noiseBuffer;
  spaceWindSrc.loop = true;
  const spaceWindBand = ctx.createBiquadFilter();
  spaceWindBand.type = 'bandpass';
  spaceWindBand.frequency.setValueAtTime(240, now);
  spaceWindBand.Q.setValueAtTime(2.6, now);
  const spaceWindGain = ctx.createGain();
  spaceWindGain.gain.setValueAtTime(0.18, now);
  spaceWindSrc.connect(spaceWindBand);
  spaceWindBand.connect(spaceWindGain);
  spaceWindSrc.start();

  spaceGain = ctx.createGain();
  spaceGain.gain.setValueAtTime(isSilent ? 0.0 : isSpace ? 0.36 : isEarthSurface ? 0.0 : 0.10, now);

  spaceSubOsc.connect(spaceFilter);
  spacePadOsc1.connect(spaceFilter);
  spacePadOsc2.connect(spaceFilter);
  spaceFilter.connect(spaceGain);
  spaceWindGain.connect(spaceGain);
  spaceGain.connect(masterGain);
  spaceSubOsc.start();
  spacePadOsc1.start();
  spacePadOsc2.start();

  // --- E. PROCEDURAL THERMAL VEHICLE ENGINE, TIRE ROLL & BRAKING SYNTHESIS ---
  carEngineSubOsc = ctx.createOscillator();
  carEngineSubOsc.type = 'sine';
  carEngineSubOsc.frequency.setValueAtTime(28, now);

  carEngineOsc1 = ctx.createOscillator();
  carEngineOsc1.type = 'sawtooth';
  carEngineOsc1.frequency.setValueAtTime(52, now);

  carEngineOsc2 = ctx.createOscillator();
  carEngineOsc2.type = 'sawtooth';
  carEngineOsc2.frequency.setValueAtTime(52.8, now);

  carEngineFilter = ctx.createBiquadFilter();
  carEngineFilter.type = 'lowpass';
  carEngineFilter.frequency.setValueAtTime(140, now);
  carEngineFilter.Q.setValueAtTime(1.9, now);

  carEngineGain = ctx.createGain();
  carEngineGain.gain.setValueAtTime(0.0, now);

  const subMixGain = ctx.createGain();
  subMixGain.gain.setValueAtTime(0.85, now);

  carEngineSubOsc.connect(subMixGain);
  subMixGain.connect(carEngineFilter);
  carEngineOsc1.connect(carEngineFilter);
  carEngineOsc2.connect(carEngineFilter);
  carEngineFilter.connect(carEngineGain);
  carEngineGain.connect(masterGain);
  carEngineSubOsc.start();
  carEngineOsc1.start();
  carEngineOsc2.start();

  // Tire Rolling Friction on Asphalt / Concrete
  const tireNoiseSrc = ctx.createBufferSource();
  tireNoiseSrc.buffer = noiseBuffer;
  tireNoiseSrc.loop = true;

  carTireFilter = ctx.createBiquadFilter();
  carTireFilter.type = 'bandpass';
  carTireFilter.frequency.setValueAtTime(160, now);
  carTireFilter.Q.setValueAtTime(0.85, now);

  carTireGain = ctx.createGain();
  carTireGain.gain.setValueAtTime(0.0, now);

  tireNoiseSrc.connect(carTireFilter);
  carTireFilter.connect(carTireGain);
  carTireGain.connect(masterGain);
  tireNoiseSrc.start();

  // Brake Disc Friction Hiss
  const brakeNoiseSrc = ctx.createBufferSource();
  brakeNoiseSrc.buffer = noiseBuffer;
  brakeNoiseSrc.loop = true;

  carBrakeFilter = ctx.createBiquadFilter();
  carBrakeFilter.type = 'bandpass';
  carBrakeFilter.frequency.setValueAtTime(1650, now);
  carBrakeFilter.Q.setValueAtTime(3.2, now);

  carBrakeGain = ctx.createGain();
  carBrakeGain.gain.setValueAtTime(0.0, now);

  brakeNoiseSrc.connect(carBrakeFilter);
  carBrakeFilter.connect(carBrakeGain);
  carBrakeGain.connect(masterGain);
  brakeNoiseSrc.start();
}

export function setAudioEnvironment(scene: 'surface' | 'space' | 'silent', planetIndex: number) {
  currentEnvScene = scene;
  currentEnvPlanetIndex = planetIndex;
  const ctx = getAudioContext();
  if (!ctx || !ambientStarted) return;

  const now = ctx.currentTime;
  if (scene === 'silent') {
    if (oceanGain) oceanGain.gain.setTargetAtTime(0.0, now, 0.03);
    if (machineGain) machineGain.gain.setTargetAtTime(0.0, now, 0.03);
    if (natureGain) natureGain.gain.setTargetAtTime(0.0, now, 0.03);
    if (spaceGain) spaceGain.gain.setTargetAtTime(0.0, now, 0.03);
    if (carEngineGain) carEngineGain.gain.setTargetAtTime(0.0, now, 0.03);
    if (carTireGain) carTireGain.gain.setTargetAtTime(0.0, now, 0.03);
    if (carBrakeGain) carBrakeGain.gain.setTargetAtTime(0.0, now, 0.03);
    return;
  }

  const isEarthSurface = scene === 'surface' && planetIndex === 0;
  const isSpace = scene === 'space';

  if (oceanGain) {
    oceanGain.gain.setTargetAtTime(isEarthSurface ? 0.32 : 0.0, now, 0.25);
  }
  if (machineGain) {
    machineGain.gain.setTargetAtTime(isEarthSurface ? 0.14 : 0.0, now, 0.25);
  }
  if (natureGain) {
    natureGain.gain.setTargetAtTime(isEarthSurface ? 0.22 : isSpace ? 0.0 : 0.10, now, 0.25);
  }
  if (spaceGain) {
    spaceGain.gain.setTargetAtTime(isSpace ? 0.36 : isEarthSurface ? 0.0 : 0.08, now, 0.35);
  }
  if (!isEarthSurface) {
    if (carEngineGain) carEngineGain.gain.setTargetAtTime(0.0, now, 0.08);
    if (carTireGain) carTireGain.gain.setTargetAtTime(0.0, now, 0.08);
    if (carBrakeGain) carBrakeGain.gain.setTargetAtTime(0.0, now, 0.08);
  }
}

export function updateCarAudio(
  isDriving: boolean,
  speedMs: number,
  throttle: number,
  isBraking: boolean,
  isTurbo = false
) {
  const ctx = getAudioContext();
  if (!ctx || !ambientStarted || !isAudioEnabled) return;
  const now = ctx.currentTime;

  if (!isDriving || currentEnvScene !== 'surface' || currentEnvPlanetIndex !== 0) {
    if (carEngineGain) carEngineGain.gain.setTargetAtTime(0.0, now, 0.08);
    if (carTireGain) carTireGain.gain.setTargetAtTime(0.0, now, 0.08);
    if (carBrakeGain) carBrakeGain.gain.setTargetAtTime(0.0, now, 0.06);
    return;
  }

  const absSpeed = Math.abs(speedMs);
  const speedNorm = Math.min(1.0, absSpeed / 42.0);
  const absThrottle = Math.min(1.0, Math.abs(throttle));

  // Simulated 6-gear thermal combustion curve (deep cylinder pulse, no high-frequency synth whine)
  const gearProgress = speedNorm * 5.6;
  const gearFrac = gearProgress < 0.8 ? gearProgress : (gearProgress % 1.0);
  const rpmNorm = Math.min(
    1.0,
    0.12 + speedNorm * 0.42 + gearFrac * 0.28 + absThrottle * 0.24 + (isTurbo ? 0.14 : 0)
  );
  const baseFreq = 50 + rpmNorm * 82;

  if (carEngineSubOsc) {
    carEngineSubOsc.frequency.setTargetAtTime(baseFreq * 0.52, now, 0.05);
  }
  if (carEngineOsc1) {
    carEngineOsc1.frequency.setTargetAtTime(baseFreq, now, 0.05);
  }
  if (carEngineOsc2) {
    carEngineOsc2.frequency.setTargetAtTime(baseFreq * 1.015, now, 0.05);
  }
  if (carEngineFilter) {
    carEngineFilter.frequency.setTargetAtTime(105 + rpmNorm * 195 + absThrottle * 85, now, 0.06);
  }
  if (carEngineGain) {
    const targetEngineVol = 0.065 + absThrottle * 0.13 + speedNorm * 0.08 + (isTurbo ? 0.04 : 0);
    carEngineGain.gain.setTargetAtTime(targetEngineVol, now, 0.06);
  }

  // Road-tire rolling hum proportional to ground velocity
  if (carTireFilter) {
    carTireFilter.frequency.setTargetAtTime(145 + speedNorm * 190, now, 0.06);
  }
  if (carTireGain) {
    const targetTireVol = absSpeed > 0.4 ? Math.min(0.19, 0.025 + speedNorm * 0.165) : 0.0;
    carTireGain.gain.setTargetAtTime(targetTireVol, now, 0.07);
  }

  // Braking friction hiss & disc pad bite when actively braking while moving
  const activelyBraking = (isBraking && absSpeed > 0.7) || (speedMs > 1.2 && throttle < -0.1);
  if (carBrakeFilter) {
    carBrakeFilter.frequency.setTargetAtTime(1350 + speedNorm * 1150, now, 0.05);
  }
  if (carBrakeGain) {
    const targetBrakeVol = activelyBraking ? Math.min(0.24, 0.07 + speedNorm * 0.18) : 0.0;
    carBrakeGain.gain.setTargetAtTime(targetBrakeVol, now, 0.04);
  }
}

// ----------------------------------------------------------------------------
// 2. SPATIAL POSITION & ENVIRONMENT AUDIO UPDATES (useFrame reactive)
// ----------------------------------------------------------------------------
export function updateSpatialAudio(
  playerPos: [number, number, number],
  isMoving: boolean,
  speed: number,
  isGrounded: boolean,
  inWater: boolean
) {
  const ctx = getAudioContext();
  if (!ctx || !ambientStarted || !isAudioEnabled) return;

  const now = ctx.currentTime;
  if (currentEnvScene === 'silent') {
    if (oceanGain) oceanGain.gain.setTargetAtTime(0.0, now, 0.03);
    if (machineGain) machineGain.gain.setTargetAtTime(0.0, now, 0.03);
    if (natureGain) natureGain.gain.setTargetAtTime(0.0, now, 0.03);
    if (spaceGain) spaceGain.gain.setTargetAtTime(0.0, now, 0.03);
    return;
  }

  const px = playerPos[0];
  const pz = playerPos[2];

  // Ocean & VAB Machinery ambience ONLY exist on Earth (planetIndex === 0, surface)
  if (currentEnvScene === 'surface' && currentEnvPlanetIndex === 0) {
    if (oceanGain) {
      let oceanFactor = 0.04;
      if (px < -20) {
        oceanFactor = Math.min(0.60, 0.36 + Math.abs(px + 20) * 0.015);
      } else if (px < 40) {
        oceanFactor = Math.max(0.06, 0.36 * (1 - (px + 20) / 60));
      } else {
        oceanFactor = Math.max(0.0, 0.06 * (1 - Math.min(1, (px - 40) / 100)));
      }
      oceanGain.gain.setTargetAtTime(oceanFactor, now, 0.2);
    }

    if (machineGain) {
      const distToPad = Math.hypot(px, pz);
      const distToVAB = Math.hypot(px - 220, pz);
      let machFactor = 0.03;

      if (distToVAB < 90) {
        machFactor = Math.min(0.42, 0.18 + (1 - distToVAB / 90) * 0.24);
      } else if (distToPad < 45) {
        machFactor = Math.min(0.30, 0.13 + (1 - distToPad / 45) * 0.17);
      } else if (px > 80) {
        machFactor = 0.10;
      }
      machineGain.gain.setTargetAtTime(machFactor, now, 0.2);
    }
  } else {
    if (oceanGain) oceanGain.gain.setTargetAtTime(0.0, now, 0.12);
    if (machineGain) machineGain.gain.setTargetAtTime(0.0, now, 0.12);
  }

  // Footstep Cadence Triggering (works across Earth and all planetary surfaces)
  if (currentEnvScene === 'surface' && isMoving && isGrounded && speed > 0.4) {
    const isRunning = speed > 3.8;
    const interval = inWater ? 0.62 : isRunning ? 0.29 : 0.44;

    if (performance.now() - lastFootstepTime > interval * 1000) {
      lastFootstepTime = performance.now();
      if (inWater && currentEnvPlanetIndex === 0) {
        playWaterWadeSound();
      } else {
        let surface: 'sand' | 'metal' | 'grass' = currentEnvPlanetIndex === 0 ? 'grass' : 'sand';

        if (currentEnvPlanetIndex === 0) {
          if (px >= -34 && px <= -16) {
            surface = 'sand';
          } else if (
            Math.hypot(px, pz) < 18 ||
            (px >= 10 && px <= 230 && Math.abs(pz) < 20) ||
            (px >= 180 && px <= 260 && Math.abs(pz) < 55)
          ) {
            surface = 'metal';
          }
        } else {
          // Off-world: check Gas Giant floating metal decks and planetary base airlock/pad floors
          const onGasDeck =
            currentEnvPlanetIndex >= 5 &&
            currentEnvPlanetIndex <= 8 &&
            Math.hypot(px, pz) < 66;
          const onBaseOrPad =
            onGasDeck ||
            Math.hypot(px, pz) < 7 ||
            (currentEnvPlanetIndex === 1 && Math.hypot(px - 24, pz + 24) < 12) ||
            (currentEnvPlanetIndex === 2 && Math.hypot(px - 26, pz - 22) < 12) ||
            (currentEnvPlanetIndex === 3 && Math.hypot(px - 26, pz + 22) < 12) ||
            (currentEnvPlanetIndex === 4 && Math.hypot(px - 26, pz + 24) < 12) ||
            (currentEnvPlanetIndex === 9 && Math.hypot(px - 24, pz + 24) < 12) ||
            (currentEnvPlanetIndex >= 10 && Math.hypot(px - 24, pz + 22) < 12);

          surface = onBaseOrPad ? 'metal' : 'sand';
        }

        playFootstepSound(surface, isRunning);
      }
    }
  }
}

// ----------------------------------------------------------------------------
// 3. CAMINHADA & MOVIMENTAÇÃO (Terrain-Defined Boots + Spacesuit Movement)
// ----------------------------------------------------------------------------
export function playFootstepSound(surface: 'grass' | 'sand' | 'metal', isRunning: boolean) {
  const ctx = getAudioContext();
  if (!ctx || !isAudioEnabled) return;
  const now = ctx.currentTime;
  const out = masterGain || ctx.destination;

  footstepAlternate = !footstepAlternate;
  const stridePitch = footstepAlternate ? 1.04 : 0.96;
  const strideGain = footstepAlternate ? 1.0 : 0.93;

  // 1. Weighted Boot Sole Impact Thud (present on every terrain, shaped to surface hardness)
  const thumpOsc = ctx.createOscillator();
  thumpOsc.type = surface === 'metal' ? 'triangle' : 'sine';
  const startFreq = (surface === 'metal' ? 132 : surface === 'sand' ? 88 : 76) * stridePitch;
  const endFreq = surface === 'metal' ? 44 : surface === 'sand' ? 34 : 30;
  const thumpDur = surface === 'metal' ? 0.058 : 0.07;
  thumpOsc.frequency.setValueAtTime(startFreq, now);
  thumpOsc.frequency.exponentialRampToValueAtTime(endFreq, now + thumpDur);

  const thumpGain = ctx.createGain();
  const baseThumpVol =
    surface === 'metal'
      ? isRunning
        ? 0.21
        : 0.15
      : surface === 'sand'
      ? isRunning
        ? 0.14
        : 0.095
      : isRunning
      ? 0.13
      : 0.085;
  thumpGain.gain.setValueAtTime(baseThumpVol * strideGain, now);
  thumpGain.gain.exponentialRampToValueAtTime(0.001, now + thumpDur);

  thumpOsc.connect(thumpGain);
  thumpGain.connect(out);
  thumpOsc.start(now);
  thumpOsc.stop(now + thumpDur);

  // Subtle metallic deck resonance on metal pads/bases
  if (surface === 'metal') {
    const ringOsc = ctx.createOscillator();
    ringOsc.type = 'sine';
    ringOsc.frequency.setValueAtTime(245 * stridePitch, now);
    const ringGain = ctx.createGain();
    ringGain.gain.setValueAtTime((isRunning ? 0.065 : 0.04) * strideGain, now);
    ringGain.gain.exponentialRampToValueAtTime(0.001, now + 0.065);
    ringOsc.connect(ringGain);
    ringGain.connect(out);
    ringOsc.start(now);
    ringOsc.stop(now + 0.065);
  }

  // Helper to spawn filtered noise bursts for surface grit & spacesuit flex
  const triggerNoiseBurst = (
    delaySec: number,
    durSec: number,
    decayRatio: number,
    filterType: BiquadFilterType,
    freqStart: number,
    freqEnd: number,
    qVal: number,
    peakGain: number
  ) => {
    const startAt = now + delaySec;
    const len = Math.max(128, Math.floor(ctx.sampleRate * durSec));
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const ch = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      const env = Math.exp(-i / (ctx.sampleRate * (durSec * decayRatio)));
      ch[i] = (Math.random() * 2 - 1) * env;
    }

    const src = ctx.createBufferSource();
    src.buffer = buf;

    const flt = ctx.createBiquadFilter();
    flt.type = filterType;
    flt.frequency.setValueAtTime(freqStart, startAt);
    if (freqEnd !== freqStart) {
      flt.frequency.linearRampToValueAtTime(freqEnd, startAt + durSec);
    }
    flt.Q.setValueAtTime(qVal, startAt);

    const gn = ctx.createGain();
    gn.gain.setValueAtTime(peakGain * strideGain, startAt);
    gn.gain.exponentialRampToValueAtTime(0.001, startAt + durSec);

    src.connect(flt);
    flt.connect(gn);
    gn.connect(out);
    src.start(startAt);
  };

  // 2. Terrain-Specific Surface Crunch / Tap
  if (surface === 'sand') {
    // Primary heel sink + staggered toe push-off grit (beach sand & lunar/planetary regolith)
    triggerNoiseBurst(0, 0.085, 0.42, 'bandpass', 540 * stridePitch, 460 * stridePitch, 1.35, isRunning ? 0.17 : 0.12);
    triggerNoiseBurst(0.018, 0.075, 0.38, 'bandpass', 1120 * stridePitch, 960 * stridePitch, 1.6, isRunning ? 0.11 : 0.075);
  } else if (surface === 'metal') {
    // Crisp high-definition boot heel clack on metallic grates/concrete
    triggerNoiseBurst(0, 0.055, 0.28, 'bandpass', (isRunning ? 1480 : 1220) * stridePitch, 1050 * stridePitch, 3.5, isRunning ? 0.22 : 0.15);
  } else {
    // Grass & soft soil rustle
    triggerNoiseBurst(0, 0.095, 0.45, 'lowpass', (isRunning ? 780 : 600) * stridePitch, 440 * stridePitch, 0.8, isRunning ? 0.16 : 0.105);
  }

  // 3. Pressurized Spacesuit Beta-Cloth & Articulated Boot Flex Swish
  triggerNoiseBurst(
    0.012,
    0.135,
    0.52,
    'bandpass',
    920 * stridePitch,
    1320 * stridePitch,
    1.35,
    isRunning ? 0.082 : 0.048
  );
}

// ----------------------------------------------------------------------------
// 4. JUMP & LANDING SOUNDS
// ----------------------------------------------------------------------------
export function playJumpSound() {
  const ctx = getAudioContext();
  if (!ctx || !isAudioEnabled) return;
  const now = ctx.currentTime;

  // Cold-gas micro-thruster assist puff
  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(95, now);
  osc.frequency.linearRampToValueAtTime(170, now + 0.15);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.18, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

  osc.connect(gain);
  gain.connect(masterGain || ctx.destination);
  osc.start(now);
  osc.stop(now + 0.22);
}

export function playLandSound() {
  const ctx = getAudioContext();
  if (!ctx || !isAudioEnabled) return;
  const now = ctx.currentTime;

  // Solid suit mass landing thump
  const osc = ctx.createOscillator();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(140, now);
  osc.frequency.exponentialRampToValueAtTime(40, now + 0.16);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.26, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

  osc.connect(gain);
  gain.connect(masterGain || ctx.destination);
  osc.start(now);
  osc.stop(now + 0.18);
}

// ----------------------------------------------------------------------------
// 5. WATER SPLASH & WADING SOUNDS
// ----------------------------------------------------------------------------
export function playWaterSplashSound() {
  const ctx = getAudioContext();
  if (!ctx || !isAudioEnabled) return;
  const now = ctx.currentTime;

  // Plunge bubble burst
  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(210, now);
  osc.frequency.exponentialRampToValueAtTime(60, now + 0.24);

  const oscGain = ctx.createGain();
  oscGain.gain.setValueAtTime(0.26, now);
  oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);

  osc.connect(oscGain);
  oscGain.connect(masterGain || ctx.destination);
  osc.start(now);
  osc.stop(now + 0.24);

  // Droplet spray hiss
  const bufferSize = Math.floor(ctx.sampleRate * 0.32);
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.08));
  }
  const noise = ctx.createBufferSource();
  noise.buffer = buffer;

  const bandpass = ctx.createBiquadFilter();
  bandpass.type = 'bandpass';
  bandpass.frequency.setValueAtTime(1200, now);
  bandpass.frequency.exponentialRampToValueAtTime(480, now + 0.32);
  bandpass.Q.setValueAtTime(2.0, now);

  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0.18, now);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);

  noise.connect(bandpass);
  bandpass.connect(noiseGain);
  noiseGain.connect(masterGain || ctx.destination);
  noise.start(now);
}

export function playWaterWadeSound() {
  const ctx = getAudioContext();
  if (!ctx || !isAudioEnabled) return;
  const now = ctx.currentTime;

  const bufferSize = Math.floor(ctx.sampleRate * 0.22);
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.06));
  }
  const noise = ctx.createBufferSource();
  noise.buffer = buffer;

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(750, now);
  filter.frequency.exponentialRampToValueAtTime(280, now + 0.2);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.14, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

  noise.connect(filter);
  filter.connect(gain);
  gain.connect(masterGain || ctx.destination);
  noise.start(now);
}

// ----------------------------------------------------------------------------
// 6. INFRASTRUCTURE & VAB DOOR SOUNDS
// ----------------------------------------------------------------------------
export function playDoorOpenSound() {
  const ctx = getAudioContext();
  if (!ctx || !isAudioEnabled) return;
  const now = ctx.currentTime;

  // Pneumatic release hiss
  const bufferSize = Math.floor(ctx.sampleRate * 0.45);
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.14));
  }
  const noise = ctx.createBufferSource();
  noise.buffer = buffer;

  const bandpass = ctx.createBiquadFilter();
  bandpass.type = 'bandpass';
  bandpass.frequency.setValueAtTime(2200, now);
  bandpass.frequency.exponentialRampToValueAtTime(650, now + 0.42);
  bandpass.Q.setValueAtTime(3.0, now);

  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0.24, now);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

  noise.connect(bandpass);
  bandpass.connect(noiseGain);
  noiseGain.connect(masterGain || ctx.destination);
  noise.start(now);

  // Motorized heavy door servo track
  const osc = ctx.createOscillator();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(95, now);
  osc.frequency.linearRampToValueAtTime(135, now + 0.3);
  osc.frequency.linearRampToValueAtTime(75, now + 0.65);

  const lowpass = ctx.createBiquadFilter();
  lowpass.type = 'lowpass';
  lowpass.frequency.setValueAtTime(360, now);

  const motorGain = ctx.createGain();
  motorGain.gain.setValueAtTime(0.01, now);
  motorGain.gain.linearRampToValueAtTime(0.12, now + 0.08);
  motorGain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);

  osc.connect(lowpass);
  lowpass.connect(motorGain);
  motorGain.connect(masterGain || ctx.destination);
  osc.start(now);
  osc.stop(now + 0.65);
}

export function playDoorCloseSound() {
  const ctx = getAudioContext();
  if (!ctx || !isAudioEnabled) return;
  const now = ctx.currentTime;

  const osc = ctx.createOscillator();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(130, now);
  osc.frequency.linearRampToValueAtTime(80, now + 0.45);

  const lowpass = ctx.createBiquadFilter();
  lowpass.type = 'lowpass';
  lowpass.frequency.setValueAtTime(340, now);

  const motorGain = ctx.createGain();
  motorGain.gain.setValueAtTime(0.01, now);
  motorGain.gain.linearRampToValueAtTime(0.1, now + 0.05);
  motorGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

  osc.connect(lowpass);
  lowpass.connect(motorGain);
  motorGain.connect(masterGain || ctx.destination);
  osc.start(now);
  osc.stop(now + 0.5);

  // Heavy mechanical lock latch
  const subOsc = ctx.createOscillator();
  subOsc.type = 'triangle';
  subOsc.frequency.setValueAtTime(115, now + 0.42);
  subOsc.frequency.exponentialRampToValueAtTime(40, now + 0.65);

  const subGain = ctx.createGain();
  subGain.gain.setValueAtTime(0.001, now);
  subGain.gain.setValueAtTime(0.24, now + 0.42);
  subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);

  subOsc.connect(subGain);
  subGain.connect(masterGain || ctx.destination);
  subOsc.start(now + 0.42);
  subOsc.stop(now + 0.65);
}

// ----------------------------------------------------------------------------
// 7. INITIALIZATION, PROCEDURAL MUSIC SEQUENCER & CONTROLS
// ----------------------------------------------------------------------------
function stopMusicSequencer(fadeOut = true) {
  if (musicTimerId !== null) {
    window.clearInterval(musicTimerId);
    musicTimerId = null;
  }
  activeDroneNodes.forEach((n) => {
    try {
      n.stop();
    } catch {
      // Ignore already stopped oscillators
    }
  });
  activeDroneNodes = [];

  if (musicGain && audioCtx && fadeOut) {
    musicGain.gain.setTargetAtTime(0.0, audioCtx.currentTime, 0.08);
  }
}

function playMusicVoice(
  ctx: AudioContext,
  freq: number,
  durationSec: number,
  volume: number,
  wave: OscillatorType,
  cutoffHz: number,
  attackSec = 0.04,
  detuneCents = 0
) {
  if (!musicGain || ctx.state !== 'running') return;
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  osc.type = wave;
  osc.frequency.setValueAtTime(freq, now);
  if (detuneCents !== 0) {
    osc.detune.setValueAtTime(detuneCents, now);
  }

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(cutoffHz, now);

  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, now);
  g.gain.linearRampToValueAtTime(volume, now + attackSec);
  g.gain.exponentialRampToValueAtTime(0.0001, now + durationSec);

  osc.connect(filter);
  filter.connect(g);
  g.connect(musicGain);
  osc.start(now);
  osc.stop(now + durationSec + 0.04);
}

function startMusicSequencerForMode(mode: MusicMode) {
  stopMusicSequencer(false);
  if (mode === 'silent') return;
  const ctx = getAudioContext();
  if (!ctx) return;
  if (!ambientStarted) {
    startProceduralAmbience(ctx);
  }
  if (!musicGain) return;

  const now = ctx.currentTime;
  const targetBusVol = mode === 'menu_suspense' ? 0.34 : mode === 'orbital' ? 0.28 : 0.32;
  musicGain.gain.setTargetAtTime(targetBusVol, now, 0.25);
  musicStepIndex = 0;

  // Continuous low harmonic bed drone tailored to the active track
  const droneOsc = ctx.createOscillator();
  const droneFilter = ctx.createBiquadFilter();
  const droneGain = ctx.createGain();
  droneOsc.type = mode === 'menu_suspense' ? 'sawtooth' : 'triangle';
  droneOsc.frequency.setValueAtTime(
    mode === 'menu_suspense' ? 36.71 : mode === 'epic' ? 65.41 : mode === 'orbital' ? 82.41 : 55.0,
    now
  );
  droneFilter.type = 'lowpass';
  droneFilter.frequency.setValueAtTime(mode === 'menu_suspense' ? 125 : 180, now);
  droneGain.gain.setValueAtTime(0.001, now);
  droneGain.gain.linearRampToValueAtTime(mode === 'menu_suspense' ? 0.22 : 0.14, now + 0.8);
  droneOsc.connect(droneFilter);
  droneFilter.connect(droneGain);
  droneGain.connect(musicGain);
  droneOsc.start(now);
  activeDroneNodes.push({
    stop: () => {
      try {
        droneOsc.stop();
        droneOsc.disconnect();
      } catch {
        // Ignore
      }
    },
  });

  const stepMs =
    mode === 'menu_suspense' ? 460 : mode === 'epic' ? 360 : mode === 'orbital' ? 430 : 250;

  const tickStep = () => {
    if (!audioCtx || audioCtx.state !== 'running' || currentMusicMode !== mode) return;
    const step = musicStepIndex % 16;
    musicStepIndex += 1;

    if (mode === 'menu_suspense') {
      // Suspenseful minor/diminished cinematic tension (Dm -> Bb -> Gm7b5 -> A7sus4)
      const bassRoots = [73.42, 73.42, 58.27, 55.0]; // D2, D2, Bb1, A1
      const padChords = [
        [146.83, 174.61, 220.0], // Dm
        [146.83, 185.0, 233.08], // Tension aug/min swell
        [116.54, 146.83, 174.61], // Bbmaj
        [110.0, 155.56, 207.65], // A tritone/tension
      ];
      const bar = Math.floor(step / 4);
      if (step % 4 === 0) {
        playMusicVoice(audioCtx, bassRoots[bar], 1.75, 0.28, 'triangle', 190, 0.08);
        padChords[bar].forEach((note, idx) => {
          playMusicVoice(audioCtx, note, 1.85, 0.085, 'sawtooth', 420, 0.35, idx === 1 ? -6 : 6);
        });
      }
      // Subtle radar sonar / suspense pulse
      const suspenseMotif = [293.66, 0, 311.13, 0, 261.63, 0, 220.0, 0, 293.66, 0, 349.23, 0, 277.18, 0, 0, 220.0];
      const ping = suspenseMotif[step];
      if (ping > 0) {
        playMusicVoice(audioCtx, ping, 0.85, 0.11, 'sine', 1600, 0.02);
      }
      // Heartbeat low thump on beats 0 and 2
      if (step % 2 === 0) {
        playMusicVoice(audioCtx, 52, 0.22, 0.16, 'sine', 120, 0.01);
      }
    } else if (mode === 'epic') {
      // Uplifting Space Epic progression (C -> Am -> F -> G)
      const bassNotes = [130.81, 110.0, 87.31, 98.0];
      const chords = [
        [261.63, 329.63, 392.0],
        [220.0, 261.63, 329.63],
        [174.61, 220.0, 261.63],
        [196.0, 246.94, 293.66],
      ];
      const lead = [523.25, 0, 659.25, 587.33, 440.0, 0, 523.25, 493.88, 349.23, 440.0, 523.25, 0, 587.33, 493.88, 392.0, 0];
      const bar = Math.floor(step / 4);
      if (step % 4 === 0) {
        playMusicVoice(audioCtx, bassNotes[bar], 1.4, 0.25, 'triangle', 260, 0.06);
        chords[bar].forEach((n, i) => {
          playMusicVoice(audioCtx, n, 1.5, 0.095, 'sawtooth', 780, 0.22, i % 2 === 0 ? -5 : 5);
        });
      }
      const mel = lead[step];
      if (mel > 0) {
        playMusicVoice(audioCtx, mel, 0.65, 0.13, 'triangle', 2200, 0.03);
      }
    } else if (mode === 'orbital') {
      // Serene Orbital Drift ambient arpeggios (Em9 -> Cmaj7 -> Gmaj7 -> Dadd9)
      const arps = [
        [164.81, 246.94, 329.63, 369.99],
        [130.81, 196.0, 261.63, 329.63],
        [196.0, 246.94, 293.66, 369.99],
        [146.83, 220.0, 293.66, 329.63],
      ];
      const bar = Math.floor(step / 4);
      const sub = step % 4;
      if (sub === 0) {
        playMusicVoice(audioCtx, arps[bar][0], 1.8, 0.18, 'sine', 300, 0.15);
      }
      playMusicVoice(audioCtx, arps[bar][sub] * 2, 1.15, 0.12, 'sine', 1800, 0.04);
      if (sub === 2) {
        playMusicVoice(audioCtx, arps[bar][1] * 2, 0.9, 0.07, 'triangle', 1200, 0.05);
      }
    } else if (mode === 'tactical') {
      // Focused Mission Control Tactical Pulse (Am -> F -> Dm -> E)
      const bassSeq = [110.0, 110.0, 87.31, 87.31, 73.42, 73.42, 82.41, 98.0];
      const bassFreq = bassSeq[Math.floor(step / 2)];
      playMusicVoice(audioCtx, bassFreq, 0.21, step % 2 === 0 ? 0.24 : 0.14, 'sawtooth', step % 2 === 0 ? 440 : 280, 0.01);

      const arp = [440, 523.25, 659.25, 523.25, 349.23, 440, 523.25, 440, 293.66, 349.23, 440, 349.23, 329.63, 392.0, 493.88, 392.0];
      if (step % 2 === 0 || step % 4 === 3) {
        playMusicVoice(audioCtx, arp[step], 0.3, 0.095, 'square', 1100, 0.015);
      }
    }
  };

  tickStep();
  musicTimerId = window.setInterval(tickStep, stepMs);
}

export function setMusicMode(mode: MusicMode) {
  const modeChanged = currentMusicMode !== mode;
  currentMusicMode = mode;

  if (mode === 'silent') {
    stopMusicSequencer(true);
    return;
  }

  const ctx = getAudioContext();
  if (!ctx) return;
  if (!ambientStarted) {
    startProceduralAmbience(ctx);
  }
  if (ctx.state === 'running' && (modeChanged || musicTimerId === null)) {
    startMusicSequencerForMode(mode);
  }
}

export function getActiveMusicMode(): MusicMode {
  return currentMusicMode;
}

export function initAudio() {
  const ctx = getAudioContext();
  if (!ctx) return;
  startProceduralAmbience(ctx);
  if (currentMusicMode !== 'silent' && musicTimerId === null && ctx.state === 'running') {
    startMusicSequencerForMode(currentMusicMode);
  } else if (currentMusicMode !== 'silent' && ctx.state === 'suspended') {
    ctx.resume().then(() => {
      if (currentMusicMode !== 'silent' && musicTimerId === null) {
        startMusicSequencerForMode(currentMusicMode);
      }
    }).catch(() => {});
  }
}

export function toggleAudio(): boolean {
  isAudioEnabled = !isAudioEnabled;
  if (masterGain && audioCtx) {
    masterGain.gain.setTargetAtTime(isAudioEnabled ? 1.0 : 0.0, audioCtx.currentTime, 0.05);
  }
  if (isAudioEnabled) {
    const ctx = getAudioContext();
    if (ctx && !ambientStarted) startProceduralAmbience(ctx);
    if (currentMusicMode !== 'silent' && musicTimerId === null) {
      startMusicSequencerForMode(currentMusicMode);
    }
  } else {
    stopMissionVoice();
  }
  return isAudioEnabled;
}

export function isAudioActive(): boolean {
  return isAudioEnabled;
}

export function playCarCrashSound(impactSpeed = 8) {
  const ctx = getAudioContext();
  if (!ctx || !isAudioEnabled) return;
  const now = ctx.currentTime;
  const intensity = Math.max(0.25, Math.min(1.0, impactSpeed / 18));

  // 1. Heavy metallic chassis thud
  const thudOsc = ctx.createOscillator();
  thudOsc.type = 'sawtooth';
  thudOsc.frequency.setValueAtTime(115, now);
  thudOsc.frequency.exponentialRampToValueAtTime(28, now + 0.26);

  const thudFilter = ctx.createBiquadFilter();
  thudFilter.type = 'lowpass';
  thudFilter.frequency.setValueAtTime(280, now);

  const thudGain = ctx.createGain();
  thudGain.gain.setValueAtTime(0.42 * intensity, now);
  thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

  thudOsc.connect(thudFilter);
  thudFilter.connect(thudGain);
  thudGain.connect(masterGain || ctx.destination);
  thudOsc.start(now);
  thudOsc.stop(now + 0.28);

  // 2. Metallic crunch burst
  const duration = 0.24;
  const bufferSize = Math.floor(ctx.sampleRate * duration);
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.065));
  }
  const crunchSource = ctx.createBufferSource();
  crunchSource.buffer = buffer;

  const crunchFilter = ctx.createBiquadFilter();
  crunchFilter.type = 'bandpass';
  crunchFilter.frequency.setValueAtTime(920, now);
  crunchFilter.frequency.exponentialRampToValueAtTime(340, now + duration);
  crunchFilter.Q.setValueAtTime(2.4, now);

  const crunchGain = ctx.createGain();
  crunchGain.gain.setValueAtTime(0.32 * intensity, now);
  crunchGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

  crunchSource.connect(crunchFilter);
  crunchFilter.connect(crunchGain);
  crunchGain.connect(masterGain || ctx.destination);
  crunchSource.start(now);
}

// ----------------------------------------------------------------------------
// 8. ROCKET COUNTDOWN VOICE, REFUEL PUMP, FLAMEOUT & SEA CRASH AUDIO
// ----------------------------------------------------------------------------
const COUNTDOWN_WORDS: Record<'pt' | 'en', Record<number | 'liftoff', string>> = {
  pt: {
    5: 'Cinco',
    4: 'Quatro',
    3: 'Três',
    2: 'Dois',
    1: 'Um',
    liftoff: 'Descolar!',
  },
  en: {
    5: 'Five',
    4: 'Four',
    3: 'Three',
    2: 'Two',
    1: 'One',
    liftoff: 'Liftoff!',
  },
};

export function playCountdownVoice(step: 5 | 4 | 3 | 2 | 1 | 'liftoff', lang?: 'pt' | 'en') {
  if (!isAudioEnabled) return;
  const activeLang = lang || useGameStore.getState().language || 'pt';

  // 1. Crisp Mission Control Telemetry Beep / Ignition Chime (always audible)
  const ctx = getAudioContext();
  if (ctx) {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = step === 'liftoff' ? 'triangle' : 'sine';
    osc.frequency.setValueAtTime(step === 'liftoff' ? 1180 : 780, now);
    if (step === 'liftoff') {
      osc.frequency.exponentialRampToValueAtTime(1480, now + 0.16);
    }
    gain.gain.setValueAtTime(0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + (step === 'liftoff' ? 0.36 : 0.16));
    osc.connect(gain);
    gain.connect(masterGain || ctx.destination);
    osc.start(now);
    osc.stop(now + (step === 'liftoff' ? 0.36 : 0.16));

    // Add deep liftoff engine roar burst on T-0
    if (step === 'liftoff') {
      const dur = 1.6;
      const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate);
      const ch = buf.getChannelData(0);
      for (let i = 0; i < ch.length; i++) {
        const env = Math.sin(Math.min(1, i / (ctx.sampleRate * 0.25)) * Math.PI * 0.5) * Math.exp(-i / (ctx.sampleRate * 1.1));
        ch[i] = (Math.random() * 2 - 1) * env;
      }
      const src = ctx.createBufferSource();
      src.buffer = buf;
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.setValueAtTime(320, now);
      const rg = ctx.createGain();
      rg.gain.setValueAtTime(0.42, now);
      src.connect(lp);
      lp.connect(rg);
      rg.connect(masterGain || ctx.destination);
      src.start(now);
    }
  }

  // 2. Spoken Countdown Voice (PT or EN) via Web Speech API
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      const synth = window.speechSynthesis;
      synth.cancel();
      const text = COUNTDOWN_WORDS[activeLang][step] || String(step);
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = activeLang === 'en' ? 'en-US' : 'pt-PT';
      utter.rate = step === 'liftoff' ? 1.05 : 1.0;
      utter.pitch = step === 'liftoff' ? 1.08 : 0.94;
      utter.volume = 1.0;
      const voices = synth.getVoices();
      const preferredVoice =
        activeLang === 'en'
          ? voices.find((v) => v.lang.toLowerCase().startsWith('en-us')) ||
            voices.find((v) => v.lang.toLowerCase().startsWith('en'))
          : voices.find((v) => v.lang.toLowerCase().startsWith('pt-pt')) ||
            voices.find((v) => v.lang.toLowerCase().startsWith('pt'));
      if (preferredVoice) utter.voice = preferredVoice;
      synth.speak(utter);
    } catch {
      // Speech synthesis gracefully falls back to telemetry tones if blocked
    }
  }
}

export function playRefuelPumpSound() {
  const ctx = getAudioContext();
  if (!ctx || !isAudioEnabled) return;
  const now = ctx.currentTime;

  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(220, now);
  osc.frequency.linearRampToValueAtTime(310, now + 0.08);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.08, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

  osc.connect(gain);
  gain.connect(masterGain || ctx.destination);
  osc.start(now);
  osc.stop(now + 0.09);
}

export function playRocketFlameoutSound() {
  const ctx = getAudioContext();
  if (!ctx || !isAudioEnabled) return;
  const now = ctx.currentTime;

  // Engine sputter cutoff + descending aerodynamic fall whistle
  const osc = ctx.createOscillator();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(340, now);
  osc.frequency.exponentialRampToValueAtTime(68, now + 1.4);

  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.setValueAtTime(750, now);
  lp.frequency.exponentialRampToValueAtTime(160, now + 1.4);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.24, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 1.45);

  osc.connect(lp);
  lp.connect(gain);
  gain.connect(masterGain || ctx.destination);
  osc.start(now);
  osc.stop(now + 1.45);

  // Caution alarm double-beep
  [0, 0.24].forEach((offset) => {
    const beep = ctx.createOscillator();
    beep.type = 'square';
    beep.frequency.setValueAtTime(620, now + offset);
    const bg = ctx.createGain();
    bg.gain.setValueAtTime(0.12, now + offset);
    bg.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.14);
    beep.connect(bg);
    bg.connect(masterGain || ctx.destination);
    beep.start(now + offset);
    beep.stop(now + offset + 0.14);
  });
}

export function playRocketSeaCrashSound() {
  const ctx = getAudioContext();
  if (!ctx || !isAudioEnabled) return;
  const now = ctx.currentTime;

  // 1. Massive Ocean Impact Boom (Sub-bass water column shockwave)
  const impactOsc = ctx.createOscillator();
  impactOsc.type = 'sine';
  impactOsc.frequency.setValueAtTime(125, now);
  impactOsc.frequency.exponentialRampToValueAtTime(24, now + 0.85);

  const impactGain = ctx.createGain();
  impactGain.gain.setValueAtTime(0.58, now);
  impactGain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);

  impactOsc.connect(impactGain);
  impactGain.connect(masterGain || ctx.destination);
  impactOsc.start(now);
  impactOsc.stop(now + 0.9);

  // 2. Heavy Ocean Splash Spray & Whitewater Surge (2.2s sculpted noise envelope)
  const duration = 2.2;
  const bufSize = Math.floor(ctx.sampleRate * duration);
  const buffer = ctx.createBuffer(1, bufSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufSize; i++) {
    const t = i / ctx.sampleRate;
    const attack = Math.min(1, t / 0.03);
    const decay = Math.exp(-t / 0.65);
    data[i] = (Math.random() * 2 - 1) * attack * decay;
  }

  const splashSource = ctx.createBufferSource();
  splashSource.buffer = buffer;

  const splashFilter = ctx.createBiquadFilter();
  splashFilter.type = 'bandpass';
  splashFilter.frequency.setValueAtTime(1450, now);
  splashFilter.frequency.exponentialRampToValueAtTime(280, now + duration);
  splashFilter.Q.setValueAtTime(0.85, now);

  const splashGain = ctx.createGain();
  splashGain.gain.setValueAtTime(0.55, now);
  splashGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

  splashSource.connect(splashFilter);
  splashFilter.connect(splashGain);
  splashGain.connect(masterGain || ctx.destination);
  splashSource.start(now);

  // 3. Spoken warning in Portuguese or English
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      const activeLang = useGameStore.getState().language || 'pt';
      const synth = window.speechSynthesis;
      synth.cancel();
      const utter = new SpeechSynthesisUtterance(
        activeLang === 'en'
          ? 'Fuel failure! Rocket crashed into the ocean!'
          : 'Falha de combustível! Foguete caiu no mar!'
      );
      utter.lang = activeLang === 'en' ? 'en-US' : 'pt-PT';
      utter.rate = 1.05;
      utter.pitch = 0.95;
      utter.volume = 0.95;
      const voices = synth.getVoices();
      const preferredVoice =
        activeLang === 'en'
          ? voices.find((v) => v.lang.toLowerCase().startsWith('en-us')) ||
            voices.find((v) => v.lang.toLowerCase().startsWith('en'))
          : voices.find((v) => v.lang.toLowerCase().startsWith('pt-pt')) ||
            voices.find((v) => v.lang.toLowerCase().startsWith('pt'));
      if (preferredVoice) utter.voice = preferredVoice;
      synth.speak(utter);
    } catch {
      // Fallback already covered by Web Audio splash/impact
    }
  }
}

export function playAstronautDeathSound() {
  const ctx = getAudioContext();
  if (!ctx || !isAudioEnabled) return;
  const now = ctx.currentTime;

  // Suit depressurization hiss + falling life-support flatline chime
  const dur = 1.4;
  const bufSize = Math.floor(ctx.sampleRate * dur);
  const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < bufSize; i++) {
    const t = i / ctx.sampleRate;
    data[i] = (Math.random() * 2 - 1) * Math.exp(-t / 0.45);
  }
  const noise = ctx.createBufferSource();
  noise.buffer = buf;
  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.setValueAtTime(1600, now);
  bp.frequency.exponentialRampToValueAtTime(240, now + dur);
  const ng = ctx.createGain();
  ng.gain.setValueAtTime(0.32, now);
  ng.gain.exponentialRampToValueAtTime(0.001, now + dur);
  noise.connect(bp);
  bp.connect(ng);
  ng.connect(masterGain || ctx.destination);
  noise.start(now);

  // Descending alarm tones + heavy body impact thump
  [0, 0.32, 0.64].forEach((offset, idx) => {
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(520 - idx * 95, now + offset);
    osc.frequency.exponentialRampToValueAtTime(220 - idx * 45, now + offset + 0.24);
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(900, now + offset);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.18, now + offset);
    g.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.26);
    osc.connect(lp);
    lp.connect(g);
    g.connect(masterGain || ctx.destination);
    osc.start(now + offset);
    osc.stop(now + offset + 0.26);
  });

  // Suit surface fall thud at ~0.55s
  const thud = ctx.createOscillator();
  thud.type = 'triangle';
  thud.frequency.setValueAtTime(105, now + 0.55);
  thud.frequency.exponentialRampToValueAtTime(32, now + 0.85);
  const tg = ctx.createGain();
  tg.gain.setValueAtTime(0.001, now);
  tg.gain.setValueAtTime(0.36, now + 0.55);
  tg.gain.exponentialRampToValueAtTime(0.001, now + 0.88);
  thud.connect(tg);
  tg.connect(masterGain || ctx.destination);
  thud.start(now + 0.55);
  thud.stop(now + 0.88);
}

export function playSolarEvaporationSound() {
  const ctx = getAudioContext();
  if (!ctx || !isAudioEnabled) return;
  const now = ctx.currentTime;

  // Intense solar plasma thermal roar & vaporization sizzle
  const dur = 1.8;
  const bufSize = Math.floor(ctx.sampleRate * dur);
  const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < bufSize; i++) {
    const t = i / ctx.sampleRate;
    const env = Math.sin(Math.min(1, t / 0.25) * Math.PI * 0.5) * Math.exp(-Math.max(0, t - 0.5) / 0.6);
    data[i] = (Math.random() * 2 - 1) * env;
  }
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.setValueAtTime(420, now);
  bp.frequency.exponentialRampToValueAtTime(2400, now + 0.7);
  bp.frequency.exponentialRampToValueAtTime(360, now + dur);
  bp.Q.setValueAtTime(1.1, now);
  const ng = ctx.createGain();
  ng.gain.setValueAtTime(0.45, now);
  ng.gain.exponentialRampToValueAtTime(0.001, now + dur);
  src.connect(bp);
  bp.connect(ng);
  ng.connect(masterGain || ctx.destination);
  src.start(now);

  // Sub-harmonic solar flare rumble
  const osc = ctx.createOscillator();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(95, now);
  osc.frequency.exponentialRampToValueAtTime(320, now + 0.65);
  osc.frequency.exponentialRampToValueAtTime(48, now + dur);
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.setValueAtTime(460, now);
  const og = ctx.createGain();
  og.gain.setValueAtTime(0.28, now);
  og.gain.exponentialRampToValueAtTime(0.001, now + dur);
  osc.connect(lp);
  lp.connect(og);
  og.connect(masterGain || ctx.destination);
  osc.start(now);
  osc.stop(now + dur);
}

export function stopMissionVoice() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      // Ignore speech cancellation error
    }
  }
}

export function speakMissionTip(text: string, lang?: 'pt' | 'en') {
  if (!isAudioEnabled || !text) return;
  const activeLang = lang || useGameStore.getState().language || 'pt';

  // Subtle Mission Control radio squelch chime before spoken mission tip
  const ctx = getAudioContext();
  if (ctx) {
    const now = ctx.currentTime;
    [940, 1280].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.08);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.08, now + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.09);
      osc.connect(gain);
      gain.connect(masterGain || ctx.destination);
      osc.start(now + i * 0.08);
      osc.stop(now + i * 0.08 + 0.09);
    });
  }

  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      const synth = window.speechSynthesis;
      synth.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = activeLang === 'en' ? 'en-US' : 'pt-PT';
      utter.rate = 0.98;
      utter.pitch = 1.0;
      utter.volume = 1.0;
      const voices = synth.getVoices();
      const preferredVoice =
        activeLang === 'en'
          ? voices.find((v) => v.lang.toLowerCase().startsWith('en-us')) ||
            voices.find((v) => v.lang.toLowerCase().startsWith('en-gb')) ||
            voices.find((v) => v.lang.toLowerCase().startsWith('en'))
          : voices.find((v) => v.lang.toLowerCase().startsWith('pt-pt')) ||
            voices.find((v) => v.lang.toLowerCase().startsWith('pt'));
      if (preferredVoice) utter.voice = preferredVoice;
      synth.speak(utter);
    } catch {
      // Speech synthesis gracefully falls back to visual HUD tip
    }
  }
}

export function playSuitEquipSound() {
  const ctx = getAudioContext();
  if (!ctx || !isAudioEnabled) return;
  const now = ctx.currentTime;

  // Metallic neck-ring lock click + brief suit pressurization hiss
  [0, 0.14].forEach((offset, idx) => {
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(idx === 0 ? 460 : 680, now + offset);
    osc.frequency.exponentialRampToValueAtTime(idx === 0 ? 220 : 340, now + offset + 0.07);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.24, now + offset);
    g.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.08);
    osc.connect(g);
    g.connect(masterGain || ctx.destination);
    osc.start(now + offset);
    osc.stop(now + offset + 0.08);
  });

  const dur = 0.45;
  const bufSize = Math.floor(ctx.sampleRate * dur);
  const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
  const ch = buf.getChannelData(0);
  for (let i = 0; i < bufSize; i++) {
    const t = i / ctx.sampleRate;
    ch[i] = (Math.random() * 2 - 1) * Math.exp(-t / 0.16);
  }
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.setValueAtTime(1900, now + 0.18);
  const ng = ctx.createGain();
  ng.gain.setValueAtTime(0.16, now + 0.18);
  ng.gain.exponentialRampToValueAtTime(0.001, now + 0.18 + dur);
  src.connect(bp);
  bp.connect(ng);
  ng.connect(masterGain || ctx.destination);
  src.start(now + 0.18);
}

export function playFlagPlantSound() {
  const ctx = getAudioContext();
  if (!ctx || !isAudioEnabled) return;
  const now = ctx.currentTime;

  // Heavy anchor impact into lunar regolith + triumphant Mission Accomplished chord
  const impact = ctx.createOscillator();
  impact.type = 'sine';
  impact.frequency.setValueAtTime(140, now);
  impact.frequency.exponentialRampToValueAtTime(38, now + 0.25);
  const ig = ctx.createGain();
  ig.gain.setValueAtTime(0.36, now);
  ig.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
  impact.connect(ig);
  ig.connect(masterGain || ctx.destination);
  impact.start(now);
  impact.stop(now + 0.28);

  [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, now + 0.18 + idx * 0.09);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.16, now + 0.18 + idx * 0.09);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.95 + idx * 0.09);
    osc.connect(g);
    g.connect(masterGain || ctx.destination);
    osc.start(now + 0.18 + idx * 0.09);
    osc.stop(now + 0.98 + idx * 0.09);
  });
}

export function updateAudio(isHostile?: boolean, gravity?: number) {
  // Spatial and environmental audio is dynamically managed via updateSpatialAudio & setAudioEnvironment
}
