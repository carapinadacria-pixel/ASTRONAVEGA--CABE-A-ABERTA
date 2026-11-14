import React, { useMemo, useEffect } from 'react';
import { useGameStore, PLANETS, PlanetInfo } from '../store';
import { DoubleSide, BackSide, CanvasTexture, PMREMGenerator } from 'three';
import { Sky, Text } from '@react-three/drei';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import { useThree } from '@react-three/fiber';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { CompleteEarthVegetation } from './RealisticVegetation';
import { VABInfrastructure } from './VABInfrastructure';
import { CoastalOcean } from './CoastalOcean';
import { LaboratoryFacility } from './LaboratoryFacility';
import { SkybridgeConnection } from './SkybridgeConnection';
import { RealisticParkingLot } from './RealisticCars';
import { WorldResources } from './WorldResources';
import { PlanetaryBaseModule } from './PlanetaryBaseModule';
import { RealisticEarthGlobe } from './RealisticEarthGlobe';
import { HangarSuitTable, MoonFlagMissionProp, StoryCompanion } from './StoryMissionProps';

// Procedural 360-degree Sky & Ocean Horizon Atmosphere Texture for Earth
let cachedHorizonTexture: CanvasTexture | null = null;
function getHorizonAtmosphereTexture(): CanvasTexture | null {
  if (cachedHorizonTexture) return cachedHorizonTexture;
  if (typeof document === 'undefined') return null;

  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const grad = ctx.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0, '#38bdf8');     // Zenith sky blue
    grad.addColorStop(0.36, '#7dd3fc');  // Mid tropical sky
    grad.addColorStop(0.48, '#bae6fd');  // Horizon light atmospheric mist
    grad.addColorStop(0.50, '#38bdf8');  // Waterline specular crest
    grad.addColorStop(0.54, '#0284c7');  // Vibrant Atlantic cerulean blue
    grad.addColorStop(0.72, '#0369a1');  // Deep Atlantic ocean sapphire
    grad.addColorStop(1.0, '#0284c7');   // Vibrant cerulean bottom
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 256);
  }
  cachedHorizonTexture = new CanvasTexture(canvas);
  return cachedHorizonTexture;
}

// Procedural Studio / Room Environment Map for realistic PBR reflections across water, metal, and glass
function EarthEnvironmentLighting() {
  const { gl, scene } = useThree();

  useEffect(() => {
    try {
      const pmremGenerator = new PMREMGenerator(gl);
      const prevEnv = scene.environment;
      const roomEnv = new RoomEnvironment();
      const envTexture = pmremGenerator.fromScene(roomEnv, 0.04).texture;
      scene.environment = envTexture;
      if ('environmentIntensity' in scene) {
        (scene as any).environmentIntensity = 0.35;
      }
      pmremGenerator.dispose();

      return () => {
        scene.environment = prevEnv;
        envTexture.dispose();
      };
    } catch (e) {
      console.warn('[Lighting] PMREM generation skipped in fallback/sandbox environment');
    }
  }, [gl, scene]);

  return null;
}

const isMobileOrLowRAM = typeof navigator !== 'undefined' && (
  /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent) ||
  Boolean((navigator as any).deviceMemory && (navigator as any).deviceMemory <= 4)
);

