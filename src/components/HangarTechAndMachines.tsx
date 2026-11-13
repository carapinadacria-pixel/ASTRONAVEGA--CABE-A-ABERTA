import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group, MathUtils } from 'three';
import { Text } from '@react-three/drei';
import { RigidBody } from '@react-three/rapier';
import { useGameStore } from '../store';

// ---------------------------------------------------------------------------
// 1. AUTONOMOUS GUIDED VEHICLE (AGV) HEAVY INDUSTRIAL TRANSPORTER
// Autonomous mobile robot carrying rocket components along safety tracks
// ---------------------------------------------------------------------------
function AutonomousGuidedVehicle({
  startPos,
  trackLength,
}: {
  startPos: [number, number, number];
  trackLength: number;
}) {
  const agvRef = useRef<Group>(null);
  const beaconRef = useRef<Group>(null);

  useFrame((state) => {
    if (!useGameStore.getState().isNearVAB) return;
    const t = state.clock.getElapsedTime();
    if (agvRef.current) {
      // Smooth sinusoidal back-and-forth movement along X axis
      const offset = (Math.sin(t * 0.25) * 0.5 + 0.5) * trackLength;
      agvRef.current.position.x = startPos[0] + offset;
    }
    if (beaconRef.current) {
      // Rotating warning beacon
      beaconRef.current.rotation.y = t * 6.0;
    }
  });

  return (
    <group>
      {/* Yellow Striped Floor Hazard Path */}
      <mesh
        position={[startPos[0] + trackLength / 2, 0.015, startPos[2]]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[trackLength + 4, 3.2]} />
        <meshStandardMaterial color="#1e293b" roughness={0.9} />
      </mesh>
      {/* Yellow Safety Boundary Lines */}
      {[-1.5, 1.5].map((offZ, idx) => (
        <mesh
          key={`agv-line-${idx}`}
          position={[startPos[0] + trackLength / 2, 0.02, startPos[2] + offZ]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <planeGeometry args={[trackLength + 4, 0.12]} />
          <meshStandardMaterial color="#eab308" />
        </mesh>
      ))}

      {/* Moving AGV Unit */}
      <group ref={agvRef} position={startPos}>
        {/* Chassis */}
        <RigidBody type="fixed" colliders="cuboid">
          <mesh position={[0, 0.45, 0]} castShadow receiveShadow>
            <boxGeometry args={[4.2, 0.7, 2.4]} />
            <meshStandardMaterial color="#334155" metalness={0.7} roughness={0.3} />
          </mesh>
        </RigidBody>

        {/* Hazard Stripes along sides */}
        {[-1.21, 1.21].map((sideZ, sIdx) => (
          <mesh key={`agv-stripes-${sIdx}`} position={[0, 0.45, sideZ]}>
            <boxGeometry args={[4.0, 0.2, 0.02]} />
            <meshStandardMaterial color="#eab308" />
          </mesh>
        ))}

        {/* Heavy Mechanum Wheels (4 wheels) */}
        {[
          [-1.6, 0.28, -1.25],
          [1.6, 0.28, -1.25],
          [-1.6, 0.28, 1.25],
          [1.6, 0.28, 1.25],
        ].map((wPos, wIdx) => (
          <mesh key={`wheel-${wIdx}`} position={wPos as [number, number, number]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.28, 0.28, 0.25, 16]} />
            <meshStandardMaterial color="#0f172a" roughness={0.8} />
          </mesh>
        ))}

        {/* Transport Cradle carrying a Rocket Engine Turbopump Module */}
        <group position={[0, 0.85, 0]}>
          <mesh castShadow position={[0, 0.35, 0]}>
            <cylinderGeometry args={[0.75, 0.95, 1.2, 20]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.92} roughness={0.15} />
          </mesh>
          {/* Manifold Pipes on Turbopump */}
          <mesh position={[0.6, 0.4, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.18, 0.18, 0.6, 12]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.85} />
          </mesh>
        </group>

        {/* Rotating Amber Warning Beacon on AGV corner */}
        <group ref={beaconRef} position={[1.8, 1.0, 1.0]}>
          <mesh>
            <cylinderGeometry args={[0.08, 0.08, 0.16, 10]} />
            <meshStandardMaterial color="#f59e0b" transparent opacity={0.85} roughness={0.1} />
          </mesh>
          <pointLight color="#f59e0b" distance={6} intensity={2.5} />
        </group>

        {/* Front LiDAR Laser Scanner */}
        <mesh position={[2.12, 0.35, 0]}>
          <boxGeometry args={[0.08, 0.12, 0.22]} />
          <meshBasicMaterial color="#0284c7" />
        </mesh>
      </group>
    </group>
  );
}

