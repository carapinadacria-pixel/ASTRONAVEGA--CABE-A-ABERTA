import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group, DoubleSide } from 'three';
import { CurvedAngolaFlagDecal, CurvedGGPENLogoDecal } from './AngolaFlag';

interface PlanetaryCapsuleLanderProps {
  isLaunching?: boolean;
}

/**
 * PLANETARY EXPLORATION CAPSULE LANDER (CÁPSULA DE EXPLORAÇÃO PLANETÁRIA GGPEN)
 * High-detail multi-stage planetary lander & ascent spacecraft:
 * - Lower Octagonal Descent Stage wrapped in gold Kapton MLI foil, structural upper/lower
 *   truss rings, propellant tanks, surface access crew ladder, and 4 articulated hydraulic
 *   A-frame landing legs firmly anchored from the chassis mounts down to ground footpads (Y = 0).
 * - Upper Ascent Exploration Capsule featuring high-reflectance aerospace composite pressure hull,
 *   titanium structural compression rings, beveled gold-quartz panoramic flight visor, IDSS docking
 *   adapter with capture latches, and prominent curved Angola Flag & GGPEN insignias.
 */
export function PlanetaryCapsuleLander({ isLaunching = false }: PlanetaryCapsuleLanderProps) {
  const solarWingsRef = useRef<Group>(null);
  const dishRef = useRef<Group>(null);
  const thrusterGlowRef = useRef<Group>(null);

  useFrame((state) => {
    if (dishRef.current) {
      dishRef.current.rotation.y = Math.sin(state.clock.getElapsedTime() * 0.3) * 0.2;
    }
    if (thrusterGlowRef.current && isLaunching) {
      const scale = 0.9 + Math.sin(state.clock.getElapsedTime() * 25.0) * 0.15;
      thrusterGlowRef.current.scale.set(scale, scale * 1.2, scale);
    }
  });

  return (
    <group position={[0, 0, 0]}>
      {/* ============================================================== */}
      {/* 1. LOWER DESCENT STAGE & ARTICULATED LANDING GEAR (Y = 0)      */}
      {/* Octagonal Gold Kapton MLI Stage with Integrated Struts         */}
      {/* ============================================================== */}
      <group position={[0, 0, 0]}>
        {/* Octagonal Descent Stage Core (Gold Mylar Thermal Insulation) */}
        <mesh position={[0, 1.15, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[2.55, 2.85, 1.55, 8]} />
          <meshStandardMaterial color="#f59e0b" metalness={0.92} roughness={0.18} />
        </mesh>

        {/* Upper & Lower Structural Titanium Octagonal Ring Frames */}
        <mesh position={[0, 1.92, 0]} receiveShadow castShadow>
          <cylinderGeometry args={[2.62, 2.62, 0.14, 8]} />
          <meshStandardMaterial color="#1e293b" metalness={0.88} roughness={0.25} />
        </mesh>
        <mesh position={[0, 0.42, 0]} receiveShadow castShadow>
          <cylinderGeometry args={[2.90, 2.90, 0.14, 8]} />
          <meshStandardMaterial color="#1e293b" metalness={0.88} roughness={0.25} />
        </mesh>

        {/* 4 Spherical Cryogenic Propellant Tanks nested around Descent Stage */}
        {[0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2].map((ang, ti) => (
          <mesh
            key={`descent-tank-${ti}`}
            position={[Math.cos(ang) * 2.45, 1.15, Math.sin(ang) * 2.45]}
            castShadow
          >
            <sphereGeometry args={[0.52, 16, 16]} />
            <meshStandardMaterial color="#e2e8f0" metalness={0.85} roughness={0.2} />
          </mesh>
        ))}

        {/* 4 Articulated Hydraulic Landing Gear Assemblies Seated Flush on Ground (Y = 0) */}
        {/* Each leg connects directly from its Outrigger Mount on the Octagonal Stage (r=2.45) to the Footpad (r=3.65) */}
        {[Math.PI / 4, (3 * Math.PI) / 4, (5 * Math.PI) / 4, (7 * Math.PI) / 4].map((rotY, i) => (
          <group key={`lander-leg-assembly-${i}`} rotation={[0, rotY, 0]}>
            {/* Outrigger Structural Bracket attached directly to Descent Stage Hull (X = 2.45, Y = 1.68) */}
            <mesh position={[2.45, 1.68, 0]} castShadow>
              <boxGeometry args={[0.55, 0.32, 0.44]} />
              <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.2} />
            </mesh>

            {/* Lower Outrigger Hinge Bracket on Descent Stage Base (X = 2.65, Y = 0.55) */}
            <mesh position={[2.65, 0.55, 0]} castShadow>
              <boxGeometry args={[0.48, 0.26, 0.68]} />
              <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.2} />
            </mesh>

            {/* Primary Telescopic Hydraulic Shock Strut from Upper Bracket (2.55, 1.68) to Footpad (3.65, 0.14) */}
            <mesh position={[3.10, 0.91, 0]} rotation={[0, 0, 0.62]} castShadow>
              <cylinderGeometry args={[0.11, 0.14, 1.92, 16]} />
              <meshStandardMaterial color="#475569" metalness={0.92} roughness={0.18} />
            </mesh>
            {/* Gold Chrome Hydraulic Piston Inner Rod */}
            <mesh position={[3.38, 0.52, 0]} rotation={[0, 0, 0.62]} castShadow>
              <cylinderGeometry args={[0.075, 0.075, 0.95, 12]} />
              <meshStandardMaterial color="#eab308" metalness={0.95} roughness={0.12} />
            </mesh>

            {/* Dual Lower A-Frame Wishbone Struts connecting Lower Bracket (2.65, 0.55, ±0.28) to Footpad (3.65, 0.16, 0) */}
            {[-0.26, 0.26].map((sz, si) => (
              <mesh
                key={`wishbone-strut-${si}`}
                position={[3.15, 0.35, sz * 0.5]}
                rotation={[sz * -0.45, 0, 0.38]}
                castShadow
              >
                <cylinderGeometry args={[0.055, 0.055, 1.15, 10]} />
                <meshStandardMaterial color="#1e293b" metalness={0.88} roughness={0.22} />
              </mesh>
            ))}

            {/* Wide Circular Lunar/Planetary Dish Footpad firmly seated on Ground (X = 3.65, Y = 0.08) */}
            <group position={[3.65, 0, 0]}>
              <mesh position={[0, 0.08, 0]} receiveShadow castShadow>
                <cylinderGeometry args={[0.72, 0.88, 0.16, 24]} />
                <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.2} />
              </mesh>
              <mesh position={[0, 0.17, 0]}>
                <cylinderGeometry args={[0.32, 0.44, 0.12, 16]} />
                <meshStandardMaterial color="#eab308" metalness={0.88} roughness={0.22} />
              </mesh>
            </group>
          </group>
        ))}

        {/* High-Intensity Planetary Surface LED Work Floodlights */}
        {[-1.6, 1.6].map((fx, fi) => (
          <group key={`worklight-${fi}`} position={[fx, 1.85, 2.25]}>
            <mesh rotation={[0.35, 0, 0]}>
              <boxGeometry args={[0.35, 0.22, 0.25]} />
              <meshStandardMaterial color="#0f172a" />
            </mesh>
            <mesh position={[0, 0, 0.13]} rotation={[0.35, 0, 0]}>
              <circleGeometry args={[0.12, 12]} />
              <meshBasicMaterial color="#ffffff" />
            </mesh>
            <pointLight color="#f8fafc" intensity={2.5} distance={15} />
          </group>
        ))}
      </group>

      {/* ============================================================== */}
      {/* 2. UPPER ASCENT ORBITAL CAPSULE ("CÁPSULA DE NAVEGAÇÃO")       */}
      {/* High-Detail Orion/Dragon Class Command & Service Module        */}
      {/* ============================================================== */}
      <group position={[0, 2.92, 0]}>
        {/* --- A. COMMAND MODULE (PRESSURIZED CREW CABIN) --- */}
        {/* Truncated Conical Aerodynamic Pressure Hull (Crisp Aerospace White + Dark Thermal Nose) */}
        <mesh position={[0, 1.25, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.58, 1.52, 2.30, 48]} />
          <meshStandardMaterial color="#f1f5f9" metalness={0.35} roughness={0.22} />
        </mesh>

        {/* Upper Dark Thermal Nose Collar */}
        <mesh position={[0, 2.13, 0]} castShadow>
          <cylinderGeometry args={[0.57, 0.81, 0.56, 48]} />
          <meshStandardMaterial color="#0f172a" metalness={0.85} roughness={0.25} />
        </mesh>

        {/* Structural Titanium Compression Rings around Conical Hull */}
        {[
          { y: 1.85, r: 0.82, col: '#eab308' },
          { y: 0.72, r: 1.30, col: '#334155' },
          { y: 0.18, r: 1.52, col: '#eab308' },
        ].map((ring, ri) => (
          <mesh key={`lander-cm-ring-${ri}`} position={[0, ring.y, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[ring.r, 0.028, 12, 48]} />
            <meshStandardMaterial color={ring.col} metalness={0.9} roughness={0.18} />
          </mesh>
        ))}

        {/* Forward Orbital Docking Adapter (IDSS Port, Latch Petals & Optical Lidar) */}
        <group position={[0, 2.52, 0]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.46, 0.58, 0.34, 36]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.88} roughness={0.18} />
          </mesh>
          <mesh position={[0, 0.18, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.42, 0.045, 14, 36]} />
            <meshStandardMaterial color="#eab308" metalness={0.92} roughness={0.15} />
          </mesh>
          {Array.from({ length: 6 }).map((_, li) => {
            const ang = (li * Math.PI) / 3;
            return (
              <mesh
                key={`lander-dock-latch-${li}`}
                position={[Math.cos(ang) * 0.44, 0.08, Math.sin(ang) * 0.44]}
                rotation={[0, -ang, 0]}
              >
                <boxGeometry args={[0.08, 0.16, 0.06]} />
                <meshStandardMaterial color="#1e293b" metalness={0.9} />
              </mesh>
            );
          })}
          <mesh position={[0, 0.16, 0]}>
            <sphereGeometry args={[0.26, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
            <meshPhysicalMaterial color="#38bdf8" metalness={0.2} roughness={0.05} transmission={0.85} transparent opacity={0.9} />
          </mesh>
          <mesh position={[-0.50, 0.05, 0]}>
            <sphereGeometry args={[0.045, 10, 10]} />
            <meshBasicMaterial color="#ef4444" />
          </mesh>
          <mesh position={[0.50, 0.05, 0]}>
            <sphereGeometry args={[0.045, 10, 10]} />
            <meshBasicMaterial color="#22c55e" />
          </mesh>
        </group>

        {/* Heat Shield Base Plate */}
        <mesh position={[0, 0.08, 0]} castShadow>
          <cylinderGeometry args={[1.53, 1.48, 0.24, 48]} />
          <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.32} />
        </mesh>

        {/* Gold-Tinted Aerospace Quartz Panoramic Visor with Beveled Frame */}
        <group position={[0, 1.62, 0.94]} rotation={[0.39, 0, 0]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.40, 0.48, 0.22, 28]} />
            <meshStandardMaterial color="#1e293b" metalness={0.9} roughness={0.2} />
          </mesh>
          <mesh position={[0, 0.02, 0]}>
            <cylinderGeometry args={[0.35, 0.42, 0.23, 28]} />
            <meshPhysicalMaterial
              color="#facc15"
              metalness={0.92}
              roughness={0.05}
              transmission={0.85}
              transparent
              opacity={0.90}
            />
          </mesh>
          <pointLight color="#38bdf8" intensity={1.5} distance={4} />
          <mesh position={[0, 0.12, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.34, 0.47, 28]} />
            <meshStandardMaterial color="#38bdf8" metalness={0.9} side={DoubleSide} />
          </mesh>
        </group>

        {/* Crew Airlock Hatch with Illuminated Window & Yellow Emergency Release Ring */}
        <group position={[-0.99, 1.15, -0.35]} rotation={[0, -2.1, 0.39]}>
          <mesh castShadow>
            <boxGeometry args={[0.09, 0.90, 0.72]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.8} roughness={0.22} />
          </mesh>
          <mesh position={[-0.055, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
            <ringGeometry args={[0.16, 0.24, 24]} />
            <meshStandardMaterial color="#eab308" side={DoubleSide} />
          </mesh>
          <mesh position={[-0.06, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
            <circleGeometry args={[0.15, 20]} />
            <meshBasicMaterial color="#38bdf8" />
          </mesh>
        </group>

        {/* CURVED FLUSH COMMAND MODULE INSIGNIAS */}
        {/* Starboard Flank: Official Angola Flag Curved Flush */}
        <group position={[0.79, 1.18, 0.79]} rotation={[-0.388, Math.PI / 4, 0]} scale={[0.254, 0.40, 0.40]}>
          <CurvedAngolaFlagDecal width={1.26} height={0.84} radius={1.12} slope={0.408} />
        </group>

        {/* Port Flank: Official GGPEN Logo Curved Flush */}
        <group position={[-0.79, 1.18, 0.79]} rotation={[-0.388, -Math.PI / 4, 0]} scale={[0.254, 0.40, 0.40]}>
          <CurvedGGPENLogoDecal width={1.28} height={0.80} radius={1.12} slope={0.408} />
        </group>

        {/* --- B. SERVICE MODULE & POWER PROPULSION --- */}
        <mesh position={[0, -0.45, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[1.46, 1.46, 0.98, 48]} />
          <meshStandardMaterial color="#f8fafc" metalness={0.38} roughness={0.26} />
        </mesh>

        {/* Gold Kapton MLI Foil Quadrants on Service Module */}
        {[-Math.PI / 2, Math.PI / 2].map((ang, gi) => (
          <mesh key={`lander-kapton-${gi}`} position={[0, -0.45, 0]} rotation={[0, ang, 0]}>
            <cylinderGeometry args={[1.466, 1.466, 0.68, 24, 1, true, -0.45, 0.90]} />
            <meshStandardMaterial color="#f59e0b" metalness={0.92} roughness={0.16} side={DoubleSide} />
          </mesh>
        ))}

        {/* Large Flush Curved Angola Flag on Front & Rear Service Module Cylinder */}
        <group position={[0, -0.45, 1.464]}>
          <CurvedAngolaFlagDecal width={1.24} height={0.78} radius={1.464} slope={0} />
        </group>
        <group position={[0, -0.45, -1.464]} rotation={[0, Math.PI, 0]}>
          <CurvedAngolaFlagDecal width={1.24} height={0.78} radius={1.464} slope={0} />
        </group>

        {/* Quad RCS Attitude Thruster Pods */}
        {[0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2].map((rot, i) => (
          <group key={`lander-rcs-${i}`} position={[0, -0.35, 0]} rotation={[0, rot, 0]}>
            <mesh position={[1.48, 0, 0]} castShadow>
              <boxGeometry args={[0.16, 0.24, 0.26]} />
              <meshStandardMaterial color="#0f172a" />
            </mesh>
            {[-0.07, 0.07].map((nz, ni) => (
              <mesh key={`rcs-bell-${ni}`} position={[1.58, 0, nz]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.022, 0.05, 0.12, 10]} />
                <meshStandardMaterial color="#94a3b8" metalness={0.95} />
              </mesh>
            ))}
          </group>
        ))}

        {/* --- C. DEPLOYED PHOTOVOLTAIC SOLAR ARRAY WINGS --- */}
        <group ref={solarWingsRef}>
          {/* Port Solar Wing (Left) */}
          <group position={[-1.48, -0.40, 0]}>
            <mesh position={[-0.45, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.045, 0.045, 0.9, 10]} />
              <meshStandardMaterial color="#cbd5e1" metalness={0.9} />
            </mesh>
            {[-1.2, -2.4].map((px, pi) => (
              <group key={`sol-pl-${pi}`} position={[px, 0, 0]}>
                <mesh castShadow receiveShadow>
                  <boxGeometry args={[1.12, 0.045, 1.85]} />
                  <meshStandardMaterial color="#0f172a" metalness={0.9} />
                </mesh>
                <mesh position={[0, 0.026, 0]}>
                  <boxGeometry args={[1.05, 0.01, 1.78]} />
                  <meshStandardMaterial color="#0284c7" metalness={0.85} roughness={0.14} />
                </mesh>
                <mesh position={[0, -0.026, 0]}>
                  <boxGeometry args={[1.05, 0.01, 1.78]} />
                  <meshStandardMaterial color="#eab308" metalness={0.95} roughness={0.1} />
                </mesh>
              </group>
            ))}
          </group>

          {/* Starboard Solar Wing (Right) */}
          <group position={[1.48, -0.35, 0]}>
            <mesh position={[0.45, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.045, 0.045, 0.9, 10]} />
              <meshStandardMaterial color="#cbd5e1" metalness={0.9} />
            </mesh>
            {[1.2, 2.4].map((px, pi) => (
              <group key={`sol-pr-${pi}`} position={[px, 0, 0]}>
                <mesh castShadow receiveShadow>
                  <boxGeometry args={[1.12, 0.045, 1.85]} />
                  <meshStandardMaterial color="#0f172a" metalness={0.9} />
                </mesh>
                <mesh position={[0, 0.026, 0]}>
                  <boxGeometry args={[1.05, 0.01, 1.78]} />
                  <meshStandardMaterial color="#0284c7" metalness={0.85} roughness={0.14} />
                </mesh>
                <mesh position={[0, -0.026, 0]}>
                  <boxGeometry args={[1.05, 0.01, 1.78]} />
                  <meshStandardMaterial color="#eab308" metalness={0.95} roughness={0.1} />
                </mesh>
              </group>
            ))}
          </group>
        </group>

        {/* --- D. HIGH-GAIN COMMUNICATION DISH POINTING TO EARTH --- */}
        <group ref={dishRef} position={[0, -0.2, -1.55]}>
          <mesh position={[0, 0, -0.35]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.035, 0.035, 0.7, 8]} />
            <meshStandardMaterial color="#64748b" metalness={0.9} />
          </mesh>
          <mesh position={[0, 0, -0.75]} rotation={[-Math.PI / 2, 0, 0]}>
            <sphereGeometry args={[0.55, 20, 12, 0, Math.PI * 2, 0, Math.PI * 0.45]} />
            <meshStandardMaterial color="#f8fafc" metalness={0.6} roughness={0.3} side={DoubleSide} />
          </mesh>
          <mesh position={[0, 0, -0.92]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.02, 0.04, 0.35, 8]} />
            <meshStandardMaterial color="#eab308" metalness={0.95} />
          </mesh>
        </group>

        {/* --- E. ASCENT PROPULSION ENGINE & PLASMA EXHAUST --- */}
        <group position={[0, -0.95, 0]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.36, 0.78, 0.68, 28]} />
            <meshStandardMaterial color="#1e293b" metalness={0.95} roughness={0.15} />
          </mesh>

          {isLaunching && (
            <group ref={thrusterGlowRef} position={[0, -1.6, 0]}>
              <mesh>
                <cylinderGeometry args={[0.65, 0.15, 2.8, 16]} />
                <meshBasicMaterial color="#38bdf8" transparent opacity={0.85} />
              </mesh>
              <mesh position={[0, 0.5, 0]}>
                <cylinderGeometry args={[0.35, 0.06, 1.6, 12]} />
                <meshBasicMaterial color="#ffffff" transparent opacity={0.95} />
              </mesh>
              <pointLight color="#00d4ff" intensity={6.0} distance={18} />
            </group>
          )}
        </group>
      </group>
    </group>
  );
}
