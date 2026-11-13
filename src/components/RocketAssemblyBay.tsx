import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group, Mesh, MathUtils, Vector3 } from 'three';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import { Text } from '@react-three/drei';
import {
  AngolaFlagDecal,
  GGPENLogoDecal,
  NasaSpaceAppsLuandaDecal,
  AstronavegaLogoDecal,
  CabecaAbertaLogoDecal,
} from './AngolaFlag';
import { useGameStore } from '../store';

// ---------------------------------------------------------------------------
// ROBOTIC WELDING SPARK PARTICLES
// Emits high-energy orange/electric-blue welding sparks in real time
// ---------------------------------------------------------------------------
function WeldingSparks({ active, position }: { active: boolean; position: [number, number, number] }) {
  const sparksRef = useRef<Group>(null);
  const sparkCount = 14;

  const sparkData = useMemo(() => {
    return Array.from({ length: sparkCount }).map((_, i) => ({
      vel: [
        (Math.random() - 0.5) * 2.2,
        0.5 + Math.random() * 2.0,
        (Math.random() - 0.5) * 2.2,
      ],
      speed: 1.5 + Math.random() * 2.5,
      scale: 0.03 + Math.random() * 0.05,
      phase: (i / sparkCount) * Math.PI * 2,
    }));
  }, []);

  useFrame((state) => {
    if (!sparksRef.current) return;
    if (!useGameStore.getState().isNearVAB) return;
    const t = state.clock.getElapsedTime();

    sparksRef.current.children.forEach((child, i) => {
      const s = sparkData[i];
      if (active) {
        child.visible = true;
        const cycle = (t * s.speed + s.phase) % 1;
        // Parabolic spark gravity arc
        child.position.x = s.vel[0] * cycle;
        child.position.y = s.vel[1] * cycle - 3.5 * cycle * cycle;
        child.position.z = s.vel[2] * cycle;
        const currentScale = s.scale * (1 - cycle * 0.7);
        child.scale.set(currentScale, currentScale, currentScale);
        const mesh = child as any;
        if (mesh.material) {
          mesh.material.opacity = (1 - cycle);
        }
      } else {
        child.visible = false;
      }
    });
  });

  return (
    <group position={position}>
      <group ref={sparksRef}>
        {sparkData.map((_, i) => (
          <mesh key={`spark-${i}`}>
            <sphereGeometry args={[1, 5, 5]} />
            <meshBasicMaterial color={i % 3 === 0 ? '#38bdf8' : i % 3 === 1 ? '#f59e0b' : '#ffffff'} transparent />
          </mesh>
        ))}
      </group>
      {/* High-intensity glowing plasma arc flash at welding nozzle */}
      {active && (
        <mesh position={[0, 0, 0]}>
          <sphereGeometry args={[0.15, 6, 6]} />
          <meshBasicMaterial color="#a5f3fc" />
        </mesh>
      )}
    </group>
  );
}

