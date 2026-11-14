import React, { useMemo, useRef, useLayoutEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  CanvasTexture,
  RepeatWrapping,
  DoubleSide,
  MeshStandardMaterial,
  SRGBColorSpace,
  LinearFilter,
  LinearMipmapLinearFilter,
  Group,
  BufferGeometry,
  Float32BufferAttribute,
  InstancedMesh,
  PlaneGeometry,
  Object3D,
  Color,
} from 'three';
import { RigidBody, CylinderCollider } from '@react-three/rapier';
import { BeachPalmBotanicalLeaves } from './PixelLeaves';

// ---------------------------------------------------------------------------
// 1. PROCEDURAL UNITY-GRADE BOTANICAL TEXTURES (CRISP CUTOUTS & NORMAL MAPS)
// ---------------------------------------------------------------------------

let cachedPalmBark: { diffuse: CanvasTexture; normal: CanvasTexture } | null = null;
let cachedPalmFrond: { diffuse: CanvasTexture; normal: CanvasTexture } | null = null;
let cachedTreeBark: { diffuse: CanvasTexture; normal: CanvasTexture } | null = null;
let cachedTreeFoliage: { diffuse: CanvasTexture; normal: CanvasTexture } | null = null;

function createFallbackTexture(): CanvasTexture {
  if (typeof document !== 'undefined') {
    return new CanvasTexture(document.createElement('canvas'));
  }
  return new CanvasTexture({} as HTMLCanvasElement);
}

// A. Realistic Coconut Palm Trunk Bark (Weathered rings, fibrous node scars & normal relief)
function getPalmBarkTextures() {
  if (cachedPalmBark) return cachedPalmBark;
  if (typeof document === 'undefined') {
    const dummy = createFallbackTexture();
    return { diffuse: dummy, normal: dummy };
  }

  const size = 512;
  const dCanvas = document.createElement('canvas');
  dCanvas.width = size;
  dCanvas.height = size;
  const dCtx = dCanvas.getContext('2d');

  const nCanvas = document.createElement('canvas');
  nCanvas.width = size;
  nCanvas.height = size;
  const nCtx = nCanvas.getContext('2d');

  if (dCtx && nCtx) {
    const grad = dCtx.createLinearGradient(0, 0, 0, size);
    grad.addColorStop(0, '#5a4632');
    grad.addColorStop(0.3, '#6a533d');
    grad.addColorStop(0.7, '#584330');
    grad.addColorStop(1, '#4e3a29');
    dCtx.fillStyle = grad;
    dCtx.fillRect(0, 0, size, size);

    nCtx.fillStyle = '#8080ff';
    nCtx.fillRect(0, 0, size, size);

    const ringSpacing = 48;
    for (let y = 16; y < size; y += ringSpacing) {
      dCtx.fillStyle = '#261a10';
      dCtx.fillRect(0, y - 2, size, 5);

      dCtx.fillStyle = '#8c7052';
      dCtx.fillRect(0, y + 3, size, 4);

      dCtx.fillStyle = '#443222';
      dCtx.fillRect(0, y + 7, size, 6);

      nCtx.fillStyle = '#6060ff';
      nCtx.fillRect(0, y - 2, size, 4);
      nCtx.fillStyle = '#a0a0ff';
      nCtx.fillRect(0, y + 3, size, 5);
    }

    for (let x = 0; x < size; x += 3) {
      const isFissure = x % 18 === 0;
      const alpha = isFissure ? 0.45 : 0.22;
      dCtx.fillStyle = isFissure ? `rgba(20, 14, 9, ${alpha})` : `rgba(130, 105, 80, ${alpha})`;
      dCtx.fillRect(x + (Math.sin(x) * 2), 0, isFissure ? 2.5 : 1.2, size);

      if (isFissure) {
        nCtx.fillStyle = '#6880ff';
        nCtx.fillRect(x, 0, 2, size);
      }
    }

    for (let i = 0; i < 900; i++) {
      const rx = Math.random() * size;
      const ry = Math.random() * size;
      const isLichen = Math.random() > 0.65;
      dCtx.fillStyle = isLichen ? 'rgba(168, 162, 140, 0.28)' : 'rgba(30, 20, 12, 0.35)';
      dCtx.beginPath();
      dCtx.arc(rx, ry, 1.2 + Math.random() * 2.5, 0, Math.PI * 2);
      dCtx.fill();
    }
  }

  const diffuse = new CanvasTexture(dCanvas);
  diffuse.colorSpace = SRGBColorSpace;
  diffuse.wrapS = RepeatWrapping;
  diffuse.wrapT = RepeatWrapping;
  diffuse.repeat.set(2, 6);

  const normal = new CanvasTexture(nCanvas);
  normal.wrapS = RepeatWrapping;
  normal.wrapT = RepeatWrapping;
  normal.repeat.set(2, 6);

  cachedPalmBark = { diffuse, normal };
  return cachedPalmBark;
}

