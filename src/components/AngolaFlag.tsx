import React, { useMemo } from 'react';
import { DoubleSide, LinearFilter, LinearMipmapLinearFilter, Texture, CanvasTexture, PlaneGeometry, SRGBColorSpace } from 'three';
import { useTexture } from '@react-three/drei';

interface AngolaFlagProps {
  width?: number;
  height?: number;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
  framed?: boolean;
  radius?: number;
  slope?: number;
  trimColor?: string | null;
  backingColor?: string | null;
}

// Procedural curved hull decal geometry that hugs cylindrical or conical spacecraft fuselages 100% flush
function createCurvedHullGeometry(width: number, height: number, radius = 1.2, slope = 0, segmentsX = 28, segmentsY = 10) {
  const geo = new PlaneGeometry(width, height, segmentsX, segmentsY);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const localR = Math.max(0.25, radius - y * slope);
    const theta = x / localR;
    const cx = localR * Math.sin(theta);
    const cz = localR * Math.cos(theta) - radius;
    pos.setXYZ(i, cx, y, cz);
  }
  geo.computeVertexNormals();
  return geo;
}

// Ensure maximum sharpness and anisotropic filtering on decal textures without redundant GPU re-uploads
const _configuredTextures = new WeakSet<Texture>();

function configureHighDefTexture(texture: Texture) {
  if (texture && !_configuredTextures.has(texture)) {
    _configuredTextures.add(texture);
    texture.anisotropy = 8;
    texture.generateMipmaps = true;
    texture.minFilter = LinearMipmapLinearFilter;
    texture.magFilter = LinearFilter;
    texture.needsUpdate = true;
  }
  return texture;
}

export function AngolaFlag({ width = 3, height = 2, position = [0, 0, 0], rotation = [0, 0, 0] }: AngolaFlagProps) {
  const texture = useTexture('/angola_flag.jpg');
  useMemo(() => configureHighDefTexture(texture), [texture]);

  return (
    <group position={position} rotation={rotation}>
      <mesh>
        <planeGeometry args={[width, height]} />
        <meshStandardMaterial map={texture} side={DoubleSide} roughness={0.6} />
      </mesh>
    </group>
  );
}

export function AngolaFlagDecal({ position = [0, 0, 0], rotation = [0, 0, 0], scale = [1, 1, 1] }: AngolaFlagProps) {
  const texture = useTexture('/angola_flag.jpg');
  useMemo(() => configureHighDefTexture(texture), [texture]);

  return (
    <group position={position} rotation={rotation} scale={scale}>
      {/* High-Grade Embroidered Patch Frame */}
      <mesh position={[0, 0, -0.003]}>
        <boxGeometry args={[1.04, 0.70, 0.006]} />
        <meshStandardMaterial color="#0f172a" roughness={0.8} metalness={0.2} />
      </mesh>
      {/* Gold Trim Piping */}
      <mesh position={[0, 0, -0.001]}>
        <boxGeometry args={[1.02, 0.68, 0.004]} />
        <meshStandardMaterial color="#eab308" roughness={0.35} metalness={0.7} />
      </mesh>
      {/* Flag Decal Surface */}
      <mesh>
        <planeGeometry args={[1, 0.66]} />
        <meshStandardMaterial
          map={texture}
          roughness={0.45}
          metalness={0.05}
          polygonOffset
          polygonOffsetFactor={-1}
          polygonOffsetUnits={-1}
        />
      </mesh>
    </group>
  );
}

/**
 * Flush Curved Angola Flag Decal for Cylindrical or Conical Spacecraft Fuselages
 */
