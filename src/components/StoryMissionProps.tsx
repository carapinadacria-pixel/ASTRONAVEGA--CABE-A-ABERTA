import React, { useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import { Text } from '@react-three/drei';
import { Group, MathUtils, DoubleSide, MeshBasicMaterial } from 'three';
import { useGameStore, livePlayerMotion } from '../store';
import { AstronautCharacter } from './AstronautCharacter';
import { playSuitEquipSound } from '../audio';
import { getOfficialAngolaFlagTexture } from './AngolaFlag';
import { UI_TEXT } from '../utils/i18n';

export const SUIT_TABLE_POS: [number, number, number] = [248, 0.2, 12];
export const MOON_FLAG_SPOT_POS: [number, number, number] = [8, 0, 16];

export function HangarSuitTable() {
  const gameMode = useGameStore((s) => s.gameMode);
  const planetIndex = useGameStore((s) => s.planetIndex);
  const hasSpacesuit = useGameStore((s) => s.hasSpacesuit);
  const isNearSuitTable = useGameStore((s) => s.isNearSuitTable);
  const equipSpacesuitsAtTable = useGameStore((s) => s.equipSpacesuitsAtTable);
  const language = useGameStore((s) => s.language);
  const t = UI_TEXT[language];

  if (gameMode !== 'story' || planetIndex !== 0) return null;

  return (
    <group
      position={SUIT_TABLE_POS}
      onClick={(e) => {
        e.stopPropagation();
        if (!hasSpacesuit && isNearSuitTable) {
          playSuitEquipSound();
          equipSpacesuitsAtTable();
        }
      }}
    >
      {/* Solid Table Collider */}
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider args={[2.1, 0.55, 1.05]} position={[0, 0.55, 0]} />
      </RigidBody>

      {/* Floor Proximity Halo Ring when Suits still need to be equipped */}
      {!hasSpacesuit && (
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[2.6, 3.1, 36]} />
          <meshBasicMaterial color={isNearSuitTable ? '#22c55e' : '#eab308'} transparent opacity={0.85} />
        </mesh>
      )}

      {/* Heavy Aerospace Workbench Frame */}
      <mesh position={[0, 0.92, 0]} castShadow receiveShadow>
        <boxGeometry args={[4.1, 0.14, 1.95]} />
        <meshStandardMaterial color="#1e293b" metalness={0.85} roughness={0.28} />
      </mesh>
      <mesh position={[0, 1.0, 0]} receiveShadow>
        <boxGeometry args={[3.95, 0.03, 1.8]} />
        <meshStandardMaterial color="#334155" metalness={0.4} roughness={0.45} />
      </mesh>
      {/* Table Legs */}
      {[
        [-1.85, -0.78],
        [1.85, -0.78],
        [-1.85, 0.78],
        [1.85, 0.78],
      ].map(([lx, lz], idx) => (
        <mesh key={`suit-leg-${idx}`} position={[lx, 0.45, lz]} castShadow>
          <boxGeometry args={[0.14, 0.9, 0.14]} />
          <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.25} />
        </mesh>
      ))}
      {/* Front Illuminated GGPEN Trim */}
      <mesh position={[0, 0.92, 0.99]}>
        <boxGeometry args={[3.7, 0.06, 0.02]} />
        <meshBasicMaterial color={hasSpacesuit ? '#22c55e' : '#eab308'} />
      </mesh>

      {/* Two Complete EMU Spacesuits + Helmets laid neatly on the table until equipped */}
      {!hasSpacesuit &&
        [-1.05, 1.05].map((sx, idx) => (
          <group key={`table-suit-${idx}`} position={[sx, 1.03, 0]}>
            {/* Suit Torso Shell */}
            <mesh position={[0, 0.1, 0.1]} castShadow>
              <boxGeometry args={[0.62, 0.18, 0.76]} />
              <meshStandardMaterial color="#f8fafc" roughness={0.35} metalness={0.1} />
            </mesh>
            {/* Red Commander / Specialist Chest Stripe */}
            <mesh position={[0.18, 0.195, 0.12]}>
              <boxGeometry args={[0.12, 0.02, 0.56]} />
              <meshStandardMaterial color={idx === 0 ? '#dc2626' : '#0284c7'} roughness={0.35} />
            </mesh>
            {/* Folded Legs */}
            {[-0.14, 0.14].map((lx, li) => (
              <mesh key={`leg-${li}`} position={[lx, 0.07, 0.62]} castShadow>
                <cylinderGeometry args={[0.1, 0.1, 0.34, 12]} />
                <meshStandardMaterial color="#f1f5f9" roughness={0.4} />
              </mesh>
            ))}
            {/* EMU Helmet resting beside Suit Collar */}
            <group position={[0, 0.22, -0.44]}>
              <mesh castShadow>
                <sphereGeometry args={[0.21, 20, 20]} />
                <meshStandardMaterial color="#e0f2fe" transparent opacity={0.38} roughness={0.05} metalness={0.15} />
              </mesh>
              <mesh position={[0, 0, -0.05]}>
                <sphereGeometry args={[0.215, 18, 16, Math.PI * 0.75, Math.PI * 1.5, 0, Math.PI * 0.8]} />
                <meshStandardMaterial color="#f8fafc" roughness={0.3} />
              </mesh>
              <mesh position={[0, -0.15, 0]}>
                <cylinderGeometry args={[0.17, 0.19, 0.05, 18]} />
                <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.2} />
              </mesh>
            </group>
            {/* Nameplate */}
            <Text position={[0, 0.03, 0.85]} rotation={[-Math.PI / 2, 0, 0]} fontSize={0.11} color="#fde047" fontWeight="bold" anchorX="center">
              {idx === 0 ? t.suitCommanderPlate : t.suitSpecialistPlate}
            </Text>
          </group>
        ))}

      {/* Overhead Directional Signboard */}
      <group position={[0, 2.35, 0]}>
        <mesh position={[0, 0, -0.02]}>
          <planeGeometry args={[3.9, 0.72]} />
          <meshBasicMaterial color="#0f172a" side={DoubleSide} />
        </mesh>
        <Text position={[0, 0.12, 0.02]} fontSize={0.19} color={hasSpacesuit ? '#4ade80' : '#facc15'} fontWeight="bold" anchorX="center">
          {hasSpacesuit ? t.suitsEquippedSign : t.suitTableSign}
        </Text>
        <Text position={[0, -0.14, 0.02]} fontSize={0.13} color="#e2e8f0" anchorX="center">
          {hasSpacesuit
            ? t.walkToPadSign
            : isNearSuitTable
            ? t.pressFToEquipSign
            : t.approachToEquipSign}
        </Text>
      </group>
    </group>
  );
}

