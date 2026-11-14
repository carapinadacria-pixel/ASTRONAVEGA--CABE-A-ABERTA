import { useGameStore } from './store';

// ============================================================================
// PROCEDURAL + ORCHESTRAL AUDIO ENGINE
// ============================================================================

let audioCtx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let sfxGain: GainNode | null = null;
let presenceSfxGain: GainNode | null = null;
let isAudioEnabled = true;
let musicVolume = 0.85;
let sfxVolume = 0.05;

const MP3_TRACK_SRCS: Partial<Record<MusicMode, string>> = {
  beethoven_op68: '/assets/aistudio/Ludwig_Van_Beethoven__Symphony_No._5__Op._68_39cc117a.mp3',
  epic: '/assets/aistudio/Beethoven__Symphony_No._9_in_D_Minor__Op._125__Choral___II._Scherzo._Molto_vivace___Presto_2_61786a6e.mp3',
  tactical: '/assets/aistudio/Drill_No_Duro_2_28525b67.mp3',
};
let mp3Audio: HTMLAudioElement | null = null;
let activeMp3Src: string | null = null;

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

// Hybrid Music Engine (Real MP3 Tracks: Beethoven Op.68 / Op.125 / Drill + Procedural Orbital)
export type MusicMode = 'silent' | 'beethoven_op68' | 'epic' | 'orbital' | 'tactical';
let musicGain: GainNode | null = null;
let currentMusicMode: MusicMode = 'silent';
let musicTimerId: number | null = null;
let musicStepIndex = 0;
let activeDroneNodes: { stop: () => void }[] = [];

// Continuous Rocket Propulsion & Liftoff Roar Nodes
let rocketMasterGain: GainNode | null = null;
let rocketSubOsc1: OscillatorNode | null = null;
let rocketSubOsc2: OscillatorNode | null = null;
let rocketSubFilter: BiquadFilterNode | null = null;
let rocketTurbopumpOsc: OscillatorNode | null = null;
let rocketTurbopumpGain: GainNode | null = null;
let rocketRoarFilter: BiquadFilterNode | null = null;
let rocketRoarGain: GainNode | null = null;
let rocketCrackleFilter: BiquadFilterNode | null = null;
let rocketCrackleGain: GainNode | null = null;

// Footstep cadence timing & alternating left/right stride pitch variation
let lastFootstepTime = 0;
let footstepAlternate = false;

function getTargetMusicBusVol(mode: MusicMode): number {
  if (mode !== 'orbital') return 0.0;
  return 0.30;
}

function getPresenceSfxBusGain(vol: number): number {
  if (vol <= 0.001) return 0.0;
  // Keeps footsteps and rocket launch crisp and clearly audible even at the 5% SFX default
  return Math.min(1.0, 0.36 + vol * 0.64);
}

function getSfxOutput(ctx: AudioContext): AudioNode {
  return sfxGain || masterGain || ctx.destination;
}

function getPresenceSfxOutput(ctx: AudioContext): AudioNode {
  return presenceSfxGain || sfxGain || masterGain || ctx.destination;
}

function syncMp3MusicTrack() {
  if (typeof window === 'undefined' || typeof Audio === 'undefined') return;
  const targetSrc = MP3_TRACK_SRCS[currentMusicMode];
  const shouldPlay = Boolean(targetSrc) && isAudioEnabled;

  if (!shouldPlay || !targetSrc) {
    if (mp3Audio) {
      try {
        mp3Audio.pause();
        mp3Audio.currentTime = 0;
      } catch {
        // Ignore pause errors
      }
    }
    return;
  }

  if (!mp3Audio) {
    mp3Audio = new Audio(targetSrc);
    mp3Audio.loop = true;
    mp3Audio.preload = 'auto';
    activeMp3Src = targetSrc;
  } else if (activeMp3Src !== targetSrc) {
    try {
      mp3Audio.pause();
    } catch {
      // Ignore pause errors
    }
    mp3Audio.src = targetSrc;
    mp3Audio.currentTime = 0;
    mp3Audio.loop = true;
    activeMp3Src = targetSrc;
  }

  mp3Audio.volume = Math.max(0, Math.min(1, musicVolume * 0.78));
  if (mp3Audio.paused) {
    const p = mp3Audio.play();
    if (p && typeof p.catch === 'function') {
      p.catch(() => {
        // Browser autoplay blocked until user gesture
      });
    }
  }
}