// ---------------------------------------------------------------------------
// 6-AXIS ARTICULATED INDUSTRIAL WELDING ROBOT ARM
// Dynamically moves, points torch at rocket seams, welds with sparks
// ---------------------------------------------------------------------------
function WeldingRobotArm({
  basePos,
  targetHeight,
  armIndex,
  isWelding,
}: {
  basePos: [number, number, number];
  targetHeight: number;
  armIndex: number;
  isWelding: boolean;
}) {
  const robotBaseRef = useRef<Group>(null);
  const shoulderRef = useRef<Group>(null);
  const elbowRef = useRef<Group>(null);
  const wristRef = useRef<Group>(null);

  useFrame((state) => {
    if (!useGameStore.getState().isNearVAB) return;
    const t = state.clock.getElapsedTime() * 0.8 + armIndex * 1.5;

    // Base rotates along track
    if (robotBaseRef.current) {
      robotBaseRef.current.rotation.y = Math.sin(t * 0.7) * 0.35 + (armIndex * Math.PI) / 2;
    }
    // Shoulder articulates
    if (shoulderRef.current) {
      shoulderRef.current.rotation.z = -0.4 + Math.sin(t * 1.1) * 0.18;
    }
    // Elbow moves to maintain torch contact
    if (elbowRef.current) {
      elbowRef.current.rotation.z = 0.8 + Math.cos(t * 0.9) * 0.22;
    }
    // Wrist torch rotates along weld path
    if (wristRef.current) {
      wristRef.current.rotation.x = Math.sin(t * 2.5) * 0.15;
    }
  });

  return (
    <group position={basePos}>
      {/* Heavy Steel Pedestal Mounting on Floor Track */}
      <mesh position={[0, 0.4, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.6, 0.8, 1.6]} />
        <meshStandardMaterial color="#1e293b" metalness={0.8} />
      </mesh>
      {/* Turntable Base Ring */}
      <mesh position={[0, 0.9, 0]} castShadow>
        <cylinderGeometry args={[0.7, 0.75, 0.3, 20]} />
        <meshStandardMaterial color="#0f172a" metalness={0.9} />
      </mesh>

      {/* Rotating Base */}
      <group ref={robotBaseRef} position={[0, 1.05, 0]}>
        {/* Robot Main Body Casing (Industrial Safety Orange) */}
        <mesh position={[0, 0.6, 0]} castShadow>
          <boxGeometry args={[0.9, 1.2, 0.8]} />
          <meshStandardMaterial color="#ea580c" roughness={0.3} metalness={0.4} />
        </mesh>

        {/* Shoulder Joint Pivot */}
        <group ref={shoulderRef} position={[0, 1.1, 0]}>
          <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[0.32, 0.32, 0.9, 16]} />
            <meshStandardMaterial color="#334155" metalness={0.9} />
          </mesh>

          {/* Lower Arm Bicep */}
          <mesh position={[0, 1.4, 0]} castShadow>
            <boxGeometry args={[0.42, 2.8, 0.42]} />
            <meshStandardMaterial color="#ea580c" roughness={0.3} />
          </mesh>

          {/* Elbow Joint Pivot */}
          <group ref={elbowRef} position={[0, 2.7, 0]}>
            <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
              <cylinderGeometry args={[0.26, 0.26, 0.7, 16]} />
              <meshStandardMaterial color="#334155" metalness={0.9} />
            </mesh>

            {/* Forearm Extension */}
            <mesh position={[0, 1.2, 0]} castShadow>
              <boxGeometry args={[0.34, 2.4, 0.34]} />
              <meshStandardMaterial color="#ea580c" roughness={0.3} />
            </mesh>

            {/* Wrist & Multi-Axis Welding Toolhead */}
            <group ref={wristRef} position={[0, 2.3, 0]}>
              <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
                <cylinderGeometry args={[0.18, 0.18, 0.45, 16]} />
                <meshStandardMaterial color="#0284c7" metalness={0.8} />
              </mesh>
              {/* TIG / Laser Welding Torch Nozzle */}
              <mesh position={[0, 0.35, 0.2]} rotation={[0.6, 0, 0]} castShadow>
                <cylinderGeometry args={[0.04, 0.08, 0.6, 12]} />
                <meshStandardMaterial color="#cbd5e1" metalness={0.95} />
              </mesh>

              {/* Torch Tip with Spark Emitter */}
              <WeldingSparks active={isWelding} position={[0, 0.6, 0.38]} />
            </group>
          </group>
        </group>
      </group>
    </group>
  );
}