type CompanionAction = 'idle' | 'walk' | 'run' | 'jump' | 'swim' | 'treadWater' | 'climb' | 'passenger';

export function StoryCompanion() {
  const gameMode = useGameStore((s) => s.gameMode);
  const explorationWithCompanion = useGameStore((s) => s.explorationWithCompanion);
  const scene = useGameStore((s) => s.scene);
  const planetIndex = useGameStore((s) => s.planetIndex);
  const isLaunching = useGameStore((s) => s.isLaunching);
  const characterGender = useGameStore((s) => s.characterGender);
  const hasSpacesuit = useGameStore((s) => s.hasSpacesuit);
  const visorMode = useGameStore((s) => s.visorMode);
  const suitStyle = useGameStore((s) => s.suitStyle);

  const companionGender: 'male' | 'female' = characterGender === 'male' ? 'female' : 'male';
  const companionHasSuit = gameMode === 'story' ? hasSpacesuit : true;

  const groupRef = useRef<Group>(null);
  const bodyGroupRef = useRef<Group>(null);
  const posRef = useRef<[number, number, number]>(
    planetIndex === 0 ? [257.2, 0.27, 5.8] : [2.2, 0.0, 10.4]
  );
  const rotYRef = useRef<number>(0);
  const lastPlanetRef = useRef<number>(planetIndex);
  const prevDrivingCarIdRef = useRef<string | null>(null);
  const [actionName, setActionName] = useState<CompanionAction>('idle');
  const actionRef = useRef<CompanionAction>('idle');

  useFrame((_, rawDelta) => {
    if (!groupRef.current) return;
    const store = useGameStore.getState();
    if (store.gameMode === 'exploration' && !store.explorationWithCompanion) return;
    const delta = Math.min(rawDelta, 0.05);
    const pPos = store.playerPosition;

    // Reset companion position neatly beside player upon switching planets
    if (lastPlanetRef.current !== store.planetIndex) {
      lastPlanetRef.current = store.planetIndex;
      if (store.planetIndex === 0) {
        posRef.current = [pPos[0] + 2.1, Math.max(0.2, pPos[1] - 0.93), pPos[2] + 1.1];
      } else {
        posRef.current = [pPos[0] + 2.1, Math.max(0.0, pPos[1] - 0.93), pPos[2] + 0.8];
      }
    }

    const activeCarId = store.drivingCarId;

    // 1. PASSENGER SEAT MODE: When the player drives any vehicle, companion sits right next to them in the front-right passenger seat!
    if (activeCarId) {
      const car = store.carStates[activeCarId];
      if (car) {
        prevDrivingCarIdRef.current = activeCarId;
        const cosR = Math.cos(car.rot);
        const sinR = Math.sin(car.rot);
        const seatYOffset =
          car.type === 'supercar'
            ? 0.14
            : car.type === 'suv'
            ? 0.21
            : 0.17;
        const passLocalX = -0.38;
        const passLocalZ = -0.14;
        const seatWorldX = car.x + passLocalX * cosR + passLocalZ * sinR;
        const seatWorldY = car.y + seatYOffset;
        const seatWorldZ = car.z - passLocalX * sinR + passLocalZ * cosR;

        posRef.current[0] = seatWorldX;
        posRef.current[1] = seatWorldY;
        posRef.current[2] = seatWorldZ;
        rotYRef.current = car.rot;

        groupRef.current.position.set(seatWorldX, seatWorldY, seatWorldZ);
        groupRef.current.rotation.set(0, car.rot, 0);
        groupRef.current.scale.set(0.76, 0.76, 0.76);
        groupRef.current.updateMatrixWorld(true);

        if (bodyGroupRef.current) {
          bodyGroupRef.current.position.set(0, 0, 0);
          bodyGroupRef.current.rotation.set(0, 0, 0);
        }

        if (actionRef.current !== 'passenger') {
          actionRef.current = 'passenger';
          setActionName('passenger');
        }
        return;
      }
    }

    // Just exited a vehicle: step out cleanly beside the right passenger door
    if (prevDrivingCarIdRef.current && !activeCarId) {
      const exitedCar = store.carStates[prevDrivingCarIdRef.current];
      if (exitedCar) {
        const exitX = exitedCar.x - Math.cos(exitedCar.rot) * 2.15;
        const exitZ = exitedCar.z + Math.sin(exitedCar.rot) * 2.15;
        posRef.current = [exitX, Math.max(0.2, exitedCar.y + 0.1), exitZ];
      }
      prevDrivingCarIdRef.current = null;
    }

    // Ensure standard 1:1 scale on foot / in water
    groupRef.current.scale.set(1, 1, 1);

    // 2. ON FOOT / WATER / LADDER / JUMPING SYNCHRONIZED MOVEMENT
    let targetX = pPos[0] + 2.05;
    let targetZ = pPos[2] + 1.15;

    if (livePlayerMotion.action === 'climb') {
      targetX = pPos[0] + 1.05;
      targetZ = pPos[2] - 0.1;
    } else if (
      store.gameMode === 'story' &&
      store.planetIndex === 0 &&
      store.storyStep === 'hangar_suit_up' &&
      store.isNearSuitTable
    ) {
      targetX = SUIT_TABLE_POS[0] + 1.35;
      targetZ = SUIT_TABLE_POS[2] + 2.1;
    }

    const isAirWaterOrClimb =
      livePlayerMotion.isJumping ||
      livePlayerMotion.inWater ||
      livePlayerMotion.deepWater ||
      livePlayerMotion.action === 'climb';

    const targetY = isAirWaterOrClimb
      ? pPos[1] - 0.93
      : Math.max(store.planetIndex === 0 ? 0.2 : 0.0, pPos[1] - 0.93);

    const dx = targetX - posRef.current[0];
    const dz = targetZ - posRef.current[2];
    const dist = Math.hypot(dx, dz);

    let nextAct: CompanionAction = 'idle';

    if (dist > 0.35) {
      const baseFollowSpeed = dist > 5.5 ? 11.5 : dist > 1.8 ? 6.2 : 3.6;
      const moveSpeed = livePlayerMotion.deepWater
        ? Math.max(4.4, livePlayerMotion.speed * 1.05)
        : livePlayerMotion.action === 'run'
        ? Math.max(baseFollowSpeed, livePlayerMotion.speed * 0.95)
        : baseFollowSpeed;

      const step = Math.min(dist, moveSpeed * delta);
      posRef.current[0] += (dx / dist) * step;
      posRef.current[2] += (dz / dist) * step;

      if (livePlayerMotion.action === 'climb') {
        nextAct = 'climb';
      } else if (livePlayerMotion.deepWater) {
        nextAct = 'swim';
      } else if (livePlayerMotion.isJumping) {
        nextAct = 'jump';
      } else {
        nextAct = moveSpeed > 7.2 || livePlayerMotion.action === 'run' ? 'run' : 'walk';
      }

      const targetYaw =
        livePlayerMotion.action === 'climb' ? livePlayerMotion.yaw : Math.atan2(dx, dz);
      let diff = targetYaw - rotYRef.current;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;
      rotYRef.current += diff * (1 - Math.exp(-10 * delta));
    } else {
      if (livePlayerMotion.action === 'climb') {
        nextAct = 'climb';
      } else if (livePlayerMotion.deepWater) {
        nextAct = livePlayerMotion.action === 'swim' ? 'swim' : 'treadWater';
      } else if (livePlayerMotion.isJumping) {
        nextAct = 'jump';
      } else {
        nextAct = 'idle';
      }

      // Gently face same focus direction (ladder, suit table, moon flag spot, or player yaw)
      if (
        livePlayerMotion.action === 'climb' ||
        livePlayerMotion.deepWater ||
        livePlayerMotion.isJumping
      ) {
        let diff = livePlayerMotion.yaw - rotYRef.current;
        while (diff < -Math.PI) diff += Math.PI * 2;
        while (diff > Math.PI) diff -= Math.PI * 2;
        rotYRef.current += diff * (1 - Math.exp(-8 * delta));
      } else {
        const lookX =
          store.gameMode === 'story' && store.planetIndex === 0 && store.storyStep === 'hangar_suit_up'
            ? SUIT_TABLE_POS[0] - posRef.current[0]
            : store.gameMode === 'story' && store.planetIndex === 1 && !store.isFlagPlantedOnMoon
            ? MOON_FLAG_SPOT_POS[0] - posRef.current[0]
            : pPos[0] - posRef.current[0];
        const lookZ =
          store.gameMode === 'story' && store.planetIndex === 0 && store.storyStep === 'hangar_suit_up'
            ? SUIT_TABLE_POS[2] - posRef.current[2]
            : store.gameMode === 'story' && store.planetIndex === 1 && !store.isFlagPlantedOnMoon
            ? MOON_FLAG_SPOT_POS[2] - posRef.current[2]
            : pPos[2] - posRef.current[2];
        if (Math.hypot(lookX, lookZ) > 0.2) {
          const targetYaw = Math.atan2(lookX, lookZ);
          let diff = targetYaw - rotYRef.current;
          while (diff < -Math.PI) diff += Math.PI * 2;
          while (diff > Math.PI) diff -= Math.PI * 2;
          rotYRef.current += diff * (1 - Math.exp(-6 * delta));
        }
      }
    }

    const yFollowRate = isAirWaterOrClimb ? 22 : 12;
    posRef.current[1] = MathUtils.damp(posRef.current[1], targetY, yFollowRate, delta);

    groupRef.current.position.set(posRef.current[0], posRef.current[1], posRef.current[2]);
    groupRef.current.rotation.set(0, rotYRef.current, 0);

    // Sync inner body pitch & vertical buoyancy offset (so swimming strokes & treading water match player)
    if (bodyGroupRef.current) {
      const targetBodyPitch =
        nextAct === 'swim'
          ? 1.32
          : nextAct === 'treadWater'
          ? livePlayerMotion.bodyPitch
          : 0;
      const targetBodyY =
        nextAct === 'swim' || nextAct === 'treadWater' ? livePlayerMotion.bodyYOffset : 0;
      const targetBodyZ = nextAct === 'swim' ? 0.45 : nextAct === 'climb' ? 0.08 : 0;

      bodyGroupRef.current.rotation.x = MathUtils.damp(
        bodyGroupRef.current.rotation.x,
        targetBodyPitch,
        8.0,
        delta
      );
      bodyGroupRef.current.position.y = MathUtils.damp(
        bodyGroupRef.current.position.y,
        targetBodyY,
        8.0,
        delta
      );
      bodyGroupRef.current.position.z = MathUtils.damp(
        bodyGroupRef.current.position.z,
        targetBodyZ,
        8.0,
        delta
      );
    }

    if (nextAct !== actionRef.current) {
      actionRef.current = nextAct;
      setActionName(nextAct);
    }
  });

  if (scene !== 'surface' || isLaunching || (gameMode === 'exploration' && !explorationWithCompanion)) return null;

  return (
    <group ref={groupRef} position={posRef.current}>
      <group ref={bodyGroupRef}>
        <AstronautCharacter
          key={`companion-${companionGender}-${companionHasSuit}-${suitStyle}`}
          gender={companionGender}
          visorMode={visorMode}
          suitStyle={suitStyle}
          actionName={actionName}
          speed={actionName === 'swim' ? 2.8 : actionName === 'run' ? 16.0 : 8.5}
          isJumping={actionName === 'jump'}
          hasSpacesuit={companionHasSuit}
          carryingFlag={false}
        />
      </group>
    </group>
  );
}