export function setMusicVolumeLevel(vol: number) {
  musicVolume = Math.max(0, Math.min(1, vol));
  if (mp3Audio) {
    mp3Audio.volume = Math.max(0, Math.min(1, musicVolume * 0.78));
  }
  if (musicGain && audioCtx) {
    musicGain.gain.setTargetAtTime(getTargetMusicBusVol(currentMusicMode) * musicVolume, audioCtx.currentTime, 0.05);
  }
}

export function setSfxVolumeLevel(vol: number) {
  sfxVolume = Math.max(0, Math.min(1, vol));
  if (sfxGain && audioCtx) {
    sfxGain.gain.setTargetAtTime(sfxVolume, audioCtx.currentTime, 0.05);
  }
  if (presenceSfxGain && audioCtx) {
    presenceSfxGain.gain.setTargetAtTime(getPresenceSfxBusGain(sfxVolume), audioCtx.currentTime, 0.05);
  }
}

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

  // Dedicated SFX & Ambience Bus Gain
  sfxGain = ctx.createGain();
  sfxGain.gain.setValueAtTime(sfxVolume, now);
  sfxGain.connect(masterGain);

  // Dedicated Presence Bus for Footsteps, Running & Rocket Liftoff (clear even at 5% SFX)
  presenceSfxGain = ctx.createGain();
  presenceSfxGain.gain.setValueAtTime(getPresenceSfxBusGain(sfxVolume), now);
  presenceSfxGain.connect(masterGain);

  // Dedicated Music Bus Gain (connects through masterGain so global mute respects music)
  musicGain = ctx.createGain();
  musicGain.gain.setValueAtTime(getTargetMusicBusVol(currentMusicMode) * musicVolume, now);
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
  natureGain.connect(sfxGain);
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
  oceanGain.connect(sfxGain);
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
  machineGain.connect(sfxGain);
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
  spaceGain.connect(sfxGain);
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
  carEngineGain.connect(sfxGain);
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
  carTireGain.connect(sfxGain);
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
  carBrakeGain.connect(sfxGain);
  brakeNoiseSrc.start();

  // --- F. CONTINUOUS ROCKET ENGINE PRE-IGNITION & LIFTOFF THRUST SYNTHESIS ---
  rocketMasterGain = ctx.createGain();
  rocketMasterGain.gain.setValueAtTime(0.0, now);
  rocketMasterGain.connect(presenceSfxGain);

  // 1. Deep Saturn-class Dual Sub-Bass Chamber Rumble
  rocketSubOsc1 = ctx.createOscillator();
  rocketSubOsc1.type = 'sawtooth';
  rocketSubOsc1.frequency.setValueAtTime(38, now);

  rocketSubOsc2 = ctx.createOscillator();
  rocketSubOsc2.type = 'triangle';
  rocketSubOsc2.frequency.setValueAtTime(57, now);

  rocketSubFilter = ctx.createBiquadFilter();
  rocketSubFilter.type = 'lowpass';
  rocketSubFilter.frequency.setValueAtTime(105, now);
  rocketSubFilter.Q.setValueAtTime(1.4, now);

  const rocketSubGain = ctx.createGain();
  rocketSubGain.gain.setValueAtTime(0.55, now);

  rocketSubOsc1.connect(rocketSubFilter);
  rocketSubOsc2.connect(rocketSubFilter);
  rocketSubFilter.connect(rocketSubGain);
  rocketSubGain.connect(rocketMasterGain);
  rocketSubOsc1.start();
  rocketSubOsc2.start();

  // 2. Cryogenic Turbopump Spool-Up Harmonic
  rocketTurbopumpOsc = ctx.createOscillator();
  rocketTurbopumpOsc.type = 'sawtooth';
  rocketTurbopumpOsc.frequency.setValueAtTime(135, now);

  const turbopumpBand = ctx.createBiquadFilter();
  turbopumpBand.type = 'bandpass';
  turbopumpBand.frequency.setValueAtTime(580, now);
  turbopumpBand.Q.setValueAtTime(2.6, now);

  rocketTurbopumpGain = ctx.createGain();
  rocketTurbopumpGain.gain.setValueAtTime(0.0, now);

  rocketTurbopumpOsc.connect(turbopumpBand);
  turbopumpBand.connect(rocketTurbopumpGain);
  rocketTurbopumpGain.connect(rocketMasterGain);
  rocketTurbopumpOsc.start();

  // 3. Thunderous Exhaust Jet Plume Roar
  const rocketRoarSrc = ctx.createBufferSource();
  rocketRoarSrc.buffer = noiseBuffer;
  rocketRoarSrc.loop = true;

  rocketRoarFilter = ctx.createBiquadFilter();
  rocketRoarFilter.type = 'lowpass';
  rocketRoarFilter.frequency.setValueAtTime(380, now);
  rocketRoarFilter.Q.setValueAtTime(0.9, now);

  const roarLfo = ctx.createOscillator();
  roarLfo.frequency.setValueAtTime(6.5, now);
  const roarLfoGain = ctx.createGain();
  roarLfoGain.gain.setValueAtTime(110, now);
  roarLfo.connect(roarLfoGain);
  roarLfoGain.connect(rocketRoarFilter.frequency);
  roarLfo.start();

  rocketRoarGain = ctx.createGain();
  rocketRoarGain.gain.setValueAtTime(0.82, now);

  rocketRoarSrc.connect(rocketRoarFilter);
  rocketRoarFilter.connect(rocketRoarGain);
  rocketRoarGain.connect(rocketMasterGain);
  rocketRoarSrc.start();

  // 4. Supersonic Exhaust Acoustic Crackle (signature rocket liftoff crackle)
  const rocketCrackleSrc = ctx.createBufferSource();
  rocketCrackleSrc.buffer = noiseBuffer;
  rocketCrackleSrc.loop = true;
  rocketCrackleSrc.playbackRate.setValueAtTime(1.45, now);

  rocketCrackleFilter = ctx.createBiquadFilter();
  rocketCrackleFilter.type = 'bandpass';
  rocketCrackleFilter.frequency.setValueAtTime(2450, now);
  rocketCrackleFilter.Q.setValueAtTime(1.15, now);

  rocketCrackleGain = ctx.createGain();
  rocketCrackleGain.gain.setValueAtTime(0.0, now);

  const crackleModOsc = ctx.createOscillator();
  crackleModOsc.type = 'square';
  crackleModOsc.frequency.setValueAtTime(21, now);
  const crackleModGain = ctx.createGain();
  crackleModGain.gain.setValueAtTime(0.18, now);
  crackleModOsc.connect(crackleModGain);
  crackleModGain.connect(rocketCrackleGain.gain);
  crackleModOsc.start();

  rocketCrackleSrc.connect(rocketCrackleFilter);
  rocketCrackleFilter.connect(rocketCrackleGain);
  rocketCrackleGain.connect(rocketMasterGain);
  rocketCrackleSrc.start();
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
    if (rocketMasterGain) rocketMasterGain.gain.setTargetAtTime(0.0, now, 0.04);
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

