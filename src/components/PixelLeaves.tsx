import React, { useMemo, useLayoutEffect, useRef } from 'react';
import {
  CanvasTexture,
  LinearFilter,
  LinearMipmapLinearFilter,
  DoubleSide,
  InstancedMesh,
  Object3D,
  Color,
  SRGBColorSpace,
} from 'three';

// ---------------------------------------------------------------------------
// 1. PROCEDURAL PHOTOREALISTIC BOTANICAL LEAF TEXTURES (HIGH DEFINITION & SMOOTH)
// Replaces chunky pixel-art with soft organic botanical contours and realistic veins
// ---------------------------------------------------------------------------

let cachedGreenBotanicalTexture: CanvasTexture | null = null;
let cachedDryBotanicalTexture: CanvasTexture | null = null;

// A. Lush Tropical Green Botanical Leaf (Smooth organic almond silhouette with venation)
function createBotanicalLeafTexture(): CanvasTexture {
  if (cachedGreenBotanicalTexture) return cachedGreenBotanicalTexture;
  if (typeof document === 'undefined') {
    return new CanvasTexture({} as HTMLCanvasElement);
  }

  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    ctx.clearRect(0, 0, size, size);

    const cx = size / 2;
    const cy = size / 2;

    // Draw realistic organic lanceolate leaf blade
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(-Math.PI / 4);

    ctx.beginPath();
    ctx.moveTo(0, -48);
    // Right leaf curve
    ctx.bezierCurveTo(28, -26, 26, 22, 0, 48);
    // Left leaf curve
    ctx.bezierCurveTo(-26, 22, -28, -26, 0, -48);
    ctx.closePath();

    // Natural lush botanical gradient (dappled sunlight and deep chlorophyll core)
    const bladeGrad = ctx.createRadialGradient(0, -10, 4, 0, 0, 46);
    bladeGrad.addColorStop(0, '#4ade80'); // Sunlit fresh center
    bladeGrad.addColorStop(0.35, '#16a34a'); // Lush emerald body
    bladeGrad.addColorStop(0.75, '#15803d'); // Deep forest green
    bladeGrad.addColorStop(1.0, '#14532d'); // Translucent edge
    ctx.fillStyle = bladeGrad;
    ctx.fill();

    // Subtle leaf edge perimeter shading
    ctx.strokeStyle = 'rgba(20, 83, 45, 0.45)';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Central Midrib (Rachis / Main Spine)
    const midribGrad = ctx.createLinearGradient(0, -48, 0, 52);
    midribGrad.addColorStop(0, '#86efac');
    midribGrad.addColorStop(0.4, '#a3e635');
    midribGrad.addColorStop(0.8, '#4d7c0f');
    midribGrad.addColorStop(1.0, '#365314');

    ctx.strokeStyle = midribGrad;
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.moveTo(0, -46);
    ctx.lineTo(0, 52); // Leaf petiole stem
    ctx.stroke();

    // Delicate lateral secondary veins (Alternating naturally)
    ctx.strokeStyle = 'rgba(187, 247, 208, 0.38)';
    ctx.lineWidth = 1.0;
    for (let y = -34; y < 38; y += 7) {
      const spread = Math.sin(((y + 40) / 80) * Math.PI) * 18;
      // Right vein
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.quadraticCurveTo(spread * 0.5, y + 2, spread, y - 5);
      ctx.stroke();

      // Left vein
      ctx.beginPath();
      ctx.moveTo(0, y + 3);
      ctx.quadraticCurveTo(-spread * 0.5, y + 5, -spread, y - 2);
      ctx.stroke();
    }

    ctx.restore();
  }

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.magFilter = LinearFilter;
  texture.minFilter = LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.needsUpdate = true;
  cachedGreenBotanicalTexture = texture;
  return texture;
}

