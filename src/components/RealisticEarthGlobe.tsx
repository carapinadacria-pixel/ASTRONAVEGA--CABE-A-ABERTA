import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  AdditiveBlending,
  BackSide,
  CanvasTexture,
  Color,
  Group,
  Mesh,
  RepeatWrapping,
  ShaderMaterial,
  SRGBColorSpace,
  Vector3,
} from 'three';

interface RealisticEarthGlobeProps {
  radius: number;
  axialTilt?: number;
  rotationSpeed?: number;
  cloudSpeed?: number;
  sunDirection?: [number, number, number];
  earthshine?: number;
  segments?: number;
}

interface EarthTextureBundle {
  albedoMap: CanvasTexture | null;
  roughnessMap: CanvasTexture | null;
  cloudMap: CanvasTexture | null;
}

let cachedEarthBundle: EarthTextureBundle | null = null;

// Deterministic hash-noise helper so coastlines and cloud swirls look organic & repeatable
function pseudoRandom(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453123;
  return x - Math.floor(x);
}

// Subdivide & perturb geographic coastline rings to turn coarse coordinates into organic coastal bays & peninsulas
function subdivideCoastline(
  pts: [number, number][],
  iterations = 3,
  roughness = 0.22,
  seedOffset = 1
): [number, number][] {
  let current = pts;
  for (let iter = 0; iter < iterations; iter++) {
    const next: [number, number][] = [];
    const ampScale = roughness / Math.pow(1.65, iter);
    for (let i = 0; i < current.length; i++) {
      const p0 = current[i];
      const p1 = current[(i + 1) % current.length];
      next.push(p0);

      const dx = p1[0] - p0[0];
      const dy = p1[1] - p0[1];
      const segLen = Math.hypot(dx, dy);
      if (segLen > 0.001) {
        const nx = -dy / segLen;
        const ny = dx / segLen;
        const r = pseudoRandom(i * 17.3 + iter * 91.7 + seedOffset * 13.1) - 0.5;
        const disp = segLen * ampScale * r;
        next.push([(p0[0] + p1[0]) * 0.5 + nx * disp, (p0[1] + p1[1]) * 0.5 + ny * disp]);
      }
    }
    current = next;
  }
  return current;
}

