import React, { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGameStore, PLANETS, PlanetInfo } from '../store';
import {
  Vector3,
  Quaternion,
  Group,
  Color,
  CanvasTexture,
  MeshStandardMaterial,
  MeshBasicMaterial,
  SRGBColorSpace,
  RepeatWrapping,
  DoubleSide,
  MathUtils,
} from 'three';
import { RocketModel } from './RocketModel';
import { OrbitalCapsule } from './OrbitalCapsule';
import { RealisticEarthGlobe } from './RealisticEarthGlobe';
import { Text, Stars, Sphere, Ring, useKeyboardControls, Instances, Instance } from '@react-three/drei';
import { playSolarEvaporationSound } from '../audio';

// Reusable scratch vectors to eliminate per-frame GC allocations in spaceflight
const _spaceIdealOffset = new Vector3();
const _spaceIdealLookAt = new Vector3();
const _spawnLookTarget = new Vector3();

interface CosmicPlanet extends PlanetInfo {
  pos: Vector3;
  visualRadius: number;
  atmosphereColor: string;
  hasRings?: boolean;
}

// ---------------------------------------------------------------------------
// HIGH-FIDELITY PROCEDURAL PLANETARY TEXTURES
// Realistic Earth (Continents & Oceans), Jupiter (Bands & Red Spot), Saturn, Mars, Venus
// ---------------------------------------------------------------------------

let cachedJupiterTexture: CanvasTexture | null = null;
let cachedSaturnTexture: CanvasTexture | null = null;
let cachedMarsTexture: CanvasTexture | null = null;
let cachedVenusTexture: CanvasTexture | null = null;

function createJupiterTexture(): CanvasTexture | null {
  if (cachedJupiterTexture) return cachedJupiterTexture;
  if (typeof document === 'undefined') return null;

  const w = 512;
  const h = 256;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    // Rich Jovian atmospheric bands in cream, amber, terracotta and chocolate
    const bands = [
      '#fef3c7', '#d97706', '#fef9c3', '#b45309', '#78350f',
      '#fde68a', '#9a3412', '#fef3c7', '#c2410c', '#fef08a'
    ];
    const bandHeight = h / bands.length;
    bands.forEach((color, idx) => {
      ctx.fillStyle = color;
      ctx.fillRect(0, idx * bandHeight, w, bandHeight + 2);
    });

    // Wavy turbulent atmospheric plumes
    for (let i = 0; i < 180; i++) {
      const x = Math.random() * w;
      const y = Math.random() * h;
      const rx = 20 + Math.random() * 40;
      const ry = 3 + Math.random() * 8;
      ctx.fillStyle = i % 2 === 0 ? 'rgba(254, 243, 199, 0.4)' : 'rgba(120, 53, 15, 0.35)';
      ctx.beginPath();
      ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Iconic Great Red Spot (Southern Hemisphere: Lat ~-22°)
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.ellipse(320, 160, 36, 22, 0.08, 0, Math.PI * 2);
    ctx.fill();

    // Red Spot inner crimson swirl
    ctx.fillStyle = '#991b1b';
    ctx.beginPath();
    ctx.ellipse(320, 160, 24, 14, 0.08, 0, Math.PI * 2);
    ctx.fill();
  }

  cachedJupiterTexture = new CanvasTexture(canvas);
  cachedJupiterTexture.colorSpace = SRGBColorSpace;
  cachedJupiterTexture.wrapS = RepeatWrapping;
  cachedJupiterTexture.wrapT = RepeatWrapping;
  return cachedJupiterTexture;
}

function createSaturnTexture(): CanvasTexture | null {
  if (cachedSaturnTexture) return cachedSaturnTexture;
  if (typeof document === 'undefined') return null;

  const w = 512;
  const h = 256;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    // Golden subtle gas bands
    const bands = ['#fef08a', '#fde047', '#eab308', '#ca8a04', '#eab308', '#fef08a'];
    const bh = h / bands.length;
    bands.forEach((c, idx) => {
      ctx.fillStyle = c;
      ctx.fillRect(0, idx * bh, w, bh + 1);
    });
  }

  cachedSaturnTexture = new CanvasTexture(canvas);
  cachedSaturnTexture.colorSpace = SRGBColorSpace;
  cachedSaturnTexture.wrapS = RepeatWrapping;
  return cachedSaturnTexture;
}