// B. Golden / Amber Dried Fallen Botanical Leaf (Weathered coastal foliage)
function createDryBotanicalLeafTexture(): CanvasTexture {
  if (cachedDryBotanicalTexture) return cachedDryBotanicalTexture;
  if (typeof document === 'undefined') {
    return new CanvasTexture({} as HTMLCanvasElement);
  }

  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    ctx.clearRect(0, 0, size, size);

    const cx = size / 2;
    const cy = size / 2;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(-Math.PI / 4);

    ctx.beginPath();
    ctx.moveTo(0, -50);
    ctx.bezierCurveTo(24, -28, 22, 24, 0, 50);
    ctx.bezierCurveTo(-22, 24, -24, -28, 0, -50);
    ctx.closePath();

    // Dried warm sun-baked amber gradient
    const bladeGrad = ctx.createRadialGradient(0, -10, 4, 0, 0, 48);
    bladeGrad.addColorStop(0, '#fde68a'); // Sun-bleached highlight
    bladeGrad.addColorStop(0.35, '#d97706'); // Warm amber
    bladeGrad.addColorStop(0.75, '#b45309'); // Rust orange
    bladeGrad.addColorStop(1.0, '#78350f'); // Weathered brown edge
    ctx.fillStyle = bladeGrad;
    ctx.fill();

    ctx.strokeStyle = 'rgba(120, 53, 15, 0.4)';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Dry Central Spine
    ctx.strokeStyle = '#92400e';
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.moveTo(0, -48);
    ctx.lineTo(0, 54);
    ctx.stroke();

    // Dry Veins
    ctx.strokeStyle = 'rgba(254, 243, 199, 0.32)';
    ctx.lineWidth = 0.9;
    for (let y = -36; y < 38; y += 8) {
      const spread = Math.sin(((y + 40) / 80) * Math.PI) * 16;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.quadraticCurveTo(spread * 0.5, y + 2, spread, y - 4);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, y + 3);
      ctx.quadraticCurveTo(-spread * 0.5, y + 5, -spread, y - 2);
      ctx.stroke();
    }

    ctx.restore();
  }

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.magFilter = LinearFilter;
  texture.minFilter = LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.needsUpdate = true;
  cachedDryBotanicalTexture = texture;
  return texture;
}

// ---------------------------------------------------------------------------
// 2. ULTRA-PERFORMANT INSTANCED BOTANICAL LEAF ENGINE (SMOOTH & ZERO LAG)
// ---------------------------------------------------------------------------
interface LeafData {
  pos: [number, number, number];
  rot: [number, number, number];
  scale: [number, number, number];
  color: string;
}

export function PixelLeavesGround({
  clusters,
  floorY = 0.08,
}: {
  clusters: Array<{ center: [number, number]; radius: number; count: number; tint?: string }>;
  floorY?: number;
}) {
  const greenTexture = useMemo(() => createBotanicalLeafTexture(), []);
  const dryTexture = useMemo(() => createDryBotanicalLeafTexture(), []);

  const { greenLeaves, dryLeaves } = useMemo(() => {
    const greenList: LeafData[] = [];
    const dryList: LeafData[] = [];

    const naturalPalette = [
      '#ffffff', // Full texture brightness
      '#ecfdf5', // Soft morning tint
      '#d1fae5', // Pale tropical tint
      '#fef9c3', // Sun-dappled warm green
      '#fef08a', // Golden dry tip
      '#fed7aa', // Sun-bleached amber
      '#e5e7eb', // Neutral natural
    ];

    clusters.forEach((cl, cIdx) => {
      for (let i = 0; i < cl.count; i++) {
        // Natural organic radial dispersion (clustering tighter near tree bases)
        const r = Math.pow(Math.random(), 0.65) * cl.radius;
        const theta = Math.random() * Math.PI * 2;
        const x = cl.center[0] + Math.cos(theta) * r;
        const z = cl.center[1] + Math.sin(theta) * r;

        // Subtle micro-elevations to guarantee zero Z-fighting with ground
        const y = floorY + (i % 8) * 0.002;
        const rotY = Math.random() * Math.PI * 2;
        const tiltX = (Math.random() - 0.5) * 0.08;
        const tiltZ = (Math.random() - 0.5) * 0.08;
        const leafScale = 0.45 + Math.random() * 0.35;
        const isDry = (cIdx * 5 + i) % 3 === 0;

        const leaf: LeafData = {
          pos: [x, y, z],
          rot: [-Math.PI / 2 + tiltX, tiltZ, rotY],
          scale: [leafScale, leafScale, 1],
          color: cl.tint || naturalPalette[(cIdx * 7 + i) % naturalPalette.length],
        };

        if (isDry) {
          dryList.push(leaf);
        } else {
          greenList.push(leaf);
        }
      }
    });

    return { greenLeaves: greenList, dryLeaves: dryList };
  }, [clusters, floorY]);

  const greenMeshRef = useRef<InstancedMesh>(null);
  const dryMeshRef = useRef<InstancedMesh>(null);

  useLayoutEffect(() => {
    const dummy = new Object3D();
    const tempColor = new Color();

    if (greenMeshRef.current && greenLeaves.length > 0) {
      greenLeaves.forEach((leaf, idx) => {
        dummy.position.set(leaf.pos[0], leaf.pos[1], leaf.pos[2]);
        dummy.rotation.set(leaf.rot[0], leaf.rot[1], leaf.rot[2]);
        dummy.scale.set(leaf.scale[0], leaf.scale[1], leaf.scale[2]);
        dummy.updateMatrix();
        greenMeshRef.current!.setMatrixAt(idx, dummy.matrix);
        greenMeshRef.current!.setColorAt(idx, tempColor.set(leaf.color));
      });
      greenMeshRef.current.instanceMatrix.needsUpdate = true;
      if (greenMeshRef.current.instanceColor) {
        greenMeshRef.current.instanceColor.needsUpdate = true;
      }
    }

    if (dryMeshRef.current && dryLeaves.length > 0) {
      dryLeaves.forEach((leaf, idx) => {
        dummy.position.set(leaf.pos[0], leaf.pos[1], leaf.pos[2]);
        dummy.rotation.set(leaf.rot[0], leaf.rot[1], leaf.rot[2]);
        dummy.scale.set(leaf.scale[0], leaf.scale[1], leaf.scale[2]);
        dummy.updateMatrix();
        dryMeshRef.current!.setMatrixAt(idx, dummy.matrix);
        dryMeshRef.current!.setColorAt(idx, tempColor.set(leaf.color));
      });
      dryMeshRef.current.instanceMatrix.needsUpdate = true;
      if (dryMeshRef.current.instanceColor) {
        dryMeshRef.current.instanceColor.needsUpdate = true;
      }
    }
  }, [greenLeaves, dryLeaves]);

  return (
    <group>
      {/* High-speed Instanced Botanical Green Leaves */}
      {greenLeaves.length > 0 && (
        <instancedMesh
          ref={greenMeshRef}
          args={[undefined, undefined, greenLeaves.length]}
          frustumCulled={false}
        >
          <planeGeometry args={[1, 1]} />
          <meshStandardMaterial
            map={greenTexture}
            transparent
            alphaTest={0.08}
            depthWrite={false}
            roughness={0.7}
            metalness={0.02}
            side={DoubleSide}
            polygonOffset
            polygonOffsetFactor={-1}
            polygonOffsetUnits={-1}
          />
        </instancedMesh>
      )}

      {/* High-speed Instanced Botanical Dry Amber Leaves */}
      {dryLeaves.length > 0 && (
        <instancedMesh
          ref={dryMeshRef}
          args={[undefined, undefined, dryLeaves.length]}
          frustumCulled={false}
        >
          <planeGeometry args={[1, 1]} />
          <meshStandardMaterial
            map={dryTexture}
            transparent
            alphaTest={0.08}
            depthWrite={false}
            roughness={0.75}
            metalness={0.02}
            side={DoubleSide}
            polygonOffset
            polygonOffsetFactor={-1}
            polygonOffsetUnits={-1}
          />
        </instancedMesh>
      )}
    </group>
  );
}