// B. Realistic Opaque Cutout Pinnate Palm Frond (No ghost paddles, crisp dense leaflets)
function getPalmFrondTextures() {
  if (cachedPalmFrond) return cachedPalmFrond;
  if (typeof document === 'undefined') {
    const dummy = createFallbackTexture();
    return { diffuse: dummy, normal: dummy };
  }

  const width = 512;
  const height = 1024;
  const dCanvas = document.createElement('canvas');
  dCanvas.width = width;
  dCanvas.height = height;
  const dCtx = dCanvas.getContext('2d');

  const nCanvas = document.createElement('canvas');
  nCanvas.width = width;
  nCanvas.height = height;
  const nCtx = nCanvas.getContext('2d');

  if (dCtx && nCtx) {
    dCtx.clearRect(0, 0, width, height);
    nCtx.fillStyle = '#8080ff';
    nCtx.fillRect(0, 0, width, height);

    const centerX = width / 2;

    // 1. Central Rachis (Stout Golden-Green Frond Spine)
    const spineGrad = dCtx.createLinearGradient(centerX, height, centerX, 15);
    spineGrad.addColorStop(0, '#553c18');
    spineGrad.addColorStop(0.25, '#4d7c0f');
    spineGrad.addColorStop(0.7, '#65a30d');
    spineGrad.addColorStop(1, '#84cc16');

    dCtx.strokeStyle = spineGrad;
    dCtx.lineWidth = 8;
    dCtx.lineCap = 'round';
    dCtx.beginPath();
    dCtx.moveTo(centerX, height);
    dCtx.quadraticCurveTo(centerX, height * 0.45, centerX, 16);
    dCtx.stroke();

    nCtx.fillStyle = '#7070ff';
    nCtx.fillRect(centerX - 5, 16, 10, height - 16);

    // 2. Dense Pinnate Leaflets (150 pairs, 100% Solid Opacity, Sharp Botanical Blades)
    const leafletPairs = 150;
    for (let i = 0; i < leafletPairs; i++) {
      const t = i / leafletPairs;
      const y = height - (t * (height - 35)) - 10;

      const envelope = Math.sin(Math.pow(t, 0.72) * Math.PI);
      const maxSpan = 22 + envelope * 195;
      const droop = (1 - t) * 22 + (envelope * 48);

      // Deep chlorophyll and fresh emerald colors
      const hue = 122 + Math.sin(t * Math.PI) * 22;
      const lightness = 28 + Math.sin(t * Math.PI) * 18;
      const leafColor = `hsl(${hue}, 80%, ${lightness}%)`;
      const tipColor = `hsl(${hue - 10}, 85%, ${lightness + 14}%)`;

      // Left leaflet blade (Solid, crisp line with tapered tip)
      const leftGrad = dCtx.createLinearGradient(centerX, y, centerX - maxSpan, y - droop);
      leftGrad.addColorStop(0, '#14532d');
      leftGrad.addColorStop(0.4, leafColor);
      leftGrad.addColorStop(1, tipColor);

      dCtx.strokeStyle = leftGrad;
      dCtx.lineWidth = 4.6;
      dCtx.lineCap = 'round';
      dCtx.beginPath();
      dCtx.moveTo(centerX - 3, y);
      dCtx.quadraticCurveTo(centerX - maxSpan * 0.45, y - droop * 0.35, centerX - maxSpan, y - droop);
      dCtx.stroke();

      // Right leaflet blade
      const rightGrad = dCtx.createLinearGradient(centerX, y, centerX + maxSpan, y - droop);
      rightGrad.addColorStop(0, '#14532d');
      rightGrad.addColorStop(0.4, leafColor);
      rightGrad.addColorStop(1, tipColor);

      dCtx.strokeStyle = rightGrad;
      dCtx.lineWidth = 4.6;
      dCtx.lineCap = 'round';
      dCtx.beginPath();
      dCtx.moveTo(centerX + 3, y);
      dCtx.quadraticCurveTo(centerX + maxSpan * 0.45, y - droop * 0.35, centerX + maxSpan, y - droop);
      dCtx.stroke();

      nCtx.fillStyle = i % 2 === 0 ? '#7290ff' : '#9072ff';
      nCtx.fillRect(centerX - maxSpan, y - droop, maxSpan * 2, 3.5);
    }

    // Spine sharp highlight
    dCtx.strokeStyle = '#bef264';
    dCtx.lineWidth = 2.5;
    dCtx.beginPath();
    dCtx.moveTo(centerX, height);
    dCtx.quadraticCurveTo(centerX, height * 0.45, centerX, 16);
    dCtx.stroke();
  }

  const diffuse = new CanvasTexture(dCanvas);
  diffuse.colorSpace = SRGBColorSpace;
  diffuse.magFilter = LinearFilter;
  diffuse.minFilter = LinearMipmapLinearFilter;
  diffuse.generateMipmaps = true;

  const normal = new CanvasTexture(nCanvas);
  normal.magFilter = LinearFilter;
  normal.minFilter = LinearMipmapLinearFilter;
  normal.generateMipmaps = true;

  cachedPalmFrond = { diffuse, normal };
  return cachedPalmFrond;
}

// Procedural Unity SpeedTree Arched Palm Frond Geometry with V-Channel Profile
let cachedTier1FrondGeom: BufferGeometry | null = null;
let cachedTier2FrondGeom: BufferGeometry | null = null;
let cachedTier3FrondGeom: BufferGeometry | null = null;

function createArchingPalmFrondGeometry(
  length: number,
  width: number,
  droop: number,
  segments = 14
): BufferGeometry {
  const geom = new BufferGeometry();
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const z = t * length;
    // Parabolic arch matching Hum3D reference: rises proudly upwards (up to +0.36 * length) forming a radiant dome, feathering down only at the outer tip
    const y = Math.sin(t * Math.PI * 0.72) * (length * 0.36) - Math.pow(t, 3.2) * (length * droop);
    // Botanical envelope width
    const w = Math.sin(Math.pow(t, 0.65) * Math.PI) * width;
    const vTrough = w * 0.16;

    // Three vertices per step: Left (-X), Spine (0), Right (+X)
    positions.push(-w * 0.5, y + vTrough, z);
    positions.push(0, y, z);
    positions.push(w * 0.5, y + vTrough, z);

    // UVs: V runs from 1.0 (base at trunk) to 0.0 (pointed tip)
    const v = 1.0 - t;
    uvs.push(0.0, v);
    uvs.push(0.5, v);
    uvs.push(1.0, v);

    if (i < segments) {
      const rowA = i * 3;
      const rowB = (i + 1) * 3;

      // Left wing quad
      indices.push(rowA, rowA + 1, rowB + 1);
      indices.push(rowA, rowB + 1, rowB);

      // Right wing quad
      indices.push(rowA + 1, rowA + 2, rowB + 2);
      indices.push(rowA + 1, rowB + 2, rowB + 1);
    }
  }

  geom.setAttribute('position', new Float32BufferAttribute(positions, 3));
  geom.setAttribute('uv', new Float32BufferAttribute(uvs, 2));
  geom.setIndex(indices);
  geom.computeVertexNormals();

  return geom;
}

function getFrondGeometry(tier: 1 | 2 | 3): BufferGeometry {
  if (tier === 1) {
    if (!cachedTier1FrondGeom) cachedTier1FrondGeom = createArchingPalmFrondGeometry(4.2, 1.40, 0.22, 12);
    return cachedTier1FrondGeom;
  }
  if (tier === 2) {
    if (!cachedTier2FrondGeom) cachedTier2FrondGeom = createArchingPalmFrondGeometry(5.6, 1.70, 0.38, 14);
    return cachedTier2FrondGeom;
  }
  if (!cachedTier3FrondGeom) cachedTier3FrondGeom = createArchingPalmFrondGeometry(5.0, 1.55, 0.58, 14);
  return cachedTier3FrondGeom;
}