export function CurvedAngolaFlagDecal({
  width = 0.92,
  height = 0.60,
  radius = 1.25,
  slope = 0,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = [1, 1, 1],
  trimColor = '#eab308',
}: AngolaFlagProps) {
  const texture = useTexture('/angola_flag.jpg');
  useMemo(() => configureHighDefTexture(texture), [texture]);

  const trimGeo = useMemo(
    () => (trimColor ? createCurvedHullGeometry(width + 0.05, height + 0.05, radius, slope) : null),
    [width, height, radius, slope, trimColor]
  );
  const flagGeo = useMemo(() => createCurvedHullGeometry(width, height, radius + 0.003, slope), [width, height, radius, slope]);

  return (
    <group position={position} rotation={rotation} scale={scale}>
      {trimGeo && trimColor && (
        <mesh geometry={trimGeo}>
          <meshStandardMaterial
            color={trimColor}
            metalness={0.85}
            roughness={0.22}
            side={DoubleSide}
            polygonOffset
            polygonOffsetFactor={-2}
            polygonOffsetUnits={-2}
          />
        </mesh>
      )}
      <mesh geometry={flagGeo} position={[0, 0, 0.002]}>
        <meshStandardMaterial
          map={texture}
          roughness={0.32}
          metalness={0.08}
          side={DoubleSide}
          polygonOffset
          polygonOffsetFactor={-4}
          polygonOffsetUnits={-4}
        />
      </mesh>
    </group>
  );
}

/**
 * Flush Curved GGPEN Logo Decal for Cylindrical or Conical Spacecraft Fuselages
 */
export function CurvedGGPENLogoDecal({
  width = 0.96,
  height = 0.58,
  radius = 1.25,
  slope = 0,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = [1, 1, 1],
  trimColor = '#eab308',
  backingColor = '#ffffff',
}: AngolaFlagProps) {
  const texture = useTexture('/ggpen_logo.png');
  useMemo(() => configureHighDefTexture(texture), [texture]);

  const trimGeo = useMemo(
    () => (trimColor ? createCurvedHullGeometry(width + 0.05, height + 0.05, radius, slope) : null),
    [width, height, radius, slope, trimColor]
  );
  const baseGeo = useMemo(
    () => (backingColor ? createCurvedHullGeometry(width, height, radius + 0.002, slope) : null),
    [width, height, radius, slope, backingColor]
  );
  const logoGeo = useMemo(() => createCurvedHullGeometry(width - 0.02, height - 0.02, radius + 0.005, slope), [width, height, radius, slope]);

  return (
    <group position={position} rotation={rotation} scale={scale}>
      {trimGeo && trimColor && (
        <mesh geometry={trimGeo}>
          <meshStandardMaterial
            color={trimColor}
            metalness={0.85}
            roughness={0.22}
            side={DoubleSide}
            polygonOffset
            polygonOffsetFactor={-2}
            polygonOffsetUnits={-2}
          />
        </mesh>
      )}
      {baseGeo && backingColor && (
        <mesh geometry={baseGeo} position={[0, 0, 0.001]}>
          <meshStandardMaterial
            color={backingColor}
            roughness={0.25}
            metalness={0.05}
            side={DoubleSide}
            polygonOffset
            polygonOffsetFactor={-3}
            polygonOffsetUnits={-3}
          />
        </mesh>
      )}
      <mesh geometry={logoGeo} position={[0, 0, 0.003]}>
        <meshStandardMaterial
          map={texture}
          transparent
          alphaTest={0.01}
          roughness={0.22}
          metalness={0.05}
          side={DoubleSide}
          polygonOffset
          polygonOffsetFactor={-5}
          polygonOffsetUnits={-5}
        />
      </mesh>
    </group>
  );
}

/**
 * Flush Curved Astronavega Logo Decal for Cylindrical or Conical Spacecraft Fuselages
 */
export function CurvedAstronavegaLogoDecal({
  width = 2.0,
  height = 2.2,
  radius = 2.91,
  slope = 0.01,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = [1, 1, 1],
}: AngolaFlagProps) {
  const texture = useTexture('/astronavega_logo.png');
  useMemo(() => configureHighDefTexture(texture), [texture]);

  const decalGeo = useMemo(
    () => createCurvedHullGeometry(width, height, radius, slope, 28, 12),
    [width, height, radius, slope]
  );

  return (
    <group position={position} rotation={rotation} scale={scale}>
      <mesh geometry={decalGeo}>
        <meshStandardMaterial
          map={texture}
          transparent
          alphaTest={0.01}
          roughness={0.26}
          metalness={0.06}
          side={DoubleSide}
          polygonOffset
          polygonOffsetFactor={-4}
          polygonOffsetUnits={-4}
        />
      </mesh>
    </group>
  );
}

