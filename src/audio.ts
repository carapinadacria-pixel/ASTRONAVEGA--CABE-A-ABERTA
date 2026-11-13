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
let ambientStarted = false;

// Footstep cadence timing
let lastFootstepTime = 0;

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
// 1. PROCEDURAL CONTINUOUS AMBIENT SOUND GENERATORS (Natureza, Mar, Máquinas)
// ----------------------------------------------------------------------------
function startProceduralAmbience(ctx: AudioContext) {
  if (ambientStarted) return;
  ambientStarted = true;

  // Master Gain
  masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(isAudioEnabled ? 1.0 : 0.0, ctx.currentTime);
  masterGain.connect(ctx.destination);

  // Buffer with pink-filtered noise for natural organic wind & waves (4 seconds loop)
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

  // --- A. NATURE SOUND (Brisa Costeira & Atmosfera) ---
  const natureSource = ctx.createBufferSource();
  natureSource.buffer = noiseBuffer;
  natureSource.loop = true;

  const natureFilter = ctx.createBiquadFilter();
  natureFilter.type = 'lowpass';
  natureFilter.frequency.setValueAtTime(450, ctx.currentTime);

  // Slow LFO for wind gust swelling (0.15 Hz)
  const windLFO = ctx.createOscillator();
  windLFO.frequency.setValueAtTime(0.18, ctx.currentTime);
  const windLFOGain = ctx.createGain();
  windLFOGain.gain.setValueAtTime(180, ctx.currentTime);
  windLFO.connect(windLFOGain);
  windLFOGain.connect(natureFilter.frequency);
  windLFO.start();

  natureGain = ctx.createGain();
  natureGain.gain.setValueAtTime(0.24, ctx.currentTime);

  natureSource.connect(natureFilter);
  natureFilter.connect(natureGain);
  natureGain.connect(masterGain);
  natureSource.start();

  // --- B. OCEAN SURF SOUND (Ondas do Mar Rolando e Espuma) ---
  const oceanSource = ctx.createBufferSource();
  oceanSource.buffer = noiseBuffer;
  oceanSource.loop = true;

  const oceanFilter = ctx.createBiquadFilter();
  oceanFilter.type = 'bandpass';
  oceanFilter.frequency.setValueAtTime(320, ctx.currentTime);
  oceanFilter.Q.setValueAtTime(1.2, ctx.currentTime);

  // Wave Rhythm LFO: swells every ~3.5 seconds like real coastal breakers
  const waveLFO = ctx.createOscillator();
  waveLFO.frequency.setValueAtTime(0.28, ctx.currentTime);
  const waveLFOGain = ctx.createGain();
  waveLFOGain.gain.setValueAtTime(260, ctx.currentTime);
  waveLFO.connect(waveLFOGain);
  waveLFOGain.connect(oceanFilter.frequency);
  waveLFO.start();

  // Sub-bass ocean swell rumble
  const subSwellOsc = ctx.createOscillator();
  subSwellOsc.type = 'sine';
  subSwellOsc.frequency.setValueAtTime(48, ctx.currentTime);
  const subSwellGain = ctx.createGain();
  subSwellGain.gain.setValueAtTime(0.12, ctx.currentTime);
  subSwellOsc.connect(subSwellGain);
  subSwellOsc.start();

  oceanGain = ctx.createGain();
  oceanGain.gain.setValueAtTime(0.35, ctx.currentTime);

  oceanSource.connect(oceanFilter);
  oceanFilter.connect(oceanGain);
  subSwellGain.connect(oceanGain);
  oceanGain.connect(masterGain);
  oceanSource.start();

  // --- C. WORKING MACHINERY SOUND (Máquinas a Trabalhar / VAB & Launchpad) ---
  // 1. Dual Turbine / Generator Hum (60Hz & 120Hz harmonics with PWM beating)
  const osc1 = ctx.createOscillator();
  osc1.type = 'sawtooth';
  osc1.frequency.setValueAtTime(58.5, ctx.currentTime);

  const osc2 = ctx.createOscillator();
  osc2.type = 'triangle';
  osc2.frequency.setValueAtTime(117, ctx.currentTime);

  const machFilter = ctx.createBiquadFilter();
  machFilter.type = 'lowpass';
  machFilter.frequency.setValueAtTime(380, ctx.currentTime);

  // 2. Rhythmic Hydraulic Compressor / Servo Loop (1.2 Hz pulses)
  const compressorLFO = ctx.createOscillator();
  compressorLFO.frequency.setValueAtTime(1.15, ctx.currentTime);
  const compressorGain = ctx.createGain();
  compressorGain.gain.setValueAtTime(0.08, ctx.currentTime);
  compressorLFO.connect(compressorGain);
  compressorLFO.start();

  machineGain = ctx.createGain();
  machineGain.gain.setValueAtTime(0.15, ctx.currentTime);

  osc1.connect(machFilter);
  osc2.connect(machFilter);
  machFilter.connect(machineGain);
  compressorGain.connect(machineGain);
  machineGain.connect(masterGain);
  osc1.start();
  osc2.start();
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
  const px = playerPos[0];
  const pz = playerPos[2];

  // A. Ocean Proximity:
  // Water is at X < -26. Peak volume when standing on the beach (X ≈ -30).
  // Fades out smoothly as player heads inland towards X > 120.
  if (oceanGain) {
    let oceanFactor = 0.05;
    if (px < -20) {
      oceanFactor = Math.min(0.65, 0.40 + Math.abs(px + 20) * 0.015);
    } else if (px < 40) {
      oceanFactor = Math.max(0.08, 0.40 * (1 - (px + 20) / 60));
    } else {
      oceanFactor = Math.max(0.01, 0.08 * (1 - Math.min(1, (px - 40) / 100)));
    }
    oceanGain.gain.setTargetAtTime(oceanFactor, now, 0.2);
  }

  // B. Machinery Proximity:
  // Launch Pad is at X ≈ 0, VAB is at X ≈ 220, Z ≈ 0.
  if (machineGain) {
    const distToPad = Math.hypot(px, pz);
    const distToVAB = Math.hypot(px - 220, pz);
    let machFactor = 0.04;

    if (distToVAB < 90) {
      machFactor = Math.min(0.48, 0.20 + (1 - distToVAB / 90) * 0.28);
    } else if (distToPad < 45) {
      machFactor = Math.min(0.35, 0.15 + (1 - distToPad / 45) * 0.20);
    } else if (px > 80) {
      machFactor = 0.12;
    }
    machineGain.gain.setTargetAtTime(machFactor, now, 0.2);
  }

  // C. Footstep Cadence Triggering:
  if (isMoving && isGrounded && speed > 0.4) {
    const isRunning = speed > 3.8;
    const interval = inWater ? 0.65 : isRunning ? 0.31 : 0.48;

    if (performance.now() - lastFootstepTime > interval * 1000) {
      lastFootstepTime = performance.now();
      if (inWater) {
        playWaterWadeSound();
      } else {
        // Surface identification: Beach sand (X: -16 to -30), Runway/Pad (Metal/Concrete), Grass
        let surface: 'sand' | 'metal' | 'grass' = 'grass';
        if (px >= -34 && px <= -16) {
          surface = 'sand';
        } else if (
          (Math.abs(px) < 18 && Math.abs(pz) < 18) || // Launch pad
          (px >= 180 && px <= 260 && Math.abs(pz) < 55) // VAB floor
        ) {
          surface = 'metal';
        }
        playFootstepSound(surface, isRunning);
      }
    }
  }
}