// Merged 22-frond palm canopy: 1 single draw call per palm tree instead of 22
let cachedMergedPalmCrownGeom: BufferGeometry | null = null;
function getMergedPalmCrownGeometry(): BufferGeometry {
  if (cachedMergedPalmCrownGeom) return cachedMergedPalmCrownGeom;

  const frondCount = 22;
  const goldenRatio = 2.39996;
  const allPositions: number[] = [];
  const allUvs: number[] = [];
  const allIndices: number[] = [];
  let vertexOffset = 0;

  for (let i = 0; i < frondCount; i++) {
    const phi = i * goldenRatio;
    let tier: 1 | 2 | 3;
    let tilt: number;

    if (i < 6) {
      tier = 1;
      tilt = -0.38 + (i % 2) * 0.08;
    } else if (i < 16) {
      tier = 2;
      tilt = 0.16 + ((i - 6) % 3) * 0.08;
    } else {
      tier = 3;
      tilt = 0.48 + ((i - 16) % 2) * 0.08;
    }

    const baseGeom = getFrondGeometry(tier);
    const posAttr = baseGeom.getAttribute('position');
    const uvAttr = baseGeom.getAttribute('uv');
    const indexAttr = baseGeom.getIndex();
    if (!posAttr || !uvAttr || !indexAttr) continue;

    const cosT = Math.cos(tilt);
    const sinT = Math.sin(tilt);
    const cosY = Math.cos(phi);
    const sinY = Math.sin(phi);

    for (let v = 0; v < posAttr.count; v++) {
      const vx = posAttr.getX(v);
      const vy = posAttr.getY(v);
      const vz = posAttr.getZ(v);

      const rx = vx;
      const ry = vy * cosT - vz * sinT;
      const rz = vy * sinT + vz * cosT;

      const fx = rx * cosY + rz * sinY;
      const fy = ry;
      const fz = -rx * sinY + rz * cosY;

      allPositions.push(fx, fy, fz);
      allUvs.push(uvAttr.getX(v), uvAttr.getY(v));
    }

    for (let idx = 0; idx < indexAttr.count; idx++) {
      allIndices.push(vertexOffset + indexAttr.getX(idx));
    }

    vertexOffset += posAttr.count;
  }

  const merged = new BufferGeometry();
  merged.setAttribute('position', new Float32BufferAttribute(allPositions, 3));
  merged.setAttribute('uv', new Float32BufferAttribute(allUvs, 2));
  merged.setIndex(allIndices);
  merged.computeVertexNormals();

  cachedMergedPalmCrownGeom = merged;
  return cachedMergedPalmCrownGeom;
}

// C. Realistic Tree Trunk Furrowed Bark Texture
function getTreeBarkTextures() {
  if (cachedTreeBark) return cachedTreeBark;
  if (typeof document === 'undefined') {
    const dummy = createFallbackTexture();
    return { diffuse: dummy, normal: dummy };
  }

  const size = 512;
  const dCanvas = document.createElement('canvas');
  dCanvas.width = size;
  dCanvas.height = size;
  const dCtx = dCanvas.getContext('2d');

  const nCanvas = document.createElement('canvas');
  nCanvas.width = size;
  nCanvas.height = size;
  const nCtx = nCanvas.getContext('2d');

  if (dCtx && nCtx) {
    dCtx.fillStyle = '#2d1f15';
    dCtx.fillRect(0, 0, size, size);

    nCtx.fillStyle = '#8080ff';
    nCtx.fillRect(0, 0, size, size);

    for (let x = 0; x < size; x += 16) {
      const wave = Math.sin(x * 0.08) * 4;
      dCtx.fillStyle = '#170f09';
      dCtx.fillRect(x + wave, 0, 5, size);

      dCtx.fillStyle = '#4e3827';
      dCtx.fillRect(x + wave + 5, 0, 8, size);

      nCtx.fillStyle = '#5575ff';
      nCtx.fillRect(x + wave, 0, 5, size);
      nCtx.fillStyle = '#ab85ff';
      nCtx.fillRect(x + wave + 5, 0, 7, size);
    }

    for (let i = 0; i < 900; i++) {
      const rx = Math.random() * size;
      const ry = Math.random() * size;
      const rw = 2 + Math.random() * 3.5;
      const rh = 14 + Math.random() * 32;
      dCtx.fillStyle = Math.random() > 0.5 ? 'rgba(92, 68, 48, 0.45)' : 'rgba(20, 13, 8, 0.55)';
      dCtx.fillRect(rx, ry, rw, rh);
    }
  }

  const diffuse = new CanvasTexture(dCanvas);
  diffuse.colorSpace = SRGBColorSpace;
  diffuse.wrapS = RepeatWrapping;
  diffuse.wrapT = RepeatWrapping;
  diffuse.repeat.set(3, 4);

  const normal = new CanvasTexture(nCanvas);
  normal.wrapS = RepeatWrapping;
  normal.wrapT = RepeatWrapping;
  normal.repeat.set(3, 4);

  cachedTreeBark = { diffuse, normal };
  return cachedTreeBark;
}