export function MoonFlagMissionProp() {
  const gameMode = useGameStore((s) => s.gameMode);
  const planetIndex = useGameStore((s) => s.planetIndex);
  const isFlagPlantedOnMoon = useGameStore((s) => s.isFlagPlantedOnMoon);
  const isNearFlagSpot = useGameStore((s) => s.isNearFlagSpot);
  const plantAngolaFlagOnMoon = useGameStore((s) => s.plantAngolaFlagOnMoon);
  const language = useGameStore((s) => s.language);
  const t = UI_TEXT[language];
  const ringRef = useRef<Group>(null);
  const angolaTex = useMemo(() => getOfficialAngolaFlagTexture(), []);

  useFrame((state) => {
    if (ringRef.current && !isFlagPlantedOnMoon) {
      const s = 1 + Math.sin(state.clock.elapsedTime * 3.2) * 0.08;
      ringRef.current.scale.set(s, 1, s);
    }
  });

  if (gameMode !== 'story' || planetIndex !== 1) return null;

  return (
    <group position={MOON_FLAG_SPOT_POS}>
      {/* Lunar Anchor Socket Base bolted into Regolith */}
      <mesh position={[0, 0.08, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.42, 0.56, 0.18, 24]} />
        <meshStandardMaterial color="#334155" metalness={0.85} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.2, 0]}>
        <cylinderGeometry args={[0.14, 0.18, 0.14, 16]} />
        <meshStandardMaterial color="#eab308" metalness={0.9} roughness={0.2} />
      </mesh>

      {!isFlagPlantedOnMoon ? (
        <>
          {/* Target Marker Ring on Lunar Surface */}
          <group ref={ringRef}>
            <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[1.25, 1.55, 36]} />
              <meshBasicMaterial color={isNearFlagSpot ? '#22c55e' : '#eab308'} transparent opacity={0.9} />
            </mesh>
            <mesh position={[0, 1.9, 0]}>
              <cylinderGeometry args={[0.015, 0.015, 3.4, 8]} />
              <meshBasicMaterial color={isNearFlagSpot ? '#22c55e' : '#facc15'} transparent opacity={0.45} />
            </mesh>
          </group>

          <group position={[0, 2.5, 0]}>
            <mesh position={[0, 0, -0.02]}>
              <planeGeometry args={[3.9, 0.78]} />
              <meshBasicMaterial color="#090d16" side={DoubleSide} />
            </mesh>
            <Text position={[0, 0.14, 0.02]} fontSize={0.2} color={isNearFlagSpot ? '#4ade80' : '#facc15'} fontWeight="bold" anchorX="center">
              {t.flagStandSign}
            </Text>
            <Text position={[0, -0.14, 0.02]} fontSize={0.14} color="#e2e8f0" anchorX="center">
              {isNearFlagSpot ? t.pressFToPlantSign : t.approachToPlantSign}
            </Text>
          </group>

          {/* Clickable Hit Target */}
          <mesh
            position={[0, 1.0, 0]}
            visible={false}
            onClick={(e) => {
              e.stopPropagation();
              if (isNearFlagSpot) {
                plantAngolaFlagOnMoon();
              }
            }}
          >
            <cylinderGeometry args={[1.4, 1.4, 2.2, 12]} />
            <meshBasicMaterial transparent opacity={0} />
          </mesh>
        </>
      ) : (
        /* PERMANENT PLANTED ANGOLA FLAG STAND ON THE MOON */
        <group>
          {/* Tripod Anchor Stabilizer Struts */}
          {[0, (Math.PI * 2) / 3, (Math.PI * 4) / 3].map((ang, i) => (
            <mesh
              key={`flag-strut-${i}`}
              position={[Math.cos(ang) * 0.28, 0.22, Math.sin(ang) * 0.28]}
              rotation={[Math.sin(ang) * 0.55, 0, -Math.cos(ang) * 0.55]}
              castShadow
            >
              <cylinderGeometry args={[0.025, 0.032, 0.52, 8]} />
              <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.2} />
            </mesh>
          ))}

          {/* Vertical Brushed-Titanium Pole */}
          <mesh position={[0, 1.65, 0]} castShadow>
            <cylinderGeometry args={[0.035, 0.042, 3.2, 16]} />
            <meshStandardMaterial color="#e2e8f0" metalness={0.92} roughness={0.18} />
          </mesh>

          {/* Horizontal Lunar Tension Cross-Arm */}
          <mesh position={[0.92, 3.05, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.02, 0.02, 1.85, 12]} />
            <meshStandardMaterial color="#e2e8f0" metalness={0.92} roughness={0.18} />
          </mesh>

          {/* Golden Finial Sphere */}
          <mesh position={[0, 3.28, 0]}>
            <sphereGeometry args={[0.075, 16, 16]} />
            <meshStandardMaterial color="#eab308" metalness={0.95} roughness={0.15} />
          </mesh>

          {/* Official Flag of the Republic of Angola (high-res official /angola_flag.jpg emblem) */}
          {angolaTex && (
            <mesh position={[0.92, 2.45, 0]} castShadow>
              <planeGeometry args={[1.76, 1.16]} />
              <meshStandardMaterial map={angolaTex} side={DoubleSide} roughness={0.48} metalness={0.04} />
            </mesh>
          )}

          {/* Commemorative Plaque */}
          <group position={[0, 0.62, 0.55]}>
            <mesh>
              <boxGeometry args={[1.45, 0.38, 0.06]} />
              <meshStandardMaterial color="#0f172a" metalness={0.85} roughness={0.25} />
            </mesh>
            <Text position={[0, 0.06, 0.04]} fontSize={0.095} color="#facc15" fontWeight="bold" anchorX="center">
              {t.plaqueTitle}
            </Text>
            <Text position={[0, -0.07, 0.04]} fontSize={0.072} color="#f8fafc" anchorX="center">
              {t.plaqueSub}
            </Text>
          </group>

          <pointLight position={[0.8, 3.1, 1.2]} color="#fef08a" intensity={3.2} distance={10} />
        </group>
      )}
    </group>
  );
}