export function updateRocketLaunchAudio(
  active: boolean,
  phase: 'idle' | 'preignition' | 'liftoff' | 'planetary',
  intensity = 1.0
) {
  const ctx = getAudioContext();
  if (!ctx) return;
  if (active && !ambientStarted) {
    startProceduralAmbience(ctx);
  }
  if (!ambientStarted || !rocketMasterGain) return;

  const now = ctx.currentTime;
  if (!active || phase === 'idle' || !isAudioEnabled) {
    rocketMasterGain.gain.setTargetAtTime(0.0, now, 0.09);
    return;
  }

  const clamped = Math.max(0.15, Math.min(1.0, intensity));

  if (phase === 'preignition') {
    // Spooling cryogenic turbopumps & growing ignition flame trench roar (T-2.2s -> T-0)
    const spool = clamped;
    rocketMasterGain.gain.setTargetAtTime(0.18 + spool * 0.44, now, 0.08);
    if (rocketSubOsc1) rocketSubOsc1.frequency.setTargetAtTime(34 + spool * 10, now, 0.08);
    if (rocketSubOsc2) rocketSubOsc2.frequency.setTargetAtTime(51 + spool * 15, now, 0.08);
    if (rocketSubFilter) rocketSubFilter.frequency.setTargetAtTime(85 + spool * 95, now, 0.08);
    if (rocketTurbopumpOsc) rocketTurbopumpOsc.frequency.setTargetAtTime(115 + spool * 95, now, 0.08);
    if (rocketTurbopumpGain) rocketTurbopumpGain.gain.setTargetAtTime(0.08 + spool * 0.14, now, 0.06);
    if (rocketRoarFilter) rocketRoarFilter.frequency.setTargetAtTime(220 + spool * 580, now, 0.08);
    if (rocketRoarGain) rocketRoarGain.gain.setTargetAtTime(0.55 + spool * 0.35, now, 0.08);
    if (rocketCrackleFilter) rocketCrackleFilter.frequency.setTargetAtTime(1950 + spool * 600, now, 0.08);
    if (rocketCrackleGain) rocketCrackleGain.gain.setTargetAtTime(0.08 + spool * 0.22, now, 0.08);
  } else if (phase === 'liftoff') {
    // Full Saturn V / heavy booster liftoff roar + supersonic shockwave crackle
    rocketMasterGain.gain.setTargetAtTime(0.72 * clamped + 0.22, now, 0.07);
    if (rocketSubOsc1) rocketSubOsc1.frequency.setTargetAtTime(41 + (1 - clamped) * 8, now, 0.1);
    if (rocketSubOsc2) rocketSubOsc2.frequency.setTargetAtTime(62 + (1 - clamped) * 12, now, 0.1);
    if (rocketSubFilter) rocketSubFilter.frequency.setTargetAtTime(135 + clamped * 55, now, 0.1);
    if (rocketTurbopumpOsc) rocketTurbopumpOsc.frequency.setTargetAtTime(185, now, 0.12);
    if (rocketTurbopumpGain) rocketTurbopumpGain.gain.setTargetAtTime(0.07 * clamped, now, 0.12);
    if (rocketRoarFilter) rocketRoarFilter.frequency.setTargetAtTime(520 + clamped * 920, now, 0.12);
    if (rocketRoarGain) rocketRoarGain.gain.setTargetAtTime(0.95, now, 0.08);
    if (rocketCrackleFilter) rocketCrackleFilter.frequency.setTargetAtTime(2550 + clamped * 850, now, 0.1);
    if (rocketCrackleGain) rocketCrackleGain.gain.setTargetAtTime(0.32 * clamped, now, 0.08);
  } else {
    // Planetary capsule ascent thruster burn (tighter cryogenic roar)
    rocketMasterGain.gain.setTargetAtTime(0.58 * clamped + 0.16, now, 0.08);
    if (rocketSubOsc1) rocketSubOsc1.frequency.setTargetAtTime(48, now, 0.08);
    if (rocketSubOsc2) rocketSubOsc2.frequency.setTargetAtTime(72, now, 0.08);
    if (rocketSubFilter) rocketSubFilter.frequency.setTargetAtTime(160, now, 0.08);
    if (rocketTurbopumpOsc) rocketTurbopumpOsc.frequency.setTargetAtTime(215, now, 0.1);
    if (rocketTurbopumpGain) rocketTurbopumpGain.gain.setTargetAtTime(0.11, now, 0.08);
    if (rocketRoarFilter) rocketRoarFilter.frequency.setTargetAtTime(680 + clamped * 640, now, 0.1);
    if (rocketRoarGain) rocketRoarGain.gain.setTargetAtTime(0.84, now, 0.08);
    if (rocketCrackleFilter) rocketCrackleFilter.frequency.setTargetAtTime(2200, now, 0.1);
    if (rocketCrackleGain) rocketCrackleGain.gain.setTargetAtTime(0.18 * clamped, now, 0.08);
  }
}