// D. Crisp Botanical Leaf Twig Texture for Tree Foliage (Soft anti-aliased broadleaf clusters matching images__15__3716cb2a.jpeg)
function getTreeFoliageTexture() {
  if (cachedTreeFoliage) return cachedTreeFoliage;
  if (typeof document === 'undefined') {
    const dummy = createFallbackTexture();
    return { diffuse: dummy, normal: dummy };
  }

  const size = 512;
  const dCanvas = document.createElement('canvas');
  dCanvas.width = size;
  dCanvas.height = size;
  const dCtx = dCanvas.getContext('2d');

  const nCanvas = document.createElement('canvas');
  nCanvas.width = size;
  nCanvas.height = size;
  const nCtx = nCanvas.getContext('2d');

  if (dCtx && nCtx) {
    dCtx.clearRect(0, 0, size, size);
    nCtx.fillStyle = '#8080ff';
    nCtx.fillRect(0, 0, size, size);

    // Natural woody twig stem
    const stemGrad = dCtx.createLinearGradient(256, 490, 256, 60);
    stemGrad.addColorStop(0, '#3b2512');
    stemGrad.addColorStop(1, '#5a3d1e');
    dCtx.strokeStyle = stemGrad;
    dCtx.lineWidth = 5;
    dCtx.lineCap = 'round';
    dCtx.beginPath();
    dCtx.moveTo(256, 495);
    dCtx.quadraticCurveTo(248, 280, 256, 65);
    dCtx.stroke();

    // 24 beautifully clustered, soft rounded broad leaves matching images__15__3716cb2a.jpeg
    const leaves = [
      // Lower branch pairs
      { x: 210, y: 430, rx: 38, ry: 24, rot: -0.65, col: '#15803d', tip: '#22c55e' },
      { x: 305, y: 415, rx: 40, ry: 25, rot: 0.60, col: '#166534', tip: '#16a34a' },
      { x: 175, y: 360, rx: 42, ry: 26, rot: -0.75, col: '#166534', tip: '#22c55e' },
      { x: 335, y: 350, rx: 42, ry: 26, rot: 0.70, col: '#15803d', tip: '#4ade80' },
      // Mid branch clusters
      { x: 200, y: 290, rx: 44, ry: 27, rot: -0.55, col: '#15803d', tip: '#4ade80' },
      { x: 310, y: 280, rx: 45, ry: 27, rot: 0.50, col: '#16a34a', tip: '#86efac' },
      { x: 160, y: 230, rx: 40, ry: 25, rot: -0.80, col: '#166534', tip: '#22c55e' },
      { x: 345, y: 220, rx: 42, ry: 26, rot: 0.75, col: '#15803d', tip: '#4ade80' },
      { x: 215, y: 175, rx: 42, ry: 25, rot: -0.45, col: '#16a34a', tip: '#86efac' },
      { x: 295, y: 170, rx: 42, ry: 25, rot: 0.40, col: '#22c55e', tip: '#86efac' },
      // Upper crown clusters
      { x: 190, y: 120, rx: 38, ry: 23, rot: -0.60, col: '#22c55e', tip: '#a7f3d0' },
      { x: 320, y: 115, rx: 38, ry: 23, rot: 0.55, col: '#16a34a', tip: '#86efac' },
      { x: 256, y: 65, rx: 36, ry: 22, rot: -0.10, col: '#22c55e', tip: '#bbf7d0' },
      { x: 256, y: 95, rx: 34, ry: 21, rot: 0.15, col: '#15803d', tip: '#4ade80' },
      // Center filling leaves
      { x: 245, y: 225, rx: 38, ry: 24, rot: -0.20, col: '#14532d', tip: '#15803d' },
      { x: 265, y: 335, rx: 40, ry: 25, rot: 0.25, col: '#14532d', tip: '#166534' },
    ];

    leaves.forEach((lf, idx) => {
      dCtx.save();
      dCtx.translate(lf.x, lf.y);
      dCtx.rotate(lf.rot);

      // Petiole connecting leaf to stem
      dCtx.strokeStyle = '#4e3827';
      dCtx.lineWidth = 2.2;
      dCtx.beginPath();
      dCtx.moveTo(-lf.rx * 0.9, 0);
      dCtx.lineTo(-lf.rx * 1.2, lf.ry * 0.3);
      dCtx.stroke();

      // Smooth anti-aliased broadleaf body with subtle sunlit gradient
      const leafGrad = dCtx.createRadialGradient(-lf.rx * 0.2, 0, 2, 0, 0, lf.rx);
      leafGrad.addColorStop(0, lf.tip);
      leafGrad.addColorStop(0.55, lf.col);
      leafGrad.addColorStop(1, '#0f3a1f');
      dCtx.fillStyle = leafGrad;

      dCtx.beginPath();
      // Organic rounded ovate leaf with pointed tip
      dCtx.moveTo(-lf.rx, 0);
      dCtx.bezierCurveTo(-lf.rx * 0.5, -lf.ry * 1.15, lf.rx * 0.6, -lf.ry * 0.95, lf.rx, 0);
      dCtx.bezierCurveTo(lf.rx * 0.6, lf.ry * 0.95, -lf.rx * 0.5, lf.ry * 1.15, -lf.rx, 0);
      dCtx.fill();

      // Midrib and lateral veins
      dCtx.strokeStyle = 'rgba(255, 255, 255, 0.32)';
      dCtx.lineWidth = 1.6;
      dCtx.beginPath();
      dCtx.moveTo(-lf.rx * 0.85, 0);
      dCtx.lineTo(lf.rx * 0.85, 0);
      dCtx.stroke();

      dCtx.restore();

      // Normal map rounded bump
      nCtx.fillStyle = idx % 2 === 0 ? '#7292ff' : '#9272ff';
      nCtx.beginPath();
      nCtx.arc(lf.x, lf.y, (lf.rx + lf.ry) * 0.45, 0, Math.PI * 2);
      nCtx.fill();
    });
  }

  const diffuse = new CanvasTexture(dCanvas);
  diffuse.colorSpace = SRGBColorSpace;
  diffuse.magFilter = LinearFilter;
  diffuse.minFilter = LinearMipmapLinearFilter;
  diffuse.generateMipmaps = true;

  const normal = new CanvasTexture(nCanvas);
  normal.magFilter = LinearFilter;
  normal.minFilter = LinearMipmapLinearFilter;
  normal.generateMipmaps = true;

  cachedTreeFoliage = { diffuse, normal };
  return cachedTreeFoliage;
}

// ---------------------------------------------------------------------------
// 2. CLEAN GROUND LAWN
// ---------------------------------------------------------------------------
export function RealisticLawn() {
  return (
    <group>
      <mesh receiveShadow position={[742, 0.0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1516, 5000, 1, 1]} />
        <meshStandardMaterial
          color="#2d6a4f"
          roughness={0.88}
          metalness={0.02}
          side={DoubleSide}
        />
      </mesh>
    </group>
  );
}

