import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group, DoubleSide, MathUtils } from 'three';
import { CurvedAngolaFlagDecal, CurvedGGPENLogoDecal } from './AngolaFlag';
import { RocketModel } from './RocketModel';

interface OrbitalCapsuleProps {
  isFlying?: boolean;
  stagingProgress?: number; // 0.0 (freshly arriving from launch) to 1.0 (fully staged into compact capsule)
  showFullBooster?: boolean;
  thrustLevel?: number; // 0.0 to 1.0+ normalized propulsion intensity
  rcsPitch?: number; // -1 to 1
  rcsYaw?: number; // -1 to 1
  solarHeatPct?: number; // 0 to 100 solar thermal proximity
  isEvaporating?: boolean; // true while evaporating near the Sun
}

/**
 * HIGH-TECH COMPACT ORBITAL EXPLORATION SPACECRAFT (CÁPSULA ORBITAL DE EXPLORAÇÃO GGPEN)
 * Next-generation Orion / Crew Dragon inspired aerospace command & service module:
 * - Multi-ribbed conical pressure hull with thermal tile seams, beveled panoramic quartz flight visor,
 *   and side cabin observation portholes.
 * - International Docking System Standard (IDSS) forward docking ring with capture latches,
 *   laser Lidar rendezvous sensors, and navigation beacons.
 * - Gold Kapton MLI thermal foil panels and radiator louvers on the cylindrical Service Module.
 * - Prominent curved Angola Flag and GGPEN official insignias flush on both the Command and Service hulls.
 * - Deployable photovoltaic solar wings with articulated truss booms, high-gain deep space antenna,
 *   and supersonic ion/chemical plasma propulsion bell.
 */