interface FloorArrowPoint {
  pos: [number, number, number];
  rotY: number;
}

function FloorChevronArrow({
  pos,
  rotY,
  index,
  color = '#facc15',
  scale = 1,
}: {
  pos: [number, number, number];
  rotY: number;
  index: number;
  color?: string;
  scale?: number;
}) {
  const grpRef = useRef<Group>(null);
  const mat1Ref = useRef<MeshBasicMaterial>(null);
  const mat2Ref = useRef<MeshBasicMaterial>(null);
  const mat3Ref = useRef<MeshBasicMaterial>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const wave = Math.max(0, Math.sin(t * 4.2 - index * 0.75));
    const opacity = 0.28 + wave * 0.72;
    if (grpRef.current) {
      grpRef.current.position.y = pos[1] + wave * 0.035;
    }
    if (mat1Ref.current) mat1Ref.current.opacity = opacity;
    if (mat2Ref.current) mat2Ref.current.opacity = opacity;
    if (mat3Ref.current) mat3Ref.current.opacity = opacity * 0.35;
  });

  return (
    <group ref={grpRef} position={pos} rotation={[0, rotY, 0]} scale={[scale, 1, scale]}>
      {/* Ground glowing pad */}
      <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.92, 20]} />
        <meshBasicMaterial ref={mat3Ref} color={color} transparent opacity={0.25} />
      </mesh>
      {/* Left & Right Chevron Wings pointing along +Z */}
      <mesh position={[-0.36, 0.02, -0.1]} rotation={[-Math.PI / 2, 0, -0.62]}>
        <planeGeometry args={[0.26, 0.96]} />
        <meshBasicMaterial ref={mat1Ref} color={color} transparent opacity={0.9} side={DoubleSide} />
      </mesh>
      <mesh position={[0.36, 0.02, -0.1]} rotation={[-Math.PI / 2, 0, 0.62]}>
        <planeGeometry args={[0.26, 0.96]} />
        <meshBasicMaterial ref={mat2Ref} color={color} transparent opacity={0.9} side={DoubleSide} />
      </mesh>
    </group>
  );
}