// Procedural Unity SpeedTree Seamless Continuous Curved Palm Trunk Geometry
function createSeamlessPalmTrunkGeometry(curveDir: number): BufferGeometry {
  const geom = new BufferGeometry();
  const heightSegments = 36;
  const radialSegments = 16;
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let i = 0; i <= heightSegments; i++) {
    const t = i / heightSegments;
    const y = t * 7.4;
    // Organic fluted flare at base + gentle tapering towards crown
    const baseFlare = Math.pow(Math.max(0, 1 - t / 0.16), 2) * 0.22;
    // Realistic horizontal bark rings (subtle bulging ridges)
    const ringRidge = Math.cos(t * Math.PI * 44) * 0.012;
    const r = (0.44 * (1 - t * 0.52)) + baseFlare + ringRidge;

    // Smooth continuous curvature matching Hum3D reference images__16__1ab54cae.jpeg
    const x = curveDir * (0.22 * t + 0.95 * t * t);
    const z = Math.sin(t * Math.PI) * 0.08;

    for (let j = 0; j <= radialSegments; j++) {
      const u = j / radialSegments;
      const angle = u * Math.PI * 2;
      const px = x + Math.cos(angle) * r;
      const pz = z + Math.sin(angle) * r;
      positions.push(px, y, pz);
      uvs.push(u * 2, t * 7);
    }
  }

  for (let i = 0; i < heightSegments; i++) {
    for (let j = 0; j < radialSegments; j++) {
      const a = i * (radialSegments + 1) + j;
      const b = (i + 1) * (radialSegments + 1) + j;
      const c = b + 1;
      const d = a + 1;
      indices.push(a, b, d);
      indices.push(b, c, d);
    }
  }

  geom.setAttribute('position', new Float32BufferAttribute(positions, 3));
  geom.setAttribute('uv', new Float32BufferAttribute(uvs, 2));
  geom.setIndex(indices);
  geom.computeVertexNormals();

  return geom;
}

// ---------------------------------------------------------------------------
// 3. PHOTOREALISTIC BOTANICAL COCONUT PALM (UNITY SPEEDTREE QUALITY)
// Solid Opaque Cutouts with V-shaped frond cross-section, zero paddle effect
// ---------------------------------------------------------------------------
export function DetailedPalmTree({
  position,
  scale = 1.0,
  rotationY = 0,
  curveDirection = 1,
}: {
  position: [number, number, number];
  scale?: number;
  rotationY?: number;
  curveDirection?: number;
}) {
  const crownRef = useRef<Group>(null);
  const { diffuse: barkDiffuse, normal: barkNormal } = useMemo(() => getPalmBarkTextures(), []);
  const { diffuse: frondDiffuse, normal: frondNormal } = useMemo(() => getPalmFrondTextures(), []);

  // 100% Seamless Continuous Trunk Mesh (Zero disjointed block steps!)
  const trunkGeometry = useMemo(() => createSeamlessPalmTrunkGeometry(curveDirection), [curveDirection]);

  // Merged 22-frond palm canopy: 1 single draw call per palm tree instead of 22
  const mergedCrownGeometry = useMemo(() => getMergedPalmCrownGeometry(), []);

  const crownX = 1.17 * curveDirection;
  const crownY = 7.4;

  useFrame((state) => {
    if (crownRef.current) {
      if (Math.abs(state.camera.position.x - position[0]) > 85 || Math.abs(state.camera.position.z - position[2]) > 85) return;
      const t = state.clock.getElapsedTime();
      crownRef.current.rotation.z = Math.sin(t * 1.3 + position[0] * 0.15) * 0.035;
      crownRef.current.rotation.x = Math.cos(t * 0.9 + position[2] * 0.15) * 0.025;
    }
  });

  return (
    <group position={position} scale={[scale, scale, scale]} rotation={[0, rotationY, 0]}>
      {/* 1. Fluted Root Flare Base */}
      <mesh position={[0, 0.12, 0]}>
        <cylinderGeometry args={[0.42, 0.65, 0.28, 12]} />
        <meshStandardMaterial color="#3b2b1d" roughness={0.95} />
      </mesh>

      {/* 2. Seamless Continuous Curved Natural Palm Trunk (Zero displaced vertebrae) */}
      <mesh geometry={trunkGeometry} castShadow receiveShadow>
        <meshStandardMaterial
          map={barkDiffuse}
          normalMap={barkNormal}
          normalScale={[0.75, 0.75]}
          roughness={0.9}
        />
      </mesh>

      {/* Physics Collider for Palm Trunk (Solid collision so characters cannot walk through trunks) */}
      <RigidBody type="fixed" colliders={false}>
        <CylinderCollider args={[3.6, 0.45]} position={[curveDirection * 0.45, 3.6, 0]} />
      </RigidBody>

      {/* 3. Crown Shaft, Coconuts and Photorealistic Arching Fronds */}
      <group ref={crownRef} position={[crownX, crownY, 0]}>
        {/* Fibrous lower collar wrapping frond origins */}
        <mesh position={[0, 0.12, 0]}>
          <cylinderGeometry args={[0.26, 0.21, 0.4, 12]} />
          <meshStandardMaterial color="#3a2719" roughness={0.95} />
        </mesh>

        {/* Smooth Emerald Crownshaft Sheath */}
        <mesh position={[0, 0.52, 0]}>
          <cylinderGeometry args={[0.22, 0.25, 0.55, 12]} />
          <meshStandardMaterial color="#365314" roughness={0.65} />
        </mesh>

        {/* Natural Coconut Clusters nestled beneath the fronds (Optimized) */}
        <group position={[0, 0.15, 0]}>
          <mesh position={[0.12, -0.1, 0.08]}>
            <sphereGeometry args={[0.32, 8, 8]} />
            <meshStandardMaterial color="#4d7c0f" roughness={0.55} />
          </mesh>
          <mesh position={[-0.14, -0.12, -0.08]}>
            <sphereGeometry args={[0.34, 8, 8]} />
            <meshStandardMaterial color="#3d2514" roughness={0.85} />
          </mesh>
        </group>

        {/* All 22 Unity-Grade Botanical Arched Palm Fronds in 1 SINGLE DRAW CALL */}
        <mesh
          position={[0, 0.72, 0]}
          geometry={mergedCrownGeometry}
          receiveShadow
        >
          <meshStandardMaterial
            map={frondDiffuse}
            normalMap={frondNormal}
            normalScale={[0.7, 0.7]}
            alphaTest={0.40}
            depthWrite={true}
            side={DoubleSide}
            roughness={0.62}
          />
        </mesh>
      </group>
    </group>
  );
}