export function OrbitalCapsule({
  isFlying = false,
  stagingProgress = 1.0,
  showFullBooster = false,
  thrustLevel = 0.5,
  rcsPitch = 0,
  rcsYaw = 0,
  solarHeatPct = 0,
  isEvaporating = false,
}: OrbitalCapsuleProps) {
  const solarWingsRef = useRef<Group>(null);
  const dishRef = useRef<Group>(null);
  const plumeRef = useRef<Group>(null);
  const evapShellRef = useRef<Group>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    // Subtle antenna tracking rotation
    if (dishRef.current) {
      dishRef.current.rotation.y = Math.sin(t * 0.4) * 0.25;
    }
    // Solar wings deployment angle according to staging
    if (solarWingsRef.current) {
      const deployAngle = MathUtils.lerp(0, 1, Math.min(1, Math.max(0, (stagingProgress - 0.2) / 0.8)));
      solarWingsRef.current.scale.set(deployAngle, 1, deployAngle);
    }
    // Smooth dynamic plasma plume pulse & thrust scaling
    if (plumeRef.current && isFlying) {
      const flicker = 0.94 + Math.sin(t * 38) * 0.06;
      const lengthScale = MathUtils.lerp(0.65, 1.65, Math.min(1.3, thrustLevel)) * flicker;
      const radialScale = MathUtils.lerp(0.85, 1.25, Math.min(1.2, thrustLevel)) * flicker;
      plumeRef.current.scale.set(radialScale, lengthScale, radialScale);
    }
    if (evapShellRef.current && (solarHeatPct > 0 || isEvaporating)) {
      const pulse = isEvaporating ? 1.15 + Math.sin(t * 28) * 0.25 : 1.0 + Math.sin(t * 14) * 0.06;
      evapShellRef.current.scale.setScalar(pulse);
    }
  });

  const isStaging = stagingProgress < 1.0;
  const rcsActive = Math.abs(rcsPitch) > 0.08 || Math.abs(rcsYaw) > 0.08;
  const heatAlpha = isEvaporating ? 0.72 : MathUtils.clamp((solarHeatPct / 100) * 0.45, 0, 0.5);

  return (
    <group>
      {(solarHeatPct > 5 || isEvaporating) && (
        <group ref={evapShellRef}>
          <mesh>
            <sphereGeometry args={[2.75, 24, 24]} />
            <meshBasicMaterial
              color={isEvaporating ? '#fff7ed' : '#f97316'}
              transparent
              opacity={heatAlpha}
              depthWrite={false}
              toneMapped={false}
            />
          </mesh>
          <mesh>
            <sphereGeometry args={[3.45, 20, 20]} />
            <meshBasicMaterial
              color="#ea580c"
              transparent
              opacity={heatAlpha * 0.55}
              depthWrite={false}
              toneMapped={false}
            />
          </mesh>
        </group>
      )}
      {/* ============================================================== */}
      {/* 1. CINEMATIC DESENCAPSULAMENTO (FAIRING JETTISON & BOOSTER)    */}
      {/* Renders jettisoning fairing halves and drifting booster stage   */}
      {/* ============================================================== */}
      {isStaging && (
        <group>
          {/* Expended Booster Stage drifting backwards into deep space */}
          <group position={[0, -22 - stagingProgress * 65, stagingProgress * 55]}>
            <group scale={[0.85, 0.85, 0.85]}>
              <RocketModel isFlying={false} />
            </group>
          </group>

          {/* Left Payload Fairing Half pushing laterally outward */}
          <group
            position={[-2.4 - stagingProgress * 28, 1.2, -stagingProgress * 15]}
            rotation={[0, 0, -stagingProgress * 1.8]}
          >
            <mesh castShadow>
              <cylinderGeometry args={[1.5, 1.6, 7.5, 16, 1, true, 0, Math.PI]} />
              <meshStandardMaterial color="#f8fafc" metalness={0.4} roughness={0.3} side={DoubleSide} />
            </mesh>
            {/* Nitrogen RCS separation gas puff */}
            <mesh position={[0.2, 0, 0]}>
              <sphereGeometry args={[0.5 + stagingProgress * 1.2, 8, 8]} />
              <meshBasicMaterial color="#38bdf8" transparent opacity={Math.max(0, 1.0 - stagingProgress * 1.2)} />
            </mesh>
          </group>

          {/* Right Payload Fairing Half pushing laterally outward */}
          <group
            position={[2.4 + stagingProgress * 28, 1.2, -stagingProgress * 15]}
            rotation={[0, 0, stagingProgress * 1.8]}
          >
            <mesh castShadow>
              <cylinderGeometry args={[1.5, 1.6, 7.5, 16, 1, true, Math.PI, Math.PI]} />
              <meshStandardMaterial color="#f8fafc" metalness={0.4} roughness={0.3} side={DoubleSide} />
            </mesh>
            <mesh position={[-0.2, 0, 0]}>
              <sphereGeometry args={[0.5 + stagingProgress * 1.2, 8, 8]} />
              <meshBasicMaterial color="#38bdf8" transparent opacity={Math.max(0, 1.0 - stagingProgress * 1.2)} />
            </mesh>
          </group>
        </group>
      )}

      {/* Manual Full Booster Mode (if player toggles) */}
      {showFullBooster && !isStaging && (
        <group position={[0, -26, 0]}>
          <RocketModel isFlying={isFlying} />
        </group>
      )}

      {/* ============================================================== */}
      {/* 2. COMPACT ORBITAL EXPLORATION SPACECRAFT ("NAVE PEQUENA")     */}
      {/* High-Detail Orion/Dragon-Class Command & Service Vehicle       */}
      {/* ============================================================== */}
      <group position={[0, 0, 0]}>
        {/* --- A. COMMAND MODULE (PRESSURIZED CREW CABIN) --- */}
        {/* Primary Aerodynamic Conical Hull (High-Reflectance White & Carbon Thermal Trim) */}
        <mesh position={[0, 0.28, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.58, 1.50, 2.28, 48]} />
          <meshStandardMaterial color="#f1f5f9" metalness={0.35} roughness={0.22} />
        </mesh>

        {/* Upper Forward Dark Thermal Shield Collar */}
        <mesh position={[0, 1.16, 0]} castShadow>
          <cylinderGeometry args={[0.57, 0.80, 0.56, 48]} />
          <meshStandardMaterial color="#0f172a" metalness={0.85} roughness={0.25} />
        </mesh>

        {/* Structural Titanium Compression Rings around Conical Command Module */}
        {[
          { y: 0.88, r: 0.81, col: '#eab308' },
          { y: -0.25, r: 1.29, col: '#334155' },
          { y: -0.78, r: 1.50, col: '#eab308' },
        ].map((ring, ri) => (
          <mesh key={`cm-ring-${ri}`} position={[0, ring.y, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[ring.r, 0.026, 12, 48]} />
            <meshStandardMaterial color={ring.col} metalness={0.9} roughness={0.18} />
          </mesh>
        ))}

        {/* Forward Orbital Docking Adapter (IDSS Port, Latch Petals & Optical Lidar) */}
        <group position={[0, 1.54, 0]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.46, 0.56, 0.34, 36]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.88} roughness={0.18} />
          </mesh>
          {/* Gold Docking Capture Ring */}
          <mesh position={[0, 0.18, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.42, 0.045, 14, 36]} />
            <meshStandardMaterial color="#eab308" metalness={0.92} roughness={0.15} />
          </mesh>
          {/* 6 Radial Docking Capture Latches */}
          {Array.from({ length: 6 }).map((_, li) => {
            const ang = (li * Math.PI) / 3;
            return (
              <mesh
                key={`dock-latch-${li}`}
                position={[Math.cos(ang) * 0.44, 0.08, Math.sin(ang) * 0.44]}
                rotation={[0, -ang, 0]}
              >
                <boxGeometry args={[0.08, 0.16, 0.06]} />
                <meshStandardMaterial color="#1e293b" metalness={0.9} />
              </mesh>
            );
          })}
          {/* Star Tracker & Rendezvous Optical Dome */}
          <mesh position={[0, 0.16, 0]}>
            <sphereGeometry args={[0.26, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
            <meshPhysicalMaterial color="#38bdf8" metalness={0.2} roughness={0.05} transmission={0.85} transparent opacity={0.9} />
          </mesh>
          {/* Port & Starboard Navigation Strobe Beacons */}
          <mesh position={[-0.50, 0.05, 0]}>
            <sphereGeometry args={[0.045, 10, 10]} />
            <meshBasicMaterial color="#ef4444" />
          </mesh>
          <mesh position={[0.50, 0.05, 0]}>
            <sphereGeometry args={[0.045, 10, 10]} />
            <meshBasicMaterial color="#22c55e" />
          </mesh>
        </group>

        {/* Ablative Ceramic Heat Shield Base (PICA-X Dark Tile Matrix) */}
        <mesh position={[0, -0.88, 0]} castShadow>
          <cylinderGeometry args={[1.51, 1.44, 0.24, 48]} />
          <meshStandardMaterial color="#0f172a" metalness={0.88} roughness={0.32} />
        </mesh>

        {/* Panoramic Cockpit Flight Visor (Gold-Tinted Aerospace Quartz + Beveled Frame) */}
        <group position={[0, 0.62, 0.94]} rotation={[0.39, 0, 0]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.38, 0.46, 0.20, 28]} />
            <meshStandardMaterial color="#1e293b" metalness={0.9} roughness={0.2} />
          </mesh>
          <mesh position={[0, 0.02, 0]}>
            <cylinderGeometry args={[0.34, 0.40, 0.21, 28]} />
            <meshPhysicalMaterial
              color="#facc15"
              metalness={0.92}
              roughness={0.05}
              transmission={0.85}
              transparent
              opacity={0.90}
            />
          </mesh>
          <pointLight color="#38bdf8" intensity={1.8} distance={3.5} />
          <mesh position={[0, 0.11, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.33, 0.45, 28]} />
            <meshStandardMaterial color="#38bdf8" metalness={0.9} side={DoubleSide} />
          </mesh>
        </group>

        {/* Crew Airlock Hatch on Dorsal/Port Quarter with Locking Wheel */}
        <group position={[-0.98, 0.15, -0.35]} rotation={[0, -2.1, 0.39]}>
          <mesh castShadow>
            <boxGeometry args={[0.09, 0.88, 0.72]} />
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

        {/* CURVED FLUSH COMMAND MODULE INSIGNIAS (Zero floating edges, high visibility!) */}
        {/* Starboard Conical Hull: Official Angola Flag Curved Flush */}
        <group position={[0.785, 0.20, 0.785]} rotation={[-0.385, Math.PI / 4, 0]} scale={[0.254, 0.40, 0.40]}>
          <CurvedAngolaFlagDecal width={1.25} height={0.84} radius={1.11} slope={0.404} />
        </group>

        {/* Port Conical Hull: Official GGPEN Logo Curved Flush */}
        <group position={[-0.785, 0.20, 0.785]} rotation={[-0.385, -Math.PI / 4, 0]} scale={[0.254, 0.40, 0.40]}>
          <CurvedGGPENLogoDecal width={1.28} height={0.80} radius={1.11} slope={0.404} />
        </group>

        {/* --- B. SERVICE MODULE & AVIONICS PROPULSION BAY --- */}
        {/* Cylindrical White & Gold Kapton Aerospace Service Body */}
        <mesh position={[0, -1.52, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[1.44, 1.44, 1.14, 48]} />
          <meshStandardMaterial color="#f8fafc" metalness={0.38} roughness={0.26} />
        </mesh>

        {/* Gold Kapton MLI Thermal Foil Panels on Lateral Service Module Quadrants */}
        {[-Math.PI / 2, Math.PI / 2].map((ang, gi) => (
          <mesh key={`kapton-bay-${gi}`} position={[0, -1.52, 0]} rotation={[0, ang, 0]}>
            <cylinderGeometry args={[1.446, 1.446, 0.78, 24, 1, true, -0.45, 0.90]} />
            <meshStandardMaterial color="#f59e0b" metalness={0.92} roughness={0.16} side={DoubleSide} />
          </mesh>
        ))}

        {/* Large Curved Angola Flag & GGPEN Insignias on Service Module (Visible from all angles) */}
        <group position={[0, -1.50, 1.444]}>
          <CurvedAngolaFlagDecal width={1.22} height={0.78} radius={1.444} slope={0} />
        </group>
        <group position={[0, -1.50, -1.444]} rotation={[0, Math.PI, 0]}>
          <CurvedAngolaFlagDecal width={1.22} height={0.78} radius={1.444} slope={0} />
        </group>

        {/* Titanium Avionics Hat Bands */}
        {[-1.00, -2.04].map((by, bi) => (
          <mesh key={`hat-band-${bi}`} position={[0, by, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[1.45, 0.04, 12, 48]} />
            <meshStandardMaterial color="#1e293b" metalness={0.9} roughness={0.2} />
          </mesh>
        ))}

        {/* Quad RCS Attitude Thruster Clusters (Pitch, Yaw & Roll Control) */}
        {[0, Math.PI / 2, Math.PI, Math.PI * 1.5].map((rot, i) => {
          const isFiringThisCluster =
            rcsActive &&
            ((i === 0 && rcsYaw < -0.08) ||
              (i === 2 && rcsYaw > 0.08) ||
              (i === 1 && rcsPitch > 0.08) ||
              (i === 3 && rcsPitch < -0.08));
          return (
            <group key={`capsule-rcs-${i}`} position={[0, -1.32, 0]} rotation={[0, rot, 0]}>
              <mesh position={[1.46, 0, 0]} castShadow>
                <boxGeometry args={[0.16, 0.24, 0.26]} />
                <meshStandardMaterial color="#0f172a" metalness={0.85} />
              </mesh>
              {/* 4 Micro Nozzles */}
              {[-0.07, 0.07].map((nz, ni) => (
                <mesh key={`rcs-nozzle-${ni}`} position={[1.55, 0, nz]} rotation={[0, 0, Math.PI / 2]}>
                  <cylinderGeometry args={[0.022, 0.048, 0.12, 10]} />
                  <meshStandardMaterial color="#94a3b8" metalness={0.95} />
                </mesh>
              ))}
              {/* Active RCS Cold-Gas Thruster Jet Plume */}
              {isFiringThisCluster && (
                <mesh position={[1.85, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
                  <coneGeometry args={[0.16, 0.55, 8]} />
                  <meshBasicMaterial color="#7dd3fc" transparent opacity={0.75} depthWrite={false} />
                </mesh>
              )}
            </group>
          );
        })}

        {/* --- C. DEPLOYABLE PHOTOVOLTAIC SOLAR ARRAY WINGS --- */}
        <group ref={solarWingsRef}>
          {/* Port Solar Wing (Left) */}
          <group position={[-1.46, -1.48, 0]}>
            <mesh position={[-0.45, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.045, 0.045, 0.9, 10]} />
              <meshStandardMaterial color="#cbd5e1" metalness={0.9} />
            </mesh>
            {[-1.2, -2.4, -3.6].map((px, pi) => (
              <group key={`solar-panel-l-${pi}`} position={[px, 0, 0]}>
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
          <group position={[1.46, -1.48, 0]}>
            <mesh position={[0.45, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.045, 0.045, 0.9, 10]} />
              <meshStandardMaterial color="#cbd5e1" metalness={0.9} />
            </mesh>
            {[1.2, 2.4, 3.6].map((px, pi) => (
              <group key={`solar-panel-r-${pi}`} position={[px, 0, 0]}>
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

        {/* --- D. HIGH-GAIN DEEP SPACE ANTENNA DISH --- */}
        <group ref={dishRef} position={[0, -1.3, -1.48]}>
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

        {/* --- E. ION / CHEMICAL PROPULSION ENGINE & PLASMA EXHAUST --- */}
        <group position={[0, -2.15, 0]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.36, 0.78, 0.68, 28]} />
            <meshStandardMaterial color="#1e293b" metalness={0.95} roughness={0.15} />
          </mesh>
          <mesh position={[0, -0.15, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.64, 0.028, 8, 28]} />
            <meshStandardMaterial color="#eab308" metalness={0.9} />
          </mesh>

          <mesh position={[0, -0.3, 0]}>
            <sphereGeometry args={[0.42, 16, 16]} />
            <meshBasicMaterial color="#00d4ff" />
          </mesh>

          {isFlying && (
            <group ref={plumeRef} position={[0, -1.8, 0]}>
              <mesh>
                <cylinderGeometry args={[0.65, 0.12, 3.2, 16]} />
                <meshBasicMaterial color="#38bdf8" transparent opacity={0.8} depthWrite={false} />
              </mesh>
              <mesh position={[0, 0.6, 0]}>
                <cylinderGeometry args={[0.35, 0.05, 1.8, 12]} />
                <meshBasicMaterial color="#ffffff" transparent opacity={0.95} depthWrite={false} />
              </mesh>
              <pointLight color="#00d4ff" intensity={4.5} distance={12} />
            </group>
          )}
        </group>
      </group>
    </group>
  );
}
