import React, { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGameStore, PLANETS, PlanetInfo } from '../store';
import {
  Vector3,
  Group,
  Color,
  CanvasTexture,
  MeshStandardMaterial,
  MeshBasicMaterial,
  SRGBColorSpace,
  RepeatWrapping,
  DoubleSide,
  Mesh,
  MathUtils,
} from 'three';
import { RocketModel } from './RocketModel';
import { OrbitalCapsule } from './OrbitalCapsule';
import { Text, Stars, Sphere, Ring, useKeyboardControls, Instances, Instance } from '@react-three/drei';

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

let cachedEarthTexture: CanvasTexture | null = null;
let cachedEarthCloudTexture: CanvasTexture | null = null;
let cachedJupiterTexture: CanvasTexture | null = null;
let cachedSaturnTexture: CanvasTexture | null = null;
let cachedMarsTexture: CanvasTexture | null = null;
let cachedVenusTexture: CanvasTexture | null = null;

function createEarthTextures() {
  if (cachedEarthTexture && cachedEarthCloudTexture) {
    return { earthMap: cachedEarthTexture, cloudMap: cachedEarthCloudTexture };
  }
  if (typeof document === 'undefined') return { earthMap: null, cloudMap: null };

  const w = 1024;
  const h = 512;

  // 1. Earth Surface Map: Deep Sapphire Oceans & Geographic Continents
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    // Deep Ocean Base
    const oceanGrad = ctx.createLinearGradient(0, 0, 0, h);
    oceanGrad.addColorStop(0, '#0a2540');
    oceanGrad.addColorStop(0.2, '#034a87');
    oceanGrad.addColorStop(0.5, '#0284c7');
    oceanGrad.addColorStop(0.8, '#034a87');
    oceanGrad.addColorStop(1, '#0a2540');
    ctx.fillStyle = oceanGrad;
    ctx.fillRect(0, 0, w, h);

    // Continental shelf shallow cyan waters
    ctx.fillStyle = '#06b6d4';

    // Helper: draw smooth landmass polygon
    const drawLand = (points: [number, number][], fillStyle: string) => {
      ctx.fillStyle = fillStyle;
      ctx.beginPath();
      ctx.moveTo(points[0][0], points[0][1]);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i][0], points[i][1]);
      }
      ctx.closePath();
      ctx.fill();
    };

    // AFRICA: Center (Lon ~0° to 50°E, Lat +37°N to -35°S)
    // Sahara Desert (Golden Ochre)
    drawLand([
      [470, 180], [560, 175], [580, 220], [530, 240], [475, 230], [465, 200]
    ], '#d97706');
    // Equatorial & Southern Africa (Rainforests & Savannah)
    drawLand([
      [475, 230], [530, 240], [580, 220], [590, 270], [565, 330],
      [525, 360], [490, 310], [475, 260]
    ], '#15803d');
    // Angola Coastline Highlight (West Southern Africa: Lat -6° to -18°)
    ctx.fillStyle = '#65a30d';
    ctx.beginPath();
    ctx.ellipse(500, 295, 24, 38, -0.2, 0, Math.PI * 2);
    ctx.fill();

    // EUROPE & MEDITERRANEAN
    drawLand([
      [470, 130], [500, 110], [550, 120], [560, 160], [480, 165]
    ], '#16a34a');

    // ASIA & INDIA & HIMALAYAS
    drawLand([
      [560, 120], [680, 100], [800, 130], [830, 210], [740, 230],
      [680, 200], [630, 240], [580, 180]
    ], '#22c55e');
    // Snowy Himalayas
    drawLand([
      [640, 180], [710, 185], [700, 195], [635, 190]
    ], '#f8fafc');

    // NORTH AMERICA
    drawLand([
      [150, 120], [240, 100], [320, 130], [310, 190], [270, 230],
      [220, 220], [180, 170]
    ], '#16a34a');
    // Rocky Mountains
    drawLand([[190, 130], [210, 180], [200, 190], [180, 140]], '#b45309');

    // SOUTH AMERICA & AMAZON BASIN
    drawLand([
      [270, 240], [350, 260], [370, 310], [340, 390], [300, 420],
      [275, 330], [260, 270]
    ], '#15803d');

    // AUSTRALIA
    drawLand([
      [760, 320], [840, 310], [860, 370], [800, 400], [750, 360]
    ], '#c2410c');

    // POLAR ICE CAPS (North Pole & Antarctica)
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, w, 40);
    ctx.fillRect(0, h - 55, w, 55);
  }

  cachedEarthTexture = new CanvasTexture(canvas);
  cachedEarthTexture.colorSpace = SRGBColorSpace;
  cachedEarthTexture.wrapS = RepeatWrapping;
  cachedEarthTexture.wrapT = RepeatWrapping;

  // 2. Translucent Dynamic Cloud Shell Texture
  const cCanvas = document.createElement('canvas');
  cCanvas.width = 512;
  cCanvas.height = 256;
  const cCtx = cCanvas.getContext('2d');
  if (cCtx) {
    cCtx.fillStyle = 'rgba(0,0,0,0)';
    cCtx.fillRect(0, 0, 512, 256);

    // Swirling cloud belts across trade winds and mid-latitudes
    for (let i = 0; i < 400; i++) {
      const x = Math.random() * 512;
      const y = 30 + Math.random() * 196;
      const rx = 15 + Math.random() * 45;
      const ry = 4 + Math.random() * 12;
      cCtx.fillStyle = `rgba(255, 255, 255, ${0.15 + Math.random() * 0.45})`;
      cCtx.beginPath();
      cCtx.ellipse(x, y, rx, ry, (Math.random() - 0.5) * 0.4, 0, Math.PI * 2);
      cCtx.fill();
    }
  }

  cachedEarthCloudTexture = new CanvasTexture(cCanvas);
  cachedEarthCloudTexture.wrapS = RepeatWrapping;
  cachedEarthCloudTexture.wrapT = RepeatWrapping;

  return { earthMap: cachedEarthTexture, cloudMap: cachedEarthCloudTexture };
}

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
  const earthCloudsRef = useRef<Mesh>(null);
  const initializedSpawnRef = useRef(false);
  const { setPlanet, loadExoplanets } = useGameStore();
  const speedRef = useRef(180);
  const pitchVelRef = useRef(0);
  const yawVelRef = useRef(0);
  const rollAngleRef = useRef(0);
  const pitchTiltRef = useRef(0);
  const cameraLookAtRef = useRef(new Vector3());
  const [isFlying, setIsFlying] = useState(true);
  // Staging ("desencapsulamento") happens ONLY ONCE when leaving Earth for the first time
  const initialStaged = useGameStore.getState().hasCompletedInitialStaging || useGameStore.getState().planetIndex !== 0;
  const [stagingProgress, setStagingProgress] = useState(initialStaged ? 1.0 : 0.0);
  const [rcsState, setRcsState] = useState({ pitch: 0, yaw: 0, thrust: 0.4 });
  const [telemetry, setTelemetry] = useState({ speed: 180, target: 'Terra', distKm: 0 });
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
  const { earthMap, cloudMap } = useMemo(() => createEarthTextures(), []);
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
          dist = 2600;
          angle = 0.45;
          break;
        case 'venus':
          visualRadius = 360;
          atmosphereColor = '#fbbf24';
          dist = 4200;
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

      // Snap camera behind capsule on initial frame
      _spaceIdealOffset.set(0, 8.2, 23)
        .applyQuaternion(rocketRef.current.quaternion)
        .add(rocketRef.current.position);
      _spaceIdealLookAt.set(0, 0, -25)
        .applyQuaternion(rocketRef.current.quaternion)
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
      store.setSpaceFlightData({ stagingProgress: nextProgress });
      if (nextProgress >= 1.0 && !store.hasCompletedInitialStaging) {
        store.setHasCompletedInitialStaging(true);
      }
    }

    // Rotate Earth's atmospheric cloud layer
    if (earthCloudsRef.current) {
      earthCloudsRef.current.rotation.y += delta * 0.04;
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

    // Smooth Third-Person Cinematic Follow Camera with subtle speed pullback
    const boostFactor = MathUtils.clamp((speedRef.current - 180) / 1100, 0, 1);
    const camDist = MathUtils.lerp(22.5, 28.0, boostFactor);
    const camHeight = MathUtils.lerp(8.0, 9.2, boostFactor);

    _spaceIdealOffset.set(0, camHeight, camDist)
      .applyQuaternion(rocketRef.current.quaternion)
      .add(rocketRef.current.position);

    _spaceIdealLookAt.set(0, 0, -28)
      .applyQuaternion(rocketRef.current.quaternion)
      .add(rocketRef.current.position);

    const camAlpha = 1 - Math.exp(-10.5 * delta);
    const lookAlpha = 1 - Math.exp(-14.0 * delta);
    state.camera.position.lerp(_spaceIdealOffset, camAlpha);
    cameraLookAtRef.current.lerp(_spaceIdealLookAt, lookAlpha);
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

    // Update telemetry & RCS visual state periodically
    if (Math.floor(state.clock.elapsedTime * 6) % 2 === 0) {
      const currentSpeed = Math.round(speedRef.current);
      const currentTarget = closestPlanet?.name || 'Terra';
      const currentDistKm = parseFloat((minDistance / 100).toFixed(1));
      const normalizedThrust = MathUtils.clamp(speedRef.current / 950, 0.2, 1.35);

      setRcsState({
        pitch: pitchVelRef.current,
        yaw: yawVelRef.current,
        thrust: normalizedThrust,
      });
      setTelemetry({
        speed: currentSpeed,
        target: currentTarget,
        distKm: currentDistKm,
      });
      useGameStore.getState().setSpaceFlightData({
        speed: currentSpeed,
        target: currentTarget,
        distKm: currentDistKm,
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

      {/* Radiant Central Star (Sun) at (0, 0, 0) with Multi-Layer Solar Corona */}
      <group position={[0, 0, 0]}>
        {/* Blazing Incandescent Solar Core */}
        <Sphere args={[1200, 64, 64]}>
          <meshBasicMaterial color="#fffbeb" />
        </Sphere>
        {/* High-Power Omnidirectional Solar Illumination (Boosted to 18) */}
        <pointLight intensity={18} distance={85000} color="#fff1db" />
        {/* Inner Solar Corona Flare Shell */}
        <Sphere args={[1380, 48, 48]}>
          <meshBasicMaterial color="#fbbf24" transparent opacity={0.55} />
        </Sphere>
        {/* Middle Solar Flare Chromosphere */}
        <Sphere args={[1850, 32, 32]}>
          <meshBasicMaterial color="#f59e0b" transparent opacity={0.25} />
        </Sphere>
        {/* Far Extended Cosmic Coronal Halo */}
        <Sphere args={[2600, 24, 24]}>
          <meshBasicMaterial color="#d97706" transparent opacity={0.12} />
        </Sphere>
        <Text position={[0, 1450, 0]} fontSize={110} color="white" outlineWidth={2} outlineColor="#000000">
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
              <group>
                {/* Realistic Earth Body with Continents & Oceans */}
                <Sphere args={[p.visualRadius, 64, 64]}>
                  <meshStandardMaterial
                    map={earthMap || undefined}
                    color="#ffffff"
                    roughness={0.65}
                    metalness={0.08}
                  />
                </Sphere>
                {/* Rotating Swirling Translucent Cloud Layer */}
                <mesh ref={earthCloudsRef}>
                  <sphereGeometry args={[p.visualRadius * 1.018, 48, 48]} />
                  <meshStandardMaterial
                    map={cloudMap || undefined}
                    transparent
                    opacity={0.55}
                    depthWrite={false}
                    color="#ffffff"
                  />
                </mesh>
              </group>
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

            {/* Glowing Atmospheric Aura / Translucent Atmosphere Shell */}
            <Sphere args={[p.visualRadius * 1.06, 36, 36]}>
              <meshBasicMaterial
                color={p.atmosphereColor}
                transparent
                opacity={0.20}
                depthWrite={false}
              />
            </Sphere>

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
          />
        </group>

        {/* Space Flight Cockpit Telemetry & Orbital Status HUD */}
        <group position={[0, -2.4, -6]}>
          <Text fontSize={0.34} color="#38bdf8" outlineWidth={0.04} outlineColor="#020617">
            {`VELOCIDADE: ${telemetry.speed} m/s • ALVO: ${telemetry.target.toUpperCase()} (${telemetry.distKm} km)`}
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
