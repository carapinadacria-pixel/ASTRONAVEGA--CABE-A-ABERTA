import React, { useRef, useMemo, useLayoutEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  Mesh,
  Group,
  DoubleSide,
  CanvasTexture,
  RepeatWrapping,
  MeshStandardMaterial,
  Vector2,
  NoColorSpace,
  InstancedMesh,
  Object3D,
  Color,
  SphereGeometry,
  DodecahedronGeometry,
} from 'three';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import { Text } from '@react-three/drei';
import { GGPENLogoDecal } from './AngolaFlag';
import { useGameStore } from '../store';

// ---------------------------------------------------------------------------
// LIGHTWEIGHT OPTIMIZED OCEAN & SAND TEXTURES (HIGH FPS / ZERO LAG)
// ---------------------------------------------------------------------------
let cachedSandTextures: { diffuse: CanvasTexture | null; normal: CanvasTexture | null } | null = null;
let cachedOceanTextures: { normalMap: CanvasTexture | null; foamMap: CanvasTexture | null } | null = null;

function createRealisticSandTextures() {
  if (cachedSandTextures) return cachedSandTextures;
  if (typeof document === 'undefined') return { diffuse: null, normal: null, wetNormal: null };

  const size = 512;
  // 1. High-Fidelity Tropical Beach Sand Diffuse (Warm golden dunes, fine quartz grains, and tidal contours)
  const dCanvas = document.createElement('canvas');
  dCanvas.width = size;
  dCanvas.height = size;
  const dCtx = dCanvas.getContext('2d');
  if (dCtx) {
    // Soft sunlit warm ivory-golden sand base matching images__17__60b1787d.jpeg
    const baseGrad = dCtx.createLinearGradient(0, 0, size, size);
    baseGrad.addColorStop(0, '#fbf3e4');
    baseGrad.addColorStop(0.5, '#f5e6cc');
    baseGrad.addColorStop(1, '#ebd4ab');
    dCtx.fillStyle = baseGrad;
    dCtx.fillRect(0, 0, size, size);

    // Organic wavy wind ripples & tidal swash contours
    for (let y = 0; y < size; y += 14) {
      const isAlt = Math.floor(y / 14) % 2 === 0;
      dCtx.fillStyle = isAlt ? 'rgba(255, 250, 240, 0.45)' : 'rgba(215, 185, 145, 0.22)';
      dCtx.beginPath();
      dCtx.moveTo(0, y);
      for (let x = 0; x <= size; x += 16) {
        const waveOffset = Math.sin((x / size) * Math.PI * 6 + y * 0.08) * 4.5 +
                           Math.cos((x / size) * Math.PI * 3 + y * 0.03) * 3.0;
        dCtx.lineTo(x, y + waveOffset);
      }
      dCtx.lineTo(size, y + 14);
      dCtx.lineTo(0, y + 14);
      dCtx.closePath();
      dCtx.fill();
    }

    // Micro sand grains, sparkling quartz crystals, and crushed golden shells
    const grainColors = [
      '#ffffff', '#fffbeb', '#fef3c7', '#fde68a', '#f59e0b',
      '#d97706', '#fdf4dc', '#faebd7', '#f5deb3', '#e6c8a0'
    ];
    for (let i = 0; i < 7000; i++) {
      const gx = Math.random() * size;
      const gy = Math.random() * size;
      const r = 0.8 + Math.random() * 1.4;
      dCtx.fillStyle = grainColors[i % grainColors.length];
      dCtx.fillRect(gx, gy, r, r);
    }
  }

  const diffuse = new CanvasTexture(dCanvas);
  diffuse.wrapS = RepeatWrapping;
  diffuse.wrapT = RepeatWrapping;
  diffuse.repeat.set(16, 50);

  // 2. Continuous Organic Sand Wave Ripple Normal Map for 3D depth
  const nCanvas = document.createElement('canvas');
  nCanvas.width = 256;
  nCanvas.height = 256;
  const nCtx = nCanvas.getContext('2d');
  if (nCtx) {
    nCtx.fillStyle = '#8080ff';
    nCtx.fillRect(0, 0, 256, 256);

    // Smooth sinusoidal wave ripples created by wind and gentle surf
    for (let y = 0; y < 256; y++) {
      const ripple = Math.sin((y / 256) * Math.PI * 18);
      const rVal = Math.floor(128 + ripple * 28);
      const bVal = Math.floor(255 - Math.abs(ripple) * 20);
      nCtx.fillStyle = `rgb(${rVal}, ${rVal}, ${bVal})`;
      nCtx.fillRect(0, y, 256, 1);
    }

    // Micro grain bump distribution
    for (let i = 0; i < 1200; i++) {
      const gx = Math.random() * 256;
      const gy = Math.random() * 256;
      const light = Math.random() > 0.5;
      nCtx.fillStyle = light ? '#a8a8ff' : '#6868ff';
      nCtx.fillRect(gx, gy, 1.8, 1.8);
    }
  }
  const normal = new CanvasTexture(nCanvas);
  normal.colorSpace = NoColorSpace;
  normal.wrapS = RepeatWrapping;
  normal.wrapT = RepeatWrapping;
  normal.repeat.set(16, 50);

  cachedSandTextures = { diffuse, normal };
  return cachedSandTextures;
}