// ---------------------------------------------------------------------------
// 2. CRYOGENIC PROPELLANT TRANSFER MANIFOLD (LOX & LH2 SKID)
// Heavy insulated cryogenic lines with pressure gauges and digital readouts
// ---------------------------------------------------------------------------
function CryogenicPropellantManifold({ position }: { position: [number, number, number] }) {
  const pressureValRef = useRef<Group>(null);

  useFrame((state) => {
    if (!useGameStore.getState().isNearVAB) return;
    if (pressureValRef.current) {
      // Subtle pulse to simulate active cryogenic pumping pressure
      const t = state.clock.getElapsedTime();
      pressureValRef.current.position.y = 0.005 * Math.sin(t * 3.0);
    }
  });

  return (
    <group position={position}>
      {/* Skid Base Pedestal */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh position={[0, 0.2, 0]} receiveShadow castShadow>
          <boxGeometry args={[5.8, 0.4, 2.8]} />
          <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.3} />
        </mesh>
      </RigidBody>

      {/* Main Liquid Oxygen (LOX) Vacuum-Jacketed Stainless Pipe */}
      <mesh position={[0, 1.4, -0.6]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.32, 0.32, 5.6, 20]} />
        <meshStandardMaterial color="#e2e8f0" metalness={0.95} roughness={0.12} />
      </mesh>
      {/* Pipe Flange Joints */}
      {[-2.0, 0, 2.0].map((fx, fi) => (
        <mesh key={`flange-lox-${fi}`} position={[fx, 1.4, -0.6]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.42, 0.42, 0.12, 20]} />
          <meshStandardMaterial color="#0284c7" metalness={0.8} />
        </mesh>
      ))}

      {/* Secondary Fuel Line (RP-1 / Kerosene) */}
      <mesh position={[0, 1.0, 0.6]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.26, 0.26, 5.6, 20]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.2} />
      </mesh>
      {[-1.8, 0.2, 1.8].map((fx, fi) => (
        <mesh key={`flange-rp-${fi}`} position={[fx, 1.0, 0.6]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.35, 0.35, 0.1, 20]} />
          <meshStandardMaterial color="#d97706" metalness={0.8} />
        </mesh>
      ))}

      {/* Manual High-Pressure Actuator Wheels (Brass/Orange) */}
      {[
        [-1.0, 1.85, -0.6],
        [1.2, 1.85, -0.6],
      ].map((vPos, vi) => (
        <group key={`valve-${vi}`} position={vPos as [number, number, number]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.22, 0.03, 8, 20]} />
            <meshStandardMaterial color="#ea580c" roughness={0.3} />
          </mesh>
          <mesh position={[0, -0.2, 0]}>
            <cylinderGeometry args={[0.03, 0.03, 0.4, 8]} />
            <meshStandardMaterial color="#64748b" metalness={0.9} />
          </mesh>
        </group>
      ))}

      {/* Digital Cryogenic Telemetry Terminal Cabinet */}
      <group ref={pressureValRef} position={[0, 1.6, 1.1]}>
        <mesh castShadow>
          <boxGeometry args={[1.4, 0.9, 0.35]} />
          <meshStandardMaterial color="#0f172a" metalness={0.8} />
        </mesh>
        {/* Glowing Telemetry Screen */}
        <mesh position={[0, 0.05, 0.18]}>
          <planeGeometry args={[1.2, 0.65]} />
          <meshBasicMaterial color="#0284c7" />
        </mesh>
        <Text
          position={[0, 0.18, 0.19]}
          fontSize={0.11}
          color="#ffffff"
          fontWeight="bold"
          anchorX="center"
        >
          CRIOGENIA • LOX / RP-1
        </Text>
        <Text
          position={[0, 0.02, 0.19]}
          fontSize={0.13}
          color="#38bdf8"
          anchorX="center"
        >
          PRESSÃO: 345.8 kPa
        </Text>
        <Text
          position={[0, -0.15, 0.19]}
          fontSize={0.09}
          color="#4ade80"
          anchorX="center"
        >
          ESTADO: OPERACIONAL NOMINAL
        </Text>
      </group>
    </group>
  );
}