export function AnimatedMissionFloorArrows() {
  const gameMode = useGameStore((s) => s.gameMode);
  const scene = useGameStore((s) => s.scene);
  const planetIndex = useGameStore((s) => s.planetIndex);
  const storyStep = useGameStore((s) => s.storyStep);
  const hasSpacesuit = useGameStore((s) => s.hasSpacesuit);
  const isLaunching = useGameStore((s) => s.isLaunching);
  const isFlagPlantedOnMoon = useGameStore((s) => s.isFlagPlantedOnMoon);

  const arrows = useMemo<FloorArrowPoint[]>(() => {
    if (gameMode !== 'story' || scene !== 'surface' || isLaunching) return [];

    // 1. Earth Hangar Spawn -> Spacesuit Table [248, 0.2, 12]
    if (planetIndex === 0 && storyStep === 'hangar_suit_up' && !hasSpacesuit) {
      const yaw = Math.atan2(SUIT_TABLE_POS[0] - 255, SUIT_TABLE_POS[2] - 5);
      return [
        { pos: [253.5, 0.22, 6.5], rotY: yaw },
        { pos: [251.5, 0.22, 8.5], rotY: yaw },
        { pos: [249.6, 0.22, 10.4], rotY: yaw },
      ];
    }

    // 2. Earth Hangar / Suit Table -> Launch Pad (0, 0) along Crawlerway
    if (planetIndex === 0 && storyStep === 'walk_to_rocket') {
      const exitYaw = Math.atan2(-1, 0); // -PI/2 (-X West toward Pad)
      const list: FloorArrowPoint[] = [
        { pos: [236, 0.17, 7], rotY: Math.atan2(196 - 236, -7) },
        { pos: [216, 0.17, 3.2], rotY: Math.atan2(196 - 216, -3.2) },
        { pos: [196, 0.17, 0], rotY: exitYaw },
      ];
      for (let x = 174; x >= 20; x -= 22) {
        list.push({ pos: [x, 0.17, 0], rotY: exitYaw });
      }
      return list;
    }

    // 3. Moon Landing Zone [0, 0.08, 9.5] -> Angola Flag Stand [8, 0, 16]
    if (planetIndex === 1 && storyStep === 'moon_exit_flag' && !isFlagPlantedOnMoon) {
      const yaw = Math.atan2(MOON_FLAG_SPOT_POS[0] - 0, MOON_FLAG_SPOT_POS[2] - 9.5);
      return [
        { pos: [1.8, 0.08, 11.0], rotY: yaw },
        { pos: [3.8, 0.08, 12.6], rotY: yaw },
        { pos: [5.8, 0.08, 14.3], rotY: yaw },
      ];
    }

    return [];
  }, [gameMode, scene, planetIndex, storyStep, hasSpacesuit, isLaunching, isFlagPlantedOnMoon]);

  if (arrows.length === 0) return null;

  const arrowColor = storyStep === 'walk_to_rocket' ? '#38bdf8' : '#facc15';
  const arrowScale = storyStep === 'walk_to_rocket' ? 1.45 : 0.92;

  return (
    <group>
      {arrows.map((a, idx) => (
        <FloorChevronArrow
          key={`mission-arrow-${storyStep}-${idx}`}
          pos={a.pos}
          rotY={a.rotY}
          index={idx}
          color={arrowColor}
          scale={arrowScale}
        />
      ))}
    </group>
  );
}