function createOceanTextures() {
  if (cachedOceanTextures) return cachedOceanTextures;
  if (typeof document === 'undefined') return { normalMap: null, foamMap: null };

  const size = 512;
  // 1. High-Fidelity Atlantic Ocean Surface Normal Map (Multi-scale wave crests & capillary ripples)
  const nCanvas = document.createElement('canvas');
  nCanvas.width = size;
  nCanvas.height = size;
  const nCtx = nCanvas.getContext('2d');
  if (nCtx) {
    nCtx.fillStyle = '#8080ff';
    nCtx.fillRect(0, 0, size, size);

    const imgData = nCtx.createImageData(size, size);
    const data = imgData.data;

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const u = x / size;
        const v = y / size;

        // Natural multi-octave organic marine wavelet synthesis without sharp parallel banding
        const wave1 = Math.sin(u * 16.0 + v * 10.0);
        const wave2 = Math.cos(u * 26.0 - v * 18.0) * 0.45;
        const wave3 = Math.sin(u * 12.0 - v * 22.0) * 0.30;
        const wave4 = Math.sin(Math.hypot(u - 0.5, v - 0.5) * 36.0) * 0.20;
        const totalWave = (wave1 + wave2 + wave3 + wave4) * 0.5;

        // Soft, smooth surface gradients for gentle translucent ocean ripples
        const dx = (Math.cos(u * 16.0 + v * 10.0) * 16 - Math.sin(u * 26.0 - v * 18.0) * 12) * 0.22;
        const dy = (Math.cos(u * 16.0 + v * 10.0) * 10 + Math.sin(u * 26.0 - v * 18.0) * 9) * 0.22;

        const nx = Math.floor(128 + Math.max(-65, Math.min(65, dx)));
        const ny = Math.floor(128 + Math.max(-65, Math.min(65, dy)));
        const nz = Math.floor(255 - Math.min(25, Math.abs(totalWave) * 12));

        const idx = (y * size + x) * 4;
        data[idx] = nx;
        data[idx + 1] = ny;
        data[idx + 2] = nz;
        data[idx + 3] = 255;
      }
    }
    nCtx.putImageData(imgData, 0, 0);

    // Subtle gentle water capillary caustics (soft blurs, zero harsh glitter)
    for (let i = 0; i < 600; i++) {
      const rx = Math.random() * size;
      const ry = Math.random() * size;
      const rad = 1.5 + Math.random() * 3.0;
      nCtx.fillStyle = 'rgba(180, 180, 255, 0.18)';
      nCtx.beginPath();
      nCtx.arc(rx, ry, rad, 0, Math.PI * 2);
      nCtx.fill();
    }
  }

  const normalMap = new CanvasTexture(nCanvas);
  normalMap.colorSpace = NoColorSpace;
  normalMap.wrapS = RepeatWrapping;
  normalMap.wrapT = RepeatWrapping;
  normalMap.repeat.set(12, 12);

  // 2. High-Resolution Organic Seafoam Texture (Lacy foam bubbles & wave wash lines)
  const fCanvas = document.createElement('canvas');
  fCanvas.width = 256;
  fCanvas.height = 256;
  const fCtx = fCanvas.getContext('2d');
  if (fCtx) {
    fCtx.fillStyle = '#000000';
    fCtx.fillRect(0, 0, 256, 256);

    // Frothy seafoam lace networks
    for (let j = 0; j < 1400; j++) {
      const x = Math.random() * 256;
      const y = Math.random() * 256;
      const rad = 0.8 + Math.random() * 4.2;
      const alpha = 0.35 + Math.random() * 0.65;
      fCtx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      fCtx.beginPath();
      fCtx.arc(x, y, rad, 0, Math.PI * 2);
      fCtx.fill();
    }

    // Elongated wave froth filaments
    fCtx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    fCtx.lineWidth = 1.5;
    for (let k = 0; k < 60; k++) {
      const y = Math.random() * 256;
      fCtx.beginPath();
      fCtx.moveTo(0, y);
      fCtx.bezierCurveTo(
        80, y + (Math.random() - 0.5) * 20,
        180, y + (Math.random() - 0.5) * 20,
        256, y
      );
      fCtx.stroke();
    }
  }
  const foamMap = new CanvasTexture(fCanvas);
  foamMap.wrapS = RepeatWrapping;
  foamMap.wrapT = RepeatWrapping;
  foamMap.repeat.set(16, 4);

  cachedOceanTextures = { normalMap, foamMap };
  return cachedOceanTextures;
}

// ---------------------------------------------------------------------------
// REAL PHYSICAL 3D WAVE SIMULATION FUNCTION (SHARED WITH PLAYER PHYSICS)
// Waves travel shoreward (+X towards -28) with sharp trochoidal crests
// ---------------------------------------------------------------------------
export function getOceanWaveHeight(x: number, z: number, time: number): number {
  if (x > -26) return 0; // Completely on dry land
  const depthFactor = Math.min(1.0, Math.max(0, (-26 - x) / 7.0));
  // Shoreward wave propagation (+X direction) with Gerstner peaked crests
  const p1 = Math.sin(x * 0.16 - time * 1.5 + z * 0.03);
  const w1 = Math.sign(p1) * Math.pow(Math.abs(p1), 0.72) * 0.42;
  const w2 = Math.sin((x * 0.26 + z * 0.08) - time * 2.2) * 0.16;
  const w3 = Math.cos(x * 0.07 - time * 0.8) * 0.18;
  return (w1 + w2 + w3) * depthFactor;
}

