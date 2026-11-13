import React, { useMemo } from 'react';
import { DoubleSide, LinearFilter, LinearMipmapLinearFilter, Texture, CanvasTexture, PlaneGeometry } from 'three';
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
}

// Procedural curved hull decal geometry that hugs cylindrical or conical spacecraft fuselages 100% flush
function createCurvedHullGeometry(width: number, height: number, radius = 1.2, slope = 0, segmentsX = 24, segmentsY = 8) {
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
}: AngolaFlagProps) {
  const texture = useTexture('/angola_flag.jpg');
  useMemo(() => configureHighDefTexture(texture), [texture]);

  const trimGeo = useMemo(() => createCurvedHullGeometry(width + 0.05, height + 0.05, radius, slope), [width, height, radius, slope]);
  const flagGeo = useMemo(() => createCurvedHullGeometry(width, height, radius + 0.003, slope), [width, height, radius, slope]);

  return (
    <group position={position} rotation={rotation} scale={scale}>
      <mesh geometry={trimGeo}>
        <meshStandardMaterial
          color="#eab308"
          metalness={0.85}
          roughness={0.22}
          side={DoubleSide}
          polygonOffset
          polygonOffsetFactor={-2}
          polygonOffsetUnits={-2}
        />
      </mesh>
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
}: AngolaFlagProps) {
  const texture = useTexture('/ggpen_logo.png');
  useMemo(() => configureHighDefTexture(texture), [texture]);

  const trimGeo = useMemo(() => createCurvedHullGeometry(width + 0.05, height + 0.05, radius, slope), [width, height, radius, slope]);
  const baseGeo = useMemo(() => createCurvedHullGeometry(width, height, radius + 0.002, slope), [width, height, radius, slope]);
  const logoGeo = useMemo(() => createCurvedHullGeometry(width - 0.02, height - 0.02, radius + 0.005, slope), [width, height, radius, slope]);

  return (
    <group position={position} rotation={rotation} scale={scale}>
      <mesh geometry={trimGeo}>
        <meshStandardMaterial
          color="#eab308"
          metalness={0.85}
          roughness={0.22}
          side={DoubleSide}
          polygonOffset
          polygonOffsetFactor={-2}
          polygonOffsetUnits={-2}
        />
      </mesh>
      <mesh geometry={baseGeo} position={[0, 0, 0.001]}>
        <meshStandardMaterial
          color="#ffffff"
          roughness={0.25}
          metalness={0.05}
          side={DoubleSide}
          polygonOffset
          polygonOffsetFactor={-3}
          polygonOffsetUnits={-3}
        />
      </mesh>
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

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const img = new Image();
  img.src = '/cabeca_aberta_logo.png';
  img.onload = () => {
    canvas.width = img.width || 530;
    canvas.height = img.height || 270;
    ctx.drawImage(img, 0, 0);

    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;

    // Harmonize contrast for aerospace rocket:
    // 1. Key out the dark gradient background (make it transparent)
    // 2. Transform the white text ("Cabeça Aberta", "Inovação") & white head puzzle pieces into
    //    sharp aerospace dark navy/charcoal (#0f172a) so it stands out with high contrast on the white rocket!
    // 3. Keep the vibrant electric cyan puzzle piece (#00e5ff) brilliant and striking!
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      const isCyan = (g > 150 && b > 175 && r < 125);
      const isDarkBg = (r < 85 && g < 85 && b < 85);

      if (isDarkBg) {
        data[i + 3] = 0; // Transparent background
      } else if (isCyan) {
        // Vibrant aerospace electric cyan puzzle piece
        data[i] = 0;
        data[i + 1] = 229;
        data[i + 2] = 255;
        data[i + 3] = 255;
      } else {
        // High-contrast aerospace carbon/navy text and jigsaw profile
        data[i] = 15;
        data[i + 1] = 23;
        data[i + 2] = 42;
        data[i + 3] = 255;
      }
    }

    ctx.putImageData(imgData, 0, 0);
    if (cachedCabecaAbertaTexture) {
      cachedCabecaAbertaTexture.needsUpdate = true;
    }
  };

  cachedCabecaAbertaTexture = new CanvasTexture(canvas);
  cachedCabecaAbertaTexture.generateMipmaps = true;
  cachedCabecaAbertaTexture.anisotropy = 8;
  return cachedCabecaAbertaTexture;
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

useTexture.preload('/angola_flag.jpg');
useTexture.preload('/ggpen_logo.png');
useTexture.preload('/nasa_space_apps_luanda.svg');
useTexture.preload('/space_apps_luanda_emblem.png');
useTexture.preload('/nasa_logo.svg');
useTexture.preload('/astronavega_logo.png');
useTexture.preload('/cabeca_aberta_logo.png');

