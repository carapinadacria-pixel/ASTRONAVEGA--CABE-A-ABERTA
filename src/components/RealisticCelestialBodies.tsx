import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import {
  AdditiveBlending,
  BackSide,
  CanvasTexture,
  Color,
  DoubleSide,
  Group,
  LinearFilter,
  MathUtils,
  Mesh,
  RepeatWrapping,
  RingGeometry,
  ShaderMaterial,
  SRGBColorSpace,
  Vector3,
} from 'three';

// ============================================================================
// 1. REALISTIC ANIMATED SUN (PHOTOSPHERE, SUNSPOTS, PROMINENCES & CORONA)
// ============================================================================

const SUN_SURFACE_VERTEX = `
  varying vec3 vLocalPos;
  varying vec3 vWorldNormal;
  varying vec3 vWorldPosition;

  void main() {
    vLocalPos = position;
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPos.xyz;
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

const SUN_PHOTOSPHERE_FRAGMENT = `
  uniform float uTime;
  varying vec3 vLocalPos;
  varying vec3 vWorldNormal;
  varying vec3 vWorldPosition;

  float hash(vec3 p) {
    p = fract(p * vec3(443.8975, 397.2973, 491.1871));
    p += dot(p, p.yxz + 19.19);
    return fract((p.x + p.y) * p.z);
  }

  float noise3(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float n000 = hash(i + vec3(0.0, 0.0, 0.0));
    float n100 = hash(i + vec3(1.0, 0.0, 0.0));
    float n010 = hash(i + vec3(0.0, 1.0, 0.0));
    float n110 = hash(i + vec3(1.0, 1.0, 0.0));
    float n001 = hash(i + vec3(0.0, 0.0, 1.0));
    float n101 = hash(i + vec3(1.0, 0.0, 1.0));
    float n011 = hash(i + vec3(0.0, 1.0, 1.0));
    float n111 = hash(i + vec3(1.0, 1.0, 1.0));
    float nx00 = mix(n000, n100, f.x);
    float nx10 = mix(n010, n110, f.x);
    float nx01 = mix(n001, n101, f.x);
    float nx11 = mix(n011, n111, f.x);
    float nxy0 = mix(nx00, nx10, f.y);
    float nxy1 = mix(nx01, nx11, f.y);
    return mix(nxy0, nxy1, f.z);
  }

  float fbm(vec3 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 5; i++) {
      v += a * noise3(p);
      p = p * 2.06 + vec3(13.1, -7.4, 9.7);
      a *= 0.5;
    }
    return v;
  }

  void main() {
    vec3 dir = normalize(vLocalPos);
    vec3 nrm = normalize(vWorldNormal);
    vec3 viewDir = normalize(cameraPosition - vWorldPosition);
    float ndotv = clamp(dot(nrm, viewDir), 0.0, 1.0);

    // Slow solar differential rotation + boiling convective plasma turbulence
    float angle = uTime * 0.025;
    mat2 rot = mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
    vec3 p = dir;
    p.xz = rot * p.xz;

    vec3 flow = vec3(
      fbm(p * 4.5 + vec3(0.0, uTime * 0.08, 0.0)),
      fbm(p * 4.5 + vec3(5.2, -uTime * 0.06, 2.1)),
      fbm(p * 4.5 + vec3(-3.1, 1.8, uTime * 0.07))
    );

    float granules = fbm(p * 11.5 + flow * 2.2 + vec3(uTime * 0.09));
    float fineCells = noise3(p * 28.0 - flow * 1.5 - vec3(uTime * 0.14));
    float plasma = clamp(granules * 0.72 + fineCells * 0.28, 0.0, 1.0);

    // Solar magnetic sunspots clustered along mid-latitudes
    float latBand = smoothstep(0.68, 0.18, abs(dir.y));
    float spotField = fbm(p * 3.8 + vec3(1.7, -2.3, 4.1));
    float sunspotMask = smoothstep(0.70, 0.78, spotField) * latBand;
    float faculaeMask = smoothstep(0.60, 0.70, spotField) * (1.0 - sunspotMask) * latBand;

    // Temperature color ramp: dark umbra -> crimson-orange -> gold -> blinding white-yellow
    vec3 deepOrange = vec3(0.88, 0.24, 0.03);
    vec3 solarAmber = vec3(1.00, 0.58, 0.08);
    vec3 brightGold = vec3(1.00, 0.88, 0.42);
    vec3 whiteCore  = vec3(1.00, 0.99, 0.88);
    vec3 umbraColor = vec3(0.28, 0.05, 0.01);

    vec3 surface = mix(deepOrange, solarAmber, smoothstep(0.22, 0.52, plasma));
    surface = mix(surface, brightGold, smoothstep(0.50, 0.76, plasma));
    surface = mix(surface, whiteCore, smoothstep(0.74, 0.94, plasma));
    surface += vec3(0.24, 0.14, 0.02) * faculaeMask;
    surface = mix(surface, umbraColor, sunspotMask * 0.82);

    // Authentic solar limb darkening (bright hot center, cooler deep fiery rim)
    float limb = pow(ndotv, 0.48);
    vec3 limbTint = mix(vec3(0.95, 0.28, 0.04), vec3(1.05, 1.02, 0.96), limb);
    vec3 finalCol = surface * limbTint * mix(0.76, 1.18, limb);

    gl_FragColor = vec4(finalCol, 1.0);
  }
