import { createNoise2D } from 'simplex-noise';

// Simple seeded random number generator
function seededRandom(seed: number) {
  return function() {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
}

const noiseCache = new Map<number, ReturnType<typeof createNoise2D>>();
export function getNoise2D(planetId: number) {
  let noise2D = noiseCache.get(planetId);
  if (!noise2D) {
    noise2D = createNoise2D(seededRandom(planetId));
    noiseCache.set(planetId, noise2D);
  }
  return noise2D;
}

export function getTerrainHeight(x: number, z: number, planetId: number): number {
  if (planetId === 0) return 0; // Earth is completely flat

  const noise2D = getNoise2D(planetId);
  
  let height = 0;
  let amplitude = 12;
  let frequency = 0.015;
  
  for(let j = 0; j < 4; j++) {
     height += noise2D(x * frequency, z * frequency) * amplitude;
     amplitude *= 0.5;
     frequency *= 2;
  }

  // Create wide flat plains and steep mountains
  if (height < 2) {
    // Vast flat lowlands
    height = height * 0.1;
  } else {
    // Steeper mountains rising from the plains
    height = Math.pow(height - 2, 1.2) + 0.2; 
  }

  // Flatten the center landing zone heavily
  const distFromCenter = Math.sqrt(x*x + z*z);
  if (distFromCenter < 35) {
    height *= (distFromCenter / 35) * (distFromCenter / 35); 
  }

  return height;
}