export function PlanetEnvironment() {
  const planetIndex = useGameStore((state) => state.planetIndex);
  const currentPlanet: PlanetInfo = PLANETS[planetIndex] || PLANETS[0];
  const targetFps = useGameStore((state) => state.targetFps);
  const enableShadows = !isMobileOrLowRAM || targetFps >= 40;

  const isEarth = currentPlanet.type === 'earth';
  const isMoon = currentPlanet.type === 'moon';
  const isMercury = currentPlanet.type === 'mercury';
  const isVenus = currentPlanet.type === 'venus';
  const isMars = currentPlanet.type === 'mars';
  const isTitan = currentPlanet.type === 'titan';
  const isGasGiant = ['jupiter', 'saturn', 'uranus', 'neptune'].includes(currentPlanet.type);
  const isExoplanet = currentPlanet.type === 'exoplanet';

  return (
    <>
      {/* Dynamic Directional & Ambient Lighting tailored to each planet's distance from the Sun */}
      {isEarth && (
        <>
          <ambientLight intensity={0.28} color="#ffffff" />
          <directionalLight
            position={[55, 85, 25]}
            intensity={0.85}
            color="#fffbf0"
            castShadow={enableShadows}
            shadow-mapSize={enableShadows ? [512, 512] : [256, 256]}
            shadow-bias={-0.0004}
          />
          <hemisphereLight intensity={0.22} color="#dbeafe" groundColor="#2d6a4f" />
        </>
      )}

      {isMoon && (
        <>
          <ambientLight intensity={0.12} color="#94a3b8" />
          <directionalLight
            position={[90, 70, 40]}
            intensity={1.4}
            color="#ffffff"
            castShadow={enableShadows}
            shadow-mapSize={enableShadows ? [512, 512] : [256, 256]}
          />
        </>
      )}

      {isMercury && (
        <>
          <ambientLight intensity={0.15} color="#cbd5e1" />
          <directionalLight
            position={[30, 110, 20]}
            intensity={3.2}
            color="#fff8db"
            castShadow={enableShadows}
          />
        </>
      )}

      {isVenus && (
        <>
          <ambientLight intensity={0.35} color="#d97706" />
          <directionalLight
            position={[40, 80, -30]}
            intensity={1.1}
            color="#fef08a"
            castShadow={enableShadows}
          />
          <hemisphereLight intensity={0.3} color="#f59e0b" groundColor="#451a03" />
        </>
      )}

      {isMars && (
        <>
          <ambientLight intensity={0.25} color="#ea580c" />
          <directionalLight
            position={[70, 65, 35]}
            intensity={1.05}
            color="#ffedd5"
            castShadow={enableShadows}
          />
          <hemisphereLight intensity={0.22} color="#f97316" groundColor="#7c2d12" />
        </>
      )}

      {isTitan && (
        <>
          <ambientLight intensity={0.32} color="#fbbf24" />
          <directionalLight
            position={[50, 70, 20]}
            intensity={0.75}
            color="#fde047"
            castShadow={enableShadows}
          />
        </>
      )}

      {isGasGiant && (
        <>
          <ambientLight intensity={0.4} color="#fef3c7" />
          <directionalLight position={[0, 100, 40]} intensity={1.2} color="#ffffff" />
        </>
      )}

      {isExoplanet && (
        <>
          <ambientLight intensity={0.3} color={currentPlanet.color || '#a855f7'} />
          <directionalLight position={[60, 90, 40]} intensity={1.3} color="#ffffff" castShadow={enableShadows} />
        </>
      )}

      {/* Render the appropriate celestial environment */}
      {isEarth && <EarthBase />}
      {isMoon && <MoonEnvironment />}
      {isMercury && <MercuryEnvironment />}
      {isVenus && <VenusEnvironment />}
      {isMars && <MarsEnvironment />}
      {isTitan && <TitanEnvironment />}
      {isGasGiant && <GasGiantStationEnvironment planet={currentPlanet} />}
      {isExoplanet && <ExoplanetEnvironment planet={currentPlanet} />}
      <StoryCompanion />
    </>
  );
}