export function GGPENLogoDecal({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = [1, 1, 1],
  framed = false,
}: AngolaFlagProps) {
  const texture = useTexture('/ggpen_logo.png');
  useMemo(() => configureHighDefTexture(texture), [texture]);

  // Aspect ratio 1.64:1
  const height = 1.0;
  const width = 1.64;

  return (
    <group position={position} rotation={rotation} scale={scale}>
      {framed && (
        <>
          <mesh position={[0, 0, -0.004]}>
            <boxGeometry args={[width + 0.08, height + 0.08, 0.012]} />
            <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.25} />
          </mesh>
          <mesh position={[0, 0, -0.001]}>
            <planeGeometry args={[width + 0.03, height + 0.03]} />
            <meshStandardMaterial color="#ffffff" roughness={0.2} metalness={0.05} />
          </mesh>
        </>
      )}

      {/* Pure High-Definition GGPEN Official Decal with Transparent Background */}
      <mesh position={[0, 0, 0.002]}>
        <planeGeometry args={[width, height]} />
        <meshStandardMaterial
          map={texture}
          transparent
          alphaTest={0.01}
          roughness={0.25}
          metalness={0.05}
          polygonOffset
          polygonOffsetFactor={-1}
          polygonOffsetUnits={-1}
        />
      </mesh>
    </group>
  );
}

export function NasaSpaceAppsLuandaDecal({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = [1, 1, 1],
  framed = false,
}: AngolaFlagProps) {
  // Official NASA Space Apps Challenge Luanda Emblem (600 x 320 = 1.875:1 ratio)
  const texture = useTexture('/nasa_space_apps_luanda.svg');
  useMemo(() => configureHighDefTexture(texture), [texture]);

  // Proportional height matching GGPEN logo (0.6088) with exact 1.875:1 aspect ratio
  const height = 0.6088;
  const width = height * 1.875;

  return (
    <group position={position} rotation={rotation} scale={scale}>
      {framed && (
        <>
          <mesh position={[0, 0, -0.004]}>
            <boxGeometry args={[width + 0.08, height + 0.08, 0.012]} />
            <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.25} />
          </mesh>
          <mesh position={[0, 0, -0.001]}>
            <planeGeometry args={[width + 0.03, height + 0.03]} />
            <meshStandardMaterial color="#ffffff" roughness={0.2} metalness={0.05} />
          </mesh>
        </>
      )}

      {/* Official Decal Plane with Authentic 2:1 Geometry and High Sharpness */}
      <mesh position={[0, 0, 0.004]}>
        <planeGeometry args={[width, height]} />
        <meshStandardMaterial
          map={texture}
          transparent
          alphaTest={0.01}
          roughness={0.2}
          metalness={0.05}
          polygonOffset
          polygonOffsetFactor={-2}
          polygonOffsetUnits={-2}
        />
      </mesh>
    </group>
  );
}

export function NASAMeatballDecal({ position = [0, 0, 0], rotation = [0, 0, 0], scale = [1, 1, 1] }: AngolaFlagProps) {
  const texture = useTexture('/nasa_logo.svg');
  useMemo(() => configureHighDefTexture(texture), [texture]);

  return (
    <group position={position} rotation={rotation} scale={scale}>
      <mesh position={[0, 0, -0.001]}>
        <circleGeometry args={[0.52, 32]} />
        <meshStandardMaterial color="#020617" roughness={0.8} />
      </mesh>
      <mesh>
        <planeGeometry args={[1, 1]} />
        <meshStandardMaterial
          map={texture}
          transparent
          roughness={0.4}
          metalness={0.1}
          polygonOffset
          polygonOffsetFactor={-1}
          polygonOffsetUnits={-1}
        />
      </mesh>
    </group>
  );
}