// ---------------------------------------------------------------------------
// REAL-TIME SECONDARY ROCKET ASSEMBLY HIGH BAY (BAÍA DE MONTAGEM 02)
// Live assembly sequence: Crane lowers rocket stages, robots weld seams,
// lasers align components, status monitors display real-time telemetry!
// ---------------------------------------------------------------------------
export function RocketAssemblyBay() {
  const craneHoistRef = useRef<Group>(null);
  const stage2LoweringRef = useRef<Group>(null);
  const fairingCraneRef = useRef<Group>(null);
  const laserRingRef = useRef<Group>(null);

  // Time-synchronized real-time assembly cycle (repeats smoothly every 40s)
  useFrame((state) => {
    if (!useGameStore.getState().isNearVAB) return;
    const elapsed = state.clock.getElapsedTime();
    const cycleTime = (elapsed % 40) / 40; // 0 to 1

    // 1. Lowering Stage 2 into alignment atop Stage 1
    if (stage2LoweringRef.current) {
      // Moves smoothly downwards between cycle 0.1 and 0.5, then holds for welding
      let stageY = 56;
      if (cycleTime < 0.35) {
        // Lowering down by crane
        const p = cycleTime / 0.35;
        stageY = MathUtils.lerp(72, 46, p);
      } else {
        // In place being welded and locked
        stageY = 46 + Math.sin(elapsed * 2) * 0.02;
      }
      stage2LoweringRef.current.position.y = stageY;
    }

    // 2. Crane hoist cable extension
    if (craneHoistRef.current) {
      craneHoistRef.current.position.x = Math.sin(elapsed * 0.3) * 2;
    }

    // 3. Rotating Laser Alignment Guidance Rings
    if (laserRingRef.current) {
      laserRingRef.current.rotation.y = elapsed * 1.5;
    }
  });

  return (
    <group position={[-6, 0, 22]}>
      {/* ============================================================== */}
      {/* 1. VERTICAL INTEGRATION RIG & HYDRAULIC CLAMPING BERTH         */}
      {/* ============================================================== */}
      {/* Heavy Hexagonal Steel Assembly Jig Pedestal */}
      <RigidBody type="fixed" colliders="cuboid" position={[0, 2, 0]}>
        <mesh receiveShadow castShadow>
          <cylinderGeometry args={[8.5, 9.2, 4, 8]} />
          <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.3} />
        </mesh>
      </RigidBody>

      {/* Heavy Pneumatic Centering Clamps (4 corners) */}
      {[0, Math.PI / 2, Math.PI, Math.PI * 1.5].map((angle, i) => (
        <group key={`clamp-berth-${i}`} position={[0, 4.2, 0]} rotation={[0, angle, 0]}>
          <mesh position={[6.2, 0.8, 0]} castShadow>
            <boxGeometry args={[2.2, 1.8, 1.4]} />
            <meshStandardMaterial color="#eab308" metalness={0.6} />
          </mesh>
          <mesh position={[4.8, 0.8, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.3, 0.3, 1.4, 16]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.9} />
          </mesh>
        </group>
      ))}

      {/* ============================================================== */}
      {/* 2. STAGE 1 CORE TANK (Permanently Mounted on Jig)               */}
      {/* ============================================================== */}
      <group position={[0, 4, 0]}>
        {/* Core Booster Rocket Tube */}
        <mesh position={[0, 16, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[4.4, 4.4, 30, 32]} />
          <meshStandardMaterial color="#f8fafc" metalness={0.4} roughness={0.3} />
        </mesh>

        {/* Official Insignias on Core Tank (GGPEN & Bandeira de Angola) */}
        <GGPENLogoDecal position={[0, 18, 4.45]} scale={[5.5, 5.5, 1]} />
        <AngolaFlagDecal position={[0, 8, 4.45]} scale={[5.4, 3.6, 1]} />

        {/* Engine Bell Cluster inside Base Mount */}
        {[-1.6, 1.6].map((ex, xi) =>
          [-1.6, 1.6].map((ez, zi) => (
            <mesh key={`nozzle-${xi}-${zi}`} position={[ex, 1.2, ez]} castShadow>
              <cylinderGeometry args={[0.6, 1.3, 2.4, 20]} />
              <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.2} />
            </mesh>
          ))
        )}

        {/* Stage 1 Top Interstage Flange Ring */}
        <mesh position={[0, 31, 0]} castShadow>
          <cylinderGeometry args={[4.42, 4.42, 1.2, 32]} />
          <meshStandardMaterial color="#334155" metalness={0.9} />
        </mesh>
      </group>

      {/* ============================================================== */}
      {/* 3. STAGE 2 CORE (BEING LOWERED & ASSEMBLED IN REAL TIME!)      */}
      {/* Suspended from heavy gantry cables, lowering into docking port  */}
      {/* ============================================================== */}
      <group ref={stage2LoweringRef} position={[0, 46, 0]}>
        {/* Stage 2 Fuel Tank Body */}
        <mesh position={[0, 8, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[4.2, 4.2, 18, 32]} />
          <meshStandardMaterial color="#f1f5f9" metalness={0.35} roughness={0.3} />
        </mesh>
        <AstronavegaLogoDecal position={[0, 11, 4.25]} scale={[5.0, 5.0, 1]} />
        <CabecaAbertaLogoDecal position={[0, 5, 4.25]} scale={[4.8, 4.8, 1]} />

        {/* Stage 2 Vacuum Engine Nozzle extending below */}
        <mesh position={[0, -2, 0]} castShadow>
          <cylinderGeometry args={[0.8, 2.2, 3.6, 24]} />
          <meshStandardMaterial color="#1e293b" metalness={0.95} roughness={0.15} />
        </mesh>

        {/* Heavy Rigging Collar & Lifting Spreader Bar */}
        <mesh position={[0, 17.5, 0]}>
          <cylinderGeometry args={[4.3, 4.3, 0.8, 32]} />
          <meshStandardMaterial color="#eab308" metalness={0.8} />
        </mesh>

        {/* 4 Steel Hoist Suspension Cables extending upwards to the Crane */}
        {[-3, 3].map((cx, xi) =>
          [-3, 3].map((cz, zi) => (
            <mesh key={`hoist-cable-${xi}-${zi}`} position={[cx, 32, cz]}>
              <cylinderGeometry args={[0.035, 0.035, 30, 8]} />
              <meshStandardMaterial color="#cbd5e1" metalness={0.9} />
            </mesh>
          ))
        )}

        {/* Glowing Orange Hot Weld Seam Line where Stage 1 and Stage 2 meet */}
        <mesh position={[0, -0.2, 0]}>
          <torusGeometry args={[4.38, 0.08, 16, 32]} />
          <meshBasicMaterial color="#f97316" />
        </mesh>
        <pointLight position={[0, 0, 0]} color="#f97316" intensity={4} distance={14} />
      </group>

      {/* ============================================================== */}
      {/* 4. ACTIVE ROBOTIC WELDING SYSTEM (4 ROBOTS IN REAL TIME)       */}
      {/* ============================================================== */}
      <WeldingRobotArm basePos={[-7, 18, -3]} targetHeight={36} armIndex={0} isWelding={true} />
      <WeldingRobotArm basePos={[7, 18, -3]} targetHeight={36} armIndex={1} isWelding={true} />
      <WeldingRobotArm basePos={[-7, 18, 5]} targetHeight={36} armIndex={2} isWelding={true} />
      <WeldingRobotArm basePos={[7, 18, 5]} targetHeight={36} armIndex={3} isWelding={true} />

      {/* Elevated Annular Work Floor with Center Aperture for Rocket Core */}
      <RigidBody type="fixed" colliders={false}>
        {/* North Platform Section */}
        <CuboidCollider args={[9.0, 0.2, 2.5]} position={[0, 18, 6.5]} />
        <mesh position={[0, 18, 6.5]} receiveShadow>
          <boxGeometry args={[18, 0.4, 5]} />
          <meshStandardMaterial color="#334155" metalness={0.7} roughness={0.4} />
        </mesh>
        {/* South Platform Section */}
        <CuboidCollider args={[9.0, 0.2, 2.5]} position={[0, 18, -6.5]} />
        <mesh position={[0, 18, -6.5]} receiveShadow>
          <boxGeometry args={[18, 0.4, 5]} />
          <meshStandardMaterial color="#334155" metalness={0.7} roughness={0.4} />
        </mesh>
        {/* East Platform Section */}
        <CuboidCollider args={[2.5, 0.2, 4.0]} position={[6.5, 18, 0]} />
        <mesh position={[6.5, 18, 0]} receiveShadow>
          <boxGeometry args={[5, 0.4, 8]} />
          <meshStandardMaterial color="#334155" metalness={0.7} roughness={0.4} />
        </mesh>
        {/* West Platform Section */}
        <CuboidCollider args={[2.5, 0.2, 4.0]} position={[-6.5, 18, 0]} />
        <mesh position={[-6.5, 18, 0]} receiveShadow>
          <boxGeometry args={[5, 0.4, 8]} />
          <meshStandardMaterial color="#334155" metalness={0.7} roughness={0.4} />
        </mesh>
      </RigidBody>
      {/* Center cutout for rocket body */}
      {[-8.5, 8.5].map((rx, ri) => (
        <mesh key={`rail-robot-${ri}`} position={[rx, 18.6, 0]}>
          <boxGeometry args={[0.1, 1.0, 18]} />
          <meshStandardMaterial color="#eab308" metalness={0.6} />
        </mesh>
      ))}

      {/* ============================================================== */}
      {/* 5. PRECISION LASER ALIGNMENT SYSTEM (Projected from Ceiling)   */}
      {/* ============================================================== */}
      <group position={[0, 85, 0]}>
        {/* Laser Projector Unit */}
        <mesh position={[0, 0, 0]} castShadow>
          <cylinderGeometry args={[2.5, 3.0, 2, 16]} />
          <meshStandardMaterial color="#0f172a" metalness={0.9} />
        </mesh>

        {/* 4 Vertical Precision Alignment Laser Beams */}
        {[-3.8, 3.8].map((lx, li) => (
          <mesh key={`laser-beam-${li}`} position={[lx, -42, 0]}>
            <cylinderGeometry args={[0.02, 0.02, 85, 8]} />
            <meshBasicMaterial color="#10b981" transparent opacity={0.6} />
          </mesh>
        ))}

        {/* Rotating Circular Calibration Target Ring */}
        <group ref={laserRingRef} position={[0, -2, 0]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <ringGeometry args={[4.2, 4.3, 32]} />
            <meshBasicMaterial color="#34d399" />
          </mesh>
        </group>
      </group>

      {/* ============================================================== */}
      {/* 6. REAL-TIME DIGITAL TELEMETRY & ASSEMBLY HUD BOARDS           */}
      {/* ============================================================== */}
      <group position={[0, 22, -8.8]} rotation={[0, 0, 0]}>
        {/* Console Frame */}
        <mesh position={[0, 0, 0]} castShadow>
          <boxGeometry args={[8.5, 3.4, 0.4]} />
          <meshStandardMaterial color="#0f172a" metalness={0.9} />
        </mesh>
        {/* Main Display Screen */}
        <mesh position={[0, 0, 0.22]}>
          <planeGeometry args={[8.2, 3.1]} />
          <meshBasicMaterial color="#020617" />
        </mesh>

        {/* Telemetry Text */}
        <Text
          position={[0, 1.1, 0.24]}
          fontSize={0.28}
          color="#38bdf8"
          fontWeight="bold"
          anchorX="center"
        >
          MONTAGEM EM TEMPO REAL • FOGUETE NGOLA-II
        </Text>
        <Text
          position={[-3.8, 0.55, 0.24]}
          fontSize={0.20}
          color="#34d399"
          anchorX="left"
        >
          [ESTÁGIO 1]: MOTOR & TANQUES FIXADOS (NOMINAL)
        </Text>
        <Text
          position={[-3.8, 0.15, 0.24]}
          fontSize={0.20}
          color="#fbbf24"
          anchorX="left"
        >
          [ESTÁGIO 2]: ACOPLAMENTO EM CURSO VIA GUINDASTE
        </Text>
        <Text
          position={[-3.8, -0.25, 0.24]}
          fontSize={0.20}
          color="#60a5fa"
          anchorX="left"
        >
          [SOLDAGEM TIG]: 4 BRAÇOS ROBÓTICOS SINCRONIZADOS
        </Text>
        <Text
          position={[-3.8, -0.65, 0.24]}
          fontSize={0.20}
          color="#a78bfa"
          anchorX="left"
        >
          [ALINHAMENTO LASER]: TOLERÂNCIA 0.02mm • GGPEN VAB
        </Text>

        {/* Status Warning Lamp */}
        <mesh position={[3.6, 1.1, 0.24]}>
          <circleGeometry args={[0.16, 16]} />
          <meshBasicMaterial color="#22c55e" />
        </mesh>
      </group>
    </group>
  );
}