// Organic Continuous Flared Tree Trunk Geometry with Integrated Natural Buttress Roots
let cachedOrganicTrunkGeom: BufferGeometry | null = null;
function getOrganicTreeTrunkGeometry(): BufferGeometry {
  if (cachedOrganicTrunkGeom) return cachedOrganicTrunkGeom;

  const geom = new BufferGeometry();
  const heightSegments = 28;
  const radialSegments = 24;
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let i = 0; i <= heightSegments; i++) {
    const t = i / heightSegments;
    const y = t * 3.0; // Trunk height up to scaffold branch split

    // Organic flared base at the soil line (t < 0.35)
    const flare = Math.pow(Math.max(0, 1 - t / 0.38), 2.2) * 0.48;
    // Natural trunk taper
    const baseR = 0.52 * (1 - t * 0.30) + flare;
    // Organic wood knurl rings
    const ringRidge = Math.sin(t * Math.PI * 5) * 0.02;

    for (let j = 0; j <= radialSegments; j++) {
      const u = j / radialSegments;
      const angle = u * Math.PI * 2;

      // 5 smooth organic buttress root lobes flaring seamlessly into the earth
      const buttressLobe = (Math.cos(angle * 5) * 0.5 + 0.5) * Math.max(0, 1 - t / 0.30) * 0.32;
      const r = baseR + ringRidge + buttressLobe;

      const px = Math.cos(angle) * r;
      const pz = Math.sin(angle) * r;
      positions.push(px, y, pz);
      uvs.push(u * 3, t * 4);
    }
  }

  for (let i = 0; i < heightSegments; i++) {
    for (let j = 0; j < radialSegments; j++) {
      const a = i * (radialSegments + 1) + j;
      const b = (i + 1) * (radialSegments + 1) + j;
      const c = b + 1;
      const d = a + 1;
      indices.push(a, b, d);
      indices.push(b, c, d);
    }
  }

  geom.setAttribute('position', new Float32BufferAttribute(positions, 3));
  geom.setAttribute('uv', new Float32BufferAttribute(uvs, 2));
  geom.setIndex(indices);
  geom.computeVertexNormals();

  cachedOrganicTrunkGeom = geom;
  return cachedOrganicTrunkGeom;
}

// Reusable shared resources for coastal tree leaf canopies
let _sharedLeafPlaneGeom: PlaneGeometry | null = null;
let _sharedLeafMaterial: MeshStandardMaterial | null = null;
const _treeDummy = new Object3D();
const _treeColor = new Color();