export function AstronavegaLogoDecal({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = [1, 1, 1],
  framed = false,
}: AngolaFlagProps) {
  const texture = useTexture('/astronavega_logo.png');
  useMemo(() => configureHighDefTexture(texture), [texture]);

  // Aspect ratio 420:460 ≈ 0.913:1
  const height = 1.0;
  const width = 0.913;

  return (
    <group position={position} rotation={rotation} scale={scale}>
      {framed && (
        <>
          <mesh position={[0, 0, -0.004]}>
            <boxGeometry args={[width + 0.08, height + 0.08, 0.012]} />
            <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.25} />
          </mesh>
          <mesh position={[0, 0, -0.001]}>
            <planeGeometry args={[width + 0.03, height + 0.03]} />
            <meshStandardMaterial color="#ffffff" roughness={0.2} metalness={0.05} />
          </mesh>
        </>
      )}

      {/* Official Astronavega Decal Plane with Transparent Background */}
      <mesh position={[0, 0, 0.002]}>
        <planeGeometry args={[width, height]} />
        <meshStandardMaterial
          map={texture}
          transparent
          alphaTest={0.01}
          roughness={0.25}
          metalness={0.05}
          polygonOffset
          polygonOffsetFactor={-1}
          polygonOffsetUnits={-1}
        />
      </mesh>
    </group>
  );
}

let cachedCabecaAbertaTexture: CanvasTexture | null = null;

function getProcessedCabecaAbertaTexture(): CanvasTexture | null {
  if (cachedCabecaAbertaTexture) return cachedCabecaAbertaTexture;
  if (typeof document === 'undefined') return null;

  // Initialize power-of-two canvas upfront BEFORE constructing CanvasTexture
  // so mipmaps & GPU allocation dimensions never mismatch when img.onload fires!
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const tex = new CanvasTexture(canvas);
  tex.generateMipmaps = false;
  tex.minFilter = LinearFilter;
  tex.magFilter = LinearFilter;
  tex.anisotropy = 8;
  cachedCabecaAbertaTexture = tex;

  const img = new Image();
  img.src = '/cabeca_aberta_logo.png';
  img.onload = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;

    // Harmonize contrast for white rocket livery:
    // 1. Key out the dark gradient background (transparent)
    // 2. Transform text & jigsaw silhouette into crisp dark aerospace slate (#0f172a)
    // 3. Preserve electric cyan puzzle highlight (#00e5ff)
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      const isCyan = g > 145 && b > 165 && r < 130;
      const isDarkBg = r < 85 && g < 85 && b < 85;

      if (isDarkBg) {
        data[i + 3] = 0;
      } else if (isCyan) {
        data[i] = 0;
        data[i + 1] = 229;
        data[i + 2] = 255;
        data[i + 3] = 255;
      } else {
        data[i] = 15;
        data[i + 1] = 23;
        data[i + 2] = 42;
        data[i + 3] = 255;
      }
    }

    ctx.putImageData(imgData, 0, 0);
    tex.needsUpdate = true;
  };

  return cachedCabecaAbertaTexture;
}

/**
 * Flush Curved Cabeça Aberta Logo Decal for Cylindrical or Conical Spacecraft Fuselages
 */
export function CurvedCabecaAbertaLogoDecal({
  width = 3.55,
  height = 1.80,
  radius = 2.95,
  slope = 0.01,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = [1, 1, 1],
}: AngolaFlagProps) {
  const fallbackTexture = useTexture('/cabeca_aberta_logo.png');
  useMemo(() => configureHighDefTexture(fallbackTexture), [fallbackTexture]);

  const processedTexture = useMemo(() => getProcessedCabecaAbertaTexture(), []);
  const activeTexture = processedTexture || fallbackTexture;

  const decalGeo = useMemo(
    () => createCurvedHullGeometry(width, height, radius, slope, 28, 12),
    [width, height, radius, slope]
  );

  return (
    <group position={position} rotation={rotation} scale={scale}>
      <mesh geometry={decalGeo}>
        <meshStandardMaterial
          map={activeTexture}
          transparent
          alphaTest={0.01}
          roughness={0.25}
          metalness={0.05}
          side={DoubleSide}
          polygonOffset
          polygonOffsetFactor={-4}
          polygonOffsetUnits={-4}
        />
      </mesh>
    </group>
  );
}

