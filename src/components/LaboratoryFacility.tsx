import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group, DoubleSide, MathUtils, Mesh } from 'three';
import { RigidBody, CuboidCollider, RapierRigidBody } from '@react-three/rapier';
import { Text } from '@react-three/drei';
import { GGPENLogoDecal, NasaSpaceAppsLuandaDecal } from './AngolaFlag';
import { useGameStore } from '../store';
import { playDoorOpenSound, playDoorCloseSound } from '../audio';

// ---------------------------------------------------------------------------
// ADVANCED AEROSPACE & ASTROBIOLOGY LABORATORY (GGPEN)
// - Main Entrance on the WEST Facade (Local X = -28.5, World X = 201.5) facing
//   the West Arterial Road that links the Crawlerway (pista) to the Parking Lot.
// - Automatic Sensor-Activated Sliding Glass Doors at both the West Main
//   Entrance and North Side Entrance, with real-time physical colliders.
// - Solid Physics Colliders on all Laboratory walls, pillars, mullions & racks.
// - Two-Story Interior with Expanded 2nd Floor Upper Tech Deck (Y = 10.50m).
// ---------------------------------------------------------------------------
export function LaboratoryFacility() {
  const centrifugeRef = useRef<Group>(null);
  const specimenHoloRef = useRef<Group>(null);
  const orbitalGlobeRef = useRef<Group>(null);
  const plasmaRingRef = useRef<Group>(null);

  // West Main Entrance Automatic Sliding Glass Door Refs
  const westDoorLeftMeshRef = useRef<Group>(null);
  const westDoorRightMeshRef = useRef<Group>(null);
  const westDoorLeftRbRef = useRef<RapierRigidBody>(null);
  const westDoorRightRbRef = useRef<RapierRigidBody>(null);
  const westSensorLedRef = useRef<Mesh>(null);
  const westDoorOpenProgress = useRef<number>(0);
  const prevWestDoorOpen = useRef<boolean>(false);

  // North Side Entrance Automatic Sliding Glass Door Refs
  const northDoorLeftMeshRef = useRef<Group>(null);
  const northDoorRightMeshRef = useRef<Group>(null);
  const northDoorLeftRbRef = useRef<RapierRigidBody>(null);
  const northDoorRightRbRef = useRef<RapierRigidBody>(null);
  const northSensorLedRef = useRef<Mesh>(null);
  const northDoorOpenProgress = useRef<number>(0);
  const prevNorthDoorOpen = useRef<boolean>(false);

  useFrame((state, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05);
    const store = useGameStore.getState();
    const playerPos = store.playerPosition;
    const isDriving = Boolean(store.drivingCarId);

    // 1. WEST MAIN ENTRANCE AUTOMATIC SENSOR DOORS (World X = 201.5, Z = -78)
    const distWestDoor = Math.hypot(playerPos[0] - 201.5, playerPos[2] - (-78));
    // Open automatically when astronaut approaches on foot within 9.5m (keep closed if driving a car so cars don't enter lab)
    const shouldOpenWest = !isDriving && distWestDoor < 9.5 && playerPos[1] < 6.0;
    if (shouldOpenWest !== prevWestDoorOpen.current) {
      prevWestDoorOpen.current = shouldOpenWest;
      if (shouldOpenWest) playDoorOpenSound();
      else playDoorCloseSound();
    }
    westDoorOpenProgress.current = MathUtils.damp(
      westDoorOpenProgress.current,
      shouldOpenWest ? 1.0 : 0.0,
      6.5,
      delta
    );
    const westSlide = westDoorOpenProgress.current * 2.85;
    if (westDoorLeftMeshRef.current && westDoorRightMeshRef.current) {
      westDoorLeftMeshRef.current.position.x = -1.55 - westSlide;
      westDoorRightMeshRef.current.position.x = 1.55 + westSlide;
    }
    // Sync physical kinematic colliders with West sliding glass doors (Local X = -28.5 -> World X = 201.5, Z = -78 ± offset)
    if (westDoorLeftRbRef.current && westDoorRightRbRef.current) {
      westDoorLeftRbRef.current.setNextKinematicTranslation({
        x: 201.5,
        y: 2.25,
        z: -78 - (1.55 + westSlide),
      });
      westDoorRightRbRef.current.setNextKinematicTranslation({
        x: 201.5,
        y: 2.25,
        z: -78 + (1.55 + westSlide),
      });
    }
    if (westSensorLedRef.current) {
      (westSensorLedRef.current.material as any)?.color?.set(shouldOpenWest ? '#22c55e' : '#38bdf8');
    }

    // 2. NORTH SIDE ENTRANCE AUTOMATIC SENSOR DOORS (World X = 230, Z = -64.45)
    const distNorthDoor = Math.hypot(playerPos[0] - 230, playerPos[2] - (-64.45));
    const shouldOpenNorth = !isDriving && distNorthDoor < 9.0 && playerPos[1] < 6.0;
    if (shouldOpenNorth !== prevNorthDoorOpen.current) {
      prevNorthDoorOpen.current = shouldOpenNorth;
      if (shouldOpenNorth) playDoorOpenSound();
      else playDoorCloseSound();
    }
    northDoorOpenProgress.current = MathUtils.damp(
      northDoorOpenProgress.current,
      shouldOpenNorth ? 1.0 : 0.0,
      6.5,
      delta
    );
    const northSlide = northDoorOpenProgress.current * 2.35;
    if (northDoorLeftMeshRef.current && northDoorRightMeshRef.current) {
      northDoorLeftMeshRef.current.position.x = -1.25 - northSlide;
      northDoorRightMeshRef.current.position.x = 1.25 + northSlide;
    }
    // Sync physical kinematic colliders with North sliding glass doors (World X = 230 ± offset, Z = -64.45)
    if (northDoorLeftRbRef.current && northDoorRightRbRef.current) {
      northDoorLeftRbRef.current.setNextKinematicTranslation({
        x: 230 - (1.25 + northSlide),
        y: 2.25,
        z: -64.45,
      });
      northDoorRightRbRef.current.setNextKinematicTranslation({
        x: 230 + (1.25 + northSlide),
        y: 2.25,
        z: -64.45,
      });
    }
    if (northSensorLedRef.current) {
      (northSensorLedRef.current.material as any)?.color?.set(shouldOpenNorth ? '#22c55e' : '#38bdf8');
    }

    if (Math.hypot(playerPos[0] - 230, playerPos[2] - (-78)) > 115) return;
    const t = state.clock.getElapsedTime();
    if (centrifugeRef.current) {
      centrifugeRef.current.rotation.y = t * 2.8;
    }
    if (specimenHoloRef.current) {
      specimenHoloRef.current.rotation.y = t * 0.9;
      specimenHoloRef.current.rotation.x = Math.sin(t * 0.5) * 0.2;
    }
    if (orbitalGlobeRef.current) {
      orbitalGlobeRef.current.rotation.y = t * 0.65;
    }
    if (plasmaRingRef.current) {
      plasmaRingRef.current.rotation.z = t * 2.2;
      plasmaRingRef.current.rotation.x = Math.sin(t * 1.4) * 0.35;
    }
  });

  return (
    <group position={[230, 0, -78]}>
      {/* ============================================================== */}
      {/* 1. MAIN BUILDING ARCHITECTURAL STRUCTURE & CLEANROOM SHELL     */}
      {/* 58m Wide (X: -29..+29), 18.5m High, 28m Deep (Z: -14..+14)     */}
      {/* ============================================================== */}
      {/* Rear Structural South Wall (Z = -13.5) */}
      <RigidBody type="fixed" colliders="cuboid" position={[0, 9.1, -13.5]}>
        <mesh receiveShadow castShadow>
          <boxGeometry args={[58, 18.2, 1]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.4} metalness={0.2} />
        </mesh>
      </RigidBody>

      {/* Right / East Wall (X = +28.5) */}
      <RigidBody type="fixed" colliders="cuboid" position={[28.5, 9.1, 0]}>
        <mesh receiveShadow castShadow>
          <boxGeometry args={[1, 18.2, 28]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.4} metalness={0.2} />
        </mesh>
      </RigidBody>

      {/* Ground Floor Cleanroom Epoxy Slab */}
      <RigidBody type="fixed" colliders="cuboid" position={[0, 0.08, 0]} friction={1.0}>
        <mesh receiveShadow>
          <boxGeometry args={[57, 0.16, 27]} />
          <meshStandardMaterial color="#e2e8f0" roughness={0.3} metalness={0.1} />
        </mesh>
      </RigidBody>

      {/* ============================================================== */}
      {/* 1A. WEST FACADE — GRAND MAIN ENTRANCE (LOCAL X = -28.5)        */}
      {/* Directly faces the West Arterial Road (World X = 188)          */}
      {/* Includes Automatic Sensor Sliding Glass Doors & Solid Pillars  */}
      {/* ============================================================== */}
      {/* South Wing of West Wall (Z = -14.0 to -6.0, width = 8.0m) */}
      <RigidBody type="fixed" colliders="cuboid" position={[-28.5, 7.75, -10.0]}>
        <mesh receiveShadow castShadow>
          <boxGeometry args={[0.8, 15.5, 8.0]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.35} metalness={0.2} />
        </mesh>
      </RigidBody>

      {/* North Wing of West Wall (Z = +6.0 to +14.0, width = 8.0m) */}
      <RigidBody type="fixed" colliders="cuboid" position={[-28.5, 7.75, 10.0]}>
        <mesh receiveShadow castShadow>
          <boxGeometry args={[0.8, 15.5, 8.0]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.35} metalness={0.2} />
        </mesh>
      </RigidBody>

      {/* Panoramic Glass Curtain Above West Main Entrance (Z = -6.0 to +6.0, Y = 4.8 to 15.5m) */}
      <RigidBody type="fixed" colliders="cuboid" position={[-28.5, 10.15, 0]}>
        <mesh>
          <boxGeometry args={[0.24, 10.7, 12.0]} />
          <meshStandardMaterial
            color="#38bdf8"
            transparent
            opacity={0.32}
            roughness={0.08}
            metalness={0.85}
            side={DoubleSide}
          />
        </mesh>
      </RigidBody>

      {/* Upper Fascia Header on West Main Entrance Facade (Y = 15.5 to 18.2m) */}
      <group position={[-28.8, 16.85, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <RigidBody type="fixed" colliders="cuboid">
          <mesh castShadow receiveShadow>
            <boxGeometry args={[28, 2.7, 1.2]} />
            <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.3} />
          </mesh>
        </RigidBody>
        <Text position={[0, 0.65, 0.62]} fontSize={0.78} color="#38bdf8" fontWeight="bold" anchorX="center">
          LABORATÓRIO DE PESQUISA & PROPULSÃO • GGPEN
        </Text>
        <Text position={[0, -0.15, 0.62]} fontSize={0.48} color="#f8fafc" fontWeight="bold" anchorX="center">
          PORTA PRINCIPAL OESTE • CENTRO CIENTÍFICO AEROESPACIAL
        </Text>
        <Text position={[0, -0.78, 0.62]} fontSize={0.34} color="#94a3b8" anchorX="center">
          NASA SPACE APPS LUANDA COLLABORATIVE RESEARCH COMPLEX
        </Text>
        <GGPENLogoDecal position={[-11.5, 0, 0.62]} scale={[2.2, 2.2, 1]} />
        <NasaSpaceAppsLuandaDecal position={[11.5, 0, 0.62]} scale={[2.1, 2.1, 1]} />
      </group>

      {/* Solid Static Colliders for West Portal Pillars, Fixed Glass Sidelights & Canopy Columns */}
      <RigidBody type="fixed" colliders={false}>
        {/* West Main Portal Steel Pillars (Local X = -28.8, Z = ±5.8) */}
        <CuboidCollider args={[0.45, 2.4, 0.35]} position={[-28.8, 2.4, -5.8]} />
        <CuboidCollider args={[0.45, 2.4, 0.35]} position={[-28.8, 2.4, 5.8]} />
        {/* Fixed Glass Sidelights flanking West Automatic Doors (Z = -5.5..-3.1 and +3.1..+5.5) */}
        <CuboidCollider args={[0.15, 2.25, 1.2]} position={[-28.5, 2.25, -4.3]} />
        <CuboidCollider args={[0.15, 2.25, 1.2]} position={[-28.5, 2.25, 4.3]} />
        {/* West Canopy Support Columns on Sidewalk Plaza (Local X = -33.4, Z = ±6.1) */}
        <CuboidCollider args={[0.32, 2.5, 0.32]} position={[-33.4, 2.5, -6.1]} />
        <CuboidCollider args={[0.32, 2.5, 0.32]} position={[-33.4, 2.5, 6.1]} />
      </RigidBody>

      {/* Kinematic Colliders for West Automatic Sliding Glass Doors */}
      <RigidBody ref={westDoorLeftRbRef} type="kinematicPosition" colliders={false} position={[-28.5, 2.25, -1.55]}>
        <CuboidCollider args={[0.15, 2.25, 1.55]} />
      </RigidBody>
      <RigidBody ref={westDoorRightRbRef} type="kinematicPosition" colliders={false} position={[-28.5, 2.25, 1.55]}>
        <CuboidCollider args={[0.15, 2.25, 1.55]} />
      </RigidBody>

      {/* Grand West Main Entrance Portal Frame, Automatic Sensor Sliding Glass Doors & Sidewalk Canopy */}
      <group position={[-28.8, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
        {/* Structural Steel Entrance Pillars (Z = -5.8 and +5.8) */}
        {[-5.8, 5.8].map((px, pi) => (
          <mesh key={`west-main-pillar-${pi}`} position={[px, 2.4, 0]} castShadow>
            <boxGeometry args={[0.65, 4.8, 0.9]} />
            <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.2} />
          </mesh>
        ))}

        {/* Fixed Tempered Glass Sidelights */}
        {[-4.3, 4.3].map((sx, si) => (
          <group key={`west-sidelight-${si}`} position={[sx, 2.25, -0.15]}>
            <mesh>
              <boxGeometry args={[2.3, 4.5, 0.08]} />
              <meshStandardMaterial color="#38bdf8" transparent opacity={0.34} metalness={0.85} roughness={0.08} />
            </mesh>
            <mesh position={[si === 0 ? 1.12 : -1.12, 0, 0]}>
              <boxGeometry args={[0.08, 4.5, 0.14]} />
              <meshStandardMaterial color="#1e293b" metalness={0.9} />
            </mesh>
          </group>
        ))}

        {/* AUTOMATIC SLIDING GLASS DOOR — LEFT LEAF */}
        <group ref={westDoorLeftMeshRef} position={[-1.55, 2.25, 0.02]}>
          {/* Tempered Glass Leaf */}
          <mesh>
            <boxGeometry args={[3.08, 4.46, 0.06]} />
            <meshStandardMaterial
              color="#7dd3fc"
              transparent
              opacity={0.44}
              metalness={0.9}
              roughness={0.05}
              side={DoubleSide}
            />
          </mesh>
          {/* Aluminum Perimeter Door Frame & Center Handle Bar */}
          <mesh position={[1.50, 0, 0]}>
            <boxGeometry args={[0.09, 4.48, 0.11]} />
            <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.2} />
          </mesh>
          <mesh position={[-1.50, 0, 0]}>
            <boxGeometry args={[0.09, 4.48, 0.11]} />
            <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.2} />
          </mesh>
          <mesh position={[0, 2.20, 0]}>
            <boxGeometry args={[3.10, 0.10, 0.11]} />
            <meshStandardMaterial color="#0f172a" metalness={0.9} />
          </mesh>
          <mesh position={[0, -2.20, 0]}>
            <boxGeometry args={[3.10, 0.12, 0.11]} />
            <meshStandardMaterial color="#0f172a" metalness={0.9} />
          </mesh>
          {/* Frosted Horizontal Safety Etch Band across Glass */}
          <mesh position={[0, -0.15, 0.035]}>
            <planeGeometry args={[2.9, 0.22]} />
            <meshBasicMaterial color="#e0f2fe" transparent opacity={0.75} side={DoubleSide} />
          </mesh>
          <mesh position={[1.32, -0.15, 0.06]}>
            <cylinderGeometry args={[0.022, 0.022, 0.85, 12]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.95} roughness={0.1} />
          </mesh>
        </group>

        {/* AUTOMATIC SLIDING GLASS DOOR — RIGHT LEAF */}
        <group ref={westDoorRightMeshRef} position={[1.55, 2.25, 0.02]}>
          <mesh>
            <boxGeometry args={[3.08, 4.46, 0.06]} />
            <meshStandardMaterial
              color="#7dd3fc"
              transparent
              opacity={0.44}
              metalness={0.9}
              roughness={0.05}
              side={DoubleSide}
            />
          </mesh>
          <mesh position={[-1.50, 0, 0]}>
            <boxGeometry args={[0.09, 4.48, 0.11]} />
            <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.2} />
          </mesh>
          <mesh position={[1.50, 0, 0]}>
            <boxGeometry args={[0.09, 4.48, 0.11]} />
            <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.2} />
          </mesh>
          <mesh position={[0, 2.20, 0]}>
            <boxGeometry args={[3.10, 0.10, 0.11]} />
            <meshStandardMaterial color="#0f172a" metalness={0.9} />
          </mesh>
          <mesh position={[0, -2.20, 0]}>
            <boxGeometry args={[3.10, 0.12, 0.11]} />
            <meshStandardMaterial color="#0f172a" metalness={0.9} />
          </mesh>
          <mesh position={[0, -0.15, 0.035]}>
            <planeGeometry args={[2.9, 0.22]} />
            <meshBasicMaterial color="#e0f2fe" transparent opacity={0.75} side={DoubleSide} />
          </mesh>
          <mesh position={[-1.32, -0.15, 0.06]}>
            <cylinderGeometry args={[0.022, 0.022, 0.85, 12]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.95} roughness={0.1} />
          </mesh>
        </group>

        {/* Overhead Automatic Proximity Motion Sensor Bar */}
        <group position={[0, 4.52, 0.28]}>
          <mesh>
            <boxGeometry args={[2.2, 0.16, 0.18]} />
            <meshStandardMaterial color="#09090b" metalness={0.85} />
          </mesh>
          <mesh ref={westSensorLedRef} position={[0, 0, 0.095]}>
            <planeGeometry args={[1.4, 0.06]} />
            <meshBasicMaterial color="#38bdf8" />
          </mesh>
        </group>

        {/* Illuminated Main Portal Header Beam */}
        <mesh position={[0, 4.8, 0.45]} castShadow>
          <boxGeometry args={[12.4, 0.68, 1.5]} />
          <meshStandardMaterial color="#0f172a" metalness={0.85} />
        </mesh>
        <Text position={[0, 4.8, 1.22]} fontSize={0.40} color="#38bdf8" fontWeight="bold" anchorX="center">
          PORTA PRINCIPAL OESTE • LABORATÓRIO CIENTÍFICO GGPEN
        </Text>

        {/* Projecting Architectural Canopy over West Main Entrance Plaza */}
        <mesh position={[0, 5.05, 2.6]} castShadow>
          <boxGeometry args={[13.6, 0.36, 5.2]} />
          <meshStandardMaterial color="#0f172a" metalness={0.85} roughness={0.25} />
        </mesh>
        <mesh position={[0, 4.85, 2.6]}>
          <boxGeometry args={[10.5, 0.04, 0.35]} />
          <meshBasicMaterial color="#38bdf8" />
        </mesh>
        {/* Canopy Support Columns seated on the West Sidewalk Plaza (With Solid Colliders!) */}
        {[-6.1, 6.1].map((sx, si) => (
          <mesh key={`west-canopy-col-${si}`} position={[sx, 2.5, 4.6]} castShadow>
            <cylinderGeometry args={[0.18, 0.22, 5.0, 16]} />
            <meshStandardMaterial color="#334155" metalness={0.9} />
          </mesh>
        ))}

        {/* Paved West Entrance Plaza connecting the Main Door directly to the West Arterial Road */}
        <RigidBody type="fixed" colliders="cuboid" position={[0, 0.05, 3.6]} friction={1.0}>
          <mesh receiveShadow>
            <boxGeometry args={[18, 0.1, 7.5]} />
            <meshStandardMaterial color="#1e293b" roughness={0.8} />
          </mesh>
        </RigidBody>
        <Text
          position={[0, 0.12, 2.8]}
          rotation={[-Math.PI / 2, 0, 0]}
          fontSize={0.42}
          color="#38bdf8"
          fontWeight="bold"
          anchorX="center"
        >
          ENTRADA PRINCIPAL OESTE • LABORATÓRIO GGPEN
        </Text>
      </group>

      {/* ============================================================== */}
      {/* 1B. SECOND FLOOR UPPER TECH DECK AT Y = 10.33m (TOP Y = 10.50m)*/}
      {/* Spans the Laboratory with an open cutout for Staircase 1       */}
      {/* Cutout at Local X ∈ [3.6, 7.4], Local Z ∈ [-10.5, +3.0]        */}
      {/* ============================================================== */}
      {/* Upper Floor Segment 1: West & Central Tech Wing (Local X = -27.8 to +3.6 [31.4m], Z = -13.0 to +13.0 [26m]) */}
      <RigidBody type="fixed" colliders="cuboid" position={[-12.1, 10.33, 0]} friction={1.0}>
        <mesh receiveShadow castShadow>
          <boxGeometry args={[31.4, 0.34, 26.0]} />
          <meshStandardMaterial color="#1e293b" roughness={0.4} metalness={0.45} />
        </mesh>
      </RigidBody>

      {/* Upper Floor Segment 2: East Tech Wing & Staircase 2 Landing (Local X = +7.4 to +27.8 [20.4m], Z = -13.0 to +13.0 [26m]) */}
      <RigidBody type="fixed" colliders="cuboid" position={[17.6, 10.33, 0]} friction={1.0}>
        <mesh receiveShadow castShadow>
          <boxGeometry args={[20.4, 0.34, 26.0]} />
          <meshStandardMaterial color="#1e293b" roughness={0.4} metalness={0.45} />
        </mesh>
      </RigidBody>

      {/* Upper Floor Segment 3: North Bridge Slab ahead of Staircase 1 Arrival (Local X = +3.6 to +7.4 [3.8m], Z = +3.0 to +13.0 [10.0m]) */}
      <RigidBody type="fixed" colliders="cuboid" position={[5.5, 10.33, 8.0]} friction={1.0}>
        <mesh receiveShadow castShadow>
          <boxGeometry args={[3.8, 0.34, 10.0]} />
          <meshStandardMaterial color="#1e293b" roughness={0.4} metalness={0.45} />
        </mesh>
      </RigidBody>

      {/* Upper Floor Segment 4: South Rear Strip behind Staircase 1 (Local X = +3.6 to +7.4 [3.8m], Z = -13.0 to -10.5 [2.5m]) */}
      <RigidBody type="fixed" colliders="cuboid" position={[5.5, 10.33, -11.75]} friction={1.0}>
        <mesh receiveShadow castShadow>
          <boxGeometry args={[3.8, 0.34, 2.5]} />
          <meshStandardMaterial color="#1e293b" roughness={0.4} metalness={0.45} />
        </mesh>
      </RigidBody>

      {/* Glass Safety Guardrails around Staircase 1 Opening on the 2nd Floor (Y = 10.50m) */}
      <group position={[3.55, 11.1, -3.75]}>
        <RigidBody type="fixed" colliders="cuboid">
          <mesh>
            <boxGeometry args={[0.08, 1.2, 13.5]} />
            <meshPhysicalMaterial color="#38bdf8" transparent opacity={0.35} transmission={0.85} side={DoubleSide} />
          </mesh>
        </RigidBody>
        <mesh position={[0, 0.6, 0]}>
          <boxGeometry args={[0.14, 0.08, 13.6]} />
          <meshStandardMaterial color="#eab308" metalness={0.8} />
        </mesh>
      </group>
      <group position={[7.45, 11.1, -3.75]}>
        <RigidBody type="fixed" colliders="cuboid">
          <mesh>
            <boxGeometry args={[0.08, 1.2, 13.5]} />
            <meshPhysicalMaterial color="#38bdf8" transparent opacity={0.35} transmission={0.85} side={DoubleSide} />
          </mesh>
        </RigidBody>
        <mesh position={[0, 0.6, 0]}>
          <boxGeometry args={[0.14, 0.08, 13.6]} />
          <meshStandardMaterial color="#eab308" metalness={0.8} />
        </mesh>
      </group>

      {/* ============================================================== */}
      {/* 1C. ROOF SLAB AT Y = 18.2m (TOP SURFACE Y = 18.50m)            */}
      {/* Split into 4 solid segments around Staircase 2 Cutout          */}
      {/* at Local X ∈ [9.4, 13.6], Local Z ∈ [-4.0, +8.5]               */}
      {/* ============================================================== */}
      {/* Roof Segment A: West Main Roof Slab (X = -30.0 to +9.4 [39.4m], Z = -15 to +15 [30m]) */}
      <RigidBody type="fixed" colliders="cuboid" position={[-10.3, 18.2, 0]} friction={1.0}>
        <mesh receiveShadow castShadow>
          <boxGeometry args={[39.4, 0.6, 30]} />
          <meshStandardMaterial color="#334155" roughness={0.7} />
        </mesh>
      </RigidBody>

      {/* Roof Segment B: East Roof Slab (X = +13.6 to +30.0 [16.4m], Z = -15 to +15 [30m]) */}
      <RigidBody type="fixed" colliders="cuboid" position={[21.8, 18.2, 0]} friction={1.0}>
        <mesh receiveShadow castShadow>
          <boxGeometry args={[16.4, 0.6, 30]} />
          <meshStandardMaterial color="#334155" roughness={0.7} />
        </mesh>
      </RigidBody>

      {/* Roof Segment C: North Skybridge Landing Slab (X = +9.4 to +13.6 [4.2m], Z = +8.5 to +15.0 [6.5m]) */}
      <RigidBody type="fixed" colliders="cuboid" position={[11.5, 18.2, 11.75]} friction={1.0}>
        <mesh receiveShadow castShadow>
          <boxGeometry args={[4.2, 0.6, 6.5]} />
          <meshStandardMaterial color="#334155" roughness={0.7} />
        </mesh>
      </RigidBody>

      {/* Roof Segment D: South Stairwell Rear Slab (X = +9.4 to +13.6 [4.2m], Z = -15.0 to -4.0 [11.0m]) */}
      <RigidBody type="fixed" colliders="cuboid" position={[11.5, 18.2, -9.5]} friction={1.0}>
        <mesh receiveShadow castShadow>
          <boxGeometry args={[4.2, 0.6, 11.0]} />
          <meshStandardMaterial color="#334155" roughness={0.7} />
        </mesh>
      </RigidBody>

      {/* ============================================================== */}
      {/* 2. NORTH PANORAMIC GLASS FACADE (Z = +13.5 / WORLD Z = -64.5)  */}
      {/* Includes Automatic Sensor Sliding Glass Doors & Solid Mullions */}
      {/* ============================================================== */}
      <group position={[0, 16.85, 13.8]}>
        <RigidBody type="fixed" colliders="cuboid">
          <mesh castShadow receiveShadow>
            <boxGeometry args={[58, 2.7, 1.2]} />
            <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.3} />
          </mesh>
        </RigidBody>
        <Text position={[0, 0.35, 0.62]} fontSize={0.95} color="#38bdf8" fontWeight="bold" anchorX="center">
          LABORATÓRIO DE PESQUISA & PROPULSÃO ESPACIAL • GGPEN
        </Text>
        <Text position={[0, -0.55, 0.62]} fontSize={0.55} color="#f8fafc" fontWeight="bold" anchorX="center">
          ALA PANORÂMICA NORTE • ASTROBIOLOGIA & TELEMETRIA ORBITAL
        </Text>
        <GGPENLogoDecal position={[-24.5, 0, 0.62]} scale={[2.4, 2.4, 1]} />
        <NasaSpaceAppsLuandaDecal position={[24.5, 0, 0.62]} scale={[2.3, 2.3, 1]} />
      </group>

      {[-24, -15, -5.5, 5.5, 15, 24].map((mx, mi) => (
        <RigidBody key={`lab-mullion-${mi}`} type="fixed" colliders="cuboid" position={[mx, 7.75, 13.6]}>
          <mesh castShadow>
            <boxGeometry args={[0.7, 15.5, 0.6]} />
            <meshStandardMaterial color="#1e293b" metalness={0.9} />
          </mesh>
        </RigidBody>
      ))}

      {/* North Glass Curtain Wall Left, Upper-Center & Right Wings (Thickened Colliders so zero pass-through!) */}
      <RigidBody type="fixed" colliders={false} position={[-16.75, 7.75, 13.5]}>
        <CuboidCollider args={[11.25, 7.75, 0.35]} />
        <mesh>
          <boxGeometry args={[22.5, 15.5, 0.16]} />
          <meshStandardMaterial color="#38bdf8" transparent opacity={0.28} roughness={0.08} metalness={0.85} side={DoubleSide} />
        </mesh>
      </RigidBody>
      <RigidBody type="fixed" colliders={false} position={[0, 10.05, 13.5]}>
        <CuboidCollider args={[5.5, 5.45, 0.35]} />
        <mesh>
          <boxGeometry args={[11.0, 10.9, 0.16]} />
          <meshStandardMaterial color="#38bdf8" transparent opacity={0.28} roughness={0.08} metalness={0.85} side={DoubleSide} />
        </mesh>
      </RigidBody>
      <RigidBody type="fixed" colliders={false} position={[16.75, 7.75, 13.5]}>
        <CuboidCollider args={[11.25, 7.75, 0.35]} />
        <mesh>
          <boxGeometry args={[22.5, 15.5, 0.16]} />
          <meshStandardMaterial color="#38bdf8" transparent opacity={0.28} roughness={0.08} metalness={0.85} side={DoubleSide} />
        </mesh>
      </RigidBody>

      {/* Solid Colliders for North Side Entrance Pillars & Fixed Sidelights */}
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider args={[0.35, 2.3, 0.35]} position={[-4.8, 2.3, 13.7]} />
        <CuboidCollider args={[0.35, 2.3, 0.35]} position={[4.8, 2.3, 13.7]} />
        <CuboidCollider args={[1.0, 2.25, 0.18]} position={[-3.55, 2.25, 13.55]} />
        <CuboidCollider args={[1.0, 2.25, 0.18]} position={[3.55, 2.25, 13.55]} />
      </RigidBody>

      {/* Kinematic Colliders for North Side Entrance Automatic Sliding Glass Doors */}
      <RigidBody ref={northDoorLeftRbRef} type="kinematicPosition" colliders={false} position={[-1.25, 2.25, 13.55]}>
        <CuboidCollider args={[1.25, 2.25, 0.15]} />
      </RigidBody>
      <RigidBody ref={northDoorRightRbRef} type="kinematicPosition" colliders={false} position={[1.25, 2.25, 13.55]}>
        <CuboidCollider args={[1.25, 2.25, 0.15]} />
      </RigidBody>

      {/* North Side Entrance Frame & Automatic Sliding Glass Doors */}
      <group position={[0, 0, 13.55]}>
        {[-4.8, 4.8].map((px, pi) => (
          <mesh key={`north-door-pillar-${pi}`} position={[px, 2.3, 0.15]} castShadow>
            <boxGeometry args={[0.55, 4.6, 0.6]} />
            <meshStandardMaterial color="#0f172a" metalness={0.9} />
          </mesh>
        ))}

        {/* Fixed Glass Sidelights flanking North Automatic Doors */}
        {[-3.55, 3.55].map((sx, si) => (
          <group key={`north-sidelight-${si}`} position={[sx, 2.25, 0]}>
            <mesh>
              <boxGeometry args={[2.0, 4.5, 0.08]} />
              <meshStandardMaterial color="#38bdf8" transparent opacity={0.34} metalness={0.85} roughness={0.08} />
            </mesh>
            <mesh position={[si === 0 ? 0.96 : -0.96, 0, 0]}>
              <boxGeometry args={[0.08, 4.5, 0.14]} />
              <meshStandardMaterial color="#1e293b" metalness={0.9} />
            </mesh>
          </group>
        ))}

        {/* NORTH AUTOMATIC SLIDING GLASS DOOR — LEFT LEAF */}
        <group ref={northDoorLeftMeshRef} position={[-1.25, 2.25, 0.08]}>
          <mesh>
            <boxGeometry args={[2.48, 4.46, 0.06]} />
            <meshStandardMaterial
              color="#7dd3fc"
              transparent
              opacity={0.44}
              metalness={0.9}
              roughness={0.05}
              side={DoubleSide}
            />
          </mesh>
          <mesh position={[1.20, 0, 0]}>
            <boxGeometry args={[0.08, 4.48, 0.11]} />
            <meshStandardMaterial color="#0f172a" metalness={0.9} />
          </mesh>
          <mesh position={[-1.20, 0, 0]}>
            <boxGeometry args={[0.08, 4.48, 0.11]} />
            <meshStandardMaterial color="#0f172a" metalness={0.9} />
          </mesh>
          <mesh position={[0, 2.20, 0]}>
            <boxGeometry args={[2.50, 0.10, 0.11]} />
            <meshStandardMaterial color="#0f172a" metalness={0.9} />
          </mesh>
          <mesh position={[0, -2.20, 0]}>
            <boxGeometry args={[2.50, 0.12, 0.11]} />
            <meshStandardMaterial color="#0f172a" metalness={0.9} />
          </mesh>
          <mesh position={[0, -0.15, 0.035]}>
            <planeGeometry args={[2.3, 0.22]} />
            <meshBasicMaterial color="#e0f2fe" transparent opacity={0.75} side={DoubleSide} />
          </mesh>
          <mesh position={[1.05, -0.15, 0.06]}>
            <cylinderGeometry args={[0.022, 0.022, 0.85, 12]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.95} roughness={0.1} />
          </mesh>
        </group>

        {/* NORTH AUTOMATIC SLIDING GLASS DOOR — RIGHT LEAF */}
        <group ref={northDoorRightMeshRef} position={[1.25, 2.25, 0.08]}>
          <mesh>
            <boxGeometry args={[2.48, 4.46, 0.06]} />
            <meshStandardMaterial
              color="#7dd3fc"
              transparent
              opacity={0.44}
              metalness={0.9}
              roughness={0.05}
              side={DoubleSide}
            />
          </mesh>
          <mesh position={[-1.20, 0, 0]}>
            <boxGeometry args={[0.08, 4.48, 0.11]} />
            <meshStandardMaterial color="#0f172a" metalness={0.9} />
          </mesh>
          <mesh position={[1.20, 0, 0]}>
            <boxGeometry args={[0.08, 4.48, 0.11]} />
            <meshStandardMaterial color="#0f172a" metalness={0.9} />
          </mesh>
          <mesh position={[0, 2.20, 0]}>
            <boxGeometry args={[2.50, 0.10, 0.11]} />
            <meshStandardMaterial color="#0f172a" metalness={0.9} />
          </mesh>
          <mesh position={[0, -2.20, 0]}>
            <boxGeometry args={[2.50, 0.12, 0.11]} />
            <meshStandardMaterial color="#0f172a" metalness={0.9} />
          </mesh>
          <mesh position={[0, -0.15, 0.035]}>
            <planeGeometry args={[2.3, 0.22]} />
            <meshBasicMaterial color="#e0f2fe" transparent opacity={0.75} side={DoubleSide} />
          </mesh>
          <mesh position={[-1.05, -0.15, 0.06]}>
            <cylinderGeometry args={[0.022, 0.022, 0.85, 12]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.95} roughness={0.1} />
          </mesh>
        </group>

        {/* Overhead Automatic Proximity Motion Sensor Bar on North Door */}
        <group position={[0, 4.42, 0.36]}>
          <mesh>
            <boxGeometry args={[2.0, 0.15, 0.16]} />
            <meshStandardMaterial color="#09090b" metalness={0.85} />
          </mesh>
          <mesh ref={northSensorLedRef} position={[0, 0, 0.085]}>
            <planeGeometry args={[1.3, 0.06]} />
            <meshBasicMaterial color="#38bdf8" />
          </mesh>
        </group>

        <mesh position={[0, 4.6, 0.35]} castShadow>
          <boxGeometry args={[10.2, 0.55, 0.8]} />
          <meshStandardMaterial color="#0f172a" metalness={0.85} />
        </mesh>
        <Text position={[0, 4.6, 0.77]} fontSize={0.34} color="#38bdf8" fontWeight="bold" anchorX="center">
          PORTA LATERAL NORTE • LABORATÓRIO GGPEN
        </Text>
      </group>

      {/* ============================================================== */}
      {/* 3. GROUND FLOOR SCIENTIFIC EQUIPMENT (Y = 0.0m)                */}
      {/* Central West-to-East corridor (Z = -4.5 to +4.5) kept 100%     */}
      {/* open from the West Main Entrance straight to Staircase 1!      */}
      {/* ============================================================== */}
      {/* ZONE A: ASTROBIOLOGY HYDROPONICS & PLANT GROWTH RACKS (North-West Wing, Z = +9.2) */}
      <group position={[-17.5, 0, 9.2]}>
        {[-3.6, 0, 3.6].map((hx, hi) => (
          <group key={`hydro-${hi}`} position={[hx, 0, 0]}>
            <RigidBody type="fixed" colliders="cuboid" position={[0, 3.8, 0]}>
              <mesh castShadow>
                <boxGeometry args={[2.5, 7.6, 1.6]} />
                <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.1} />
              </mesh>
            </RigidBody>
            {[1.8, 4.2, 6.5].map((ly, li) => (
              <group key={`shelf-${li}`} position={[0, ly, 0]}>
                <mesh position={[0, -0.2, 0]}>
                  <boxGeometry args={[2.2, 0.2, 1.4]} />
                  <meshStandardMaterial color="#15803d" roughness={0.9} />
                </mesh>
                <mesh position={[0, 0.65, 0]}>
                  <boxGeometry args={[2.1, 0.08, 0.3]} />
                  <meshBasicMaterial color="#c084fc" />
                </mesh>
              </group>
            ))}
          </group>
        ))}
        <pointLight position={[0, 5, 0]} color="#c084fc" intensity={2.2} distance={12} />
        <Text position={[0, 8.3, 0]} fontSize={0.38} color="#c084fc" fontWeight="bold" anchorX="center">
          DIVISÃO DE ASTROBIOLOGIA & CULTIVOS ESPACIAIS
        </Text>
      </group>

      {/* ZONE B: PLANETARY SAMPLE ANALYSIS & SPECTROMETRY (South-West Wing, Z = -8.5) */}
      <group position={[-16.0, 0, -8.5]}>
        <RigidBody type="fixed" colliders="cuboid" position={[0, 1.2, 0]}>
          <mesh castShadow receiveShadow>
            <cylinderGeometry args={[2.6, 2.8, 2.4, 24]} />
            <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.3} />
          </mesh>
        </RigidBody>
        <mesh position={[0, 2.45, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[2.4, 24]} />
          <meshBasicMaterial color="#0369a1" />
        </mesh>
        <group ref={specimenHoloRef} position={[0, 4.6, 0]}>
          <mesh>
            <octahedronGeometry args={[1.3, 0]} />
            <meshBasicMaterial color="#38bdf8" wireframe />
          </mesh>
          <mesh>
            <dodecahedronGeometry args={[0.85, 0]} />
            <meshBasicMaterial color="#06b6d4" transparent opacity={0.6} />
          </mesh>
        </group>
        <Text position={[0, 6.8, 0]} fontSize={0.36} color="#38bdf8" fontWeight="bold" anchorX="center">
          ANÁLISE MINERAL & ESPECTRAL DE REGOLITO
        </Text>
      </group>

      {/* ZONE C: HIGH-PERFORMANCE COMPUTING CLUSTER (South Rear Wall, X = -5.0, Z = -10.5) */}
      <group
        position={[-4.5, 0, -10.5]}
        onClick={(e) => {
          e.stopPropagation();
          if (!useGameStore.getState().isNearComputer) return;
          useGameStore.getState().setComputerLibraryOpen(true);
        }}
      >
        {[-4.8, -2.4, 0, 2.4, 4.8].map((sx, si) => (
          <group key={`rack-${si}`} position={[sx, 0, 0]}>
            <RigidBody type="fixed" colliders="cuboid" position={[0, 4.0, 0]}>
              <mesh castShadow>
                <boxGeometry args={[1.9, 8.0, 1.6]} />
                <meshStandardMaterial color="#020617" roughness={0.4} metalness={0.8} />
              </mesh>
            </RigidBody>
            {Array.from({ length: 5 }).map((_, r) => (
              <mesh key={`led-row-${r}`} position={[0, 1.4 + r * 1.25, 0.82]}>
                <planeGeometry args={[1.5, 0.35]} />
                <meshBasicMaterial color={r % 2 === 0 ? '#10b981' : '#0284c7'} />
              </mesh>
            ))}
          </group>
        ))}
        <Text position={[0, 8.6, 0]} fontSize={0.38} color="#10b981" fontWeight="bold" anchorX="center">
          SUPERCOMPUTADOR DE DINÂMICA ORBITAL GGPEN
        </Text>
        <Text position={[0, 8.05, 0.85]} fontSize={0.24} color="#38bdf8" fontWeight="bold" anchorX="center">
          [CLIQUE OU TECLA C] ABRIR BIBLIOTECA DE LIVROS CIENTÍFICOS
        </Text>
      </group>

      {/* ZONE D: CRYOGENIC PROPELLANT CENTRIFUGE TEST UNIT (East Ground Wing, X = +18.0, Z = -8.5) */}
      <group position={[18.0, 0, -8.5]}>
        <RigidBody type="fixed" colliders="cuboid" position={[0, 1, 0]}>
          <mesh castShadow>
            <cylinderGeometry args={[2.2, 2.5, 2, 24]} />
            <meshStandardMaterial color="#1e293b" metalness={0.9} />
          </mesh>
        </RigidBody>
        <group ref={centrifugeRef} position={[0, 2.5, 0]}>
          <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.2, 0.2, 4.2, 16]} />
            <meshStandardMaterial color="#eab308" metalness={0.8} />
          </mesh>
          {[-1.9, 1.9].map((tx, ti) => (
            <mesh key={`test-pod-${ti}`} position={[tx, -0.6, 0]} castShadow>
              <cylinderGeometry args={[0.40, 0.40, 1.3, 16]} />
              <meshStandardMaterial color="#38bdf8" metalness={0.9} roughness={0.1} />
            </mesh>
          ))}
        </group>
        <Text position={[0, 5.2, 0]} fontSize={0.35} color="#eab308" fontWeight="bold" anchorX="center">
          CENTRÍFUGA CRIOGÉNICA DE PROPELENTES
        </Text>
      </group>

      {/* ============================================================== */}
      {/* 4. SECOND FLOOR ADVANCED TECHNOLOGIES (Y = 10.50m)             */}
      {/* Rich Aerospace & Planetary Research Stations in Upper Lab Space*/}
      {/* ============================================================== */}
      <group position={[0, 10.5, 0]}>
        {/* UPPER ZONE 1: ANGOSAT-2 & DEEP SPACE ORBITAL TELEMETRY COMMAND CENTER (West-South, X = -16, Z = -6) */}
        <group
          position={[-16.0, 0, -6.0]}
          onClick={(e) => {
            e.stopPropagation();
            if (!useGameStore.getState().isNearComputer) return;
            useGameStore.getState().setComputerLibraryOpen(true);
          }}
        >
          {/* Holographic Projector Pedestal */}
          <RigidBody type="fixed" colliders="cuboid" position={[0, 1.1, 0]}>
            <mesh castShadow receiveShadow>
              <cylinderGeometry args={[2.4, 2.7, 2.2, 24]} />
              <meshStandardMaterial color="#0f172a" metalness={0.85} roughness={0.2} />
            </mesh>
          </RigidBody>
          <mesh position={[0, 2.22, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[1.4, 2.2, 32]} />
            <meshBasicMaterial color="#38bdf8" side={DoubleSide} />
          </mesh>
          {/* Rotating 3D Orbital Earth & Satellite Constellation Hologram */}
          <group ref={orbitalGlobeRef} position={[0, 3.8, 0]}>
            <mesh>
              <sphereGeometry args={[1.25, 20, 20]} />
              <meshBasicMaterial color="#0284c7" wireframe />
            </mesh>
            <mesh rotation={[0.45, 0, 0.25]}>
              <torusGeometry args={[1.85, 0.03, 10, 48]} />
              <meshBasicMaterial color="#facc15" />
            </mesh>
            <mesh rotation={[-0.55, 0.3, -0.2]}>
              <torusGeometry args={[2.15, 0.025, 10, 48]} />
              <meshBasicMaterial color="#38bdf8" />
            </mesh>
            {/* Orbiting AngoSat-2 Miniature Probe */}
            <group position={[1.85, 0.3, 0]}>
              <mesh>
                <boxGeometry args={[0.28, 0.28, 0.28]} />
                <meshStandardMaterial color="#f59e0b" metalness={0.9} />
              </mesh>
              <mesh position={[0, 0, 0]}>
                <boxGeometry args={[1.1, 0.04, 0.22]} />
                <meshBasicMaterial color="#1d4ed8" />
              </mesh>
            </group>
          </group>
          {/* Curved Telemetry Operator Consoles */}
          {[-3.8, 3.8].map((cx, ci) => (
            <group key={`upper-console-${ci}`} position={[cx, 0, 1.2]} rotation={[0, ci === 0 ? 0.35 : -0.35, 0]}>
              <RigidBody type="fixed" colliders="cuboid" position={[0, 0.9, 0]}>
                <mesh castShadow>
                  <boxGeometry args={[2.4, 1.8, 0.9]} />
                  <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.3} />
                </mesh>
              </RigidBody>
              <mesh position={[0, 1.45, 0.47]}>
                <planeGeometry args={[2.1, 0.65]} />
                <meshBasicMaterial color="#0284c7" />
              </mesh>
            </group>
          ))}
          <Text position={[0, 6.1, 0]} fontSize={0.38} color="#38bdf8" fontWeight="bold" anchorX="center">
            CENTRO DE CONTROLO ORBITAL & TELEMETRIA ANGOSAT-2
          </Text>
          <Text position={[0, 5.55, 0]} fontSize={0.22} color="#10b981" fontWeight="bold" anchorX="center">
            [CLIQUE OU TECLA C] LER LIVROS CIENTÍFICOS
          </Text>
        </group>

        {/* UPPER ZONE 2: MAGNETIC PLASMA FUSION & ION PROPULSION REACTOR (Center-West, X = -4.5, Z = -6.5) */}
        <group position={[-4.5, 0, -6.5]}>
          <RigidBody type="fixed" colliders="cuboid" position={[0, 1.4, 0]}>
            <mesh castShadow receiveShadow>
              <cylinderGeometry args={[2.2, 2.5, 2.8, 24]} />
              <meshStandardMaterial color="#1e293b" metalness={0.9} roughness={0.2} />
            </mesh>
          </RigidBody>
          {/* Glowing Plasma Containment Core */}
          <mesh position={[0, 3.8, 0]}>
            <sphereGeometry args={[0.95, 24, 24]} />
            <meshBasicMaterial color="#a855f7" />
          </mesh>
          <group ref={plasmaRingRef} position={[0, 3.8, 0]}>
            <mesh>
              <torusGeometry args={[1.45, 0.08, 12, 36]} />
              <meshStandardMaterial color="#38bdf8" emissive="#0284c7" emissiveIntensity={0.8} metalness={0.9} />
            </mesh>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[1.65, 0.07, 12, 36]} />
              <meshStandardMaterial color="#f59e0b" emissive="#d97706" emissiveIntensity={0.6} metalness={0.9} />
            </mesh>
          </group>
          <pointLight position={[0, 3.8, 0]} color="#a855f7" intensity={3.0} distance={14} />
          <Text position={[0, 6.2, 0]} fontSize={0.38} color="#c084fc" fontWeight="bold" anchorX="center">
            REATOR DE CONFINAMENTO MAGNÉTICO & PROPULSÃO IÓNICA
          </Text>
        </group>

        {/* UPPER ZONE 3: EXOPLANET BIOSIGNATURE & CRYOGENIC BIOREACTOR ARRAY (West-North, X = -15.5, Z = +6.5) */}
        <group position={[-15.5, 0, 6.5]}>
          {[-4.2, -1.4, 1.4, 4.2].map((bx, bi) => (
            <group key={`bio-vat-${bi}`} position={[bx, 0, 0]}>
              <RigidBody type="fixed" colliders="cuboid" position={[0, 2.1, 0]}>
                <mesh castShadow>
                  <cylinderGeometry args={[0.85, 0.95, 4.2, 20]} />
                  <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.2} />
                </mesh>
              </RigidBody>
              <mesh position={[0, 2.2, 0]}>
                <cylinderGeometry args={[0.78, 0.78, 2.8, 20]} />
                <meshBasicMaterial color={bi % 2 === 0 ? '#10b981' : '#06b6d4'} transparent opacity={0.65} />
              </mesh>
            </group>
          ))}
          <Text position={[0, 5.1, 0]} fontSize={0.38} color="#10b981" fontWeight="bold" anchorX="center">
            LABORATÓRIO DE BIOASSINATURAS EXOPLANETÁRIAS & CRIO-GENÓMICA
          </Text>
        </group>

        {/* UPPER ZONE 4: HYPERSONIC AEROTHERMODYNAMICS & HEAT-SHIELD WIND TUNNEL (East Wing, X = +21.5, Z = -2.5) */}
        <group position={[21.5, 0, -2.5]}>
          <RigidBody type="fixed" colliders="cuboid" position={[0, 2.0, 0]}>
            <mesh castShadow receiveShadow>
              <boxGeometry args={[4.4, 1.2, 11.5]} />
              <meshStandardMaterial color="#0f172a" metalness={0.85} roughness={0.25} />
            </mesh>
          </RigidBody>
          {/* Horizontal Wind Tunnel Test Section */}
          <mesh position={[0, 3.1, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[1.45, 1.45, 10.5, 24]} />
            <meshStandardMaterial color="#334155" metalness={0.9} roughness={0.2} transparent opacity={0.75} />
          </mesh>
          {/* Glowing Shockwave Mach Rings inside Tunnel */}
          {[-3.2, -1.0, 1.2, 3.4].map((tz, ti) => (
            <mesh key={`mach-ring-${ti}`} position={[0, 3.1, tz]}>
              <torusGeometry args={[1.32, 0.05, 10, 28]} />
              <meshBasicMaterial color={ti % 2 === 0 ? '#38bdf8' : '#f97316'} />
            </mesh>
          ))}
          <Text position={[0, 5.4, 0]} rotation={[0, -Math.PI / 2, 0]} fontSize={0.36} color="#f97316" fontWeight="bold" anchorX="center">
            TÚNEL AEROTERMODINÂMICO HIPERSÓNICO & ESCUDOS TÉRMICOS
          </Text>
        </group>
      </group>

      {/* ============================================================== */}
      {/* 5. ROOFTOP CLEANROOM HVAC, SOLAR ARRAYS & PERIMETER GUARDRAILS */}
      {/* Positioned clear of Staircase 2 & Level Skybridge (X = +11.5)  */}
      {/* ============================================================== */}
      <group position={[0, 18.5, 0]}>
        {[-18, 22].map((hx, hi) => (
          <group key={`hvac-${hi}`} position={[hx, 1.6, -4]}>
            <mesh castShadow>
              <boxGeometry args={[7.5, 3.2, 6]} />
              <meshStandardMaterial color="#94a3b8" metalness={0.7} />
            </mesh>
            {[-1.8, 1.8].map((cx, ci) => (
              <mesh key={`cowl-${ci}`} position={[cx, 1.9, 0]}>
                <cylinderGeometry args={[1.1, 1.3, 1.2, 16]} />
                <meshStandardMaterial color="#334155" metalness={0.9} />
              </mesh>
            ))}
          </group>
        ))}

        {[-9, -1].map((sx, si) => (
          <mesh key={`lab-solar-${si}`} position={[sx, 1.2, -3]} rotation={[0.25, 0, 0]} castShadow>
            <boxGeometry args={[6.2, 0.2, 11]} />
            <meshStandardMaterial color="#1e3a8a" metalness={0.85} roughness={0.15} />
          </mesh>
        ))}
      </group>
    </group>
  );
}