// ===========================================================================
// 1. EARTH BASE (KENNEDY & GGPEN SPACEPORT, OCEAN, HANGAR, LAB, VEGETATION)
// ===========================================================================
function EarthBase() {
  const horizonTexture = useMemo(() => getHorizonAtmosphereTexture(), []);

  return (
    <group>
      <EarthEnvironmentLighting />
      <Sky distance={45000} sunPosition={[100, 20, 100]} inclination={0} azimuth={0.25} />
      
      {/* 360-degree Horizon Atmosphere Dome */}
      <mesh scale={[-1, 1, 1]} position={[0, 0, 0]}>
        <sphereGeometry args={[3200, 32, 24]} />
        <meshBasicMaterial
          map={horizonTexture || undefined}
          color="#ffffff"
          side={BackSide}
          depthWrite={false}
        />
      </mesh>

      <fog attach="fog" args={['#bae6fd', 380, 3200]} />
      
      {/* Physics Ground & Smooth Sloping Beach Colliders */}
      <RigidBody type="fixed" colliders={false} position={[742, -5, 0]} friction={0.0}>
        <CuboidCollider args={[758, 5, 2000]} friction={0.0} />
      </RigidBody>

      <RigidBody type="fixed" colliders={false} friction={0.0}>
        {/* Dry Upper Beach Sand (X = -16 to -27, top at Y = 0.0m) */}
        <CuboidCollider position={[-21.5, -5.0, 0]} args={[5.5, 5, 2000]} friction={0.0} />
        {/* Upper Foreshore Slope (X = -27 to -31.5, slopes smoothly from Y = 0.0m to Y = -0.30m) */}
        <CuboidCollider position={[-29.25, -1.15, 0]} rotation={[0, 0, 0.066]} args={[2.35, 1.0, 2000]} friction={0.0} />
        {/* Continuous Surf & Nearshore Beach Ramp (X = -31.5 to -44.0, slopes smoothly from Y = -0.30m to Y = -2.40m with ZERO vertical steps!) */}
        <CuboidCollider position={[-37.75, -2.35, 0]} rotation={[0, 0, 0.166]} args={[6.4, 1.0, 2000]} friction={0.0} />
        {/* Deep Ocean Seabed Floor (X = -44 to -3000) */}
        <CuboidCollider position={[-1522, -16.0, 0]} args={[1478, 10, 2000]} friction={0.0} />
      </RigidBody>

      <CompleteEarthVegetation />
      <CoastalOcean />
      <WorldResources />

      {/* Cryogenic Storage Tanks */}
      <group position={[-18, 0, 26]}>
        <mesh castShadow receiveShadow position={[0, 9, 0]}>
          <sphereGeometry args={[7, 32, 32]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.2} metalness={0.6} />
        </mesh>
        <mesh castShadow position={[0, 4, 0]}>
          <cylinderGeometry args={[4, 4.4, 8, 24]} />
          <meshStandardMaterial color="#475569" metalness={0.7} />
        </mesh>
      </group>
      
      <group position={[-18, 0, -26]}>
        <mesh castShadow receiveShadow position={[0, 9, 0]}>
          <sphereGeometry args={[7, 32, 32]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.2} metalness={0.6} />
        </mesh>
        <mesh castShadow position={[0, 4, 0]}>
          <cylinderGeometry args={[4, 4.4, 8, 24]} />
          <meshStandardMaterial color="#475569" metalness={0.7} />
        </mesh>
      </group>

      {/* Crawlerway Track */}
      <group position={[120, 0, 0]}>
        <RigidBody type="fixed" colliders="cuboid" position={[0, 0.05, 0]}>
          <mesh receiveShadow>
            <boxGeometry args={[220, 0.1, 40]} />
            <meshStandardMaterial color="#292524" roughness={0.95} />
          </mesh>
        </RigidBody>
      </group>

      <VABInfrastructure />
      <HangarSuitTable />
      <LaboratoryFacility />
      <SkybridgeConnection />
      <RealisticParkingLot />
    </group>
  );
}

// ===========================================================================
// 2. MOON (LUA) - Fine Gray Regolith, Craters, Artemis Outpost, Earth in Sky
// ===========================================================================
function MoonEnvironment() {
  return (
    <group>
      {/* Deep Space Black Sky with Horizon Stars */}
      <mesh scale={[-1, 1, 1]} position={[0, 0, 0]}>
        <sphereGeometry args={[2500, 16, 16]} />
        <meshBasicMaterial color="#02040a" side={BackSide} />
      </mesh>

      {/* Luminous Realistic Earth in the Lunar Sky */}
      <group position={[240, 355, -460]}>
        <RealisticEarthGlobe
          radius={78}
          axialTilt={0.38}
          sunDirection={[90, 70, 40]}
          rotationSpeed={0.010}
          cloudSpeed={0.018}
          earthshine={0.14}
          segments={64}
        />
        <Text
          position={[0, -96, 0]}
          fontSize={16}
          color="#bae6fd"
          outlineWidth={0.8}
          outlineColor="#020617"
          fontWeight="bold"
          anchorX="center"
        >
          PLANETA TERRA
        </Text>
      </group>

      {/* Lunar Regolith Floor */}
      <RigidBody type="fixed" colliders="cuboid" position={[0, -0.2, 0]}>
        <mesh receiveShadow>
          <boxGeometry args={[1400, 0.4, 1400]} />
          <meshStandardMaterial color="#94a3b8" roughness={0.96} metalness={0.05} />
        </mesh>
      </RigidBody>

      {/* Lunar Impact Craters with Raised Rims */}
      {[
        { pos: [-45, 0, 65], r: 24 },
        { pos: [85, 0, -55], r: 35 },
        { pos: [-120, 0, -80], r: 42 },
        { pos: [60, 0, 110], r: 28 },
      ].map((c, i) => (
        <group key={`crater-${i}`} position={c.pos as [number, number, number]}>
          <mesh position={[0, 0.6, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[c.r * 0.75, c.r, 24]} />
            <meshStandardMaterial color="#64748b" roughness={0.95} />
          </mesh>
          <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[c.r * 0.75, 24]} />
            <meshStandardMaterial color="#475569" roughness={0.99} />
          </mesh>
        </group>
      ))}

      {/* Basaltic Lunar Boulders */}
      {Array.from({ length: 90 }).map((_, i) => {
        const x = (Math.sin(i * 1.7) * 280) + (i % 2 === 0 ? 30 : -30);
        const z = (Math.cos(i * 1.7) * 280) + (i % 3 === 0 ? 40 : -40);
        if (Math.hypot(x, z) < 18 || Math.hypot(x - 24, z + 24) < 16) return null;
        return (
          <mesh
            key={`moon-rock-${i}`}
            position={[x, 0.6, z]}
            rotation={[i * 0.2, i * 0.5, i * 0.3]}
            scale={0.8 + (i % 5) * 0.5}
            castShadow
          >
            <dodecahedronGeometry args={[1.5, 1]} />
            <meshStandardMaterial color="#64748b" roughness={0.9} />
          </mesh>
        );
      })}

      {/* Artemis / GGPEN Walkable Lunar Outpost with Automatic Metal Door, Tech & Refill Station */}
      <PlanetaryBaseModule
        planetId="moon"
        baseTitle="BASE LUNAR ANGOLA • GGPEN ARTEMIS"
        position={[24, 0, -24]}
        accentColor="#38bdf8"
        hullColor="#f1f5f9"
        trimColor="#eab308"
        variant="lunar"
      />
      <MoonFlagMissionProp />
    </group>
  );
}