export function CabecaAbertaLogoDecal({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = [1, 1, 1],
  framed = false,
}: AngolaFlagProps) {
  const fallbackTexture = useTexture('/cabeca_aberta_logo.png');
  useMemo(() => configureHighDefTexture(fallbackTexture), [fallbackTexture]);

  const processedTexture = useMemo(() => getProcessedCabecaAbertaTexture(), []);
  const activeTexture = processedTexture || fallbackTexture;

  // Aspect ratio 530:270 ≈ 1.963:1
  const height = 0.8;
  const width = height * 1.963;

  return (
    <group position={position} rotation={rotation} scale={scale}>
      {framed && (
        <>
          <mesh position={[0, 0, -0.004]}>
            <boxGeometry args={[width + 0.08, height + 0.08, 0.012]} />
            <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.25} />
          </mesh>
          <mesh position={[0, 0, -0.001]}>
            <planeGeometry args={[width + 0.03, height + 0.03]} />
            <meshStandardMaterial color="#ffffff" roughness={0.2} metalness={0.05} />
          </mesh>
        </>
      )}

      {/* Official High-Contrast Cabeça Aberta Decal Plane with Transparent Background matching rocket livery */}
      <mesh position={[0, 0, 0.004]}>
        <planeGeometry args={[width, height]} />
        <meshStandardMaterial
          map={activeTexture}
          transparent
          alphaTest={0.01}
          roughness={0.25}
          metalness={0.05}
          polygonOffset
          polygonOffsetFactor={-2}
          polygonOffsetUnits={-2}
        />
      </mesh>
    </group>
  );
}

let cachedOfficialAngolaFlagTex: CanvasTexture | null = null;

export function getOfficialAngolaFlagTexture(): CanvasTexture | null {
  if (cachedOfficialAngolaFlagTex) return cachedOfficialAngolaFlagTex;
  if (typeof document === 'undefined') return null;

  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 682;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  // Immediate Angola flag base fill while high-res image loads
  ctx.fillStyle = '#cc092f';
  ctx.fillRect(0, 0, canvas.width, canvas.height / 2);
  ctx.fillStyle = '#09090b';
  ctx.fillRect(0, canvas.height / 2, canvas.width, canvas.height / 2);

  const tex = new CanvasTexture(canvas);
  tex.colorSpace = SRGBColorSpace;
  tex.generateMipmaps = false;
  tex.minFilter = LinearFilter;
  tex.magFilter = LinearFilter;
  tex.anisotropy = 8;
  tex.needsUpdate = true;
  cachedOfficialAngolaFlagTex = tex;

  const img = new Image();
  img.src = '/angola_flag.jpg';
  img.onload = () => {
    const tmp = document.createElement('canvas');
    tmp.width = img.naturalWidth || img.width;
    tmp.height = img.naturalHeight || img.height;
    const tctx = tmp.getContext('2d');
    if (tctx && tmp.width > 0 && tmp.height > 0) {
      tctx.drawImage(img, 0, 0);
      const { data, width, height } = tctx.getImageData(0, 0, tmp.width, tmp.height);

      // Trim any light-grey studio padding around the red/black Angola flag fabric
      let minX = width;
      let minY = height;
      let maxX = 0;
      let maxY = 0;
      let found = false;

      for (let y = 0; y < height; y += 2) {
        for (let x = 0; x < width; x += 2) {
          const idx = (y * width + x) * 4;
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];
          const isRed = r > 120 && g < 85 && b < 85;
          const isBlack = r < 70 && g < 70 && b < 70;
          if (isRed || isBlack) {
            found = true;
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          }
        }
      }

      if (found && maxX - minX > width * 0.25 && maxY - minY > height * 0.2) {
        const pad = 2;
        const sx = Math.max(0, minX + pad);
        const sy = Math.max(0, minY + pad);
        const sw = Math.max(1, maxX - minX - pad * 2);
        const sh = Math.max(1, maxY - minY - pad * 2);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(tmp, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      }
      tex.needsUpdate = true;
    }
  };

  return cachedOfficialAngolaFlagTex;
}

useTexture.preload('/angola_flag.jpg');
useTexture.preload('/ggpen_logo.png');
useTexture.preload('/nasa_space_apps_luanda.svg');
useTexture.preload('/space_apps_luanda_emblem.png');
useTexture.preload('/nasa_logo.svg');
useTexture.preload('/astronavega_logo.png');
useTexture.preload('/cabeca_aberta_logo.png');