// ---------------------------------------------------------------------------
// 3. 3D HOLOGRAPHIC DIAGNOSTIC ROCKET TERMINAL
// Circular floor emitter projecting rotating holographic wireframe
// ---------------------------------------------------------------------------
function HolographicDiagnosticStation({ position }: { position: [number, number, number] }) {
  const holoGroupRef = useRef<Group>(null);
  const ringRef = useRef<Group>(null);

  useFrame((state) => {
    if (!useGameStore.getState().isNearVAB) return;
    const t = state.clock.getElapsedTime();
    if (holoGroupRef.current) {
      holoGroupRef.current.rotation.y = t * 0.8;
      // Slight vertical floating hover
      holoGroupRef.current.position.y = 1.6 + Math.sin(t * 1.5) * 0.06;
    }
    if (ringRef.current) {
      ringRef.current.rotation.z = -t * 1.2;
    }
  });

  return (
    <group position={position}>
      {/* Floor Projector Pedestal */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh position={[0, 0.15, 0]} receiveShadow castShadow>
          <cylinderGeometry args={[1.4, 1.6, 0.3, 24]} />
          <meshStandardMaterial color="#1e293b" metalness={0.85} roughness={0.2} />
        </mesh>
      </RigidBody>

      {/* Blue LED Projector Rim Ring */}
      <mesh position={[0, 0.31, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.1, 1.35, 32]} />
        <meshBasicMaterial color="#38bdf8" />
      </mesh>

      {/* Hologram Light Cone */}
      <mesh position={[0, 1.2, 0]} rotation={[0, 0, 0]}>
        <cylinderGeometry args={[1.2, 0.4, 1.8, 16, 1, true]} />
        <meshBasicMaterial color="#0284c7" transparent opacity={0.12} />
      </mesh>

      {/* Floating 3D Holographic Model (Rocket Engine Chamber & Guidance Vector) */}
      <group ref={holoGroupRef} position={[0, 1.6, 0]}>
        {/* Wireframe Rocket Engine Bell */}
        <mesh>
          <coneGeometry args={[0.65, 1.1, 16, 8, true]} />
          <meshBasicMaterial color="#38bdf8" wireframe />
        </mesh>
        {/* Combustion Chamber Core */}
        <mesh position={[0, 0.7, 0]}>
          <cylinderGeometry args={[0.35, 0.35, 0.5, 12, 4, true]} />
          <meshBasicMaterial color="#a5f3fc" wireframe />
        </mesh>
        {/* Injector Head */}
        <mesh position={[0, 1.0, 0]}>
          <sphereGeometry args={[0.3, 10, 10]} />
          <meshBasicMaterial color="#67e8f9" wireframe />
        </mesh>

        {/* Rotating Telemetry Ring */}
        <group ref={ringRef} position={[0, 0.3, 0]} rotation={[Math.PI / 4, 0, 0]}>
          <mesh>
            <torusGeometry args={[0.85, 0.015, 6, 24]} />
            <meshBasicMaterial color="#38bdf8" transparent opacity={0.7} />
          </mesh>
        </group>
      </group>

      <Text
        position={[0, 0.5, 1.5]}
        fontSize={0.14}
        color="#38bdf8"
        fontWeight="bold"
        anchorX="center"
      >
        DIAGNÓSTICO HOLOGRÁFICO • MOTOR FASE 2
      </Text>
    </group>
  );
}

// ---------------------------------------------------------------------------
// 4. SERVER RACKS & HIGH-DENSITY MISSION TELEMETRY COMPUTING BANKS
// Glowing LED data activity lights, cooling fans, heavy data conduits
// ---------------------------------------------------------------------------
function MissionServerRackCluster({ position }: { position: [number, number, number] }) {
  const blinkLedsRef = useRef<Group>(null);

  useFrame((state) => {
    if (!useGameStore.getState().isNearVAB) return;
    if (blinkLedsRef.current) {
      const t = state.clock.getElapsedTime();
      blinkLedsRef.current.children.forEach((led, i) => {
        const mat = (led as any).material;
        if (mat) {
          mat.opacity = Math.sin(t * 8.0 + i * 2.3) > 0.1 ? 0.95 : 0.2;
        }
      });
    }
  });

  return (
    <group
      position={position}
      onClick={(e) => {
        e.stopPropagation();
        if (!useGameStore.getState().isNearComputer) return;
        useGameStore.getState().setComputerLibraryOpen(true);
      }}
    >
      <RigidBody type="fixed" colliders="cuboid">
        <mesh position={[0, 1.6, 0]} castShadow receiveShadow>
          <boxGeometry args={[4.8, 3.2, 1.2]} />
          <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.25} />
        </mesh>
      </RigidBody>

      {/* 4 Rack Enclosures */}
      {[-1.8, -0.6, 0.6, 1.8].map((rx, ri) => (
        <group key={`rack-${ri}`} position={[rx, 1.6, 0.61]}>
          {/* Glass / Perforated Front Door */}
          <mesh position={[0, 0, 0]}>
            <planeGeometry args={[1.0, 2.9]} />
            <meshStandardMaterial color="#1e293b" metalness={0.95} roughness={0.1} />
          </mesh>

          {/* Blade Server Chassis Horizontal Slots */}
          {Array.from({ length: 8 }).map((_, slotIdx) => (
            <mesh key={`slot-${slotIdx}`} position={[0, -1.2 + slotIdx * 0.35, 0.01]}>
              <planeGeometry args={[0.92, 0.28]} />
              <meshStandardMaterial color="#090d16" metalness={0.8} />
            </mesh>
          ))}
        </group>
      ))}

      {/* Animated Blinking Activity LEDs */}
      <group ref={blinkLedsRef} position={[0, 1.6, 0.63]}>
        {Array.from({ length: 24 }).map((_, ledIdx) => {
          const rackCol = Math.floor(ledIdx / 6);
          const row = ledIdx % 6;
          const lx = -1.8 + rackCol * 1.2 + 0.35;
          const ly = -1.0 + row * 0.4;
          return (
            <mesh key={`led-${ledIdx}`} position={[lx, ly, 0]}>
              <circleGeometry args={[0.015, 8]} />
              <meshBasicMaterial
                color={ledIdx % 3 === 0 ? '#22c55e' : ledIdx % 3 === 1 ? '#38bdf8' : '#eab308'}
                transparent
              />
            </mesh>
          );
        })}
      </group>

      {/* Overhead Cable Trunks */}
      <mesh position={[0, 3.25, 0]}>
        <boxGeometry args={[4.8, 0.15, 0.8]} />
        <meshStandardMaterial color="#334155" metalness={0.8} />
      </mesh>
      <Text position={[0, 3.65, 0.65]} fontSize={0.22} color="#10b981" fontWeight="bold" anchorX="center">
        SUPERCOMPUTADOR DO HANGAR • BIBLIOTECA DE LIVROS [CLIQUE / C]
      </Text>
    </group>
  );
}