function getEarthTextureBundle(): EarthTextureBundle {
  if (cachedEarthBundle) return cachedEarthBundle;
  if (typeof document === 'undefined') {
    return { albedoMap: null, roughnessMap: null, cloudMap: null };
  }

  const w = 2048;
  const h = 1024;

  // Map geographic Longitude [-180..180] & Latitude [90..-90] to equirectangular canvas pixels
  const lonLat = (lon: number, lat: number): [number, number] => [
    ((lon + 180) / 360) * w,
    ((90 - lat) / 180) * h,
  ];

  const traceCoast = (ctx: CanvasRenderingContext2D, lonLatPts: [number, number][], seed: number, iters = 3) => {
    const pxPts = lonLatPts.map(([lon, lat]) => lonLat(lon, lat));
    const organic = subdivideCoastline(pxPts, iters, 0.24, seed);
    ctx.beginPath();
    ctx.moveTo(organic[0][0], organic[0][1]);
    for (let i = 1; i < organic.length; i++) {
      ctx.lineTo(organic[i][0], organic[i][1]);
    }
    ctx.closePath();
    return organic;
  };

  // 1. ALBEDO SURFACE TEXTURE (2048 x 1024)
  const albedoCanvas = document.createElement('canvas');
  albedoCanvas.width = w;
  albedoCanvas.height = h;
  const ctx = albedoCanvas.getContext('2d');

  // 2. COMPLEMENTARY ROUGHNESS TEXTURE (2048 x 1024) -> Oceans glossy (dark), Continents matte (bright)
  const roughCanvas = document.createElement('canvas');
  roughCanvas.width = w;
  roughCanvas.height = h;
  const rCtx = roughCanvas.getContext('2d');

  // Geographic polygons (lon, lat)
  const landmasses: {
    pts: [number, number][];
    seed: number;
    baseColor: string;
    iters?: number;
    biomes: { lon: number; lat: number; rx: number; ry: number; rot: number; col: string; alpha?: number }[];
  }[] = [
    // NORTH AMERICA & CENTRAL AMERICA
    {
      seed: 11,
      baseColor: '#1b5e20',
      pts: [
        [-168, 66], [-156, 71], [-136, 70], [-115, 72], [-92, 70], [-78, 63],
        [-63, 58], [-55, 51], [-66, 44], [-75, 36], [-81, 25], [-84, 30],
        [-90, 29], [-97, 26], [-96, 19], [-88, 21], [-83, 10], [-78, 8],
        [-84, 9], [-93, 15], [-105, 20], [-113, 30], [-118, 33], [-124, 41],
        [-125, 49], [-136, 58], [-152, 60], [-162, 56], [-166, 61],
      ],
      biomes: [
        { lon: -115, lat: 60, rx: 140, ry: 55, rot: -0.2, col: '#365314', alpha: 0.7 }, // Boreal forest
        { lon: -112, lat: 37, rx: 70, ry: 55, rot: 0.25, col: '#b45309', alpha: 0.72 }, // Rockies / Southwest
        { lon: -110, lat: 46, rx: 40, ry: 70, rot: 0.15, col: '#92400e', alpha: 0.55 },
        { lon: -95, lat: 39, rx: 90, ry: 45, rot: 0.0, col: '#3f6212', alpha: 0.65 },  // Plains
        { lon: -135, lat: 65, rx: 110, ry: 32, rot: 0.0, col: '#cbd5e1', alpha: 0.55 }, // Tundra frost
      ],
    },
    // GREENLAND
    {
      seed: 17,
      baseColor: '#e2e8f0',
      pts: [
        [-58, 76], [-42, 83], [-18, 81], [-22, 71], [-36, 65], [-44, 60],
        [-52, 66], [-56, 72],
      ],
      biomes: [
        { lon: -42, lat: 72, rx: 52, ry: 60, rot: 0.1, col: '#f8fafc', alpha: 0.9 },
      ],
    },
    // SOUTH AMERICA
    {
      seed: 23,
      baseColor: '#14532d',
      pts: [
        [-78, 9], [-72, 12], [-62, 10], [-50, 1], [-35, -6], [-38, -14],
        [-41, -22], [-48, -26], [-53, -34], [-62, -40], [-67, -48], [-68, -55],
        [-74, -52], [-74, -42], [-71, -30], [-70, -18], [-78, -12], [-81, -5],
        [-79, 2],
      ],
      biomes: [
        { lon: -61, lat: -4, rx: 95, ry: 60, rot: 0.0, col: '#15803d', alpha: 0.85 },  // Amazon
        { lon: -46, lat: -14, rx: 65, ry: 48, rot: -0.3, col: '#4d7c0f', alpha: 0.68 }, // Cerrado
        { lon: -68, lat: -22, rx: 24, ry: 95, rot: 0.08, col: '#a16207', alpha: 0.78 }, // Andes
        { lon: -64, lat: -38, rx: 38, ry: 65, rot: 0.15, col: '#78716c', alpha: 0.65 }, // Patagonia
      ],
    },
    // EUROPE & SCANDINAVIA
    {
      seed: 31,
      baseColor: '#2d6a32',
      pts: [
        [-9, 37], [-9, 43], [-2, 44], [-5, 48], [2, 51], [8, 55],
        [5, 61], [15, 69], [28, 71], [32, 69], [28, 60], [21, 55],
        [29, 46], [26, 40], [22, 37], [16, 40], [12, 44], [7, 44],
        [3, 42], [-5, 36],
      ],
      biomes: [
        { lon: 16, lat: 64, rx: 55, ry: 32, rot: -0.3, col: '#365314', alpha: 0.7 },
        { lon: 10, lat: 47, rx: 45, ry: 22, rot: 0.0, col: '#78716c', alpha: 0.55 }, // Alps
        { lon: -4, lat: 40, rx: 28, ry: 20, rot: 0.0, col: '#a16207', alpha: 0.55 }, // Iberia
      ],
    },
    // UK & IRELAND
    {
      seed: 37,
      baseColor: '#2e6f34',
      iters: 2,
      pts: [[-6, 50], [-5, 58], [-1, 57], [1, 52], [-3, 50]],
      biomes: [],
    },
    // AFRICA (WITH SAHARA, CONGO, ANGOLA, NAMIBE & SOUTH AFRICA)
    {
      seed: 43,
      baseColor: '#1b5e20',
      pts: [
        [-6, 36], [10, 37], [12, 33], [24, 32], [33, 31], [43, 12],
        [51, 12], [47, 2], [40, -10], [40, -18], [35, -24], [28, -33],
        [18, -35], [15, -26], [12, -16], [13, -6], [9, 4], [2, 6],
        [-8, 5], [-17, 15], [-16, 23], [-10, 31],
      ],
      biomes: [
        { lon: 12, lat: 23, rx: 165, ry: 58, rot: 0.02, col: '#d97706', alpha: 0.92 }, // Sahara
        { lon: 25, lat: 21, rx: 110, ry: 42, rot: -0.05, col: '#eab308', alpha: 0.65 }, // Sahara Dunes
        { lon: 18, lat: 12, rx: 135, ry: 22, rot: 0.0, col: '#a16207', alpha: 0.72 },  // Sahel
        { lon: 21, lat: 0, rx: 72, ry: 42, rot: 0.0, col: '#14532d', alpha: 0.88 },    // Congo Rainforest
        { lon: 17, lat: -12, rx: 38, ry: 34, rot: 0.0, col: '#4d7c0f', alpha: 0.80 },  // Angola Highlands & Savanna
        { lon: 14, lat: -21, rx: 22, ry: 34, rot: 0.1, col: '#ca8a04', alpha: 0.75 },  // Namibe / Kalahari
        { lon: 24, lat: -28, rx: 36, ry: 26, rot: 0.0, col: '#854d0e', alpha: 0.65 },  // South Africa Karoo
      ],
    },
    // MADAGASCAR
    {
      seed: 47,
      baseColor: '#2e6f34',
      iters: 2,
      pts: [[44, -25], [47, -25], [50, -13], [48, -12], [44, -18]],
      biomes: [],
    },
    // ASIA & ARABIA & INDIA
    {
      seed: 53,
      baseColor: '#2d6a32',
      pts: [
        [27, 41], [35, 36], [35, 28], [43, 13], [59, 22], [56, 26],
        [67, 24], [77, 8], [85, 19], [92, 22], [99, 14], [104, 2],
        [108, 12], [110, 20], [121, 24], [122, 31], [120, 39], [129, 36],
        [135, 44], [142, 54], [160, 60], [176, 66], [168, 70], [135, 72],
        [105, 76], [72, 73], [58, 69], [36, 68], [30, 58], [32, 47],
      ],
      biomes: [
        { lon: 46, lat: 23, rx: 68, ry: 44, rot: -0.2, col: '#d97706', alpha: 0.90 },  // Arabian Desert
        { lon: 63, lat: 41, rx: 80, ry: 38, rot: 0.0, col: '#b45309', alpha: 0.72 },   // Central Asia Steppe
        { lon: 94, lat: 42, rx: 95, ry: 34, rot: 0.0, col: '#a16207', alpha: 0.72 },   // Gobi Desert
        { lon: 84, lat: 31, rx: 70, ry: 22, rot: -0.1, col: '#f1f5f9', alpha: 0.85 },  // Himalayas / Tibet Snow
        { lon: 100, lat: 60, rx: 210, ry: 52, rot: 0.0, col: '#365314', alpha: 0.72 }, // Siberian Taiga
        { lon: 112, lat: 69, rx: 220, ry: 24, rot: 0.0, col: '#cbd5e1', alpha: 0.55 }, // Arctic Tundra
      ],
    },
    // JAPAN & MARITIME ISLANDS (SUMATRA, BORNEO, JAVA, NEW GUINEA)
    {
      seed: 61,
      baseColor: '#1f6f34',
      iters: 2,
      pts: [[130, 31], [136, 34], [141, 41], [145, 44], [139, 38], [131, 34]],
      biomes: [],
    },
    {
      seed: 67,
      baseColor: '#15803d',
      iters: 2,
      pts: [[95, 5], [105, -6], [107, -7], [98, 3]],
      biomes: [],
    },
    {
      seed: 71,
      baseColor: '#15803d',
      iters: 2,
      pts: [[109, 2], [118, 6], [117, -3], [111, -3]],
      biomes: [],
    },
    {
      seed: 73,
      baseColor: '#15803d',
      iters: 2,
      pts: [[132, -2], [141, -3], [149, -10], [139, -8]],
      biomes: [],
    },
    // AUSTRALIA & NEW ZEALAND
    {
      seed: 79,
      baseColor: '#b45309',
      pts: [
        [114, -22], [129, -14], [136, -12], [142, -11], [150, -21], [153, -29],
        [149, -37], [141, -38], [135, -34], [123, -34], [115, -34], [113, -27],
      ],
      biomes: [
        { lon: 132, lat: -24, rx: 85, ry: 48, rot: 0.0, col: '#c2410c', alpha: 0.82 }, // Outback
        { lon: 148, lat: -27, rx: 32, ry: 55, rot: 0.15, col: '#3f6212', alpha: 0.72 }, // East Coast Green
      ],
    },
    {
      seed: 83,
      baseColor: '#2e6f34',
      iters: 2,
      pts: [[167, -46], [174, -41], [178, -38], [172, -43]],
      biomes: [],
    },
  ];

  if (ctx && rCtx) {
    // Deep Oceanic Bathymetry Gradient
    const oceanGrad = ctx.createLinearGradient(0, 0, 0, h);
    oceanGrad.addColorStop(0.0, '#0c2340');
    oceanGrad.addColorStop(0.18, '#083366');
    oceanGrad.addColorStop(0.50, '#0b4a82');
    oceanGrad.addColorStop(0.82, '#083366');
    oceanGrad.addColorStop(1.0, '#0c2340');
    ctx.fillStyle = oceanGrad;
    ctx.fillRect(0, 0, w, h);

    // Subtle deep-sea ocean ridges & currents
    for (let i = 0; i < 160; i++) {
      const rx = pseudoRandom(i * 3.1) * w;
      const ry = (0.12 + pseudoRandom(i * 7.3) * 0.76) * h;
      const radX = 35 + pseudoRandom(i * 11.7) * 90;
      const radY = 12 + pseudoRandom(i * 13.9) * 35;
      ctx.fillStyle = i % 2 === 0 ? 'rgba(14, 116, 144, 0.09)' : 'rgba(3, 24, 54, 0.14)';
      ctx.beginPath();
      ctx.ellipse(rx, ry, radX, radY, pseudoRandom(i * 5.3) * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }

    // Roughness base for oceans: ~0.22 (value ~56/255) for crisp solar ocean sheen
    rCtx.fillStyle = 'rgb(56, 56, 56)';
    rCtx.fillRect(0, 0, w, h);

    // Draw shallow continental shelf turquoise glow around each landmass BEFORE solid land
    for (const land of landmasses) {
      traceCoast(ctx, land.pts, land.seed, land.iters ?? 3);
      ctx.save();
      ctx.lineJoin = 'round';
      ctx.strokeStyle = 'rgba(14, 165, 233, 0.28)';
      ctx.lineWidth = 22;
      ctx.stroke();
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.35)';
      ctx.lineWidth = 9;
      ctx.stroke();
      ctx.restore();
    }

    // Draw organic landmasses with clipped biome shading & micro terrain relief
    for (const land of landmasses) {
      traceCoast(ctx, land.pts, land.seed, land.iters ?? 3);
      ctx.save();
      ctx.fillStyle = land.baseColor;
      ctx.fill();
      ctx.clip();

      // Regional biome overlays
      for (const b of land.biomes) {
        const [bx, by] = lonLat(b.lon, b.lat);
        ctx.save();
        ctx.globalAlpha = b.alpha ?? 0.75;
        ctx.fillStyle = b.col;
        ctx.beginPath();
        ctx.ellipse(bx, by, b.rx, b.ry, b.rot, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Fine procedural satellite vegetation/terrain mottling
      for (let m = 0; m < 120; m++) {
        const mx = pseudoRandom(land.seed * 31 + m * 2.3) * w;
        const my = (0.08 + pseudoRandom(land.seed * 17 + m * 4.7) * 0.82) * h;
        const mr = 5 + pseudoRandom(land.seed * 7 + m * 9.1) * 20;
        ctx.fillStyle =
          m % 3 === 0
            ? 'rgba(20, 83, 45, 0.20)'
            : m % 3 === 1
            ? 'rgba(161, 98, 7, 0.14)'
            : 'rgba(132, 204, 22, 0.11)';
        ctx.beginPath();
        ctx.arc(mx, my, mr, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // Mark continent landmass matte on Roughness Map (215/255 ≈ 0.84)
      traceCoast(rCtx, land.pts, land.seed, land.iters ?? 3);
      rCtx.fillStyle = 'rgb(215, 215, 215)';
      rCtx.fill();
    }

    // Jagged Polar Ice Caps (Arctic & Antarctica)
    const drawPolarCap = (yBase: number, dir: 1 | -1, seed: number) => {
      ctx.beginPath();
      rCtx.beginPath();
      const edgeStartY = yBase;
      ctx.moveTo(0, edgeStartY);
      rCtx.moveTo(0, edgeStartY);
      const steps = 64;
      for (let i = 0; i <= steps; i++) {
        const x = (i / steps) * w;
        const jag = (pseudoRandom(seed + i * 3.7) - 0.5) * 32 + Math.sin(i * 0.45) * 14;
        const y = yBase + dir * (36 + jag);
        ctx.lineTo(x, y);
        rCtx.lineTo(x, y);
      }
      const capEdge = dir === 1 ? 0 : h;
      ctx.lineTo(w, capEdge);
      ctx.lineTo(0, capEdge);
      ctx.closePath();
      ctx.fillStyle = '#f1f5f9';
      ctx.fill();

      rCtx.lineTo(w, capEdge);
      rCtx.lineTo(0, capEdge);
      rCtx.closePath();
      rCtx.fillStyle = 'rgb(235, 235, 235)';
      rCtx.fill();
    };
    drawPolarCap(14, 1, 901);   // North Arctic pack ice
    drawPolarCap(h - 32, -1, 907); // Antarctica
  }

  // 3. SOFT VOLUMETRIC SWIRLING CLOUD TEXTURE (1024 x 512)
  const cw = 1024;
  const ch = 512;
  const cloudCanvas = document.createElement('canvas');
  cloudCanvas.width = cw;
  cloudCanvas.height = ch;
  const cCtx = cloudCanvas.getContext('2d');
  if (cCtx) {
    cCtx.clearRect(0, 0, cw, ch);

    // Trade-wind and mid-latitude weather fronts with soft radial gradients (no hard oval edges!)
    for (let i = 0; i < 480; i++) {
      const cx = pseudoRandom(i * 19.1 + 3) * cw;
      const band = i % 3;
      const cy =
        band === 0
          ? (0.18 + pseudoRandom(i * 7.3) * 0.16) * ch
          : band === 1
          ? (0.44 + pseudoRandom(i * 5.9) * 0.14) * ch
          : (0.66 + pseudoRandom(i * 11.1) * 0.18) * ch;
      const rx = 24 + pseudoRandom(i * 13.7) * 76;
      const ry = 7 + pseudoRandom(i * 17.9) * 18;
      const rot = (pseudoRandom(i * 23.3) - 0.5) * 0.55;
      const alpha = 0.08 + pseudoRandom(i * 29.7) * 0.22;

      cCtx.save();
      cCtx.translate(cx, cy);
      cCtx.rotate(rot);
      cCtx.scale(1, ry / rx);
      const grad = cCtx.createRadialGradient(0, 0, 0, 0, 0, rx);
      grad.addColorStop(0.0, `rgba(255, 255, 255, ${alpha})`);
      grad.addColorStop(0.55, `rgba(241, 245, 249, ${alpha * 0.55})`);
      grad.addColorStop(1.0, 'rgba(255, 255, 255, 0)');
      cCtx.fillStyle = grad;
      cCtx.beginPath();
      cCtx.arc(0, 0, rx, 0, Math.PI * 2);
      cCtx.fill();
      cCtx.restore();
    }

    // Subtle spiral cyclone formations
    const cyclones = [
      { x: cw * 0.28, y: ch * 0.36, r: 44 },
      { x: cw * 0.62, y: ch * 0.65, r: 52 },
      { x: cw * 0.80, y: ch * 0.32, r: 38 },
    ];
    for (const cyc of cyclones) {
      for (let arm = 0; arm < 2; arm++) {
        for (let step = 0; step < 18; step++) {
          const t = step / 18;
          const ang = arm * Math.PI + t * Math.PI * 2.2;
          const dist = t * cyc.r;
          const px = cyc.x + Math.cos(ang) * dist;
          const py = cyc.y + Math.sin(ang) * dist * 0.72;
          const pr = 10 + (1 - t) * 12;
          const g = cCtx.createRadialGradient(px, py, 0, px, py, pr);
          g.addColorStop(0, `rgba(255, 255, 255, ${0.22 * (1 - t * 0.5)})`);
          g.addColorStop(1, 'rgba(255, 255, 255, 0)');
          cCtx.fillStyle = g;
          cCtx.beginPath();
          cCtx.arc(px, py, pr, 0, Math.PI * 2);
          cCtx.fill();
        }
      }
    }
  }

  const albedoMap = new CanvasTexture(albedoCanvas);
  albedoMap.colorSpace = SRGBColorSpace;
  albedoMap.wrapS = RepeatWrapping;
  albedoMap.wrapT = RepeatWrapping;
  albedoMap.anisotropy = 8;

  const roughnessMap = new CanvasTexture(roughCanvas);
  roughnessMap.wrapS = RepeatWrapping;
  roughnessMap.wrapT = RepeatWrapping;
  roughnessMap.anisotropy = 8;

  const cloudMap = new CanvasTexture(cloudCanvas);
  cloudMap.colorSpace = SRGBColorSpace;
  cloudMap.wrapS = RepeatWrapping;
  cloudMap.wrapT = RepeatWrapping;
  cloudMap.anisotropy = 8;

  cachedEarthBundle = { albedoMap, roughnessMap, cloudMap };
  return cachedEarthBundle;
}

const ATMOSPHERE_VERTEX = `
  varying vec3 vWorldNormal;
  varying vec3 vWorldPosition;

  void main() {
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPos.xyz;
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

// Crisp Rayleigh Fresnel atmospheric rim shader (zero center washout, luminous azure edge)
const INNER_ATMOS_FRAGMENT = `
  uniform vec3 uSunDir;
  uniform vec3 uDayColor;
  uniform vec3 uTwilightColor;
  varying vec3 vWorldNormal;
  varying vec3 vWorldPosition;

  void main() {
    vec3 normal = normalize(vWorldNormal);
    vec3 viewDir = normalize(cameraPosition - vWorldPosition);
    float ndotv = clamp(dot(normal, viewDir), 0.0, 1.0);
    float fresnel = pow(1.0 - ndotv, 3.3);

    float sunDot = dot(normal, normalize(uSunDir));
    float dayMask = smoothstep(-0.35, 0.45, sunDot);
    float twilight = smoothstep(-0.35, 0.08, sunDot) * (1.0 - smoothstep(0.08, 0.45, sunDot));

    vec3 col = mix(uDayColor, uTwilightColor, twilight * 0.42);
    float alpha = fresnel * mix(0.20, 0.92, dayMask);
    gl_FragColor = vec4(col, alpha);
  }
`;

// Soft outer atmospheric bloom extending subtly into black space
const OUTER_HALO_FRAGMENT = `
  uniform vec3 uSunDir;
  uniform vec3 uGlowColor;
  varying vec3 vWorldNormal;
  varying vec3 vWorldPosition;

  void main() {
    vec3 normal = normalize(vWorldNormal);
    vec3 viewDir = normalize(cameraPosition - vWorldPosition);
    float ndotv = clamp(dot(normal, -viewDir), 0.0, 1.0);
    float halo = pow(ndotv, 3.8);

    float sunDot = dot(normal, normalize(uSunDir));
    float dayMask = smoothstep(-0.30, 0.50, sunDot);

    gl_FragColor = vec4(uGlowColor, halo * mix(0.12, 0.48, dayMask));
  }
`;

export function RealisticEarthGlobe({
  radius,
  axialTilt = 0.409,
  rotationSpeed = 0.012,
  cloudSpeed = 0.020,
  sunDirection = [0.6, 0.35, 0.7],
  earthshine = 0.06,
  segments = 64,
}: RealisticEarthGlobeProps) {
  const surfaceRef = useRef<Mesh>(null);
  const cloudsRef = useRef<Mesh>(null);
  const groupRef = useRef<Group>(null);

  const { albedoMap, roughnessMap, cloudMap } = useMemo(() => getEarthTextureBundle(), []);

  const sunDirVec = useMemo(() => new Vector3(...sunDirection).normalize(), [sunDirection]);

  const innerAtmosMaterial = useMemo(
    () =>
      new ShaderMaterial({
        uniforms: {
          uSunDir: { value: sunDirVec.clone() },
          uDayColor: { value: new Color('#38bdf8') },
          uTwilightColor: { value: new Color('#7dd3fc') },
        },
        vertexShader: ATMOSPHERE_VERTEX,
        fragmentShader: INNER_ATMOS_FRAGMENT,
        transparent: true,
        blending: AdditiveBlending,
        depthWrite: false,
      }),
    [sunDirVec]
  );

  const outerHaloMaterial = useMemo(
    () =>
      new ShaderMaterial({
        uniforms: {
          uSunDir: { value: sunDirVec.clone() },
          uGlowColor: { value: new Color('#0ea5e9') },
        },
        vertexShader: ATMOSPHERE_VERTEX,
        fragmentShader: OUTER_HALO_FRAGMENT,
        transparent: true,
        blending: AdditiveBlending,
        side: BackSide,
        depthWrite: false,
      }),
    [sunDirVec]
  );

  useFrame((_, delta) => {
    const safeDelta = Math.min(delta, 0.05);
    if (surfaceRef.current) {
      surfaceRef.current.rotation.y += safeDelta * rotationSpeed;
    }
    if (cloudsRef.current) {
      cloudsRef.current.rotation.y += safeDelta * cloudSpeed;
    }
  });

  return (
    <group ref={groupRef} rotation={[0, 0, axialTilt]}>
      {/* 1. Primary Earth Planetary Body: Detailed Continents, Ocean Bathymetry & Specular Roughness */}
      <mesh ref={surfaceRef} rotation={[0, -0.45, 0]}>
        <sphereGeometry args={[radius, segments, segments]} />
        <meshStandardMaterial
          map={albedoMap || undefined}
          roughnessMap={roughnessMap || undefined}
          roughness={1.0}
          metalness={0.04}
          emissive="#071e3d"
          emissiveIntensity={earthshine}
        />
      </mesh>

      {/* 2. Dynamic Swirling Cloud Shell */}
      <mesh ref={cloudsRef}>
        <sphereGeometry args={[radius * 1.015, Math.max(36, Math.round(segments * 0.75)), Math.max(36, Math.round(segments * 0.75))]} />
        <meshStandardMaterial
          map={cloudMap || undefined}
          transparent
          opacity={0.78}
          roughness={0.95}
          metalness={0.0}
          depthWrite={false}
          emissive="#0f172a"
          emissiveIntensity={earthshine * 0.8}
        />
      </mesh>

      {/* 3. Crisp Inner Atmospheric Rayleigh Rim Halo (Zero Center Washout) */}
      <mesh material={innerAtmosMaterial}>
        <sphereGeometry args={[radius * 1.028, 48, 48]} />
      </mesh>

      {/* 4. Soft Outer Space Atmospheric Bloom */}
      <mesh material={outerHaloMaterial}>
        <sphereGeometry args={[radius * 1.075, 36, 36]} />
      </mesh>
    </group>
  );
}