// ----------------------------------------------------------------------------
// 3. CAMINHADA & MOVIMENTAÇÃO (Procedural Footsteps by Surface Type)
// ----------------------------------------------------------------------------
export function playFootstepSound(surface: 'grass' | 'sand' | 'metal', isRunning: boolean) {
  const ctx = getAudioContext();
  if (!ctx || !isAudioEnabled) return;
  const now = ctx.currentTime;

  const duration = isRunning ? 0.08 : 0.07;
  const bufferSize = Math.floor(ctx.sampleRate * duration);
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  // Surface texture noise synthesis
  for (let i = 0; i < bufferSize; i++) {
    const envelope = Math.exp(-i / (ctx.sampleRate * (duration * 0.35)));
    data[i] = (Math.random() * 2 - 1) * envelope;
  }

  const noiseSource = ctx.createBufferSource();
  noiseSource.buffer = buffer;

  const filter = ctx.createBiquadFilter();
  const gain = ctx.createGain();

  if (surface === 'sand') {
    // Sand crunch: low-mid textured scraping granules
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(isRunning ? 680 : 520, now);
    filter.Q.setValueAtTime(1.4, now);
    gain.gain.setValueAtTime(isRunning ? 0.16 : 0.11, now);
  } else if (surface === 'metal') {
    // Metal / Concrete: crisp resonant boot heel tap
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(isRunning ? 1400 : 1100, now);
    filter.Q.setValueAtTime(3.2, now);
    gain.gain.setValueAtTime(isRunning ? 0.22 : 0.15, now);

    // Boot sole impact thud
    const thumpOsc = ctx.createOscillator();
    thumpOsc.type = 'triangle';
    thumpOsc.frequency.setValueAtTime(120, now);
    thumpOsc.frequency.exponentialRampToValueAtTime(45, now + 0.05);
    const thumpGain = ctx.createGain();
    thumpGain.gain.setValueAtTime(0.18, now);
    thumpGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    thumpOsc.connect(thumpGain);
    thumpGain.connect(masterGain || ctx.destination);
    thumpOsc.start(now);
    thumpOsc.stop(now + 0.05);
  } else {
    // Grass / Soil: soft muffled step with gentle rustle
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(isRunning ? 750 : 580, now);
    gain.gain.setValueAtTime(isRunning ? 0.14 : 0.09, now);
  }

  gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

  noiseSource.connect(filter);
  filter.connect(gain);
  gain.connect(masterGain || ctx.destination);
  noiseSource.start(now);
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
// 7. INITIALIZATION & CONTROLS (NO EXTERNAL MUSIC MP3!)
// ----------------------------------------------------------------------------
export function initAudio() {
  const ctx = getAudioContext();
  if (!ctx) return;
  startProceduralAmbience(ctx);
}

export function toggleAudio(): boolean {
  isAudioEnabled = !isAudioEnabled;
  if (masterGain && audioCtx) {
    masterGain.gain.setTargetAtTime(isAudioEnabled ? 1.0 : 0.0, audioCtx.currentTime, 0.05);
  }
  if (isAudioEnabled && !ambientStarted) {
    const ctx = getAudioContext();
    if (ctx) startProceduralAmbience(ctx);
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

export function updateAudio(isHostile?: boolean, gravity?: number) {
  // Spatial and environmental audio is dynamically managed via updateSpatialAudio
}