// ===========================================================================
// 3. MERCURY (MERCÚRIO) - Scorched Basalt, Giant Sun, Hermean Mining Post
// ===========================================================================
function MercuryEnvironment() {
  return (
    <group>
      {/* Black Sky with Blinding Solar Corona */}
      <mesh scale={[-1, 1, 1]} position={[0, 0, 0]}>
        <sphereGeometry args={[2500, 16, 16]} />
        <meshBasicMaterial color="#020307" side={BackSide} />
      </mesh>

      {/* Massive Sun looming in Mercury's sky */}
      <group position={[150, 450, 200]}>
        <mesh>
          <sphereGeometry args={[95, 32, 32]} />
          <meshBasicMaterial color="#fef08a" />
        </mesh>
        <mesh scale={[1.15, 1.15, 1.15]}>
          <sphereGeometry args={[95, 24, 24]} />
          <meshBasicMaterial color="#f59e0b" transparent opacity={0.4} />
        </mesh>
      </group>

      {/* Calcinated Charcoal/Dark-Gray Ground */}
      <RigidBody type="fixed" colliders="cuboid" position={[0, -0.2, 0]}>
        <mesh receiveShadow>
          <boxGeometry args={[1400, 0.4, 1400]} />
          <meshStandardMaterial color="#292524" roughness={0.98} metalness={0.2} />
        </mesh>
      </RigidBody>

      {/* Fractured Volcanic Basalt Slabs & Impact Rocks */}
      {Array.from({ length: 80 }).map((_, i) => {
        const x = Math.sin(i * 2.1) * 260;
        const z = Math.cos(i * 2.1) * 260;
        if (Math.hypot(x, z) < 18 || Math.hypot(x - 26, z - 22) < 16) return null;
        return (
          <mesh
            key={`merc-rock-${i}`}
            position={[x, 0.8, z]}
            rotation={[i * 0.3, i * 0.7, 0]}
            scale={1.0 + (i % 4) * 0.6}
            castShadow
          >
            <dodecahedronGeometry args={[1.8, 0]} />
            <meshStandardMaterial color="#1c1917" roughness={0.92} metalness={0.4} />
          </mesh>
        );
      })}

      {/* Hermean Thermal-Shield Pressurized Outpost */}
      <PlanetaryBaseModule
        planetId="mercury"
        baseTitle="POSTO SOLAR MERCÚRIO • GGPEN"
        position={[26, 0, 22]}
        accentColor="#fef08a"
        hullColor="#f59e0b"
        trimColor="#fbbf24"
        variant="mercury"
      />
    </group>
  );
}