// Botanical alias for PixelLeavesGround
export const BotanicalLeavesGround = PixelLeavesGround;

// ---------------------------------------------------------------------------
// 3. COASTAL BEACH PALM BOTANICAL LEAVES (AROUND WEST SHORELINE PALMS)
// ---------------------------------------------------------------------------
export function BeachPalmPixelLeaves() {
  const palmClusters = useMemo(() => [
    { center: [-12, -35] as [number, number], radius: 6.0, count: 24 },
    { center: [-10, -15] as [number, number], radius: 6.5, count: 28 },
    { center: [-11, 10] as [number, number], radius: 5.5, count: 26 },
    { center: [-9, 32] as [number, number], radius: 7.0, count: 30 },
    { center: [-12, 58] as [number, number], radius: 5.8, count: 24 },
    { center: [-14, -2] as [number, number], radius: 7.5, count: 20 },
    { center: [-13, 22] as [number, number], radius: 6.8, count: 20 },
    { center: [-16, -24] as [number, number], radius: 6.2, count: 18 },
    { center: [-15, 45] as [number, number], radius: 6.5, count: 20 },
  ], []);

  return <PixelLeavesGround clusters={palmClusters} floorY={0.06} />;
}

export const BeachPalmBotanicalLeaves = BeachPalmPixelLeaves;

// ---------------------------------------------------------------------------
// 4. HANGAR INTERIOR BOTANICAL LEAVES (SCATTERED NATURALLY ON PERIMETER)
// ---------------------------------------------------------------------------
export function HangarFloorPixelLeaves() {
  const hangarClusters = useMemo(() => [
    { center: [-36, -10] as [number, number], radius: 7.5, count: 20 },
    { center: [-36, 10] as [number, number], radius: 7.5, count: 20 },
    { center: [-28, 0] as [number, number], radius: 8.5, count: 22 },
    { center: [-20, -14] as [number, number], radius: 6.5, count: 16 },
    { center: [-20, 14] as [number, number], radius: 6.5, count: 16 },
    { center: [-10, -20] as [number, number], radius: 6.0, count: 14 },
    { center: [-8, 20] as [number, number], radius: 6.0, count: 14 },
    { center: [0, -28] as [number, number], radius: 6.5, count: 14 },
    { center: [0, 28] as [number, number], radius: 6.5, count: 14 },
    { center: [15, -15] as [number, number], radius: 7.0, count: 16 },
    { center: [15, 15] as [number, number], radius: 7.0, count: 16 },
    { center: [28, 0] as [number, number], radius: 7.5, count: 18 },
  ], []);

  return <PixelLeavesGround clusters={hangarClusters} floorY={0.14} />;
}

export const HangarFloorBotanicalLeaves = HangarFloorPixelLeaves;