// ---------------------------------------------------------------------------
// 1. DYNAMIC OCEAN WATER SURFACE WITH REAL 3D ROLLING SWELLS & SHORELINE SURF
// ---------------------------------------------------------------------------
function DynamicWaterSurface() {
  const waterMeshRef = useRef<Mesh>(null);
  const coastalWaterRef = useRef<Mesh>(null);
  const surfWaveRef = useRef<Mesh>(null);
  const foamMeshRef = useRef<Mesh>(null);
  const timeUniform = useRef({ value: 0 });
  const { normalMap, foamMap } = useMemo(() => createOceanTextures(), []);

  // Configure professional vibrant Atlantic Ocean material with soft translucent ripples and natural lighting
  const oceanMaterial = useMemo(() => {
    const mat = new MeshStandardMaterial({
      color: '#0284c7', // Radiant illuminated Atlantic oceanic cerulean blue
      roughness: 0.32,  // Softer specular surface that diffuses sunlight naturally without harsh white glare bands
      metalness: 0.04,  // Physically accurate dielectric water reflection
      emissive: '#0284c7', // Luminous ocean self-radiance
      emissiveIntensity: 0.22,
      normalMap: normalMap || undefined,
      normalScale: new Vector2(0.24, 0.24), // Subtle, organic water ripples
      depthWrite: true,
    });
    return mat;
  }, [normalMap]);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    timeUniform.current.value = t;

    // 1. Dual-directional wave normal scrolling for dynamic flowing ripples
    if (normalMap) {
      normalMap.offset.x = (t * 0.030) % 1;
      normalMap.offset.y = (t * 0.015) % 1;
    }

    // 2. Dynamic Shoreline Surf Wave (Advances up beach to X = -30.0 and recedes to X = -35.5)
    const waveCycle = Math.sin(t * 1.5);
    if (surfWaveRef.current) {
      surfWaveRef.current.position.x = -33.0 + waveCycle * 2.8;
      surfWaveRef.current.position.y = -0.26 + Math.max(0, waveCycle) * 0.38;
      const mat = surfWaveRef.current.material as any;
      if (mat) {
        mat.opacity = 0.58 + Math.max(0, waveCycle) * 0.24;
      }
    }

    // 3. White seafoam ribbon expanding as wave hits shore and dissolving on recession
    if (foamMeshRef.current) {
      foamMeshRef.current.position.x = -32.5 + waveCycle * 2.9;
      foamMeshRef.current.position.y = -0.20 + Math.max(0, waveCycle) * 0.34;
      const mat = foamMeshRef.current.material as any;
      if (mat) {
        mat.opacity = 0.40 + (waveCycle + 1) * 0.22;
      }
    }
  });

  return (
    <group>
      {/* 1. Coastal Swell Zone (X = -27 to -73, width 46m, length 4000m) - Animated 3D Rolling Waves */}
      <mesh
        position={[-50.0, 0, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        material={oceanMaterial}
      >
        <planeGeometry args={[46, 4000, 48, 48]} />
      </mesh>

      {/* 2. Expansive Deep Atlantic Ocean Body (X = -50 to -3200, width 3150m, length 5000m) - Continuous Vibrant Horizon */}
      <mesh
        ref={waterMeshRef}
        position={[-1625, 0, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        material={oceanMaterial}
      >
        <planeGeometry args={[3150, 5000, 32, 32]} />
      </mesh>

      {/* 3. Nearshore Translucent Aquamarine Shimmer Overlay */}
      <mesh
        ref={coastalWaterRef}
        position={[-35.5, -0.012, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[18, 4000]} />
        <meshStandardMaterial
          color="#06b6d4" // Crystalline coastal aquamarine matching images__17__60b1787d.jpeg
          emissive="#0891b2"
          emissiveIntensity={0.20}
          roughness={0.28}
          metalness={0.04}
          normalMap={normalMap || undefined}
          normalScale={[0.24, 0.24]}
          transparent
          opacity={0.82}
          side={DoubleSide}
        />
      </mesh>

      {/* 4. Animated Rolling Translucent Surf Wave Crest */}
      <mesh
        ref={surfWaveRef}
        position={[-33.0, -0.26, 0]}
        rotation={[-Math.PI / 2, -0.14, 0]}
      >
        <planeGeometry args={[4.2, 4000]} />
        <meshStandardMaterial
          color="#38bdf8" // Translucent wave crest glowing in sunlight
          emissive="#0284c7"
          emissiveIntensity={0.20}
          roughness={0.28}
          metalness={0.05}
          transparent
          opacity={0.70}
          side={DoubleSide}
        />
      </mesh>

      {/* 5. Natural Delicate Seafoam Line */}
      <mesh
        ref={foamMeshRef}
        position={[-32.5, -0.20, 0]}
        rotation={[-Math.PI / 2, -0.13, 0]}
      >
        <planeGeometry args={[3.8, 4000]} />
        <meshStandardMaterial
          map={foamMap || undefined}
          color="#ffffff" // Crisp sparkling white seafoam
          roughness={0.8}
          transparent
          opacity={0.78}
          side={DoubleSide}
        />
      </mesh>
    </group>
  );
}

// Reusable singletons for instanced breakwater boulders and pebbles
let _boulderGeom: DodecahedronGeometry | null = null;
let _boulderMat: MeshStandardMaterial | null = null;
let _pebbleGeom: SphereGeometry | null = null;
let _pebbleMat: MeshStandardMaterial | null = null;
const _instDummy = new Object3D();
const _instColor = new Color();

// Ultra-performant Instanced Breakwater Granite Boulders (1 draw call instead of 28)
function InstancedRiprapBoulders({
  boulders,
}: {
  boulders: Array<{ pos: [number, number, number]; scale: [number, number, number]; rot: number; col: string }>;
}) {
  const meshRef = useRef<InstancedMesh>(null);
  const { geom, mat } = useMemo(() => {
    if (!_boulderGeom) _boulderGeom = new DodecahedronGeometry(1, 1);
    if (!_boulderMat) _boulderMat = new MeshStandardMaterial({ roughness: 0.88 });
    return { geom: _boulderGeom, mat: _boulderMat };
  }, []);

  useLayoutEffect(() => {
    if (!meshRef.current) return;
    const dummy = _instDummy;
    const tempColor = _instColor;
    boulders.forEach((b, idx) => {
      dummy.position.set(b.pos[0], b.pos[1], b.pos[2]);
      dummy.rotation.set(0, b.rot, 0);
      dummy.scale.set(b.scale[0], b.scale[1], b.scale[2]);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(idx, dummy.matrix);
      meshRef.current!.setColorAt(idx, tempColor.set(b.col));
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true;
    }
  }, [boulders]);

  return <instancedMesh ref={meshRef} args={[geom, mat, boulders.length]} receiveShadow />;
}

// Ultra-performant Instanced Beach Pebbles (1 draw call instead of 35)
function InstancedBeachPebbles({
  pebbles,
}: {
  pebbles: Array<{ pos: [number, number, number]; scale: [number, number, number]; rot: number; col: string }>;
}) {
  const meshRef = useRef<InstancedMesh>(null);
  const { geom, mat } = useMemo(() => {
    if (!_pebbleGeom) _pebbleGeom = new SphereGeometry(1, 8, 8);
    if (!_pebbleMat) _pebbleMat = new MeshStandardMaterial({ roughness: 0.6 });
    return { geom: _pebbleGeom, mat: _pebbleMat };
  }, []);

  useLayoutEffect(() => {
    if (!meshRef.current) return;
    const dummy = _instDummy;
    const tempColor = _instColor;
    pebbles.forEach((p, idx) => {
      dummy.position.set(p.pos[0], p.pos[1], p.pos[2]);
      dummy.rotation.set(0, p.rot, 0);
      dummy.scale.set(p.scale[0], p.scale[1], p.scale[2]);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(idx, dummy.matrix);
      meshRef.current!.setColorAt(idx, tempColor.set(p.col));
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true;
    }
  }, [pebbles]);

  return <instancedMesh ref={meshRef} args={[geom, mat, pebbles.length]} receiveShadow />;
}

// ---------------------------------------------------------------------------
// 2. REALISTIC SLOPING GOLDEN SAND BEACH, DUNES & GRANITE BREAKWATER
// ---------------------------------------------------------------------------
function CoastalBeachAndRiprap() {
  const { diffuse, normal } = useMemo(() => createRealisticSandTextures(), []);

  const boulders = useMemo(() => {
    const list: { pos: [number, number, number]; scale: [number, number, number]; rot: number; col: string }[] = [];
    const colors = ['#64748b', '#475569', '#52525b', '#71717a'];
    for (let i = 0; i < 28; i++) {
      const z = -140 + i * 10;
      const x = -30.5 + (Math.sin(i * 1.8) * 1.4);
      const sx = 1.3 + (i % 3) * 0.3;
      const sy = 0.7 + (i % 2) * 0.3;
      const sz = 1.4 + (i % 3) * 0.3;
      const rot = i * 1.2;
      const col = colors[i % colors.length];
      list.push({ pos: [x, -0.15, z], scale: [sx, sy, sz], rot, col });
    }
    return list;
  }, []);

  // Smooth beach pebbles scattered along the tide line
  const pebbles = useMemo(() => {
    return Array.from({ length: 35 }).map((_, i) => ({
      pos: [-33 - (i % 5) * 1.4, -0.35 - (i % 3) * 0.15, -120 + i * 7.5] as [number, number, number],
      scale: [0.15 + (i % 3) * 0.08, 0.08, 0.2 + (i % 4) * 0.08] as [number, number, number],
      rot: i * 0.8,
      col: ['#78716c', '#a8a29e', '#57534e', '#d6d3d1'][i % 4],
    }));
  }, []);

  return (
    <group>
      {/* 0. Wide Upper Golden Sand Dunes (X = -16 to -27, Width 11.0m, flush at Y = 0 seamlessly meeting the lawn) */}
      <mesh
        position={[-21.5, 0.0, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[11.0, 4000]} />
        <meshStandardMaterial
          map={diffuse || undefined}
          normalMap={normal || undefined}
          normalScale={[0.7, 0.7]}
          color="#fdf6e6"
          roughness={0.92}
          side={DoubleSide}
        />
      </mesh>

      {/* 1. Upper Coastal Dry Sand Dunes (X = -27 to -32, Slopes Y: -0.04 to -0.3) */}
      <mesh
        position={[-29.5, -0.16, 0]}
        rotation={[-Math.PI / 2, -0.06, 0]}
        receiveShadow
      >
        <planeGeometry args={[5.2, 4000]} />
        <meshStandardMaterial
          map={diffuse || undefined}
          normalMap={normal || undefined}
          normalScale={[0.7, 0.7]}
          color="#f6ebd4"
          roughness={0.92}
          side={DoubleSide}
        />
      </mesh>

      {/* 2. Mid Intertidal Compact Beach Sand (X = -32 to -37, Slopes Y: -0.3 to -1.0) */}
      <mesh
        position={[-34.5, -0.65, 0]}
        rotation={[-Math.PI / 2, -0.14, 0]}
        receiveShadow
      >
        <planeGeometry args={[5.4, 4000]} />
        <meshStandardMaterial
          map={diffuse || undefined}
          normalMap={normal || undefined}
          normalScale={[0.6, 0.6]}
          color="#eedbbd"
          roughness={0.65}
          side={DoubleSide}
        />
      </mesh>

      {/* 3. Wet Mirror Tide Swash Zone with Sky Reflections (X = -37 to -44, Slopes Y: -1.0 to -2.3) */}
      <mesh
        position={[-40.5, -1.65, 0]}
        rotation={[-Math.PI / 2, -0.20, 0]}
        receiveShadow
      >
        <planeGeometry args={[7.2, 4000]} />
        <meshStandardMaterial
          map={diffuse || undefined}
          normalMap={normal || undefined}
          normalScale={[0.35, 0.35]}
          color="#d4be9c" // Wet tide-washed sand with glossy surface sheen
          roughness={0.12}
          metalness={0.52}
          side={DoubleSide}
        />
      </mesh>

      {/* 4. Submerged Wave-Carved Seabed Shelf under nearshore ocean (X = -44 to -90, Slopes Y: -2.3 to -7.5) */}
      <mesh
        position={[-67.0, -4.9, 0]}
        rotation={[-Math.PI / 2, -0.11, 0]}
      >
        <planeGeometry args={[48, 4000]} />
        <meshStandardMaterial
          map={diffuse || undefined}
          normalMap={normal || undefined}
          normalScale={[0.5, 0.5]}
          color="#1e7898" // Illuminated submerged sand & turquoise marine sediment
          roughness={0.7}
          side={DoubleSide}
        />
      </mesh>

      {/* 5. Vast Deep Ocean Seabed Floor (X = -50 to -3200, width 3150m, length 5000m, Y = -8.5m) - Never black underneath */}
      <mesh
        position={[-1625, -8.5, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[3150, 5000]} />
        <meshStandardMaterial
          color="#0284c7" // Deep luminous turquoise-sapphire ocean floor
          emissive="#0369a1"
          emissiveIntensity={0.42}
          roughness={0.75}
          side={DoubleSide}
        />
      </mesh>

      {/* Smooth Sea-Polished Pebbles on the Shore in 1 SINGLE INSTANCED DRAW CALL */}
      <InstancedBeachPebbles pebbles={pebbles} />

      {/* Natural Breakwater Granite Boulders in 1 SINGLE INSTANCED DRAW CALL */}
      <InstancedRiprapBoulders boulders={boulders} />
    </group>
  );
}

// ---------------------------------------------------------------------------
// 3. SEAWALL PROMENADE & SAFETY RAILING (Posicionado imediatamente a X = -27)
// ---------------------------------------------------------------------------
function SeawallPromenade() {
  return (
    <group position={[-27, 0, 0]}>
      {/* Main Concrete Seawall Promenade Slab along the edge of Launch Complex */}
      <RigidBody type="fixed" colliders="cuboid" position={[0, 0.08, 0]}>
        <mesh receiveShadow>
          <boxGeometry args={[4.4, 0.32, 160]} />
          <meshStandardMaterial color="#64748b" roughness={0.7} metalness={0.1} />
        </mesh>
      </RigidBody>

      {/* Edge Curb along the ocean drop - Split with Open Gateway for Beach (Z: -14 to -6) and Pier (Z: 16 to 24) */}
      {/* South Curb Section: Z = -78 to -14 */}
      <mesh position={[-2.15, 0.20, -46]} receiveShadow>
        <boxGeometry args={[0.3, 0.18, 64]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.5} />
      </mesh>
      {/* Mid Curb Section: Z = -6 to +16 */}
      <mesh position={[-2.15, 0.20, 5]} receiveShadow>
        <boxGeometry args={[0.3, 0.18, 22]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.5} />
      </mesh>
      {/* North Curb Section: Z = +24 to +78 */}
      <mesh position={[-2.15, 0.20, 51]} receiveShadow>
        <boxGeometry args={[0.3, 0.18, 54]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.5} />
      </mesh>

      {/* Seamless East Ground Approach Ramp: Leads from Launch Ground (Y=0.0 at X=-21.5) up onto Promenade (Y=0.24 at X=-24.8) at Z=14 to 26 */}
      <RigidBody type="fixed" colliders={false} friction={0.0}>
        <CuboidCollider
          args={[1.75, 0.04, 5.5]}
          position={[3.65, 0.12, 20]}
          rotation={[0, 0, 0.068]}
          friction={0.0}
        />
      </RigidBody>
      <mesh position={[3.65, 0.12, 20]} rotation={[0, 0, 0.068]} receiveShadow>
        <boxGeometry args={[3.5, 0.04, 11.0]} />
        <meshStandardMaterial color="#475569" roughness={0.6} metalness={0.2} />
      </mesh>
      {/* Ground Ramp Safety Nosing */}
      <mesh position={[1.92, 0.24, 20]} receiveShadow>
        <boxGeometry args={[0.08, 0.02, 11.0]} />
        <meshStandardMaterial color="#eab308" roughness={0.4} />
      </mesh>

      {/* Smooth Continuous Seamless Transition Bridge Ramp connecting Promenade (Y=0.24) to Pier Deck (Y=0.38) at Z=16 to 24 */}
      <RigidBody type="fixed" colliders={false} friction={0.0}>
        <CuboidCollider
          args={[2.5, 0.06, 3.2]}
          position={[0.0, 0.28, 20]}
          rotation={[0, 0, -0.028]}
          friction={0.0}
        />
      </RigidBody>
      <mesh position={[0.0, 0.28, 20]} rotation={[0, 0, -0.028]} receiveShadow>
        <boxGeometry args={[5.0, 0.06, 6.2]} />
        <meshStandardMaterial color="#334155" roughness={0.5} metalness={0.5} />
      </mesh>
      {/* High-Visibility Safety Yellow Edge Strips along the transition ramp */}
      {[-3.05, 3.05].map((zEdge, zei) => (
        <mesh key={`pier-bridge-strip-${zei}`} position={[0.0, 0.315, 20 + zEdge]} rotation={[0, 0, -0.028]}>
          <boxGeometry args={[5.0, 0.02, 0.12]} />
          <meshStandardMaterial color="#eab308" roughness={0.3} metalness={0.2} />
        </mesh>
      ))}

      {/* ============================================================== */}
      {/* SOLID IMPASSABLE PHYSICAL COLLIDERS FOR COASTAL SEAWALL        */}
      {/* Blocks player from walking through railings; leaves Beach (Z=-14 to -6) */}
      {/* and Pier Bridge (Z=15.5 to 24.5) 100% unobstructed!            */}
      {/* ============================================================== */}
      <RigidBody type="fixed" colliders={false} friction={0.2} restitution={0}>
        {/* South Impassable Wall Collider (Z = -78 to -14) */}
        <CuboidCollider
          position={[-2.12, 0.95, -46]}
          args={[0.25, 0.75, 32]}
        />
        {/* Mid Impassable Wall Collider (Z = -6 to +15.5) */}
        <CuboidCollider
          position={[-2.12, 0.95, 4.75]}
          args={[0.25, 0.75, 10.75]}
        />
        {/* North Impassable Wall Collider (Z = +24.5 to +78) */}
        <CuboidCollider
          position={[-2.12, 0.95, 51.25]}
          args={[0.25, 0.75, 26.75]}
        />
      </RigidBody>

      {/* ============================================================== */}
      {/* HIGH-VISIBILITY MODERN AEROSPACE MARINE SEAWALL BARRIERS       */}
      {/* Bold, thick, high-contrast brushed stainless steel & titanium  */}
      {/* ============================================================== */}
      {/* South Railing Section: Z = -78 to -14 (Length = 64m) */}
      <group position={[-2.12, 0, -46]}>
        {/* Top Heavy Tubular Handrail with Safety Accent */}
        <mesh position={[0, 1.18, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.06, 0.06, 64, 16]} />
          <meshStandardMaterial color="#f8fafc" metalness={0.95} roughness={0.15} />
        </mesh>
        <mesh position={[-0.04, 1.21, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.02, 0.02, 64, 8]} />
          <meshStandardMaterial color="#eab308" metalness={0.7} roughness={0.3} />
        </mesh>
        {/* Mid Knee-Height Tubular Rail */}
        <mesh position={[0, 0.72, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.045, 0.045, 64, 16]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.2} />
        </mesh>
        {/* Lower Toe Kick Plate Rail */}
        <mesh position={[0, 0.36, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.035, 0.035, 64, 12]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.85} roughness={0.3} />
        </mesh>
      </group>

      {/* Mid Railing Section: Z = -6 to +15.5 (Length = 21.5m) */}
      <group position={[-2.12, 0, 4.75]}>
        {/* Top Rail */}
        <mesh position={[0, 1.18, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.06, 0.06, 21.5, 16]} />
          <meshStandardMaterial color="#f8fafc" metalness={0.95} roughness={0.15} />
        </mesh>
        <mesh position={[-0.04, 1.21, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.02, 0.02, 21.5, 8]} />
          <meshStandardMaterial color="#eab308" metalness={0.7} roughness={0.3} />
        </mesh>
        {/* Mid Rail */}
        <mesh position={[0, 0.72, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.045, 0.045, 21.5, 16]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.2} />
        </mesh>
        {/* Lower Rail */}
        <mesh position={[0, 0.36, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.035, 0.035, 21.5, 12]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.85} roughness={0.3} />
        </mesh>
      </group>

      {/* Far North Railing Section: Z = +24.5 to +78 (Length = 53.5m) */}
      <group position={[-2.12, 0, 51.25]}>
        {/* Top Rail */}
        <mesh position={[0, 1.18, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.06, 0.06, 53.5, 16]} />
          <meshStandardMaterial color="#f8fafc" metalness={0.95} roughness={0.15} />
        </mesh>
        <mesh position={[-0.04, 1.21, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.02, 0.02, 53.5, 8]} />
          <meshStandardMaterial color="#eab308" metalness={0.7} roughness={0.3} />
        </mesh>
        {/* Mid Rail */}
        <mesh position={[0, 0.72, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.045, 0.045, 53.5, 16]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.2} />
        </mesh>
        {/* Lower Rail */}
        <mesh position={[0, 0.36, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.035, 0.035, 53.5, 12]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.85} roughness={0.3} />
        </mesh>
      </group>

      {/* Reinforced Vertical Stanchion Posts with Base Flanges & Reflectors */}
      {Array.from({ length: 32 }).map((_, i) => {
        const z = -77 + i * 5.0;
        // Keep Gateways 100% Free: Beach Access (Z = -14 to -6) and Pier Access (Z = 15.5 to 24.5)
        if ((z >= -14.2 && z <= -5.8) || (z >= 15.2 && z <= 24.8)) return null;
        return (
          <group key={`marine-stanchion-${i}`} position={[-2.12, 0.28, z]}>
            {/* Base Mounting Flange with Anchor Bolts */}
            <mesh position={[0, 0.04, 0]} receiveShadow>
              <cylinderGeometry args={[0.14, 0.16, 0.08, 12]} />
              <meshStandardMaterial color="#0f172a" metalness={0.9} />
            </mesh>
            {/* Main Vertical Titanium Post */}
            <mesh position={[0, 0.54, 0]} castShadow>
              <cylinderGeometry args={[0.065, 0.075, 1.0, 16]} />
              <meshStandardMaterial color="#1e293b" metalness={0.9} roughness={0.2} />
            </mesh>
            {/* Amber Safety Marine Reflector */}
            <mesh position={[0.07, 0.75, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.025, 0.025, 0.04, 12]} />
              <meshBasicMaterial color="#eab308" />
            </mesh>
          </group>
        );
      })}

      {/* Illuminated Gateway Portal Bollards at Beach (Z=-14, -6) and Pier Entrance (Flanked wide at Z=15.0, 25.0 to guarantee zero collision blockage) */}
      {[-14, -6, 15.0, 25.0].map((bz) => (
        <group key={`beach-bollard-${bz}`} position={[-2.12, 0.4, bz]}>
          <mesh>
            <cylinderGeometry args={[0.08, 0.1, 0.8, 12]} />
            <meshStandardMaterial color="#0284c7" metalness={0.8} roughness={0.3} />
          </mesh>
          <mesh position={[0, 0.42, 0]}>
            <sphereGeometry args={[0.08, 12, 12]} />
            <meshBasicMaterial color="#38bdf8" />
          </mesh>
        </group>
      ))}

      {/* Solar Marine Path Lights */}
      {[-60, -30, 0, 30, 60].map((z, l) => (
        <group key={`marine-light-${l}`} position={[-1.2, 0.24, z]}>
          <mesh position={[0, 1.3, 0]}>
            <cylinderGeometry args={[0.04, 0.05, 2.6, 8]} />
            <meshStandardMaterial color="#1e293b" metalness={0.8} />
          </mesh>
          <mesh position={[0, 2.6, 0]}>
            <sphereGeometry args={[0.12, 10, 10]} />
            <meshBasicMaterial color="#fef08a" />
          </mesh>
        </group>
      ))}

      {/* Safety Signage: ACESSO À PRAIA & OCEANO • ZONA COSTEIRA */}
      <group position={[-2.14, 0.85, -10]} rotation={[0, Math.PI / 2, 0]}>
        <mesh>
          <planeGeometry args={[2.8, 0.75]} />
          <meshStandardMaterial color="#0f172a" roughness={0.4} />
        </mesh>
        <Text
          position={[0, 0.16, 0.01]}
          fontSize={0.11}
          color="#38bdf8"
          fontWeight="bold"
          anchorX="center"
        >
          ACESSO À PRAIA & OCEANO ATLÂNTICO
        </Text>
        <Text
          position={[0, -0.06, 0.01]}
          fontSize={0.075}
          color="#e2f952"
          anchorX="center"
        >
          COMPLEXO ESPACIAL GGPEN • ZONA BALNEAR
        </Text>
      </group>

      {/* Stone Steps and Gentle Boardwalk Ramp down to the sandy beach at Z = -10 */}
      <group position={[-2.1, 0, -10]}>
        <RigidBody type="fixed" colliders={false} friction={0.0}>
          {/* Smooth uninterrupted climbing incline from beach sand to promenade */}
          <CuboidCollider args={[2.6, 0.28, 4.4]} position={[-2.2, -0.06, 0]} rotation={[0, 0, 0.12]} friction={0.0} />
          <CuboidCollider args={[1.4, 0.12, 4.4]} position={[-4.2, -0.32, 0]} friction={0.0} />
          <CuboidCollider args={[1.4, 0.12, 4.4]} position={[-0.2, 0.14, 0]} friction={0.0} />
        </RigidBody>
        {Array.from({ length: 9 }).map((_, s) => (
          <mesh key={`beach-step-${s}`} position={[-s * 0.45, 0.14 - s * 0.055, 0]} receiveShadow>
            <boxGeometry args={[0.5, 0.12, 8.4]} />
            <meshStandardMaterial color={s % 2 === 0 ? '#78716c' : '#a8a29e'} roughness={0.85} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

// ---------------------------------------------------------------------------
// 4. SPACEPORT MARINE TELEMETRY PIER (Posicionado a X = -42, Z = 20)
// With Official Iron Opening, Marine Ladder, Yellow Handrails & Water-to-Deck Climb Physics
// ---------------------------------------------------------------------------
function MarineTelemetryPier() {
  const radarRef = useRef<Group>(null);

  useFrame((state) => {
    if (radarRef.current) {
      radarRef.current.rotation.y = state.clock.getElapsedTime() * 1.2;
    }
  });

  return (
    <group position={[-42, 0, 20]}>
      {/* Main Pier Deck extending 30m out over the ocean (X: -15 to +15) - Visual Mesh */}
      <mesh position={[0, 0.22, 0]} receiveShadow>
        <boxGeometry args={[30, 0.32, 5.5]} />
        <meshStandardMaterial color="#334155" metalness={0.7} roughness={0.4} />
      </mesh>

      {/* Pier Heavy Submerged Concrete Pilings */}
      {[-12, -6, 0, 6, 12].map((px, idx) => (
        <group key={`piling-${idx}`} position={[px, -1.0, 0]}>
          {[-2.0, 2.0].map((pz, idz) => (
            <mesh key={`col-${idz}`} position={[0, 0, pz]} receiveShadow>
              <cylinderGeometry args={[0.32, 0.38, 2.4, 12]} />
              <meshStandardMaterial color="#475569" roughness={0.9} />
            </mesh>
          ))}
          <mesh position={[0, 1.0, 0]}>
            <boxGeometry args={[0.6, 0.35, 4.8]} />
            <meshStandardMaterial color="#1e293b" metalness={0.8} />
          </mesh>
        </group>
      ))}

      {/* ============================================================== */}
      {/* PIER PERIMETER HANDRAILS & SOLID BARRIER COLLIDERS             */}
      {/* ============================================================== */}
      <RigidBody type="fixed" colliders={false}>
        {/* 
          Main Pier Body Floor Collider:
          Covers full pier deck from local X = -15.0 to +15.0 (world X = -57.0 to -27.0)
          connecting seamlessly with the seawall promenade ramp with zero gap!
        */}
        <CuboidCollider args={[15.0, 0.16, 2.75]} position={[0.0, 0.22, 0]} friction={0.0} />

        {/* North Safety Railing Collider (Stops at local X = +12 to keep bridge entrance funnel open) */}
        <CuboidCollider args={[13.5, 0.65, 0.08]} position={[-1.5, 0.85, 2.75]} friction={0.0} />
        {/* South Safety Railing Collider West Section (X = -15 to +4.6, length 19.6m) */}
        <CuboidCollider args={[9.8, 0.65, 0.08]} position={[-5.2, 0.85, -2.75]} friction={0.0} />
        {/* South Safety Railing Collider East Section (X = +7.4 to +12.0, stops at +12 to keep bridge mouth open) */}
        <CuboidCollider args={[2.3, 0.65, 0.08]} position={[9.7, 0.85, -2.75]} friction={0.0} />
        {/* Pier Far West End Railing Collider (X = -15, width 5.5m) */}
        <CuboidCollider args={[0.08, 0.65, 2.75]} position={[-15.0, 0.85, 0]} friction={0.0} />

        {/* LADDER CLIMB ASSIST RAMP COLLIDER (Slopes smoothly UP from water Y=-0.75, Z=-4.4 onto pier deck Y=+0.38, Z=-1.6) */}
        <CuboidCollider
          args={[1.30, 0.08, 1.80]}
          position={[6.0, -0.15, -3.1]}
          rotation={[-0.380, 0, 0]}
          friction={0.0}
        />
        {/* Deck Threshold Transition flush with deck at Y = 0.38 */}
        <CuboidCollider
          args={[1.30, 0.06, 0.8]}
          position={[6.0, 0.35, -1.8]}
          friction={0.0}
        />
      </RigidBody>

      {/* Visual North Railing (Continuous, length 30m at Z = 2.75) */}
      <group position={[0, 0.38, 2.75]}>
        <mesh position={[0, 0.65, 0]}>
          <boxGeometry args={[30, 0.06, 0.06]} />
          <meshStandardMaterial color="#eab308" metalness={0.6} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0.32, 0]}>
          <boxGeometry args={[30, 0.04, 0.04]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.8} />
        </mesh>
        {Array.from({ length: 15 }).map((_, i) => (
          <mesh key={`p-north-post-${i}`} position={[-14.5 + i * 2.07, 0.32, 0]}>
            <cylinderGeometry args={[0.025, 0.025, 0.65, 8]} />
            <meshStandardMaterial color="#eab308" metalness={0.6} />
          </mesh>
        ))}
      </group>

      {/* Visual South Railing - Split at the Iron Opening (X = 4.8 to 7.2) */}
      {/* South West Section (X = -15 to +4.8) */}
      <group position={[-5.1, 0.38, -2.75]}>
        <mesh position={[0, 0.65, 0]}>
          <boxGeometry args={[19.8, 0.06, 0.06]} />
          <meshStandardMaterial color="#eab308" metalness={0.6} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0.32, 0]}>
          <boxGeometry args={[19.8, 0.04, 0.04]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.8} />
        </mesh>
        {Array.from({ length: 10 }).map((_, i) => (
          <mesh key={`p-south-w-post-${i}`} position={[-9.4 + i * 2.08, 0.32, 0]}>
            <cylinderGeometry args={[0.025, 0.025, 0.65, 8]} />
            <meshStandardMaterial color="#eab308" metalness={0.6} />
          </mesh>
        ))}
      </group>

      {/* South East Section (X = +7.2 to +15) */}
      <group position={[11.1, 0.38, -2.75]}>
        <mesh position={[0, 0.65, 0]}>
          <boxGeometry args={[7.8, 0.06, 0.06]} />
          <meshStandardMaterial color="#eab308" metalness={0.6} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0.32, 0]}>
          <boxGeometry args={[7.8, 0.04, 0.04]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.8} />
        </mesh>
        {Array.from({ length: 5 }).map((_, i) => (
          <mesh key={`p-south-e-post-${i}`} position={[-3.4 + i * 1.7, 0.32, 0]}>
            <cylinderGeometry args={[0.025, 0.025, 0.65, 8]} />
            <meshStandardMaterial color="#eab308" metalness={0.6} />
          </mesh>
        ))}
      </group>

      {/* Far West End Cap Railing (X = -15) */}
      <group position={[-15.0, 0.38, 0]}>
        <mesh position={[0, 0.65, 0]} rotation={[0, Math.PI / 2, 0]}>
          <boxGeometry args={[5.5, 0.06, 0.06]} />
          <meshStandardMaterial color="#eab308" metalness={0.6} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0.32, 0]} rotation={[0, Math.PI / 2, 0]}>
          <boxGeometry args={[5.5, 0.04, 0.04]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.8} />
        </mesh>
      </group>

      {/* ============================================================== */}
      {/* 5. OFFICIAL INDUSTRIAL IRON OPENING & MARINE ACCESS LADDER      */}
      {/* "Abertura de ferro na base marítima com escada e corrimões amarelos" */}
      {/* Positioned at X = 6.0, Z = -2.75                                */}
      {/* ============================================================== */}
      <group position={[6.0, 0, -2.75]}>
        {/* Yellow-and-Black Hazard Striped Deck Threshold Plate */}
        <mesh position={[0, 0.385, 0.35]} receiveShadow>
          <boxGeometry args={[2.3, 0.015, 0.7]} />
          <meshStandardMaterial color="#eab308" roughness={0.4} metalness={0.2} />
        </mesh>

        {/* Heavy Flanking Stanchions with Safety Handrails */}
        {[-1.15, 1.15].map((sx, si) => (
          <group key={`pier-gate-stanchion-${si}`} position={[sx, 0.38, 0]}>
            {/* Base mounting flange */}
            <mesh position={[0, 0.02, 0]}>
              <boxGeometry args={[0.16, 0.04, 0.16]} />
              <meshStandardMaterial color="#0f172a" metalness={0.9} />
            </mesh>
            {/* Heavy vertical tube */}
            <mesh position={[0, 0.65, 0]}>
              <cylinderGeometry args={[0.045, 0.045, 1.3, 12]} />
              <meshStandardMaterial color="#eab308" metalness={0.7} roughness={0.25} />
            </mesh>
            {/* Top Amber Navigation Warning Beacon */}
            <mesh position={[0, 1.34, 0]}>
              <sphereGeometry args={[0.065, 12, 12]} />
              <meshBasicMaterial color="#f59e0b" />
            </mesh>
          </group>
        ))}

        {/* Overhead Heavy Iron Portal Arch */}
        <group position={[0, 1.70, 0]}>
          <mesh>
            <boxGeometry args={[2.38, 0.08, 0.08]} />
            <meshStandardMaterial color="#0f172a" metalness={0.85} />
          </mesh>
          <mesh position={[0, 0.08, 0]}>
            <boxGeometry args={[2.30, 0.04, 0.06]} />
            <meshStandardMaterial color="#eab308" />
          </mesh>
          {/* Signage text */}
          <Text
            position={[0, 0.02, 0.05]}
            fontSize={0.09}
            color="#f8fafc"
            fontWeight="bold"
            anchorX="center"
          >
            ACESSO MARÍTIMO • ESCADA GGPEN
          </Text>
        </group>

        {/* INDUSTRIAL TUBULAR GALVANIZED STEEL MARINE LADDER */}
        {/* Extends from Y = +1.48m (top grab loops) down into the ocean to Y = -2.2m */}
        <group position={[0, 0, -0.08]}>
          {/* Dual Main Stringer Tubes (Yellow Safety Railing above deck, Marine Steel below waterline) */}
          {[-0.45, 0.45].map((lx, li) => (
            <group key={`ladder-stringer-${li}`} position={[lx, 0, 0]}>
              {/* Upper Grab Bar Section (Above Pier Deck: Y = 0.38 to 1.48) */}
              <mesh position={[0, 0.93, 0]}>
                <cylinderGeometry args={[0.032, 0.032, 1.10, 12]} />
                <meshStandardMaterial color="#eab308" metalness={0.7} roughness={0.25} />
              </mesh>
              {/* Top Curved Safety Loop */}
              <mesh position={[li === 0 ? 0.06 : -0.06, 1.48, 0]} rotation={[0, 0, li === 0 ? -0.2 : 0.2]}>
                <cylinderGeometry args={[0.030, 0.030, 0.16, 12]} />
                <meshStandardMaterial color="#eab308" metalness={0.7} />
              </mesh>
              {/* Submerged Lower Stringer Section (From Pier Deck Y = 0.38 down to Y = -2.20) */}
              <mesh position={[0, -0.91, 0]}>
                <cylinderGeometry args={[0.035, 0.035, 2.58, 12]} />
                <meshStandardMaterial color="#64748b" metalness={0.85} roughness={0.35} />
              </mesh>
            </group>
          ))}

          {/* 11 Corrugated Non-Slip Galvanized Iron Rungs */}
          {Array.from({ length: 11 }).map((_, rIdx) => {
            const rungY = 0.30 - rIdx * 0.24; // from +0.30m down to -2.10m underwater
            const isAboveWater = rungY > 0.0;
            return (
              <group key={`ladder-rung-${rIdx}`} position={[0, rungY, 0]}>
                {/* Main Rung Pipe */}
                <mesh rotation={[0, 0, Math.PI / 2]}>
                  <cylinderGeometry args={[0.022, 0.022, 0.90, 10]} />
                  <meshStandardMaterial
                    color={isAboveWater ? '#eab308' : '#94a3b8'}
                    metalness={0.85}
                    roughness={0.3}
                  />
                </mesh>
                {/* High-traction diamond tread ribbed sleeve */}
                <mesh rotation={[0, 0, Math.PI / 2]}>
                  <cylinderGeometry args={[0.026, 0.026, 0.70, 8]} />
                  <meshStandardMaterial color="#1e293b" metalness={0.6} />
                </mesh>
              </group>
            );
          })}

          {/* Heavy Concrete Pier Anchor Brackets */}
          {[-0.45, 0.45].map((bx, bi) => (
            <mesh key={`anchor-${bi}`} position={[bx, 0.18, 0.10]}>
              <boxGeometry args={[0.10, 0.14, 0.20]} />
              <meshStandardMaterial color="#0f172a" metalness={0.9} />
            </mesh>
          ))}
        </group>
      </group>

      {/* Pier-End Telemetry Radar Station */}
      <group position={[-13.5, 0.38, 0]}>
        <mesh position={[0, 0.25, 0]}>
          <cylinderGeometry args={[2.2, 2.4, 0.5, 16]} />
          <meshStandardMaterial color="#1e293b" metalness={0.8} />
        </mesh>

        <mesh position={[0, 1.3, 0]}>
          <sphereGeometry args={[1.1, 16, 16]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.3} metalness={0.2} />
        </mesh>

        <group ref={radarRef} position={[0, 2.5, 0]}>
          <mesh position={[0, 0.35, 0]}>
            <cylinderGeometry args={[0.06, 0.06, 0.7, 8]} />
            <meshStandardMaterial color="#475569" metalness={0.9} />
          </mesh>
          <mesh position={[0, 0.7, 0]}>
            <boxGeometry args={[1.6, 0.2, 0.08]} />
            <meshStandardMaterial color="#0284c7" metalness={0.8} />
          </mesh>
        </group>

        <mesh position={[0, 3.4, 0]}>
          <sphereGeometry args={[0.14, 10, 10]} />
          <meshBasicMaterial color="#38bdf8" />
        </mesh>
      </group>
    </group>
  );
}

// ---------------------------------------------------------------------------
// 5. OFFSHORE ROCKET RECOVERY DRONE SHIP ("GGPEN ATLÂNTICO RECUPERAÇÃO")
// ---------------------------------------------------------------------------
function RocketRecoveryDroneShip() {
  const bargeRef = useRef<Group>(null);

  useFrame((state) => {
    if (!bargeRef.current) return;
    const t = state.clock.getElapsedTime();
    bargeRef.current.position.y = -0.06 + Math.sin(t * 0.8) * 0.04;
  });

  return (
    <group ref={bargeRef} position={[-85, -0.06, -25]} rotation={[0, 0.25, 0]}>
      {/* Drone Ship Hull */}
      <mesh position={[0, 0.5, 0]}>
        <boxGeometry args={[42, 1.6, 24]} />
        <meshStandardMaterial color="#0f172a" roughness={0.65} metalness={0.7} />
      </mesh>

      {/* Yellow Safety Perimeter */}
      <mesh position={[0, 1.35, 0]}>
        <boxGeometry args={[42.5, 0.22, 24.5]} />
        <meshStandardMaterial color="#eab308" roughness={0.4} metalness={0.5} />
      </mesh>

      {/* Landing Deck Surface */}
      <mesh position={[0, 1.32, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[40, 22]} />
        <meshStandardMaterial color="#1e293b" roughness={0.8} />
      </mesh>

      {/* Landing Target Ring */}
      <mesh position={[0, 1.33, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[6.2, 6.7, 32]} />
        <meshBasicMaterial color="#eab308" />
      </mesh>
      <mesh position={[0, 1.33, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.1, 24]} />
        <meshBasicMaterial color="#eab308" />
      </mesh>

      {/* Official GGPEN Logo on Flight Deck */}
      <group position={[0, 1.34, 0]} rotation={[-Math.PI / 2, 0, Math.PI / 2]}>
        <GGPENLogoDecal position={[0, 0, 0]} scale={[12, 12, 1]} />
      </group>

      <Text
        position={[0, 1.34, -8.5]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={1.2}
        color="#f8fafc"
        fontWeight="bold"
        anchorX="center"
      >
        GGPEN ATLÂNTICO • RECOVERY SHIP 01
      </Text>

      {/* 4 Corner Warning Beacons */}
      {[
        [-19, 11],
        [19, 11],
        [-19, -11],
        [19, -11],
      ].map(([tx, tz], i) => (
        <group key={`thruster-${i}`} position={[tx, 1.3, tz]}>
          <mesh>
            <cylinderGeometry args={[0.45, 0.55, 1.8, 12]} />
            <meshStandardMaterial color="#334155" metalness={0.8} />
          </mesh>
          <mesh position={[0, 1.0, 0]}>
            <sphereGeometry args={[0.16, 8, 8]} />
            <meshBasicMaterial color="#eab308" />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// ---------------------------------------------------------------------------
// 6. REALISTIC DYNAMIC FLUID RIPPLES & WAKES (PHYSICS OF WATER IN MOTION)
// ---------------------------------------------------------------------------
function PlayerWaterRipples() {
  const ripple1Ref = useRef<Mesh>(null);
  const ripple2Ref = useRef<Mesh>(null);
  const wakeRef = useRef<Group>(null);
  const isPlayerInWater = useGameStore((state) => state.isPlayerInWater);

  useFrame((state) => {
    if (!isPlayerInWater) {
      if (ripple1Ref.current) ripple1Ref.current.visible = false;
      if (ripple2Ref.current) ripple2Ref.current.visible = false;
      if (wakeRef.current) wakeRef.current.visible = false;
      return;
    }

    const playerPos = useGameStore.getState().playerPosition;
    const t = state.clock.getElapsedTime();

    // 1. Concentric Expanding Ripple 1
    if (ripple1Ref.current) {
      ripple1Ref.current.visible = true;
      ripple1Ref.current.position.set(playerPos[0], 0.03, playerPos[2]);
      const cycle1 = (t * 1.5) % 1;
      const s1 = 0.6 + cycle1 * 3.4;
      ripple1Ref.current.scale.set(s1, s1, 1);
      const mat = ripple1Ref.current.material as any;
      if (mat) mat.opacity = Math.sin((1 - cycle1) * Math.PI) * 0.75;
    }

    // 2. Concentric Expanding Ripple 2 (Interleaved phase)
    if (ripple2Ref.current) {
      ripple2Ref.current.visible = true;
      ripple2Ref.current.position.set(playerPos[0], 0.035, playerPos[2]);
      const cycle2 = (t * 1.5 + 0.5) % 1;
      const s2 = 0.6 + cycle2 * 3.4;
      ripple2Ref.current.scale.set(s2, s2, 1);
      const mat = ripple2Ref.current.material as any;
      if (mat) mat.opacity = Math.sin((1 - cycle2) * Math.PI) * 0.75;
    }

    // 3. Fluid Wake Foam Splashes around moving legs/body
    if (wakeRef.current) {
      wakeRef.current.visible = true;
      wakeRef.current.position.set(playerPos[0], 0.04, playerPos[2]);
      wakeRef.current.rotation.y = t * 1.6;
    }
  });

  return (
    <group>
      <mesh ref={ripple1Ref} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
        <ringGeometry args={[0.3, 0.45, 32]} />
        <meshBasicMaterial color="#e0f2fe" transparent opacity={0.65} side={DoubleSide} />
      </mesh>

      <mesh ref={ripple2Ref} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
        <ringGeometry args={[0.25, 0.38, 32]} />
        <meshBasicMaterial color="#bae6fd" transparent opacity={0.65} side={DoubleSide} />
      </mesh>

      <group ref={wakeRef} visible={false}>
        {[0, 1.25, 2.5, 3.75, 5.0].map((ang, i) => (
          <mesh
            key={`fluid-spray-${i}`}
            position={[Math.cos(ang) * 0.65, 0.02, Math.sin(ang) * 0.65]}
            rotation={[-Math.PI / 2, 0, 0]}
          >
            <circleGeometry args={[0.22, 12]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.55} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

// ---------------------------------------------------------------------------
// 7. COMPLETE COASTAL OCEAN BESIDE LAUNCH COMPLEX
// ---------------------------------------------------------------------------
export function CoastalOcean() {
  return (
    <group name="coastal-ocean-environment">
      <DynamicWaterSurface />
      <CoastalBeachAndRiprap />
      <SeawallPromenade />
      <MarineTelemetryPier />
      <RocketRecoveryDroneShip />
      <PlayerWaterRipples />
    </group>
  );
}