function createMarsTexture(): CanvasTexture | null {
  if (cachedMarsTexture) return cachedMarsTexture;
  if (typeof document === 'undefined') return null;

  const w = 512;
  const h = 256;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    // Rust-red ochre base
    ctx.fillStyle = '#c2410c';
    ctx.fillRect(0, 0, w, h);

    // Darker basaltic maria
    ctx.fillStyle = '#7c2d12';
    for (let i = 0; i < 25; i++) {
      ctx.beginPath();
      ctx.ellipse(
        Math.random() * w,
        60 + Math.random() * 130,
        30 + Math.random() * 70,
        15 + Math.random() * 40,
        Math.random() * 0.4,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }

    // Polar ice caps
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, w, 22);
    ctx.fillRect(0, h - 28, w, 28);
  }

  cachedMarsTexture = new CanvasTexture(canvas);
  cachedMarsTexture.colorSpace = SRGBColorSpace;
  return cachedMarsTexture;
}

function createVenusTexture(): CanvasTexture | null {
  if (cachedVenusTexture) return cachedVenusTexture;
  if (typeof document === 'undefined') return null;

  const w = 512;
  const h = 256;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#fef3c7';
    ctx.fillRect(0, 0, w, h);

    // Swirling pale golden sulfuric clouds
    for (let i = 0; i < 120; i++) {
      ctx.fillStyle = i % 2 === 0 ? 'rgba(253, 224, 71, 0.4)' : 'rgba(245, 158, 11, 0.25)';
      ctx.beginPath();
      ctx.ellipse(
        Math.random() * w,
        Math.random() * h,
        40 + Math.random() * 80,
        10 + Math.random() * 25,
        (Math.random() - 0.5) * 0.3,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }
  }

  cachedVenusTexture = new CanvasTexture(canvas);
  cachedVenusTexture.colorSpace = SRGBColorSpace;
  return cachedVenusTexture;
}