// High-speed Instanced Canopy for Coastal Shade Trees (1 draw call per tree instead of 144)
function CoastalTreeCanopy({
  leafLayers,
  foliageDiffuse,
  foliageNormal,
}: {
  leafLayers: Array<{
    pos: [number, number, number];
    rot: [number, number, number];
    scale: number;
    tint: string;
  }>;
  foliageDiffuse: CanvasTexture;
  foliageNormal: CanvasTexture;
}) {
  const meshRef = useRef<InstancedMesh>(null);

  const leafMaterial = useMemo(() => {
    if (!_sharedLeafMaterial) {
      _sharedLeafMaterial = new MeshStandardMaterial({
        map: foliageDiffuse,
        normalMap: foliageNormal,
        alphaTest: 0.25,
        depthWrite: true,
        side: DoubleSide,
        roughness: 0.65,
      });
    }
    return _sharedLeafMaterial;
  }, [foliageDiffuse, foliageNormal]);

  const planeGeom = useMemo(() => {
    if (!_sharedLeafPlaneGeom) {
      _sharedLeafPlaneGeom = new PlaneGeometry(1.6, 1.6);
    }
    return _sharedLeafPlaneGeom;
  }, []);

  useLayoutEffect(() => {
    if (!meshRef.current) return;
    const dummy = _treeDummy;
    const tempColor = _treeColor;
    leafLayers.forEach((card, idx) => {
      dummy.position.set(card.pos[0], card.pos[1], card.pos[2]);
      dummy.rotation.set(card.rot[0], card.rot[1], card.rot[2]);
      dummy.scale.set(card.scale, card.scale, card.scale);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(idx, dummy.matrix);
      meshRef.current!.setColorAt(idx, tempColor.set(card.tint));
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true;
    }
  }, [leafLayers]);

  return (
    <instancedMesh
      ref={meshRef}
      args={[planeGeom, leafMaterial, leafLayers.length]}
      receiveShadow
    />
  );
}

// ---------------------------------------------------------------------------
// 4. PHOTOREALISTIC BOTANICAL COASTAL SHADE TREE (ORGANIC TRUNK & LAYERED LEAVES)
// Zero dodecahedrons/spheres: 100% natural layered broadleaf canopy & continuous bark
// ---------------------------------------------------------------------------
export function DetailedCoastalTree({
  position,
  scale = 1.0,
  rotationY = 0,
}: {
  position: [number, number, number];
  scale?: number;
  rotationY?: number;
}) {
  const canopyRef = useRef<Group>(null);
  const { diffuse: barkDiffuse, normal: barkNormal } = useMemo(() => getTreeBarkTextures(), []);
  const { diffuse: foliageDiffuse, normal: foliageNormal } = useMemo(() => getTreeFoliageTexture(), []);

  // Continuous organic trunk mesh with flared buttress roots
  const trunkGeometry = useMemo(() => getOrganicTreeTrunkGeometry(), []);

  // Natural sculptural scaffold limbs and secondary boughs
  const branches = useMemo(() => [
    // Primary scaffold limbs branching outward from Y=2.6
    { start: [0, 2.5, 0], end: [2.2, 4.6, 1.4], r: 0.32 },
    { start: [0, 2.6, 0], end: [-2.2, 4.8, 1.2], r: 0.30 },
    { start: [0, 2.4, 0], end: [-1.6, 4.4, -2.0], r: 0.28 },
    { start: [0, 2.5, 0], end: [1.8, 4.6, -1.8], r: 0.28 },
    { start: [0, 2.7, 0], end: [0.1, 5.8, 0.2], r: 0.34 },
    // Secondary ascending branches
    { start: [2.2, 4.6, 1.4], end: [3.4, 6.2, 2.0], r: 0.20 },
    { start: [-2.2, 4.8, 1.2], end: [-3.2, 6.4, 1.6], r: 0.19 },
    { start: [-1.6, 4.4, -2.0], end: [-2.5, 5.8, -2.8], r: 0.18 },
    { start: [1.8, 4.6, -1.8], end: [2.9, 6.0, -2.4], r: 0.18 },
    { start: [0.1, 5.8, 0.2], end: [-0.6, 7.2, 0.7], r: 0.22 },
    { start: [0.1, 5.8, 0.2], end: [0.7, 7.2, -0.5], r: 0.22 },
    // Tertiary outer boughs for expansive crown spread
    { start: [3.4, 6.2, 2.0], end: [4.2, 6.8, 1.2], r: 0.14 },
    { start: [-3.2, 6.4, 1.6], end: [-4.0, 7.0, 0.8], r: 0.14 },
    { start: [-2.5, 5.8, -2.8], end: [-3.2, 6.5, -3.5], r: 0.13 },
    { start: [2.9, 6.0, -2.4], end: [3.8, 6.6, -2.8], r: 0.13 },
  ], []);

  // Multi-layered dense botanical leaf cards (crossed billboards with natural tilt & rotation)
  const leafLayers = useMemo(() => {
    // 36 botanical canopy cluster anchors across the crown volume
    const clusterCenters: Array<{ pos: [number, number, number]; scale: number; tint: string }> = [
      // Top sunlit crown (fresh emerald & sunlit lime)
      { pos: [0.0, 7.6, 0.1], scale: 2.6, tint: '#4ade80' },
      { pos: [-0.8, 7.4, 0.6], scale: 2.5, tint: '#86efac' },
      { pos: [0.8, 7.4, -0.6], scale: 2.5, tint: '#4ade80' },
      { pos: [0.3, 7.0, 0.4], scale: 2.7, tint: '#22c55e' },
      { pos: [-0.6, 7.2, 0.8], scale: 2.4, tint: '#4ade80' },
      { pos: [0.7, 7.2, -0.6], scale: 2.4, tint: '#86efac' },

      // Upper mid canopy
      { pos: [1.8, 6.6, 1.4], scale: 2.8, tint: '#22c55e' },
      { pos: [-1.8, 6.6, 1.4], scale: 2.8, tint: '#22c55e' },
      { pos: [1.6, 6.6, -1.5], scale: 2.8, tint: '#22c55e' },
      { pos: [-1.6, 6.6, -1.5], scale: 2.8, tint: '#22c55e' },
      { pos: [0.0, 6.8, 2.2], scale: 2.8, tint: '#22c55e' },
      { pos: [0.0, 6.8, -2.2], scale: 2.8, tint: '#22c55e' },
      { pos: [2.4, 6.5, 0.2], scale: 2.7, tint: '#22c55e' },
      { pos: [-2.4, 6.5, 0.2], scale: 2.7, tint: '#22c55e' },

      // Core mid crown (rich forest green)
      { pos: [3.4, 6.0, 1.8], scale: 2.9, tint: '#16a34a' },
      { pos: [2.2, 5.2, 1.4], scale: 2.8, tint: '#16a34a' },
      { pos: [-3.2, 6.0, 1.6], scale: 2.9, tint: '#16a34a' },
      { pos: [-2.0, 5.2, 1.2], scale: 2.8, tint: '#16a34a' },
      { pos: [-2.5, 5.6, -2.4], scale: 2.8, tint: '#16a34a' },
      { pos: [-1.6, 4.8, -1.8], scale: 2.7, tint: '#16a34a' },
      { pos: [2.9, 5.8, -2.2], scale: 2.8, tint: '#16a34a' },
      { pos: [1.8, 4.8, -1.6], scale: 2.7, tint: '#16a34a' },

      // Flank perimeter outer fill
      { pos: [4.0, 6.4, 1.0], scale: 2.5, tint: '#22c55e' },
      { pos: [-3.8, 6.6, 0.6], scale: 2.5, tint: '#22c55e' },
      { pos: [0.2, 6.0, 3.0], scale: 2.6, tint: '#16a34a' },
      { pos: [0.2, 6.0, -3.0], scale: 2.6, tint: '#16a34a' },
      { pos: [3.2, 5.4, -1.2], scale: 2.6, tint: '#16a34a' },
      { pos: [-3.2, 5.4, -1.2], scale: 2.6, tint: '#16a34a' },

      // Lower understory layers (deep shadow emerald)
      { pos: [1.8, 4.4, 1.5], scale: 2.7, tint: '#15803d' },
      { pos: [-1.8, 4.4, -1.5], scale: 2.7, tint: '#15803d' },
      { pos: [1.5, 4.4, -1.5], scale: 2.7, tint: '#15803d' },
      { pos: [-1.5, 4.4, 1.5], scale: 2.7, tint: '#15803d' },
      { pos: [0.0, 4.6, 2.0], scale: 2.6, tint: '#14532d' },
      { pos: [0.0, 4.6, -2.0], scale: 2.6, tint: '#14532d' },
      { pos: [2.5, 4.6, 0.0], scale: 2.6, tint: '#14532d' },
      { pos: [-2.5, 4.6, 0.0], scale: 2.6, tint: '#14532d' },
    ];

    // For each cluster anchor, build 3 crossed leaf cards (at 0, 60, 120 deg) + 1 tilted horizontal sun plate
    const cards: Array<{
      pos: [number, number, number];
      rot: [number, number, number];
      scale: number;
      tint: string;
    }> = [];

    clusterCenters.forEach((c, idx) => {
      // 3 vertical crossed leaf fans
      const baseAng = (idx * 0.45) % Math.PI;
      [0, Math.PI / 3, (Math.PI * 2) / 3].forEach((offsetAng, cardIdx) => {
        cards.push({
          pos: [
            c.pos[0] + Math.cos(baseAng + offsetAng) * 0.22,
            c.pos[1] + (cardIdx === 1 ? 0.12 : -0.08),
            c.pos[2] + Math.sin(baseAng + offsetAng) * 0.22,
          ],
          rot: [0.15 * Math.sin(idx + cardIdx), baseAng + offsetAng, 0.10 * Math.cos(idx)],
          scale: c.scale * (0.92 + (cardIdx % 2) * 0.16),
          tint: c.tint,
        });
      });

      // 1 tilted canopy roof leaf plane (captures overhead sunlight & casts soft shadows)
      cards.push({
        pos: [c.pos[0], c.pos[1] + 0.15, c.pos[2]],
        rot: [Math.PI * 0.38, baseAng, 0],
        scale: c.scale * 1.05,
        tint: c.tint,
      });
    });

    return cards;
  }, []);

  useFrame((state) => {
    if (canopyRef.current) {
      if (Math.abs(state.camera.position.x - position[0]) > 85 || Math.abs(state.camera.position.z - position[2]) > 85) return;
      const t = state.clock.getElapsedTime();
      canopyRef.current.rotation.y = Math.sin(t * 0.7 + position[0] * 0.15) * 0.020;
      canopyRef.current.rotation.z = Math.cos(t * 0.9 + position[2] * 0.15) * 0.014;
    }
  });

  return (
    <group position={position} scale={[scale, scale, scale]} rotation={[0, rotationY, 0]}>
      {/* 1. Continuous Organic Trunk with Flared Buttress Base */}
      <group position={[0, 0, 0]}>
        <mesh geometry={trunkGeometry} castShadow receiveShadow>
          <meshStandardMaterial
            map={barkDiffuse}
            normalMap={barkNormal}
            normalScale={[0.85, 0.85]}
            roughness={0.92}
          />
        </mesh>

        {/* Physics Collider for Shade Tree Trunk (Solid physical barrier so characters cannot walk through trunks) */}
        <RigidBody type="fixed" colliders={false}>
          <CylinderCollider args={[2.5, 0.85]} position={[0, 2.5, 0]} />
        </RigidBody>
      </group>

      {/* 2. Sculptural Scaffold Limbs & Ascending Branches */}
      <group position={[0, 0, 0]}>
        {branches.map((b, bIdx) => {
          const dx = b.end[0] - b.start[0];
          const dy = b.end[1] - b.start[1];
          const dz = b.end[2] - b.start[2];
          const len = Math.hypot(dx, dy, dz);
          const mid = [
            (b.start[0] + b.end[0]) / 2,
            (b.start[1] + b.end[1]) / 2,
            (b.start[2] + b.end[2]) / 2,
          ];

          return (
            <group key={`branch-${bIdx}`} position={mid as [number, number, number]}>
              <mesh rotation={[Math.atan2(dz, Math.hypot(dx, dy)), 0, -Math.atan2(dx, dy)]}>
                <cylinderGeometry args={[b.r * 0.70, b.r, len, 8]} />
                <meshStandardMaterial map={barkDiffuse} normalMap={barkNormal} roughness={0.90} />
              </mesh>
            </group>
          );
        })}
      </group>

      {/* 3. Photorealistic Layered Botanical Broadleaf Canopy in 1 SINGLE INSTANCED DRAW CALL */}
      <group ref={canopyRef} position={[0, 0, 0]}>
        <CoastalTreeCanopy
          leafLayers={leafLayers}
          foliageDiffuse={foliageDiffuse}
          foliageNormal={foliageNormal}
        />
      </group>
    </group>
  );
}

// ---------------------------------------------------------------------------
// 5. COMPLETE EARTH VEGETATION ECOSYSTEM
// ---------------------------------------------------------------------------
export const EARTH_TREES: ReadonlyArray<{
  type: 'palm' | 'shade';
  pos: [number, number, number];
  scale: number;
  rot: number;
  curveDir?: number;
}> = [
  // 1. Prime Atlantic Beach Palm Line (safely along the beach dunes outside the launch complex)
  { type: 'palm', pos: [-20, 0, -68], scale: 1.20, rot: 0.3, curveDir: -1 },
  { type: 'palm', pos: [-22, 0, -48], scale: 1.30, rot: 1.2, curveDir: -1 },
  { type: 'palm', pos: [-21, 0, -32], scale: 1.25, rot: 1.9, curveDir: -1 },
  { type: 'palm', pos: [-21, 0, 32], scale: 1.25, rot: 0.8, curveDir: -1 },
  { type: 'palm', pos: [-22, 0, 52], scale: 1.30, rot: 2.7, curveDir: -1 },
  { type: 'palm', pos: [-20, 0, 72], scale: 1.18, rot: 1.5, curveDir: -1 },

  // 2. North Green Belt (framing the launch complex outside blast radius)
  { type: 'shade', pos: [32, 0, -52], scale: 1.25, rot: 0.5 },
  { type: 'shade', pos: [54, 0, -58], scale: 1.35, rot: 2.2 },
  { type: 'palm', pos: [76, 0, -48], scale: 1.20, rot: 1.8, curveDir: 1 },
  { type: 'shade', pos: [98, 0, -54], scale: 1.30, rot: 3.1 },

  // 3. South Green Belt (outside blast radius)
  { type: 'shade', pos: [32, 0, 54], scale: 1.30, rot: 1.1 },
  { type: 'shade', pos: [58, 0, 58], scale: 1.40, rot: 2.8 },
  { type: 'palm', pos: [82, 0, 52], scale: 1.25, rot: 0.9, curveDir: 1 },
  { type: 'shade', pos: [106, 0, 56], scale: 1.35, rot: 2.0 },

  // 4. Crawlerway Roadside Palms (lining the approach from VAB)
  { type: 'palm', pos: [45, 0, -28], scale: 1.10, rot: 0.4, curveDir: 1 },
  { type: 'palm', pos: [45, 0, 28], scale: 1.10, rot: 2.5, curveDir: -1 },
  { type: 'palm', pos: [75, 0, -28], scale: 1.15, rot: 1.6, curveDir: 1 },
  { type: 'palm', pos: [75, 0, 28], scale: 1.15, rot: 3.4, curveDir: -1 },

  // 5. Distant Horizon Trees
  { type: 'shade', pos: [130, 0, -68], scale: 1.45, rot: 0.7 },
  { type: 'shade', pos: [135, 0, 68], scale: 1.45, rot: 1.9 },
];

export function CompleteEarthVegetation() {
  const trees = EARTH_TREES;

  return (
    <group>
      <RealisticLawn />

      {trees.map((t, i) =>
        t.type === 'palm' ? (
          <DetailedPalmTree
            key={`palm-tree-${i}`}
            position={t.pos}
            scale={t.scale}
            rotationY={t.rot}
            curveDirection={t.curveDir}
          />
        ) : (
          <DetailedCoastalTree
            key={`shade-tree-${i}`}
            position={t.pos}
            scale={t.scale}
            rotationY={t.rot}
          />
        )
      )}
    </group>
  );
}