// ---------------------------------------------------------------------------
// 5. MOBILE AEROSPACE DIAGNOSTIC CART & WORKBENCH
// Dual monitors, oscilloscope, keyboard, tool chest on castor wheels
// ---------------------------------------------------------------------------
function MobileDiagnosticCart({
  position,
  rotationY = 0,
}: {
  position: [number, number, number];
  rotationY?: number;
}) {
  return (
    <group
      position={position}
      rotation={[0, rotationY, 0]}
      onClick={(e) => {
        e.stopPropagation();
        if (!useGameStore.getState().isNearComputer) return;
        useGameStore.getState().setComputerLibraryOpen(true);
      }}
    >
      <RigidBody type="fixed" colliders="cuboid">
        {/* Ruggedized Tool Chest Cabinet */}
        <mesh position={[0, 0.55, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.5, 1.1, 0.85]} />
          <meshStandardMaterial color="#0284c7" metalness={0.7} roughness={0.3} />
        </mesh>
      </RigidBody>

      {/* Black Rubber Mat Tabletop */}
      <mesh position={[0, 1.12, 0]} receiveShadow>
        <boxGeometry args={[1.55, 0.04, 0.9]} />
        <meshStandardMaterial color="#0f172a" roughness={0.9} />
      </mesh>

      {/* Dual Curved Telemetry Monitors */}
      {[-0.38, 0.38].map((mx, mi) => (
        <group key={`screen-${mi}`} position={[mx, 1.5, -0.1]} rotation={[0, mi === 0 ? 0.15 : -0.15, 0]}>
          {/* Bezel */}
          <mesh castShadow>
            <boxGeometry args={[0.65, 0.42, 0.04]} />
            <meshStandardMaterial color="#1e293b" metalness={0.8} />
          </mesh>
          {/* Active Telemetry Display */}
          <mesh position={[0, 0, 0.022]}>
            <planeGeometry args={[0.61, 0.38]} />
            <meshBasicMaterial color={mi === 0 ? '#0284c7' : '#047857'} />
          </mesh>
          {/* Monitor Stand */}
          <mesh position={[0, -0.28, 0]}>
            <cylinderGeometry args={[0.02, 0.02, 0.22, 8]} />
            <meshStandardMaterial color="#475569" />
          </mesh>
        </group>
      ))}

      {/* Oscilloscope Test Rig */}
      <mesh position={[0, 1.25, 0.22]} castShadow>
        <boxGeometry args={[0.45, 0.22, 0.3]} />
        <meshStandardMaterial color="#334155" metalness={0.8} />
      </mesh>
      <mesh position={[0, 1.27, 0.38]}>
        <planeGeometry args={[0.22, 0.14]} />
        <meshBasicMaterial color="#22c55e" />
      </mesh>

      {/* Castor Wheels (4) */}
      {[
        [-0.65, 0.07, -0.35],
        [0.65, 0.07, -0.35],
        [-0.65, 0.07, 0.35],
        [0.65, 0.07, 0.35],
      ].map((wPos, wi) => (
        <mesh key={`castor-${wi}`} position={wPos as [number, number, number]}>
          <sphereGeometry args={[0.07, 8, 8]} />
          <meshStandardMaterial color="#0f172a" />
        </mesh>
      ))}
      <Text position={[0, 1.92, 0]} fontSize={0.14} color="#38bdf8" fontWeight="bold" anchorX="center">
        COMPUTADOR DE INVESTIGAÇÃO [CLIQUE / C]
      </Text>
    </group>
  );
}

// ---------------------------------------------------------------------------
// COMPLETE HANGAR HIGH-TECH MACHINERY & EQUIPMENT
// ---------------------------------------------------------------------------
export function HangarTechAndMachines() {
  return (
    <group name="hangar-advanced-machinery">
      {/* 1. AGV Transport Unit traveling between entrance and assembly bay */}
      <AutonomousGuidedVehicle startPos={[238, 0, -4]} trackLength={16} />

      {/* 2. High-Pressure Cryogenic Propellant Transfer Manifold Skid */}
      <CryogenicPropellantManifold position={[248.5, 0, 11.5]} />

      {/* 3. 3D Holographic Diagnostic Rocket Guidance Projector */}
      <HolographicDiagnosticStation position={[245.0, 0, 20.0]} />

      {/* 4. High-Density Mission Server Rack Cluster against North Wall */}
      <MissionServerRackCluster position={[254.0, 0, -18.0]} />

      {/* 5. Mobile Diagnostic Test Carts stationed at work bays */}
      <MobileDiagnosticCart position={[243.0, 0, 3.5]} rotationY={0} />
      <MobileDiagnosticCart position={[261.5, 0, 16.5]} rotationY={-Math.PI / 2} />
    </group>
  );
}