`;

const SUN_PROMINENCE_FRAGMENT = `
  uniform float uTime;
  varying vec3 vLocalPos;
  varying vec3 vWorldNormal;
  varying vec3 vWorldPosition;

  float hash(vec3 p) {
    p = fract(p * vec3(443.8975, 397.2973, 491.1871));
    p += dot(p, p.yxz + 19.19);
    return fract((p.x + p.y) * p.z);
  }

  float noise3(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(mix(hash(i), hash(i + vec3(1,0,0)), f.x),
          mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
      mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
          mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y),
      f.z
    );
  }

  void main() {
    vec3 dir = normalize(vLocalPos);
    vec3 nrm = normalize(vWorldNormal);
    vec3 viewDir = normalize(cameraPosition - vWorldPosition);
    float ndotv = clamp(dot(nrm, viewDir), 0.0, 1.0);

    // Edge-concentrated fiery chromosphere wisps & flaring bursts
    float rim = pow(1.0 - ndotv, 2.2);
    float wispA = noise3(dir * 9.0 + vec3(uTime * 0.25, -uTime * 0.18, uTime * 0.14));
    float wispB = noise3(dir * 18.0 - vec3(uTime * 0.35, uTime * 0.22, -uTime * 0.19));
    float flare = smoothstep(0.36, 0.85, wispA * 0.65 + wispB * 0.35);

    vec3 col = mix(vec3(1.0, 0.35, 0.04), vec3(1.0, 0.85, 0.35), flare);
    float alpha = rim * (0.28 + flare * 0.65);

    gl_FragColor = vec4(col, alpha);
  }
`;

const SUN_CORONA_HALO_FRAGMENT = `
  uniform vec3 uColor;
  uniform float uPower;
  uniform float uIntensity;
  varying vec3 vWorldNormal;
  varying vec3 vWorldPosition;

  void main() {
    vec3 nrm = normalize(vWorldNormal);
    vec3 viewDir = normalize(cameraPosition - vWorldPosition);
    float ndotv = clamp(dot(nrm, -viewDir), 0.0, 1.0);
    float glow = pow(ndotv, uPower) * uIntensity;
    gl_FragColor = vec4(uColor, glow);
  }