export function SpaceScene() {
  const rocketRef = useRef<Group>(null);
  const visualCapsuleRef = useRef<Group>(null);
  const initializedSpawnRef = useRef(false);
  const { setPlanet, loadExoplanets } = useGameStore();
  const speedRef = useRef(180);
  const pitchVelRef = useRef(0);
  const yawVelRef = useRef(0);
  const rollAngleRef = useRef(0);
  const pitchTiltRef = useRef(0);
  const cameraLookAtRef = useRef(new Vector3());
  const smoothedCamQuatRef = useRef(new Quaternion());
  const smoothedCamDistRef = useRef(22.5);
  const smoothedCamHeightRef = useRef(8.0);
  const lastHudSyncRef = useRef(-1);
  const evaporatingRef = useRef(false);
  const evapTimerRef = useRef(0);
  const [solarState, setSolarState] = useState({ heatPct: 0, isEvaporating: false });
  const [isFlying, setIsFlying] = useState(true);
  // Staging ("desencapsulamento") happens ONLY ONCE when leaving Earth for the first time
  const initialStaged = useGameStore.getState().hasCompletedInitialStaging || useGameStore.getState().planetIndex !== 0;
  const [stagingProgress, setStagingProgress] = useState(initialStaged ? 1.0 : 0.0);
  const [rcsState, setRcsState] = useState({ pitch: 0, yaw: 0, thrust: 0.4 });
  const [telemetry, setTelemetry] = useState({ speed: Math.round(180 * 3.6), target: 'Terra', distKm: 0 });
  const [, getKeys] = useKeyboardControls();

  // Load NASA exoplanets on mount & sync initial staging state
  React.useEffect(() => {
    loadExoplanets();
    const store = useGameStore.getState();
    if (store.hasCompletedInitialStaging || store.planetIndex !== 0) {
      store.setHasCompletedInitialStaging(true);
      store.setSpaceFlightData({ stagingProgress: 1.0 });
    }
  }, [loadExoplanets]);

  // Procedural planetary surface textures
  const jupiterMap = useMemo(() => createJupiterTexture(), []);
  const saturnMap = useMemo(() => createSaturnTexture(), []);
  const marsMap = useMemo(() => createMarsTexture(), []);
  const venusMap = useMemo(() => createVenusTexture(), []);

  // ---------------------------------------------------------------------------
  // INTERPLANETARY DISTANCE & REALISTIC RELATIVE RADIUS HIERARCHY
  // Scaled proportionally: Jupiter (920) > Saturn (780) > Uranus (520) > Neptune (500)
  // > Earth (380) > Venus (360) > Mars (260) > Titan (190) > Mercury (180) > Moon (140)
  // ---------------------------------------------------------------------------
  const planetPositions: CosmicPlanet[] = useMemo(() => {
    return PLANETS.map((p, i) => {
      let visualRadius = 380;
      let atmosphereColor = '#38bdf8';
      let hasRings = false;
      let dist = 5000;
      let angle = (i / PLANETS.length) * Math.PI * 2;
      let height = ((i % 3) - 1) * 350;

      switch (p.type) {
        case 'mercury':
          visualRadius = 180;
          atmosphereColor = '#a8a29e';
          dist = 3550;
          angle = 0.45;
          break;
        case 'venus':
          visualRadius = 360;
          atmosphereColor = '#fbbf24';
          dist = 5000;
          angle = 1.35;
          break;
        case 'earth':
          visualRadius = 380;
          atmosphereColor = '#38bdf8';
          dist = 6200;
          angle = 2.40;
          break;
        case 'moon':
          visualRadius = 140;
          atmosphereColor = '#cbd5e1';
          dist = 6200;
          angle = 2.40;
          // Offset relative to Earth
          return {
            ...p,
            visualRadius,
            atmosphereColor,
            hasRings: false,
            pos: new Vector3(
              Math.cos(2.40) * 6200 + 460,
              45,
              Math.sin(2.40) * 6200 + 320
            ),
          };
        case 'mars':
          visualRadius = 260;
          atmosphereColor = '#f97316';
          dist = 8400;
          angle = 3.65;
          break;
        case 'jupiter':
          visualRadius = 920;
          atmosphereColor = '#d97706';
          dist = 14200;
          angle = 4.70;
          break;
        case 'saturn':
          visualRadius = 780;
          atmosphereColor = '#eab308';
          hasRings = true;
          dist = 18000;
          angle = 5.60;
          break;
        case 'titan':
          visualRadius = 190;
          atmosphereColor = '#f59e0b';
          // Orbiting near Saturn
          return {
            ...p,
            visualRadius,
            atmosphereColor,
            hasRings: false,
            pos: new Vector3(
              Math.cos(5.60) * 18000 + 820,
              -60,
              Math.sin(5.60) * 18000 + 680
            ),
          };
        case 'uranus':
          visualRadius = 520;
          atmosphereColor = '#38bdf8';
          hasRings = true;
          dist = 22000;
          angle = 0.95;
          break;
        case 'neptune':
          visualRadius = 500;
          atmosphereColor = '#2563eb';
          dist = 25800;
          angle = 2.10;
          break;
        case 'exoplanet':
          visualRadius = 360 + (i * 65) % 280;
          atmosphereColor = '#a855f7';
          hasRings = i % 2 === 0;
          dist = 29000 + (i * 1400) % 8000;
          angle = (i * 1.618) * Math.PI * 2;
          break;
        default:
          visualRadius = 380;
          atmosphereColor = '#60a5fa';
          dist = 12000;
      }

      return {
        ...p,
        visualRadius,
        atmosphereColor,
        hasRings,
        pos: new Vector3(
          Math.cos(angle) * dist,
          height,
          Math.sin(angle) * dist
        ),
      };
    });
  }, [PLANETS.length]);

  // Procedural Asteroid Field Belt (Orbital ring between Mars and Jupiter: 9,800m to 12,000m)
  const asteroids = useMemo(() => {
    const arr = [];
    for (let i = 0; i < 500; i++) {
      const distance = 9800 + Math.random() * 2200;
      const theta = Math.random() * Math.PI * 2;

      const x = distance * Math.cos(theta);
      const y = (Math.random() - 0.5) * 650;
      const z = distance * Math.sin(theta);

      const scale = 12 + Math.random() * 38;
      arr.push({ x, y, z, scale, rx: Math.random() * Math.PI, ry: Math.random() * Math.PI });
    }
    return arr;
  }, []);

  // Distant Cosmic Galactic Nebulae
  const nebulaClouds = useMemo(() => {
    return [
      { pos: [-18000, 3200, -14000], col: '#8b5cf6', scale: 2800 },
      { pos: [16000, -2800, -19000], col: '#06b6d4', scale: 3200 },
      { pos: [12000, 4500, 16000], col: '#ec4899', scale: 2900 },
      { pos: [-16000, -3500, 15000], col: '#eab308', scale: 2600 },
    ];
  }, []);

  useFrame((state, rawDelta) => {
    if (!rocketRef.current) return;
    const delta = Math.min(rawDelta, 0.05);

    // Initialize capsule in high orbit outside the departure planet on first frame
    if (!initializedSpawnRef.current && planetPositions.length > 0) {
      initializedSpawnRef.current = true;
      const departureIdx = useGameStore.getState().planetIndex;
      const originPlanet = planetPositions[departureIdx] || planetPositions[0];
      const radialOut = originPlanet.pos.clone().normalize();
      if (radialOut.lengthSq() < 0.01) radialOut.set(0, 0, 1);

      const spawnDistance = originPlanet.visualRadius + 460;
      rocketRef.current.position
        .copy(originPlanet.pos)
        .addScaledVector(radialOut, spawnDistance)
        .add(new Vector3(0, 85, 0));

      // Orient capsule tangentially across the solar system so neighboring planets are in view
      _spawnLookTarget.set(-radialOut.z * 8000, 0, radialOut.x * 8000);
      rocketRef.current.lookAt(_spawnLookTarget);

      // Snap camera & smoothed chase quaternion behind capsule on initial frame
      smoothedCamQuatRef.current.copy(rocketRef.current.quaternion);
      smoothedCamDistRef.current = 23.0;
      smoothedCamHeightRef.current = 8.2;
      _spaceIdealOffset.set(0, 8.2, 23)
        .applyQuaternion(smoothedCamQuatRef.current)
        .add(rocketRef.current.position);
      _spaceIdealLookAt.set(0, 0, -25)
        .applyQuaternion(smoothedCamQuatRef.current)
        .add(rocketRef.current.position);
      state.camera.position.copy(_spaceIdealOffset);
      cameraLookAtRef.current.copy(_spaceIdealLookAt);
      state.camera.lookAt(cameraLookAtRef.current);
    }

    // Advance orbital staging ("desencapsulamento") ONLY on the first launch from Earth
    if (stagingProgress < 1.0) {
      const nextProgress = Math.min(1.0, stagingProgress + delta / 8.0);
      setStagingProgress(nextProgress);
      const store = useGameStore.getState();
      if (nextProgress >= 1.0) {
        store.setSpaceFlightData({ stagingProgress: 1.0 });
        if (!store.hasCompletedInitialStaging) {
          store.setHasCompletedInitialStaging(true);
        }
      } else if (state.clock.elapsedTime - lastHudSyncRef.current >= 0.12) {
        store.setSpaceFlightData({ stagingProgress: nextProgress });
      }
    }

    // Handle active solar evaporation sequence (capsule melts & respawns safely in space)
    if (evaporatingRef.current) {
      evapTimerRef.current += delta;
      speedRef.current = MathUtils.damp(speedRef.current, 0, 4.5, delta);
      rocketRef.current.translateZ(-speedRef.current * delta);
      if (visualCapsuleRef.current) {
        const shrink = Math.max(0.03, 1.2 * (1 - evapTimerRef.current / 1.85));
        const jitter = 1 + Math.sin(state.clock.elapsedTime * 60) * 0.12;
        visualCapsuleRef.current.scale.setScalar(shrink * jitter);
      }

      const rotAlphaEvap = 1 - Math.exp(-9.0 * delta);
      smoothedCamQuatRef.current.slerp(rocketRef.current.quaternion, rotAlphaEvap);
      _spaceIdealOffset
        .set(0, smoothedCamHeightRef.current, smoothedCamDistRef.current)
        .applyQuaternion(smoothedCamQuatRef.current)
        .add(rocketRef.current.position);
      _spaceIdealLookAt
        .set(0, 0, -28)
        .applyQuaternion(smoothedCamQuatRef.current)
        .add(rocketRef.current.position);
      state.camera.position.copy(_spaceIdealOffset);
      cameraLookAtRef.current.copy(_spaceIdealLookAt);
      state.camera.lookAt(cameraLookAtRef.current);

      if (evapTimerRef.current >= 1.85) {
        evaporatingRef.current = false;
        evapTimerRef.current = 0;
        if (visualCapsuleRef.current) {
          visualCapsuleRef.current.scale.setScalar(1.2);
        }
        const safeEarth = planetPositions.find((p) => p.type === 'earth') || planetPositions[0];
        const radialOut = safeEarth.pos.clone().normalize();
        if (radialOut.lengthSq() < 0.01) radialOut.set(0, 0, 1);
        rocketRef.current.position
          .copy(safeEarth.pos)
          .addScaledVector(radialOut, safeEarth.visualRadius + 560)
          .add(new Vector3(0, 85, 0));
        _spawnLookTarget.set(-radialOut.z * 8000, 0, radialOut.x * 8000);
        rocketRef.current.lookAt(_spawnLookTarget);
        smoothedCamQuatRef.current.copy(rocketRef.current.quaternion);
        speedRef.current = 180;
        pitchVelRef.current = 0;
        yawVelRef.current = 0;
        rollAngleRef.current = 0;
        pitchTiltRef.current = 0;
        setSolarState({ heatPct: 0, isEvaporating: false });
        useGameStore.getState().setSpaceFlightData({ solarHeatPct: 0, isEvaporating: false });
      }
      return;
    }

    const { forward, backward, left, right, jump, sprint } = getKeys();
    const storeState = useGameStore.getState();
    const joystick = storeState.joystick || { x: 0, y: 0 };
    const mobileJump = storeState.mobileJump;
    const mobileSprint = storeState.mobileSprint;

    const joyMag = Math.min(1, Math.hypot(joystick.x, joystick.y));
    const hasJoyInput = joyMag > 0.05;

    // --- ACCELERATION & CRUISE CONTROLS (SMOOTH DAMPED PROPULSION) ---
    // Base orbital velocity keeps the capsule gliding smoothly even while only steering
    const isBoosting = jump || sprint || mobileJump || mobileSprint;
    const isActiveThrust = forward || backward || left || right || hasJoyInput;

    let targetSpeed = stagingProgress < 1.0 ? 150 : 185; // Smooth orbital coasting speed
    if (isBoosting) {
      targetSpeed = mobileSprint || sprint ? 1450 : 980;
    } else if (isActiveThrust) {
      const inputFactor = hasJoyInput ? Math.max(0.45, joyMag) : 1.0;
      targetSpeed = 540 * inputFactor;
    }

    const accelLambda = isBoosting ? 3.2 : isActiveThrust ? 2.4 : 1.4;
    speedRef.current = MathUtils.damp(speedRef.current, targetSpeed, accelLambda, delta);

    const currentFlying = speedRef.current > 15;
    if (currentFlying !== isFlying) {
      setIsFlying(currentFlying);
    }

    // --- 6-DOF DAMPED STEERING DYNAMICS (ANALOG JOYSTICK + KEYBOARD CONTROLS) ---
    // Inverted Flight Controls ("de cima para baixo"):
    // Push forward/up (joystick.y > 0, forward key) -> Dives down (pitchInput < 0)
    // Pull back/down (joystick.y < 0, backward key) -> Climbs up (pitchInput > 0)
    let targetPitchVel = 0;
    if (hasJoyInput) {
      targetPitchVel -= joystick.y * 1.95;
    }
    if (forward) targetPitchVel -= 1.45;
    if (backward) targetPitchVel += 1.45;

    let targetYawVel = 0;
    if (hasJoyInput) {
      targetYawVel += -joystick.x * 2.05;
    }
    if (left) targetYawVel += 1.55;
    if (right) targetYawVel -= 1.55;

    // Frame-rate independent exponential damping on angular velocities
    pitchVelRef.current = MathUtils.damp(pitchVelRef.current, targetPitchVel, 6.5, delta);
    yawVelRef.current = MathUtils.damp(yawVelRef.current, targetYawVel, 6.5, delta);

    if (Math.abs(pitchVelRef.current) > 0.0005) {
      rocketRef.current.rotateX(pitchVelRef.current * delta);
    }
    if (Math.abs(yawVelRef.current) > 0.0005) {
      rocketRef.current.rotateY(yawVelRef.current * delta);
    }

    // Smooth visual banking roll & pitch inclination on inner capsule group (zero gimbal lock!)
    const targetBankRoll = MathUtils.clamp(yawVelRef.current * 0.38, -0.65, 0.65);
    const targetPitchTilt = MathUtils.clamp(pitchVelRef.current * 0.16, -0.3, 0.3);
    rollAngleRef.current = MathUtils.damp(rollAngleRef.current, targetBankRoll, 5.5, delta);
    pitchTiltRef.current = MathUtils.damp(pitchTiltRef.current, targetPitchTilt, 5.5, delta);

    if (visualCapsuleRef.current) {
      visualCapsuleRef.current.rotation.set(
        Math.PI / 2 + pitchTiltRef.current,
        Math.PI,
        -rollAngleRef.current
      );
    }

    // Move forward along the capsule's longitudinal trajectory
    rocketRef.current.translateZ(-speedRef.current * delta);

    // Lockstep Zero-Vibration Follow Camera:
    // Smooth ONLY rotational quaternion and local pullback scalars; add directly to rocketRef.current.position
    // so camera translates at exact capsule velocity with zero world-space spring oscillation or delta jitter!
    const boostFactor = MathUtils.clamp((speedRef.current - 180) / 1100, 0, 1);
    const targetCamDist = MathUtils.lerp(22.5, 28.0, boostFactor);
    const targetCamHeight = MathUtils.lerp(8.0, 9.2, boostFactor);

    smoothedCamDistRef.current = MathUtils.damp(smoothedCamDistRef.current, targetCamDist, 6.0, delta);
    smoothedCamHeightRef.current = MathUtils.damp(smoothedCamHeightRef.current, targetCamHeight, 6.0, delta);
    const rotAlpha = 1 - Math.exp(-9.0 * delta);
    smoothedCamQuatRef.current.slerp(rocketRef.current.quaternion, rotAlpha);

    _spaceIdealOffset
      .set(0, smoothedCamHeightRef.current, smoothedCamDistRef.current)
      .applyQuaternion(smoothedCamQuatRef.current)
      .add(rocketRef.current.position);

    _spaceIdealLookAt
      .set(0, 0, -28)
      .applyQuaternion(smoothedCamQuatRef.current)
      .add(rocketRef.current.position);

    state.camera.position.copy(_spaceIdealOffset);
    cameraLookAtRef.current.copy(_spaceIdealLookAt);
    state.camera.lookAt(cameraLookAtRef.current);

    // Nearest planet distance calculation & telemetry HUD updates
    const rocketPos = rocketRef.current.position;
    let closestPlanet = planetPositions[0];
    let minDistance = Infinity;

    for (let i = 0; i < planetPositions.length; i++) {
      const p = planetPositions[i];
      const dist = rocketPos.distanceTo(p.pos);
      if (dist < minDistance) {
        minDistance = dist;
        closestPlanet = p;
      }
      // Planetary atmospheric entry trigger (only after initial staging starts so we don't immediately re-enter)
      const entryRadius = p.visualRadius + 120;
      if (stagingProgress > 0.35 && dist < entryRadius) {
        setPlanet(i);
        break;
      }
    }

    // Check distance to the Sun (0, 0, 0): thermal proximity warning & evaporation respawn
    const distToSun = rocketPos.length();
    const solarHeatPct =
      distToSun < 2950
        ? Math.round(MathUtils.clamp((2950 - distToSun) / (2950 - 2100), 0, 1) * 100)
        : 0;

    if (!evaporatingRef.current && distToSun < 2100) {
      evaporatingRef.current = true;
      evapTimerRef.current = 0;
      playSolarEvaporationSound();
      setSolarState({ heatPct: 100, isEvaporating: true });
      useGameStore.getState().setSpaceFlightData({ solarHeatPct: 100, isEvaporating: true });
      return;
    }

    // Update telemetry & RCS visual state smoothly at ~8Hz (zero per-frame React stutter)
    if (state.clock.elapsedTime - lastHudSyncRef.current >= 0.12) {
      lastHudSyncRef.current = state.clock.elapsedTime;
      const currentSpeedKmh = Math.round(speedRef.current * 3.6);
      const currentTarget = closestPlanet?.name || 'Terra';
      const currentDistKm = parseFloat((minDistance / 100).toFixed(1));
      const normalizedThrust = MathUtils.clamp(speedRef.current / 950, 0.2, 1.35);

      setSolarState((prev) =>
        prev.heatPct === solarHeatPct && !prev.isEvaporating
          ? prev
          : { heatPct: solarHeatPct, isEvaporating: false }
      );
      setRcsState({
        pitch: pitchVelRef.current,
        yaw: yawVelRef.current,
        thrust: normalizedThrust,
      });
      setTelemetry({
        speed: currentSpeedKmh,
        target: currentTarget,
        distKm: currentDistKm,
      });
      useGameStore.getState().setSpaceFlightData({
        speed: currentSpeedKmh,
        target: currentTarget,
        distKm: currentDistKm,
        solarHeatPct,
        isEvaporating: false,
      });
    }
  });

  return (
    <>
      {/* Balanced Deep Space Lighting */}
      <ambientLight intensity={0.28} />
      <directionalLight position={[1000, 1500, 1000]} intensity={3.2} />

      {/* Deep Cosmos Multi-Layer Starfield */}
      <Stars radius={35000} depth={10000} count={12000} factor={8} saturation={0.2} fade speed={0.3} />

      {/* Radiant Central Star (Always-Visible Larger Sun) at (0, 0, 0) with Multi-Layer Solar Corona */}
      <group position={[0, 0, 0]} frustumCulled={false}>
        {/* Blazing Incandescent Solar Core */}
        <Sphere args={[1750, 64, 64]} frustumCulled={false}>
          <meshBasicMaterial color="#fffbeb" toneMapped={false} />
        </Sphere>
        {/* High-Power Omnidirectional Solar Illumination */}
        <pointLight intensity={24} distance={150000} decay={0.25} color="#fff1db" />
        {/* Inner Solar Corona Flare Shell */}
        <Sphere args={[1980, 48, 48]} frustumCulled={false}>
          <meshBasicMaterial color="#fbbf24" transparent opacity={0.58} depthWrite={false} toneMapped={false} />
        </Sphere>
        {/* Middle Solar Flare Chromosphere */}
        <Sphere args={[2350, 32, 32]} frustumCulled={false}>
          <meshBasicMaterial color="#f59e0b" transparent opacity={0.26} depthWrite={false} toneMapped={false} />
        </Sphere>
        {/* Extended Cosmic Coronal Halo */}
        <Sphere args={[2950, 24, 24]} frustumCulled={false}>
          <meshBasicMaterial color="#ea580c" transparent opacity={0.13} depthWrite={false} toneMapped={false} />
        </Sphere>
        {/* Ultra-Wide Far Solar Glow (keeps Sun visible even from outer planets) */}
        <Sphere args={[3800, 20, 20]} frustumCulled={false}>
          <meshBasicMaterial color="#f97316" transparent opacity={0.07} depthWrite={false} toneMapped={false} />
        </Sphere>
        <Text
          position={[0, 2150, 0]}
          fontSize={155}
          color="#fef3c7"
          outlineWidth={3}
          outlineColor="#000000"
          frustumCulled={false}
        >
          SOL • CENTRO DO SISTEMA SOLAR
        </Text>
      </group>

      {/* Distant Colorful Galactic Nebulae */}
      {nebulaClouds.map((neb, idx) => (
        <group key={`nebula-${idx}`} position={neb.pos as [number, number, number]}>
          <Sphere args={[neb.scale, 16, 16]}>
            <meshBasicMaterial color={neb.col} transparent opacity={0.06} depthWrite={false} />
          </Sphere>
        </group>
      ))}

      {/* Dense Asteroid Belt (Between Mars & Jupiter) */}
      <Instances limit={500} range={500}>
        <dodecahedronGeometry args={[1, 0]} />
        <meshStandardMaterial color="#64748b" roughness={0.9} metalness={0.15} />
        {asteroids.map((a, i) => (
          <Instance
            key={`ast-${i}`}
            position={[a.x, a.y, a.z]}
            scale={[a.scale, a.scale, a.scale]}
            rotation={[a.rx, a.ry, 0]}
          />
        ))}
      </Instances>

      {/* Monumental, Visually Distinct Planets with Continents & Surface Detail */}
      {planetPositions.map((p) => {
        const isEarth = p.type === 'earth';
        const isJupiter = p.type === 'jupiter';
        const isSaturn = p.hasRings && p.type === 'saturn';
        const isMars = p.type === 'mars';
        const isVenus = p.type === 'venus';
        const isExoplanet = p.type === 'exoplanet';

        return (
          <group key={p.id} position={p.pos}>
            {/* Primary Planetary Sphere with Specialized Realism Textures */}
            {isEarth ? (
              <RealisticEarthGlobe
                radius={p.visualRadius}
                sunDirection={[-p.pos.x, -p.pos.y, -p.pos.z]}
                rotationSpeed={0.012}
                cloudSpeed={0.020}
                earthshine={0.08}
                segments={64}
              />
            ) : isJupiter ? (
              <Sphere args={[p.visualRadius, 64, 64]}>
                <meshStandardMaterial
                  map={jupiterMap || undefined}
                  color="#ffffff"
                  roughness={0.7}
                  metalness={0.05}
                />
              </Sphere>
            ) : isSaturn ? (
              <Sphere args={[p.visualRadius, 64, 64]}>
                <meshStandardMaterial
                  map={saturnMap || undefined}
                  color="#ffffff"
                  roughness={0.75}
                  metalness={0.05}
                />
              </Sphere>
            ) : isMars ? (
              <Sphere args={[p.visualRadius, 48, 48]}>
                <meshStandardMaterial
                  map={marsMap || undefined}
                  color="#ffffff"
                  roughness={0.8}
                  metalness={0.1}
                />
              </Sphere>
            ) : isVenus ? (
              <Sphere args={[p.visualRadius, 48, 48]}>
                <meshStandardMaterial
                  map={venusMap || undefined}
                  color="#ffffff"
                  roughness={0.6}
                  metalness={0.05}
                />
              </Sphere>
            ) : (
              <Sphere args={[p.visualRadius, 48, 48]}>
                <meshStandardMaterial
                  color={p.color || '#e2e8f0'}
                  metalness={0.15}
                  roughness={0.75}
                />
              </Sphere>
            )}

            {/* Glowing Atmospheric Aura / Translucent Atmosphere Shell (Earth uses Rayleigh Fresnel shader) */}
            {!isEarth && (
              <Sphere args={[p.visualRadius * 1.06, 36, 36]}>
                <meshBasicMaterial
                  color={p.atmosphereColor}
                  transparent
                  opacity={0.20}
                  depthWrite={false}
                />
              </Sphere>
            )}

            {/* Saturn / Gas Giant Rings */}
            {isSaturn && (
              <group rotation={[Math.PI / 2.3, 0.2, 0]}>
                {/* Inner Ring A */}
                <mesh>
                  <ringGeometry args={[p.visualRadius * 1.35, p.visualRadius * 2.15, 64]} />
                  <meshStandardMaterial
                    color="#eab308"
                    side={DoubleSide}
                    transparent
                    opacity={0.88}
                    roughness={0.5}
                  />
                </mesh>
                {/* Outer Ring B (Beyond Cassini Division) */}
                <mesh>
                  <ringGeometry args={[p.visualRadius * 2.22, p.visualRadius * 2.65, 64]} />
                  <meshStandardMaterial
                    color="#ca8a04"
                    side={DoubleSide}
                    transparent
                    opacity={0.55}
                    roughness={0.7}
                  />
                </mesh>
              </group>
            )}

            {/* Exoplanet Orbital Energy Ring */}
            {isExoplanet && p.hasRings && (
              <mesh rotation={[Math.PI / 2.5, 0.4, 0]}>
                <ringGeometry args={[p.visualRadius * 1.25, p.visualRadius * 1.85, 48]} />
                <meshBasicMaterial color="#a855f7" side={DoubleSide} transparent opacity={0.65} />
              </mesh>
            )}

            {/* High-Legibility Planetary Identification & NASA Data HUD */}
            <Text
              position={[0, p.visualRadius * 1.25, 0]}
              fontSize={Math.max(34, p.visualRadius * 0.16)}
              color="#ffffff"
              fontWeight="bold"
              outlineWidth={0.8}
              outlineColor="#020617"
            >
              {p.name.toUpperCase()}
            </Text>

            <Text
              position={[0, p.visualRadius * 1.25 - Math.max(34, p.visualRadius * 0.16) * 1.2, 0]}
              fontSize={Math.max(18, p.visualRadius * 0.085)}
              color={p.atmosphereColor}
              fontWeight="bold"
              outlineWidth={0.5}
              outlineColor="#020617"
            >
              {isExoplanet ? 'EXOPLANETA CONFIRMADO (NASA)' : `GRAVIDADE: ${(p.gravity / 9.8).toFixed(2)}G`}
            </Text>
          </group>
        );
      })}

      {/* Controllable Player Spacecraft (Orbital Exploration Capsule / Nave Pequena) */}
      <group ref={rocketRef}>
        <group ref={visualCapsuleRef} rotation={[Math.PI / 2, Math.PI, 0]} scale={1.2}>
          <OrbitalCapsule
            isFlying={isFlying}
            stagingProgress={stagingProgress}
            thrustLevel={rcsState.thrust}
            rcsPitch={rcsState.pitch}
            rcsYaw={rcsState.yaw}
            solarHeatPct={solarState.heatPct}
            isEvaporating={solarState.isEvaporating}
          />
        </group>

        {/* Space Flight Cockpit Telemetry & Orbital Status HUD */}
        <group position={[0, -2.4, -6]}>
          <Text fontSize={0.34} color="#38bdf8" outlineWidth={0.04} outlineColor="#020617">
            {`VELOCIDADE: ${telemetry.speed} km/h • ALVO: ${telemetry.target.toUpperCase()} (${telemetry.distKm} km)`}
          </Text>
          {stagingProgress < 1.0 ? (
            <group position={[0, -0.42, 0]}>
              <Text fontSize={0.22} color="#facc15" fontWeight="bold" outlineWidth={0.03} outlineColor="#020617">
                {stagingProgress < 0.25
                  ? 'ETAPA 1/4: DESACOPLAMENTO PIROTÉCNICO E EJEÇÃO DAS COIFAS PROTETORAS'
                  : stagingProgress < 0.55
                  ? 'ETAPA 2/4: SEPARAÇÃO E RECUO DO 2º ESTÁGIO PROPULSOR (FOGUETE)'
                  : stagingProgress < 0.80
                  ? 'ETAPA 3/4: DESDOBRAMENTO AUTOMÁTICO DAS MATRIZES SOLARES & RCS'
                  : 'ETAPA 4/4: CÁPSULA ORBITAL DE EXPLORAÇÃO ATIVA • COMANDOS TRANSFERIDOS'}
              </Text>
              <Text position={[0, -0.28, 0]} fontSize={0.16} color="#94a3b8" outlineWidth={0.02} outlineColor="#020617">
                {`DESENCAPSULAMENTO EM CURSO: ${Math.round(stagingProgress * 100)}%`}
              </Text>
            </group>
          ) : (
            <Text position={[0, -0.42, 0]} fontSize={0.20} color="#4ade80" fontWeight="bold" outlineWidth={0.02} outlineColor="#020617">
              CÁPSULA ORBITAL DE EXPLORAÇÃO ATIVA • SISTEMAS 100% NOMINAIS (GGPEN)
            </Text>
          )}
        </group>
      </group>
    </>
  );
}
