import React from 'react';
import {
  AngolaFlagDecal,
  GGPENLogoDecal,
  NasaSpaceAppsLuandaDecal,
  AstronavegaLogoDecal,
  CabecaAbertaLogoDecal,
} from './AngolaFlag';


export function RocketModel({ isFlying = false }: { isFlying?: boolean }) {
  return (
    <group>
      {/* ================================================================ */}
      {/* STAGE 1: MAIN CRYOGENIC CORE PROPULSION (y = 0 to 30m)           */}
      {/* ================================================================ */}
      
      {/* Cluster of 5 High-Efficiency Staged Combustion Cryogenic Engines */}
      {[
        [-1.8, 1.8],
        [1.8, 1.8],
        [-1.8, -1.8],
        [1.8, -1.8],
        [0, 0],
      ].map((pos, i) => (
        <group key={`core-engine-${i}`} position={[pos[0], 1.4, pos[1]]}>
          {/* Gimbal actuator mount & turbopump manifold */}
          <mesh position={[0, 0.8, 0]} castShadow>
            <cylinderGeometry args={[0.5, 0.6, 0.8, 16]} />
            <meshStandardMaterial color="#334155" metalness={0.9} roughness={0.2} />
          </mesh>
          {/* Main Regeneratively Cooled Bell Nozzle */}
          <mesh position={[0, -0.4, 0]} castShadow>
            <cylinderGeometry args={[0.55, 1.25, 2.2, 24]} />
            <meshStandardMaterial color="#1e293b" metalness={0.95} roughness={0.15} />
          </mesh>
          {/* Titanium Stiffening Hat Bands on Nozzle */}
          {[-0.8, -0.2, 0.4].map((ringY, r) => (
            <mesh key={`ring-${r}`} position={[0, ringY, 0]}>
              <torusGeometry args={[0.7 + r * 0.22, 0.04, 8, 24]} />
              <meshStandardMaterial color="#64748b" metalness={0.9} />
            </mesh>
          ))}
          {/* Thrust Chamber Plasma / Ignition Glow */}
          <mesh position={[0, -1.2, 0]}>
            <sphereGeometry args={[0.9, 16, 16]} />
            <meshBasicMaterial color="#00d4ff" transparent opacity={isFlying ? 1 : 0.65} />
          </mesh>
          {/* Supersonic Exhaust Plume during Launch */}
          {isFlying && (
            <group position={[0, -12, 0]}>
              {/* Outer Fiery Plasma Sheath */}
              <mesh>
                <cylinderGeometry args={[1.2, 0.3, 22, 24]} />
                <meshBasicMaterial color="#38bdf8" transparent opacity={0.7} />
              </mesh>
              {/* Inner Shock Diamond Core */}
              <mesh position={[0, 4, 0]}>
                <cylinderGeometry args={[0.8, 0.15, 14, 16]} />
                <meshBasicMaterial color="#ffffff" transparent opacity={0.9} />
              </mesh>
            </group>
          )}
        </group>
      ))}

      {/* Core Thrust Puck & Engine Base Shield */}
      <mesh position={[0, 2.5, 0]} castShadow>
        <cylinderGeometry args={[3.2, 3.2, 1.0, 32]} />
        <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* Stage 1 Main Cryogenic Core Body (Liquid Oxygen & Hydrogen Tanks) */}
      <mesh position={[0, 16.5, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[3.1, 3.2, 27, 32]} />
        <meshStandardMaterial color="#f8fafc" metalness={0.4} roughness={0.3} />
        
        {/* Front Side (+Z): Official National & Agency Insignias (GGPEN & Bandeira de Angola) */}
        <GGPENLogoDecal position={[0, 3.2, 3.16]} rotation={[0, 0, 0]} scale={[2.0, 2.0, 1]} />
        <AngolaFlagDecal position={[0, -1.8, 3.16]} rotation={[0, 0, 0]} scale={[2.7, 1.8, 1]} />

        {/* Back Side (-Z): Mirrored Official Insignias for 360-degree Visibility */}
        <GGPENLogoDecal position={[0, 3.2, -3.16]} rotation={[0, Math.PI, 0]} scale={[2.0, 2.0, 1]} />
        <AngolaFlagDecal position={[0, -1.8, -3.16]} rotation={[0, Math.PI, 0]} scale={[2.7, 1.8, 1]} />
      </mesh>

      {/* Cryogenic Pressurization Conduit & Systems Tunnel Raceways */}
      {[
        [3.12, 0],
        [-3.12, 0],
      ].map((raceway, i) => (
        <mesh key={`raceway-${i}`} position={[raceway[0], 16.5, raceway[1]]}>
          <boxGeometry args={[0.2, 27, 0.4]} />
          <meshStandardMaterial color="#e2e8f0" metalness={0.6} />
        </mesh>
      ))}

      {/* Stage 1 Umbilical Ground Service Interface Socket (Connects to Tower Arm 1 at y=22) */}
      <group position={[-3.15, 17.8, 0]}>
        <mesh>
          <boxGeometry args={[0.3, 1.6, 1.4]} />
          <meshStandardMaterial color="#334155" metalness={0.8} />
        </mesh>
        <mesh position={[-0.15, 0, 0]}>
          <cylinderGeometry args={[0.3, 0.3, 0.4, 16]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.9} />
        </mesh>
      </group>

      {/* Aerodynamic Stabilizer Grid Fins at Base */}
      {[0, Math.PI / 2, Math.PI, Math.PI * 1.5].map((rot, i) => (
        <group key={`fin-${i}`} position={[0, 4.5, 0]} rotation={[0, rot, 0]}>
          <mesh position={[3.6, 0, 0]} castShadow>
            <boxGeometry args={[1.6, 3.5, 0.15]} />
            <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.3} />
          </mesh>
        </group>
      ))}

      {/* ================================================================ */}
      {/* SOLID ROCKET BOOSTERS (Twin Heavy Boosters, y = 0 to 39m)        */}
      {/* ================================================================ */}
      {[-5.0, 5.0].map((x, i) => (
        <group key={`booster-${i}`} position={[x, 0, 0]}>
          {/* Booster TVC Gimballed Nozzle */}
          <mesh position={[0, 0.5, 0]} castShadow>
            <cylinderGeometry args={[0.7, 1.4, 2.0, 20]} />
            <meshStandardMaterial color="#0f172a" metalness={0.95} roughness={0.15} />
          </mesh>
          <mesh position={[0, -0.6, 0]}>
            <sphereGeometry args={[0.9, 16, 16]} />
            <meshBasicMaterial color="#00d4ff" transparent opacity={isFlying ? 1 : 0.6} />
          </mesh>
          {isFlying && (
            <mesh position={[0, -12, 0]}>
              <cylinderGeometry args={[1.1, 0.2, 22, 20]} />
              <meshBasicMaterial color="#38bdf8" transparent opacity={0.65} />
            </mesh>
          )}

          {/* Solid Booster Main Motor Segments (4 Cast Fuel Segments) */}
          <mesh position={[0, 18, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[1.5, 1.5, 33, 28]} />
            <meshStandardMaterial color="#f1f5f9" metalness={0.3} roughness={0.4} />
          </mesh>

          {/* Heavy Structural Core Attachment Struts */}
          {[6, 28].map((attachY, a) => (
            <mesh key={`strut-${a}`} position={[x > 0 ? -1.0 : 1.0, attachY, 0]}>
              <boxGeometry args={[1.2, 0.8, 0.8]} />
              <meshStandardMaterial color="#334155" metalness={0.8} />
            </mesh>
          ))}

          {/* Segment Stiffener Bands */}
          {[10, 18, 26, 32].map((bandY, b) => (
            <mesh key={`band-${b}`} position={[0, bandY, 0]}>
              <torusGeometry args={[1.53, 0.03, 8, 28]} />
              <meshStandardMaterial color="#cbd5e1" metalness={0.8} />
            </mesh>
          ))}

          {/* Aerodynamic Forward Skirt & Slanted Nose Cone */}
          <mesh position={[0, 36.2, 0]} castShadow>
            <cylinderGeometry args={[1.3, 1.5, 3.4, 28]} />
            <meshStandardMaterial color="#e2e8f0" metalness={0.4} />
          </mesh>
          <mesh position={[0, 39.2, 0]} rotation={[0, 0, x > 0 ? 0.08 : -0.08]} castShadow>
            <coneGeometry args={[1.3, 3.2, 28]} />
            <meshStandardMaterial color="#1e293b" metalness={0.7} roughness={0.3} />
          </mesh>

          {/* Forward Staging Separation Rocket Nozzles */}
          <mesh position={[x > 0 ? 1.1 : -1.1, 37.5, 0]} rotation={[0, 0, x > 0 ? -0.4 : 0.4]}>
            <cylinderGeometry args={[0.15, 0.25, 0.6, 12]} />
            <meshStandardMaterial color="#020617" />
          </mesh>
        </group>
      ))}

      {/* ================================================================ */}
      {/* INTERSTAGE TRUSS & STAGE SEPARATOR (y = 30 to 32.5m)             */}
      {/* ================================================================ */}
      <mesh position={[0, 31, 0]} castShadow>
        <cylinderGeometry args={[3.0, 3.1, 2.2, 32]} />
        <meshStandardMaterial color="#1e293b" metalness={0.85} roughness={0.25} />
      </mesh>
      {/* Interstage Vent Openings for Stage 2 Hot Staging */}
      {Array.from({ length: 8 }).map((_, i) => (
        <mesh key={`vent-${i}`} position={[0, 31, 0]} rotation={[0, (i * Math.PI) / 4, 0]}>
          <boxGeometry args={[0.3, 1.2, 6.05]} />
          <meshStandardMaterial color="#0f172a" metalness={0.9} />
        </mesh>
      ))}

      {/* ================================================================ */}
      {/* STAGE 2: CRYOGENIC UPPER ORBITAL STAGE (y = 32.5 to 47.5m)       */}
      {/* ================================================================ */}
      <mesh position={[0, 39.5, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[2.85, 3.0, 15, 32]} />
        <meshStandardMaterial color="#f8fafc" metalness={0.35} roughness={0.35} />
        {/* Stage 2 Official Partner & Educational Insignias (Astronavega & Cabeça Aberta) */}
        {/* Front Side (+Z) */}
        <AstronavegaLogoDecal position={[0, 2.5, 2.89]} rotation={[0, 0, 0]} scale={[2.2, 2.2, 1]} />
        <CabecaAbertaLogoDecal position={[0, -1.6, 2.95]} rotation={[0, 0, 0]} scale={[2.3, 2.3, 1]} />
        {/* Back Side (-Z) */}
        <AstronavegaLogoDecal position={[0, 2.5, -2.89]} rotation={[0, Math.PI, 0]} scale={[2.2, 2.2, 1]} />
        <CabecaAbertaLogoDecal position={[0, -1.6, -2.95]} rotation={[0, Math.PI, 0]} scale={[2.3, 2.3, 1]} />
        {/* Tower Facade Side (-X, facing Launch Tower Bridge) */}
        <AstronavegaLogoDecal position={[-2.89, 2.5, 0]} rotation={[0, -Math.PI / 2, 0]} scale={[2.2, 2.2, 1]} />
        <CabecaAbertaLogoDecal position={[-2.95, -1.6, 0]} rotation={[0, -Math.PI / 2, 0]} scale={[2.3, 2.3, 1]} />
        {/* Ocean Facade Side (+X) */}
        <AstronavegaLogoDecal position={[2.89, 2.5, 0]} rotation={[0, Math.PI / 2, 0]} scale={[2.2, 2.2, 1]} />
        <CabecaAbertaLogoDecal position={[2.95, -1.6, 0]} rotation={[0, Math.PI / 2, 0]} scale={[2.3, 2.3, 1]} />
      </mesh>

      {/* Stage 2 Umbilical Ground Interface (Connects to Tower Arm 2 at y=38) */}
      <group position={[-2.9, 33.8, 0]}>
        <mesh>
          <boxGeometry args={[0.3, 1.4, 1.2]} />
          <meshStandardMaterial color="#334155" metalness={0.8} />
        </mesh>
        <mesh position={[-0.15, 0, 0]}>
          <cylinderGeometry args={[0.25, 0.25, 0.4, 16]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.9} />
        </mesh>
      </group>

      {/* Stage 2 Equipment Avionics Ring & Stiffener */}
      <mesh position={[0, 47.2, 0]} castShadow>
        <cylinderGeometry args={[2.75, 2.85, 0.8, 32]} />
        <meshStandardMaterial color="#334155" metalness={0.7} />
      </mesh>

      {/* ================================================================ */}
      {/* SPACECRAFT ADAPTER & SERVICE MODULE (y = 47.5 to 51.5m)          */}
      {/* ================================================================ */}
      <mesh position={[0, 49.5, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[2.65, 2.75, 3.8, 32]} />
        <meshStandardMaterial color="#e2e8f0" metalness={0.5} roughness={0.3} />
      </mesh>

      {/* Service Module Reaction Control System (RCS) Quad Thruster Pods */}
      {[0, Math.PI / 2, Math.PI, Math.PI * 1.5].map((rot, i) => (
        <group key={`rcs-${i}`} position={[0, 50.2, 0]} rotation={[0, rot, 0]}>
          <mesh position={[2.7, 0, 0]} castShadow>
            <boxGeometry args={[0.25, 0.4, 0.4]} />
            <meshStandardMaterial color="#0f172a" />
          </mesh>
          {/* 4 Micro-nozzles */}
          <mesh position={[2.85, 0.1, 0.1]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.04, 0.08, 0.2, 8]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.9} />
          </mesh>
        </group>
      ))}

      {/* ================================================================ */}
      {/* CREW COMMAND MODULE / ASTRONAUT CAPSULE (y = 51.5 to 56.5m)      */}
      {/* Aligns with Tower Crew Access Arm (White Room) at y = 54m!       */}
      {/* ================================================================ */}
      {/* Conical Capsule Pressure Hull */}
      <mesh position={[0, 53.8, 0]} castShadow receiveShadow>
        <coneGeometry args={[2.65, 4.8, 32]} />
        <meshStandardMaterial color="#0f172a" metalness={0.85} roughness={0.2} />
      </mesh>

      {/* Capsule Crew Entry / Egress Hatch (Facing Tower Bridge at -x) */}
      <group position={[-1.6, 53.2, 0]} rotation={[0, 0, 0.52]}>
        <mesh castShadow>
          <boxGeometry args={[0.1, 1.6, 1.2]} />
          <meshStandardMaterial color="#e2e8f0" metalness={0.6} roughness={0.3} />
        </mesh>
        {/* Pressure Hatch Seal Ring */}
        <mesh position={[-0.05, 0, 0]}>
          <ringGeometry args={[0.45, 0.55, 24]} />
          <meshStandardMaterial color="#facc15" />
        </mesh>
      </group>

      {/* Forward Flight Deck Cockpit Viewports (Windows) */}
      <group position={[0, 54.2, 1.55]} rotation={[0.5, 0, 0]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.4, 0.4, 0.2, 16]} />
          <meshStandardMaterial color="#0284c7" metalness={0.95} roughness={0.05} />
        </mesh>
        <mesh position={[0, 0.1, 0]}>
          <ringGeometry args={[0.4, 0.5, 16]} />
          <meshStandardMaterial color="#e2e8f0" metalness={0.8} />
        </mesh>
      </group>

      {/* ================================================================ */}
      {/* LAUNCH ABORT SYSTEM (LAS) & ESCAPE TOWER (y = 56.5 to 65.5m)     */}
      {/* Matches exact peak height of the 65m launch tower!               */}
      {/* ================================================================ */}
      {/* Aerodynamic Fairing Cover over Capsule Apex */}
      <mesh position={[0, 56.8, 0]} castShadow>
        <coneGeometry args={[1.2, 2.2, 24]} />
        <meshStandardMaterial color="#f8fafc" metalness={0.3} />
      </mesh>

      {/* Jettison & Abort Solid Rocket Motor Casing */}
      <mesh position={[0, 60.5, 0]} castShadow>
        <cylinderGeometry args={[0.5, 0.5, 5.5, 20]} />
        <meshStandardMaterial color="#f8fafc" metalness={0.4} />
      </mesh>

      {/* 4 Angled Escape Thrust Nozzles */}
      {[0, Math.PI / 2, Math.PI, Math.PI * 1.5].map((rot, i) => (
        <group key={`abort-nozzle-${i}`} position={[0, 58.5, 0]} rotation={[0, rot, 0]}>
          <mesh position={[0.4, 0, 0]} rotation={[0, 0, -0.6]} castShadow>
            <cylinderGeometry args={[0.12, 0.25, 0.8, 12]} />
            <meshStandardMaterial color="#0f172a" metalness={0.95} />
          </mesh>
        </group>
      ))}

      {/* Steerable Aerodynamic Canards for Trajectory Control */}
      {[0, Math.PI / 2, Math.PI, Math.PI * 1.5].map((rot, i) => (
        <mesh key={`canard-${i}`} position={[0, 62.5, 0]} rotation={[0, rot, 0]} castShadow>
          <boxGeometry args={[1.2, 0.8, 0.06]} />
          <meshStandardMaterial color="#1e293b" metalness={0.8} />
        </mesh>
      ))}

      {/* LAS Nose Cone & Pitot Air Data Boom (Apex at 65.5m!) */}
      <mesh position={[0, 63.8, 0]} castShadow>
        <coneGeometry args={[0.45, 1.6, 20]} />
        <meshStandardMaterial color="#0f172a" metalness={0.9} />
      </mesh>
      <mesh position={[0, 65.0, 0]} castShadow>
        <cylinderGeometry args={[0.04, 0.08, 1.2, 12]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.95} />
      </mesh>
      <mesh position={[0, 65.6, 0]}>
        <sphereGeometry args={[0.06]} />
        <meshBasicMaterial color="#ef4444" />
      </mesh>
    </group>
  );
}