// ===========================================================================
// 4. VENUS (VÉNUS) - Sulfuric Amber Atmosphere, Basalt Crags, Venera Lander
// ===========================================================================
function VenusEnvironment() {
  return (
    <group>
      {/* Dense Golden/Amber Atmospheric Sky Dome - NO BLUE VOID */}
      <mesh scale={[-1, 1, 1]} position={[0, 0, 0]}>
        <sphereGeometry args={[2500, 24, 16]} />
        <meshBasicMaterial color="#b45309" side={BackSide} />
      </mesh>

      {/* Dense Atmospheric Mist/Fog blending ground into the sky */}
      <fog attach="fog" args={['#92400e', 40, 550]} />

      {/* Scorched Dark Volcanic Basalt Surface with Magma Undertone */}
      <RigidBody type="fixed" colliders="cuboid" position={[0, -0.2, 0]}>
        <mesh receiveShadow>
          <boxGeometry args={[1400, 0.4, 1400]} />
          <meshStandardMaterial color="#1c1917" roughness={0.92} metalness={0.15} />
        </mesh>
      </RigidBody>

      {/* Glowing Molten Magma Veins / Fissures in the crust */}
      {[-80, -35, 25, 75, 120].map((vx, i) => (
        <group key={`magma-vein-${i}`} position={[vx, 0.05, (i % 2 === 0 ? 40 : -50)]}>
          <mesh rotation={[-Math.PI / 2, 0, i * 0.4]}>
            <planeGeometry args={[70, 3.5]} />
            <meshBasicMaterial color="#f97316" />
          </mesh>
          <pointLight position={[0, 1.2, 0]} color="#ea580c" intensity={1.5} distance={25} />
        </group>
      ))}

      {/* Jagged Basaltic Volcanic Spires and Rocks */}
      {Array.from({ length: 85 }).map((_, i) => {
        const x = Math.sin(i * 1.9) * 270;
        const z = Math.cos(i * 1.9) * 270;
        if (Math.hypot(x, z) < 18 || Math.hypot(x - 26, z + 22) < 16) return null;
        return (
          <mesh
            key={`venus-crag-${i}`}
            position={[x, 1.5, z]}
            rotation={[0, i * 0.4, (i % 2 === 0 ? 0.2 : -0.2)]}
            scale={[1 + (i % 3) * 0.8, 2 + (i % 4) * 0.7, 1 + (i % 3) * 0.8]}
            castShadow
          >
            <octahedronGeometry args={[2.0, 0]} />
            <meshStandardMaterial color="#292524" roughness={0.88} metalness={0.3} />
          </mesh>
        );
      })}

      {/* Venera-GGPEN Heavy Atmospheric Pressure Outpost */}
      <PlanetaryBaseModule
        planetId="venus"
        baseTitle="ESTAÇÃO PRESSURIZADA VÉNUS • GGPEN"
        position={[26, 0, -22]}
        accentColor="#fbbf24"
        hullColor="#78716c"
        trimColor="#f59e0b"
        variant="venus"
      />
    </group>
  );
}