`;

const SOLAR_LOOP_ANGLES: [number, number, number, number][] = [
  [0.25, 0.6, 0.4, 1.0],
  [-0.45, 2.1, -0.3, 0.92],
  [0.12, 3.8, 0.5, 0.96],
  [-0.28, 5.1, -0.45, 0.88],
  [0.52, 1.4, 0.25, 0.84],
  [-0.85, 2.9, 0.65, 0.9],
  [0.95, 4.4, -0.55, 0.86],
];

let cachedSunFarGlowTex: CanvasTexture | null = null;
export function getSunFarGlowTexture(): CanvasTexture | null {
  if (cachedSunFarGlowTex) return cachedSunFarGlowTex;
  if (typeof document === 'undefined') return null;

  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const c = size / 2;
    const grad = ctx.createRadialGradient(c, c, 0, c, c, c);
    grad.addColorStop(0.0, 'rgba(255, 255, 255, 1.0)');
    grad.addColorStop(0.18, 'rgba(255, 240, 175, 0.78)');
    grad.addColorStop(0.45, 'rgba(255, 190, 95, 0.34)');
    grad.addColorStop(0.75, 'rgba(255, 140, 50, 0.10)');
    grad.addColorStop(1.0, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
  }
  cachedSunFarGlowTex = new CanvasTexture(canvas);
  cachedSunFarGlowTex.colorSpace = SRGBColorSpace;
  return cachedSunFarGlowTex;
}

export function RealisticSun({ radius = 3680 }: { radius?: number }) {
  const sunRootRef = useRef<Group>(null);
  const flareGroupRef = useRef<Group>(null);
  const labelRef = useRef<Group>(null);
  const farGlowTex = useMemo(() => getSunFarGlowTexture(), []);

  const photosphereMaterial = useMemo(
    () =>
      new ShaderMaterial({
        uniforms: { uTime: { value: 0 } },
        vertexShader: SUN_SURFACE_VERTEX,
        fragmentShader: SUN_PHOTOSPHERE_FRAGMENT,
        toneMapped: false,
      }),
    []
  );

  const chromosphereMaterial = useMemo(
    () =>
      new ShaderMaterial({
        uniforms: { uTime: { value: 0 } },
        vertexShader: SUN_SURFACE_VERTEX,
        fragmentShader: SUN_PROMINENCE_FRAGMENT,
        transparent: true,
        blending: AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
      }),
    []
  );

  const innerCoronaMaterial = useMemo(
    () =>
      new ShaderMaterial({
        uniforms: {
          uColor: { value: new Color('#fbbf24') },
          uPower: { value: 3.1 },
          uIntensity: { value: 0.82 },
        },
        vertexShader: SUN_SURFACE_VERTEX,
        fragmentShader: SUN_CORONA_HALO_FRAGMENT,
        transparent: true,
        blending: AdditiveBlending,
        side: BackSide,
        depthWrite: false,
        toneMapped: false,
      }),
    []
  );

  const outerCoronaMaterial = useMemo(
    () =>
      new ShaderMaterial({
        uniforms: {
          uColor: { value: new Color('#f97316') },
          uPower: { value: 4.0 },
          uIntensity: { value: 0.52 },
        },
        vertexShader: SUN_SURFACE_VERTEX,
        fragmentShader: SUN_CORONA_HALO_FRAGMENT,
        transparent: true,
        blending: AdditiveBlending,
        side: BackSide,
        depthWrite: false,
        toneMapped: false,
      }),
    []
  );

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    photosphereMaterial.uniforms.uTime.value = t;
    chromosphereMaterial.uniforms.uTime.value = t;
    if (flareGroupRef.current) {
      flareGroupRef.current.rotation.y += Math.min(delta, 0.05) * 0.015;
    }
    if (sunRootRef.current) {
      // Permanent minimum apparent angular size so the Sun never shrinks to a faint speck even at outer exoplanets
      const camDist = state.camera.position.length();
      const apparentScale = Math.max(1.0, (camDist * 0.13) / radius);
      sunRootRef.current.scale.setScalar(apparentScale);
    }
    if (labelRef.current) {
      labelRef.current.lookAt(state.camera.position);
    }
  });

  return (
    <group ref={sunRootRef} position={[0, 0, 0]} frustumCulled={false}>
      {/* Animated Convective Photosphere with Granulation, Sunspots & Limb Darkening */}
      <mesh material={photosphereMaterial} frustumCulled={false}>
        <sphereGeometry args={[radius, 72, 72]} />
      </mesh>

      {/* Dynamic Chromospheric Plasma Wisps */}
      <mesh material={chromosphereMaterial} frustumCulled={false}>
        <sphereGeometry args={[radius * 1.038, 64, 64]} />
      </mesh>

      {/* 3D Magnetic Solar Prominence Loops Erupting Around the Limb */}
      <group ref={flareGroupRef} frustumCulled={false}>
        {SOLAR_LOOP_ANGLES.map(([rx, ry, rz, sc], idx) => (
          <group key={`sun-loop-${idx}`} rotation={[rx, ry, rz]} frustumCulled={false}>
            <mesh position={[radius * 0.94, 0, 0]} rotation={[0, 0, -Math.PI / 2]} scale={sc} frustumCulled={false}>
              <torusGeometry args={[radius * 0.14, radius * 0.014, 10, 32, Math.PI]} />
              <meshBasicMaterial
                color="#fb923c"
                transparent
                opacity={0.58}
                blending={AdditiveBlending}
                depthWrite={false}
                toneMapped={false}
              />
            </mesh>
          </group>
        ))}
      </group>

      {/* High-Power Omnidirectional Solar Illumination */}
      <pointLight intensity={36} distance={280000} decay={0.16} color="#fff1db" />

      {/* Volumetric Inner Gold Corona Halo */}
      <mesh material={innerCoronaMaterial} frustumCulled={false}>
        <sphereGeometry args={[radius * 1.32, 48, 48]} />
      </mesh>

      {/* Extended Amber-Orange Outer Corona Bloom */}
      <mesh material={outerCoronaMaterial} frustumCulled={false}>
        <sphereGeometry args={[radius * 1.95, 36, 36]} />
      </mesh>

      {/* 360-Degree Distance-Invariant Corona Flare Sprite (Visible from any angle & farthest exoplanets) */}
      {farGlowTex && (
        <sprite scale={[radius * 4.6, radius * 4.6, 1]} frustumCulled={false}>
          <spriteMaterial
            map={farGlowTex}
            color="#fde047"
            transparent
            opacity={0.85}
            blending={AdditiveBlending}
            depthWrite={false}
            toneMapped={false}
          />
        </sprite>
      )}

      <group ref={labelRef} position={[0, radius * 1.18, 0]} frustumCulled={false}>
        <Text
          fontSize={radius * 0.085}
          color="#fef3c7"
          outlineWidth={4}
          outlineColor="#000000"
          frustumCulled={false}
        >
          SOL • CENTRO DO SISTEMA SOLAR
        </Text>
      </group>
    </group>
  );
}

// ============================================================================
// 2. REALISTIC SATURN (PLANET GLOBE, POLAR HEXAGON, CONCENTRIC RINGS & SHADOW)
// ============================================================================

let cachedSaturnAlbedo: CanvasTexture | null = null;
let cachedSaturnRingTex: CanvasTexture | null = null;
let cachedSaturnSkyTex: CanvasTexture | null = null;
let cachedSaturnCloudTex: CanvasTexture | null = null;

function pseudoRand(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453123;
  return x - Math.floor(x);
}

export function getRealisticSaturnTexture(): CanvasTexture | null {
  if (cachedSaturnAlbedo) return cachedSaturnAlbedo;
  if (typeof document === 'undefined') return null;

  const w = 1024;
  const h = 512;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    // Rich Cassini-inspired latitudinal gradient from North Polar Hexagon to South Pole
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0.00, '#5a6b7c'); // North polar slate-teal hexagon core
    grad.addColorStop(0.06, '#7b8a91'); // North polar jet boundary
    grad.addColorStop(0.14, '#a89674'); // Temperate north olive-amber belt
    grad.addColorStop(0.24, '#cbb082'); // Warm ochre zone
    grad.addColorStop(0.32, '#b9935b'); // North equatorial belt
    grad.addColorStop(0.42, '#ebd7ad'); // Bright creamy equatorial zone
    grad.addColorStop(0.50, '#f4e6c3'); // Luminous equatorial ridge
    grad.addColorStop(0.58, '#e3c896'); // South equatorial transition
    grad.addColorStop(0.67, '#bc955e'); // South equatorial belt
    grad.addColorStop(0.77, '#d4b886'); // Mid-south pale butterscotch
    grad.addColorStop(0.87, '#a58a66'); // High southern amber-taupe belt
    grad.addColorStop(0.95, '#7e776f'); // South polar collar
    grad.addColorStop(1.00, '#5d5b59'); // South polar vortex
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Fine zonal micro-striations & wind shear ripples
    for (let y = 0; y < h; y += 2) {
      const lat = y / h;
      const bandShade = Math.sin(lat * 64.0) * 0.04 + Math.cos(lat * 140.0) * 0.025;
      ctx.fillStyle = bandShade > 0 ? `rgba(255, 248, 225, ${bandShade})` : `rgba(88, 62, 32, ${-bandShade * 1.3})`;
      ctx.fillRect(0, y, w, 2);
    }

    // Wavy jet-stream ribbons & subtle atmospheric storm ovals
    for (let i = 0; i < 42; i++) {
      const yBase = (0.14 + pseudoRand(i * 3.1) * 0.72) * h;
      const thickness = 3 + pseudoRand(i * 7.7) * 7;
      const isLight = i % 2 === 0;
      ctx.strokeStyle = isLight ? 'rgba(254, 243, 199, 0.14)' : 'rgba(120, 82, 40, 0.14)';
      ctx.lineWidth = thickness;
      ctx.beginPath();
      for (let x = 0; x <= w; x += 16) {
        const wave = Math.sin((x / w) * Math.PI * 2 * (2 + (i % 3)) + i) * 3.2;
        if (x === 0) ctx.moveTo(x, yBase + wave);
        else ctx.lineTo(x, yBase + wave);
      }
      ctx.stroke();
    }

    // North Polar Hexagonal Jet Stream signature (wavy sinusoidal ring near y = 26..42 in equirectangular projection)
    ctx.strokeStyle = 'rgba(226, 232, 240, 0.34)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    for (let x = 0; x <= w; x += 8) {
      const theta = (x / w) * Math.PI * 2;
      const hexMod = Math.cos(theta * 6.0) * 6.5; // 6-lobed standing wave = hexagon around North Pole!
      const py = 30 + hexMod;
      if (x === 0) ctx.moveTo(x, py);
      else ctx.lineTo(x, py);
    }
    ctx.stroke();

    // Subtle white ammonia storm spots
    for (let s = 0; s < 14; s++) {
      const sx = pseudoRand(s * 19.3) * w;
      const sy = (0.28 + pseudoRand(s * 11.7) * 0.44) * h;
      const rx = 8 + pseudoRand(s * 5.3) * 18;
      const ry = 3 + pseudoRand(s * 2.9) * 5;
      const spotGrad = ctx.createRadialGradient(sx, sy, 1, sx, sy, rx);
      spotGrad.addColorStop(0, 'rgba(255, 251, 235, 0.35)');
      spotGrad.addColorStop(1, 'rgba(255, 251, 235, 0)');
      ctx.fillStyle = spotGrad;
      ctx.beginPath();
      ctx.ellipse(sx, sy, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  cachedSaturnAlbedo = new CanvasTexture(canvas);
  cachedSaturnAlbedo.colorSpace = SRGBColorSpace;
  cachedSaturnAlbedo.wrapS = RepeatWrapping;
  cachedSaturnAlbedo.anisotropy = 8;
  return cachedSaturnAlbedo;
}

export function getSaturnRingProfileTexture(): CanvasTexture | null {
  if (cachedSaturnRingTex) return cachedSaturnRingTex;
  if (typeof document === 'undefined') return null;

  const w = 1024;
  const h = 32;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    for (let x = 0; x < w; x++) {
      const t = x / (w - 1); // 0 = inner C-ring edge, 1 = outer F-ring edge
      let r = 215;
      let g = 188;
      let b = 142;
      let a = 0.0;

      // High-frequency microscopic ringlet texture modulation
      const ringlet =
        0.88 +
        0.07 * Math.sin(t * 420.0) +
        0.05 * Math.cos(t * 910.0) +
        0.04 * Math.sin(t * 175.0);

      if (t < 0.02) {
        // Soft inner edge fade
        a = (t / 0.02) * 0.14;
        r = 148; g = 132; b = 114;
      } else if (t < 0.16) {
        // C Ring (Crepe Ring - smoky bronze-charcoal translucent veil)
        r = 152 * ringlet;
        g = 134 * ringlet;
        b = 115 * ringlet;
        a = 0.22 + 0.10 * Math.sin(t * 140.0);
      } else if (t < 0.53) {
        // B Ring (Dense bright icy gold-cream ring)
        const bFactor = (t - 0.16) / 0.37;
        r = (238 - bFactor * 16) * ringlet;
        g = (216 - bFactor * 20) * ringlet;
        b = (168 - bFactor * 26) * ringlet;
        a = 0.78 + 0.16 * Math.sin(bFactor * 28.0) * 0.5 + 0.12 * ringlet;
      } else if (t < 0.59) {
        // Cassini Division (Crisp dark gap)
        r = 72;
        g = 66;
        b = 60;
        a = 0.06;
      } else if (t < 0.87) {
        // A Ring (Luminous warm champagne-taupe ring with Encke Gap at ~0.79)
        const enckeDist = Math.abs(t - 0.795);
        const enckeMask = enckeDist < 0.011 ? 0.12 : 1.0;
        const keelerMask = Math.abs(t - 0.858) < 0.004 ? 0.22 : 1.0;
        r = 216 * ringlet;
        g = 192 * ringlet;
        b = 152 * ringlet;
        a = (0.58 + 0.12 * Math.sin(t * 210.0)) * enckeMask * keelerMask;
      } else if (t >= 0.92 && t <= 0.945) {
        // Narrow Outer F Ring
        r = 242;
        g = 224;
        b = 186;
        a = 0.45 * (1.0 - Math.abs(t - 0.9325) / 0.0125);
      } else {
        a = 0.0;
      }

      ctx.fillStyle = `rgba(${Math.min(255, Math.round(r))}, ${Math.min(255, Math.round(g))}, ${Math.min(255, Math.round(b))}, ${Math.max(0, Math.min(1, a)).toFixed(3)})`;
      ctx.fillRect(x, 0, 1, h);
    }
  }

  cachedSaturnRingTex = new CanvasTexture(canvas);
  cachedSaturnRingTex.colorSpace = SRGBColorSpace;
  cachedSaturnRingTex.minFilter = LinearFilter;
  cachedSaturnRingTex.magFilter = LinearFilter;
  cachedSaturnRingTex.anisotropy = 8;
  return cachedSaturnRingTex;
}

const SATURN_ATMOS_VERTEX = `
  varying vec3 vWorldNormal;
  varying vec3 vWorldPosition;

  void main() {
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPos.xyz;
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

const SATURN_RIM_FRAGMENT = `
  uniform vec3 uSunDir;
  uniform vec3 uDayColor;
  varying vec3 vWorldNormal;
  varying vec3 vWorldPosition;

  void main() {
    vec3 normal = normalize(vWorldNormal);
    vec3 viewDir = normalize(cameraPosition - vWorldPosition);
    float ndotv = clamp(dot(normal, viewDir), 0.0, 1.0);
    float fresnel = pow(1.0 - ndotv, 3.2);
    float sunDot = dot(normal, normalize(uSunDir));
    float dayMask = smoothstep(-0.35, 0.50, sunDot);
    float alpha = fresnel * mix(0.14, 0.72, dayMask);
    gl_FragColor = vec4(uDayColor, alpha);
  }
`;

const SATURN_RING_VERTEX = `
  varying vec2 vUv;
  varying vec3 vWorldPos;

  void main() {
    vUv = uv;
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vWorldPos = wp.xyz;
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

const SATURN_RING_FRAGMENT = `
  uniform sampler2D uRingMap;
  uniform vec3 uPlanetCenter;
  uniform float uPlanetRadius;
  uniform vec3 uSunDir;
  uniform float uBrightness;
  varying vec2 vUv;
  varying vec3 vWorldPos;

  void main() {
    vec4 tex = texture2D(uRingMap, vec2(vUv.x, 0.5));
    if (tex.a < 0.015) discard;

    // Planetary shadow cast onto the night-side rings
    vec3 relPos = vWorldPos - uPlanetCenter;
    vec3 sunDir = normalize(uSunDir);
    float proj = dot(relPos, sunDir);
    float shadow = 1.0;
    if (proj < 0.0) {
      vec3 perp = relPos - sunDir * proj;
      perp.y /= 0.905; // Account for Saturn oblateness
      float dist = length(perp);
      shadow = mix(0.08, 1.0, smoothstep(uPlanetRadius * 0.95, uPlanetRadius * 1.03, dist));
    }

    vec3 litColor = tex.rgb * uBrightness * shadow;
    gl_FragColor = vec4(litColor, tex.a);
  }
`;

function createRadialRingGeometry(innerR: number, outerR: number, thetaSegments = 128): RingGeometry {
  const geo = new RingGeometry(innerR, outerR, thetaSegments, 3);
  const posAttr = geo.attributes.position;
  const uvAttr = geo.attributes.uv;
  const span = outerR - innerR;
  for (let i = 0; i < posAttr.count; i++) {
    const x = posAttr.getX(i);
    const y = posAttr.getY(i);
    const r = Math.hypot(x, y);
    const u = MathUtils.clamp((r - innerR) / span, 0, 1);
    uvAttr.setXY(i, u, 0.5);
  }
  uvAttr.needsUpdate = true;
  return geo;
}

export function RealisticSaturnGlobe({
  radius,
  sunDirection,
  planetWorldPos,
}: {
  radius: number;
  sunDirection: [number, number, number];
  planetWorldPos: [number, number, number];
}) {
  const globeRef = useRef<Mesh>(null);
  const saturnMap = useMemo(() => getRealisticSaturnTexture(), []);
  const ringMap = useMemo(() => getSaturnRingProfileTexture(), []);

  const ringGeo = useMemo(() => createRadialRingGeometry(radius * 1.24, radius * 2.48, 128), [radius]);

  const sunDirVec = useMemo(() => new Vector3(...sunDirection).normalize(), [sunDirection]);
  const centerVec = useMemo(() => new Vector3(...planetWorldPos), [planetWorldPos]);

  const atmosRimMat = useMemo(
    () =>
      new ShaderMaterial({
        uniforms: {
          uSunDir: { value: sunDirVec.clone() },
          uDayColor: { value: new Color('#fde68a') },
        },
        vertexShader: SATURN_ATMOS_VERTEX,
        fragmentShader: SATURN_RIM_FRAGMENT,
        transparent: true,
        blending: AdditiveBlending,
        depthWrite: false,
      }),
    [sunDirVec]
  );

  const ringMaterial = useMemo(
    () =>
      new ShaderMaterial({
        uniforms: {
          uRingMap: { value: ringMap },
          uPlanetCenter: { value: centerVec.clone() },
          uPlanetRadius: { value: radius },
          uSunDir: { value: sunDirVec.clone() },
          uBrightness: { value: 1.08 },
        },
        vertexShader: SATURN_RING_VERTEX,
        fragmentShader: SATURN_RING_FRAGMENT,
        transparent: true,
        side: DoubleSide,
        depthWrite: false,
      }),
    [ringMap, centerVec, radius, sunDirVec]
  );

  useFrame((_, delta) => {
    if (globeRef.current) {
      globeRef.current.rotation.y += Math.min(delta, 0.05) * 0.015;
    }
  });

  return (
    <group rotation={[0, 0, 0.466]}>
      {/* Oblate Saturn Globe with North Polar Hexagon & Cassini Zonal Bands */}
      <mesh ref={globeRef} scale={[1, 0.905, 1]}>
        <sphereGeometry args={[radius, 72, 72]} />
        <meshStandardMaterial
          map={saturnMap || undefined}
          color="#ffffff"
          roughness={0.78}
          metalness={0.04}
          emissive="#452706"
          emissiveIntensity={0.07}
        />
      </mesh>

      {/* Golden Atmospheric Limb Scattering */}
      <mesh scale={[1, 0.905, 1]} material={atmosRimMat}>
        <sphereGeometry args={[radius * 1.032, 48, 48]} />
      </mesh>

      {/* Concentric Multi-Band Ring System (C, B, Cassini Division, A, Encke Gap, F) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} geometry={ringGeo} material={ringMaterial} />
    </group>
  );
}

// ============================================================================
// 3. SATURN INTERIOR ATMOSPHERE (AEROSTAT SKY BANDS, CLOUDS & ARCHING RINGS)
// ============================================================================

function getSaturnInteriorSkyTexture(): CanvasTexture | null {
  if (cachedSaturnSkyTex) return cachedSaturnSkyTex;
  if (typeof document === 'undefined') return null;

  const w = 1024;
  const h = 512;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0.00, '#131826'); // Deep upper stratosphere slate-indigo
    grad.addColorStop(0.22, '#2d2336'); // High atmospheric twilight violet-bronze
    grad.addColorStop(0.40, '#6d4423'); // Warm bronze upper haze
    grad.addColorStop(0.49, '#c78c3a'); // Sunlit golden atmospheric horizon
    grad.addColorStop(0.54, '#e0ac54'); // Bright sunlit aerosol layer
    grad.addColorStop(0.68, '#9a6523'); // Deep golden-ochre lower deck
    grad.addColorStop(1.00, '#42250a'); // Deep abyss beneath aerostat station
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Soft atmospheric jet cloud streaks across horizon
    for (let i = 0; i < 32; i++) {
      const y = (0.34 + pseudoRand(i * 4.7) * 0.34) * h;
      const alpha = 0.04 + pseudoRand(i * 9.3) * 0.08;
      ctx.fillStyle = i % 2 === 0 ? `rgba(254, 240, 138, ${alpha})` : `rgba(120, 53, 15, ${alpha})`;
      ctx.fillRect(0, y, w, 4 + pseudoRand(i * 2.1) * 14);
    }
  }

  cachedSaturnSkyTex = new CanvasTexture(canvas);
  cachedSaturnSkyTex.colorSpace = SRGBColorSpace;
  cachedSaturnSkyTex.wrapS = RepeatWrapping;
  return cachedSaturnSkyTex;
}

function getSaturnCloudDeckTexture(): CanvasTexture | null {
  if (cachedSaturnCloudTex) return cachedSaturnCloudTex;
  if (typeof document === 'undefined') return null;

  const w = 512;
  const h = 512;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    ctx.fillStyle = '#b7791f';
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 65; i++) {
      const y = (i / 65) * h;
      const bandH = 6 + pseudoRand(i * 3.3) * 14;
      ctx.fillStyle =
        i % 3 === 0
          ? 'rgba(253, 230, 138, 0.24)'
          : i % 3 === 1
          ? 'rgba(217, 119, 6, 0.26)'
          : 'rgba(120, 53, 15, 0.22)';
      ctx.fillRect(0, y, w, bandH);
    }
    for (let j = 0; j < 28; j++) {
      const x = pseudoRand(j * 13.7) * w;
      const y = pseudoRand(j * 7.1) * h;
      const r = 24 + pseudoRand(j * 5.9) * 55;
      const g = ctx.createRadialGradient(x, y, 2, x, y, r);
      g.addColorStop(0, 'rgba(254, 249, 195, 0.25)');
      g.addColorStop(1, 'rgba(254, 249, 195, 0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(x, y, r * 1.8, r * 0.7, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  cachedSaturnCloudTex = new CanvasTexture(canvas);
  cachedSaturnCloudTex.colorSpace = SRGBColorSpace;
  cachedSaturnCloudTex.wrapS = RepeatWrapping;
  cachedSaturnCloudTex.wrapT = RepeatWrapping;
  cachedSaturnCloudTex.repeat.set(6, 6);
  return cachedSaturnCloudTex;
}

export function SaturnInteriorAtmosphere() {
  const skyTex = useMemo(() => getSaturnInteriorSkyTexture(), []);
  const cloudTex = useMemo(() => getSaturnCloudDeckTexture(), []);
  const ringTex = useMemo(() => getSaturnRingProfileTexture(), []);
  const skyRingGeo = useMemo(() => createRadialRingGeometry(680, 1480, 128), []);
  const cloudDeckRef = useRef<Mesh>(null);

  useFrame((_, delta) => {
    if (cloudDeckRef.current && cloudTex) {
      cloudTex.offset.x += Math.min(delta, 0.05) * 0.004;
    }
  });

  return (
    <group>
      {/* Stratified Atmospheric Sky Dome */}
      <mesh scale={[-1, 1, 1]} position={[0, 0, 0]}>
        <sphereGeometry args={[2500, 32, 24]} />
        <meshBasicMaterial map={skyTex || undefined} side={BackSide} fog={false} />
      </mesh>

      <fog attach="fog" args={['#9a6523', 95, 880]} />

      {/* Colossal Iconic Saturn Rings Arching Overhead Across the Sky */}
      <group position={[0, -320, -240]} rotation={[0.42, 0.15, -0.34]}>
        <mesh geometry={skyRingGeo}>
          <meshBasicMaterial
            map={ringTex || undefined}
            transparent
            opacity={0.78}
            side={DoubleSide}
            depthWrite={false}
            fog={false}
          />
        </mesh>
      </group>

      {/* Upper Textured Golden Swirling Cloud Deck Below the Aerostat */}
      <mesh ref={cloudDeckRef} position={[0, -24, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[3200, 3200]} />
        <meshStandardMaterial map={cloudTex || undefined} roughness={0.92} metalness={0.0} />
      </mesh>

      {/* Lower Deep Amber Atmospheric Cloud Haze */}
      <mesh position={[0, -68, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[3400, 3400]} />
        <meshBasicMaterial color="#78350f" transparent opacity={0.65} />
      </mesh>
    </group>
  );
}
