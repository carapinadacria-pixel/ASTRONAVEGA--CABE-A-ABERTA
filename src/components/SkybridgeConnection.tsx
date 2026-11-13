import React, { useMemo } from 'react';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import { Text } from '@react-three/drei';
import { CanvasTexture, RepeatWrapping, SRGBColorSpace, DoubleSide } from 'three';

// Procedural industrial non-slip grating texture for skybridge floor
let cachedSkybridgeTexture: CanvasTexture | null = null;
function getSkybridgeTexture(): CanvasTexture | null {
  if (cachedSkybridgeTexture) return cachedSkybridgeTexture;
  if (typeof document === 'undefined') return null;

  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = '#0f172a';
    for (let y = 0; y < size; y += 16) {
      for (let x = 0; x < size; x += 16) {
        ctx.fillRect(x + 2, y + 2, 12, 12);
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 2, y + 2, 12, 12);
      }
    }
  }

  cachedSkybridgeTexture = new CanvasTexture(canvas);
  cachedSkybridgeTexture.colorSpace = SRGBColorSpace;
  cachedSkybridgeTexture.wrapS = RepeatWrapping;
  cachedSkybridgeTexture.wrapT = RepeatWrapping;
  cachedSkybridgeTexture.repeat.set(4, 16);
  return cachedSkybridgeTexture;
}

/**
 * LEVEL PANORAMIC SKYBRIDGE & DUAL-STAIRCASE LABORATORY CONNECTION
 * 1. Exterior Glass Skybridge (Z = -63.5 to -49.0 at X = 241.5):
 *    100% HORIZONTAL & LEVEL at Y = 18.50m (rotation = [0, 0, 0]) connecting the
 *    Laboratory Rooftop Terrace (Y = 18.50m) straight into the Hangar (VAB) South Portal!
 * 2. VAB Interior High-Bay Gangway & Staircase (Z = -49.0 to -13.6 at X = 241.5):
 *    Connects the level Skybridge entry (Y = 18.50m at Z = -49.0) via an interior
 *    staircase (Z = -46.0 to -34.0) up to the VAB 3rd Floor Investigation Area (Y = 23.85m).
 * 3. Laboratory Staircase 1 (Ground Floor Y = 0.0m ➔ 2nd Floor Upper Space Y = 10.50m):
 *    Located at X = 235.5, rising from Z = -88.0 (Y = 0m) to Z = -75.0 (Y = 10.50m).
 * 4. Laboratory Staircase 2 (2nd Floor Upper Space Y = 10.50m ➔ Rooftop Y = 18.50m):
 *    Located at X = 241.5 in the upper floor of the Laboratory, rising from Z = -81.5
 *    (Y = 10.50m) through the roof opening to Z = -69.5 (Y = 18.50m), aligned directly
 *    with the 100% level Exterior Glass Skybridge!
 */