// ===========================================================================
// 5. MARS (MARTE) - Butterscotch Sky, Iron Oxide Red Dunes, Mars Base Alpha
// ===========================================================================
function MarsEnvironment() {
  return (
    <group>
      {/* Rust-Red / Butterscotch Sky Dome */}
      <mesh scale={[-1, 1, 1]} position={[0, 0, 0]}>
        <sphereGeometry args={[2500, 24, 16]} />
        <meshBasicMaterial color="#9a3412" side={BackSide} />
      </mesh>

      <fog attach="fog" args={['#7c2d12', 60, 750]} />

      {/* Martian Rust Dunes Surface */}
      <RigidBody type="fixed" colliders="cuboid" position={[0, -0.2, 0]}>
        <mesh receiveShadow>
          <boxGeometry args={[1400, 0.4, 1400]} />
          <meshStandardMaterial color="#c2410c" roughness={0.94} />
        </mesh>
      </RigidBody>

      {/* Oxidized Red Hematite Rocks & Boulders */}
      {Array.from({ length: 110 }).map((_, i) => {
        const x = Math.sin(i * 1.5) * 290;
        const z = Math.cos(i * 1.5) * 290;
        if (Math.hypot(x, z) < 18 || Math.hypot(x - 26, z + 24) < 16 || Math.hypot(x - 46, z + 24) < 12) return null;
        return (
          <mesh
            key={`mars-rock-${i}`}
            position={[x, 0.8, z]}
            rotation={[i * 0.2, i * 0.6, i * 0.1]}
            scale={0.9 + (i % 5) * 0.6}
            castShadow
          >
            <dodecahedronGeometry args={[1.6, 1]} />
            <meshStandardMaterial color="#7f1d1d" roughness={0.9} />
          </mesh>
        );
      })}

      {/* Mars Base Alpha: Walkable Tech Habitat + Neighboring Hydroponic Greenhouse & MOXIE Tower */}
      <PlanetaryBaseModule
        planetId="mars"
        baseTitle="BASE MARTE ALPHA • GGPEN COLÓNIA"
        position={[26, 0, -24]}
        accentColor="#38bdf8"
        hullColor="#f8fafc"
        trimColor="#22c55e"
        variant="mars"
      />
      <group position={[46, 0, -24]}>
        <mesh position={[0, 4, 0]} castShadow>
          <sphereGeometry args={[7.2, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#86efac" transparent opacity={0.62} roughness={0.15} />
        </mesh>
        <pointLight position={[0, 3, 0]} color="#22c55e" intensity={1.8} distance={20} />
        <mesh position={[-11, 3.5, 10]} castShadow>
          <cylinderGeometry args={[1.4, 1.8, 7, 16]} />
          <meshStandardMaterial color="#0284c7" metalness={0.85} />
        </mesh>
      </group>
    </group>
  );
}

// ===========================================================================
// 6. TITAN (TITÃ) - Orange Methane Smog, Liquid Methane Lake, Cryo Base
// ===========================================================================
function TitanEnvironment() {
  return (
    <group>
      {/* Dense Orange Smog Sky Dome */}
      <mesh scale={[-1, 1, 1]} position={[0, 0, 0]}>
        <sphereGeometry args={[2500, 24, 16]} />
        <meshBasicMaterial color="#b45309" side={BackSide} />
      </mesh>

      <fog attach="fog" args={['#92400e', 50, 600]} />

      {/* Dark Cryogenic Hydrocarbon Crust */}
      <RigidBody type="fixed" colliders="cuboid" position={[0, -0.2, 0]}>
        <mesh receiveShadow>
          <boxGeometry args={[1400, 0.4, 1400]} />
          <meshStandardMaterial color="#451a03" roughness={0.88} />
        </mesh>
      </RigidBody>

      {/* Liquid Methane Reflective Lake */}
      <group position={[-50, 0.05, 50]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[45, 32]} />
          <meshStandardMaterial color="#0284c7" roughness={0.05} metalness={0.8} />
        </mesh>
      </group>

      {/* Dragonfly / Huygens Cryogenic Pressurized Exploration Base */}
      <PlanetaryBaseModule
        planetId="titan"
        baseTitle="POSTO CRIOGÉNICO TITÃ • GGPEN HUYGENS"
        position={[24, 0, -24]}
        accentColor="#fbbf24"
        hullColor="#cbd5e1"
        trimColor="#38bdf8"
        variant="titan"
      />
    </group>
  );
}

// ===========================================================================
// 7. GAS GIANTS (JÚPITER, SATURNO, ÚRANO, NEPTUNO) - Floating Aerostat Station
// ===========================================================================
function GasGiantStationEnvironment({ planet }: { planet: PlanetInfo }) {
  const isSaturn = planet.type === 'saturn';
  const isUranus = planet.type === 'uranus';
  const isNeptune = planet.type === 'neptune';

  const skyColor = isNeptune ? '#1e3a8a' : isUranus ? '#0284c7' : isSaturn ? '#854d0e' : '#78350f';
  const cloudColor = isNeptune ? '#2563eb' : isUranus ? '#38bdf8' : isSaturn ? '#eab308' : '#d97706';

  return (
    <group>
      {/* Monumental Gas Deck Sky Dome */}
      <mesh scale={[-1, 1, 1]} position={[0, 0, 0]}>
        <sphereGeometry args={[2500, 24, 16]} />
        <meshBasicMaterial color={skyColor} side={BackSide} />
      </mesh>

      <fog attach="fog" args={[skyColor, 80, 850]} />

      {/* Swirling Gigantic Cloud Deck Below the Station */}
      <mesh position={[0, -25, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[3000, 3000]} />
        <meshStandardMaterial color={cloudColor} roughness={0.9} />
      </mesh>

      {/* High-Tech Floating Aerospace Platform (Gantry Deck) */}
      <RigidBody type="fixed" colliders="cuboid" position={[0, -0.2, 0]}>
        <mesh receiveShadow>
          <cylinderGeometry args={[65, 72, 0.6, 32]} />
          <meshStandardMaterial color="#334155" metalness={0.85} roughness={0.3} />
        </mesh>
      </RigidBody>

      {/* Floating Station Perimeter Railings */}
      <mesh position={[0, 0.6, 0]}>
        <torusGeometry args={[64, 0.12, 8, 48]} />
        <meshStandardMaterial color="#eab308" metalness={0.7} />
      </mesh>

      {/* Central Aerostat Buoyancy Core & Atmospheric Gas Scoops */}
      <group position={[0, 18, 0]}>
        {/* Anti-Gravity Buoyancy Core */}
        <mesh castShadow>
          <sphereGeometry args={[14, 24, 24]} />
          <meshStandardMaterial color="#f8fafc" metalness={0.9} roughness={0.15} />
        </mesh>
        <pointLight position={[0, 0, 0]} color="#38bdf8" intensity={3} distance={45} />
      </group>

      {/* Atmospheric Gas Extraction Scoops */}
      {[-30, 30].map((gx, idx) => (
        <group key={`scoop-${idx}`} position={[gx, 4, 0]}>
          <mesh castShadow>
            <cylinderGeometry args={[3.5, 4.5, 8, 16]} />
            <meshStandardMaterial color="#1e293b" metalness={0.9} roughness={0.2} />
          </mesh>
        </group>
      ))}

      <PlanetaryBaseModule
        planetId={planet.id}
        baseTitle={`ESTAÇÃO AEROESTÁTICA • ${planet.name.toUpperCase()}`}
        position={[0, 0, -28]}
        accentColor="#38bdf8"
        hullColor="#e2e8f0"
        trimColor="#eab308"
        variant="gas"
      />

      <Text position={[0, 2.5, 25]} fontSize={1.4} color="#38bdf8" fontWeight="bold" anchorX="center">
        {`ESTAÇÃO AEROESTÁTICA • ${planet.name.toUpperCase()} (GGPEN)`}
      </Text>
    </group>
  );
}

// ===========================================================================
// 8. NASA CONFIRMED EXOPLANETS (TRAPPIST, KEPLER, PROXIMA, LHS)
// ===========================================================================
function ExoplanetEnvironment({ planet }: { planet: PlanetInfo }) {
  const exoColor = planet.color || '#805ad5';

  return (
    <group>
      {/* Exotic Alien Sky Dome */}
      <mesh scale={[-1, 1, 1]} position={[0, 0, 0]}>
        <sphereGeometry args={[2500, 24, 16]} />
        <meshBasicMaterial color="#1e112a" side={BackSide} />
      </mesh>

      <fog attach="fog" args={['#2e1065', 70, 750]} />

      {/* Alien Planetary Terrain Surface */}
      <RigidBody type="fixed" colliders="cuboid" position={[0, -0.2, 0]}>
        <mesh receiveShadow>
          <boxGeometry args={[1400, 0.4, 1400]} />
          <meshStandardMaterial color="#3b0764" roughness={0.9} />
        </mesh>
      </RigidBody>

      {/* Luminescent Crystalline Monoliths & Exotic Geology */}
      {Array.from({ length: 90 }).map((_, i) => {
        const x = Math.sin(i * 1.8) * 280;
        const z = Math.cos(i * 1.8) * 280;
        if (Math.hypot(x, z) < 18 || Math.hypot(x - 24, z + 22) < 16) return null;
        return (
          <mesh
            key={`exo-cryst-${i}`}
            position={[x, 2.0, z]}
            rotation={[i * 0.1, i * 0.4, 0]}
            scale={[1 + (i % 3) * 0.7, 3 + (i % 4) * 0.8, 1 + (i % 3) * 0.7]}
            castShadow
          >
            <octahedronGeometry args={[2.0, 0]} />
            <meshStandardMaterial color={exoColor} metalness={0.8} roughness={0.15} />
          </mesh>
        );
      })}

      {/* Interstellar GGPEN Deep Space Outpost */}
      <PlanetaryBaseModule
        planetId={planet.id}
        baseTitle={`EXPEDIÇÃO INTERESTELAR • ${planet.name.toUpperCase()}`}
        position={[24, 0, -22]}
        accentColor={exoColor}
        hullColor="#e2e8f0"
        trimColor="#c084fc"
        variant="exo"
      />
    </group>
  );
}