export function stopRocketLaunchAudio() {
  if (!audioCtx || !rocketMasterGain) return;
  rocketMasterGain.gain.setTargetAtTime(0.0, audioCtx.currentTime, 0.06);
}

// ----------------------------------------------------------------------------
// 2. SPATIAL POSITION & ENVIRONMENT AUDIO UPDATES (useFrame reactive)
// ----------------------------------------------------------------------------
export function updateSpatialAudio(
  playerPos: [number, number, number],
  isMoving: boolean,
  speed: number,
  isGrounded: boolean,
  inWater: boolean,
  isSprintingParam?: boolean
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
    const isRunning = isSprintingParam !== undefined ? isSprintingParam && speed > 2.0 : speed > 8.5;
    const interval = inWater ? (isRunning ? 0.34 : 0.54) : isRunning ? 0.255 : 0.475;

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
// 3. CAMINHADA & CORRIDA REALISTA (Heel-to-Toe Gait + Terrain Grit + Gear)
// ----------------------------------------------------------------------------
export function playFootstepSound(surface: 'grass' | 'sand' | 'metal', isRunning: boolean) {
  const ctx = getAudioContext();
  if (!ctx || !isAudioEnabled) return;
  if (!ambientStarted) startProceduralAmbience(ctx);
  const now = ctx.currentTime;
  const out = getPresenceSfxOutput(ctx);

  const st = useGameStore.getState();
  const wearingSuit = st.gameMode === 'exploration' || st.hasSpacesuit;

  footstepAlternate = !footstepAlternate;
  const jitter = 0.96 + Math.random() * 0.08;
  const stridePitch = (footstepAlternate ? 1.04 : 0.96) * jitter;
  const strideGain = (footstepAlternate ? 1.0 : 0.92) * (0.93 + Math.random() * 0.12);
  const runBoost = isRunning ? 1.42 : 1.0;

  // Helper to spawn sculpted textured noise bursts for heel strike, toe roll & terrain crunch
  const triggerNoiseLayer = (
    delaySec: number,
    durSec: number,
    attackSec: number,
    decaySec: number,
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
    // Pink-weighted grain noise with sharp organic attack + natural decay
    let p0 = 0;
    let p1 = 0;
    for (let i = 0; i < len; i++) {
      const t = i / ctx.sampleRate;
      const white = Math.random() * 2 - 1;
      p0 = 0.95 * p0 + white * 0.22;
      p1 = 0.72 * p1 + white * 0.35;
      const grain = p0 * 0.55 + p1 * 0.45;
      const atk = Math.min(1, t / Math.max(0.002, attackSec));
      const dec = Math.exp(-t / Math.max(0.008, decaySec));
      ch[i] = grain * atk * dec;
    }

    const src = ctx.createBufferSource();
    src.buffer = buf;

    const flt = ctx.createBiquadFilter();
    flt.type = filterType;
    flt.frequency.setValueAtTime(freqStart, startAt);
    if (freqEnd !== freqStart) {
      flt.frequency.exponentialRampToValueAtTime(Math.max(40, freqEnd), startAt + durSec);
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

  // PHASE 1: Heel Strike Low-End Boot Sole Weight (damped ground thud, stronger & punchier on sprint)
  const heelOsc = ctx.createOscillator();
  heelOsc.type = 'triangle';
  const startFreq = (surface === 'metal' ? (isRunning ? 148 : 112) : surface === 'sand' ? 92 : 84) * stridePitch;
  const endFreq = surface === 'metal' ? 46 : surface === 'sand' ? 34 : 31;
  const heelDur = isRunning ? 0.062 : 0.088;
  heelOsc.frequency.setValueAtTime(startFreq, now);
  heelOsc.frequency.exponentialRampToValueAtTime(endFreq, now + heelDur);

  const heelFilter = ctx.createBiquadFilter();
  heelFilter.type = 'lowpass';
  heelFilter.frequency.setValueAtTime(surface === 'metal' ? 320 : 195, now);

  const heelGain = ctx.createGain();
  const baseHeel =
    (surface === 'metal' ? 0.34 : surface === 'sand' ? 0.25 : 0.22) *
    (wearingSuit ? 1.08 : 0.9) *
    runBoost;
  heelGain.gain.setValueAtTime(baseHeel * strideGain, now);
  heelGain.gain.exponentialRampToValueAtTime(0.001, now + heelDur);

  heelOsc.connect(heelFilter);
  heelFilter.connect(heelGain);
  heelGain.connect(out);
  heelOsc.start(now);
  heelOsc.stop(now + heelDur);

  // PHASE 2: Surface-Authentic Heel-to-Toe Texture
  if (surface === 'sand') {
    // Crunchy granular heel compression followed by forefoot sand/regolith push-off
    triggerNoiseLayer(0.0, 0.09, 0.006, 0.032, 'bandpass', 620 * stridePitch, 390 * stridePitch, 1.1, (isRunning ? 0.34 : 0.22));
    triggerNoiseLayer(isRunning ? 0.024 : 0.056, 0.085, 0.008, 0.028, 'bandpass', 1420 * stridePitch, 920 * stridePitch, 1.4, (isRunning ? 0.28 : 0.16));
    if (isRunning) {
      // High-velocity grit spray on sprint push-off
      triggerNoiseLayer(0.038, 0.07, 0.005, 0.022, 'highpass', 2350 * stridePitch, 1800 * stridePitch, 0.8, 0.14);
    }
  } else if (surface === 'metal') {
    // Crisp solid rubber-sole slap on Hangar / Launchpad floor + short steel/concrete floor body
    triggerNoiseLayer(0.0, 0.052, 0.003, 0.016, 'bandpass', (isRunning ? 1580 : 1120) * stridePitch, 620 * stridePitch, 1.9, (isRunning ? 0.38 : 0.24));
    // Toe tap roll for natural two-step walking cadence
    triggerNoiseLayer(isRunning ? 0.024 : 0.055, 0.045, 0.004, 0.014, 'bandpass', (isRunning ? 1950 : 1480) * stridePitch, 880 * stridePitch, 1.7, (isRunning ? 0.26 : 0.15));

    // Subtle damped metallic floor resonance (never ringing like a bell)
    const deckOsc = ctx.createOscillator();
    deckOsc.type = 'sine';
    deckOsc.frequency.setValueAtTime(192 * stridePitch, now);
    deckOsc.frequency.exponentialRampToValueAtTime(118 * stridePitch, now + 0.05);
    const deckGain = ctx.createGain();
    deckGain.gain.setValueAtTime((isRunning ? 0.11 : 0.065) * strideGain, now);
    deckGain.gain.exponentialRampToValueAtTime(0.001, now + 0.055);
    deckOsc.connect(deckGain);
    deckGain.connect(out);
    deckOsc.start(now);
    deckOsc.stop(now + 0.058);
  } else {
    // Earth grass & coastal turf: soft soil compression + dry blade rustle on toe push-off
    triggerNoiseLayer(0.0, 0.095, 0.008, 0.036, 'lowpass', (isRunning ? 880 : 640) * stridePitch, 320 * stridePitch, 0.9, (isRunning ? 0.30 : 0.19));
    triggerNoiseLayer(isRunning ? 0.026 : 0.058, 0.08, 0.01, 0.03, 'bandpass', 1750 * stridePitch, 1150 * stridePitch, 1.1, (isRunning ? 0.21 : 0.12));
  }

  // PHASE 3: Gear / Beta-Cloth Suit Flex & Sprint Effort Rush
  if (wearingSuit || isRunning) {
    triggerNoiseLayer(
      0.01,
      isRunning ? 0.11 : 0.14,
      0.015,
      isRunning ? 0.045 : 0.06,
      'bandpass',
      (isRunning ? 740 : 540) * stridePitch,
      (isRunning ? 1180 : 780) * stridePitch,
      1.2,
      isRunning ? (wearingSuit ? 0.13 : 0.09) : 0.055
    );
  }
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
  gain.connect(getSfxOutput(ctx));
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
  gain.connect(getSfxOutput(ctx));
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
  oscGain.connect(getSfxOutput(ctx));
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
  noiseGain.connect(getSfxOutput(ctx));
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
  gain.connect(getSfxOutput(ctx));
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
  noiseGain.connect(getSfxOutput(ctx));
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
  motorGain.connect(getSfxOutput(ctx));
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
  motorGain.connect(getSfxOutput(ctx));
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
  subGain.connect(getSfxOutput(ctx));
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
  if (mode !== 'orbital') return;
  const ctx = getAudioContext();
  if (!ctx) return;
  if (!ambientStarted) {
    startProceduralAmbience(ctx);
  }
  if (!musicGain) return;

  const now = ctx.currentTime;
  const targetBusVol = getTargetMusicBusVol(mode) * musicVolume;
  musicGain.gain.setTargetAtTime(targetBusVol, now, 0.25);
  musicStepIndex = 0;

  // Continuous low harmonic bed drone for Orbital Drift
  const droneOsc = ctx.createOscillator();
  const droneFilter = ctx.createBiquadFilter();
  const droneGain = ctx.createGain();
  droneOsc.type = 'triangle';
  droneOsc.frequency.setValueAtTime(82.41, now);
  droneFilter.type = 'lowpass';
  droneFilter.frequency.setValueAtTime(180, now);
  droneGain.gain.setValueAtTime(0.001, now);
  droneGain.gain.linearRampToValueAtTime(0.14, now + 0.8);
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

  const stepMs = 430;

  const tickStep = () => {
    if (!audioCtx || audioCtx.state !== 'running' || currentMusicMode !== mode) return;
    const step = musicStepIndex % 16;
    musicStepIndex += 1;

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
  };

  tickStep();
  musicTimerId = window.setInterval(tickStep, stepMs);
}

export function setMusicMode(mode: MusicMode) {
  const modeChanged = currentMusicMode !== mode;
  currentMusicMode = mode;

  if (mode === 'silent' || MP3_TRACK_SRCS[mode]) {
    stopMusicSequencer(true);
    syncMp3MusicTrack();
    return;
  }

  // Switching to procedural orbital track stops any playing MP3
  syncMp3MusicTrack();

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
  if (MP3_TRACK_SRCS[currentMusicMode]) {
    syncMp3MusicTrack();
  }
  const ctx = getAudioContext();
  if (!ctx) return;
  startProceduralAmbience(ctx);
  if (currentMusicMode === 'orbital' && musicTimerId === null && ctx.state === 'running') {
    startMusicSequencerForMode('orbital');
  } else if (currentMusicMode === 'orbital' && ctx.state === 'suspended') {
    ctx.resume().then(() => {
      if (currentMusicMode === 'orbital' && musicTimerId === null) {
        startMusicSequencerForMode('orbital');
      }
    }).catch(() => {});
  }
}

export function toggleAudio(): boolean {
  isAudioEnabled = !isAudioEnabled;
  if (masterGain && audioCtx) {
    masterGain.gain.setTargetAtTime(isAudioEnabled ? 1.0 : 0.0, audioCtx.currentTime, 0.05);
  }
  syncMp3MusicTrack();
  if (isAudioEnabled) {
    const ctx = getAudioContext();
    if (ctx && !ambientStarted) startProceduralAmbience(ctx);
    if (currentMusicMode === 'orbital' && musicTimerId === null) {
      startMusicSequencerForMode('orbital');
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
  thudGain.connect(getSfxOutput(ctx));
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
  crunchGain.connect(getSfxOutput(ctx));
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
    gain.connect(getSfxOutput(ctx));
    osc.start(now);
    osc.stop(now + (step === 'liftoff' ? 0.36 : 0.16));

    // Add mechanical hold-down clamp release clank + initial T-0 exhaust shockwave burst
    if (step === 'liftoff') {
      const clampOsc = ctx.createOscillator();
      clampOsc.type = 'square';
      clampOsc.frequency.setValueAtTime(165, now);
      clampOsc.frequency.exponentialRampToValueAtTime(48, now + 0.18);
      const clampGain = ctx.createGain();
      clampGain.gain.setValueAtTime(0.32, now);
      clampGain.gain.exponentialRampToValueAtTime(0.001, now + 0.19);
      clampOsc.connect(clampGain);
      clampGain.connect(getPresenceSfxOutput(ctx));
      clampOsc.start(now);
      clampOsc.stop(now + 0.2);

      const dur = 0.85;
      const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate);
      const ch = buf.getChannelData(0);
      for (let i = 0; i < ch.length; i++) {
        const env = Math.sin(Math.min(1, i / (ctx.sampleRate * 0.04)) * Math.PI * 0.5) * Math.exp(-i / (ctx.sampleRate * 0.45));
        ch[i] = (Math.random() * 2 - 1) * env;
      }
      const src = ctx.createBufferSource();
      src.buffer = buf;
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.setValueAtTime(540, now);
      const rg = ctx.createGain();
      rg.gain.setValueAtTime(0.55, now);
      src.connect(lp);
      lp.connect(rg);
      rg.connect(getPresenceSfxOutput(ctx));
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
  gain.connect(getSfxOutput(ctx));
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
  gain.connect(getPresenceSfxOutput(ctx));
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
    bg.connect(getSfxOutput(ctx));
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
  impactGain.connect(getPresenceSfxOutput(ctx));
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
  splashGain.connect(getPresenceSfxOutput(ctx));
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
  ng.connect(getSfxOutput(ctx));
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
    g.connect(getSfxOutput(ctx));
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
  tg.connect(getSfxOutput(ctx));
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
  ng.connect(getSfxOutput(ctx));
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
  og.connect(getSfxOutput(ctx));
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
      gain.connect(getSfxOutput(ctx));
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
    g.connect(getSfxOutput(ctx));
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
  ng.connect(getSfxOutput(ctx));
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
  ig.connect(getSfxOutput(ctx));
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
    g.connect(getSfxOutput(ctx));
    osc.start(now + 0.18 + idx * 0.09);
    osc.stop(now + 0.98 + idx * 0.09);
  });
}

export function playPickupChimeSound() {
  const ctx = getAudioContext();
  if (!ctx || !isAudioEnabled) return;
  const now = ctx.currentTime;
  const out = getSfxOutput(ctx);

  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const gain = ctx.createGain();

  osc1.type = 'sine';
  osc2.type = 'triangle';

  osc1.frequency.setValueAtTime(587.33, now);
  osc1.frequency.exponentialRampToValueAtTime(1174.66, now + 0.18);

  osc2.frequency.setValueAtTime(880.0, now);
  osc2.frequency.exponentialRampToValueAtTime(1760.0, now + 0.22);

  gain.gain.setValueAtTime(0.001, now);
  gain.gain.linearRampToValueAtTime(0.25, now + 0.04);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);

  osc1.connect(gain);
  osc2.connect(gain);
  gain.connect(out);

  osc1.start(now);
  osc2.start(now);
  osc1.stop(now + 0.45);
  osc2.stop(now + 0.45);
}

export function playBaseBeepSound(isRefill = false) {
  const ctx = getAudioContext();
  if (!ctx || !isAudioEnabled) return;
  const now = ctx.currentTime;
  const out = getSfxOutput(ctx);

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = isRefill ? 'triangle' : 'sine';
  osc.frequency.setValueAtTime(isRefill ? 523.25 : 659.25, now);
  osc.frequency.exponentialRampToValueAtTime(isRefill ? 1046.5 : 1318.5, now + 0.22);
  gain.gain.setValueAtTime(0.001, now);
  gain.gain.linearRampToValueAtTime(0.18, now + 0.04);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
  osc.connect(gain);
  gain.connect(out);
  osc.start(now);
  osc.stop(now + 0.36);
}

export function playBackpackLimitSound() {
  const ctx = getAudioContext();
  if (!ctx || !isAudioEnabled) return;
  const now = ctx.currentTime;
  const out = getSfxOutput(ctx);

  [240, 180].forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, now + i * 0.09);
    gain.gain.setValueAtTime(0.001, now + i * 0.09);
    gain.gain.linearRampToValueAtTime(0.18, now + i * 0.09 + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.09 + 0.11);
    osc.connect(gain);
    gain.connect(out);
    osc.start(now + i * 0.09);
    osc.stop(now + i * 0.09 + 0.12);
  });
}

export function updateAudio(isHostile?: boolean, gravity?: number) {
  // Spatial and environmental audio is dynamically managed via updateSpatialAudio & setAudioEnvironment
}