export function SkybridgeConnection() {
  const gratingMap = useMemo(() => getSkybridgeTexture(), []);

  // Unified Skybridge & Rooftop Staircase 2 axis: X = 241.5
  const posX = 241.5;
  const walkWidth = 3.8;

  // ---------------------------------------------------------------------------
  // A. VAB INTERIOR WALKWAY & INTERNAL STAIRCASE (Z = -49.0 to -13.6)
  // ---------------------------------------------------------------------------
  // A1: Level entry landing inside VAB South Portal (Z = -49.0 to -45.5 at Y = 18.33m, top = 18.50m)
  // A2: Interior VAB Staircase rising from Z = -45.5 (Y = 18.50m) to Z = -34.0 (Y = 24.02m)
  const vabStairStartZ = -45.5;
  const vabStairEndZ = -34.0;
  const vabStairLen = vabStairEndZ - vabStairStartZ; // 11.5m
  const vabStairH = 23.85 - 18.33; // 5.52m
  const vabStairAngle = Math.atan2(vabStairH, vabStairLen);
  const vabStairHypot = Math.hypot(vabStairH, vabStairLen);
  const vabStairCenterZ = (vabStairStartZ + vabStairEndZ) / 2; // -39.75m
  const vabStairCenterY = (18.33 + 23.85) / 2; // 21.09m
  const vabStairSteps = 18;

  // A3: Level VAB 3rd Floor Walkway from Z = -34.0 to Z = -13.6 (length 20.4m) at Y = 23.85m
  const vLen = 20.4;
  const vCenterZ = -23.8;

  // ---------------------------------------------------------------------------
  // B. 100% HORIZONTAL EXTERIOR GLASS SKYBRIDGE (Z = -63.5 to -49.0 at Y = 18.33m)
  // Top walking surface = 18.50m (Exact level of Laboratory Rooftop!)
  // ---------------------------------------------------------------------------
  const bridgeY = 18.33; // Top surface = 18.50m
  const rZStart = -49.0;
  const rZEnd = -63.5;
  const bridgeLen = Math.abs(rZEnd - rZStart); // 14.5m level span
  const rCenterZ = (rZStart + rZEnd) / 2; // -56.25m

  // ---------------------------------------------------------------------------
  // C. STAIRCASE 1 (GROUND FLOOR Y = 0.0m ➔ 2ND FLOOR UPPER SPACE Y = 10.50m)
  // Positioned at X = 235.5, rising Northward from Z = -88.0 to Z = -75.0
  // ---------------------------------------------------------------------------
  const stair1X = 235.5;
  const stair1StartZ = -88.0;
  const stair1EndZ = -75.0;
  const stair1H = 10.5;
  const stair1L = stair1EndZ - stair1StartZ; // 13.0m run
  const stair1Angle = Math.atan2(stair1H, stair1L);
  const stair1Hypot = Math.hypot(stair1H, stair1L);
  const stair1CenterZ = (stair1StartZ + stair1EndZ) / 2; // -81.5m
  const stair1Steps = 26;

  // ---------------------------------------------------------------------------
  // D. STAIRCASE 2 (2ND FLOOR UPPER SPACE Y = 10.50m ➔ LAB ROOFTOP Y = 18.50m)
  // Positioned at X = 241.5 in the upper floor of the Lab, rising from Z = -81.5 to -69.5
  // ---------------------------------------------------------------------------
  const stair2X = 241.5;
  const stair2StartY = 10.5;
  const stair2EndY = 18.5;
  const stair2StartZ = -81.5;
  const stair2EndZ = -69.5;
  const stair2H = stair2EndY - stair2StartY; // 8.0m rise
  const stair2L = stair2EndZ - stair2StartZ; // 12.0m run
  const stair2Angle = Math.atan2(stair2H, stair2L);
  const stair2Hypot = Math.hypot(stair2H, stair2L);
  const stair2CenterZ = (stair2StartZ + stair2EndZ) / 2; // -75.5m
  const stair2CenterY = (stair2StartY + stair2EndY) / 2; // 14.5m
  const stair2Steps = 20;

  return (
    <group>
      {/* ============================================================== */}
      {/* 1. VAB INTERIOR WALKWAY & INTERNAL STAIRCASE (Z = -49 to -13.6)*/}
      {/* ============================================================== */}
      <RigidBody type="fixed" colliders={false} friction={1.0} restitution={0}>
        {/* Level Entry Platform inside VAB South Portal (Z = -49.0 to -45.5 at Y = 18.33m) */}
        <CuboidCollider
          position={[posX, 18.33, -47.25]}
          args={[walkWidth / 2, 0.17, 1.85]}
          friction={1.0}
        />
        {/* Internal VAB Staircase Ramp Collider (Z = -45.5 at Y = 18.33m up to Z = -34.0 at Y = 23.85m) */}
        {/* Note: Negative X rotation lifts the +Z end (-34.0) and lowers the -Z end (-45.5)! */}
        <CuboidCollider
          position={[posX, vabStairCenterY, vabStairCenterZ]}
          rotation={[-vabStairAngle, 0, 0]}
          args={[walkWidth / 2, 0.17, vabStairHypot / 2]}
          friction={1.0}
        />
        {/* Smooth Top & Bottom Transition Bevels for VAB Internal Staircase */}
        <CuboidCollider
          position={[posX, 18.35, vabStairStartZ]}
          args={[walkWidth / 2, 0.15, 0.5]}
          friction={1.0}
        />
        <CuboidCollider
          position={[posX, 23.85, vabStairEndZ]}
          args={[walkWidth / 2, 0.17, 0.55]}
          friction={1.0}
        />
        {/* Level VAB 3rd Floor Walkway Collider (Z = -34.0 to -13.6 at Y = 23.85m) */}
        <CuboidCollider
          position={[posX, 23.85, vCenterZ]}
          args={[walkWidth / 2, 0.17, vLen / 2]}
          friction={1.0}
        />
        {/* Side Guardrail Colliders along VAB Interior Corridor */}
        <CuboidCollider
          position={[posX - walkWidth / 2 - 0.08, 22.5, -31.3]}
          args={[0.08, 4.5, 17.7]}
        />
        <CuboidCollider
          position={[posX + walkWidth / 2 + 0.08, 22.5, -31.3]}
          args={[0.08, 4.5, 17.7]}
        />
      </RigidBody>

      {/* Visual VAB Entry Platform at Y = 18.33m (Z = -49.0 to -45.5) */}
      <group position={[posX, 18.33, -47.25]}>
        <mesh receiveShadow castShadow>
          <boxGeometry args={[walkWidth, 0.34, 3.6]} />
          <meshStandardMaterial map={gratingMap || undefined} color="#1e293b" roughness={0.4} metalness={0.8} />
        </mesh>
        {[-walkWidth / 2, walkWidth / 2].map((rx, ri) => (
          <mesh key={`vab-entry-rail-${ri}`} position={[rx, 0.75, 0]}>
            <boxGeometry args={[0.06, 1.2, 3.6]} />
            <meshPhysicalMaterial color="#38bdf8" transparent opacity={0.35} transmission={0.85} side={DoubleSide} />
          </mesh>
        ))}
      </group>

      {/* Visual VAB Internal Staircase (Z = -45.5 to -34.0, rising from 18.5m to 23.85m) */}
      <group position={[posX, 0, 0]}>
        {[-1.7, 0, 1.7].map((sx, si) => (
          <mesh
            key={`vab-int-stringer-${si}`}
            position={[sx, vabStairCenterY - 0.15, vabStairCenterZ]}
            rotation={[-vabStairAngle, 0, 0]}
            castShadow
          >
            <boxGeometry args={[0.2, 0.38, vabStairHypot + 0.4]} />
            <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.2} />
          </mesh>
        ))}
        {Array.from({ length: vabStairSteps }).map((_, i) => {
          const frac = (i + 0.5) / vabStairSteps;
          const sy = 18.5 + frac * vabStairH;
          const sz = vabStairStartZ + frac * vabStairLen;
          return (
            <group key={`vab-int-step-${i}`} position={[0, sy, sz]}>
              <mesh castShadow receiveShadow>
                <boxGeometry args={[walkWidth - 0.3, 0.08, 0.56]} />
                <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.3} />
              </mesh>
              <mesh position={[0, 0.045, -0.24]}>
                <boxGeometry args={[walkWidth - 0.3, 0.025, 0.06]} />
                <meshStandardMaterial color="#eab308" roughness={0.3} metalness={0.4} />
              </mesh>
            </group>
          );
        })}
        {[-walkWidth / 2 + 0.08, walkWidth / 2 - 0.08].map((hx, hi) => (
          <mesh
            key={`vab-int-handrail-${hi}`}
            position={[hx, vabStairCenterY + 1.0, vabStairCenterZ]}
            rotation={[-vabStairAngle, 0, 0]}
          >
            <boxGeometry args={[0.08, 0.08, vabStairHypot]} />
            <meshStandardMaterial color="#eab308" metalness={0.8} />
          </mesh>
        ))}
      </group>

      {/* Visual VAB Level 3 High-Bay Walkway (Y = 23.85m, Z = -34.0 to -13.6) */}
      <group position={[posX, 23.85, vCenterZ]}>
        <mesh receiveShadow castShadow>
          <boxGeometry args={[walkWidth, 0.34, vLen]} />
          <meshStandardMaterial map={gratingMap || undefined} color="#1e293b" roughness={0.4} metalness={0.8} />
        </mesh>
        {[-walkWidth / 2 + 0.25, walkWidth / 2 - 0.25].map((bx, bi) => (
          <mesh key={`vab-walk-beam-${bi}`} position={[bx, -0.32, 0]} castShadow>
            <boxGeometry args={[0.24, 0.36, vLen]} />
            <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.25} />
          </mesh>
        ))}
        {[-walkWidth / 2, walkWidth / 2].map((rx, ri) => (
          <group key={`vab-gantry-rail-${ri}`} position={[rx, 0.75, 0]}>
            <mesh position={[0, 0.6, 0]} castShadow>
              <boxGeometry args={[0.08, 0.08, vLen]} />
              <meshStandardMaterial color="#cbd5e1" metalness={0.9} />
            </mesh>
            <mesh>
              <boxGeometry args={[0.04, 1.15, vLen]} />
              <meshPhysicalMaterial color="#38bdf8" transparent opacity={0.35} transmission={0.85} roughness={0.08} side={DoubleSide} />
            </mesh>
          </group>
        ))}
        <group position={[0, 2.8, 6.0]}>
          <mesh>
            <boxGeometry args={[3.6, 0.48, 0.08]} />
            <meshStandardMaterial color="#0f172a" metalness={0.8} />
          </mesh>
          <Text position={[0, 0, 0.06]} fontSize={0.19} color="#38bdf8" fontWeight="bold" anchorX="center">
            PONTE ENVIDRAÇADA NIVELADA ➔ TERRAÇO DO LABORATÓRIO (18.5m)
          </Text>
        </group>
      </group>

      {/* ============================================================== */}
      {/* 2. 100% LEVEL EXTERIOR PANORAMIC GLASS SKYBRIDGE (Y = 18.50m)  */}
      {/* Zero tilt (rotation = [0, 0, 0]) from Lab Roof (Z = -63.5)     */}
      {/* straight into the VAB South Portal (Z = -49.0)!                */}
      {/* ============================================================== */}
      <RigidBody type="fixed" colliders={false} friction={1.0} restitution={0}>
        {/* Completely Flat, Level Exterior Skybridge Floor Collider (Y = 18.33m, top surface = 18.50m) */}
        <CuboidCollider
          position={[posX, bridgeY, rCenterZ]}
          args={[walkWidth / 2, 0.17, bridgeLen / 2 + 0.4]}
          friction={1.0}
          restitution={0}
        />
        {/* West & East Enclosed Glass Wall Colliders */}
        <CuboidCollider
          position={[posX - walkWidth / 2 - 0.1, bridgeY + 1.6, rCenterZ]}
          args={[0.1, 1.6, bridgeLen / 2]}
        />
        <CuboidCollider
          position={[posX + walkWidth / 2 + 0.1, bridgeY + 1.6, rCenterZ]}
          args={[0.1, 1.6, bridgeLen / 2]}
        />
      </RigidBody>

      {/* Architectural Steel Portal Collars on VAB South Wall (Z = -49.05) & Laboratory Rooftop Edge (Z = -63.50) */}
      {[-49.05, -63.50].map((pz, idx) => (
        <group key={`skybridge-portal-collar-${idx}`} position={[posX, bridgeY + 1.75, pz]}>
          {[-walkWidth / 2 - 0.28, walkWidth / 2 + 0.28].map((px, pi) => (
            <mesh key={`portal-col-${pi}`} position={[px, 0, 0]} castShadow>
              <boxGeometry args={[0.52, 3.8, 0.85]} />
              <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.2} />
            </mesh>
          ))}
          <mesh position={[0, 1.75, 0]} castShadow>
            <boxGeometry args={[walkWidth + 1.1, 0.55, 0.92]} />
            <meshStandardMaterial color="#1e293b" metalness={0.9} roughness={0.2} />
          </mesh>
          {idx === 1 && (
            <Text position={[0, 1.75, -0.50]} rotation={[0, Math.PI, 0]} fontSize={0.20} color="#38bdf8" fontWeight="bold" anchorX="center">
              PONTE ENVIDRAÇADA NIVELADA ➔ HANGAR VAB
            </Text>
          )}
        </group>
      ))}

      {/* 100% Straight & Horizontal Enclosed Glass Skybridge Structure (rotation = [0, 0, 0]) */}
      <group position={[posX, bridgeY, rCenterZ]}>
        {/* Non-Slip Grating Deck */}
        <mesh receiveShadow castShadow>
          <boxGeometry args={[walkWidth, 0.34, bridgeLen + 0.6]} />
          <meshStandardMaterial
            map={gratingMap || undefined}
            color="#334155"
            roughness={0.38}
            metalness={0.75}
          />
        </mesh>

        {/* Bottom Steel Box Girders */}
        {[-walkWidth / 2 + 0.3, walkWidth / 2 - 0.3].map((gx, gi) => (
          <mesh key={`bridge-girder-${gi}`} position={[gx, -0.36, 0]} castShadow>
            <boxGeometry args={[0.34, 0.42, bridgeLen + 0.6]} />
            <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.2} />
          </mesh>
        ))}

        {/* Yellow Safety Side Curbs */}
        {[-walkWidth / 2 + 0.12, walkWidth / 2 - 0.12].map((cx, ci) => (
          <mesh key={`ramp-curb-${ci}`} position={[cx, 0.22, 0]} receiveShadow>
            <boxGeometry args={[0.22, 0.12, bridgeLen + 0.4]} />
            <meshStandardMaterial color="#eab308" roughness={0.3} metalness={0.4} />
          </mesh>
        ))}

        {/* Roof Canopy & LED Light Strip */}
        <mesh position={[0, 3.35, 0]} castShadow>
          <boxGeometry args={[walkWidth + 0.45, 0.26, bridgeLen + 0.8]} />
          <meshStandardMaterial color="#0f172a" roughness={0.4} metalness={0.88} />
        </mesh>
        <mesh position={[0, 3.18, 0]}>
          <boxGeometry args={[0.35, 0.05, bridgeLen + 0.4]} />
          <meshBasicMaterial color="#38bdf8" />
        </mesh>

        {/* Panoramic Tempered Glass Walls & Vertical Mullions */}
        {[-walkWidth / 2, walkWidth / 2].map((gx, gi) => (
          <group key={`ramp-glass-${gi}`} position={[gx, 1.68, 0]}>
            <mesh>
              <boxGeometry args={[0.06, 3.0, bridgeLen + 0.4]} />
              <meshPhysicalMaterial
                color="#38bdf8"
                transparent
                opacity={0.30}
                roughness={0.05}
                metalness={0.12}
                transmission={0.88}
                side={DoubleSide}
              />
            </mesh>
            {Array.from({ length: 7 }).map((_, mi) => {
              const mz = -bridgeLen / 2 + mi * (bridgeLen / 6);
              return (
                <mesh key={`ramp-mullion-${mi}`} position={[0, 0, mz]}>
                  <boxGeometry args={[0.16, 3.05, 0.16]} />
                  <meshStandardMaterial color="#1e293b" metalness={0.9} roughness={0.2} />
                </mesh>
              );
            })}
            <mesh position={[gi === 0 ? 0.14 : -0.14, -0.45, 0]}>
              <boxGeometry args={[0.07, 0.07, bridgeLen + 0.4]} />
              <meshStandardMaterial color="#e2e8f0" metalness={0.95} roughness={0.15} />
            </mesh>
          </group>
        ))}
      </group>

      {/* Exterior Steel Support Pylons under the Level Skybridge (Clear of the road!) */}
      {[-51.8, -61.2].map((pz, pi) => {
        const pHeight = bridgeY - 0.35;
        return (
          <group key={`ext-pylon-${pi}`} position={[posX, 0, pz]}>
            <mesh position={[0, pHeight, 0]} castShadow>
              <boxGeometry args={[walkWidth + 0.8, 0.45, 0.85]} />
              <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.2} />
            </mesh>
            {[-1.65, 1.65].map((cx, ci) => (
              <mesh key={`pylon-stanchion-${ci}`} position={[cx, pHeight / 2, 0]} castShadow>
                <cylinderGeometry args={[0.26, 0.34, pHeight, 16]} />
                <meshStandardMaterial color="#1e293b" metalness={0.9} roughness={0.2} />
              </mesh>
            ))}
          </group>
        );
      })}

      {/* ============================================================== */}
      {/* 3. LABORATORY ROOFTOP STAIRWELL GUARDRAILS & WALKWAY (18.50m)  */}
      {/* Rooftop Stairwell Cutout at X ∈ [239.4, 243.6], Z ∈ [-82, -69.5]*/}
      {/* ============================================================== */}
      <group>
        {/* West Rooftop Stairwell Guardrail (X = 239.35, Z = -82.0 to -69.5) */}
        <group position={[239.35, 19.15, -75.75]}>
          <RigidBody type="fixed" colliders="cuboid">
            <mesh>
              <boxGeometry args={[0.08, 1.3, 12.6]} />
              <meshPhysicalMaterial color="#38bdf8" transparent opacity={0.35} transmission={0.85} side={DoubleSide} />
            </mesh>
          </RigidBody>
          <mesh position={[0, 0.65, 0]}>
            <boxGeometry args={[0.16, 0.08, 12.7]} />
            <meshStandardMaterial color="#eab308" metalness={0.8} />
          </mesh>
        </group>

        {/* East Rooftop Stairwell Guardrail (X = 243.65, Z = -82.0 to -69.5) */}
        <group position={[243.65, 19.15, -75.75]}>
          <RigidBody type="fixed" colliders="cuboid">
            <mesh>
              <boxGeometry args={[0.08, 1.3, 12.6]} />
              <meshPhysicalMaterial color="#38bdf8" transparent opacity={0.35} transmission={0.85} side={DoubleSide} />
            </mesh>
          </RigidBody>
          <mesh position={[0, 0.65, 0]}>
            <boxGeometry args={[0.16, 0.08, 12.7]} />
            <meshStandardMaterial color="#eab308" metalness={0.8} />
          </mesh>
        </group>

        {/* South Rooftop Stairwell Guardrail (Z = -82.05, X = 239.35 to 243.65) */}
        <group position={[241.5, 19.15, -82.05]}>
          <RigidBody type="fixed" colliders="cuboid">
            <mesh>
              <boxGeometry args={[4.3, 1.3, 0.08]} />
              <meshPhysicalMaterial color="#38bdf8" transparent opacity={0.35} transmission={0.85} side={DoubleSide} />
            </mesh>
          </RigidBody>
          <mesh position={[0, 0.65, 0]}>
            <boxGeometry args={[4.4, 0.08, 0.16]} />
            <meshStandardMaterial color="#eab308" metalness={0.8} />
          </mesh>
        </group>

        {/* Rooftop Walkway Mat connecting Top of Staircase 2 (Z = -69.5) straight into Level Skybridge (Z = -63.5) */}
        <group position={[241.5, 18.5, -66.5]}>
          <mesh position={[0, 0.02, 0]} receiveShadow>
            <boxGeometry args={[3.8, 0.04, 6.2]} />
            <meshStandardMaterial map={gratingMap || undefined} color="#334155" roughness={0.4} metalness={0.7} />
          </mesh>
          {/* High-Visibility Safety Yellow Top Landing Nosing at Z = -69.5 */}
          <mesh position={[0, 0.03, -2.95]}>
            <boxGeometry args={[3.8, 0.04, 0.22]} />
            <meshStandardMaterial color="#eab308" roughness={0.3} metalness={0.4} />
          </mesh>
        </group>
      </group>

      {/* ============================================================== */}
      {/* 4. STAIRCASE 1 (GROUND FLOOR Y = 0.0m ➔ 2ND FLOOR Y = 10.50m)  */}
      {/* Positioned at X = 235.5, Z = -88.0 (bottom) to -75.0 (2nd flr) */}
      {/* ============================================================== */}
      <group position={[stair1X, 0, 0]}>
        <RigidBody type="fixed" colliders={false} friction={1.0} restitution={0}>
          <CuboidCollider
            position={[0, stair1H / 2 - 0.04, stair1CenterZ]}
            rotation={[-stair1Angle, 0, 0]}
            args={[1.55, 0.08, stair1Hypot / 2]}
            friction={1.0}
            restitution={0}
          />
          {/* Smooth Bottom & Top Landing Transition Plates */}
          <CuboidCollider
            position={[0, 0.04, stair1StartZ - 0.35]}
            args={[1.55, 0.04, 0.5]}
            friction={1.0}
          />
          <CuboidCollider
            position={[0, stair1H - 0.05, stair1EndZ + 0.35]}
            args={[1.55, 0.05, 0.55]}
            friction={1.0}
          />
          {/* Left & Right Handrail Colliders */}
          <CuboidCollider
            position={[-1.62, stair1H / 2 + 0.75, stair1CenterZ]}
            rotation={[-stair1Angle, 0, 0]}
            args={[0.08, 0.75, stair1Hypot / 2 - 0.2]}
          />
          <CuboidCollider
            position={[1.62, stair1H / 2 + 0.75, stair1CenterZ]}
            rotation={[-stair1Angle, 0, 0]}
            args={[0.08, 0.75, stair1Hypot / 2 - 0.2]}
          />
        </RigidBody>

        {/* Ground Base Plinth */}
        <mesh position={[0, 0.14, stair1StartZ - 0.35]} receiveShadow castShadow>
          <boxGeometry args={[3.5, 0.28, 1.4]} />
          <meshStandardMaterial color="#334155" metalness={0.7} roughness={0.35} />
        </mesh>

        {/* Steel Stringer Beams */}
        {[-1.48, 0, 1.48].map((sx, si) => (
          <mesh
            key={`stair1-stringer-${si}`}
            position={[sx, stair1H / 2 - 0.16, stair1CenterZ]}
            rotation={[-stair1Angle, 0, 0]}
            castShadow
            receiveShadow
          >
            <boxGeometry args={[0.18, 0.36, stair1Hypot + 0.4]} />
            <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.22} />
          </mesh>
        ))}

        {/* Support Columns under Staircase 1 */}
        {[
          { z: -84.0, h: 3.1 },
          { z: -79.5, h: 6.8 },
          { z: -75.5, h: 10.1 },
        ].map((sup, idx) => (
          <group key={`stair1-sup-${idx}`} position={[0, 0, sup.z]}>
            {[-1.48, 1.48].map((cx, ci) => (
              <mesh key={`stair1-col-${ci}`} position={[cx, sup.h / 2, 0]} castShadow>
                <boxGeometry args={[0.22, sup.h, 0.22]} />
                <meshStandardMaterial color="#1e293b" metalness={0.88} roughness={0.25} />
              </mesh>
            ))}
          </group>
        ))}

        {/* 26 Non-Slip Metallic Treads with Yellow Nosings */}
        {Array.from({ length: stair1Steps }).map((_, stepIdx) => {
          const frac = (stepIdx + 0.5) / stair1Steps;
          const sy = frac * stair1H;
          const sz = stair1StartZ + frac * stair1L;
          return (
            <group key={`stair1-step-${stepIdx}`} position={[0, sy, sz]}>
              <mesh castShadow receiveShadow>
                <boxGeometry args={[2.95, 0.08, 0.46]} />
                <meshStandardMaterial color="#334155" metalness={0.78} roughness={0.28} />
              </mesh>
              <mesh position={[0, 0.045, -0.20]}>
                <boxGeometry args={[2.95, 0.025, 0.05]} />
                <meshStandardMaterial color="#eab308" roughness={0.35} metalness={0.4} />
              </mesh>
            </group>
          );
        })}

        {/* Dual Brushed-Steel Handrails */}
        {[-1.55, 1.55].map((hx, hi) => (
          <group key={`stair1-rail-${hi}`}>
            <mesh
              position={[hx, stair1H / 2 + 0.95, stair1CenterZ]}
              rotation={[-stair1Angle + Math.PI / 2, 0, 0]}
              castShadow
            >
              <cylinderGeometry args={[0.042, 0.042, stair1Hypot + 0.2, 12]} />
              <meshStandardMaterial color="#e2e8f0" metalness={0.95} roughness={0.15} />
            </mesh>
            <mesh
              position={[hx, stair1H / 2 + 0.50, stair1CenterZ]}
              rotation={[-stair1Angle + Math.PI / 2, 0, 0]}
            >
              <cylinderGeometry args={[0.026, 0.026, stair1Hypot + 0.2, 8]} />
              <meshStandardMaterial color="#eab308" metalness={0.75} roughness={0.25} />
            </mesh>
          </group>
        ))}

        {/* Signboard at Base of Staircase 1 */}
        <group position={[0, 2.7, stair1StartZ - 0.5]} rotation={[0, Math.PI, 0]}>
          <mesh>
            <boxGeometry args={[3.5, 0.44, 0.08]} />
            <meshStandardMaterial color="#0f172a" metalness={0.85} />
          </mesh>
          <Text position={[0, 0, 0.06]} fontSize={0.18} color="#38bdf8" fontWeight="bold" anchorX="center">
            1ª ESCADA ➔ 2º PISO TECNOLÓGICO DO LABORATÓRIO (10.5m)
          </Text>
        </group>
      </group>

      {/* ============================================================== */}
      {/* 5. STAIRCASE 2 (IN UPPER LAB SPACE Y = 10.5m ➔ ROOF Y = 18.5m) */}
      {/* Positioned at X = 241.5, Z = -81.5 (2nd floor) to -69.5 (roof) */}
      {/* ============================================================== */}
      <group position={[stair2X, 0, 0]}>
        <RigidBody type="fixed" colliders={false} friction={1.0} restitution={0}>
          <CuboidCollider
            position={[0, stair2CenterY - 0.04, stair2CenterZ]}
            rotation={[-stair2Angle, 0, 0]}
            args={[1.65, 0.08, stair2Hypot / 2]}
            friction={1.0}
            restitution={0}
          />
          {/* Smooth Bottom Landing on 2nd Floor (Z = -81.5, Y = 10.50m) */}
          <CuboidCollider
            position={[0, stair2StartY + 0.02, stair2StartZ - 0.35]}
            args={[1.65, 0.04, 0.5]}
            friction={1.0}
          />
          {/* Smooth Top Rooftop Landing (Z = -69.5, Y = 18.50m) */}
          <CuboidCollider
            position={[0, stair2EndY - 0.04, stair2EndZ + 0.35]}
            args={[1.65, 0.04, 0.55]}
            friction={1.0}
          />
          {/* Left & Right Handrail Colliders */}
          <CuboidCollider
            position={[-1.72, stair2CenterY + 0.75, stair2CenterZ]}
            rotation={[-stair2Angle, 0, 0]}
            args={[0.08, 0.75, stair2Hypot / 2 - 0.2]}
          />
          <CuboidCollider
            position={[1.72, stair2CenterY + 0.75, stair2CenterZ]}
            rotation={[-stair2Angle, 0, 0]}
            args={[0.08, 0.75, stair2Hypot / 2 - 0.2]}
          />
        </RigidBody>

        {/* Heavy Inclined Steel Stringer Beams */}
        {[-1.58, 0, 1.58].map((sx, si) => (
          <mesh
            key={`stair2-stringer-${si}`}
            position={[sx, stair2CenterY - 0.16, stair2CenterZ]}
            rotation={[-stair2Angle, 0, 0]}
            castShadow
            receiveShadow
          >
            <boxGeometry args={[si === 1 ? 0.22 : 0.18, 0.38, stair2Hypot + 0.4]} />
            <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.22} />
          </mesh>
        ))}

        {/* Support Columns from 2nd Floor Deck (Y = 10.5m) up to Staircase 2 */}
        {[
          { z: -78.0, h: 2.3 },
          { z: -74.0, h: 5.0 },
          { z: -70.0, h: 7.6 },
        ].map((sup, idx) => (
          <group key={`stair2-sup-${idx}`} position={[0, stair2StartY, sup.z]}>
            {[-1.58, 1.58].map((cx, ci) => (
              <mesh key={`stair2-col-${ci}`} position={[cx, sup.h / 2, 0]} castShadow>
                <boxGeometry args={[0.22, sup.h, 0.22]} />
                <meshStandardMaterial color="#1e293b" metalness={0.88} roughness={0.25} />
              </mesh>
            ))}
          </group>
        ))}

        {/* 20 Non-Slip Metallic Treads with Yellow Nosings from Y = 10.5m to Y = 18.5m */}
        {Array.from({ length: stair2Steps }).map((_, stepIdx) => {
          const frac = (stepIdx + 0.5) / stair2Steps;
          const sy = stair2StartY + frac * stair2H;
          const sz = stair2StartZ + frac * stair2L;
          return (
            <group key={`stair2-step-${stepIdx}`} position={[0, sy, sz]}>
              <mesh castShadow receiveShadow>
                <boxGeometry args={[3.15, 0.08, 0.52]} />
                <meshStandardMaterial color="#334155" metalness={0.78} roughness={0.28} />
              </mesh>
              <mesh position={[0, 0.045, -0.22]}>
                <boxGeometry args={[3.15, 0.025, 0.05]} />
                <meshStandardMaterial color="#eab308" roughness={0.35} metalness={0.4} />
              </mesh>
            </group>
          );
        })}

        {/* Dual Brushed-Steel Handrails */}
        {[-1.65, 1.65].map((hx, hi) => (
          <group key={`stair2-rail-${hi}`}>
            <mesh
              position={[hx, stair2CenterY + 0.95, stair2CenterZ]}
              rotation={[-stair2Angle + Math.PI / 2, 0, 0]}
              castShadow
            >
              <cylinderGeometry args={[0.045, 0.045, stair2Hypot + 0.2, 12]} />
              <meshStandardMaterial color="#e2e8f0" metalness={0.95} roughness={0.15} />
            </mesh>
            <mesh
              position={[hx, stair2CenterY + 0.50, stair2CenterZ]}
              rotation={[-stair2Angle + Math.PI / 2, 0, 0]}
            >
              <cylinderGeometry args={[0.028, 0.028, stair2Hypot + 0.2, 8]} />
              <meshStandardMaterial color="#eab308" metalness={0.75} roughness={0.25} />
            </mesh>
          </group>
        ))}

        {/* Signboard at Base of Staircase 2 on the 2nd Floor */}
        <group position={[0, stair2StartY + 2.7, stair2StartZ - 0.5]} rotation={[0, Math.PI, 0]}>
          <mesh>
            <boxGeometry args={[3.6, 0.44, 0.08]} />
            <meshStandardMaterial color="#0f172a" metalness={0.85} />
          </mesh>
          <Text position={[0, 0, 0.06]} fontSize={0.18} color="#38bdf8" fontWeight="bold" anchorX="center">
            2ª ESCADA ➔ TETO DO LABORATÓRIO & PONTE ENVIDRAÇADA
          </Text>
        </group>
      </group>
    </group>
  );
}
